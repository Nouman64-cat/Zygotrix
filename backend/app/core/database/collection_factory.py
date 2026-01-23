"""
Centralized MongoDB Collection Factory
========================================
Provides a single point of access for all MongoDB collections.
Eliminates code duplication and standardizes error handling.
"""

import logging
from typing import Optional
from pymongo.collection import Collection
from fastapi import HTTPException

logger = logging.getLogger(__name__)


class CollectionFactory:
    """
    Factory for accessing MongoDB collections with consistent error handling.
    
    This eliminates the duplicated collection accessor pattern found across
    multiple service files.
    """
    
    @staticmethod
    def get_collection(
        collection_name: str,
        required: bool = False
    ) -> Optional[Collection]:
        """
        Get a MongoDB collection by name.
        
        Args:
            collection_name: Name of the collection to retrieve
            required: If True, raises HTTPException when MongoDB is unavailable
            
        Returns:
            Collection instance or None if not available and not required
            
        Raises:
            HTTPException: If required=True and MongoDB is not available
        """
        from ...services.common import get_mongo_client, get_settings
        
        client = get_mongo_client()
        if client is None:
            if required:
                logger.error(f"MongoDB client not available for collection: {collection_name}")
                raise HTTPException(
                    status_code=503,
                    detail="Database service temporarily unavailable"
                )
            logger.warning(f"MongoDB client not available for collection: {collection_name}")
            return None
        
        settings = get_settings()
        db = client[settings.mongodb_db_name]
        return db[collection_name]
    
    # =========================================================================
    # ZYGOTRIX AI COLLECTIONS
    # =========================================================================
    
    @staticmethod
    def get_conversations_collection(required: bool = False) -> Optional[Collection]:
        """Get the AI conversations collection."""
        return CollectionFactory.get_collection("ai_conversations", required)
    
    @staticmethod
    def get_messages_collection(required: bool = False) -> Optional[Collection]:
        """Get the AI messages collection."""
        return CollectionFactory.get_collection("ai_messages", required)
    
    @staticmethod
    def get_folders_collection(required: bool = False) -> Optional[Collection]:
        """Get the AI folders collection."""
        return CollectionFactory.get_collection("ai_folders", required)
    
    @staticmethod
    def get_shared_conversations_collection(required: bool = False) -> Optional[Collection]:
        """Get the AI shared conversations collection."""
        return CollectionFactory.get_collection("ai_shared_conversations", required)
    
    @staticmethod
    def get_prompt_templates_collection(required: bool = False) -> Optional[Collection]:
        """Get the AI prompt templates collection."""
        return CollectionFactory.get_collection("ai_prompt_templates", required)
    
    # =========================================================================
    # AUTH COLLECTIONS
    # =========================================================================
    
    @staticmethod
    def get_users_collection(required: bool = False) -> Optional[Collection]:
        """Get the users collection."""
        return CollectionFactory.get_collection("users", required)
    
    @staticmethod
    def get_pending_signups_collection(required: bool = False) -> Optional[Collection]:
        """Get the pending signups collection."""
        return CollectionFactory.get_collection("pending_signups", required)
    
    # =========================================================================
    # COMMUNITY COLLECTIONS
    # =========================================================================
    
    @staticmethod
    def get_questions_collection(required: bool = False) -> Optional[Collection]:
        """Get the community questions collection."""
        from ...services.common import get_settings
        settings = get_settings()
        return CollectionFactory.get_collection(
            settings.mongodb_questions_collection,
            required
        )
    
    @staticmethod
    def get_answers_collection(required: bool = False) -> Optional[Collection]:
        """Get the community answers collection."""
        from ...services.common import get_settings
        settings = get_settings()
        return CollectionFactory.get_collection(
            settings.mongodb_answers_collection,
            required
        )
    
    @staticmethod
    def get_comments_collection(required: bool = False) -> Optional[Collection]:
        """Get the community comments collection."""
        from ...services.common import get_settings
        settings = get_settings()
        return CollectionFactory.get_collection(
            settings.mongodb_comments_collection,
            required
        )
    
    # =========================================================================
    # GENETICS COLLECTIONS
    # =========================================================================
    
    @staticmethod
    def get_traits_collection(required: bool = False) -> Optional[Collection]:
        """Get the traits collection."""
        return CollectionFactory.get_collection("traits", required)
    
    @staticmethod
    def get_projects_collection(required: bool = False) -> Optional[Collection]:
        """Get the projects collection."""
        return CollectionFactory.get_collection("projects", required)
    
    @staticmethod
    def get_simulation_logs_collection(required: bool = False) -> Optional[Collection]:
        """Get the simulation logs collection."""
        return CollectionFactory.get_collection("simulation_logs", required)
    
    # =========================================================================
    # GWAS COLLECTIONS
    # =========================================================================
    
    @staticmethod
    def get_gwas_datasets_collection(required: bool = False) -> Optional[Collection]:
        """Get the GWAS datasets collection."""
        return CollectionFactory.get_collection("gwas_datasets", required)
    
    @staticmethod
    def get_gwas_jobs_collection(required: bool = False) -> Optional[Collection]:
        """Get the GWAS analysis jobs collection."""
        return CollectionFactory.get_collection("gwas_jobs", required)
    
    @staticmethod
    def get_gwas_results_collection(required: bool = False) -> Optional[Collection]:
        """Get the GWAS analysis results collection."""
        return CollectionFactory.get_collection("gwas_results", required)
    
    # =========================================================================
    # ANALYTICS & TRACKING COLLECTIONS
    # =========================================================================
    
    @staticmethod
    def get_rate_limits_collection(required: bool = False) -> Optional[Collection]:
        """Get the rate limits collection."""
        return CollectionFactory.get_collection("rate_limits", required)
    
    @staticmethod
    def get_token_usage_collection(required: bool = False) -> Optional[Collection]:
        """Get the token usage collection."""
        return CollectionFactory.get_collection("token_usage", required)
    
    @staticmethod
    def get_embedding_usage_collection(required: bool = False) -> Optional[Collection]:
        """Get the embedding usage collection."""
        return CollectionFactory.get_collection("embedding_usage", required)


# Convenience function for backward compatibility
def get_collection(collection_name: str, required: bool = False) -> Optional[Collection]:
    """
    Convenience function for getting a collection.
    
    This provides a simple function interface while using the factory internally.
    """
    return CollectionFactory.get_collection(collection_name, required)
