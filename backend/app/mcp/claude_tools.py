"""
Claude Tools Integration
========================
Converts MCP tools to Claude's native tool format and handles tool execution.

This module bridges the MCP server with Claude's tool use API.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from .server import get_mcp_server
from .client import get_mcp_client

logger = logging.getLogger(__name__)


def get_claude_tools_schema() -> List[Dict[str, Any]]:
    """
    Convert MCP tools to Claude's tool format.
    
    Claude expects tools in this format:
    {
        "name": "tool_name",
        "description": "what the tool does",
        "input_schema": {
            "type": "object",
            "properties": {...},
            "required": [...]
        }
    }
    
    Returns:
        List of tools in Claude's format
    """
    server = get_mcp_server()
    mcp_tools = server.list_tools()
    
    claude_tools = []
    
    for tool in mcp_tools:
        # Build input schema from MCP parameters
        properties = {}
        required = []
        
        for param in tool.parameters:
            # Convert MCP type to JSON Schema type
            json_type = _convert_type(param.type)
            
            properties[param.name] = {
                "type": json_type,
                "description": param.description,
            }
            
            if param.default is not None:
                properties[param.name]["default"] = param.default
            
            if param.required:
                required.append(param.name)
        
        claude_tool = {
            "name": tool.name,
            "description": tool.description,
            "input_schema": {
                "type": "object",
                "properties": properties,
                "required": required,
            }
        }
        
        claude_tools.append(claude_tool)
    
    return claude_tools


def _convert_type(mcp_type: str) -> str:
    """Convert MCP type strings to JSON Schema types."""
    type_map = {
        "string": "string",
        "str": "string",
        "integer": "integer",
        "int": "integer",
        "number": "number",
        "float": "number",
        "boolean": "boolean",
        "bool": "boolean",
        "array": "array",
        "list": "array",
        "object": "object",
        "dict": "object",
    }
    return type_map.get(mcp_type.lower(), "string")


async def execute_tool_call(
    tool_name: str,
    tool_input: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Execute a tool call from Claude.
    
    Args:
        tool_name: Name of the tool to execute
        tool_input: Arguments from Claude
        
    Returns:
        Tool execution result
    """
    client = get_mcp_client()
    
    # Ensure client is connected
    if not client.is_connected:
        await client.connect()
    
    try:
        result = await client.call_tool(tool_name, tool_input)
        
        if result.get("success"):
            return {
                "success": True,
                "result": result.get("result", {}),
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Unknown error"),
            }
            
    except Exception as e:
        logger.error(f"Error executing tool '{tool_name}': {e}")
        return {
            "success": False,
            "error": str(e),
        }


def format_tool_result_for_claude(
    tool_use_id: str,
    result: Dict[str, Any],
    is_error: bool = False
) -> Dict[str, Any]:
    """
    Format tool result for sending back to Claude.
    
    Args:
        tool_use_id: The tool_use_id from Claude's tool_use block
        result: The result from tool execution
        is_error: Whether this is an error result
        
    Returns:
        Formatted tool result message
    """
    if is_error:
        content = json.dumps({
            "error": result.get("error", "Unknown error occurred"),
            "success": False,
        })
    else:
        # Format the result nicely for Claude
        content = json.dumps(result.get("result", result), indent=2)
    
    return {
        "type": "tool_result",
        "tool_use_id": tool_use_id,
        "content": content,
        "is_error": is_error,
    }


async def process_tool_calls(
    tool_calls: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Process multiple tool calls from Claude.
    
    Args:
        tool_calls: List of tool_use blocks from Claude's response
        
    Returns:
        List of tool_result blocks to send back
    """
    results = []
    
    for tool_call in tool_calls:
        if tool_call.get("type") != "tool_use":
            continue
            
        tool_use_id = tool_call.get("id")
        tool_name = tool_call.get("name")
        tool_input = tool_call.get("input", {})
        
        logger.info(f"Executing tool: {tool_name} with input: {tool_input}")
        
        # Execute the tool
        result = await execute_tool_call(tool_name, tool_input)
        
        # Format for Claude
        is_error = not result.get("success", False)
        formatted = format_tool_result_for_claude(tool_use_id, result, is_error)
        results.append(formatted)
        
        logger.info(f"Tool '{tool_name}' executed: success={not is_error}")
    
    return results


def extract_tool_calls(response_content: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extract tool_use blocks from Claude's response content.
    
    Args:
        response_content: The content array from Claude's response
        
    Returns:
        List of tool_use blocks
    """
    return [block for block in response_content if block.get("type") == "tool_use"]


def extract_text_content(response_content: List[Dict[str, Any]]) -> str:
    """
    Extract text content from Claude's response.
    
    Args:
        response_content: The content array from Claude's response
        
    Returns:
        Combined text content
    """
    text_blocks = [
        block.get("text", "")
        for block in response_content
        if block.get("type") == "text"
    ]
    return "".join(text_blocks)
