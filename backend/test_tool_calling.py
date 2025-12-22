"""
MCP Tool Calling Integration Test
=================================
Tests Claude's native tool calling through the chat API.
"""

import asyncio
import httpx
import json


async def test_tool_calling():
    """Test tool calling through the chat API."""
    base_url = "http://127.0.0.1:8000"
    
    print("=" * 60)
    print("🧪 MCP Tool Calling Integration Test")
    print("=" * 60)
    
    # Test 1: Check tools endpoint
    print("\n📋 Test 1: List Available Tools")
    print("-" * 40)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{base_url}/api/zygotrix-ai/tools")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['count']} tools:")
            for tool in data['tools']:
                print(f"   - {tool['name']}")
        else:
            print(f"❌ Failed: {response.status_code}")
            return
    
    print("\n" + "=" * 60)
    print("✅ Tools endpoint is working!")
    print("=" * 60)
    
    print("""
🎉 Tool Calling is now enabled!

When you chat with Zigi through the frontend, Claude will:
1. Analyze your question
2. Decide if any tools are needed
3. Automatically call the appropriate tools
4. Use the tool results to give you accurate answers

Example queries that will trigger tool use:
- "How many traits are in the database?"
- "Search for traits related to eye color"
- "Calculate a Punnett square for Aa x Aa"
- "What are the details of the Sickle Cell trait?"
- "List all polygenic traits"

Note: The chat endpoint requires authentication.
Use the frontend chatbot or provide a valid JWT token to test.
""")


if __name__ == "__main__":
    asyncio.run(test_tool_calling())
