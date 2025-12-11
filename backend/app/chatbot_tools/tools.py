"""Chatbot tools for accessing Zygotrix data."""

import json
from pathlib import Path
from typing import Optional
from difflib import SequenceMatcher


# Load traits dataset once at module load
_traits_data: list[dict] = []
_traits_loaded = False


def _load_traits() -> list[dict]:
    """Load traits from the JSON dataset file."""
    global _traits_data, _traits_loaded
    
    if _traits_loaded:
        return _traits_data
    
    try:
        # Path relative to this file: app/chatbot_tools/tools.py -> data/traits_dataset.json
        traits_path = Path(__file__).resolve().parent.parent.parent / "data" / "traits_dataset.json"
        
        with open(traits_path, "r", encoding="utf-8") as f:
            _traits_data = json.load(f)
        
        _traits_loaded = True
        return _traits_data
    except Exception as e:
        print(f"Error loading traits dataset: {e}")
        return []


def get_traits_count() -> dict:
    """
    Get the total number of traits in the Zygotrix database.
    
    Returns:
        dict: Contains total count and breakdown by type (monogenic/polygenic)
    """
    traits = _load_traits()
    
    if not traits:
        return {"error": "Could not load traits data"}
    
    monogenic_count = sum(1 for t in traits if t.get("type") == "monogenic")
    polygenic_count = sum(1 for t in traits if t.get("type") == "polygenic")
    
    return {
        "total_traits": len(traits),
        "monogenic_traits": monogenic_count,
        "polygenic_traits": polygenic_count,
        "message": f"Zygotrix has {len(traits)} genetic traits in its database: {monogenic_count} monogenic traits and {polygenic_count} polygenic traits."
    }


def _similarity_score(s1: str, s2: str) -> float:
    """Calculate similarity between two strings (0-1)."""
    return SequenceMatcher(None, s1.lower(), s2.lower()).ratio()


def search_traits(query: str, limit: int = 5) -> dict:
    """
    Search for traits by name, gene, or inheritance pattern.
    
    Args:
        query: Search term (trait name, gene name, or inheritance type)
        limit: Maximum number of results to return
    
    Returns:
        dict: Search results with matching traits
    """
    traits = _load_traits()
    
    if not traits:
        return {"error": "Could not load traits data"}
    
    query_lower = query.lower().strip()
    results = []
    
    for trait in traits:
        trait_name = trait.get("trait", "").lower()
        genes = [g.lower() for g in trait.get("gene", []) if g]
        inheritance = trait.get("inheritance", "").lower()
        trait_type = trait.get("type", "").lower()
        
        # Check for exact or partial matches
        score = 0
        match_reason = ""
        
        # Trait name match (highest priority)
        if query_lower in trait_name:
            score = 1.0 if query_lower == trait_name else 0.9
            match_reason = "trait name"
        elif any(query_lower in gene for gene in genes):
            score = 0.8
            match_reason = "gene name"
        elif query_lower in inheritance:
            score = 0.7
            match_reason = "inheritance pattern"
        elif query_lower in trait_type:
            score = 0.6
            match_reason = "trait type"
        else:
            # Fuzzy matching for trait names
            similarity = _similarity_score(query_lower, trait_name)
            if similarity > 0.5:
                score = similarity * 0.5
                match_reason = "similar name"
        
        if score > 0:
            results.append({
                "trait": trait,
                "score": score,
                "match_reason": match_reason
            })
    
    # Sort by score and limit results
    results.sort(key=lambda x: x["score"], reverse=True)
    top_results = results[:limit]
    
    if not top_results:
        return {
            "found": False,
            "message": f"No traits found matching '{query}'. Try searching for specific trait names like 'Cystic Fibrosis', gene names like 'CFTR', or inheritance patterns like 'dominant' or 'recessive'.",
            "suggestions": ["eye color", "blood type", "cystic fibrosis", "sickle cell", "hemophilia"]
        }
    
    return {
        "found": True,
        "count": len(top_results),
        "query": query,
        "results": [
            {
                "name": r["trait"]["trait"],
                "type": r["trait"].get("type", "unknown"),
                "inheritance": r["trait"].get("inheritance", "unknown"),
                "genes": r["trait"].get("gene", []),
                "match_reason": r["match_reason"]
            }
            for r in top_results
        ]
    }


def get_trait_details(trait_name: str) -> dict:
    """
    Get detailed information about a specific trait.
    
    Args:
        trait_name: The name of the trait to look up
    
    Returns:
        dict: Detailed trait information or error message
    """
    traits = _load_traits()
    
    if not traits:
        return {"error": "Could not load traits data"}
    
    trait_name_lower = trait_name.lower().strip()
    
    # First try exact match
    for trait in traits:
        if trait.get("trait", "").lower() == trait_name_lower:
            return _format_trait_details(trait)
    
    # Try partial match
    for trait in traits:
        if trait_name_lower in trait.get("trait", "").lower():
            return _format_trait_details(trait)
    
    # Try fuzzy match
    best_match = None
    best_score = 0
    
    for trait in traits:
        score = _similarity_score(trait_name_lower, trait.get("trait", "").lower())
        if score > best_score and score > 0.5:
            best_score = score
            best_match = trait
    
    if best_match:
        result = _format_trait_details(best_match)
        result["note"] = f"Showing results for '{best_match['trait']}' (closest match to '{trait_name}')"
        return result
    
    return {
        "found": False,
        "message": f"Could not find trait '{trait_name}'. Try searching with a different name or use search_traits() to find available traits.",
        "suggestions": ["ABO Blood Group", "Cystic Fibrosis", "Eye Color", "Sickle cell anemia"]
    }


def _format_trait_details(trait: dict) -> dict:
    """Format trait data into a user-friendly response."""
    phenotypes = trait.get("phenotypes", {})
    
    # Format phenotypes nicely
    phenotype_list = []
    for genotype, phenotype in phenotypes.items():
        phenotype_list.append(f"{genotype}: {phenotype}")
    
    genes = trait.get("gene", [])
    gene_str = ", ".join([g for g in genes if g]) if genes else "Unknown"
    
    chromosomes = trait.get("chromosome", [])
    chr_str = ", ".join([str(c) for c in chromosomes]) if chromosomes else "Unknown"
    
    return {
        "found": True,
        "name": trait.get("trait", "Unknown"),
        "type": trait.get("type", "unknown"),
        "inheritance": trait.get("inheritance", "unknown"),
        "genes": gene_str,
        "chromosomes": chr_str,
        "alleles": trait.get("alleles", []),
        "phenotypes": phenotypes,
        "phenotype_summary": phenotype_list,
        "description": _generate_trait_description(trait)
    }


def _generate_trait_description(trait: dict) -> str:
    """Generate a friendly description of the trait."""
    name = trait.get("trait", "This trait")
    trait_type = trait.get("type", "genetic")
    inheritance = trait.get("inheritance", "")
    genes = [g for g in trait.get("gene", []) if g]
    
    gene_text = f"the {genes[0]} gene" if len(genes) == 1 else f"multiple genes including {', '.join(genes[:3])}" if genes else "unknown genes"
    
    inheritance_text = {
        "dominant": "only one copy of the gene is needed to express the trait",
        "recessive": "two copies of the gene are needed for the trait to appear",
        "codominant": "both alleles are expressed equally when present",
        "autosomal_dominant": "only one copy from either parent can cause the trait",
        "autosomal_recessive": "both parents must pass on a copy for the trait to appear",
        "X-linked recessive": "the trait is carried on the X chromosome and more commonly affects males",
        "X-linked dominant": "the trait is carried on the X chromosome and can affect both sexes",
    }.get(inheritance, f"follows {inheritance} inheritance" if inheritance else "has a complex inheritance pattern")
    
    return f"{name} is a {trait_type} trait controlled by {gene_text}. In this trait, {inheritance_text}."


def list_traits_by_type(trait_type: str) -> dict:
    """
    List all traits of a specific type.
    
    Args:
        trait_type: Either 'monogenic' or 'polygenic'
    
    Returns:
        dict: List of trait names of the specified type
    """
    traits = _load_traits()
    
    if not traits:
        return {"error": "Could not load traits data"}
    
    trait_type_lower = trait_type.lower().strip()
    
    if trait_type_lower not in ["monogenic", "polygenic"]:
        return {
            "error": f"Invalid trait type '{trait_type}'. Use 'monogenic' or 'polygenic'."
        }
    
    matching_traits = [
        t.get("trait", "Unknown")
        for t in traits
        if t.get("type", "").lower() == trait_type_lower
    ]
    
    return {
        "type": trait_type_lower,
        "count": len(matching_traits),
        "traits": matching_traits
    }


def list_traits_by_inheritance(inheritance: str) -> dict:
    """
    List all traits with a specific inheritance pattern.
    
    Args:
        inheritance: Inheritance pattern (e.g., 'dominant', 'recessive', 'X-linked')
    
    Returns:
        dict: List of trait names with the specified inheritance
    """
    traits = _load_traits()
    
    if not traits:
        return {"error": "Could not load traits data"}
    
    inheritance_lower = inheritance.lower().strip()
    
    matching_traits = [
        {
            "name": t.get("trait", "Unknown"),
            "inheritance": t.get("inheritance", "")
        }
        for t in traits
        if inheritance_lower in t.get("inheritance", "").lower()
    ]
    
    return {
        "inheritance_pattern": inheritance,
        "count": len(matching_traits),
        "traits": matching_traits
    }


# Export the main functions for use by the chatbot
__all__ = [
    "get_traits_count",
    "search_traits", 
    "get_trait_details",
    "list_traits_by_type",
    "list_traits_by_inheritance"
]
