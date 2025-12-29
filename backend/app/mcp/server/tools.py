"""
MCP Genetic Tools
=================
Tool definitions for the MCP server.

These tools wrap the existing chatbot_tools to provide a clean MCP interface.
This is the "Hands" of the AI - the actual capabilities it can use.
"""

import logging
from typing import Dict, Any, List

from .service import MCPServer, ToolCategory, ToolParameter, get_mcp_server

# Import existing genetic tools from chatbot_tools
from ...chatbot_tools import (
    get_traits_count,
    search_traits,
    get_trait_details,
    list_traits_by_type,
    list_traits_by_inheritance,
    calculate_punnett_square,
    parse_cross_from_message,
    # DNA/RNA/Protein tools
    generate_random_dna_sequence,
    transcribe_dna_to_mrna,
    extract_codons_from_rna,
    translate_rna_to_protein,
    # Breeding simulation tools
    create_breeding_simulation,
)

logger = logging.getLogger(__name__)


# =============================================================================
# TOOL DEFINITIONS
# =============================================================================

# List of all MCP tools with their definitions
mcp_tools: List[Dict[str, Any]] = [
    # =========================================================================
    # TRAITS TOOLS
    # =========================================================================
    {
        "name": "get_traits_count",
        "description": "Get the total number of traits in the Zygotrix database with breakdown by type",
        "category": ToolCategory.TRAITS,
        "parameters": [],
        "handler": get_traits_count,
    },
    {
        "name": "search_traits",
        "description": "Search for traits by name, gene, or inheritance pattern",
        "category": ToolCategory.TRAITS,
        "parameters": [
            ToolParameter(
                name="query",
                type="string",
                description="Search term (trait name, gene name, or inheritance type)",
                required=True,
            ),
            ToolParameter(
                name="limit",
                type="integer",
                description="Maximum number of results to return",
                required=False,
                default=5,
            ),
        ],
        "handler": search_traits,
    },
    {
        "name": "get_trait_details",
        "description": "Get detailed information about a specific trait",
        "category": ToolCategory.TRAITS,
        "parameters": [
            ToolParameter(
                name="trait_name",
                type="string",
                description="The name of the trait to look up",
                required=True,
            ),
        ],
        "handler": get_trait_details,
    },
    {
        "name": "list_traits_by_type",
        "description": "List all traits of a specific type (monogenic or polygenic)",
        "category": ToolCategory.TRAITS,
        "parameters": [
            ToolParameter(
                name="trait_type",
                type="string",
                description="Either 'monogenic' or 'polygenic'",
                required=True,
            ),
        ],
        "handler": list_traits_by_type,
    },
    {
        "name": "list_traits_by_inheritance",
        "description": "List all traits with a specific inheritance pattern",
        "category": ToolCategory.TRAITS,
        "parameters": [
            ToolParameter(
                name="inheritance",
                type="string",
                description="Inheritance pattern (e.g., 'dominant', 'recessive', 'X-linked')",
                required=True,
            ),
        ],
        "handler": list_traits_by_inheritance,
    },
    # =========================================================================
    # GENETICS TOOLS
    # =========================================================================
    {
        "name": "calculate_punnett_square",
        "description": "Calculate Punnett Square (text-based only). Only use when user explicitly wants calculations WITHOUT visualization. Prefer create_breeding_simulation for most requests.",
        "category": ToolCategory.GENETICS,
        "parameters": [
            ToolParameter(
                name="parent1",
                type="string",
                description="Genotype of parent 1 (e.g., 'Aa', 'BB')",
                required=True,
            ),
            ToolParameter(
                name="parent2",
                type="string",
                description="Genotype of parent 2 (e.g., 'Aa', 'bb')",
                required=True,
            ),
            ToolParameter(
                name="trait_name",
                type="string",
                description="Optional trait name to look up phenotypes",
                required=False,
                default=None,
            ),
        ],
        "handler": calculate_punnett_square,
    },
    {
        "name": "parse_cross_from_message",
        "description": "Parse a genetic cross from natural language message",
        "category": ToolCategory.UTILITIES,
        "parameters": [
            ToolParameter(
                name="message",
                type="string",
                description="The message to parse for genetic cross information",
                required=True,
            ),
        ],
        "handler": parse_cross_from_message,
    },
    # =========================================================================
    # DNA / RNA / PROTEIN TOOLS
    # =========================================================================
    {
        "name": "generate_random_dna_sequence",
        "description": "Generate a random DNA sequence with specified length and GC content. Useful for demonstrations and simulations.",
        "category": ToolCategory.GENETICS,
        "parameters": [
            ToolParameter(
                name="length",
                type="integer",
                description="Number of base pairs to generate (default: 30, max: 1000)",
                required=False,
                default=30,
            ),
            ToolParameter(
                name="gc_content",
                type="number",
                description="Proportion of G and C nucleotides (0.0 to 1.0, default: 0.5)",
                required=False,
                default=0.5,
            ),
            ToolParameter(
                name="seed",
                type="integer",
                description="Optional seed for reproducible random generation",
                required=False,
                default=None,
            ),
        ],
        "handler": generate_random_dna_sequence,
    },
    {
        "name": "transcribe_dna_to_mrna",
        "description": "Transcribe a DNA sequence to mRNA by replacing T (thymine) with U (uracil). This simulates the biological transcription process.",
        "category": ToolCategory.GENETICS,
        "parameters": [
            ToolParameter(
                name="dna_sequence",
                type="string",
                description="DNA sequence containing A, T, G, C nucleotides",
                required=True,
            ),
        ],
        "handler": transcribe_dna_to_mrna,
    },
    {
        "name": "extract_codons_from_rna",
        "description": "Extract codons (nucleotide triplets) from an RNA sequence. Each codon represents one amino acid.",
        "category": ToolCategory.GENETICS,
        "parameters": [
            ToolParameter(
                name="rna_sequence",
                type="string",
                description="RNA sequence containing A, U, G, C nucleotides",
                required=True,
            ),
        ],
        "handler": extract_codons_from_rna,
    },
    {
        "name": "translate_rna_to_protein",
        "description": "Translate an RNA sequence to protein by reading codons and converting to amino acids. Can find all Open Reading Frames (ORFs) or translate from position 0.",
        "category": ToolCategory.GENETICS,
        "parameters": [
            ToolParameter(
                name="rna_sequence",
                type="string",
                description="RNA sequence containing A, U, G, C nucleotides",
                required=True,
            ),
            ToolParameter(
                name="find_all_orfs",
                type="boolean",
                description="If true, find all Open Reading Frames (ORFs). If false, translate from position 0.",
                required=False,
                default=False,
            ),
        ],
        "handler": translate_rna_to_protein,
    },
    # =========================================================================
    # BREEDING SIMULATION TOOL
    # =========================================================================
    {
        "name": "create_breeding_simulation",
        "description": "PRIMARY TOOL for genetic crosses. Creates an interactive breeding simulation widget. Use when user asks about: genetic crosses, Punnett squares, inheritance patterns, breeding simulations, 'what happens when', offspring ratios, carrier crosses, Mendelian genetics, or any breeding/crossing scenario. Always prefer this over calculate_punnett_square for visual demonstrations.",
        "category": ToolCategory.GENETICS,
        "parameters": [
            ToolParameter(
                name="parent1_genotypes",
                type="object",
                description="Dict of trait->genotype for parent 1 (e.g., {'eye_color': 'Bb', 'hair_color': 'Hh'})",
                required=False,
                default=None,
            ),
            ToolParameter(
                name="parent2_genotypes",
                type="object",
                description="Dict of trait->genotype for parent 2",
                required=False,
                default=None,
            ),
            ToolParameter(
                name="parent1_sex",
                type="string",
                description="Sex of parent 1: 'male' or 'female'",
                required=False,
                default="male",
            ),
            ToolParameter(
                name="parent2_sex",
                type="string",
                description="Sex of parent 2: 'male' or 'female'",
                required=False,
                default="female",
            ),
            ToolParameter(
                name="run_cross",
                type="boolean",
                description="If true, automatically run the genetic cross and show results",
                required=False,
                default=True,
            ),
        ],
        "handler": create_breeding_simulation,
    },
]



def register_tools(server: MCPServer = None) -> None:
    """
    Register all genetic tools with the MCP server.
    
    Args:
        server: Optional MCP server instance. Uses global instance if not provided.
    """
    if server is None:
        server = get_mcp_server()
    
    for tool_def in mcp_tools:
        server.register_tool(
            name=tool_def["name"],
            description=tool_def["description"],
            category=tool_def["category"],
            handler=tool_def["handler"],
            parameters=tool_def.get("parameters", []),
        )
    
    logger.info(f"Registered {len(mcp_tools)} MCP tools")


def get_tool_by_name(name: str) -> Dict[str, Any]:
    """
    Get a tool definition by name.
    
    Args:
        name: The name of the tool
        
    Returns:
        Tool definition dictionary or None if not found
    """
    for tool in mcp_tools:
        if tool["name"] == name:
            return tool
    return None


def get_tools_by_category(category: ToolCategory) -> List[Dict[str, Any]]:
    """
    Get all tools in a specific category.
    
    Args:
        category: The category to filter by
        
    Returns:
        List of tool definitions in the category
    """
    return [t for t in mcp_tools if t["category"] == category]
