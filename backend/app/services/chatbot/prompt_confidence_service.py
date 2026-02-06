"""
Prompt Confidence & Clarification Service.

This service analyzes user prompts to determine if they are clear enough
for the LLM to provide a high-quality response, or if clarification is needed.

Confidence Factors:
- Specificity: Is the query specific enough?
- Intent Clarity: Is the user's goal clear?
- Context Completeness: Does the query have enough context?
- Domain Relevance: Is it within Zygotrix's genetics domain?
- Actionability: Can we take a concrete action?

When confidence is below threshold, the system generates targeted
clarification questions before proceeding with the main response.
"""

import os
import re
import logging
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class ClarificationType(Enum):
    """Types of clarification questions."""
    WHAT_TYPE = "what_type"           # "Are you asking about X or Y?"
    SCOPE_NARROWING = "scope"         # "Which specific aspect...?"
    CONTEXT_GATHERING = "context"     # "What is the purpose...?"
    CONFIRMATION = "confirmation"     # "Just to confirm, you want..."
    DOMAIN_CHECK = "domain"           # "Are you asking about genetics or...?"
    PARAMETER_MISSING = "parameter"   # "What trait/gene/sequence...?"


@dataclass
class ConfidenceResult:
    """Result of confidence analysis."""
    overall_score: float
    factors: Dict[str, float]
    needs_clarification: bool
    clarification_type: Optional[ClarificationType] = None
    clarification_questions: List[str] = field(default_factory=list)
    analysis_summary: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_score": self.overall_score,
            "factors": self.factors,
            "needs_clarification": self.needs_clarification,
            "clarification_type": self.clarification_type.value if self.clarification_type else None,
            "clarification_questions": self.clarification_questions,
            "analysis_summary": self.analysis_summary
        }


class RuleBasedConfidenceAnalyzer:
    """Fast rule-based confidence analyzer using pattern matching."""
    
    # Vague/ambiguous patterns that lower confidence
    VAGUE_PATTERNS = [
        (r'^(what|how|why|when|where|who)\s*\??$', 0.2),  # Single question word
        (r'^(help|please|thanks|okay|ok|sure|yes|no)\s*$', 0.3),  # Too brief
        (r'^.{1,15}$', 0.4),  # Very short messages (< 15 chars)
        (r'\b(something|anything|stuff|things|whatever)\b', 0.6),  # Vague nouns
        (r'\b(maybe|perhaps|possibly|probably|might|could)\b', 0.7),  # Uncertainty
        (r'^(tell me about|explain|what is)\s+\w+$', 0.6),  # Single word topic
    ]
    
    # Domain-specific patterns that increase confidence
    GENETICS_SPECIFIC_PATTERNS = [
        (r'\b(punnett\s+square|monohybrid|dihybrid|cross)\b', 0.9),
        (r'\b(genotype|phenotype|allele|heterozygous|homozygous)\b', 0.85),
        (r'\b(DNA|RNA|mRNA|tRNA|codon|amino\s+acid|protein)\b', 0.85),
        (r'\b(GWAS|SNP|variant|chromosome|gene|mutation)\b', 0.9),
        (r'\b(transcribe|translate|sequence)\b.*\b[ATCGU]{3,}\b', 0.95),  # With actual sequence
        (r'\b(dominant|recessive|inheritance|pedigree)\b', 0.85),
        (r'\b(trait|phenotype)\b.*\b(for|of|about)\b', 0.8),  # Trait queries
    ]
    
    # Patterns that indicate clear intent
    CLEAR_INTENT_PATTERNS = [
        (r'\b(calculate|compute|generate|create|make)\b', 0.85),
        (r'\b(search|find|list|show|get|lookup)\b', 0.85),
        (r'\b(explain|describe|define|what\s+is|what\s+are)\b', 0.8),
        (r'\b(compare|difference|between)\b', 0.8),
        (r'\b(run|execute|perform|analyze)\b.*\b(analysis|test|study)\b', 0.9),
    ]
    
    # Patterns indicating missing parameters
    MISSING_PARAM_PATTERNS = [
        (r'\b(punnett|cross)\b(?!.*\b[A-Za-z]{1,2}\s*x\s*[A-Za-z]{1,2}\b)', "genotype_cross"),
        (r'\b(transcribe|translate)\b(?!.*\b[ATCGU]{3,}\b)', "sequence"),
        (r'\b(trait|gene)\b(?!.*\b(for|of|about|named?|called)\b)', "trait_name"),
        (r'\bGWAS\b(?!.*\b(dataset|file|vcf|analysis)\b)', "dataset"),
    ]
    
    def analyze(self, query: str) -> ConfidenceResult:
        """
        Analyze query confidence using pattern matching.
        
        Args:
            query: User query string
            
        Returns:
            ConfidenceResult with scores and clarification needs
        """
        query_lower = query.lower().strip()
        query_len = len(query)
        
        # Initialize factor scores
        factors = {
            "specificity": 0.5,
            "intent_clarity": 0.5,
            "context_completeness": 0.5,
            "domain_relevance": 0.5,
            "actionability": 0.5
        }
        
        # Factor 1: Specificity (based on query length and vagueness)
        if query_len < 10:
            factors["specificity"] = 0.2
        elif query_len < 25:
            factors["specificity"] = 0.4
        elif query_len < 50:
            factors["specificity"] = 0.6
        elif query_len < 100:
            factors["specificity"] = 0.75
        else:
            factors["specificity"] = 0.85
        
        # Check for vague patterns (decreases specificity)
        for pattern, penalty in self.VAGUE_PATTERNS:
            if re.search(pattern, query_lower, re.IGNORECASE):
                factors["specificity"] = min(factors["specificity"], penalty)
                break
        
        # Factor 2: Intent Clarity
        intent_score = 0.5
        for pattern, score in self.CLEAR_INTENT_PATTERNS:
            if re.search(pattern, query_lower, re.IGNORECASE):
                intent_score = max(intent_score, score)
        factors["intent_clarity"] = intent_score
        
        # Factor 3: Domain Relevance (genetics-specific)
        domain_score = 0.4  # Default for non-genetics queries
        for pattern, score in self.GENETICS_SPECIFIC_PATTERNS:
            if re.search(pattern, query_lower, re.IGNORECASE):
                domain_score = max(domain_score, score)
        factors["domain_relevance"] = domain_score
        
        # Factor 4: Context Completeness (check for missing parameters)
        context_score = 0.7  # Default
        missing_param = None
        for pattern, param_type in self.MISSING_PARAM_PATTERNS:
            if re.search(pattern, query_lower, re.IGNORECASE):
                context_score = 0.4
                missing_param = param_type
                break
        factors["context_completeness"] = context_score
        
        # Factor 5: Actionability
        if re.search(r'\?$', query.strip()):
            factors["actionability"] = 0.75  # Questions are actionable
        if re.search(r'\b(please|can you|could you|i want|i need)\b', query_lower):
            factors["actionability"] = 0.8  # Requests are actionable
        if domain_score > 0.7 and intent_score > 0.7:
            factors["actionability"] = 0.9  # Clear domain + intent = highly actionable
        
        # Calculate overall score (weighted average)
        weights = {
            "specificity": 0.25,
            "intent_clarity": 0.25,
            "context_completeness": 0.20,
            "domain_relevance": 0.15,
            "actionability": 0.15
        }
        
        overall_score = sum(factors[k] * weights[k] for k in factors)
        
        # Determine if clarification is needed
        threshold = float(os.getenv("CONFIDENCE_THRESHOLD", "0.65"))
        needs_clarification = overall_score < threshold
        
        # Generate clarification questions if needed
        clarification_type = None
        clarification_questions = []
        
        if needs_clarification:
            clarification_type, clarification_questions = self._generate_clarifications(
                query, factors, missing_param
            )
        
        # Generate analysis summary
        analysis_summary = self._generate_summary(query, factors, overall_score)
        
        return ConfidenceResult(
            overall_score=round(overall_score, 3),
            factors={k: round(v, 3) for k, v in factors.items()},
            needs_clarification=needs_clarification,
            clarification_type=clarification_type,
            clarification_questions=clarification_questions,
            analysis_summary=analysis_summary
        )
    
    def _generate_clarifications(
        self, 
        query: str, 
        factors: Dict[str, float],
        missing_param: Optional[str]
    ) -> Tuple[ClarificationType, List[str]]:
        """Generate appropriate clarification questions based on analysis."""
        
        query_lower = query.lower()
        questions = []
        ctype = ClarificationType.SCOPE_NARROWING  # Default
        
        # Priority 1: Missing parameters
        if missing_param:
            ctype = ClarificationType.PARAMETER_MISSING
            if missing_param == "genotype_cross":
                questions = [
                    "What genotypes would you like me to cross? (e.g., Aa x Aa, or AaBb x AaBb)",
                    "Could you specify the parent genotypes for the Punnett square?"
                ]
            elif missing_param == "sequence":
                questions = [
                    "What DNA or RNA sequence would you like me to work with?",
                    "Please provide the nucleotide sequence (e.g., ATGCGATC)"
                ]
            elif missing_param == "trait_name":
                questions = [
                    "Which specific trait are you interested in? (e.g., eye color, height, blood type)",
                    "Could you tell me the name of the trait or gene you want to explore?"
                ]
            elif missing_param == "dataset":
                questions = [
                    "Would you like to run GWAS on an existing dataset, or upload a new one?",
                    "Do you have a VCF file or dataset ready for GWAS analysis?"
                ]
        
        # Priority 2: Low domain relevance
        elif factors["domain_relevance"] < 0.5:
            ctype = ClarificationType.DOMAIN_CHECK
            questions = [
                "I specialize in genetics and biology. Is your question related to these topics?",
                "Could you help me understand how this relates to genetics, DNA, or biological inheritance?"
            ]
        
        # Priority 3: Low specificity
        elif factors["specificity"] < 0.5:
            ctype = ClarificationType.SCOPE_NARROWING
            if "genetics" in query_lower or "gene" in query_lower:
                questions = [
                    "Genetics is a broad field! Are you interested in:\n• Mendelian inheritance\n• Molecular genetics (DNA/RNA)\n• Population genetics (GWAS)\n• Something else?",
                    "Could you be more specific about what aspect of genetics you'd like to explore?"
                ]
            else:
                questions = [
                    "Could you provide more details about what you're looking for?",
                    "I want to make sure I understand correctly. Can you elaborate on your question?"
                ]
        
        # Priority 4: Low intent clarity
        elif factors["intent_clarity"] < 0.6:
            ctype = ClarificationType.WHAT_TYPE
            questions = [
                "I want to help, but I'm not sure what you need. Are you looking for:\n• An explanation or definition?\n• A calculation or analysis?\n• A search for specific information?",
                "Could you clarify what kind of response would be most helpful?"
            ]
        
        # Priority 5: Low context
        elif factors["context_completeness"] < 0.6:
            ctype = ClarificationType.CONTEXT_GATHERING
            questions = [
                "To give you the best answer, could you share a bit more context?",
                "What's the purpose or goal of this inquiry? That will help me tailor my response."
            ]
        
        # Fallback
        if not questions:
            ctype = ClarificationType.CONFIRMATION
            questions = [
                f"Just to make sure I understand: you're asking about '{query[:50]}...'?",
                "Could you rephrase your question so I can better assist you?"
            ]
        
        return ctype, questions
    
    def _generate_summary(
        self, 
        query: str, 
        factors: Dict[str, float], 
        overall_score: float
    ) -> str:
        """Generate a human-readable analysis summary."""
        
        weak_factors = [k for k, v in factors.items() if v < 0.6]
        strong_factors = [k for k, v in factors.items() if v >= 0.8]
        
        summary_parts = [f"Confidence: {overall_score:.1%}"]
        
        if weak_factors:
            summary_parts.append(f"Weak: {', '.join(weak_factors)}")
        if strong_factors:
            summary_parts.append(f"Strong: {', '.join(strong_factors)}")
        
        return " | ".join(summary_parts)


class LLMConfidenceAnalyzer:
    """LLM-based confidence analyzer for complex queries."""
    
    ANALYSIS_PROMPT = """Analyze this user query for clarity and answerability. You are a genetics education AI assistant.

Query: "{query}"

Evaluate these factors (0.0 to 1.0):
1. SPECIFICITY: Is the query specific enough to answer well? (vague vs detailed)
2. INTENT_CLARITY: Is it clear what the user wants? (explanation, calculation, search, etc.)
3. CONTEXT_COMPLETENESS: Does the query have enough information to respond?
4. DOMAIN_RELEVANCE: Is this within genetics/biology domain?
5. ACTIONABILITY: Can you take a concrete action to help?

If the overall confidence is LOW (< 0.65), suggest 1-2 clarifying questions.

Respond in JSON format:
{{
    "specificity": 0.X,
    "intent_clarity": 0.X,
    "context_completeness": 0.X,
    "domain_relevance": 0.X,
    "actionability": 0.X,
    "overall_score": 0.X,
    "needs_clarification": true/false,
    "clarification_questions": ["question 1", "question 2"] or [],
    "analysis_summary": "brief summary"
}}"""

    def __init__(self, api_key: Optional[str] = None):
        api_key = api_key or os.getenv("CLAUDE_API_KEY")
        if not api_key:
            raise ValueError("Claude API key not found")
        self.client = AsyncAnthropic(api_key=api_key)
        
        # Use faster model for analysis
        self.model = os.getenv("CONFIDENCE_ANALYZER_MODEL", "claude-3-haiku-20240307")
    
    async def analyze(
        self, 
        query: str,
        user_id: Optional[str] = None,
        user_name: Optional[str] = None
    ) -> ConfidenceResult:
        """
        Analyze query confidence using LLM.
        
        Args:
            query: User query string
            user_id: Optional user ID for token tracking
            user_name: Optional user name for token tracking
            
        Returns:
            ConfidenceResult with scores and clarification needs
        """
        try:
            import json
            
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=300,
                temperature=0,
                messages=[{
                    "role": "user",
                    "content": self.ANALYSIS_PROMPT.format(query=query[:500])
                }]
            )
            
            # Parse JSON response
            result_text = response.content[0].text.strip()
            
            # Extract JSON from response (handle markdown code blocks)
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]
            
            result_data = json.loads(result_text)
            
            # Track token usage
            if hasattr(response, 'usage'):
                try:
                    from .token_analytics_service import get_token_analytics_service
                    analytics = get_token_analytics_service()
                    analytics.log_usage(
                        user_id=user_id or "system",
                        user_name=f"{user_name or 'Unknown'} [ConfidenceAnalyzer]",
                        input_tokens=response.usage.input_tokens,
                        output_tokens=response.usage.output_tokens,
                        cached=False,
                        message_preview=f"Confidence: {query[:50]}",
                        model=self.model
                    )
                except Exception as e:
                    logger.warning(f"Failed to track confidence analyzer tokens: {e}")
            
            # Build ConfidenceResult
            factors = {
                "specificity": result_data.get("specificity", 0.5),
                "intent_clarity": result_data.get("intent_clarity", 0.5),
                "context_completeness": result_data.get("context_completeness", 0.5),
                "domain_relevance": result_data.get("domain_relevance", 0.5),
                "actionability": result_data.get("actionability", 0.5)
            }
            
            # Determine clarification type from questions
            clarification_type = None
            questions = result_data.get("clarification_questions", [])
            if questions:
                clarification_type = ClarificationType.SCOPE_NARROWING  # Default for LLM
            
            return ConfidenceResult(
                overall_score=result_data.get("overall_score", 0.5),
                factors=factors,
                needs_clarification=result_data.get("needs_clarification", False),
                clarification_type=clarification_type,
                clarification_questions=questions,
                analysis_summary=result_data.get("analysis_summary", "")
            )
            
        except Exception as e:
            logger.error(f"LLM confidence analysis failed: {e}")
            # Fallback to rule-based
            return RuleBasedConfidenceAnalyzer().analyze(query)


class HybridConfidenceAnalyzer:
    """
    Hybrid analyzer combining fast rule-based and accurate LLM-based approaches.
    
    Strategy:
    1. Always run rule-based first (< 5ms, no cost)
    2. If rule-based confidence is in "uncertain zone" (0.4-0.7), use LLM
    3. Cache results for repeated queries
    """
    
    def __init__(
        self, 
        llm_threshold_low: float = 0.4,
        llm_threshold_high: float = 0.7,
        use_llm_fallback: bool = True
    ):
        self.rule_analyzer = RuleBasedConfidenceAnalyzer()
        self.llm_analyzer = LLMConfidenceAnalyzer() if use_llm_fallback else None
        self.llm_threshold_low = llm_threshold_low
        self.llm_threshold_high = llm_threshold_high
        self.use_llm_fallback = use_llm_fallback
        
        # Simple in-memory cache
        self._cache: Dict[str, ConfidenceResult] = {}
        self._cache_max_size = 500
    
    async def analyze(
        self,
        query: str,
        user_id: Optional[str] = None,
        user_name: Optional[str] = None,
        force_llm: bool = False
    ) -> ConfidenceResult:
        """
        Analyze query confidence using hybrid approach.
        
        Args:
            query: User query string
            user_id: Optional user ID for token tracking
            user_name: Optional user name for token tracking
            force_llm: Force LLM analysis (for testing)
            
        Returns:
            ConfidenceResult with scores and clarification needs
        """
        # Check cache first
        cache_key = query.lower().strip()[:200]
        if cache_key in self._cache:
            logger.debug(f"Cache hit for confidence analysis: {query[:50]}")
            return self._cache[cache_key]
        
        # Step 1: Rule-based analysis (fast path)
        result = self.rule_analyzer.analyze(query)
        
        # Step 2: Determine if LLM is needed
        use_llm = force_llm or (
            self.use_llm_fallback and 
            self.llm_analyzer and
            self.llm_threshold_low < result.overall_score < self.llm_threshold_high
        )
        
        if use_llm:
            logger.info(
                f"Rule-based confidence in uncertain zone ({result.overall_score:.2f}), "
                f"using LLM analyzer"
            )
            result = await self.llm_analyzer.analyze(query, user_id, user_name)
        else:
            logger.info(
                f"Rule-based confidence: {result.overall_score:.2f} | "
                f"Needs clarification: {result.needs_clarification}"
            )
        
        # Cache result
        self._update_cache(cache_key, result)
        
        return result
    
    def _update_cache(self, key: str, value: ConfidenceResult):
        """Update cache with LRU-like behavior."""
        if len(self._cache) >= self._cache_max_size:
            # Remove oldest entry (FIFO)
            self._cache.pop(next(iter(self._cache)))
        self._cache[key] = value


# Singleton instance
_confidence_analyzer: Optional[HybridConfidenceAnalyzer] = None


def get_confidence_analyzer() -> HybridConfidenceAnalyzer:
    """Get or create the global confidence analyzer instance."""
    global _confidence_analyzer
    if _confidence_analyzer is None:
        use_llm = os.getenv("ENABLE_LLM_CONFIDENCE", "true").lower() == "true"
        threshold_low = float(os.getenv("CONFIDENCE_LLM_THRESHOLD_LOW", "0.4"))
        threshold_high = float(os.getenv("CONFIDENCE_LLM_THRESHOLD_HIGH", "0.7"))
        
        _confidence_analyzer = HybridConfidenceAnalyzer(
            llm_threshold_low=threshold_low,
            llm_threshold_high=threshold_high,
            use_llm_fallback=use_llm
        )
        logger.info(
            f"Initialized HybridConfidenceAnalyzer "
            f"(LLM fallback: {use_llm}, thresholds: {threshold_low}-{threshold_high})"
        )
    
    return _confidence_analyzer


def format_clarification_response(result: ConfidenceResult, bot_name: str = "Zigi") -> str:
    """
    Format a clarification response for the user.
    
    Args:
        result: ConfidenceResult with clarification questions
        bot_name: Name of the bot for personalization
        
    Returns:
        Formatted clarification message
    """
    if not result.needs_clarification or not result.clarification_questions:
        return ""
    
    # Select the best question (first one)
    question = result.clarification_questions[0]
    
    # Build friendly response
    response_parts = []
    
    # Add appropriate intro based on clarification type
    if result.clarification_type == ClarificationType.PARAMETER_MISSING:
        response_parts.append("I'd love to help! I just need a bit **more information**.")
    elif result.clarification_type == ClarificationType.DOMAIN_CHECK:
        response_parts.append("I want to make sure I can help you **effectively**.")
    elif result.clarification_type == ClarificationType.SCOPE_NARROWING:
        response_parts.append("That's a **great topic**! To give you the best answer:")
    elif result.clarification_type == ClarificationType.WHAT_TYPE:
        response_parts.append("I want to make sure I understand **what you're looking for**.")
    else:
        response_parts.append("Just a quick **clarification** to help me assist you better:")
    
    response_parts.append("")
    
    # Bold the question for emphasis
    # If the question has a bullet list (contains \n), format differently
    if "\n" in question:
        # Split intro and bullets
        parts = question.split("\n", 1)
        response_parts.append(f"**{parts[0]}**\n{parts[1]}")
    else:
        response_parts.append(f"**{question}**")
    
    return "\n".join(response_parts)
