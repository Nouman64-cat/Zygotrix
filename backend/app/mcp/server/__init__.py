"""
MCP Server Package - The "Hands"
================================
This package contains the MCP server implementation and tool definitions.

Components:
- service.py: The actual MCP Server instance
- tools.py: Genetic tool definitions (wrapped from chatbot_tools)
"""

from .service import MCPServer
from .tools import mcp_tools, register_tools

__all__ = [
    "MCPServer",
    "mcp_tools",
    "register_tools",
]
