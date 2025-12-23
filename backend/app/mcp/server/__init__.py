"""
MCP Server Package - The "Hands"
================================
This package contains the MCP server implementation and tool definitions.

Components:
- service.py: The actual MCP Server instance
- tools.py: Genetic tool definitions (wrapped from chatbot_tools)
"""

from .service import MCPServer, get_mcp_server
from .tools import mcp_tools, register_tools

__all__ = [
    "MCPServer",
    "get_mcp_server",
    "mcp_tools",
    "register_tools",
]

