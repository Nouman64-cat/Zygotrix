"""
Zygotrix AI Chat Service.

Handles chat orchestration, context building, and response generation.
"""

import logging
import json
import asyncio
from typing import Optional, AsyncGenerator, Dict, Any, Tuple
from fastapi import HTTPException

from ...schema.zygotrix_ai import (
    ChatRequest, ChatResponse, MessageRole, MessageMetadata,
    ConversationCreate, ConversationUpdate, ChatPreferences
)
from ...services.zygotrix_ai_service import (
    ConversationService, MessageService,
)
from ...schema.auth import UserProfile
from ...prompt_engineering.prompts import (
    get_zigi_system_prompt, get_simulation_tool_prompt, get_zigi_prompt_with_tools
)

from ..chatbot.rate_limiting_service import get_rate_limiter
from ..chatbot.token_analytics_service import get_token_analytics_service
from ..chatbot.rag_service import get_rag_service
from ..chatbot.traits_enrichment_service import get_traits_service
from ..chatbot.response_cache_service import get_response_cache
from .claude_service import get_zygotrix_claude_service
from app.core.performance import PerformanceTracker

logger = logging.getLogger(__name__)


class ZygotrixChatService:
    """Service for handling Zygotrix AI chat operations."""

    def __init__(self):
        self.claude_service = get_zygotrix_claude_service()
        self.rate_limiter = get_rate_limiter()
        self.token_analytics = get_token_analytics_service()
        self.rag_service = get_rag_service()
        self.traits_service = get_traits_service()
        self.response_cache = get_response_cache()

    async def process_chat_request(
        self,
        chat_request: ChatRequest,
        current_user: UserProfile,
    ) -> Tuple[Any, Optional[str], Optional[str]]:
        """
        Process a chat request and return response data.

        Returns:
            Tuple of (response, conversation_id, message_id) where response is either
            StreamingResponse or ChatResponse
        """
        # Initialize performance tracking for this request
        perf = PerformanceTracker("chat_request")
        perf.start("total")
        
        user_id = current_user.id
        
        # DEBUG: Log enabled_tools to trace web search routing
        logger.info(f"🔧 DEBUG enabled_tools received: {chat_request.enabled_tools}")
        
        # DEBUG: Log all available attributes on current_user to trace user_name issue
        logger.info(f"🔍 DEBUG user_name trace - user_id: {user_id}")
        logger.info(f"🔍 DEBUG current_user type: {type(current_user)}")
        logger.info(f"🔍 DEBUG current_user.__dict__: {getattr(current_user, '__dict__', 'N/A')}")
        logger.info(f"🔍 DEBUG hasattr(current_user, 'full_name'): {hasattr(current_user, 'full_name')}")
        logger.info(f"🔍 DEBUG hasattr(current_user, 'name'): {hasattr(current_user, 'name')}")
        logger.info(f"🔍 DEBUG current_user.full_name: {getattr(current_user, 'full_name', 'ATTR_NOT_FOUND')}")
        logger.info(f"🔍 DEBUG current_user.email: {getattr(current_user, 'email', 'ATTR_NOT_FOUND')}")
        
        user_name = current_user.full_name if hasattr(current_user, 'full_name') else None
        logger.info(f"🔍 DEBUG final user_name value: '{user_name}'")
        
        is_admin = hasattr(current_user, 'user_role') and current_user.user_role in ["admin", "super_admin"]

        # Check rate limit
        perf.start("rate_limit_check")
        allowed, usage = self.rate_limiter.check_limit(user_id, is_admin=is_admin)
        perf.stop("rate_limit_check")
        
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "Rate limit exceeded. Please wait for the cooldown period.",
                    "tokens_used": usage.get("tokens_used", 0),
                    "tokens_remaining": 0,
                    "reset_time": usage.get("reset_time"),
                    "cooldown_active": True
                }
            )

        # Get or create conversation
        perf.start("conversation_lookup")
        conversation = await self._get_or_create_conversation(chat_request, user_id)
        perf.stop("conversation_lookup")

        # Get conversation settings
        perf.start("token_budgeting")
        conv_settings = conversation.settings
        model = chat_request.model or conv_settings.model
        temperature = chat_request.temperature if chat_request.temperature is not None else conv_settings.temperature
        default_max_tokens = chat_request.max_tokens or conv_settings.max_tokens
        
        # Apply smart token budgeting for faster responses on simple queries
        max_tokens = self.claude_service.calculate_smart_max_tokens(
            message=chat_request.message,
            history_length=conversation.message_count,
            default_max_tokens=default_max_tokens
        )
        perf.stop("token_budgeting")

        # Fetch user preferences for response customization
        perf.start("preferences_fetch")
        user_preferences = self._get_user_preferences(user_id)
        perf.stop("preferences_fetch")

        # Handle file attachments FIRST (for GWAS datasets)
        # This uploads files to cloud storage before we save the message
        # GWAS processing only happens if 'gwas_analysis' tool is enabled
        perf.start("file_attachments")
        upload_results = await self._handle_file_attachments(
            chat_request.attachments,
            chat_request.message,
            user_id,
            enabled_tools=chat_request.enabled_tools or []
        )
        perf.stop("file_attachments")

        # Strip file content from attachments before storing in MongoDB
        # MongoDB has a 16MB document limit, so we only store metadata
        safe_attachments = []
        if chat_request.attachments:
            for a in chat_request.attachments:
                # Create a copy without the large content field
                safe_attachment = {
                    "id": a.id,
                    "type": a.type,
                    "name": a.name,
                    "mime_type": a.mime_type,
                    "size_bytes": a.size_bytes,
                    # Don't include 'content' - it could be 100s of MBs!
                    # The file has already been uploaded to cloud storage
                }
                safe_attachments.append(safe_attachment)

        # Save user message (with metadata only, no file content)
        perf.start("save_user_message")
        user_message = MessageService.create_message(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=chat_request.message,
            parent_message_id=chat_request.parent_message_id,
            attachments=safe_attachments
        )
        perf.stop("save_user_message")

        # Analyze message for preference signals (asynchronous, non-blocking)
        asyncio.create_task(self._analyze_and_update_preferences(
            user_id=user_id,
            message=chat_request.message,
            model=model
        ))

        # Build context (include upload results if any)
        perf.start("context_building")
        combined_context = await self._build_context(
            chat_request.message,
            user_id=user_id,
            user_name=user_name
        )
        perf.stop("context_building")

        # Add upload results to context
        if upload_results:
            combined_context = f"{upload_results}\n\n{combined_context}" if combined_context else upload_results

        # Get conversation history and build Claude messages
        perf.start("message_formatting")
        claude_messages = self._build_claude_messages(
            conversation.id,
            conv_settings.context_window_messages,
            chat_request.message,
            combined_context,
            attachments=chat_request.attachments
        )

        # Get system prompt (with user preferences)
        system_prompt = self._get_system_prompt(chat_request.page_context, combined_context, user_preferences)
        perf.stop("message_formatting")

        # Stop total timer before response generation (streaming continues after)
        perf.stop("total")
        
        # Log performance breakdown for non-streaming (streaming logs on completion)
        if not chat_request.stream:
            perf.log_summary()
            logger.info(f"📊 Pre-LLM overhead: {perf.get_total_ms():.0f}ms | Model: {model} | Tokens budget: {max_tokens}")

        # Check if Deep Research tool is enabled
        deep_research_enabled = chat_request.enabled_tools and 'deep_research' in chat_request.enabled_tools
        
        if deep_research_enabled:
            logger.info(f"🔬 Deep Research enabled - routing to LangGraph workflow")
            return await self._handle_deep_research_chat(
                chat_request, conversation, user_message, user_id, user_name
            )
        
        # Check if Web Search tool is enabled (PRO feature)
        web_search_enabled = chat_request.enabled_tools and 'web_search' in chat_request.enabled_tools
        
        if web_search_enabled:
            logger.info(f"🌐 Web Search enabled - routing to web search service")
            return await self._handle_web_search_chat(
                chat_request, conversation, user_message, user_id, user_name
            )

        # Check if Scholar Mode is enabled (PRO feature)
        scholar_mode_enabled = chat_request.enabled_tools and 'scholar_mode' in chat_request.enabled_tools
        
        if scholar_mode_enabled:
            logger.info(f"🎓 Scholar Mode enabled - routing to scholar service")
            return await self._handle_scholar_mode_chat(
                chat_request, conversation, user_message, user_id, user_name
            )

        # Handle streaming vs non-streaming
        # Force non-streaming if tools are enabled (tools are not supported in streaming mode yet)
        tools_enabled = bool(chat_request.enabled_tools and len(chat_request.enabled_tools) > 0)
        
        if chat_request.stream and not tools_enabled:
            return await self._handle_streaming_chat(
                claude_messages, system_prompt, model, max_tokens, temperature,
                conversation, user_message, chat_request, user_id, user_name
            )
        else:
            if tools_enabled and chat_request.stream:
                logger.info("🔧 Tools enabled, forcing NON-STREAMING mode for tool execution")
                
            return await self._handle_non_streaming_chat(
                claude_messages, system_prompt, model, max_tokens, temperature,
                conversation, user_message, chat_request, user_id, user_name
            )

    async def regenerate_message_response(
        self,
        conversation_id: str,
        message_id: str,
        current_user: UserProfile,
    ) -> ChatResponse:
        """Regenerate a response for a specific message."""
        user_id = current_user.id
        user_name = current_user.full_name if hasattr(current_user, 'full_name') else None

        conversation = ConversationService.get_conversation(conversation_id, user_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get the original message
        original_message = MessageService.get_message(message_id)
        if not original_message or original_message.role != MessageRole.ASSISTANT:
            raise HTTPException(status_code=400, detail="Can only regenerate assistant messages")

        # Get the user message that preceded this response
        user_message = self._find_preceding_user_message(conversation_id, message_id)
        if not user_message:
            raise HTTPException(status_code=400, detail="Could not find preceding user message")

        # Get settings
        conv_settings = conversation.settings
        model = conv_settings.model
        temperature = conv_settings.temperature
        max_tokens = conv_settings.max_tokens

        # Build context and messages
        combined_context = await self._build_context(
            user_message.content,
            user_id=user_id,
            user_name=user_name
        )
        claude_messages = self._build_claude_messages_for_regeneration(
            conversation_id, user_message, combined_context
        )

        system_prompt = get_zigi_system_prompt()

        # Generate new response
        content, metadata = await self.claude_service.generate_response(
            claude_messages, system_prompt, model, max_tokens, temperature
        )

        msg_metadata = MessageMetadata(
            input_tokens=metadata.get("input_tokens", 0),
            output_tokens=metadata.get("output_tokens", 0),
            total_tokens=metadata.get("total_tokens", 0),
            model=model,
            widget_type=metadata.get("widget_type"),
            breeding_data=metadata.get("breeding_data"),
            dna_rna_data=metadata.get("dna_rna_data"),
            gwas_data=metadata.get("gwas_data"),
        )

        # Create as a new version/sibling
        new_message = MessageService.update_message(
            message_id,
            content,
            create_new_version=True
        )

        # Update with metadata
        from ...services.zygotrix_ai_service import get_messages_collection
        collection = get_messages_collection()
        if collection and new_message:
            collection.update_one(
                {"id": new_message.id},
                {"$set": {"metadata": msg_metadata.model_dump()}}
            )

        # Record token usage
        self._record_token_usage(
            user_id, user_name, metadata, user_message.content, model
        )

        return ChatResponse(
            conversation_id=conversation_id,
            message=new_message,
            conversation_title=conversation.title,
            usage=msg_metadata,
        )

    # =========================================================================
    # PRIVATE HELPER METHODS
    # =========================================================================

    def _get_user_preferences(self, user_id: str) -> Optional[ChatPreferences]:
        """
        Fetch user's AI behavior preferences.

        Args:
            user_id: User's ID

        Returns:
            ChatPreferences or None if not found
        """
        try:
            from ..auth.user_service import get_user_service
            user_service = get_user_service()
            preferences = user_service.get_user_preferences(user_id)
            logger.info(f"📋 Fetched preferences for user {user_id[:8]}...: style={preferences.communication_style}, length={preferences.answer_length}, auto_learn={preferences.auto_learn}")
            return preferences
        except Exception as e:
            logger.warning(f"Failed to fetch user preferences for {user_id}: {e}")
            return None

    async def _handle_file_attachments(
        self,
        attachments: Optional[list],
        message: str,
        user_id: str,
        enabled_tools: Optional[list] = None
    ) -> Optional[str]:
        """
        Automatically handle file attachments (e.g., GWAS datasets).

        For genomic files (.vcf, .bed, etc.), uploads them and runs GWAS analysis
        ONLY if the 'gwas_analysis' tool is explicitly enabled.

        Args:
            attachments: List of file attachments
            message: User's message (to extract trait name)
            user_id: User ID
            enabled_tools: List of enabled tool names (e.g., ['gwas_analysis'])

        Returns:
            Summary text about uploaded files, or None if no files
        """
        if not attachments or len(attachments) == 0:
            return None

        # Check if GWAS analysis tool is enabled
        gwas_enabled = enabled_tools and 'gwas_analysis' in enabled_tools

        # Import GWAS upload function
        from ...chatbot_tools.gwas_tools import upload_gwas_dataset

        results = []

        for attachment in attachments:
            filename = attachment.name.lower()

            # Check if it's a genomic file
            is_genomic_file = any(
                filename.endswith(ext)
                for ext in ['.vcf', '.vcf.gz', '.bed', '.bim', '.fam', '.csv', '.tsv', '.json']
            )

            if not is_genomic_file:
                continue

            # If GWAS tool is not enabled, inform the user but don't process the file
            if not gwas_enabled:
                results.append(
                    f"[SYSTEM INSTRUCTION: The user has attached a genomic file but has NOT enabled the GWAS Analysis tool. "
                    f"You MUST inform them that they need to enable the tool before you can run GWAS analysis. "
                    f"Do NOT attempt to run GWAS analysis. Just acknowledge their request and guide them to enable the tool.]\n\n"
                    f"📎 **Genomic file detected:** {attachment.name}\n"
                    f"⚠️ **GWAS Analysis tool is not enabled.** To run GWAS analysis on this file:\n"
                    f"1. Click the **Tools** button (slider icon) in the chat input\n"
                    f"2. Enable **🧬 GWAS Analysis**\n"
                    f"3. Send your message again\n\n"
                    f"The tool allows me to analyze genetic variants and identify associations with traits."
                )
                logger.info(f"📎 Genomic file attached but GWAS not enabled: {attachment.name}")
                continue

            # Auto-detect file format
            if filename.endswith('.vcf') or filename.endswith('.vcf.gz'):
                file_format = 'vcf'
            elif filename.endswith('.bed'):
                file_format = 'plink'
            else:
                file_format = 'custom'

            # Try to extract trait name from message
            trait_name = self._extract_trait_name(message)

            # Generate dataset name from filename
            dataset_name = filename.replace('.vcf.gz', '').replace('.vcf', '').replace('.bed', '')

            logger.info(f"📤 Auto-uploading genomic file: {attachment.name} ({file_format})")

            try:
                # Import required modules for async upload
                from io import BytesIO
                from fastapi import UploadFile
                from ...services.gwas_dataset_service import get_gwas_dataset_service
                from ...schema.gwas import GwasFileFormat
                import base64

                # Decode base64 content
                try:
                    file_bytes = base64.b64decode(attachment.content)
                except Exception:
                    if isinstance(attachment.content, str):
                        file_bytes = attachment.content.encode()
                    else:
                        file_bytes = attachment.content

                # Create UploadFile object
                file_obj = UploadFile(
                    filename=attachment.name,
                    file=BytesIO(file_bytes)
                )

                # Call async upload function directly (we're already in async context)
                dataset_service = get_gwas_dataset_service()
                dataset = await dataset_service.upload_and_parse_dataset(
                    user_id=user_id,
                    file=file_obj,
                    name=dataset_name,
                    description=f"Uploaded via chat: {message[:100]}",
                    file_format=GwasFileFormat(file_format),
                    trait_type="quantitative",
                    trait_name=trait_name,
                )

                # Format success result
                upload_result = {
                    "success": True,
                    "dataset_id": dataset.id,
                    "dataset_info": {
                        "name": dataset.name,
                        "num_snps": dataset.num_snps,
                        "num_samples": dataset.num_samples,
                        "trait_name": dataset.trait_name,
                    }
                }

                if upload_result.get("success"):
                    dataset_info = upload_result.get("dataset_info", {})
                    result_text = f"""✅ Dataset '{dataset_info.get('name')}' uploaded successfully!
📊 File: {attachment.name}
📈 SNPs: {dataset_info.get('num_snps', 'N/A'):,}
👥 Samples: {dataset_info.get('num_samples', 'N/A'):,}
🔬 Trait: {dataset_info.get('trait_name', 'N/A')}
🆔 Dataset ID: {upload_result.get('dataset_id')}

🎯 ACTION REQUIRED: Now run GWAS analysis on this dataset using the run_gwas_analysis tool.
Use these parameters:
- dataset_id: "{upload_result.get('dataset_id')}"
- user_id: "{user_id}"
- phenotype_column: "{dataset_info.get('trait_name', 'phenotype')}"
- analysis_type: "linear" (or "logistic" if binary trait)

The C++ GWAS engine will analyze all {dataset_info.get('num_snps', 0):,} SNPs and generate:
- Manhattan plot showing genome-wide significant associations
- Q-Q plot for quality control
- Top associated SNPs with p-values and effect sizes
"""
                    results.append(result_text)
                    logger.info(f"✅ Successfully uploaded {attachment.name}")
                else:
                    error_msg = upload_result.get('message', 'Unknown error')
                    result_text = f"❌ Failed to upload {attachment.name}: {error_msg}"
                    results.append(result_text)
                    logger.error(f"❌ Upload failed for {attachment.name}: {error_msg}")

            except Exception as e:
                logger.error(f"Exception uploading {attachment.name}: {e}", exc_info=True)
                results.append(f"❌ Error uploading {attachment.name}: {str(e)}")

        if results:
            return "\n\n".join(results)

        return None

    def _extract_trait_name(self, message: str) -> str:
        """Extract trait name from user message."""
        message_lower = message.lower()

        # Common trait keywords
        traits = {
            'height': ['height', 'stature', 'tall'],
            'bmi': ['bmi', 'body mass index', 'weight'],
            'diabetes': ['diabetes', 'glucose', 'blood sugar'],
            'bp': ['blood pressure', 'hypertension'],
            'cholesterol': ['cholesterol', 'ldl', 'hdl'],
        }

        for trait, keywords in traits.items():
            if any(kw in message_lower for kw in keywords):
                return trait

        # Default
        return "unknown_trait"

    async def _analyze_and_update_preferences(
        self,
        user_id: str,
        message: str,
        model: str
    ):
        """
        Analyze user message for preference signals and update preferences.

        This runs asynchronously and non-blocking - errors are logged but don't affect the chat.

        Args:
            user_id: User's ID
            message: User's message content
            model: Claude model being used (from chatbot settings)
        """
        try:
            from .preference_detector import PreferenceDetector, calculate_preference_update
            from ..auth.user_service import get_user_service

            user_service = get_user_service()

            # Get current user preferences
            current_prefs = user_service.get_user_preferences(user_id)

            # Check if auto-learning is enabled
            auto_learn = getattr(current_prefs, 'auto_learn', True)
            if not auto_learn:
                logger.debug(f"Auto-learning disabled for user {user_id}, skipping preference detection")
                return

            # Get current preference scores
            current_scores = getattr(current_prefs, 'preference_scores', {}) or {}

            # Detect preference signals
            detector = PreferenceDetector(model=model, use_ai=True)
            signals = await detector.detect_preferences(message, confidence_threshold=0.7)

            # Only update if signals were detected
            if any(signals.values()):
                # Calculate updated scores and preferences
                updated_scores, updated_prefs = calculate_preference_update(signals, current_scores)

                # Prepare update payload
                from ...schema.auth import UserPreferencesUpdate
                update_payload = UserPreferencesUpdate(
                    communication_style=updated_prefs.communication_style,
                    answer_length=updated_prefs.answer_length,
                    teaching_aids=updated_prefs.teaching_aids,
                    visual_aids=updated_prefs.visual_aids,
                    auto_learn=auto_learn,  # Preserve auto_learn setting
                )

                # Update in database (with scores)
                from bson import ObjectId
                from ...services.common import get_users_collection
                collection = get_users_collection(required=True)

                prefs_dict = updated_prefs.model_dump()
                prefs_dict['preference_scores'] = updated_scores
                prefs_dict['auto_learn'] = auto_learn
                prefs_dict['updated_by'] = 'system'

                collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"preferences": prefs_dict}}
                )

                # Clear user service cache so API returns fresh data
                user_service._clear_user_cache(user_id)

                # Log the update
                detected_signals = [s for s, v in signals.items() if v]
                logger.info(f"✨ Auto-updated preferences for user {user_id} based on signals: {', '.join(detected_signals)}")

        except Exception as e:
            # Don't fail the chat if preference analysis fails
            logger.warning(f"Preference auto-update failed for user {user_id}: {e}")

    async def _get_or_create_conversation(self, chat_request: ChatRequest, user_id: str):
        """Get existing conversation or create a new one."""
        if chat_request.conversation_id:
            conversation = ConversationService.get_conversation(
                chat_request.conversation_id, user_id
            )
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            return conversation
        else:
            # Create new conversation
            conv_data = ConversationCreate(
                title=chat_request.message[:50] + ("..." if len(chat_request.message) > 50 else ""),
                page_context=chat_request.page_context,
            )
            return ConversationService.create_conversation(user_id, conv_data)

    async def _build_context(
        self,
        message: str,
        user_id: Optional[str] = None,
        user_name: Optional[str] = None
    ) -> str:
        """Build combined context from traits and RAG."""
        import os
        import time

        # Check if intelligent routing is enabled
        use_intelligent_routing = os.getenv("ENABLE_INTELLIGENT_ROUTING", "true").lower() == "true"

        if use_intelligent_routing:
            # Use intelligent routing to decide which data sources to use
            from ..chatbot.query_classifier import get_query_classifier, QueryType
            import logging

            ctx_logger = logging.getLogger(__name__)
            classifier = get_query_classifier()
            
            # Time the classification
            classify_start = time.perf_counter()
            query_type, confidence = await classifier.classify(message, user_id, user_name)
            classify_ms = (time.perf_counter() - classify_start) * 1000

            ctx_logger.info(
                f"🧠 Intelligent routing: {query_type.value} | "
                f"Confidence: {confidence:.2f} | "
                f"Classify time: {classify_ms:.1f}ms"
            )

            if query_type == QueryType.CONVERSATIONAL:
                # No context needed for conversational queries
                ctx_logger.debug("Routing: CONVERSATIONAL (no context)")
                return ""

            elif query_type == QueryType.KNOWLEDGE:
                # Only RAG context needed
                ctx_logger.debug("Routing: KNOWLEDGE (RAG only)")
                llama_context = await self.rag_service.retrieve_context(
                    message,
                    user_id=user_id,
                    user_name=user_name
                )
                return llama_context or ""

            elif query_type == QueryType.GENETICS_TOOLS:
                # Only traits context needed
                ctx_logger.debug("Routing: GENETICS_TOOLS (traits only)")
                traits_context = self.traits_service.get_traits_context(message)
                return traits_context

            else:  # HYBRID
                # Full context (both RAG and traits) - OPTIMIZED: Run in parallel
                ctx_logger.info("Routing: HYBRID (RAG + traits) - Starting parallel execution")
                hybrid_start = time.perf_counter()
                
                # Run traits lookup in thread pool (it's synchronous) and RAG lookup concurrently
                async def get_traits_async():
                    t_start = time.perf_counter()
                    result = await asyncio.get_event_loop().run_in_executor(
                        None, self.traits_service.get_traits_context, message
                    )
                    t_ms = (time.perf_counter() - t_start) * 1000
                    ctx_logger.info(f"  📋 Traits lookup complete: {t_ms:.0f}ms | Length: {len(result) if result else 0} chars")
                    return result
                
                async def get_rag_async():
                    r_start = time.perf_counter()
                    result = await self.rag_service.retrieve_context(
                        message,
                        user_id=user_id,
                        user_name=user_name
                    )
                    r_ms = (time.perf_counter() - r_start) * 1000
                    ctx_logger.info(f"  🔍 RAG lookup complete: {r_ms:.0f}ms | Length: {len(result) if result else 0} chars")
                    return result
                
                # Execute both in parallel for ~40-60% speedup
                traits_task = asyncio.create_task(get_traits_async())
                rag_task = asyncio.create_task(get_rag_async())
                
                traits_context, llama_context = await asyncio.gather(traits_task, rag_task)
                
                hybrid_ms = (time.perf_counter() - hybrid_start) * 1000
                ctx_logger.info(f"📊 HYBRID context complete: {hybrid_ms:.0f}ms total (parallel)")
                
                if llama_context:
                    return f"{traits_context}\n\n{llama_context}" if traits_context else llama_context
                return traits_context or ""
        else:
            # Traditional flow: always use both - OPTIMIZED: Run in parallel
            logger = logging.getLogger(__name__)
            logger.info("🔧 Zygotrix AI using traditional routing (parallel execution)")

            # Run traits lookup in thread pool (it's synchronous) and RAG lookup concurrently
            async def get_traits_async():
                return await asyncio.get_event_loop().run_in_executor(
                    None, self.traits_service.get_traits_context, message
                )
            
            # Execute both in parallel for ~40-60% speedup
            traits_task = asyncio.create_task(get_traits_async())
            rag_task = asyncio.create_task(
                self.rag_service.retrieve_context(
                    message,
                    user_id=user_id,
                    user_name=user_name
                )
            )
            
            traits_context, llama_context = await asyncio.gather(traits_task, rag_task)

            if llama_context:
                return f"{traits_context}\n\n{llama_context}" if traits_context else llama_context
            return traits_context or ""

    def _build_claude_messages(
        self,
        conversation_id: str,
        max_messages: int,
        current_message: str,
        combined_context: str,
        attachments: Optional[list] = None
    ) -> list:
        """Build message history for Claude, including file attachments."""
        history = MessageService.get_conversation_context(
            conversation_id,
            max_messages=max_messages
        )

        claude_messages = []
        for msg in history[:-1]:  # Exclude the just-added user message
            # Check if message has attachments
            if msg.get("attachments") and len(msg["attachments"]) > 0:
                # Include attachment info in message text for context
                content_with_attachments = msg["content"]
                content_with_attachments += "\n\n[Attachments: "
                content_with_attachments += ", ".join([att.get("name", "unknown") for att in msg["attachments"]])
                content_with_attachments += "]"
                claude_messages.append({"role": msg["role"], "content": content_with_attachments})
            else:
                claude_messages.append({"role": msg["role"], "content": msg["content"]})

        # Add current message with context and attachments
        current_content = current_message
        if combined_context:
            current_content = f"""Background information:
{combined_context}

Question: {current_message}"""

        # Note: File attachments are handled server-side automatically
        # and results are added to combined_context, so we don't include
        # the full file content here (would exceed token limits for large files)

        claude_messages.append({"role": "user", "content": current_content})
        return claude_messages

    def _build_claude_messages_for_regeneration(
        self,
        conversation_id: str,
        user_message,
        combined_context: str
    ) -> list:
        """Build message history for regeneration."""
        history = MessageService.get_conversation_context(conversation_id, max_messages=20)

        claude_messages = []
        for msg in history:
            if msg.get("content") == user_message.content:
                break
            claude_messages.append(msg)

        current_content = user_message.content
        if combined_context:
            current_content = f"""Background information:
{combined_context}

Question: {user_message.content}"""

        claude_messages.append({"role": "user", "content": current_content})
        return claude_messages

    def _get_system_prompt(
        self,
        page_context: Optional[str],
        combined_context: str,
        user_preferences: Optional[ChatPreferences] = None
    ) -> str:
        """
        Get appropriate system prompt based on context and user preferences.

        Args:
            page_context: Page context string
            combined_context: Combined RAG/traits context
            user_preferences: User's ChatPreferences (optional)

        Returns:
            System prompt string (enhanced with preferences if available)
        """
        from .preference_builder import enhance_system_prompt

        # Get base system prompt
        is_simulation = page_context and "Simulation" in page_context
        if is_simulation:
            base_prompt = get_simulation_tool_prompt("User", combined_context)
        else:
            base_prompt = get_zigi_prompt_with_tools()

        # Enhance with user preferences
        enhanced_prompt = enhance_system_prompt(base_prompt, user_preferences)
        if user_preferences:
            logger.info(f"✨ Enhanced system prompt with user preferences")
        else:
            logger.info(f"ℹ️ Using default system prompt (no user preferences)")
        return enhanced_prompt

    def _find_preceding_user_message(self, conversation_id: str, message_id: str):
        """Find the user message that preceded an assistant message."""
        messages = MessageService.get_messages(conversation_id, limit=100)
        for i, msg in enumerate(messages.messages):
            if msg.id == message_id and i > 0:
                prev_msg = messages.messages[i - 1]
                if prev_msg.role == MessageRole.USER:
                    return prev_msg
        return None

    def _record_token_usage(
        self,
        user_id: str,
        user_name: Optional[str],
        metadata: Dict[str, Any],
        message_preview: str,
        model: str
    ):
        """Record token usage for rate limiting and analytics."""
        total_tokens = metadata.get("total_tokens", 0)
        if total_tokens > 0:
            self.rate_limiter.record_usage(user_id, total_tokens)

        # Check if prompt caching was used
        cache_read_tokens = metadata.get("cache_read_input_tokens", 0)
        prompt_cache_used = cache_read_tokens > 0

        self.token_analytics.log_usage(
            user_id=user_id,
            user_name=user_name,
            input_tokens=metadata.get("input_tokens", 0),
            output_tokens=metadata.get("output_tokens", 0),
            cached=prompt_cache_used,
            message_preview=message_preview[:100],
            model=model,
            cache_creation_input_tokens=metadata.get("cache_creation_input_tokens", 0),
            cache_read_input_tokens=cache_read_tokens
        )

    async def _generate_and_save_title(self, conversation_id: str, user_id: str, user_message: str, assistant_message: str):
        """Generate a short title using LLM and save it."""
        try:
            # Construct a simple prompt for title generation
            messages = [
                {
                    "role": "user", 
                    "content": f"User: {user_message}\nAssistant: {assistant_message}\n\nSummarize the above interaction into a concise, 3-5 word title. Do not use quotes."
                }
            ]
            
            # Call Claude for a quick title (using Haiku for speed/cost if available, or just the current model)
            # We use a small max_tokens to ensure brevity
            title, _ = await self.claude_service.generate_response(
                messages, 
                system_prompt="You are a helpful assistant that generates short, concise titles for conversations.",
                model="claude-3-haiku-20240307", # Use fast model
                max_tokens=20,
                temperature=0.3
            )
            
            # Clean up title
            title = title.strip().strip('"')
            
            # Update conversation
            ConversationService.update_conversation(
                conversation_id,
                user_id,
                ConversationUpdate(title=title)
            )
            logger.info(f"✨ Generated smart title for conservation {conversation_id}: {title}")
            
        except Exception as e:
            logger.error(f"Failed to generate title for conversation {conversation_id}: {e}")

    async def _handle_streaming_chat(
        self,
        claude_messages: list,
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        conversation,
        user_message,
        chat_request: ChatRequest,
        user_id: str,
        user_name: Optional[str]
    ):
        """Handle streaming chat response."""
        from fastapi.responses import StreamingResponse

        logger.info("Using STREAMING mode (MCP tools NOT available in streaming)")

        async def event_generator():
            assistant_content = ""
            metadata = None

            async for chunk in self.claude_service.stream_response(
                claude_messages, system_prompt, model, max_tokens, temperature
            ):
                if chunk["type"] == "content":
                    assistant_content += chunk.get("content", "")
                    yield f"data: {json.dumps(chunk)}\n\n"

                elif chunk["type"] == "metadata":
                    metadata = chunk.get("metadata", {})

                elif chunk["type"] == "error":
                    yield f"data: {json.dumps(chunk)}\n\n"

                elif chunk["type"] == "done":
                    # Save assistant message
                    assistant_message = None
                    if assistant_content:
                        msg_metadata = MessageMetadata(
                            input_tokens=metadata.get("input_tokens", 0) if metadata else 0,
                            output_tokens=metadata.get("output_tokens", 0) if metadata else 0,
                            total_tokens=metadata.get("total_tokens", 0) if metadata else 0,
                            model=model,
                            widget_type=metadata.get("widget_type") if metadata else None,
                            breeding_data=metadata.get("breeding_data") if metadata else None,
                            dna_rna_data=metadata.get("dna_rna_data") if metadata else None,
                            gwas_data=metadata.get("gwas_data") if metadata else None,
                        )
                        assistant_message = MessageService.create_message(
                            conversation_id=conversation.id,
                            role=MessageRole.ASSISTANT,
                            content=assistant_content,
                            metadata=msg_metadata,
                            parent_message_id=user_message.id,
                        )

                        # Update conversation title if first message
                        if conversation.message_count <= 2:
                            # Trigger async title generation
                            asyncio.create_task(self._generate_and_save_title(
                                conversation.id, 
                                user_id, 
                                chat_request.message, 
                                assistant_content
                            ))

                        # Record token usage
                        self._record_token_usage(
                            user_id, user_name, metadata if metadata else {}, chat_request.message, model
                        )

                    yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation.id, 'message_id': assistant_message.id if assistant_content else None})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        ), conversation.id, None

    async def _handle_non_streaming_chat(
        self,
        claude_messages: list,
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        conversation,
        user_message,
        chat_request: ChatRequest,
        user_id: str,
        user_name: Optional[str]
    ) -> Tuple[ChatResponse, str, str]:
        """Handle non-streaming chat response with tool support and caching."""
        # Initialize performance tracker for this response
        perf = PerformanceTracker("llm_response")
        perf.start("total_response")
        
        logger.info("🤖 Using NON-STREAMING mode with MCP tools enabled")

        # Check if we have tools enabled - only cache if no tools (tools have dynamic results)
        has_tools_enabled = bool(chat_request.enabled_tools)
        cache_key = chat_request.message.lower().strip()
        cached_response = None
        cache_hit = False
        
        # Try to get cached response (only for non-tool queries)
        perf.start("cache_lookup")
        if not has_tools_enabled:
            cached_response = self.response_cache.get(
                cache_key, 
                page_name=chat_request.page_context or ""
            )
        perf.stop("cache_lookup")
        
        if cached_response:
            # Cache HIT - return cached response with minimal latency
            cache_hit = True
            logger.info(f"🚀 CACHE HIT! Returning cached response (saved ~2-5s)")
            content = cached_response
            metadata = {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "cached": True,
                "cache_hit": True,
            }
        else:
            # Cache MISS or tools enabled - call Claude API
            perf.start("llm_api_call")
            content, metadata = await self.claude_service.generate_response_with_tools(
                claude_messages, system_prompt, model, max_tokens, temperature,
                use_tools=True,
            )
            perf.stop("llm_api_call")
            
            # Cache the response for future use (only if no tools were used)
            tools_used = metadata.get("tools_used", [])
            if not tools_used and not has_tools_enabled:
                perf.start("cache_store")
                self.response_cache.set(
                    cache_key, 
                    content, 
                    page_name=chat_request.page_context or ""
                )
                perf.stop("cache_store")
                logger.info(f"📦 Cached response for future use")

        # Log tool usage if any tools were used
        tools_used = metadata.get("tools_used", [])
        if tools_used:
            tool_names = [t['name'] for t in tools_used]
            logger.info(f"🔧 Tools used: {tool_names}")

        # Create response metadata
        msg_metadata = MessageMetadata(
            input_tokens=metadata.get("input_tokens", 0),
            output_tokens=metadata.get("output_tokens", 0),
            total_tokens=metadata.get("total_tokens", 0),
            model=model,
            widget_type=metadata.get("widget_type"),
            breeding_data=metadata.get("breeding_data"),
            dna_rna_data=metadata.get("dna_rna_data"),
            gwas_data=metadata.get("gwas_data"),
        )

        # Save assistant message
        perf.start("save_assistant_message")
        assistant_message = MessageService.create_message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=content,
            metadata=msg_metadata,
            parent_message_id=user_message.id,
        )
        perf.stop("save_assistant_message")

        # Update conversation title if first message
        if conversation.message_count <= 2:
            perf.start("update_title")
            # Trigger async title generation
            asyncio.create_task(self._generate_and_save_title(
                conversation.id, 
                user_id, 
                chat_request.message, 
                content
            ))
            perf.stop("update_title")

        # Record token usage
        perf.start("record_usage")
        self._record_token_usage(
            user_id, user_name, metadata, chat_request.message, model
        )
        perf.stop("record_usage")
        
        # Stop total timer
        perf.stop("total_response")
        
        # Log comprehensive performance summary
        perf.log_summary()
        
        # Log final summary with key metrics
        total_ms = perf.get_total_ms()
        input_tokens = metadata.get("input_tokens", 0)
        output_tokens = metadata.get("output_tokens", 0)
        response_length = len(content) if content else 0
        
        logger.info(
            f"✅ Response complete | "
            f"Total: {total_ms:.0f}ms | "
            f"Cache: {'HIT' if cache_hit else 'MISS'} | "
            f"Tokens: {input_tokens}in/{output_tokens}out | "
            f"Response: {response_length} chars"
        )

        return ChatResponse(
            conversation_id=conversation.id,
            message=assistant_message,
            conversation_title=conversation.title,
            usage=msg_metadata,
        ), conversation.id, assistant_message.id

    async def _handle_deep_research_chat(
        self,
        chat_request: ChatRequest,
        conversation,
        user_message,
        user_id: str,
        user_name: Optional[str]
    ):
        """
        Handle deep research chat using LangGraph workflow.
        
        This uses a multi-step research process:
        1. Clarification (GPT-4o-mini) - Generate follow-up questions if needed
        2. Retrieval (Pinecone) - Fetch relevant document chunks
        3. Reranking (Cohere) - Improve precision of retrieved chunks
        4. Synthesis (Claude) - Generate comprehensive response
        
        Returns:
            Tuple of (ChatResponse, conversation_id, message_id)
        """
        from ..deep_research import get_deep_research_service, DeepResearchRequest
        from ..deep_research.schemas import ResearchStatus, ClarificationAnswer
        from ..auth.subscription_service import get_subscription_service
        from ..zygotrix_ai_service import MessageService, MessageRole
        import re
        
        logger.info(f"🔬 Starting deep research for user {user_id}")
        
        # Check subscription and usage limits
        subscription_service = get_subscription_service()
        can_access, reason, remaining = subscription_service.check_deep_research_access(user_id)
        
        if not can_access:
            logger.warning(f"🔬 Deep research denied for user {user_id}: {reason}")
            # Return a helpful message about subscription requirement
            
            error_content = f"⚠️ **Deep Research Access Denied**\n\n{reason}"
            
            if "PRO feature" in reason:
                error_content += "\n\n💡 **Tip:** Upgrade to PRO to unlock powerful Deep Research capabilities including multi-source synthesis and comprehensive analysis."
            elif "used all" in reason:
                error_content += f"\n\n📊 You can use Deep Research again tomorrow when your daily limit resets."
                
            assistant_message = MessageService.create_message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=error_content,
            )
            
            # Generate title for new conversations (runs in background)
            if conversation.message_count <= 2:
                asyncio.create_task(self._generate_and_save_title(
                    conversation.id,
                    user_id,
                    chat_request.message,
                    error_content[:200]
                ))
            
            # Create proper Message object for response
            from app.schema.zygotrix_ai import Message
            message_obj = Message(
                id=assistant_message.id,
                conversation_id=conversation.id,
                role="assistant",
                content=error_content,
                created_at=assistant_message.created_at,
            )
            
            return ChatResponse(
                conversation_id=conversation.id,
                message=message_obj,
                conversation_title=conversation.title,
            ), conversation.id, assistant_message.id
        
        logger.info(f"🔬 Deep research access granted for user {user_id}: {remaining} uses remaining")
        
        try:
            research_service = get_deep_research_service()
            
            # Check if the message contains clarification answers
            # Format: "original query\n\nClarification answers:\nAnswer 1: ...\nAnswer 2: ..."
            message = chat_request.message
            original_query = message
            clarification_answers = []
            skip_clarification = False
            
            if "Clarification answers:" in message:
                # Split into original query and answers section
                parts = message.split("Clarification answers:")
                original_query = parts[0].strip()
                
                if len(parts) > 1:
                    answers_section = parts[1].strip()
                    # Parse individual answers
                    answer_pattern = re.compile(r'Answer\s+\d+:\s*(.+?)(?=Answer\s+\d+:|$)', re.DOTALL)
                    matches = answer_pattern.findall(answers_section)
                    
                    for i, answer_text in enumerate(matches):
                        answer_text = answer_text.strip()
                        if answer_text:
                            clarification_answers.append(ClarificationAnswer(
                                question_id=f"q{i+1}",
                                answer=answer_text
                            ))
                    
                    if clarification_answers:
                        skip_clarification = True
                        logger.info(f"🔬 Detected {len(clarification_answers)} clarification answers - skipping clarification")
            
            # Create deep research request
            research_request = DeepResearchRequest(
                query=original_query,
                conversation_id=conversation.id,
                skip_clarification=skip_clarification,
                clarification_answers=clarification_answers,
                max_sources=100,      # Pinecone retrieval
                top_k_reranked=20     # Cohere rerank output
            )
            
            # Execute research
            research_response = await research_service.research(
                request=research_request,
                user_id=user_id,
                user_name=user_name
            )
            
            # Record usage only for completed research (not clarification questions)
            if research_response.status != ResearchStatus.NEEDS_CLARIFICATION:
                subscription_service.record_deep_research_usage(user_id)
                logger.info(f"🔬 Recorded deep research usage for user {user_id}")
            
            # Handle different research statuses
            if research_response.status == ResearchStatus.NEEDS_CLARIFICATION:
                # Return clarification as an interactive widget
                content = "I need some additional information to conduct thorough research on your query. Please answer the questions below."
                
                # Prepare clarification questions for the widget
                clarification_questions = []
                for q in research_response.clarification_questions:
                    clarification_questions.append({
                        "id": q.id,
                        "question": q.question,
                        "context": q.context,
                        "suggested_answers": q.suggested_answers,
                    })
                
                # Calculate token usage from research response
                total_input = sum(model_usage.get("input_tokens", 0) for model_usage in research_response.token_usage.values())
                total_output = sum(model_usage.get("output_tokens", 0) for model_usage in research_response.token_usage.values())
                
                # Create message metadata with widget data
                msg_metadata = MessageMetadata(
                    input_tokens=total_input,
                    output_tokens=total_output,
                    total_tokens=total_input + total_output,
                    model="deep_research",
                    provider="multi-model",
                    latency_ms=research_response.processing_time_ms,
                    widget_type="deep_research_clarification",
                    deep_research_data={
                        "session_id": research_response.session_id,
                        "original_query": chat_request.message,
                        "questions": clarification_questions,
                        "status": "needs_clarification",
                    }
                )
                
                # Save assistant message with widget
                assistant_message = MessageService.create_message(
                    conversation_id=conversation.id,
                    role=MessageRole.ASSISTANT,
                    content=content,
                    metadata=msg_metadata,
                    parent_message_id=user_message.id,
                )
                
                # Update conversation stats
                ConversationService.update_conversation_stats(
                    conversation.id,
                    tokens_used=total_input + total_output,
                    increment_messages=True,
                    last_message_preview="Deep Research - Awaiting clarification"
                )
                
                logger.info(
                    f"✅ Deep research clarification requested | "
                    f"Questions: {len(clarification_questions)} | "
                    f"Time: {research_response.processing_time_ms}ms"
                )
                
                # Generate smart title for new conversations (runs in background)
                if conversation.message_count <= 2:  # First exchange
                    asyncio.create_task(self._generate_and_save_title(
                        conversation.id,
                        user_id,
                        chat_request.message,
                        "Deep Research: " + chat_request.message[:100]
                    ))
                
                return ChatResponse(
                    conversation_id=conversation.id,
                    message=assistant_message,
                    conversation_title=conversation.title,
                    usage=msg_metadata,
                ), conversation.id, assistant_message.id
                
            elif research_response.status == ResearchStatus.COMPLETED:
                # Format successful research response (without appending sources text)
                content = research_response.response or ""
                
                # Add simple footer
                content += f"\n\n---\n*Deep Research completed in {research_response.processing_time_ms}ms using {research_response.sources_used} sources*"
                
            elif research_response.status == ResearchStatus.FAILED:
                # Handle error
                error_msg = research_response.error_message or "Unknown error during research"
                content = f"## ❌ Deep Research Error\n\nI encountered an error during the research process:\n\n> {error_msg}\n\nPlease try rephrasing your question or try again later."
                logger.error(f"Deep research failed: {error_msg}")
            
            else:
                # Pending or other status
                content = f"## 🔄 Research In Progress\n\nYour research request is being processed. Current status: {research_response.status.value}"
            
            # Calculate token usage from research response
            total_input = sum(model_usage.get("input_tokens", 0) for model_usage in research_response.token_usage.values())
            total_output = sum(model_usage.get("output_tokens", 0) for model_usage in research_response.token_usage.values())
            
            # Prepare deep research metadata with sources
            deep_research_data = None
            if research_response.sources:
                deep_research_data = {
                    "sources": [source.dict() for source in research_response.sources],
                    "stats": {
                        "time_ms": research_response.processing_time_ms,
                        "sources_count": research_response.sources_used
                    }
                }
            
            # Create message metadata
            msg_metadata = MessageMetadata(
                input_tokens=total_input,
                output_tokens=total_output,
                total_tokens=total_input + total_output,
                model="deep_research",
                provider="multi-model",
                latency_ms=research_response.processing_time_ms,
                deep_research_data=deep_research_data
            )
            
            # Save assistant message
            assistant_message = MessageService.create_message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=content,
                metadata=msg_metadata,
                parent_message_id=user_message.id,
            )
            
            # Update conversation stats
            ConversationService.update_conversation_stats(
                conversation.id,
                tokens_used=total_input + total_output,
                increment_messages=True,
                last_message_preview=content[:100]
            )
            
            logger.info(
                f"✅ Deep research complete | "
                f"Status: {research_response.status.value} | "
                f"Sources: {research_response.sources_used} | "
                f"Time: {research_response.processing_time_ms}ms"
            )
            
            # Generate smart title for new conversations (runs in background)
            if conversation.message_count <= 2:  # First exchange
                asyncio.create_task(self._generate_and_save_title(
                    conversation.id,
                    user_id,
                    chat_request.message,
                    content[:500]  # Use first 500 chars of response for title generation
                ))
            
            return ChatResponse(
                conversation_id=conversation.id,
                message=assistant_message,
                conversation_title=conversation.title,
                usage=msg_metadata,
            ), conversation.id, assistant_message.id
            
        except Exception as e:
            logger.error(f"Deep research error: {e}", exc_info=True)
            
            # Create error response
            error_content = f"## ❌ Deep Research Error\n\nAn unexpected error occurred:\n\n> {str(e)}\n\nPlease try again or disable Deep Research to use standard chat."
            
            msg_metadata = MessageMetadata(
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                model="deep_research",
                provider="error",
            )
            
            assistant_message = MessageService.create_message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=error_content,
                metadata=msg_metadata,
                parent_message_id=user_message.id,
            )
            
            return ChatResponse(
                conversation_id=conversation.id,
                message=assistant_message,
                conversation_title=conversation.title,
                usage=msg_metadata,
            ), conversation.id, assistant_message.id

    async def _handle_web_search_chat(
        self,
        chat_request: ChatRequest,
        conversation,
        user_message,
        user_id: str,
        user_name: Optional[str]
    ):
        """
        Handle web search chat using Claude's built-in web search tool.
        
        This is a PRO-only feature with usage tracking.
        Pricing: $10 per 1,000 searches + standard token costs.
        
        Returns:
            Tuple of (ChatResponse, conversation_id, message_id)
        """
        from ..web_search import get_web_search_service
        from ..zygotrix_ai_service import MessageService, MessageRole
        import time
        
        logger.info(f"🌐 Starting web search for user {user_id}")
        start_time = time.perf_counter()
        
        # Get web search service
        web_search_service = get_web_search_service()
        
        # Check access (PRO only)
        can_access, reason, _ = await web_search_service.check_access(user_id)
        
        if not can_access:
            logger.warning(f"🌐 Web search denied for user {user_id}: {reason}")
            
            error_content = f"⚠️ **Web Search Access Denied**\n\n{reason}"
            error_content += "\n\n💡 **Tip:** Upgrade to PRO to unlock real-time web search capabilities for the latest information from the internet."
            
            assistant_message = MessageService.create_message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=error_content,
            )
            
            # Generate title for new conversations
            if conversation.message_count <= 2:
                asyncio.create_task(self._generate_and_save_title(
                    conversation.id,
                    user_id,
                    chat_request.message,
                    error_content[:200]
                ))
            
            from app.schema.zygotrix_ai import Message
            message_obj = Message(
                id=assistant_message.id,
                conversation_id=conversation.id,
                role="assistant",
                content=error_content,
                created_at=assistant_message.created_at,
            )
            
            return ChatResponse(
                conversation_id=conversation.id,
                message=message_obj,
                conversation_title=conversation.title,
            ), conversation.id, assistant_message.id
        
        logger.info(f"🌐 Web search access granted for user {user_id}")
        
        try:
            # Perform web search
            response_content, search_metadata = await web_search_service.search(
                query=chat_request.message,
                user_id=user_id,
                user_name=user_name
            )
            
            processing_time_ms = int((time.perf_counter() - start_time) * 1000)
            
            # Check for errors
            if search_metadata.get("error"):
                error_content = f"## ❌ Web Search Error\n\n{response_content}\n\nPlease try again later."
                
                msg_metadata = MessageMetadata(
                    input_tokens=0,
                    output_tokens=0,
                    total_tokens=0,
                    model="web_search",
                    provider="error",
                    latency_ms=processing_time_ms
                )
                
                assistant_message = MessageService.create_message(
                    conversation_id=conversation.id,
                    role=MessageRole.ASSISTANT,
                    content=error_content,
                    metadata=msg_metadata,
                    parent_message_id=user_message.id,
                )
                
                return ChatResponse(
                    conversation_id=conversation.id,
                    message=assistant_message,
                    conversation_title=conversation.title,
                    usage=msg_metadata,
                ), conversation.id, assistant_message.id
            
            # Format successful response with sources
            sources = search_metadata.get("sources", [])
            sources_count = len(sources)
            
            # Add footer with stats
            content = response_content
            content += f"\n\n---\n*Web Search completed in {processing_time_ms}ms using {sources_count} sources*"
            
            # Prepare web search metadata for frontend
            web_search_data = None
            if sources:
                web_search_data = {
                    "sources": sources,
                    "stats": {
                        "time_ms": processing_time_ms,
                        "sources_count": sources_count,
                        "search_count": search_metadata.get("search_count", 1)
                    }
                }
            
            # Create message metadata
            msg_metadata = MessageMetadata(
                input_tokens=search_metadata.get("input_tokens", 0),
                output_tokens=search_metadata.get("output_tokens", 0),
                total_tokens=search_metadata.get("total_tokens", 0),
                model="web_search",
                provider="claude-web-search",
                latency_ms=processing_time_ms,
                web_search_data=web_search_data
            )
            
            # Save assistant message
            assistant_message = MessageService.create_message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=content,
                metadata=msg_metadata,
                parent_message_id=user_message.id,
            )
            
            # Update conversation stats
            ConversationService.update_conversation_stats(
                conversation.id,
                tokens_used=search_metadata.get("total_tokens", 0),
                increment_messages=True,
                last_message_preview=content[:100]
            )
            
            logger.info(
                f"✅ Web search complete | "
                f"Sources: {sources_count} | "
                f"Time: {processing_time_ms}ms"
            )
            
            # Generate smart title for new conversations
            if conversation.message_count <= 2:
                asyncio.create_task(self._generate_and_save_title(
                    conversation.id,
                    user_id,
                    chat_request.message,
                    content[:500]
                ))
            
            return ChatResponse(
                conversation_id=conversation.id,
                message=assistant_message,
                conversation_title=conversation.title,
                usage=msg_metadata,
            ), conversation.id, assistant_message.id
            
        except Exception as e:
            logger.error(f"Web search error: {e}", exc_info=True)
            
            error_content = f"## ❌ Web Search Error\n\nAn unexpected error occurred:\n\n> {str(e)}\n\nPlease try again or disable Web Search to use standard chat."
            
            msg_metadata = MessageMetadata(
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                model="web_search",
                provider="error",
            )
            
            assistant_message = MessageService.create_message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=error_content,
                metadata=msg_metadata,
                parent_message_id=user_message.id,
            )
            
            return ChatResponse(
                conversation_id=conversation.id,
                message=assistant_message,
                conversation_title=conversation.title,
                usage=msg_metadata,
            ), conversation.id, assistant_message.id

    async def _handle_scholar_mode_chat(
        self,
        chat_request: ChatRequest,
        conversation,
        user_message,
        user_id: str,
        user_name: Optional[str]
    ):
        """
        Handle Scholar Mode chat combining Deep Research, Web Search, and Cohere Reranking.
        
        This is a PRO-only feature with usage tracking.
        
        Returns:
            Tuple of (ChatResponse, conversation_id, message_id)
        """
        from ..scholar import get_scholar_service
        from ..zygotrix_ai_service import MessageService, MessageRole
        import time
        
        logger.info(f"🎓 Starting Scholar Mode for user {user_id}")
        start_time = time.perf_counter()
        
        # Get scholar service
        scholar_service = get_scholar_service()
        
        # Check access (PRO only)
        can_access, reason, _ = await scholar_service.check_access(user_id)
        
        if not can_access:
            logger.warning(f"🎓 Scholar Mode denied for user {user_id}: {reason}")
            
            error_content = f"⚠️ **Scholar Mode Access Denied**\n\n{reason}"
            error_content += "\n\n💡 **Tip:** Upgrade to PRO to unlock Scholar Mode which combines deep research, web search, and AI synthesis for comprehensive research responses."
            
            assistant_message = MessageService.create_message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=error_content,
            )
            
            # Generate title for new conversations
            if conversation.message_count <= 2:
                asyncio.create_task(self._generate_and_save_title(
                    conversation.id,
                    user_id,
                    chat_request.message,
                    error_content[:200]
                ))
            
            from app.schema.zygotrix_ai import Message
            message_obj = Message(
                id=assistant_message.id,
                conversation_id=conversation.id,
                role="assistant",
                content=error_content,
                created_at=assistant_message.created_at,
            )
            
            return ChatResponse(
                conversation_id=conversation.id,
                message=message_obj,
                conversation_title=conversation.title,
            ), conversation.id, assistant_message.id
        
        logger.info(f"🎓 Scholar Mode access granted for user {user_id}")
        
        try:
            # Perform Scholar Mode research
            scholar_response = await scholar_service.research(
                query=chat_request.message,
                user_id=user_id,
                user_name=user_name
            )
            
            processing_time_ms = int((time.perf_counter() - start_time) * 1000)
            
            # Check for errors
            if scholar_response.error_message:
                error_content = f"## ❌ Scholar Mode Error\n\n{scholar_response.error_message}\n\nPlease try again later."
                
                msg_metadata = MessageMetadata(
                    input_tokens=0,
                    output_tokens=0,
                    total_tokens=0,
                    model="scholar_mode",
                    provider="error",
                    latency_ms=processing_time_ms
                )
                
                assistant_message = MessageService.create_message(
                    conversation_id=conversation.id,
                    role=MessageRole.ASSISTANT,
                    content=error_content,
                    metadata=msg_metadata,
                    parent_message_id=user_message.id,
                )
                
                return ChatResponse(
                    conversation_id=conversation.id,
                    message=assistant_message,
                    conversation_title=conversation.title,
                    usage=msg_metadata,
                ), conversation.id, assistant_message.id
            
            # Format successful response with source breakdown
            content = scholar_response.response
            content += f"\n\n---\n*Scholar Mode completed in {scholar_response.processing_time_ms}ms using {scholar_response.sources_used} sources ({scholar_response.deep_research_sources} from knowledge base, {scholar_response.web_search_sources} from web)*"
            
            # Prepare scholar mode metadata for frontend
            scholar_data = None
            if scholar_response.sources:
                scholar_data = {
                    "sources": [source.to_dict() for source in scholar_response.sources],
                    "stats": {
                        "time_ms": scholar_response.processing_time_ms,
                        "sources_count": scholar_response.sources_used,
                        "deep_research_sources": scholar_response.deep_research_sources,
                        "web_search_sources": scholar_response.web_search_sources
                    }
                }
            
            # Create message metadata
            token_usage = scholar_response.token_usage
            msg_metadata = MessageMetadata(
                input_tokens=token_usage.get("input_tokens", 0),
                output_tokens=token_usage.get("output_tokens", 0),
                total_tokens=token_usage.get("total_tokens", 0),
                model="scholar_mode",
                provider="multi-model",
                latency_ms=scholar_response.processing_time_ms,
                deep_research_data=scholar_data  # Reuse deep_research_data for sources display
            )
            
            # Save assistant message
            assistant_message = MessageService.create_message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=content,
                metadata=msg_metadata,
                parent_message_id=user_message.id,
            )
            
            # Update conversation stats
            ConversationService.update_conversation_stats(
                conversation.id,
                tokens_used=token_usage.get("total_tokens", 0),
                increment_messages=True,
                last_message_preview=content[:100]
            )
            
            logger.info(
                f"✅ Scholar Mode complete | "
                f"Deep Research: {scholar_response.deep_research_sources} | "
                f"Web Search: {scholar_response.web_search_sources} | "
                f"Time: {scholar_response.processing_time_ms}ms"
            )
            
            # Generate smart title for new conversations
            if conversation.message_count <= 2:
                asyncio.create_task(self._generate_and_save_title(
                    conversation.id,
                    user_id,
                    chat_request.message,
                    content[:500]
                ))
            
            return ChatResponse(
                conversation_id=conversation.id,
                message=assistant_message,
                conversation_title=conversation.title,
                usage=msg_metadata,
            ), conversation.id, assistant_message.id
            
        except Exception as e:
            logger.error(f"Scholar Mode error: {e}", exc_info=True)
            
            error_content = f"## ❌ Scholar Mode Error\n\nAn unexpected error occurred:\n\n> {str(e)}\n\nPlease try again or disable Scholar Mode to use standard chat."
            
            msg_metadata = MessageMetadata(
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                model="scholar_mode",
                provider="error",
            )
            
            assistant_message = MessageService.create_message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=error_content,
                metadata=msg_metadata,
                parent_message_id=user_message.id,
            )
            
            return ChatResponse(
                conversation_id=conversation.id,
                message=assistant_message,
                conversation_title=conversation.title,
                usage=msg_metadata,
            ), conversation.id, assistant_message.id


# Singleton instance
_chat_service_instance: Optional[ZygotrixChatService] = None


def get_zygotrix_chat_service() -> ZygotrixChatService:
    """Get singleton instance of ZygotrixChatService."""
    global _chat_service_instance
    if _chat_service_instance is None:
        _chat_service_instance = ZygotrixChatService()
    return _chat_service_instance
