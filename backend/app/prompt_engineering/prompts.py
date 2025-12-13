"""Prompt templates for the Zygotrix chatbot using TOON format for token efficiency."""
import os
from dotenv import load_dotenv, find_dotenv

# Load environment variables before reading them
load_dotenv(find_dotenv())

# Get bot name from environment variable, fallback to "Zigi"
BOT_NAME = os.getenv("ZYGOTRIX_BOT_NAME", "Zigi")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

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
    """
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
    """
    return f"""You are {BOT_NAME}, a friendly AI assistant for Zygotrix, an interactive genetics learning platform.

RULES:
1. Match answer length to question type
2. For genetic crosses: show Punnett square and ratios
3. When user asks for steps/explanation: provide detailed steps
4. Use **bold** for genotypes, **bold** for terms
5. Never mention React, TypeScript, API, database
6. When referring to pages, include markdown links using base URL: {FRONTEND_URL}"""


# For backwards compatibility - dynamic prompt
def get_zigi_system_prompt() -> str:
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
