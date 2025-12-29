"""
Test script to verify the breeding simulation MCP tool is properly registered.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_tool_registration():
    """Test that the breeding simulation tool is registered in MCP."""
    from app.mcp.server import get_mcp_server
    from app.mcp.server.tools import register_tools

    # Get MCP server instance
    server = get_mcp_server()

    # Register all tools
    print("Registering MCP tools...")
    register_tools(server)

    # List all registered tools
    tools = server.list_tools()
    print(f"\nTotal tools registered: {len(tools)}")

    # Find the breeding simulation tool
    breeding_tool = None
    for tool in tools:
        if tool.name == "create_breeding_simulation":
            breeding_tool = tool
            break

    if breeding_tool:
        print("\n[OK] SUCCESS: Breeding simulation tool is registered!")
        print(f"\nTool Details:")
        print(f"  Name: {breeding_tool.name}")
        print(f"  Description: {breeding_tool.description}")
        print(f"  Category: {breeding_tool.category}")
        print(f"  Parameters: {len(breeding_tool.parameters)}")
        print(f"\n  Parameter Details:")
        for param in breeding_tool.parameters:
            print(f"    - {param.name} ({param.type}): {param.description}")
            print(f"      Required: {param.required}, Default: {param.default}")
        return True
    else:
        print("\n[FAIL] FAILED: Breeding simulation tool NOT found in registered tools!")
        print("\nRegistered tool names:")
        for tool in tools:
            print(f"  - {tool.name}")
        return False


def test_tool_execution():
    """Test executing the breeding simulation tool."""
    from app.chatbot_tools import create_breeding_simulation

    print("\n" + "="*60)
    print("Testing Tool Execution")
    print("="*60)

    try:
        # Test with default parameters
        print("\n1. Testing with default parameters...")
        result = create_breeding_simulation()

        print("[OK] Tool executed successfully!")
        print(f"\nResult structure:")
        print(f"  widget_type: {result.get('widget_type')}")
        print(f"  parent1: {result.get('parent1', {}).get('genotype')}")
        print(f"  parent2: {result.get('parent2', {}).get('genotype')}")
        print(f"  traits: {result.get('traits')}")
        print(f"  results: {'Present' if result.get('results') else 'None'}")

        # Test with custom parameters
        print("\n2. Testing with custom parameters...")
        custom_result = create_breeding_simulation(
            parent1_genotypes={"eye_color": "BB", "hair_color": "Hh"},
            parent2_genotypes={"eye_color": "bb", "hair_color": "hh"},
            parent1_sex="female",
            parent2_sex="male",
            run_cross=True
        )

        print("[OK] Custom parameters test passed!")
        print(f"  Parent 1 genotype: {custom_result['parent1']['genotype']}")
        print(f"  Parent 2 genotype: {custom_result['parent2']['genotype']}")

        return True

    except Exception as e:
        print(f"[FAIL] FAILED: Tool execution error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_claude_tools_format():
    """Test that the tool is properly formatted for Claude."""
    from app.mcp.claude_tools import get_claude_tools_schema

    print("\n" + "="*60)
    print("Testing Claude Tools Format")
    print("="*60)

    # Get tools in Claude format
    claude_tools = get_claude_tools_schema()

    # Find breeding simulation tool
    breeding_tool = None
    for tool in claude_tools:
        if tool["name"] == "create_breeding_simulation":
            breeding_tool = tool
            break

    if breeding_tool:
        print("\n[OK] Tool is properly formatted for Claude!")
        print(f"\nClaude Tool Schema:")
        import json
        print(json.dumps(breeding_tool, indent=2))
        return True
    else:
        print("\n[FAIL] FAILED: Tool not found in Claude format!")
        return False


if __name__ == "__main__":
    print("="*60)
    print("MCP Breeding Simulation Tool - Integration Test")
    print("="*60)

    # Run all tests
    test1 = test_tool_registration()
    test2 = test_tool_execution()
    test3 = test_claude_tools_format()

    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    print(f"Tool Registration: {'[PASSED]' if test1 else '[FAILED]'}")
    print(f"Tool Execution: {'[PASSED]' if test2 else '[FAILED]'}")
    print(f"Claude Format: {'[PASSED]' if test3 else '[FAILED]'}")

    if test1 and test2 and test3:
        print("\n[OK] ALL TESTS PASSED! MCP integration is complete.")
        sys.exit(0)
    else:
        print("\n[FAIL] SOME TESTS FAILED. Please review the errors above.")
        sys.exit(1)
