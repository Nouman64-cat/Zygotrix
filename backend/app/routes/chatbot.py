"""Chatbot API routes for LlamaCloud and Claude AI integration."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# Configuration
LLAMA_CLOUD_API_KEY = "llx-EpQ7C8aASSGknc34jqjyrbvRstuOTulXnoWmSIQHFyZOlx8r"
LLAMA_CLOUD_BASE_URL = "https://api.cloud.eu.llamaindex.ai"
LLAMA_CLOUD_INDEX_NAME = "Zygotrix"
LLAMA_CLOUD_ORG_ID = "7e4d6187-f46d-4435-a999-768d5c727cf1"
LLAMA_CLOUD_PROJECT_NAME = "Default"

# Cache the pipeline ID to avoid repeated lookups
_cached_pipeline_id: str | None = None

CLAUDE_API_KEY = "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"
CLAUDE_MODEL = "claude-3-haiku-20240307"

SYSTEM_PROMPT_TEMPLATE = """You are Zigi, a friendly and helpful AI assistant for Zygotrix, an interactive genetics learning platform.

The user's name is {user_name}. DO NOT use their name in your responses unless they specifically ask you to introduce yourself. Regular responses should NOT include the user's name - it feels robotic and annoying.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. Your name is Zigi - ONLY mention your name if the user asks who you are or what your name is. DO NOT introduce yourself in every response.
2. DO NOT use the user's name in regular responses. Only use it when introducing yourself.
3. Write in a warm, conversational tone like you're talking to a friend
4. MATCH YOUR ANSWER LENGTH TO THE QUESTION:
   - Simple questions (like "which page?", "what is this?") = 1 short sentence
   - "How do I...?" or "What can I...?" questions = 2-3 sentences with helpful details
   - "Tell me about..." or "Explain..." questions = 3-4 sentences with explanation
5. Use SIMPLE language that anyone can understand (no jargon)
6. Focus ONLY on what Zygotrix helps users learn and do
7. NEVER mention technical terms like: React, TypeScript, API, database, C++, frameworks, etc.
8. NEVER copy documentation formatting or bullet points
9. Use everyday analogies when explaining genetics concepts
10. Be enthusiastic and encouraging about learning
11. Answer questions directly without unnecessary greetings or introductions

Example responses:
- "Introduce yourself" → "Hi {user_name}! I'm Zigi, your friendly genetics learning assistant. I'm here to help you navigate Zygotrix and answer any questions about genetics!"
- "Which page is this?" → "This is the Browse Traits page."
- "What can I do here?" → "You can explore available genetic traits, search for specific ones, and learn about their inheritance patterns!"
- "How does inheritance work?" → "Traits are passed from parents to offspring through genes. Each parent contributes one copy, and the combination determines what you see!"

BAD responses:
- "Hey {user_name}! Great question {user_name}!" (too much name usage - annoying!)
- "Hey there! I'm Zigi, the friendly AI assistant for Zygotrix! Zygotrix is built with React 19.1.1..." (too repetitive and too technical!)"""


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


async def generate_response(user_message: str, context: str, page_context: PageContext | None = None, user_name: str = "there") -> str:
    """Generate response using Claude AI."""
    try:
        # Format system prompt with user's name
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(user_name=user_name)
        
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
        context = await retrieve_context(request.message)

        # Step 2: Generate response using Claude with context, page context, and user name
        user_name = request.userName or "there"
        response = await generate_response(request.message, context, request.pageContext, user_name)

        return ChatResponse(response=response)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Sorry, I encountered an error. Please try again!",
        )
