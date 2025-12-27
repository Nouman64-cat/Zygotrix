"""
Preference Detection Service.

Analyzes user messages to detect preference signals and automatically
learn user preferences over time.

Detects signals for:
- Answer length (brief, detailed)
- Communication style (simple, technical)
- Teaching aids (examples, analogies, step-by-step)
- Visual aids (lists, tables, diagrams)
"""

import re
import logging
from typing import Dict, List, Tuple, Optional
from anthropic import AsyncAnthropic
import os

from ...schema.zygotrix_ai import ChatPreferences
from ...schema.auth import UserPreferencesUpdate

logger = logging.getLogger(__name__)


# =============================================================================
# PREFERENCE DETECTION PATTERNS
# =============================================================================

class PreferencePatterns:
    """Regex patterns for detecting preference signals in user messages."""

    # Answer Length Patterns
    DETAILED_PATTERNS = [
        r'\b(more detail|elaborate|thorough|comprehensive|in depth|extensively)\b',
        r'\b(tell me more|explain more|give me more)\b',
        r'\b(full explanation|complete explanation|detailed explanation)\b',
        r'\b(expand on|go deeper|dive deeper)\b',
    ]

    BRIEF_PATTERNS = [
        r'\b(be brief|be concise|short answer|quick answer|quickly)\b',
        r'\b(just (the|a) (key points|main points|summary|basics))\b',
        r'\b(tldr|tl;dr|in short|in brief)\b',
        r'\b(summarize|sum up|bottom line)\b',
    ]

    # Communication Style Patterns
    SIMPLE_PATTERNS = [
        r'\b(simple (terms|language|words)|simpler|simplified)\b',
        r'\b(easy to understand|easier to understand|layman\'?s terms)\b',
        r'\b(explain like (i\'?m|im) (5|five|a child))\b',
        r'\b(without jargon|no jargon|avoid jargon)\b',
        r'\b(plain english|everyday language)\b',
    ]

    TECHNICAL_PATTERNS = [
        r'\b(technical (terms|details|language)|technically)\b',
        r'\b(scientific (terms|explanation|language))\b',
        r'\b(precise|accuracy|accurate|specific)\b',
        r'\b(professional|formal)\b',
    ]

    # Teaching Aids Patterns
    EXAMPLES_PATTERNS = [
        r'\b(give (me )?(an )?example|show (me )?(an )?example|for example)\b',
        r'\b(such as|like what|for instance)\b',
        r'\b(demonstrate|show me how)\b',
        r'\b(can you (give|show|provide) examples?)\b',
    ]

    REAL_WORLD_PATTERNS = [
        r'\b(real world|real-world|in reality|in practice)\b',
        r'\b(practical (application|example|use))\b',
        r'\b(how (is|does) (this|it) (used|work) in)\b',
        r'\b(apply to|application in)\b',
    ]

    ANALOGIES_PATTERNS = [
        r'\b((use|give) (an )?analog(y|ies)|compare (to|with))\b',
        r'\b(like (a|what)|similar to|it\'?s like)\b',
        r'\b(metaphor|comparison)\b',
        r'\b(think of it (as|like))\b',
    ]

    STEP_BY_STEP_PATTERNS = [
        r'\b(step by step|step-by-step)\b',
        r'\b(walk me through|guide me through)\b',
        r'\b(break (it )?down|breakdown)\b',
        r'\b(one (step|thing) at a time)\b',
        r'\b(how do (i|you))\b',
    ]

    # Visual Aids Patterns
    LISTS_PATTERNS = [
        r'\b(list|bullet points?|numbered list)\b',
        r'\b(point by point)\b',
    ]

    TABLES_PATTERNS = [
        r'\b(table|tabular|in a table)\b',
        r'\b(compare|comparison|side by side)\b',
    ]

    DIAGRAMS_PATTERNS = [
        r'\b(diagram|visual|visualize|draw)\b',
        r'\b(show (me )?visually)\b',
    ]


# =============================================================================
# PATTERN MATCHER
# =============================================================================

class PatternMatcher:
    """Matches user messages against preference patterns."""

    def __init__(self):
        self.patterns = PreferencePatterns()

    def match_patterns(self, text: str, pattern_list: List[str]) -> bool:
        """Check if text matches any pattern in the list."""
        text_lower = text.lower()
        for pattern in pattern_list:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return True
        return False

    def detect_signals(self, message: str) -> Dict[str, bool]:
        """
        Detect all preference signals in a message.

        Args:
            message: User's message text

        Returns:
            Dictionary of detected signals (signal_name: True/False)
        """
        signals = {
            # Answer length
            'detailed': self.match_patterns(message, self.patterns.DETAILED_PATTERNS),
            'brief': self.match_patterns(message, self.patterns.BRIEF_PATTERNS),

            # Communication style
            'simple': self.match_patterns(message, self.patterns.SIMPLE_PATTERNS),
            'technical': self.match_patterns(message, self.patterns.TECHNICAL_PATTERNS),

            # Teaching aids
            'examples': self.match_patterns(message, self.patterns.EXAMPLES_PATTERNS),
            'real_world': self.match_patterns(message, self.patterns.REAL_WORLD_PATTERNS),
            'analogies': self.match_patterns(message, self.patterns.ANALOGIES_PATTERNS),
            'step_by_step': self.match_patterns(message, self.patterns.STEP_BY_STEP_PATTERNS),

            # Visual aids
            'lists': self.match_patterns(message, self.patterns.LISTS_PATTERNS),
            'tables': self.match_patterns(message, self.patterns.TABLES_PATTERNS),
            'diagrams': self.match_patterns(message, self.patterns.DIAGRAMS_PATTERNS),
        }

        return signals


# =============================================================================
# AI-BASED PREFERENCE ANALYZER
# =============================================================================

class AIPreferenceAnalyzer:
    """Uses Claude to analyze messages for preference signals."""

    ANALYSIS_PROMPT = """Analyze this user message to detect preference signals for how they want AI to respond.

User message: "{message}"

Detect if the user is requesting any of these preferences:

**Answer Length:**
- detailed: Wants comprehensive, thorough explanations
- brief: Wants concise, to-the-point answers

**Communication Style:**
- simple: Wants everyday language, no jargon
- technical: Wants scientific terminology, precise language

**Teaching Aids:**
- examples: Wants practical examples
- real_world: Wants real-world applications
- analogies: Wants comparisons and metaphors
- step_by_step: Wants step-by-step breakdowns

**Visual Aids:**
- lists: Wants bullet points or numbered lists
- tables: Wants tables for comparisons
- diagrams: Wants visual representations

Respond ONLY with a JSON object listing detected signals (confidence 0.0-1.0):
{{"detailed": 0.9, "examples": 0.8, "simple": 0.7}}

If no clear signals detected, return: {{}}"""

    def __init__(self, model: Optional[str] = None):
        """
        Initialize AI analyzer.

        Args:
            model: Claude model to use (from chatbot settings)
        """
        api_key = os.getenv("CLAUDE_API_KEY")
        if not api_key:
            raise ValueError("CLAUDE_API_KEY not found in environment")

        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model or os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307")

    async def analyze_message(self, message: str) -> Dict[str, float]:
        """
        Analyze message using AI to detect preference signals.

        Args:
            message: User's message

        Returns:
            Dict of signal -> confidence (0.0-1.0)
        """
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=200,
                temperature=0,
                messages=[{
                    "role": "user",
                    "content": self.ANALYSIS_PROMPT.format(message=message[:500])
                }]
            )

            # Parse JSON response
            import json
            result_text = response.content[0].text.strip()

            # Extract JSON (in case there's extra text)
            json_start = result_text.find('{')
            json_end = result_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                result_text = result_text[json_start:json_end]

            signals = json.loads(result_text)
            logger.debug(f"AI detected signals: {signals}")

            return signals

        except Exception as e:
            logger.error(f"AI preference analysis failed: {e}")
            return {}


# =============================================================================
# PREFERENCE SCORER
# =============================================================================

class PreferenceScorer:
    """Maintains and updates preference scores over time."""

    # Score thresholds
    ACTIVATION_THRESHOLD = 50  # Score > 50 = preference is active
    MAX_SCORE = 100
    MIN_SCORE = 0

    # Score changes
    SIGNAL_INCREMENT = 10  # +10 for each detected signal
    DECAY_RATE = 0.95  # 5% decay per week (not implemented yet)

    def __init__(self, current_scores: Optional[Dict[str, int]] = None):
        """
        Initialize scorer with current scores.

        Args:
            current_scores: Current preference scores (default: all zeros)
        """
        self.scores = current_scores or self._get_default_scores()

    def _get_default_scores(self) -> Dict[str, int]:
        """Get default scores (all zeros)."""
        return {
            'detailed': 0,
            'brief': 0,
            'simple': 0,
            'technical': 0,
            'examples': 0,
            'real_world': 0,
            'analogies': 0,
            'step_by_step': 0,
            'lists': 0,
            'tables': 0,
            'diagrams': 0,
        }

    def update_scores(self, signals: Dict[str, bool]) -> Dict[str, int]:
        """
        Update scores based on detected signals.

        Args:
            signals: Dict of signal_name -> detected (True/False)

        Returns:
            Updated scores
        """
        for signal, detected in signals.items():
            if signal in self.scores and detected:
                # Increment score
                self.scores[signal] = min(
                    self.scores[signal] + self.SIGNAL_INCREMENT,
                    self.MAX_SCORE
                )
                logger.debug(f"Incremented {signal} score to {self.scores[signal]}")

        return self.scores

    def get_active_preferences(self) -> ChatPreferences:
        """
        Convert scores to active preferences.

        Returns:
            ChatPreferences with active preferences
        """
        # Determine communication style (highest score wins)
        comm_score = {
            'simple': self.scores.get('simple', 0),
            'technical': self.scores.get('technical', 0),
        }
        comm_style = max(comm_score, key=comm_score.get) if max(comm_score.values()) > self.ACTIVATION_THRESHOLD else 'conversational'

        # Determine answer length (highest score wins)
        length_score = {
            'brief': self.scores.get('brief', 0),
            'detailed': self.scores.get('detailed', 0),
        }
        answer_length = max(length_score, key=length_score.get) if max(length_score.values()) > self.ACTIVATION_THRESHOLD else 'balanced'

        # Get active teaching aids
        teaching_aids = [
            aid for aid in ['examples', 'real_world', 'analogies', 'step_by_step']
            if self.scores.get(aid, 0) > self.ACTIVATION_THRESHOLD
        ]

        # Get active visual aids
        visual_aids = [
            aid for aid in ['diagrams', 'lists', 'tables']
            if self.scores.get(aid, 0) > self.ACTIVATION_THRESHOLD
        ]

        return ChatPreferences(
            communication_style=comm_style,
            answer_length=answer_length,
            teaching_aids=teaching_aids,
            visual_aids=visual_aids
        )


# =============================================================================
# MAIN PREFERENCE DETECTOR
# =============================================================================

class PreferenceDetector:
    """
    Main service for detecting and learning user preferences.

    Combines pattern matching and AI analysis to detect preference signals.
    """

    def __init__(self, model: Optional[str] = None, use_ai: bool = True):
        """
        Initialize preference detector.

        Args:
            model: Claude model for AI analysis
            use_ai: Whether to use AI analysis (fallback to patterns only)
        """
        self.pattern_matcher = PatternMatcher()
        self.use_ai = use_ai
        self.ai_analyzer = AIPreferenceAnalyzer(model) if use_ai else None

    async def detect_preferences(
        self,
        message: str,
        confidence_threshold: float = 0.7
    ) -> Dict[str, bool]:
        """
        Detect preference signals in a user message.

        Args:
            message: User's message
            confidence_threshold: Minimum confidence for AI signals (0.0-1.0)

        Returns:
            Dict of detected signals
        """
        # Start with pattern-based detection
        signals = self.pattern_matcher.detect_signals(message)

        # Enhance with AI if enabled
        if self.use_ai and self.ai_analyzer:
            try:
                ai_signals = await self.ai_analyzer.analyze_message(message)

                # Merge AI signals (if confidence > threshold)
                for signal, confidence in ai_signals.items():
                    if confidence >= confidence_threshold:
                        signals[signal] = True
                        logger.debug(f"AI confirmed signal '{signal}' (confidence: {confidence:.2f})")

            except Exception as e:
                logger.warning(f"AI analysis failed, using pattern-only: {e}")

        # Log detected signals
        detected = [s for s, v in signals.items() if v]
        if detected:
            logger.info(f"Detected preference signals: {', '.join(detected)}")

        return signals

    def should_update_preferences(
        self,
        signals: Dict[str, bool],
        current_scores: Dict[str, int]
    ) -> bool:
        """
        Determine if preferences should be updated based on signals.

        Args:
            signals: Detected signals
            current_scores: Current preference scores

        Returns:
            True if preferences should be updated
        """
        # Update if any signal detected
        any_signal = any(signals.values())

        if any_signal:
            logger.debug("Update recommended: signals detected")

        return any_signal


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def analyze_user_message(
    message: str,
    model: Optional[str] = None
) -> Dict[str, bool]:
    """
    Convenience function to analyze a user message.

    Args:
        message: User's message
        model: Claude model to use

    Returns:
        Detected preference signals
    """
    detector = PreferenceDetector(model=model)
    return await detector.detect_preferences(message)


def calculate_preference_update(
    signals: Dict[str, bool],
    current_scores: Optional[Dict[str, int]] = None
) -> Tuple[Dict[str, int], ChatPreferences]:
    """
    Calculate preference updates based on signals.

    Args:
        signals: Detected signals
        current_scores: Current preference scores

    Returns:
        Tuple of (updated_scores, updated_preferences)
    """
    scorer = PreferenceScorer(current_scores)
    updated_scores = scorer.update_scores(signals)
    updated_preferences = scorer.get_active_preferences()

    return updated_scores, updated_preferences
