"""
Zygotrix MCP (Model Context Protocol) Package
==============================================
This package provides the MCP infrastructure for the Zygotrix AI chatbot.

Structure:
- server/: The MCP Server (The "Hands") - Tool definitions and service
- client/: The MCP Client (The "Brain") - Connection management and lifespans
- claude_tools.py: Integration with Claude's native tool calling
"""

from .server import MCPServer, mcp_tools
from .client import MCPClient, mcp_lifespan
from .claude_tools import (
    get_claude_tools_schema,
    execute_tool_call,
    process_tool_calls,
    format_tool_result_for_claude,
    extract_tool_calls,
    extract_text_content,
)

__all__ = [
    "MCPServer",
    "mcp_tools",
    "MCPClient",
    "mcp_lifespan",
    "get_claude_tools_schema",
    "execute_tool_call",
    "process_tool_calls",
    "format_tool_result_for_claude",
    "extract_tool_calls",
    "extract_text_content",
]

