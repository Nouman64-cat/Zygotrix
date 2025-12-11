"""Chatbot API routes for LlamaCloud and Claude AI integration."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import logging
import os
import re
from dotenv import load_dotenv, find_dotenv


load_dotenv(find_dotenv())

from ..prompt_engineering.prompts import ZIGI_SYSTEM_PROMPT
from ..chatbot_tools import get_traits_count, search_traits, get_trait_details

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# Configuration - API keys from environment variables
LLAMA_CLOUD_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")
LLAMA_CLOUD_BASE_URL = "https://api.cloud.eu.llamaindex.ai"
LLAMA_CLOUD_INDEX_NAME = "Zygotrix"
LLAMA_CLOUD_ORG_ID = "7e4d6187-f46d-4435-a999-768d5c727cf1"
LLAMA_CLOUD_PROJECT_NAME = "Default"

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307")

# Debug logging - show if keys are loaded (masked for security)
logger.info(f"CLAUDE_API_KEY loaded: {'Yes' if CLAUDE_API_KEY else 'No'} (first 10 chars: {CLAUDE_API_KEY[:10] if CLAUDE_API_KEY else 'None'}...)")
logger.info(f"LLAMA_CLOUD_API_KEY loaded: {'Yes' if LLAMA_CLOUD_API_KEY else 'No'}")

# Cache the pipeline ID to avoid repeated lookups
_cached_pipeline_id: str | None = None

class PageContext(BaseModel):
    pageName: str
    description: str
    features: list[str]


class ChatRequest(BaseModel):
    message: str
    pageContext: PageContext | None = None
    userName: str | None = None


class ChatResponse(BaseModel):
    response: str


async def get_pipeline_id() -> str | None:
    """Get the pipeline ID from LlamaCloud by looking up the pipeline by name."""
    global _cached_pipeline_id
    
    if _cached_pipeline_id:
        return _cached_pipeline_id
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # List all pipelines and find the one with our name
            response = await client.get(
                f"{LLAMA_CLOUD_BASE_URL}/api/v1/pipelines",
                headers={
                    "Accept": "application/json",
                    "Authorization": f"Bearer {LLAMA_CLOUD_API_KEY}",
                },
                params={
                    "project_name": LLAMA_CLOUD_PROJECT_NAME,
                    "pipeline_name": LLAMA_CLOUD_INDEX_NAME,
                }
            )
            
            logger.info(f"Pipeline lookup response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Failed to list pipelines: {response.status_code} - {response.text}")
                return None
            
            data = response.json()
            logger.info(f"Pipeline lookup response: {data}")
            
            # Find the pipeline with matching name
            pipelines = data if isinstance(data, list) else data.get("pipelines", [])
            for pipeline in pipelines:
                if pipeline.get("name") == LLAMA_CLOUD_INDEX_NAME:
                    _cached_pipeline_id = pipeline.get("id")
                    logger.info(f"Found pipeline ID: {_cached_pipeline_id}")
                    return _cached_pipeline_id
            
            logger.warning(f"Pipeline '{LLAMA_CLOUD_INDEX_NAME}' not found")
            return None
    except Exception as e:
        logger.error(f"Error looking up pipeline ID: {e}")
        return None


async def retrieve_context(query: str) -> str:
    """Retrieve relevant context from LlamaCloud."""
    try:
        # First get the pipeline ID
        pipeline_id = await get_pipeline_id()
        
        if not pipeline_id:
            logger.warning("Could not get pipeline ID, skipping retrieval")
            return ""
        
        url = f"{LLAMA_CLOUD_BASE_URL}/api/v1/pipelines/{pipeline_id}/retrieve"
        logger.info(f"Calling LlamaCloud retrieve: {url}")
        logger.info(f"Query: {query}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {LLAMA_CLOUD_API_KEY}",
                },
                json={
                    "query": query,
                    "similarity_top_k": 3,
                },
            )

            logger.info(f"LlamaCloud response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.warning(f"LlamaCloud retrieval failed: {response.status_code}")
                logger.warning(f"Response body: {response.text}")
                return ""

            data = response.json()
            logger.info(f"LlamaCloud response data keys: {data.keys() if isinstance(data, dict) else 'not a dict'}")
            logger.info(f"Full response: {data}")

            # Extract text from retrieved nodes
            if data.get("retrievals") and isinstance(data["retrievals"], list):
                context = "\n\n".join([r.get("text", "") for r in data["retrievals"]])
                logger.info(f"Retrieved context length: {len(context)} chars")
                return context

            return ""
    except Exception as e:
        logger.error(f"Error retrieving context: {e}")
        return ""


def get_traits_context(message: str) -> str:
    """
    Detect trait-related queries and fetch relevant data from the traits database.
    
    Returns formatted context string with trait information.
    """
    message_lower = message.lower()
    context_parts = []
    
    # Check for count queries
    count_patterns = [
        r"how many traits",
        r"number of traits",
        r"total traits",
        r"traits.*count",
        r"count.*traits",
        r"traits.*available",
        r"traits.*have",
        r"traits.*database"
    ]
    
    if any(re.search(pattern, message_lower) for pattern in count_patterns):
        count_data = get_traits_count()
        if not count_data.get("error"):
            context_parts.append(f"""
TRAITS DATABASE INFO:
{count_data['message']}
- Total traits: {count_data['total_traits']}
- Monogenic traits (single gene): {count_data['monogenic_traits']}
- Polygenic traits (multiple genes): {count_data['polygenic_traits']}
""")
    
    # Check for trait explanation queries
    explain_patterns = [
        r"explain\s+(.+?)(?:\s+trait)?$",
        r"tell me about\s+(.+?)(?:\s+trait)?$",
        r"what is\s+(.+?)(?:\s+trait)?$",
        r"describe\s+(.+?)(?:\s+trait)?$",
        r"how does\s+(.+?)\s+work",
        r"information about\s+(.+)",
        r"details on\s+(.+)",
    ]
    
    for pattern in explain_patterns:
        match = re.search(pattern, message_lower)
        if match:
            trait_query = match.group(1).strip()
            # Skip generic words
            if trait_query not in ["the", "a", "this", "it", "that", "trait", "genetics"]:
                trait_details = get_trait_details(trait_query)
                if trait_details.get("found"):
                    context_parts.append(f"""
TRAIT DETAILS FROM DATABASE:
Trait Name: {trait_details['name']}
Type: {trait_details['type']}
Inheritance: {trait_details['inheritance']}
Gene(s): {trait_details['genes']}
Chromosome(s): {trait_details['chromosomes']}
Alleles: {', '.join(trait_details['alleles'])}
Phenotypes: {'; '.join(trait_details['phenotype_summary'])}

Description: {trait_details['description']}
""")
                break
    
    # Check for trait search queries 
    search_patterns = [
        r"search.*trait.*(.+)",
        r"find.*trait.*(.+)",
        r"traits.*related to\s+(.+)",
        r"(.+)\s+traits?",
        r"list.*(.+)\s+traits",
    ]
    
    # Also check for specific trait names in the message
    if not context_parts:
        # Try a general search with the message
        search_result = search_traits(message_lower, limit=3)
        if search_result.get("found") and search_result.get("count", 0) > 0:
            results = search_result.get("results", [])
            if results:
                traits_info = []
                for r in results[:3]:
                    traits_info.append(f"- {r['name']} ({r['type']}, {r['inheritance']})")
                
                context_parts.append(f"""
RELATED TRAITS FROM DATABASE:
Found {len(results)} matching trait(s):
{chr(10).join(traits_info)}

(User can ask for more details about any of these traits)
""")
    
    return "\n".join(context_parts)

async def generate_response(user_message: str, context: str, page_context: PageContext | None = None, user_name: str = "there") -> str:
    """Generate response using Claude AI."""
    try:
        # Format system prompt with user's name
        system_prompt = ZIGI_SYSTEM_PROMPT.format(user_name=user_name)
        
        # Build page context information
        page_info = ""
        if page_context:
            features_list = "\n".join([f"- {feature}" for feature in page_context.features])
            page_info = f"""
CURRENT PAGE CONTEXT:
The user is currently on: {page_context.pageName}
Page Description: {page_context.description}
Available Features on this page:
{features_list}

If the user asks about "this page", "here", "what can I do", or similar questions, they are asking about the {page_context.pageName}.
"""

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": CLAUDE_API_KEY,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": 200,
                    "temperature": 0.7,
                    "system": system_prompt,
                    "messages": [
                        {
                            "role": "user",
                            "content": f"""{page_info}

Background information (use this to answer, but don't copy it directly):
{context}

Question: {user_message}

Remember: Answer in 2-4 simple, friendly sentences. No technical jargon. No bullet points. Just talk naturally like you're explaining to a friend.""",
                        }
                    ],
                },
            )

            if response.status_code != 200:
                logger.error(f"Claude API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to generate response from AI",
                )

            data = response.json()

            if data.get("content") and len(data["content"]) > 0:
                return data["content"][0].get("text", "I'm sorry, I couldn't generate a response.")

            return "I'm sorry, I couldn't generate a response. Please try again!"
    except httpx.HTTPError as e:
        logger.error(f"HTTP error generating response: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to connect to AI service",
        )
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while generating response",
        )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Chat endpoint that retrieves context from LlamaCloud and generates
    a response using Claude AI with page context awareness.
    """
    try:
        # Step 1: Retrieve relevant context from LlamaCloud
        llama_context = await retrieve_context(request.message)
        
        # Step 2: Get traits-specific context from the traits database
        traits_context = get_traits_context(request.message)
        
        # Step 3: Combine contexts
        combined_context = llama_context
        if traits_context:
            combined_context = f"{traits_context}\n\n{llama_context}" if llama_context else traits_context
            logger.info(f"Added traits context: {len(traits_context)} chars")

        # Step 4: Generate response using Claude with context, page context, and user name
        user_name = request.userName or "there"
        response = await generate_response(request.message, combined_context, request.pageContext, user_name)

        return ChatResponse(response=response)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Sorry, I encountered an error. Please try again!",
        )
