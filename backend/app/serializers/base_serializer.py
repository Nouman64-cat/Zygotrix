"""
Base Serializer
================
Base class for all serializers with common utilities.
"""

from typing import Any, Dict, Optional
from datetime import datetime


class BaseSerializer:
    """Base class for serializers with common utilities."""
    
    @staticmethod
    def serialize_datetime(dt: Any) -> Optional[str]:
        """
        Serialize datetime to ISO format string.
        
        Args:
            dt: datetime object, ISO string, or None
            
        Returns:
            ISO format string or None
        """
        if dt is None:
            return None
        if isinstance(dt, str):
            return dt
        if isinstance(dt, datetime):
            return dt.isoformat()
        return str(dt)
    
    @staticmethod
    def serialize_object_id(obj_id: Any) -> Optional[str]:
        """
        Serialize MongoDB ObjectId to string.
        
        Args:
            obj_id: ObjectId or string
            
        Returns:
            String representation or None
        """
        if obj_id is None:
            return None
        return str(obj_id)
    
    @staticmethod
    def clean_mongo_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
        """
        Remove MongoDB's _id field from document.
        
        Args:
            doc: MongoDB document
            
        Returns:
            Document without _id field
        """
        if doc and "_id" in doc:
            doc.pop("_id", None)
        return doc
