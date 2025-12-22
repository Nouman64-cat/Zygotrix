"""
Zygotrix MCP (Model Context Protocol) Package
==============================================
This package provides the MCP infrastructure for the Zygotrix AI chatbot.

Structure:
- server/: The MCP Server (The "Hands") - Tool definitions and service
- client/: The MCP Client (The "Brain") - Connection management and lifespans
"""

from .server import MCPServer, mcp_tools
from .client import MCPClient, mcp_lifespan

__all__ = [
    "MCPServer",
    "mcp_tools",
    "MCPClient",
    "mcp_lifespan",
]
