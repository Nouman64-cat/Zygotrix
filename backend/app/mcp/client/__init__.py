"""
MCP Client Package - The "Brain" / "Connector"
===============================================
This package contains the MCP client and lifespan management.

Components:
- lifespans.py: Logic to connect/disconnect efficiently to the MCP server
"""

from .lifespans import MCPClient, mcp_lifespan, get_mcp_client

__all__ = [
    "MCPClient",
    "mcp_lifespan",
    "get_mcp_client",
]
