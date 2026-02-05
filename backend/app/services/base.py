"""
Base Service Classes.

Provides common functionality for all backend services following DRY principles.
Includes:
- BaseService: Common database access pattern
- APIServiceMixin: Common pattern for services using external APIs

Usage:
    from ..base import BaseService, APIServiceMixin
    
    class MyService(BaseService, APIServiceMixin):
        def __init__(self, db=None, api_key=None):
            BaseService.__init__(self, db)
            self.api_key = api_key
"""

import logging
from typing import Optional, Any
from bson import ObjectId

logger = logging.getLogger(__name__)


class BaseService:
    """
    Base class for services with common database access.
    
    Eliminates the duplicate database initialization pattern found in:
    - ScholarService
    - WebSearchService
    - Other services
    
    Usage:
        class MyService(BaseService):
            def __init__(self, db=None):
                super().__init__(db)
                # Service-specific initialization
    """
    
    def __init__(self, db=None):
        """
        Initialize the service with optional database instance.
        
        Args:
            db: MongoDB database instance (optional, defaults to singleton)
        """
        if db is None:
            from .common import get_database
            self._db = get_database()
        else:
            self._db = db
    
    @property
    def db(self):
        """Get the database instance."""
        return self._db
    
    @staticmethod
    def normalize_user_id(user_id: str) -> Any:
        """
        Normalize user ID, converting to ObjectId if valid.
        
        This eliminates the duplicate pattern:
            try:
                query_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
            except Exception:
                query_id = user_id
        
        Args:
            user_id: User ID as string
            
        Returns:
            ObjectId if valid, otherwise the original string
        """
        try:
            if ObjectId.is_valid(user_id):
                return ObjectId(user_id)
        except Exception:
            pass
        return user_id


class APIServiceMixin:
    """
    Mixin for services that use external APIs.
    
    Provides common functionality:
    - API key management
    - Availability checking
    
    Usage:
        class MyAPIService(BaseService, APIServiceMixin):
            def __init__(self, db=None, api_key=None):
                BaseService.__init__(self, db)
                self.api_key = api_key or os.getenv("MY_API_KEY")
    """
    
    api_key: Optional[str] = None
    
    @property
    def is_available(self) -> bool:
        """
        Check if the service is available (API key configured).
        
        Eliminates the duplicate pattern in:
        - ScholarService.is_available
        - WebSearchService.is_available
        """
        return self.api_key is not None and self.api_key.strip() != ""
