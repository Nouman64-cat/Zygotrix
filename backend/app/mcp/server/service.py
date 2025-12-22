"""
MCP Server Service
==================
The actual MCP Server instance that manages tool registration and execution.

This is the "Hands" of the AI - it provides the tools that the AI can use
to interact with the Zygotrix genetic database and perform calculations.
"""

import logging
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class ToolCategory(str, Enum):
    """Categories for organizing MCP tools."""
    TRAITS = "traits"
    GENETICS = "genetics"
    CALCULATIONS = "calculations"
    UTILITIES = "utilities"


@dataclass
class ToolParameter:
    """Definition of a tool parameter."""
    name: str
    type: str
    description: str
    required: bool = True
    default: Any = None


@dataclass
class ToolDefinition:
    """Definition of an MCP tool."""
    name: str
    description: str
    category: ToolCategory
    parameters: List[ToolParameter] = field(default_factory=list)
    handler: Optional[Callable] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "name": self.name,
            "description": self.description,
            "category": self.category.value,
            "parameters": [
                {
                    "name": p.name,
                    "type": p.type,
                    "description": p.description,
                    "required": p.required,
                    "default": p.default,
                }
                for p in self.parameters
            ],
        }


class MCPServer:
    """
    MCP Server for Zygotrix AI.
    
    This server manages the registration and execution of tools that the AI
    can use to interact with genetic data and perform calculations.
    
    Usage:
        server = MCPServer()
        server.register_tool(...)
        result = await server.execute_tool("tool_name", {"param": "value"})
    """
    
    _instance: Optional["MCPServer"] = None
    
    def __new__(cls) -> "MCPServer":
        """Singleton pattern to ensure only one server instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the MCP server."""
        if self._initialized:
            return
            
        self._tools: Dict[str, ToolDefinition] = {}
        self._initialized = True
        logger.info("MCP Server initialized")
    
    def register_tool(
        self,
        name: str,
        description: str,
        category: ToolCategory,
        handler: Callable,
        parameters: Optional[List[ToolParameter]] = None,
    ) -> None:
        """
        Register a new tool with the server.
        
        Args:
            name: Unique name for the tool
            description: Human-readable description
            category: Category for organization
            handler: Function to execute when tool is called
            parameters: List of parameter definitions
        """
        if name in self._tools:
            logger.warning(f"Tool '{name}' already registered, overwriting")
        
        tool = ToolDefinition(
            name=name,
            description=description,
            category=category,
            parameters=parameters or [],
            handler=handler,
        )
        
        self._tools[name] = tool
        logger.info(f"Registered tool: {name} ({category.value})")
    
    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        """Get a tool definition by name."""
        return self._tools.get(name)
    
    def list_tools(
        self,
        category: Optional[ToolCategory] = None
    ) -> List[ToolDefinition]:
        """
        List all registered tools, optionally filtered by category.
        
        Args:
            category: Optional category to filter by
            
        Returns:
            List of tool definitions
        """
        tools = list(self._tools.values())
        
        if category:
            tools = [t for t in tools if t.category == category]
        
        return tools
    
    def get_tools_schema(self) -> List[Dict[str, Any]]:
        """
        Get the schema for all registered tools.
        
        Returns:
            List of tool schemas suitable for AI model consumption
        """
        return [tool.to_dict() for tool in self._tools.values()]
    
    async def execute_tool(
        self,
        name: str,
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a registered tool.
        
        Args:
            name: Name of the tool to execute
            arguments: Dictionary of arguments to pass to the tool
            
        Returns:
            Result dictionary from the tool execution
            
        Raises:
            ValueError: If tool is not found
        """
        tool = self._tools.get(name)
        
        if not tool:
            raise ValueError(f"Tool '{name}' not found")
        
        if not tool.handler:
            raise ValueError(f"Tool '{name}' has no handler")
        
        try:
            logger.info(f"Executing tool: {name} with args: {arguments}")
            
            # Check if handler is async
            import asyncio
            if asyncio.iscoroutinefunction(tool.handler):
                result = await tool.handler(**arguments)
            else:
                result = tool.handler(**arguments)
            
            logger.info(f"Tool '{name}' executed successfully")
            return {"success": True, "result": result}
            
        except Exception as e:
            logger.error(f"Error executing tool '{name}': {e}")
            return {"success": False, "error": str(e)}
    
    def reset(self) -> None:
        """Reset the server by clearing all registered tools."""
        self._tools.clear()
        logger.info("MCP Server reset")


# Global singleton instance
_server: Optional[MCPServer] = None


def get_mcp_server() -> MCPServer:
    """Get the global MCP server instance."""
    global _server
    if _server is None:
        _server = MCPServer()
    return _server
