"""
MCP Integration Test Script
============================
Run this script to test the MCP server and client functionality.

Usage:
    python test_mcp.py
"""

import asyncio
import sys

# Add the app directory to the path
sys.path.insert(0, ".")

from app.mcp.server import get_mcp_server, register_tools
from app.mcp.client import get_mcp_client


async def test_mcp():
    """Test the MCP server and client integration."""
    print("=" * 60)
    print("🧪 MCP Integration Test")
    print("=" * 60)
    
    # Test 1: Initialize and connect client
    print("\n📋 Test 1: Initialize MCP Client")
    print("-" * 40)
    
    client = get_mcp_client()
    await client.connect()
    
    print(f"✅ Client connected: {client.is_connected}")
    
    # Test 2: List available tools
    print("\n📋 Test 2: List Available Tools")
    print("-" * 40)
    
    tools = client.list_available_tools()
    print(f"✅ Found {len(tools)} registered tools:\n")
    
    for tool in tools:
        print(f"   🔧 {tool['name']}")
        print(f"      Category: {tool['category']}")
        print(f"      Description: {tool['description'][:60]}...")
        print()
    
    # Test 3: Call get_traits_count tool
    print("\n📋 Test 3: Call 'get_traits_count' Tool")
    print("-" * 40)
    
    result = await client.call_tool("get_traits_count")
    if result.get("success"):
        data = result["result"]
        print(f"✅ Success!")
        print(f"   Total Traits: {data.get('total_traits', 'N/A')}")
        print(f"   Monogenic: {data.get('monogenic_traits', 'N/A')}")
        print(f"   Polygenic: {data.get('polygenic_traits', 'N/A')}")
    else:
        print(f"⚠️ Error: {result.get('error')}")
    
    # Test 4: Call search_traits tool
    print("\n📋 Test 4: Call 'search_traits' Tool")
    print("-" * 40)
    
    result = await client.call_tool("search_traits", {"query": "eye color", "limit": 3})
    if result.get("success"):
        data = result["result"]
        print(f"✅ Success! Found {data.get('count', 0)} results")
        if data.get("results"):
            for trait in data["results"][:3]:
                print(f"   - {trait.get('name', 'Unknown')} ({trait.get('type', 'Unknown')})")
    else:
        print(f"⚠️ Error: {result.get('error')}")
    
    # Test 5: Call calculate_punnett_square tool
    print("\n📋 Test 5: Call 'calculate_punnett_square' Tool")
    print("-" * 40)
    
    result = await client.call_tool(
        "calculate_punnett_square",
        {"parent1": "Aa", "parent2": "Aa"}
    )
    if result.get("success"):
        data = result["result"]
        print(f"✅ Success!")
        print(f"   Cross Type: {data.get('cross_type', 'N/A')}")
        print(f"   Genotype Ratio: {data.get('genotype_ratio', 'N/A')}")
        print(f"   Phenotype Ratio: {data.get('phenotype_ratio', 'N/A')}")
        if data.get("offspring_genotypes"):
            print(f"   Offspring:")
            for offspring in data["offspring_genotypes"]:
                print(f"      - {offspring.get('genotype')}: {offspring.get('percentage')} ({offspring.get('phenotype')})")
    else:
        print(f"⚠️ Error: {result.get('error')}")
    
    # Test 6: Disconnect client
    print("\n📋 Test 6: Disconnect MCP Client")
    print("-" * 40)
    
    await client.disconnect()
    print(f"✅ Client disconnected: {not client.is_connected}")
    
    print("\n" + "=" * 60)
    print("🎉 All MCP Tests Completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_mcp())
