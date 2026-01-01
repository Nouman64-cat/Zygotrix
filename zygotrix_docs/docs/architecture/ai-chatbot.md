---
sidebar_position: 5
---

# AI Chatbot Architecture

Zygotrix AI, the Zygotrix AI chatbot, is powered by Claude AI with custom genetics tools through the Model Context Protocol (MCP).

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Query                               │
│            "What are the offspring of Aa × Aa?"                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Query Classifier                              │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Rule-Based   │ OR │   LLM-Based  │ => │   Category   │      │
│  │  Patterns    │    │  (Claude)    │    │ genetics_tools│      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Claude AI + MCP Tools                         │
│                                                                  │
│  System Prompt + Tools ──► Claude ──► Tool Calls                │
│                                          │                       │
│                              ┌───────────┴───────────┐          │
│                              ▼                       ▼          │
│                    calculate_punnett_square    search_traits    │
│                              │                       │          │
│                              └───────────┬───────────┘          │
│                                          ▼                       │
│                              Final Response to User              │
└─────────────────────────────────────────────────────────────────┘
```

## Query Classification

Queries are classified into categories to optimize routing:

| Category | Description | Data Sources |
|----------|-------------|--------------|
| `conversational` | General chat, greetings | None (fastest) |
| `knowledge` | Genetics concepts, explanations | Pinecone RAG |
| `genetics_tools` | Calculations, searches | MCP Tools |
| `hybrid` | Complex queries needing both | RAG + Tools |

### Classification Flow

```python
# 1. Try rule-based classifier first
result = rule_classifier.classify(query)

if result.confidence >= THRESHOLD:
    return result.category

# 2. Fall back to LLM classifier
return llm_classifier.classify(query)
```

## MCP Tools

The chatbot has access to 18+ genetics tools:

### Trait Tools
- `get_traits_count` - Count traits in database
- `search_traits` - Search traits by keyword
- `get_trait_details` - Get full trait information
- `list_traits_by_type` - Filter by inheritance type
- `list_traits_by_inheritance` - Filter by pattern

### Genetics Calculation Tools
- `calculate_punnett_square` - Calculate genetic cross
- `parse_cross_from_message` - Extract cross from natural language
- `create_breeding_simulation` - Multi-generation simulation

### DNA/RNA Tools
- `generate_random_dna_sequence` - Generate DNA
- `transcribe_dna_to_mrna` - DNA → mRNA
- `extract_codons_from_rna` - Split into codons
- `translate_rna_to_protein` - RNA → Protein

### GWAS Tools
- `upload_gwas_dataset` - Upload VCF/PLINK files
- `list_gwas_datasets` - List user's datasets
- `run_gwas_analysis` - Start GWAS analysis
- `get_gwas_results` - Retrieve results
- `get_gwas_job_status` - Check job status

## Tool Execution

```python
# MCP Tool Definition
@mcp_tool
def calculate_punnett_square(
    parent1_genotype: str,
    parent2_genotype: str,
    trait_name: Optional[str] = None
) -> Dict:
    """Calculate Punnett square for genetic cross."""
    
    # Use C++ engine for calculation
    result = cpp_engine.run_cross(
        parent1=parent1_genotype,
        parent2=parent2_genotype
    )
    
    return {
        "offspring": result.offspring,
        "phenotype_ratios": result.ratios,
        "explanation": generate_explanation(result)
    }
```

## Conversation Management

### Message Storage

```javascript
{
  "conversation_id": "uuid",
  "messages": [
    {
      "role": "user",
      "content": "What is...",
      "timestamp": "2024-01-01T12:00:00Z"
    },
    {
      "role": "assistant", 
      "content": "...",
      "tools_used": ["search_traits", "get_trait_details"],
      "timestamp": "2024-01-01T12:00:05Z"
    }
  ]
}
```

### Context Management

The chatbot maintains context across messages:

```python
def build_context(conversation):
    return {
        "recent_traits": extract_traits(conversation),
        "user_preferences": get_user_preferences(user_id),
        "conversation_summary": summarize_if_long(conversation)
    }
```

## User Preferences

Zygotrix AI adapts to user preferences:

```python
preferences = {
    "style": "technical",      # or "simple", "conversational"
    "length": "detailed",      # or "brief", "comprehensive"
    "auto_learn": True,        # Learn from interactions
    "preferred_examples": []   # Custom example traits
}
```

### Preference Detection

```python
# Detect preferences from user messages
if "explain simply" in message:
    update_preference("style", "simple")
    
if "more detail" in message:
    update_preference("length", "detailed")
```

## Streaming vs Non-Streaming

| Mode | Tools | Best For |
|------|-------|----------|
| **Streaming** | ❌ Disabled | Quick explanations |
| **Non-Streaming** | ✅ Enabled | Calculations, searches |

```python
# Automatically select mode based on query
if classification.category in ["genetics_tools", "hybrid"]:
    # Use non-streaming for tool access
    response = await claude_service.send_message(
        messages=messages,
        tools=mcp_tools,
        stream=False
    )
else:
    # Use streaming for faster response
    async for chunk in claude_service.stream_message(messages):
        yield chunk
```

## Rate Limiting

```python
rate_limits = {
    "user": {
        "tokens_per_session": 50000,
        "requests_per_minute": 20
    },
    "admin": {
        "unlimited": True
    }
}
```

## Error Handling

```python
try:
    response = await claude_service.send_message(...)
except RateLimitError:
    return "You've reached your usage limit. Please try again later."
except ToolExecutionError as e:
    return f"I encountered an issue: {e.message}. Let me try another approach."
```

## Performance Optimizations

### Prompt Caching

Claude's prompt caching reduces costs:

```python
# Cache hit rate typically 40-60%
# Cost savings: 90% on cached tokens
```

### Parallel Tool Execution

```python
# Execute independent tools in parallel
results = await asyncio.gather(
    execute_tool("search_traits", ...),
    execute_tool("get_traits_count", ...),
)
```

## Next Steps

- [Features: AI Chatbot](../features/ai-chatbot) - User-facing documentation
- [API: Chatbot](../api/chatbot/conversations) - API reference
