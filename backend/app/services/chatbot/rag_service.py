"""
RAG Service for OpenAI + Pinecone context retrieval.

Refactored from LlamaCloud to use OpenAI embeddings with Pinecone vector store.
Handles embedding generation and context retrieval from Pinecone.
"""

import os
import logging
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv, find_dotenv
from openai import AsyncOpenAI
from pinecone import Pinecone

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

# Pinecone Configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
PINECONE_HOST = os.getenv("PINECONE_HOST")


class RAGService:
    """
    Service for retrieving context using OpenAI embeddings and Pinecone vector store.

    Features:
    - OpenAI embedding generation
    - Pinecone vector search
    - Context retrieval and formatting
    """

    def __init__(self):
        # Load configuration via Settings to ensure values are read from config.yml if not in env
        from app.config import get_settings
        settings = get_settings()

        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.embedding_model = settings.openai_embedding_model

        # Initialize Pinecone
        pc = Pinecone(api_key=settings.pinecone_api_key)
        self.index = pc.Index(
            name=settings.pinecone_index_name,
            host=settings.pinecone_host
        )

        logger.info(f"RAGService initialized with OpenAI model: {self.embedding_model}")
        logger.info(f"Connected to Pinecone index: {settings.pinecone_index_name}")

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for the given text using OpenAI.

        Args:
            text: Text to embed

        Returns:
            List of floats representing the embedding vector
        """
        try:
            response = await self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            embedding = response.data[0].embedding
            logger.info(f"Generated embedding with dimension: {len(embedding)}")
            return embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    async def retrieve_context(
        self,
        query: str,
        top_k: int = 3,
        user_id: Optional[str] = None,
        user_name: Optional[str] = None
    ) -> str:
        """
        Retrieve relevant context from Pinecone using OpenAI embeddings.

        Args:
            query: Search query
            top_k: Number of results to retrieve
            user_id: Optional user ID for usage tracking
            user_name: Optional user name for usage tracking

        Returns:
            Formatted context string from retrieved documents
        """
        try:
            # Generate embedding for the query
            query_embedding = await self.generate_embedding(query)

            # Track embedding usage
            from ..chatbot.token_analytics_service import get_token_analytics_service
            # OpenAI's tokenizer: roughly 1 token per 4 characters for English text
            estimated_tokens = len(query) // 4
            get_token_analytics_service().log_embedding_usage(
                user_id=user_id,
                user_name=user_name,
                tokens=estimated_tokens,
                model=self.embedding_model,
                query_preview=query[:100]
            )

            # Search Pinecone
            logger.info(f"Querying Pinecone with top_k={top_k}")
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )

            # Extract and format context from results
            if not results.matches:
                logger.info("No matches found in Pinecone")
                return ""

            context_parts = []
            for match in results.matches:
                score = match.score
                metadata = match.metadata or {}
                text = metadata.get("text", "")

                if text:
                    logger.info(f"Match score: {score:.4f}, text length: {len(text)}")
                    context_parts.append(text)

            context = "\n\n".join(context_parts)
            logger.info(f"Retrieved context from {len(context_parts)} documents, total length: {len(context)} chars")
            return context

        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            return ""

    async def retrieve_chunks(
        self,
        query: str,
        top_k: int = 50,
        user_id: Optional[str] = None,
        user_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve raw chunks from Pinecone with metadata (for Scholar Mode).

        Args:
            query: Search query
            top_k: Number of results to retrieve
            user_id: Optional user ID for usage tracking
            user_name: Optional user name for usage tracking

        Returns:
            List of chunk dictionaries with 'text', 'score', and 'metadata'
        """
        try:
            # Generate embedding for the query
            query_embedding = await self.generate_embedding(query)

            # Track embedding usage
            from ..chatbot.token_analytics_service import get_token_analytics_service
            estimated_tokens = len(query) // 4
            get_token_analytics_service().log_embedding_usage(
                user_id=user_id,
                user_name=user_name,
                tokens=estimated_tokens,
                model=self.embedding_model,
                query_preview=query[:100]
            )

            # Search Pinecone
            logger.info(f"Querying Pinecone for raw chunks with top_k={top_k}")
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )

            # Return raw chunks with metadata
            if not results.matches:
                logger.info("No matches found in Pinecone")
                return []

            chunks = []
            for match in results.matches:
                metadata = match.metadata or {}
                chunks.append({
                    "id": match.id,
                    "text": metadata.get("text", ""),
                    "score": match.score,
                    "metadata": metadata
                })

            logger.info(f"Retrieved {len(chunks)} raw chunks from Pinecone")
            return chunks

        except Exception as e:
            logger.error(f"Error retrieving chunks: {e}")
            return []

    async def upsert_documents(self, documents: List[Dict[str, Any]]) -> bool:
        """
        Upsert documents into Pinecone.

        Args:
            documents: List of documents with 'id', 'text', and optional metadata

        Returns:
            True if successful, False otherwise
        """
        try:
            vectors = []

            for doc in documents:
                doc_id = doc.get("id")
                text = doc.get("text")
                metadata = doc.get("metadata", {})

                if not doc_id or not text:
                    logger.warning(f"Skipping document with missing id or text: {doc}")
                    continue

                # Generate embedding
                embedding = await self.generate_embedding(text)

                # Store text in metadata for retrieval
                metadata["text"] = text

                vectors.append({
                    "id": doc_id,
                    "values": embedding,
                    "metadata": metadata
                })

            if vectors:
                # Upsert to Pinecone
                self.index.upsert(vectors=vectors)
                logger.info(f"Successfully upserted {len(vectors)} documents to Pinecone")
                return True
            else:
                logger.warning("No valid documents to upsert")
                return False

        except Exception as e:
            logger.error(f"Error upserting documents: {e}")
            return False


# Global singleton instance
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get or create the global RAGService instance."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
