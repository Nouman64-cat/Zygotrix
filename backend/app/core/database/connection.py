"""
Database Connection Manager.

This module provides a singleton connection manager for MongoDB,
handling connection pooling, health checks, and lifecycle management.
"""
from typing import Optional
import logging
from pymongo import MongoClient
from pymongo.errors import (
    ConnectionFailure,
    ServerSelectionTimeoutError,
    ConfigurationError,
    PyMongoError
)

from app.config import get_settings
from app.core.exceptions.database import DatabaseNotAvailableError

logger = logging.getLogger(__name__)


class DatabaseConnectionManager:
    """
    Singleton manager for MongoDB database connections.

    This class ensures a single MongoDB client instance is shared
    across the application, with proper connection pooling and
    lifecycle management.

    Features:
    - Singleton pattern for efficient resource usage
    - Automatic connection pooling
    - Health check support
    - Development mode support (mongomock)
    - Graceful connection handling
    - Proper cleanup on shutdown
    """

    _instance: Optional['DatabaseConnectionManager'] = None
    _client: Optional[MongoClient] = None
    _is_connected: bool = False

    def __new__(cls):
        """
        Ensure only one instance exists (Singleton pattern).

        Returns:
            DatabaseConnectionManager instance
        """
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            logger.debug("DatabaseConnectionManager instance created")
        return cls._instance

    def get_client(self) -> Optional[MongoClient]:
        """
        Get the MongoDB client, creating it if necessary.

        Returns:
            MongoClient instance if available, None if connection fails

        Note:
            Returns None instead of raising exception to allow graceful degradation
        """
        if self._client is None:
            try:
                self._client = self._create_client()
                self._is_connected = True
                logger.info("MongoDB client created successfully")
            except Exception as e:
                logger.error(f"Failed to create MongoDB client: {e}")
                self._is_connected = False
                return None

        return self._client

    def _create_client(self) -> MongoClient:
        """
        Create and configure a MongoDB client.

        Returns:
            Configured MongoClient instance

        Raises:
            DatabaseNotAvailableError: If connection cannot be established
            ConfigurationError: If MongoDB URI is invalid
        """
        settings = get_settings()

        # Check if MongoDB URI is configured
        if not settings.mongodb_uri:
            logger.warning("MongoDB URI not configured")
            raise DatabaseNotAvailableError(
                "MongoDB URI not configured. Please set MONGODB_URI environment variable."
            )

        # Handle mongomock for testing
        if settings.mongodb_uri.startswith("mongomock://"):
            return self._create_mock_client()

        # Create production MongoDB client
        try:
            logger.info(f"Connecting to MongoDB at {self._mask_uri(settings.mongodb_uri)}")

            client = MongoClient(
                settings.mongodb_uri,
                # Connection Pool Settings - OPTIMIZED for high concurrency
                maxPoolSize=100,           # Increased from 50 for better concurrency
                minPoolSize=20,            # Increased from 10 to maintain more warm connections
                maxIdleTimeMS=45000,       # Increased to 45s - keep connections warm longer
                waitQueueTimeoutMS=5000,   # Fail fast if pool exhausted (5s max wait)

                # Timeout Settings
                serverSelectionTimeoutMS=5000,    # 5 seconds to select server
                connectTimeoutMS=20000,            # 20 seconds to connect
                socketTimeoutMS=20000,             # 20 seconds for socket operations

                # Retry Settings
                retryWrites=True,          # Retry write operations on failure
                retryReads=True,           # Retry read operations on failure

                # Application Settings
                appname="Zygotrix Backend",

                # Write Concern (for production)
                w="majority",              # Wait for majority of replicas

                # Read Preference
                readPreference="primary",  # Read from primary by default
            )

            # Test the connection
            self._test_connection(client)

            logger.info("✅ MongoDB connection established successfully")
            return client

        except ConnectionFailure as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise DatabaseNotAvailableError(
                f"Failed to connect to MongoDB: {str(e)}"
            )
        except ServerSelectionTimeoutError as e:
            logger.error(f"MongoDB server selection timeout: {e}")
            raise DatabaseNotAvailableError(
                "MongoDB server is not reachable. Please check your connection settings."
            )
        except ConfigurationError as e:
            logger.error(f"MongoDB configuration error: {e}")
            raise DatabaseNotAvailableError(
                f"Invalid MongoDB configuration: {str(e)}"
            )
        except PyMongoError as e:
            logger.error(f"MongoDB error: {e}")
            raise DatabaseNotAvailableError(
                f"MongoDB error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error creating MongoDB client: {e}")
            raise DatabaseNotAvailableError(
                f"Unexpected database error: {str(e)}"
            )

    def _create_mock_client(self) -> MongoClient:
        """
        Create a mongomock client for testing.

        Returns:
            Mongomock client instance

        Raises:
            ImportError: If mongomock is not installed
        """
        try:
            import mongomock
            logger.info("Creating mongomock client for testing")
            return mongomock.MongoClient()
        except ImportError:
            logger.error("mongomock not installed")
            raise DatabaseNotAvailableError(
                "mongomock is required for testing. Install with: pip install mongomock"
            )

    def _test_connection(self, client: MongoClient) -> None:
        """
        Test the MongoDB connection by pinging the server.

        Args:
            client: MongoClient to test

        Raises:
            ConnectionFailure: If ping fails
        """
        try:
            # Ping the database to verify connection
            client.admin.command('ping')
            logger.debug("MongoDB connection test successful")
        except Exception as e:
            logger.error(f"MongoDB connection test failed: {e}")
            raise ConnectionFailure(f"Connection test failed: {str(e)}")

    @staticmethod
    def _mask_uri(uri: str) -> str:
        """
        Mask sensitive information in MongoDB URI for logging.

        Args:
            uri: MongoDB connection URI

        Returns:
            URI with password masked
        """
        if not uri:
            return ""

        # Handle mongomock URIs
        if uri.startswith("mongomock://"):
            return "mongomock://***"

        # Mask password in regular URIs
        try:
            if "@" in uri and "://" in uri:
                protocol, rest = uri.split("://", 1)
                if "@" in rest:
                    credentials, host = rest.split("@", 1)
                    if ":" in credentials:
                        username, _ = credentials.split(":", 1)
                        return f"{protocol}://{username}:***@{host}"
            return uri
        except Exception:
            return "***"

    def is_connected(self) -> bool:
        """
        Check if database is currently connected.

        Returns:
            True if connected, False otherwise
        """
        if self._client is None:
            return False

        try:
            # Quick ping to verify connection is still alive
            self._client.admin.command('ping')
            return True
        except Exception:
            self._is_connected = False
            return False

    def health_check(self) -> dict:
        """
        Perform a comprehensive health check on the database connection.

        Returns:
            Dictionary with health check results:
            {
                "status": "healthy" | "unhealthy",
                "connected": bool,
                "details": {
                    "server_info": dict,
                    "database": str,
                    "ping_ms": float
                }
            }
        """
        health_status = {
            "status": "unhealthy",
            "connected": False,
            "details": {}
        }

        try:
            if self._client is None:
                health_status["details"]["error"] = "No client initialized"
                return health_status

            # Measure ping time
            import time
            start = time.time()
            self._client.admin.command('ping')
            ping_ms = (time.time() - start) * 1000

            # Get server info
            server_info = self._client.server_info()

            settings = get_settings()

            health_status.update({
                "status": "healthy",
                "connected": True,
                "details": {
                    "server_version": server_info.get("version"),
                    "database": settings.mongodb_db_name,
                    "ping_ms": round(ping_ms, 2),
                    "max_pool_size": 50,
                    "min_pool_size": 10,
                }
            })

            logger.debug(f"Health check passed (ping: {ping_ms:.2f}ms)")

        except Exception as e:
            health_status["details"]["error"] = str(e)
            logger.warning(f"Health check failed: {e}")

        return health_status

    def disconnect(self) -> None:
        """
        Close the MongoDB connection and cleanup resources.

        This should be called during application shutdown.
        """
        if self._client is not None:
            try:
                self._client.close()
                logger.info("MongoDB connection closed")
            except Exception as e:
                logger.error(f"Error closing MongoDB connection: {e}")
            finally:
                self._client = None
                self._is_connected = False

    def reconnect(self) -> bool:
        """
        Force reconnection to MongoDB.

        Returns:
            True if reconnection successful, False otherwise
        """
        logger.info("Attempting to reconnect to MongoDB")

        # Close existing connection
        self.disconnect()

        # Try to create new connection
        try:
            self._client = self._create_client()
            self._is_connected = True
            logger.info("MongoDB reconnection successful")
            return True
        except Exception as e:
            logger.error(f"MongoDB reconnection failed: {e}")
            self._is_connected = False
            return False

    def get_database(self, database_name: Optional[str] = None):
        """
        Get a database instance.

        Args:
            database_name: Name of database (uses default if not provided)

        Returns:
            Database instance

        Raises:
            DatabaseNotAvailableError: If client is not available
        """
        client = self.get_client()
        if client is None:
            raise DatabaseNotAvailableError("MongoDB client not available")

        settings = get_settings()
        db_name = database_name or settings.mongodb_db_name

        return client[db_name]

    def get_connection_stats(self) -> dict:
        """
        Get statistics about the current connection.

        Returns:
            Dictionary with connection statistics
        """
        if self._client is None:
            return {
                "connected": False,
                "error": "No client initialized"
            }

        try:
            # Get server status
            server_status = self._client.admin.command('serverStatus')
            connections = server_status.get('connections', {})

            return {
                "connected": True,
                "current_connections": connections.get('current', 0),
                "available_connections": connections.get('available', 0),
                "total_created": connections.get('totalCreated', 0),
                "active": connections.get('active', 0),
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e)
            }

    def list_databases(self) -> list:
        """
        List all databases on the MongoDB server.

        Returns:
            List of database names

        Raises:
            DatabaseNotAvailableError: If client is not available
        """
        client = self.get_client()
        if client is None:
            raise DatabaseNotAvailableError("MongoDB client not available")

        try:
            return client.list_database_names()
        except Exception as e:
            logger.error(f"Error listing databases: {e}")
            raise DatabaseNotAvailableError(f"Failed to list databases: {str(e)}")

    def list_collections(self, database_name: Optional[str] = None) -> list:
        """
        List all collections in a database.

        Args:
            database_name: Name of database (uses default if not provided)

        Returns:
            List of collection names

        Raises:
            DatabaseNotAvailableError: If client is not available
        """
        db = self.get_database(database_name)

        try:
            return db.list_collection_names()
        except Exception as e:
            logger.error(f"Error listing collections: {e}")
            raise DatabaseNotAvailableError(f"Failed to list collections: {str(e)}")

    def drop_database(self, database_name: str, confirm: bool = False) -> None:
        """
        Drop a database.

        WARNING: This is a destructive operation!

        Args:
            database_name: Name of database to drop
            confirm: Must be True to proceed (safety check)

        Raises:
            ValueError: If confirm is not True
            DatabaseNotAvailableError: If client is not available
        """
        if not confirm:
            raise ValueError(
                "Database drop requires explicit confirmation. "
                "Set confirm=True to proceed."
            )

        client = self.get_client()
        if client is None:
            raise DatabaseNotAvailableError("MongoDB client not available")

        try:
            logger.warning(f"Dropping database: {database_name}")
            client.drop_database(database_name)
            logger.info(f"Database {database_name} dropped successfully")
        except Exception as e:
            logger.error(f"Error dropping database {database_name}: {e}")
            raise DatabaseNotAvailableError(f"Failed to drop database: {str(e)}")

    @classmethod
    def reset_instance(cls) -> None:
        """
        Reset the singleton instance.

        This is primarily for testing purposes.
        WARNING: Only use this in test environments!
        """
        if cls._instance is not None:
            if cls._instance._client is not None:
                cls._instance.disconnect()
            cls._instance = None
            cls._client = None
            cls._is_connected = False
            logger.debug("DatabaseConnectionManager instance reset")


# Convenience functions for easy access
_connection_manager: Optional[DatabaseConnectionManager] = None


def get_connection_manager() -> DatabaseConnectionManager:
    """
    Get the singleton DatabaseConnectionManager instance.

    Returns:
        DatabaseConnectionManager instance
    """
    global _connection_manager
    if _connection_manager is None:
        _connection_manager = DatabaseConnectionManager()
    return _connection_manager


def get_database(database_name: Optional[str] = None):
    """
    Convenience function to get a database instance.

    Args:
        database_name: Name of database (uses default if not provided)

    Returns:
        Database instance
    """
    manager = get_connection_manager()
    return manager.get_database(database_name)


def health_check() -> dict:
    """
    Convenience function to perform a health check.

    Returns:
        Health check results
    """
    manager = get_connection_manager()
    return manager.health_check()


def disconnect() -> None:
    """
    Convenience function to disconnect from MongoDB.

    Should be called during application shutdown.
    """
    manager = get_connection_manager()
    manager.disconnect()
