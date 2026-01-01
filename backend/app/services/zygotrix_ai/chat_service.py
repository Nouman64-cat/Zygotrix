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
from .claude_service import get_zygotrix_claude_service

logger = logging.getLogger(__name__)


class ZygotrixChatService:
    """Service for handling Zygotrix AI chat operations."""

    def __init__(self):
        self.claude_service = get_zygotrix_claude_service()
        self.rate_limiter = get_rate_limiter()
        self.token_analytics = get_token_analytics_service()
        self.rag_service = get_rag_service()
        self.traits_service = get_traits_service()

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
        user_id = current_user.id
        user_name = current_user.name if hasattr(current_user, 'name') else None
        is_admin = hasattr(current_user, 'user_role') and current_user.user_role in ["admin", "super_admin"]

        # Check rate limit
        allowed, usage = self.rate_limiter.check_limit(user_id, is_admin=is_admin)
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
        conversation = await self._get_or_create_conversation(chat_request, user_id)

        # Get conversation settings
        conv_settings = conversation.settings
        model = chat_request.model or conv_settings.model
        temperature = chat_request.temperature if chat_request.temperature is not None else conv_settings.temperature
        max_tokens = chat_request.max_tokens or conv_settings.max_tokens

        # Fetch user preferences for response customization
        user_preferences = self._get_user_preferences(user_id)

        # Handle file attachments FIRST (for GWAS datasets)
        # This uploads files to cloud storage before we save the message
        # GWAS processing only happens if 'gwas_analysis' tool is enabled
        upload_results = await self._handle_file_attachments(
            chat_request.attachments,
            chat_request.message,
            user_id,
            enabled_tools=chat_request.enabled_tools or []
        )

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
        user_message = MessageService.create_message(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=chat_request.message,
            parent_message_id=chat_request.parent_message_id,
            attachments=safe_attachments
        )

        # Analyze message for preference signals (asynchronous, non-blocking)
        asyncio.create_task(self._analyze_and_update_preferences(
            user_id=user_id,
            message=chat_request.message,
            model=model
        ))

        # Build context (include upload results if any)
        combined_context = await self._build_context(
            chat_request.message,
            user_id=user_id,
            user_name=user_name
        )

        # Add upload results to context
        if upload_results:
            combined_context = f"{upload_results}\n\n{combined_context}" if combined_context else upload_results

        # Get conversation history and build Claude messages
        claude_messages = self._build_claude_messages(
            conversation.id,
            conv_settings.context_window_messages,
            chat_request.message,
            combined_context,
            attachments=chat_request.attachments
        )

        # Get system prompt (with user preferences)
        system_prompt = self._get_system_prompt(chat_request.page_context, combined_context, user_preferences)

        # Handle streaming vs non-streaming
        if chat_request.stream:
            return await self._handle_streaming_chat(
                claude_messages, system_prompt, model, max_tokens, temperature,
                conversation, user_message, chat_request, user_id, user_name
            )
        else:
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
        user_name = current_user.name if hasattr(current_user, 'name') else None

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

        # Check if intelligent routing is enabled
        use_intelligent_routing = os.getenv("ENABLE_INTELLIGENT_ROUTING", "true").lower() == "true"

        if use_intelligent_routing:
            # Use intelligent routing to decide which data sources to use
            from ..chatbot.query_classifier import get_query_classifier, QueryType
            import logging

            logger = logging.getLogger(__name__)
            classifier = get_query_classifier()
            query_type, confidence = await classifier.classify(message, user_id, user_name)

            logger.info(f"🧠 Zygotrix AI using intelligent routing: {query_type.value} (confidence: {confidence:.2f})")

            if query_type == QueryType.CONVERSATIONAL:
                # No context needed for conversational queries
                logger.debug("Routing: CONVERSATIONAL (no context)")
                return ""

            elif query_type == QueryType.KNOWLEDGE:
                # Only RAG context needed
                logger.debug("Routing: KNOWLEDGE (RAG only)")
                llama_context = await self.rag_service.retrieve_context(
                    message,
                    user_id=user_id,
                    user_name=user_name
                )
                return llama_context or ""

            elif query_type == QueryType.GENETICS_TOOLS:
                # Only traits context needed
                logger.debug("Routing: GENETICS_TOOLS (traits only)")
                traits_context = self.traits_service.get_traits_context(message)
                return traits_context

            else:  # HYBRID
                # Full context (both RAG and traits)
                logger.debug("Routing: HYBRID (RAG + traits)")
                traits_context = self.traits_service.get_traits_context(message)
                llama_context = await self.rag_service.retrieve_context(
                    message,
                    user_id=user_id,
                    user_name=user_name
                )
                if llama_context:
                    return f"{traits_context}\n\n{llama_context}" if traits_context else llama_context
                return traits_context
        else:
            # Traditional flow: always use both
            logger = logging.getLogger(__name__)
            logger.info("🔧 Zygotrix AI using traditional routing (always full context)")

            traits_context = self.traits_service.get_traits_context(message)
            llama_context = await self.rag_service.retrieve_context(
                message,
                user_id=user_id,
                user_name=user_name
            )

            if llama_context:
                return f"{traits_context}\n\n{llama_context}" if traits_context else llama_context
            return traits_context

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
                            ConversationService.update_conversation(
                                conversation.id,
                                user_id,
                                ConversationUpdate(title=chat_request.message[:50] + ("..." if len(chat_request.message) > 50 else ""))
                            )

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
        """Handle non-streaming chat response with tool support."""
        logger.info("Using NON-STREAMING mode with MCP tools enabled")

        # Non-streaming response with tool support
        content, metadata = await self.claude_service.generate_response_with_tools(
            claude_messages, system_prompt, model, max_tokens, temperature,
            use_tools=True,
        )

        # Log tool usage if any tools were used
        tools_used = metadata.get("tools_used", [])
        if tools_used:
            logger.info(f"Tools used in response: {[t['name'] for t in tools_used]}")

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

        assistant_message = MessageService.create_message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=content,
            metadata=msg_metadata,
            parent_message_id=user_message.id,
        )

        # Update conversation title if first message
        if conversation.message_count <= 2:
            ConversationService.update_conversation(
                conversation.id,
                user_id,
                ConversationUpdate(title=chat_request.message[:50] + ("..." if len(chat_request.message) > 50 else ""))
            )

        # Record token usage
        self._record_token_usage(
            user_id, user_name, metadata, chat_request.message, model
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
