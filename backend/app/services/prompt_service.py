"""Service for managing prompt templates."""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException
import difflib

from ..repositories.prompt_repository import PromptRepository
from ..models.prompt_template import (
    PromptTemplateUpdate,
    PromptTemplateResponse,
    PromptChange,
    PromptTemplateHistory,
    PromptTemplateHistoryResponse,
)


def _compute_diff(old_text: Optional[str], new_text: str) -> tuple[str, str]:
    """
    Compute a human-readable diff between old and new text.
    Returns (removed_lines, added_lines) showing only what changed.
    """
    if old_text is None:
        return ("(none)", f"+ {new_text[:500]}..." if len(new_text) > 500 else f"+ {new_text}")
    
    old_lines = old_text.splitlines(keepends=True)
    new_lines = new_text.splitlines(keepends=True)
    
    diff = list(difflib.unified_diff(old_lines, new_lines, lineterm=''))
    
    if not diff:
        return ("(no changes)", "(no changes)")
    
    removed = []
    added = []
    
    for line in diff:
        if line.startswith('-') and not line.startswith('---'):
            removed.append(line[1:].strip())
        elif line.startswith('+') and not line.startswith('+++'):
            added.append(line[1:].strip())
    
    # Join and truncate if too long
    removed_str = '\n'.join(removed) if removed else "(no removals)"
    added_str = '\n'.join(added) if added else "(no additions)"
    
    # Truncate to reasonable size for storage
    max_length = 1000
    if len(removed_str) > max_length:
        removed_str = removed_str[:max_length] + "... (truncated)"
    if len(added_str) > max_length:
        added_str = added_str[:max_length] + "... (truncated)"
    
    return (removed_str, added_str)


# Default prompts from the original prompts.py
DEFAULT_PROMPTS = {
    "system": """bot:{BOT_NAME}|user:{user_name}|url:{FRONTEND_URL}

CRITICAL: USE MINIMUM TOKENS BY DEFAULT
- 1 word if sufficient
- Brief by default

DEFAULT RESPONSES:
1. Yes/No Q → "Yes." or "No."
2. Classification → "Polygenic." "Dominant." "Recessive."
3. Definition → Max 1 sentence
4. Genetic cross → Punnett square + ratios only
5. Page Q → Link only

WHEN USER ASKS "explain/steps/how/why/detail/complete":
Provide FULL, COMPLETE answer. Don't truncate.
Example: "steps for Aa x aa" → Complete Punnett square + all genotypes + all phenotypes + full ratios

Links: [Traits]({FRONTEND_URL}/studio/browse-traits) [Dashboard]({FRONTEND_URL}/studio) [Profile]({FRONTEND_URL}/studio/profile) [Projects]({FRONTEND_URL}/studio/projects) [Simulation Studio]({FRONTEND_URL}/studio/simulation-studio)

Format: **bold** for genotypes""",

    "system_verbose": """You are {BOT_NAME}, a friendly AI assistant for Zygotrix, an interactive genetics learning platform.

RULES:
1. Match answer length to question type
2. For genetic crosses: show Punnett square and ratios
3. When user asks for steps/explanation: provide detailed steps
4. Use **bold** for genotypes, **bold** for terms
5. Never mention React, TypeScript, API, database
6. When referring to pages, include markdown links using base URL: {FRONTEND_URL}""",

    "simulation": """bot:{BOT_NAME}|user:{user_name}|url:{FRONTEND_URL}

You are a genetics simulation assistant helping {user_name} set up and run genetic crosses in the Simulation Studio.

**CRITICAL: ALWAYS INCLUDE COMMAND BLOCKS**
When the user asks you to perform simulation actions, you MUST include the [COMMAND:...] blocks in your response.
Commands are executed automatically - if you don't include them, nothing happens!

**IMPORTANT: ALWAYS END WITH RUN COMMAND**
If the user asks to "run simulation", "execute", "start simulation", or any similar action, you MUST include [COMMAND:run:{}] as the LAST command.
Even if the user doesn't explicitly say "run", if they're setting up a simulation, ASK if they want to run it and include the command if they confirm.

**SIMULATION CONTROL TOOLS:**
Execute commands using this format: [COMMAND:type:params]

Available Commands:
1. **Add Trait**: [COMMAND:add_trait:{"traitKey":"eye_color"}]
   - Add a genetic trait to the simulation
   - Common trait keys: eye_color, hair_color, blood_type, skin_color, etc.

2. **Add All Traits**: [COMMAND:add_all_traits:{}]
   - Add ALL available traits to the simulation at once
   - Use this when user says "add all traits" or similar

3. **Remove Trait**: [COMMAND:remove_trait:{"traitKey":"eye_color"}]

4. **Randomize Alleles**: [COMMAND:randomize_alleles:{"parent":"both"}]
   - parent: "mother", "father", or "both"

5. **Set Simulation Count**: [COMMAND:set_count:{"count":5000}]
   - Range: 50-5000 offspring

6. **Run Simulation**: [COMMAND:run:{}]
   - Execute the simulation

{simulation_context}

**RESPONSE FORMAT:**
1. Write a brief intro (1-2 sentences max)
2. Include ALL command blocks IMMEDIATELY
3. Brief confirmation after commands

**EXAMPLE:**
User: "Add eye color, randomize, and run 1000 simulations"

Response:
"Setting up your simulation now!

[COMMAND:add_trait:{"traitKey":"eye_color"}]
[COMMAND:randomize_alleles:{"parent":"both"}]
[COMMAND:set_count:{"count":1000}]
[COMMAND:run:{}]

Done! Check the results panel for the offspring distribution."

**EXAMPLE 2:**
User: "Add all available traits and run simulation"

Response:
"Adding all traits to your simulation!

[COMMAND:add_all_traits:{}]
[COMMAND:randomize_alleles:{"parent":"both"}]
[COMMAND:run:{}]

All traits added and simulation running!"

**REMEMBER**:
- ALWAYS include [COMMAND:run:{}] when user says "run", "execute", "start" or similar
- Commands execute in order, so run MUST be LAST
- No command = no action taken

Format: **bold** for genotypes, `code` for gene/allele IDs"""
}

DEFAULT_DESCRIPTIONS = {
    "system": "Main system prompt for the chatbot (token-efficient)",
    "system_verbose": "Verbose system prompt (legacy fallback)",
    "simulation": "System prompt with simulation tool capabilities"
}


repository = PromptRepository()


def get_prompt_history_collection(required: bool = False):
    """Get prompt_history collection from MongoDB."""
    from .common import get_mongo_client, get_settings

    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(
                status_code=503,
                detail="MongoDB client not available"
            )
        return None

    settings = get_settings()
    db = client[settings.mongodb_db_name]
    collection = db["prompt_history"]

    # Create indexes
    try:
        collection.create_index("timestamp", background=True)
        collection.create_index("updated_by", background=True)
        collection.create_index("prompt_type", background=True)
    except Exception:
        pass  # Indexes may already exist

    return collection


def _log_prompt_change(
    prompt_type: str,
    action: str,  # "update" or "reset"
    admin_user_id: str,
    admin_user_name: Optional[str] = None,
    admin_user_email: Optional[str] = None,
    changes: Optional[List[PromptChange]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log prompt changes to history collection."""
    try:
        history_collection = get_prompt_history_collection(required=False)
        if history_collection is None:
            return  # Can't log if MongoDB not available

        history_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "prompt_type": prompt_type,
            "action": action,
            "updated_by": admin_user_id,
            "updated_by_name": admin_user_name,
            "updated_by_email": admin_user_email,
            "changes": [change.model_dump() for change in changes] if changes else [],
            "ip_address": ip_address,
            "user_agent": user_agent
        }

        history_collection.insert_one(history_entry)
    except Exception as e:
        # Don't fail the main operation if logging fails
        print(f"Failed to log prompt change: {e}")


def get_all_prompts() -> List[PromptTemplateResponse]:
    """Get all prompt templates from database."""
    prompts = repository.find_all()
    return [
        PromptTemplateResponse(
            id=str(prompt["_id"]),
            prompt_type=prompt["prompt_type"],
            prompt_content=prompt["prompt_content"],
            description=prompt.get("description"),
            is_active=prompt.get("is_active", True),
            created_at=prompt["created_at"],
            updated_at=prompt["updated_at"],
            updated_by=prompt.get("updated_by"),
        )
        for prompt in prompts
    ]


def get_prompt_by_type(prompt_type: str) -> Optional[PromptTemplateResponse]:
    """Get a specific prompt template by type."""
    prompt = repository.find_by_type(prompt_type)
    if not prompt:
        return None

    return PromptTemplateResponse(
        id=str(prompt["_id"]),
        prompt_type=prompt["prompt_type"],
        prompt_content=prompt["prompt_content"],
        description=prompt.get("description"),
        is_active=prompt.get("is_active", True),
        created_at=prompt["created_at"],
        updated_at=prompt["updated_at"],
        updated_by=prompt.get("updated_by"),
    )


def update_prompt(
    prompt_type: str,
    prompt_update: PromptTemplateUpdate,
    admin_user_id: str,
    admin_user_name: Optional[str] = None,
    admin_user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Optional[PromptTemplateResponse]:
    """Update a prompt template with audit logging."""
    # Get current prompt for change tracking
    current_prompt = repository.find_by_type(prompt_type)
    
    # Track changes
    changes = []
    
    if current_prompt:
        # Check content change
        if prompt_update.prompt_content and prompt_update.prompt_content != current_prompt.get("prompt_content"):
            removed, added = _compute_diff(
                current_prompt.get("prompt_content"),
                prompt_update.prompt_content
            )
            changes.append(PromptChange(
                field_name="prompt_content",
                old_value=f"Removed:\n{removed}",
                new_value=f"Added:\n{added}"
            ))
        
        # Check description change
        if prompt_update.description is not None and prompt_update.description != current_prompt.get("description"):
            changes.append(PromptChange(
                field_name="description",
                old_value=current_prompt.get("description"),
                new_value=prompt_update.description
            ))
        
        # Check is_active change
        if prompt_update.is_active is not None and prompt_update.is_active != current_prompt.get("is_active", True):
            changes.append(PromptChange(
                field_name="is_active",
                old_value=str(current_prompt.get("is_active", True)),
                new_value=str(prompt_update.is_active)
            ))
    else:
        # New prompt being created
        changes.append(PromptChange(
            field_name="prompt_content",
            old_value="(none)",
            new_value=f"New prompt created ({len(prompt_update.prompt_content)} chars)"
        ))

    update_data = {
        "prompt_content": prompt_update.prompt_content,
        "updated_by": admin_user_id,
    }

    if prompt_update.description is not None:
        update_data["description"] = prompt_update.description

    if prompt_update.is_active is not None:
        update_data["is_active"] = prompt_update.is_active

    # Use upsert to create if doesn't exist
    success = repository.upsert_prompt(prompt_type, update_data)

    if not success:
        return None

    # Log the change to audit history
    if changes:
        _log_prompt_change(
            prompt_type=prompt_type,
            action="update",
            admin_user_id=admin_user_id,
            admin_user_name=admin_user_name,
            admin_user_email=admin_user_email,
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent
        )

    return get_prompt_by_type(prompt_type)


def reset_to_default(
    prompt_type: str,
    admin_user_id: str,
    admin_user_name: Optional[str] = None,
    admin_user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """Reset a prompt template to its default value with audit logging."""
    if prompt_type not in DEFAULT_PROMPTS:
        return False

    # Get current content before reset for audit logging
    current_prompt = repository.find_by_type(prompt_type)
    old_content = current_prompt.get("prompt_content") if current_prompt else None

    update_data = {
        "prompt_content": DEFAULT_PROMPTS[prompt_type],
        "description": DEFAULT_DESCRIPTIONS.get(prompt_type),
        "is_active": True,
        "updated_by": admin_user_id,
    }

    success = repository.upsert_prompt(prompt_type, update_data)

    if success:
        # Compute diff to show only what changed
        removed, added = _compute_diff(old_content, DEFAULT_PROMPTS[prompt_type])
        
        # Log the reset to audit history with diff
        changes = [
            PromptChange(
                field_name="prompt_content",
                old_value=f"Removed:\n{removed}",
                new_value=f"Added:\n{added}"
            )
        ]
        _log_prompt_change(
            prompt_type=prompt_type,
            action="reset",
            admin_user_id=admin_user_id,
            admin_user_name=admin_user_name,
            admin_user_email=admin_user_email,
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent
        )

    return success


def get_prompt_history(
    prompt_type: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
) -> PromptTemplateHistoryResponse:
    """
    Get prompt change history.

    Args:
        prompt_type: Optional filter by prompt type
        limit: Maximum number of history entries to return
        skip: Number of entries to skip (for pagination)

    Returns:
        PromptTemplateHistoryResponse with history entries
    """
    history_collection = get_prompt_history_collection(required=False)

    if history_collection is None:
        return PromptTemplateHistoryResponse(history=[], total_count=0)

    try:
        # Build query filter
        query = {}
        if prompt_type:
            query["prompt_type"] = prompt_type

        # Get total count
        total_count = history_collection.count_documents(query)

        # Get history entries, sorted by timestamp descending
        cursor = history_collection.find(query).sort("timestamp", -1).skip(skip).limit(limit)

        history_entries = []
        for doc in cursor:
            # Remove MongoDB _id field
            doc.pop("_id", None)
            history_entries.append(PromptTemplateHistory(**doc))

        return PromptTemplateHistoryResponse(
            history=history_entries,
            total_count=total_count
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch prompt history: {str(e)}"
        )


def get_prompt_content(prompt_type: str) -> str:
    """Get the content of a prompt template. Returns default if not found in DB."""
    prompt = repository.find_by_type(prompt_type)

    if prompt and prompt.get("is_active", True):
        return prompt["prompt_content"]

    # Return default if not found or inactive
    return DEFAULT_PROMPTS.get(prompt_type, "")


def initialize_default_prompts():
    """Initialize database with default prompts if they don't exist."""
    for prompt_type, content in DEFAULT_PROMPTS.items():
        existing = repository.find_by_type(prompt_type)
        if not existing:
            repository.create_prompt({
                "prompt_type": prompt_type,
                "prompt_content": content,
                "description": DEFAULT_DESCRIPTIONS.get(prompt_type),
                "is_active": True,
                "updated_by": "system"
            })
