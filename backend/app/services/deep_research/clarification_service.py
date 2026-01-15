"""
GPT-4o-mini Clarification Service.

Handles clarification question generation using OpenAI's GPT-4o-mini model.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv, find_dotenv
from openai import AsyncOpenAI

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CLARIFICATION_MODEL = os.getenv("CLARIFICATION_MODEL", "gpt-4o-mini")


# Clarification prompt template
CLARIFICATION_SYSTEM_PROMPT = """You are a research assistant that helps users refine their queries before conducting in-depth research.

Your task is to analyze the user's research query and determine if clarification is needed.

IMPORTANT GUIDELINES:
1. Only ask for clarification if the query is genuinely ambiguous or too broad
2. Simple, clear questions do NOT need clarification
3. Maximum 3 clarification questions
4. Each question should be specific and helpful
5. Provide suggested answers when appropriate

WHEN TO ASK FOR CLARIFICATION:
- The query could have multiple interpretations
- The scope is unclear (time period, geographic focus, etc.)
- Technical terms could mean different things
- The depth of research needed is unclear

WHEN NOT TO ASK FOR CLARIFICATION:
- The query is straightforward and specific
- It's a factual question with a clear answer
- The user has already provided sufficient context

Respond in JSON format:
{
    "needs_clarification": true/false,
    "reasoning": "Brief explanation of why clarification is/isn't needed",
    "questions": [
        {
            "id": "q1",
            "question": "The clarification question",
            "context": "Optional: Why this matters",
            "suggested_answers": ["Option 1", "Option 2"]
        }
    ]
}

If clarification is NOT needed, the questions array should be empty.
"""


class ClarificationService:
    """
    Service for generating clarification questions using GPT-4o-mini.
    
    This service analyzes research queries and determines if clarification
    is needed before conducting deep research.
    """
    
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize the clarification service.
        
        Args:
            api_key: Optional OpenAI API key (defaults to environment variable)
            model: Optional model name (defaults to gpt-4o-mini)
        """
        self.api_key = api_key or OPENAI_API_KEY
        self.model = model or CLARIFICATION_MODEL
        self.client = AsyncOpenAI(api_key=self.api_key)
        
        logger.info(f"ClarificationService initialized with model: {self.model}")
    
    async def analyze_query(
        self,
        query: str,
        conversation_context: Optional[str] = None
    ) -> Tuple[bool, List[Dict[str, Any]], Dict[str, int]]:
        """
        Analyze a query and determine if clarification is needed.
        
        Args:
            query: The user's research query
            conversation_context: Optional previous conversation context
            
        Returns:
            Tuple of (needs_clarification, questions, token_usage)
        """
        try:
            # Build the user message
            user_message = f"Research Query: {query}"
            if conversation_context:
                user_message = f"Previous Context:\n{conversation_context}\n\n{user_message}"
            
            logger.info(f"Analyzing query for clarification: {query[:100]}...")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": CLARIFICATION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            # Parse response
            content = response.choices[0].message.content
            result = json.loads(content)
            
            # Extract token usage
            token_usage = {
                "input_tokens": response.usage.prompt_tokens,
                "output_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
            
            needs_clarification = result.get("needs_clarification", False)
            questions = result.get("questions", [])
            
            logger.info(
                f"Clarification analysis complete: needs_clarification={needs_clarification}, "
                f"questions={len(questions)}, tokens={token_usage['total_tokens']}"
            )
            
            return needs_clarification, questions, token_usage
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse clarification response: {e}")
            return False, [], {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
        except Exception as e:
            logger.error(f"Error in clarification analysis: {e}", exc_info=True)
            return False, [], {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
    
    async def build_clarified_query(
        self,
        original_query: str,
        questions: List[Dict[str, Any]],
        answers: List[str]
    ) -> Tuple[str, Dict[str, int]]:
        """
        Build an enhanced query incorporating clarification answers.
        
        Args:
            original_query: The original research query
            questions: The clarification questions asked
            answers: The user's answers
            
        Returns:
            Tuple of (clarified_query, token_usage)
        """
        try:
            # Build Q&A pairs
            qa_pairs = []
            for i, (q, a) in enumerate(zip(questions, answers)):
                question_text = q.get("question", f"Question {i+1}")
                qa_pairs.append(f"Q: {question_text}\nA: {a}")
            
            qa_text = "\n\n".join(qa_pairs)
            
            prompt = f"""Based on the original query and the clarification answers, create an enhanced, 
specific research query that incorporates all the context provided.

Original Query: {original_query}

Clarifications:
{qa_text}

Create a single, comprehensive research query that captures the user's intent precisely.
Only output the enhanced query, nothing else."""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500
            )
            
            clarified_query = response.choices[0].message.content.strip()
            
            token_usage = {
                "input_tokens": response.usage.prompt_tokens,
                "output_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
            
            logger.info(f"Built clarified query: {clarified_query[:100]}...")
            
            return clarified_query, token_usage
            
        except Exception as e:
            logger.error(f"Error building clarified query: {e}", exc_info=True)
            # Fallback: append answers to original query
            return f"{original_query} (Context: {'; '.join(answers)})", {
                "input_tokens": 0, "output_tokens": 0, "total_tokens": 0
            }


# Global singleton instance
_clarification_service: Optional[ClarificationService] = None


def get_clarification_service() -> ClarificationService:
    """Get or create the global ClarificationService instance."""
    global _clarification_service
    if _clarification_service is None:
        _clarification_service = ClarificationService()
    return _clarification_service
