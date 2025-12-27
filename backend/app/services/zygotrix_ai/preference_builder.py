"""
Preference-Based System Prompt Builder.

Builds customized system prompts based on user preferences for:
- Communication style (simple, technical, conversational)
- Answer length (brief, balanced, detailed)
- Teaching aids (examples, analogies, step-by-step, real-world)
- Visual aids (diagrams, lists, tables)
"""

from typing import Optional
from ...schema.zygotrix_ai import ChatPreferences


def build_preference_instructions(preferences: ChatPreferences) -> str:
    """
    Build system prompt instructions based on user preferences.

    Args:
        preferences: User's ChatPreferences

    Returns:
        Formatted instruction string to append to system prompt
    """
    if not preferences:
        return ""

    instructions = []

    # Communication Style
    if preferences.communication_style == "simple":
        instructions.append(
            "- Use simple, everyday language without jargon or technical terms"
        )
    elif preferences.communication_style == "technical":
        instructions.append(
            "- Use precise scientific terminology and technical language"
        )
    elif preferences.communication_style == "conversational":
        instructions.append(
            "- Use a conversational, friendly tone that's easy to understand"
        )

    # Answer Length
    if preferences.answer_length == "brief":
        instructions.append(
            "- Keep answers concise and to-the-point, focusing on key information"
        )
    elif preferences.answer_length == "detailed":
        instructions.append(
            "- Provide comprehensive, thorough explanations with extensive detail"
        )
    elif preferences.answer_length == "balanced":
        instructions.append(
            "- Provide balanced answers that are neither too brief nor overly detailed"
        )

    # Teaching Aids
    if preferences.teaching_aids:
        if "examples" in preferences.teaching_aids:
            instructions.append(
                "- Include practical examples to illustrate concepts"
            )
        if "real_world" in preferences.teaching_aids:
            instructions.append(
                "- Provide real-world applications and use cases"
            )
        if "analogies" in preferences.teaching_aids:
            instructions.append(
                "- Use analogies and comparisons to explain complex ideas"
            )
        if "step_by_step" in preferences.teaching_aids:
            instructions.append(
                "- Break down processes into clear step-by-step instructions"
            )

    # Visual Aids
    if preferences.visual_aids:
        if "lists" in preferences.visual_aids:
            instructions.append(
                "- Use bullet points and numbered lists to organize information"
            )
        if "tables" in preferences.visual_aids:
            instructions.append(
                "- Use tables for comparisons and structured data presentation"
            )
        if "diagrams" in preferences.visual_aids:
            instructions.append(
                "- Describe visual representations and diagrams when helpful"
            )

    # Build the final instruction block
    if instructions:
        instruction_text = "\n".join(instructions)
        return f"""

## User Response Preferences

Based on this user's preferences, please follow these guidelines:

{instruction_text}

These are the user's preferred communication style - adjust your responses accordingly while maintaining accuracy and helpfulness."""

    return ""


def enhance_system_prompt(base_prompt: str, preferences: Optional[ChatPreferences]) -> str:
    """
    Enhance a base system prompt with user preference instructions.

    Args:
        base_prompt: The base system prompt
        preferences: User's ChatPreferences (optional)

    Returns:
        Enhanced system prompt with preference instructions
    """
    if not preferences:
        return base_prompt

    preference_instructions = build_preference_instructions(preferences)

    if preference_instructions:
        return f"{base_prompt}{preference_instructions}"

    return base_prompt


def get_preference_summary(preferences: ChatPreferences) -> str:
    """
    Get a human-readable summary of active preferences.

    Args:
        preferences: User's ChatPreferences

    Returns:
        Human-readable preference summary
    """
    if not preferences:
        return "Default preferences (conversational, balanced)"

    parts = []

    # Communication style
    parts.append(preferences.communication_style or "conversational")

    # Answer length
    parts.append(preferences.answer_length or "balanced")

    # Teaching aids
    if preferences.teaching_aids:
        parts.append(f"with {', '.join(preferences.teaching_aids)}")

    # Visual aids
    if preferences.visual_aids:
        parts.append(f"using {', '.join(preferences.visual_aids)}")

    return ", ".join(parts)
