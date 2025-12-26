"""
Query Classification Module for Intelligent Routing.

This module classifies user queries to determine the optimal routing strategy:
- CONVERSATIONAL: Simple greetings, thanks (no data sources needed)
- KNOWLEDGE: Questions requiring general knowledge (Pinecone RAG)
- GENETICS_TOOLS: Genetics calculations/searches (MCP tools)
- HYBRID: Queries requiring both knowledge and tools
"""

import re
import logging
from enum import Enum
from typing import Tuple, List, Optional
from anthropic import AsyncAnthropic
import os

logger = logging.getLogger(__name__)


class QueryType(Enum):
    """Types of queries based on required data sources."""
    CONVERSATIONAL = "conversational"
    KNOWLEDGE = "knowledge"
    GENETICS_TOOLS = "genetics_tools"
    HYBRID = "hybrid"


class PatternGroup:
    """Group of regex patterns for query classification."""

    def __init__(self, patterns: List[str], confidence: float = 0.9):
        self.patterns = [re.compile(p, re.IGNORECASE) for p in patterns]
        self.confidence = confidence

    def matches(self, query: str) -> bool:
        """Check if query matches any pattern in this group."""
        return any(pattern.search(query) for pattern in self.patterns)


class RuleBasedClassifier:
    """Fast rule-based classifier using regex patterns."""

    # Conversational patterns (greetings, thanks, farewells)
    CONVERSATIONAL_PATTERNS = PatternGroup([
        r'^(hi|hello|hey|greetings|howdy|sup|yo)\b',
        r'\b(how are you|what\'s up|how\'s it going|how do you do)\b',
        r'^(thanks|thank you|thx|ty|appreciated|cheers)\b',
        r'^(bye|goodbye|see you|later|farewell|cya)\b',
        r'^(good morning|good afternoon|good evening|good night)\b',
        r'^(ok|okay|alright|cool|nice|great|awesome)\s*$',
    ], confidence=0.95)

    # Genetics tools patterns (calculations, trait searches, DNA operations)
    GENETICS_PATTERNS = PatternGroup([
        r'\b(punnett\s+square|punnet|cross|monohybrid|dihybrid)\b',
        r'\b(genotype|phenotype|allele|heterozygous|homozygous|dominant|recessive)\b',
        r'\b(transcribe|translate|translat)\b.*\b(DNA|RNA|sequence|codon)\b',
        r'\b(DNA|RNA|mRNA|tRNA|protein|codon|amino acid)\b.*\b(sequence|transcrib|translat)\b',
        r'\b(search|find|list|show|get|lookup)\b.*\b(trait|gene|allele)\b',
        r'\b(trait|gene)\b.*\b(search|find|list|show|details|information)\b',
        r'\b(calculate|generate|create|make|compute)\b.*\b(sequence|DNA|RNA|protein|cross|square)\b',
        r'\b(inheritance\s+pattern|inheritance\s+type|how\s+is.*inherited)\b',
        r'\b(random\s+DNA|random\s+sequence|generate.*sequence)\b',
    ], confidence=0.90)

    # Knowledge retrieval patterns (explanations, definitions, general questions)
    KNOWLEDGE_PATTERNS = PatternGroup([
        r'^(what\s+is|what\s+are|what\'s|define|explain|tell\s+me\s+about|describe)\b',
        r'\b(genetic\s+engineering|CRISPR|biotechnology|cloning|gene\s+editing)\b',
        r'\b(history\s+of|how\s+does|how\s+do|why|when|where|who)\b',
        r'\b(advantage|disadvantage|pro|con|benefit|drawback|application|use)\b',
        r'\b(DNA\s+replication|mitosis|meiosis|cell\s+division|chromosome)\b',
        r'\b(evolution|natural\s+selection|genetic\s+drift|mutation)\b',
        r'^(can\s+you\s+explain|help\s+me\s+understand|I\s+want\s+to\s+know)\b',
    ], confidence=0.85)

    # Hybrid patterns (compound queries, multiple intents)
    HYBRID_PATTERNS = PatternGroup([
        # Pattern: "Explain X and calculate/do Y"
        r'\b(explain|what\s+is|what\s+are|describe|define)\b.+\b(and|then)\b.+\b(calculate|compute|show|transcribe|translate|search|list|generate)\b',

        # Pattern: "Calculate/Do X and explain Y"
        r'\b(calculate|compute|transcribe|translate|search|list|generate)\b.+\b(and|then)\b.+\b(explain|what|why|how|describe)\b',

        # Pattern: Multiple questions
        r'.*\?.*\?.*',

        # Pattern: Knowledge question + action verb in same sentence
        r'\b(explain|define|what\s+is)\b.+\b(calculate|transcribe|translate|punnett|cross)\b',

        # Pattern: Generic compound with "and" connecting different intents
        r'.+\b(and\s+then|and\s+also|plus)\b.+',
    ], confidence=0.85)

    def classify(self, query: str) -> Tuple[QueryType, float]:
        """
        Classify query using pattern matching.

        Args:
            query: User query string

        Returns:
            Tuple of (QueryType, confidence_score)
        """
        query = query.strip()

        # Check patterns in priority order
        # 1. Conversational (highest priority for simple interactions)
        if self.CONVERSATIONAL_PATTERNS.matches(query):
            logger.debug(f"Classified as CONVERSATIONAL: {query[:50]}")
            return QueryType.CONVERSATIONAL, self.CONVERSATIONAL_PATTERNS.confidence

        # 2. Check for hybrid patterns early (before specific types)
        if self.HYBRID_PATTERNS.matches(query):
            logger.debug(f"Classified as HYBRID: {query[:50]}")
            return QueryType.HYBRID, self.HYBRID_PATTERNS.confidence

        # 3. Genetics tools (specific operations)
        if self.GENETICS_PATTERNS.matches(query):
            logger.debug(f"Classified as GENETICS_TOOLS: {query[:50]}")
            return QueryType.GENETICS_TOOLS, self.GENETICS_PATTERNS.confidence

        # 4. Knowledge retrieval (general questions)
        if self.KNOWLEDGE_PATTERNS.matches(query):
            logger.debug(f"Classified as KNOWLEDGE: {query[:50]}")
            return QueryType.KNOWLEDGE, self.KNOWLEDGE_PATTERNS.confidence

        # 5. Default to knowledge for unknown queries (safer than hybrid)
        logger.debug(f"No pattern match, defaulting to KNOWLEDGE: {query[:50]}")
        return QueryType.KNOWLEDGE, 0.5  # Low confidence for default


class LLMClassifier:
    """LLM-based classifier for ambiguous queries."""

    CLASSIFICATION_PROMPT = """Analyze this user query and classify it into ONE category:

Categories:
1. CONVERSATIONAL - Simple greetings, thanks, small talk. No actual information needed.
   Examples: "Hello!", "Thanks!", "How are you?"

2. KNOWLEDGE - Questions needing explanations, definitions, or general information about genetics/biology.
   Examples: "What is genetic engineering?", "Explain CRISPR", "How does DNA replication work?"

3. GENETICS_TOOLS - Specific genetics calculations, trait searches, DNA/RNA operations that require computational tools.
   Examples: "Calculate Punnett square for Aa x Aa", "Search traits for eye color", "Transcribe ATGCGT"

4. HYBRID - Complex queries requiring BOTH knowledge explanation AND computational tools.
   Examples: "Explain Punnett squares and calculate one for Tt x tt", "What is transcription and transcribe ATGCGT?"

Query: "{query}"

Respond with ONLY ONE of these words: CONVERSATIONAL, KNOWLEDGE, GENETICS_TOOLS, or HYBRID"""

    def __init__(self, api_key: Optional[str] = None):
        # Use CLAUDE_API_KEY (same as main chatbot) instead of ANTHROPIC_API_KEY
        api_key = api_key or os.getenv("CLAUDE_API_KEY")
        if not api_key:
            raise ValueError(
                "Claude API key not found. Set CLAUDE_API_KEY environment variable "
                "or disable LLM classifier with ENABLE_LLM_CLASSIFIER=false"
            )
        self.client = AsyncAnthropic(api_key=api_key)

        # Use the same model as selected in chatbot settings
        try:
            from ..chatbot_settings import get_chatbot_settings
            settings = get_chatbot_settings()
            self.model = settings.model
            logger.info(f"LLM Classifier using model from settings: {self.model}")
        except Exception as e:
            # Fallback to Haiku if settings can't be loaded
            self.model = "claude-3-haiku-20240307"
            logger.warning(f"Failed to load model from settings, using default: {e}")

    async def classify(self, query: str, user_id: Optional[str] = None,
                      user_name: Optional[str] = None) -> Tuple[QueryType, float]:
        """
        Classify query using Claude LLM.

        Args:
            query: User query string
            user_id: Optional user ID for token tracking
            user_name: Optional user name for token tracking

        Returns:
            Tuple of (QueryType, confidence=1.0)
        """
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=20,
                temperature=0,  # Deterministic
                messages=[{
                    "role": "user",
                    "content": self.CLASSIFICATION_PROMPT.format(query=query[:500])  # Limit query length
                }]
            )

            # Extract classification
            classification = response.content[0].text.strip().upper()

            # Track token usage
            if hasattr(response, 'usage'):
                try:
                    from ..token_analytics_service import get_token_analytics_service
                    analytics = get_token_analytics_service()

                    input_tokens = response.usage.input_tokens
                    output_tokens = response.usage.output_tokens

                    # Log classifier token usage with distinguishable user_name
                    analytics.log_usage(
                        user_id=user_id or "system",
                        user_name=f"{user_name or 'Unknown'} [Classifier]",
                        input_tokens=input_tokens,
                        output_tokens=output_tokens,
                        cached=False,  # Classifier doesn't use caching
                        message_preview=f"Classification: {query[:100]}",
                        model=self.model
                    )

                    logger.debug(
                        f"LLM classifier tokens: {input_tokens} input + {output_tokens} output = "
                        f"{input_tokens + output_tokens} total"
                    )
                except Exception as track_error:
                    logger.warning(f"Failed to track classifier token usage: {track_error}")

            # Map to QueryType
            type_map = {
                "CONVERSATIONAL": QueryType.CONVERSATIONAL,
                "KNOWLEDGE": QueryType.KNOWLEDGE,
                "GENETICS_TOOLS": QueryType.GENETICS_TOOLS,
                "HYBRID": QueryType.HYBRID,
            }

            query_type = type_map.get(classification, QueryType.KNOWLEDGE)
            logger.info(f"LLM classified as {query_type.value}: {query[:50]}")

            return query_type, 1.0  # LLM results assumed high confidence

        except Exception as e:
            logger.error(f"LLM classification failed: {e}")
            # Fallback to KNOWLEDGE on error
            return QueryType.KNOWLEDGE, 0.5


class HybridClassifier:
    """
    Hybrid classifier combining rule-based (fast) and LLM-based (accurate) approaches.

    Strategy:
    1. Try rule-based first (< 5ms, no cost)
    2. If confidence < threshold, fallback to LLM (200-500ms, ~$0.0001)
    3. Cache LLM results for repeated queries
    """

    def __init__(self, confidence_threshold: float = 0.85, use_llm_fallback: bool = True):
        self.rule_classifier = RuleBasedClassifier()
        self.llm_classifier = LLMClassifier() if use_llm_fallback else None
        self.confidence_threshold = confidence_threshold
        self.use_llm_fallback = use_llm_fallback

        # Simple in-memory cache (could be Redis for production)
        self._cache: dict = {}
        self._cache_max_size = 1000

    async def classify(self, query: str, user_id: Optional[str] = None,
                      user_name: Optional[str] = None) -> Tuple[QueryType, float]:
        """
        Classify query using hybrid approach.

        Args:
            query: User query string
            user_id: Optional user ID for token tracking
            user_name: Optional user name for token tracking

        Returns:
            Tuple of (QueryType, confidence_score)
        """
        # Check cache first
        cache_key = query.lower().strip()[:200]  # Normalized cache key
        if cache_key in self._cache:
            logger.debug(f"Cache hit for query: {query[:50]}")
            return self._cache[cache_key]

        # Step 1: Try rule-based (fast path)
        query_type, confidence = self.rule_classifier.classify(query)

        # Step 2: If confident enough, return immediately
        if confidence >= self.confidence_threshold:
            logger.info(f"Rule-based classification (conf: {confidence:.2f}): {query_type.value}")
            self._update_cache(cache_key, (query_type, confidence))
            return query_type, confidence

        # Step 3: For ambiguous queries, use LLM if enabled
        if self.use_llm_fallback and self.llm_classifier:
            logger.info(f"Low confidence ({confidence:.2f}), using LLM classifier")
            query_type, confidence = await self.llm_classifier.classify(query, user_id, user_name)
            self._update_cache(cache_key, (query_type, confidence))
            return query_type, confidence

        # Fallback: use rule-based result even if low confidence
        logger.warning(f"Low confidence ({confidence:.2f}), no LLM fallback available")
        return query_type, confidence

    def _update_cache(self, key: str, value: Tuple[QueryType, float]):
        """Update cache with LRU-like behavior."""
        if len(self._cache) >= self._cache_max_size:
            # Remove oldest entry (simple FIFO, not true LRU)
            self._cache.pop(next(iter(self._cache)))
        self._cache[key] = value


# Singleton instance
_query_classifier: Optional[HybridClassifier] = None


def get_query_classifier() -> HybridClassifier:
    """Get or create the global query classifier instance."""
    global _query_classifier
    if _query_classifier is None:
        use_llm = os.getenv("ENABLE_LLM_CLASSIFIER", "true").lower() == "true"
        threshold = float(os.getenv("CLASSIFIER_CONFIDENCE_THRESHOLD", "0.85"))

        _query_classifier = HybridClassifier(
            confidence_threshold=threshold,
            use_llm_fallback=use_llm
        )
        logger.info(f"Initialized HybridClassifier (LLM fallback: {use_llm}, threshold: {threshold})")

    return _query_classifier
