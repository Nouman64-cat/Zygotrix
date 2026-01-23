"""
Prompt Template Service
=======================
Service for managing reusable prompt templates.

Extracted from zygotrix_ai_service.py as part of the refactoring effort
to eliminate the god object anti-pattern.
"""

import logging
from typing import Optional, List, Dict, Any

from ...schema.zygotrix_ai import (
    PromptTemplate, PromptTemplateCreate,
)
from ...core.database import CollectionFactory

logger = logging.getLogger(__name__)


class PromptTemplateService:
    """Service for managing prompt templates."""

    @staticmethod
    def create_template(user_id: str, data: PromptTemplateCreate) -> PromptTemplate:
        """
        Create a new prompt template.
        
        Args:
            user_id: ID of the user creating the template
            data: Template creation data
            
        Returns:
            Created prompt template
        """
        collection = CollectionFactory.get_prompt_templates_collection(required=True)

        template = PromptTemplate(
            user_id=user_id,
            title=data.title,
            content=data.content,
            description=data.description,
            category=data.category,
            is_public=data.is_public,
        )

        doc = template.model_dump()
        collection.insert_one(doc)

        logger.info(f"Created prompt template {template.id} for user {user_id}")
        return template

    @staticmethod
    def get_template(template_id: str, user_id: str) -> Optional[PromptTemplate]:
        """
        Get a template by ID.
        
        User can access their own templates or public templates.
        
        Args:
            template_id: ID of the template
            user_id: ID of the requesting user
            
        Returns:
            Prompt template or None if not found
        """
        collection = CollectionFactory.get_prompt_templates_collection(required=True)

        doc = collection.find_one({
            "id": template_id,
            "$or": [
                {"user_id": user_id},
                {"is_public": True}
            ]
        })

        if not doc:
            return None

        doc.pop("_id", None)
        return PromptTemplate(**doc)

    @staticmethod
    def list_templates(
        user_id: str,
        include_public: bool = True,
        category: Optional[str] = None
    ) -> List[PromptTemplate]:
        """
        List templates for a user.
        
        Args:
            user_id: ID of the user
            include_public: If True, includes public templates
            category: Optional category filter
            
        Returns:
            List of prompt templates sorted by usage and recency
        """
        collection = CollectionFactory.get_prompt_templates_collection(required=True)

        query: Dict[str, Any] = {"$or": [{"user_id": user_id}]}
        if include_public:
            query["$or"].append({"is_public": True})

        if category:
            query["category"] = category

        docs = list(
            collection.find(query)
            .sort([("use_count", -1), ("created_at", -1)])
        )

        templates = []
        for doc in docs:
            doc.pop("_id", None)
            templates.append(PromptTemplate(**doc))

        logger.info(f"Listed {len(templates)} templates for user {user_id}")
        return templates

    @staticmethod
    def use_template(template_id: str) -> bool:
        """
        Increment use count for a template.
        
        Args:
            template_id: ID of the template
            
        Returns:
            True if use count was incremented
        """
        collection = CollectionFactory.get_prompt_templates_collection()
        if collection is None:
            return False

        result = collection.update_one(
            {"id": template_id},
            {"$inc": {"use_count": 1}}
        )
        
        if result.modified_count > 0:
            logger.debug(f"Incremented use count for template {template_id}")
            return True
        return False

    @staticmethod
    def delete_template(template_id: str, user_id: str) -> bool:
        """
        Delete a template.
        
        Args:
            template_id: ID of the template
            user_id: ID of the user (for authorization)
            
        Returns:
            True if template was deleted
        """
        collection = CollectionFactory.get_prompt_templates_collection(required=True)
        result = collection.delete_one({"id": template_id, "user_id": user_id})
        
        if result.deleted_count > 0:
            logger.info(f"Deleted prompt template {template_id}")
            return True
        return False
