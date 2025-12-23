"""
MCP Client Lifespans
====================
Logic to connect and disconnect efficiently to the MCP server.

This is the "Brain" / "Connector" - it manages the connection lifecycle
and provides a clean interface for the API routes to use MCP tools.
"""

import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, AsyncGenerator

from ..server import MCPServer, get_mcp_server, register_tools

logger = logging.getLogger(__name__)


class MCPClient:
    """
    MCP Client for connecting to the MCP Server.
    
    This client manages the connection to the MCP server and provides
    methods to execute tools and manage the connection lifecycle.
    
    Usage:
        async with MCPClient() as client:
            result = await client.call_tool("search_traits", {"query": "eye color"})
    """
    
    _instance: Optional["MCPClient"] = None
    
    def __new__(cls) -> "MCPClient":
        """Singleton pattern to ensure only one client instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the MCP client."""
        if self._initialized:
            return
            
        self._server: Optional[MCPServer] = None
        self._connected: bool = False
        self._initialized = True
        logger.info("MCP Client initialized")
    
    async def connect(self) -> None:
        """
        Connect to the MCP server.
        
        This initializes the server and registers all tools.
        """
        if self._connected:
            logger.warning("MCP Client already connected")
            return
        
        try:
            # Get the MCP server instance
            self._server = get_mcp_server()
            
            # Register all tools
            register_tools(self._server)
            
            self._connected = True
            logger.info("MCP Client connected to server")
            
        except Exception as e:
            logger.error(f"Failed to connect MCP Client: {e}")
            raise
    
    async def disconnect(self) -> None:
        """
        Disconnect from the MCP server.
        
        This cleans up resources and resets the connection state.
        """
        if not self._connected:
            logger.warning("MCP Client not connected")
            return
        
        try:
            # Reset the server
            if self._server:
                self._server.reset()
            
            self._server = None
            self._connected = False
            logger.info("MCP Client disconnected from server")
            
        except Exception as e:
            logger.error(f"Error disconnecting MCP Client: {e}")
            raise
    
    @property
    def is_connected(self) -> bool:
        """Check if the client is connected to the server."""
        return self._connected
    
    async def call_tool(
        self,
        name: str,
        arguments: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Call an MCP tool.
        
        Args:
            name: Name of the tool to call
            arguments: Dictionary of arguments to pass to the tool
            
        Returns:
            Result dictionary from the tool execution
            
        Raises:
            RuntimeError: If client is not connected
            ValueError: If tool is not found
        """
        if not self._connected or not self._server:
            raise RuntimeError("MCP Client not connected")
        
        return await self._server.execute_tool(name, arguments or {})
    
    def list_available_tools(self) -> List[Dict[str, Any]]:
        """
        List all available tools.
        
        Returns:
            List of tool schemas
        """
        if not self._connected or not self._server:
            return []
        
        return self._server.get_tools_schema()
    
    async def __aenter__(self) -> "MCPClient":
        """Async context manager entry."""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.disconnect()


# Global singleton instance
_client: Optional[MCPClient] = None


def get_mcp_client() -> MCPClient:
    """Get the global MCP client instance."""
    global _client
    if _client is None:
        _client = MCPClient()
    return _client


@asynccontextmanager
async def mcp_lifespan() -> AsyncGenerator[MCPClient, None]:
    """
    FastAPI lifespan context manager for MCP.
    
    Usage in FastAPI:
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            async with mcp_lifespan() as mcp_client:
                yield
        
        app = FastAPI(lifespan=lifespan)
    
    Yields:
        The connected MCP client instance
    """
    client = get_mcp_client()
    
    try:
        await client.connect()
        logger.info("MCP lifespan started")
        yield client
        
    finally:
        await client.disconnect()
        logger.info("MCP lifespan ended")


async def startup_mcp() -> MCPClient:
    """
    Startup function for MCP.
    
    Can be used with FastAPI's on_event("startup") decorator.
    
    Returns:
        The connected MCP client instance
    """
    client = get_mcp_client()
    await client.connect()
    return client


async def shutdown_mcp() -> None:
    """
    Shutdown function for MCP.
    
    Can be used with FastAPI's on_event("shutdown") decorator.
    """
    client = get_mcp_client()
    await client.disconnect()
