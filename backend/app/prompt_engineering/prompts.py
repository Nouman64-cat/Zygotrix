"""Prompt templates for the Zygotrix chatbot using TOON format for token efficiency."""
import os
from dotenv import load_dotenv, find_dotenv

# Load environment variables before reading them
load_dotenv(find_dotenv())

# Get bot name from environment variable, fallback to "Zigi"
BOT_NAME = os.getenv("ZYGOTRIX_BOT_NAME", "Zigi")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Import prompt service for database access
try:
    from app.services import prompt_service
    PROMPTS_FROM_DB = True
except ImportError:
    PROMPTS_FROM_DB = False

# Page routes mapping for link generation
PAGE_ROUTES = {
    "Browse Traits": "/studio/browse-traits",
    "Traits": "/studio/browse-traits",
    "Dashboard": "/studio",
    "Home": "/studio",
    "Profile": "/studio/profile",
    "Settings": "/studio/settings",
    "Projects": "/studio/projects",
    "Simulation Studio": "/studio/simulation-studio",
    "Protein Fold Generation": "/studio/protein-fold-generation",
}

def get_page_links_section() -> str:
    """Generate the page links section for the prompt."""
    links = []
    for name, path in PAGE_ROUTES.items():
        links.append(f"- {name}: {FRONTEND_URL}{path}")
    return "\n".join(links)


def get_system_prompt(user_name: str) -> str:
    """
    Generate the system prompt with configurable bot name.
    Optimized for MINIMAL token usage in responses.
    Fetches from database if available, otherwise uses default.
    """
    # Try to get from database first
    if PROMPTS_FROM_DB:
        try:
            db_prompt = prompt_service.get_prompt_content("system")
            if db_prompt:
                # Replace placeholders
                return db_prompt.format(
                    BOT_NAME=BOT_NAME,
                    user_name=user_name,
                    FRONTEND_URL=FRONTEND_URL
                )
        except Exception as e:
            print(f"Warning: Could not fetch prompt from database: {e}")

    # Fallback to default
    return f"""bot:{BOT_NAME}|user:{user_name}|url:{FRONTEND_URL}

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

Format: **bold** for genotypes"""


def get_system_prompt_verbose(user_name: str) -> str:
    """
    Legacy verbose prompt - kept for fallback.
    Fetches from database if available, otherwise uses default.
    """
    # Try to get from database first
    if PROMPTS_FROM_DB:
        try:
            db_prompt = prompt_service.get_prompt_content("system_verbose")
            if db_prompt:
                # Replace placeholders
                return db_prompt.format(
                    BOT_NAME=BOT_NAME,
                    user_name=user_name,
                    FRONTEND_URL=FRONTEND_URL
                )
        except Exception as e:
            print(f"Warning: Could not fetch verbose prompt from database: {e}")

    # Fallback to default
    return f"""You are {BOT_NAME}, a friendly AI assistant for Zygotrix, an interactive genetics learning platform.

RULES:
1. Match answer length to question type
2. For genetic crosses: show Punnett square and ratios
3. When user asks for steps/explanation: provide detailed steps
4. Use **bold** for genotypes, **bold** for terms
5. Never mention React, TypeScript, API, database
6. When referring to pages, include markdown links using base URL: {FRONTEND_URL}"""


# For backwards compatibility - dynamic prompt (now fetches from DB)
def get_zigi_system_prompt() -> str:
    """
    Get the main system prompt.
    Fetches from database if available, otherwise uses default.
    """
    # Try to get from database first
    if PROMPTS_FROM_DB:
        try:
            db_prompt = prompt_service.get_prompt_content("system")
            if db_prompt:
                # Replace placeholders
                return db_prompt.format(
                    BOT_NAME=BOT_NAME,
                    user_name="user",  # Generic fallback
                    FRONTEND_URL=FRONTEND_URL
                )
        except Exception as e:
            print(f"Warning: Could not fetch system prompt from database: {e}")

    # Fallback to default
    return f"""bot:{BOT_NAME}|url:{FRONTEND_URL}

CRITICAL: MINIMAL OUTPUT BY DEFAULT

DEFAULT:
1. Yes/No → "Yes." "No."
2. Classification → "Polygenic." "Dominant."
3. Cross → Punnett square + ratios only
4. Page → Link only

WHEN "explain/steps/how/why/detail/complete":
Provide FULL, COMPLETE answer. Don't truncate.

Links: [Traits]({FRONTEND_URL}/studio/browse-traits) [Dashboard]({FRONTEND_URL}/studio) [Profile]({FRONTEND_URL}/studio/profile) [Projects]({FRONTEND_URL}/portal/projects) [Simulation Studio]({FRONTEND_URL}/studio/simulation-studio)

Format: **bold** for genotypes"""


# Static version for backwards compatibility (will use default localhost URL)
ZIGI_SYSTEM_PROMPT = get_zigi_system_prompt()


def get_simulation_tool_prompt(user_name: str, simulation_context: str = "") -> str:
    """
    Generate system prompt with simulation tool capabilities.
    This prompt enables the chatbot to control simulations through structured commands.
    Fetches from database if available, otherwise uses default.
    """
    # Try to get from database first
    if PROMPTS_FROM_DB:
        try:
            db_prompt = prompt_service.get_prompt_content("simulation")
            if db_prompt:
                # Replace placeholders
                return db_prompt.format(
                    BOT_NAME=BOT_NAME,
                    user_name=user_name,
                    FRONTEND_URL=FRONTEND_URL,
                    simulation_context=simulation_context
                )
        except Exception as e:
            print(f"Warning: Could not fetch simulation prompt from database: {e}")

    # Fallback to default
    return f"""bot:{BOT_NAME}|user:{user_name}|url:{FRONTEND_URL}

You are a genetics simulation assistant helping {user_name} set up and run genetic crosses in the Simulation Studio.

**CRITICAL: ALWAYS INCLUDE COMMAND BLOCKS**
When the user asks you to perform simulation actions, you MUST include the [COMMAND:...] blocks in your response.
Commands are executed automatically - if you don't include them, nothing happens!

**IMPORTANT: ALWAYS END WITH RUN COMMAND**
If the user asks to "run simulation", "execute", "start simulation", or any similar action, you MUST include [COMMAND:run:{{}}] as the LAST command.
Even if the user doesn't explicitly say "run", if they're setting up a simulation, ASK if they want to run it and include the command if they confirm.

**SIMULATION CONTROL TOOLS:**
Execute commands using this format: [COMMAND:type:params]

Available Commands:
1. **Add Trait**: [COMMAND:add_trait:{{"traitKey":"eye_color"}}]
   - Add a genetic trait to the simulation
   - Common trait keys: eye_color, hair_color, blood_type, skin_color, etc.

2. **Add All Traits**: [COMMAND:add_all_traits:{{}}]
   - Add ALL available traits to the simulation at once
   - Use this when user says "add all traits" or similar

3. **Remove Trait**: [COMMAND:remove_trait:{{"traitKey":"eye_color"}}]

4. **Randomize Alleles**: [COMMAND:randomize_alleles:{{"parent":"both"}}]
   - parent: "mother", "father", or "both"

5. **Set Simulation Count**: [COMMAND:set_count:{{"count":5000}}]
   - Range: 50-5000 offspring

6. **Run Simulation**: [COMMAND:run:{{}}]
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

[COMMAND:add_trait:{{"traitKey":"eye_color"}}]
[COMMAND:randomize_alleles:{{"parent":"both"}}]
[COMMAND:set_count:{{"count":1000}}]
[COMMAND:run:{{}}]

Done! Check the results panel for the offspring distribution."

**EXAMPLE 2:**
User: "Add all available traits and run simulation"

Response:
"Adding all traits to your simulation!

[COMMAND:add_all_traits:{{}}]
[COMMAND:randomize_alleles:{{"parent":"both"}}]
[COMMAND:run:{{}}]

All traits added and simulation running!"

**EXAMPLE 3:**
User: "Add all traits, randomize alleles, set simulation count to 3232 and run the simulation"

Response:
"Setting up your complete simulation!

[COMMAND:add_all_traits:{{}}]
[COMMAND:randomize_alleles:{{"parent":"both"}}]
[COMMAND:set_count:{{"count":3232}}]
[COMMAND:run:{{}}]

Perfect! All traits added, alleles randomized, count set to 3232, and simulation is now running!"

**REMEMBER**:
- ALWAYS include [COMMAND:run:{{}}] when user says "run", "execute", "start" or similar
- Commands execute in order, so run MUST be LAST
- No command = no action taken

Format: **bold** for genotypes, `code` for gene/allele IDs"""

