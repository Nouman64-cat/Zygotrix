"""
RAG Service for LlamaCloud context retrieval.

Extracted from chatbot.py as part of Phase 2.4 refactoring.
Handles pipeline management and context retrieval from LlamaCloud.
"""

import os
import httpx
import logging
from typing import Optional
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

# LlamaCloud Configuration
LLAMA_CLOUD_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")
LLAMA_CLOUD_BASE_URL = "https://api.cloud.eu.llamaindex.ai"
LLAMA_CLOUD_INDEX_NAME = "Zygotrix"
LLAMA_CLOUD_ORG_ID = "7e4d6187-f46d-4435-a999-768d5c727cf1"
LLAMA_CLOUD_PROJECT_NAME = "Default"


class RAGService:
    """
    Service for retrieving context from LlamaCloud RAG pipeline.
    
    Features:
    - Pipeline ID caching
    - Context retrieval
    - Query optimization
    """
    
    def __init__(self):
        self.api_key = LLAMA_CLOUD_API_KEY
        self.base_url = LLAMA_CLOUD_BASE_URL
        self.index_name = LLAMA_CLOUD_INDEX_NAME
        self.project_name = LLAMA_CLOUD_PROJECT_NAME
        self._cached_pipeline_id: Optional[str] = None
    
    async def get_pipeline_id(self) -> Optional[str]:
        """Get the pipeline ID from LlamaCloud by looking up the pipeline by name."""
        if self._cached_pipeline_id:
            return self._cached_pipeline_id
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/pipelines",
                    headers={
                        "Accept": "application/json",
                        "Authorization": f"Bearer {self.api_key}",
                    },
                    params={
                        "project_name": self.project_name,
                        "pipeline_name": self.index_name,
                    }
                )
                
                logger.info(f"Pipeline lookup response status: {response.status_code}")
                
                if response.status_code != 200:
                    logger.error(f"Failed to list pipelines: {response.status_code} - {response.text}")
                    return None
                
                data = response.json()
                logger.info(f"Pipeline lookup response: {data}")
                
                pipelines = data if isinstance(data, list) else data.get("pipelines", [])
                for pipeline in pipelines:
                    if pipeline.get("name") == self.index_name:
                        self._cached_pipeline_id = pipeline.get("id")
                        logger.info(f"Found pipeline ID: {self._cached_pipeline_id}")
                        return self._cached_pipeline_id
                
                logger.warning(f"Pipeline '{self.index_name}' not found")
                return None
        except Exception as e:
            logger.error(f"Error looking up pipeline ID: {e}")
            return None
    
    async def retrieve_context(self, query: str, top_k: int = 3) -> str:
        """Retrieve relevant context from LlamaCloud."""
        try:
            pipeline_id = await self.get_pipeline_id()
            
            if not pipeline_id:
                logger.warning("Could not get pipeline ID, skipping retrieval")
                return ""
            
            url = f"{self.base_url}/api/v1/pipelines/{pipeline_id}/retrieve"
            logger.info(f"Calling LlamaCloud retrieve: {url}")
            logger.info(f"Query: {query}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}",
                    },
                    json={
                        "query": query,
                        "similarity_top_k": top_k,
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

                if data.get("retrievals") and isinstance(data["retrievals"], list):
                    context = "\n\n".join([r.get("text", "") for r in data["retrievals"]])
                    logger.info(f"Retrieved context length: {len(context)} chars")
                    return context

                return ""
        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            return ""


# Global singleton instance
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get or create the global RAGService instance."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service