"""
Cohere Reranker Service.

Handles document reranking using Cohere's rerank API for improved precision.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

# Cohere Configuration
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
COHERE_MODEL = os.getenv("COHERE_MODEL", "rerank-v4.0-fast")


class CohereRerankerService:
    """
    Service for reranking documents using Cohere's rerank API.
    
    This improves the precision of retrieved documents by using
    Cohere's cross-encoder model to score document-query relevance.
    """
    
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize the Cohere reranker service.
        
        Args:
            api_key: Optional Cohere API key (defaults to environment variable)
            model: Optional model name (defaults to environment variable)
        """
        self.api_key = api_key or COHERE_API_KEY
        self.model = model or COHERE_MODEL
        self._client = None
        
        if not self.api_key:
            logger.warning("COHERE_API_KEY not set - reranking will be disabled")
        else:
            logger.info(f"CohereRerankerService initialized with model: {self.model}")
    
    @property
    def client(self):
        """Lazy initialization of Cohere client."""
        if self._client is None and self.api_key:
            try:
                import cohere
                self._client = cohere.ClientV2(api_key=self.api_key)
                logger.info("Cohere client initialized successfully")
            except ImportError:
                logger.error("Cohere package not installed. Run: pip install cohere")
                raise
            except Exception as e:
                logger.error(f"Failed to initialize Cohere client: {e}")
                raise
        return self._client
    
    @property
    def is_available(self) -> bool:
        """Check if Cohere reranking is available."""
        return self.api_key is not None and self.api_key.strip() != ""
    
    async def rerank_documents(
        self,
        query: str,
        documents: List[Dict[str, Any]],
        top_k: int = 5,
        text_key: str = "text"
    ) -> List[Dict[str, Any]]:
        """
        Rerank documents using Cohere's rerank API.
        
        Args:
            query: The search query
            documents: List of documents to rerank (must have text_key field)
            top_k: Number of top documents to return
            text_key: Key in document dict that contains the text
            
        Returns:
            List of reranked documents with added rerank_score field
        """
        if not documents:
            logger.warning("No documents to rerank")
            return []
        
        if not self.is_available:
            logger.warning("Cohere reranking not available, returning original documents")
            # Return top_k documents without reranking
            return documents[:top_k]
        
        try:
            # Extract text from documents
            doc_texts = []
            for doc in documents:
                text = doc.get(text_key, "")
                if isinstance(text, str) and text.strip():
                    doc_texts.append(text)
                else:
                    doc_texts.append(str(doc))
            
            if not doc_texts:
                logger.warning("No valid text found in documents")
                return documents[:top_k]
            
            logger.info(f"Reranking {len(doc_texts)} documents for query: {query[:100]}...")
            
            # Call Cohere rerank API
            response = self.client.rerank(
                model=self.model,
                query=query,
                documents=doc_texts,
                top_n=min(top_k, len(doc_texts))
            )
            
            # Build reranked results
            reranked_documents = []
            for result in response.results:
                doc_index = result.index
                rerank_score = result.relevance_score
                
                if doc_index < len(documents):
                    reranked_doc = documents[doc_index].copy()
                    reranked_doc["rerank_score"] = rerank_score
                    reranked_doc["original_index"] = doc_index
                    reranked_documents.append(reranked_doc)
            
            logger.info(
                f"Reranking complete: {len(reranked_documents)} documents returned, "
                f"top score: {reranked_documents[0]['rerank_score'] if reranked_documents else 0:.4f}"
            )
            
            return reranked_documents
            
        except Exception as e:
            logger.error(f"Error during reranking: {e}", exc_info=True)
            # Fallback to original order
            return documents[:top_k]
    
    async def rerank_with_metadata(
        self,
        query: str,
        documents: List[Dict[str, Any]],
        top_k: int = 5,
        text_key: str = "text"
    ) -> Dict[str, Any]:
        """
        Rerank documents and return with metadata.
        
        Args:
            query: The search query
            documents: List of documents to rerank
            top_k: Number of top documents to return
            text_key: Key in document dict that contains the text
            
        Returns:
            Dict with 'documents', 'scores', and 'metadata'
        """
        reranked = await self.rerank_documents(query, documents, top_k, text_key)
        
        return {
            "documents": reranked,
            "scores": [doc.get("rerank_score", 0.0) for doc in reranked],
            "metadata": {
                "model": self.model,
                "total_documents": len(documents),
                "reranked_count": len(reranked),
                "top_k": top_k
            }
        }


# Global singleton instance
_cohere_reranker: Optional[CohereRerankerService] = None


def get_cohere_reranker() -> CohereRerankerService:
    """Get or create the global CohereRerankerService instance."""
    global _cohere_reranker
    if _cohere_reranker is None:
        _cohere_reranker = CohereRerankerService()
    return _cohere_reranker
