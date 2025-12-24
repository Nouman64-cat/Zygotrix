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


# =============================================================================
# PUNNETT SQUARE CALCULATOR (Using existing MendelianCalculator service)
# =============================================================================

def _get_mendelian_calculator():
    """Get the MendelianCalculator from existing services."""
    try:
        from app.models import MendelianCalculator
        return MendelianCalculator()
    except ImportError:
        return None


def _get_trait_registry():
    """Get the trait registry from existing services."""
    try:
        from app.services.service_factory import get_service_factory
        factory = get_service_factory()
        trait_service = factory.get_trait_service()
        return trait_service.get_trait_registry()
    except Exception:
        return {}


def _find_trait_for_genotype(genotype: str, trait_name: str = None):
    """
    Find a trait that matches the given genotype.
    
    If trait_name is provided, look for that specific trait.
    Otherwise, try to find any trait that supports these alleles.
    """
    registry = _get_trait_registry()
    
    if not registry:
        return None
    
    # If trait name specified, look for it
    if trait_name:
        trait_name_lower = trait_name.lower()
        for key, trait in registry.items():
            if trait_name_lower in trait.name.lower() or trait_name_lower in key.lower():
                return trait
    
    # Try to find a trait whose alleles match the genotype
    alleles_in_genotype = set(genotype)
    
    for key, trait in registry.items():
        trait_alleles = set(trait.alleles)
        if alleles_in_genotype.issubset(trait_alleles):
            return trait
    
    return None


def calculate_punnett_square(parent1: str, parent2: str, trait_name: str = None) -> dict:
    """
    Calculate a Punnett Square for a genetic cross.
    
    Supports monohybrid, dihybrid, trihybrid, and higher-order crosses.
    
    Args:
        parent1: Genotype of first parent (e.g., "Aa", "AaBb", "AaBbCcDd")
        parent2: Genotype of second parent
        trait_name: Optional trait name to look up phenotypes (for monohybrid only)
    
    Returns:
        dict: Punnett square results with offspring genotypes and ratios
    """
    # Clean up inputs
    p1 = parent1.strip().replace(" ", "")
    p2 = parent2.strip().replace(" ", "")
    
    # Validate genotypes using diploid constraint
    p1_valid, p1_error = _validate_diploid_genotype(p1)
    if not p1_valid:
        return {
            "error": True,
            "message": p1_error
        }
    
    p2_valid, p2_error = _validate_diploid_genotype(p2)
    if not p2_valid:
        return {
            "error": True,
            "message": p2_error
        }
    
    # Parse genotypes into genes
    p1_genes = _parse_genotype_to_genes(p1)
    p2_genes = _parse_genotype_to_genes(p2)
    
    # Both parents must have the same number of genes
    if len(p1_genes) != len(p2_genes):
        return {
            "error": True,
            "message": f"Both parents must have the same number of genes. Parent 1 has {len(p1_genes)} gene(s), Parent 2 has {len(p2_genes)} gene(s)."
        }
    
    num_genes = len(p1_genes)
    
    # For monohybrid crosses, try to use trait data
    if num_genes == 1:
        trait = _find_trait_for_genotype(p1, trait_name)
        if trait:
            return _calculate_with_real_trait(p1, p2, trait)
        else:
            return _calculate_generic_cross(p1, p2)
    
    # For multihybrid crosses, use generic calculation
    return _calculate_multihybrid_cross(p1_genes, p2_genes, p1, p2)


def _calculate_with_real_trait(p1: str, p2: str, trait) -> dict:
    """
    Calculate cross using the real MendelianCalculator with actual trait data.
    """
    try:
        calculator = _get_mendelian_calculator()
        if not calculator:
            return _calculate_generic_cross(p1, p2)
        
        # Canonicalize genotypes for the trait
        try:
            p1_canonical = trait.canonical_genotype(p1)
            p2_canonical = trait.canonical_genotype(p2)
        except ValueError as e:
            return {
                "error": True,
                "message": f"Genotype error: {str(e)}. Available alleles for {trait.name}: {', '.join(trait.alleles)}"
            }
        
        # Calculate using the real calculator
        result = calculator.calculate_cross(
            trait=trait,
            parent1_genotype=p1_canonical,
            parent2_genotype=p2_canonical,
            as_percentages=True
        )
        
        # Format results nicely
        genotype_info = []
        for genotype, percentage in result["genotypic_ratios"].items():
            phenotype = trait.phenotype_map.get(genotype, "Unknown")
            genotype_info.append({
                "genotype": genotype,
                "percentage": f"{percentage:.1f}%",
                "phenotype": phenotype
            })
        
        phenotype_info = []
        for phenotype, percentage in result["phenotypic_ratios"].items():
            phenotype_info.append({
                "phenotype": phenotype,
                "percentage": f"{percentage:.1f}%"
            })
        
        # Build Punnett square grid
        grid = _build_punnett_grid_from_steps(result.get("punnett_square_steps", []))
        
        # Calculate ratios
        genotype_ratio = _calculate_ratio_string(result["genotypic_ratios"])
        phenotype_ratio = _calculate_ratio_string(result["phenotypic_ratios"])
        
        summary = _generate_cross_summary_with_trait(p1, p2, trait.name, genotype_info, phenotype_info)
        
        return {
            "success": True,
            "cross_type": "monohybrid",
            "trait_name": trait.name,
            "parent1": p1,
            "parent2": p2,
            "punnett_square": grid,
            "offspring_genotypes": genotype_info,
            "offspring_phenotypes": phenotype_info,
            "genotype_ratio": genotype_ratio,
            "phenotype_ratio": phenotype_ratio,
            "using_real_trait_data": True,
            "summary": summary
        }
        
    except Exception as e:
        # Fall back to generic if anything fails
        return _calculate_generic_cross(p1, p2)


def _calculate_generic_cross(p1: str, p2: str) -> dict:
    """
    Calculate cross using generic dominant/recessive logic when no trait is found.
    """
    p1_alleles = [p1[0], p1[1]]
    p2_alleles = [p2[0], p2[1]]
    
    # Generate all possible offspring
    offspring = []
    for a1 in p1_alleles:
        for a2 in p2_alleles:
            # Normalize genotype (capital letter first)
            if a1.isupper() and a2.islower():
                genotype = a1 + a2
            elif a2.isupper() and a1.islower():
                genotype = a2 + a1
            elif a1 <= a2:
                genotype = a1 + a2
            else:
                genotype = a2 + a1
            offspring.append(genotype)
    
    # Count genotype frequencies
    genotype_counts = {}
    for g in offspring:
        genotype_counts[g] = genotype_counts.get(g, 0) + 1
    
    # Calculate ratios and percentages
    total = len(offspring)
    genotype_results = []
    for genotype, count in sorted(genotype_counts.items()):
        percentage = (count / total) * 100
        phenotype = _predict_generic_phenotype(genotype)
        genotype_results.append({
            "genotype": genotype,
            "count": count,
            "ratio": f"{count}/{total}",
            "percentage": f"{percentage:.1f}%",
            "phenotype": phenotype
        })
    
    # Determine phenotype ratios
    phenotype_counts = {}
    for g in offspring:
        p = _predict_generic_phenotype(g)
        phenotype_counts[p] = phenotype_counts.get(p, 0) + 1
    
    phenotype_results = []
    for phenotype, count in phenotype_counts.items():
        percentage = (count / total) * 100
        phenotype_results.append({
            "phenotype": phenotype,
            "count": count,
            "ratio": f"{count}/{total}",
            "percentage": f"{percentage:.1f}%"
        })
    
    grid = _build_punnett_grid(p1_alleles, p2_alleles)
    summary = _generate_generic_summary(p1, p2, genotype_results, phenotype_results)
    
    return {
        "success": True,
        "cross_type": "monohybrid",
        "trait_name": None,
        "parent1": p1,
        "parent2": p2,
        "punnett_square": grid,
        "offspring_genotypes": genotype_results,
        "offspring_phenotypes": phenotype_results,
        "genotype_ratio": _simplify_ratio(genotype_counts),
        "phenotype_ratio": _simplify_ratio(phenotype_counts),
        "using_real_trait_data": False,
        "summary": summary
    }


def _calculate_multihybrid_cross(p1_genes: list, p2_genes: list, p1_full: str, p2_full: str) -> dict:
    """
    Calculate a multihybrid cross (dihybrid, trihybrid, etc.).
    
    Args:
        p1_genes: List of gene pairs for parent 1 (e.g., ["Aa", "Bb"])
        p2_genes: List of gene pairs for parent 2
        p1_full: Full genotype string for parent 1
        p2_full: Full genotype string for parent 2
    
    Returns:
        dict: Punnett square results with offspring genotypes and ratios
    """
    import itertools
    
    num_genes = len(p1_genes)
    cross_type = _get_cross_type(num_genes)
    
    # Generate gametes for each parent
    # Each gamete contains one allele from each gene
    
    def get_gametes(genes: list) -> list:
        """Generate all possible gametes from gene pairs."""
        allele_options = []
        for gene in genes:
            # Each gene contributes one of its two alleles
            allele_options.append([gene[0], gene[1]])
        # Cartesian product gives all possible gamete combinations
        return ["".join(combo) for combo in itertools.product(*allele_options)]
    
    p1_gametes = get_gametes(p1_genes)
    p2_gametes = get_gametes(p2_genes)
    
    # Generate all offspring genotypes
    offspring_genotypes = []
    punnett_steps = []
    
    for g1 in p1_gametes:
        for g2 in p2_gametes:
            # Combine gametes to form offspring genotype
            # Normalize each gene pair (uppercase first)
            offspring_genes = []
            for i in range(num_genes):
                a1, a2 = g1[i], g2[i]
                gene_pair = _normalize_allele_pair(a1, a2)
                offspring_genes.append(gene_pair)
            
            offspring_genotype = "".join(offspring_genes)
            offspring_genotypes.append(offspring_genotype)
            
            punnett_steps.append({
                "parent1_gamete": g1,
                "parent2_gamete": g2,
                "offspring_genotype": offspring_genotype
            })
    
    # Count genotype frequencies
    genotype_counts = {}
    for g in offspring_genotypes:
        genotype_counts[g] = genotype_counts.get(g, 0) + 1
    
    total = len(offspring_genotypes)
    
    # Calculate genotype results
    genotype_results = []
    for genotype, count in sorted(genotype_counts.items()):
        percentage = (count / total) * 100
        phenotype = _predict_multihybrid_phenotype(genotype, num_genes)
        genotype_results.append({
            "genotype": genotype,
            "count": count,
            "ratio": f"{count}/{total}",
            "percentage": f"{percentage:.2f}%",
            "phenotype": phenotype
        })
    
    # Calculate phenotype ratios
    phenotype_counts = {}
    for g in offspring_genotypes:
        p = _predict_multihybrid_phenotype(g, num_genes)
        phenotype_counts[p] = phenotype_counts.get(p, 0) + 1
    
    phenotype_results = []
    for phenotype, count in sorted(phenotype_counts.items()):
        percentage = (count / total) * 100
        phenotype_results.append({
            "phenotype": phenotype,
            "count": count,
            "ratio": f"{count}/{total}",
            "percentage": f"{percentage:.2f}%"
        })
    
    # Build Punnett grid for multihybrid
    grid = _build_multihybrid_punnett_grid(p1_gametes, p2_gametes, punnett_steps)
    
    # Generate summary
    summary = _generate_multihybrid_summary(p1_full, p2_full, num_genes, genotype_results, phenotype_results, total)
    
    return {
        "success": True,
        "cross_type": cross_type,
        "num_genes": num_genes,
        "trait_name": None,
        "parent1": p1_full,
        "parent2": p2_full,
        "parent1_gametes": p1_gametes,
        "parent2_gametes": p2_gametes,
        "punnett_square": grid,
        "offspring_genotypes": genotype_results,
        "offspring_phenotypes": phenotype_results,
        "genotype_ratio": _simplify_ratio(genotype_counts),
        "phenotype_ratio": _simplify_ratio(phenotype_counts),
        "total_offspring_combinations": total,
        "unique_genotypes": len(genotype_counts),
        "unique_phenotypes": len(phenotype_counts),
        "using_real_trait_data": False,
        "summary": summary
    }


def _predict_multihybrid_phenotype(genotype: str, num_genes: int) -> str:
    """
    Predict phenotype for a multihybrid genotype using generic dominant/recessive logic.
    
    Returns a description like "Dominant-Dominant-Recessive" for each gene.
    """
    genes = _parse_genotype_to_genes(genotype)
    if not genes:
        return "Unknown"
    
    phenotype_parts = []
    gene_labels = "ABCDEFGHIJ"  # Labels for genes
    
    for i, gene in enumerate(genes):
        if len(gene) != 2:
            phenotype_parts.append("?")
            continue
        
        a1, a2 = gene[0], gene[1]
        gene_label = gene_labels[i] if i < len(gene_labels) else f"Gene{i+1}"
        
        # Determine dominance: uppercase = dominant
        if a1.isupper() or a2.isupper():
            phenotype_parts.append(f"{gene_label}_dominant")
        else:
            phenotype_parts.append(f"{gene_label}_recessive")
    
    return " | ".join(phenotype_parts)


def _build_multihybrid_punnett_grid(p1_gametes: list, p2_gametes: list, steps: list) -> dict:
    """Build a Punnett grid for multihybrid crosses."""
    # Create a lookup for offspring genotypes
    offspring_lookup = {}
    for step in steps:
        key = (step["parent1_gamete"], step["parent2_gamete"])
        offspring_lookup[key] = step["offspring_genotype"]
    
    grid = {
        "header": [""] + p1_gametes,
        "rows": []
    }
    
    for g2 in p2_gametes:
        row = [g2]
        for g1 in p1_gametes:
            offspring = offspring_lookup.get((g1, g2), "")
            row.append(offspring)
        grid["rows"].append(row)
    
    return grid


def _generate_multihybrid_summary(p1: str, p2: str, num_genes: int, 
                                   genotypes: list, phenotypes: list, total: int) -> str:
    """Generate a summary for multihybrid crosses."""
    cross_type = _get_cross_type(num_genes)
    
    summary_parts = [
        f"**{cross_type.capitalize()} Cross**: `{p1} × {p2}`",
        f"",
        f"This is a {num_genes}-gene cross producing **{total} possible offspring combinations**.",
        f"",
        f"**Unique Genotypes**: {len(genotypes)}",
        f"**Unique Phenotypes**: {len(phenotypes)}",
    ]
    
    # Add expected ratio for common crosses
    if num_genes == 2:
        summary_parts.append("")
        summary_parts.append("For a dihybrid cross between two heterozygotes (AaBb × AaBb), the expected phenotypic ratio is **9:3:3:1**.")
    elif num_genes == 3:
        summary_parts.append("")
        summary_parts.append("For a trihybrid cross, the expected phenotypic ratio follows factorial combinations of the 3:1 ratio.")
    
    return "\n".join(summary_parts)


def _is_valid_genotype(genotype: str) -> bool:
    """
    Check if a genotype string is valid for diploid organisms.
    
    Rules:
    - Must be non-empty
    - Must have even length (pairs of alleles)
    - Must contain only letters (and optionally +/-)
    - Each gene (pair of alleles) must use letters that represent a single gene
    """
    if not genotype:
        return False
    
    # Must be even length (pairs of alleles for diploid organisms)
    if len(genotype) % 2 != 0:
        return False
    
    # Must contain only letters and common symbols
    if not genotype.replace("+", "").replace("-", "").isalpha():
        return False
    
    return True


def _validate_diploid_genotype(genotype: str) -> tuple[bool, str]:
    """
    Validate that a genotype respects the diploid constraint.
    
    For humans (and most animals), each gene must have exactly 2 alleles.
    
    Args:
        genotype: The genotype string to validate (e.g., "Aa", "AaBb", "AaBbCcDd")
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not genotype:
        return False, "Genotype cannot be empty."
    
    # Check for odd length (must be pairs)
    if len(genotype) % 2 != 0:
        return False, f"Invalid genotype '{genotype}'. Humans are diploid - each gene must have exactly 2 alleles (e.g., 'Aa', not 'A' or 'AAA')."
    
    # Check for non-alphabetic characters (excluding +/-)
    clean_genotype = genotype.replace("+", "").replace("-", "")
    if not clean_genotype.isalpha():
        return False, f"Invalid genotype '{genotype}'. Genotypes must contain only letters representing alleles."
    
    # Parse into gene pairs and validate each gene
    genes = _parse_genotype_to_genes(genotype)
    if genes is None:
        return False, f"Invalid genotype '{genotype}'. Could not parse gene pairs."
    
    # Validate each gene pair
    for gene_pair in genes:
        if len(gene_pair) != 2:
            return False, f"Invalid gene '{gene_pair}'. Humans are diploid - each gene must have exactly 2 alleles."
        
        a1, a2 = gene_pair[0], gene_pair[1]
        
        # The two alleles should be the same letter (one uppercase, one lowercase) 
        # OR both the same (homozygous)
        if a1.upper() != a2.upper():
            # This might be intentional for special cases like blood types (AO, BO)
            # Allow it but log
            pass
    
    return True, ""


def _parse_genotype_to_genes(genotype: str) -> list[str] | None:
    """
    Parse a multi-gene genotype string into individual gene pairs.
    
    Examples:
        "Aa" -> ["Aa"]
        "AaBb" -> ["Aa", "Bb"]
        "AaBbCcDd" -> ["Aa", "Bb", "Cc", "Dd"]
    
    Args:
        genotype: The genotype string
    
    Returns:
        List of gene pairs, or None if parsing fails
    """
    if not genotype or len(genotype) % 2 != 0:
        return None
    
    genes = []
    for i in range(0, len(genotype), 2):
        gene_pair = genotype[i:i+2]
        genes.append(gene_pair)
    
    return genes


def _get_cross_type(num_genes: int) -> str:
    """Get the cross type name based on number of genes."""
    cross_types = {
        1: "monohybrid",
        2: "dihybrid",
        3: "trihybrid",
        4: "tetrahybrid",
    }
    return cross_types.get(num_genes, f"{num_genes}-hybrid")


def _predict_generic_phenotype(genotype: str) -> str:
    """Predict phenotype from genotype using generic dominant/recessive logic."""
    if not genotype or len(genotype) < 2:
        return "Unknown"
    
    a1, a2 = genotype[0], genotype[1]
    
    if a1.isupper() and a2.isupper():
        return "Homozygous Dominant"
    elif (a1.isupper() and a2.islower()) or (a1.islower() and a2.isupper()):
        return "Heterozygous (dominant phenotype)"
    else:
        return "Homozygous Recessive"


def _build_punnett_grid(p1_alleles: list, p2_alleles: list) -> dict:
    """Build a visual Punnett square grid."""
    grid = {
        "header": [""] + p1_alleles,
        "rows": []
    }
    
    for a2 in p2_alleles:
        row = [a2]
        for a1 in p1_alleles:
            genotype = _normalize_allele_pair(a1, a2)
            row.append(genotype)
        grid["rows"].append(row)
    
    return grid


def _build_punnett_grid_from_steps(steps: list) -> dict:
    """Build grid from MendelianCalculator steps."""
    if not steps:
        return {}
    
    # Extract alleles and offspring from steps
    p1_gametes = set()
    p2_gametes = set()
    cells = {}
    
    for step in steps:
        if isinstance(step, dict):
            p1_gametes.add(step.get("parent1_gamete", ""))
            p2_gametes.add(step.get("parent2_gamete", ""))
            key = (step.get("parent1_gamete", ""), step.get("parent2_gamete", ""))
            cells[key] = step.get("offspring_genotype", "")
    
    p1_list = sorted(list(p1_gametes))
    p2_list = sorted(list(p2_gametes))
    
    grid = {
        "header": [""] + p1_list,
        "rows": []
    }
    
    for a2 in p2_list:
        row = [a2]
        for a1 in p1_list:
            row.append(cells.get((a1, a2), ""))
        grid["rows"].append(row)
    
    return grid


def _normalize_allele_pair(a1: str, a2: str) -> str:
    """Normalize an allele pair (uppercase first)."""
    if a1.isupper() and a2.islower():
        return a1 + a2
    elif a2.isupper() and a1.islower():
        return a2 + a1
    elif a1 <= a2:
        return a1 + a2
    else:
        return a2 + a1


def _simplify_ratio(counts: dict) -> str:
    """Convert counts to a simplified ratio string."""
    if not counts:
        return ""
    
    values = list(counts.values())
    
    from math import gcd
    from functools import reduce
    
    common_divisor = reduce(gcd, values)
    simplified = [v // common_divisor for v in values]
    
    return ":".join(str(s) for s in simplified)


def _calculate_ratio_string(percentages: dict) -> str:
    """Convert percentage dict to ratio string."""
    if not percentages:
        return ""
    
    # Convert percentages to approximate counts (out of 4)
    counts = []
    for pct in percentages.values():
        count = round(pct / 25)  # 25% = 1/4
        counts.append(max(1, count))
    
    return ":".join(str(c) for c in counts)


def _generate_cross_summary_with_trait(p1: str, p2: str, trait_name: str, genotypes: list, phenotypes: list) -> str:
    """Generate summary with actual trait information."""
    summary_parts = [f"Crossing `{p1} × {p2}` for **{trait_name}**:"]
    
    # Add genotype distribution
    geno_str = ", ".join([f"`{g['genotype']}` ({g['percentage']})" for g in genotypes])
    summary_parts.append(f"Offspring genotypes: {geno_str}")
    
    # Add phenotype distribution
    pheno_str = ", ".join([f"**{p['phenotype']}** ({p['percentage']})" for p in phenotypes])
    summary_parts.append(f"Phenotypes: {pheno_str}")
    
    return " ".join(summary_parts)


def _generate_generic_summary(p1: str, p2: str, genotypes: list, phenotypes: list) -> str:
    """Generate summary for generic cross."""
    summary_parts = [f"Crossing `{p1} × {p2}`:"]
    
    p1_type = _get_genotype_type(p1)
    p2_type = _get_genotype_type(p2)
    
    if p1_type == "homozygous_dominant" and p2_type == "homozygous_dominant":
        summary_parts.append("Both parents are homozygous dominant. All offspring will be homozygous dominant (**100%**).")
    elif p1_type == "homozygous_recessive" and p2_type == "homozygous_recessive":
        summary_parts.append("Both parents are homozygous recessive. All offspring will be homozygous recessive (**100%**).")
    elif p1_type == "heterozygous" and p2_type == "heterozygous":
        summary_parts.append("Both parents are heterozygous (carriers). Offspring follow a **1:2:1** genotype ratio (25% homozygous dominant, 50% heterozygous, 25% homozygous recessive).")
        summary_parts.append("The phenotype ratio is **3:1** (75% dominant phenotype, 25% recessive phenotype).")
    elif (p1_type == "heterozygous" and p2_type == "homozygous_recessive") or \
         (p1_type == "homozygous_recessive" and p2_type == "heterozygous"):
        summary_parts.append("This is a **test cross**! Offspring will be 50% heterozygous (dominant phenotype) and 50% homozygous recessive.")
    elif (p1_type == "heterozygous" and p2_type == "homozygous_dominant") or \
         (p1_type == "homozygous_dominant" and p2_type == "heterozygous"):
        summary_parts.append("Offspring will be 50% homozygous dominant and 50% heterozygous. All will show the **dominant phenotype** (100%).")
    else:
        summary_parts.append(f"This cross produces {len(genotypes)} different genotype(s).")
    
    return " ".join(summary_parts)


def _get_genotype_type(genotype: str) -> str:
    """Determine the type of genotype."""
    if len(genotype) != 2:
        return "unknown"
    
    a1, a2 = genotype[0], genotype[1]
    
    if a1.isupper() and a2.isupper():
        return "homozygous_dominant"
    elif a1.islower() and a2.islower():
        return "homozygous_recessive"
    else:
        return "heterozygous"


def parse_cross_from_message(message: str) -> dict:
    """
    Parse a user's message to extract cross information.
    
    Examples:
        "cross Aa with Aa" -> {"parent1": "Aa", "parent2": "Aa"}
        "Aa × Bb" -> {"parent1": "Aa", "parent2": "Bb"}
        "what if I cross BB and bb" -> {"parent1": "BB", "parent2": "bb"}
    """
    import re
    
    # Patterns to match genetic crosses
    patterns = [
        # "cross Aa with Bb"
        r"cross\s+([A-Za-z]{2,4})\s+(?:with|and|×|x)\s+([A-Za-z]{2,4})",
        # "Aa × Bb" or "Aa x Bb"
        r"([A-Za-z]{2,4})\s*[×xX]\s*([A-Za-z]{2,4})",
        # "Aa and Bb cross"
        r"([A-Za-z]{2,4})\s+(?:and|with)\s+([A-Za-z]{2,4})\s+cross",
        # "if I cross Aa and Bb"
        r"if\s+(?:i\s+)?cross\s+([A-Za-z]{2,4})\s+(?:and|with)\s+([A-Za-z]{2,4})",
        # "crossing Aa with Bb"
        r"crossing\s+([A-Za-z]{2,4})\s+(?:with|and)\s+([A-Za-z]{2,4})",
        # "punnett square for Aa and Bb"
        r"punnett.*?([A-Za-z]{2,4})\s+(?:and|with|×|x)\s+([A-Za-z]{2,4})",
        # Look for two genotypes in the message
        r"([A-Za-z]{2,4})\s+(?:and|with|×|x|crossed with)\s+([A-Za-z]{2,4})",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            p1 = match.group(1)
            p2 = match.group(2)
            # Also try to extract trait name from message
            trait_name = _extract_trait_name_from_message(message)
            if _is_valid_genotype(p1) and _is_valid_genotype(p2):
                return {"found": True, "parent1": p1, "parent2": p2, "trait_name": trait_name}
    
    return {"found": False}


def _extract_trait_name_from_message(message: str) -> str:
    """Try to extract trait name from message."""
    import re
    
    # Common patterns for trait mentions
    patterns = [
        r"for\s+(\w+(?:\s+\w+)?)\s+trait",
        r"(\w+(?:\s+\w+)?)\s+trait",
        r"for\s+(\w+(?:\s+\w+)?)\s+(?:gene|inheritance)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None


# =============================================================================
# DNA / RNA / PROTEIN TOOLS
# =============================================================================

def generate_random_dna_sequence(length: int = 30, gc_content: float = 0.5, seed: int = None) -> dict:
    """
    Generate a random DNA sequence with specified parameters.
    
    Args:
        length: Number of base pairs to generate (default: 30, max: 1000)
        gc_content: Proportion of G and C nucleotides (0.0 to 1.0, default: 0.5)
        seed: Optional seed for reproducibility
    
    Returns:
        dict: Generated DNA sequence with metadata
    """
    from app.services.protein_generator_impl import (
        generate_dna_sequence,
        calculate_actual_gc
    )
    
    # Limit length for chatbot responses
    if length > 1000:
        length = 1000
    if length < 3:
        length = 3
    
    # Make length divisible by 3 for complete codons
    length = (length // 3) * 3
    
    # Validate gc_content
    gc_content = max(0.0, min(1.0, gc_content))
    
    try:
        dna_sequence = generate_dna_sequence(length, gc_content, seed)
        actual_gc = calculate_actual_gc(dna_sequence)
        
        return {
            "success": True,
            "dna_sequence": dna_sequence,
            "length": len(dna_sequence),
            "requested_gc_content": gc_content,
            "actual_gc_content": round(actual_gc, 4),
            "base_counts": {
                "A": dna_sequence.count("A"),
                "T": dna_sequence.count("T"),
                "G": dna_sequence.count("G"),
                "C": dna_sequence.count("C"),
            },
            "message": f"Generated a {len(dna_sequence)} bp DNA sequence with {actual_gc*100:.1f}% GC content."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to generate DNA sequence: {str(e)}"
        }


def transcribe_dna_to_mrna(dna_sequence: str) -> dict:
    """
    Transcribe a DNA sequence to mRNA by replacing T with U.
    
    Args:
        dna_sequence: Input DNA sequence (A, T, G, C characters)
    
    Returns:
        dict: mRNA sequence with metadata
    """
    from app.services.protein_generator_impl import transcribe_to_rna
    
    # Clean and validate input
    dna_clean = dna_sequence.upper().strip()
    
    # Validate DNA characters
    valid_chars = set("ATGC")
    if not all(c in valid_chars for c in dna_clean):
        invalid_chars = set(dna_clean) - valid_chars
        return {
            "success": False,
            "error": f"Invalid DNA characters found: {', '.join(invalid_chars)}. DNA should only contain A, T, G, C."
        }
    
    if len(dna_clean) < 3:
        return {
            "success": False,
            "error": "DNA sequence must be at least 3 nucleotides long."
        }
    
    try:
        mrna_sequence = transcribe_to_rna(dna_clean)
        
        return {
            "success": True,
            "dna_sequence": dna_clean,
            "mrna_sequence": mrna_sequence,
            "length": len(mrna_sequence),
            "transcription_rule": "A→A, T→U, G→G, C→C (template strand)",
            "message": f"Transcribed {len(dna_clean)} bp DNA to {len(mrna_sequence)} nt mRNA."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to transcribe DNA: {str(e)}"
        }


def extract_codons_from_rna(rna_sequence: str) -> dict:
    """
    Extract codons (triplets) from an RNA sequence.
    
    Args:
        rna_sequence: Input RNA sequence (A, U, G, C characters)
    
    Returns:
        dict: List of codons with their positions
    """
    # Clean and validate input
    rna_clean = rna_sequence.upper().strip()
    
    # Validate RNA characters
    valid_chars = set("AUGC")
    if not all(c in valid_chars for c in rna_clean):
        invalid_chars = set(rna_clean) - valid_chars
        return {
            "success": False,
            "error": f"Invalid RNA characters found: {', '.join(invalid_chars)}. RNA should only contain A, U, G, C."
        }
    
    if len(rna_clean) < 3:
        return {
            "success": False,
            "error": "RNA sequence must be at least 3 nucleotides long to form a codon."
        }
    
    try:
        codons = []
        for i in range(0, len(rna_clean) - 2, 3):
            codon = rna_clean[i:i+3]
            codons.append({
                "position": i + 1,  # 1-indexed for human readability
                "codon": codon
            })
        
        # Count remaining nucleotides that don't form a complete codon
        remainder = len(rna_clean) % 3
        
        return {
            "success": True,
            "rna_sequence": rna_clean,
            "total_codons": len(codons),
            "codons": codons,
            "codon_list": [c["codon"] for c in codons],
            "incomplete_nucleotides": remainder,
            "message": f"Extracted {len(codons)} codons from {len(rna_clean)} nt RNA sequence."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to extract codons: {str(e)}"
        }


def translate_rna_to_protein(rna_sequence: str, find_all_orfs: bool = False) -> dict:
    """
    Translate an RNA sequence to protein by reading codons and converting to amino acids.
    
    Args:
        rna_sequence: Input RNA sequence (A, U, G, C characters)
        find_all_orfs: If True, find all Open Reading Frames. If False, translate from position 0.
    
    Returns:
        dict: Protein sequence with amino acid information
    """
    from app.services.protein_generator_impl import (
        extract_amino_acids,
        find_all_orfs as find_orfs,
        CODON_TABLE
    )
    
    # Clean and validate input
    rna_clean = rna_sequence.upper().strip()
    
    # Validate RNA characters
    valid_chars = set("AUGC")
    if not all(c in valid_chars for c in rna_clean):
        invalid_chars = set(rna_clean) - valid_chars
        return {
            "success": False,
            "error": f"Invalid RNA characters found: {', '.join(invalid_chars)}. RNA should only contain A, U, G, C."
        }
    
    if len(rna_clean) < 3:
        return {
            "success": False,
            "error": "RNA sequence must be at least 3 nucleotides long."
        }
    
    try:
        if find_all_orfs:
            # Find all Open Reading Frames (start with AUG, end with stop codon)
            orfs = find_orfs(rna_clean)
            
            if not orfs:
                return {
                    "success": True,
                    "rna_sequence": rna_clean[:50] + "..." if len(rna_clean) > 50 else rna_clean,
                    "orfs_found": 0,
                    "orfs": [],
                    "message": "No complete Open Reading Frames (ORFs) found. An ORF requires a start codon (AUG) followed by a stop codon (UAA, UAG, or UGA)."
                }
            
            return {
                "success": True,
                "rna_sequence": rna_clean[:50] + "..." if len(rna_clean) > 50 else rna_clean,
                "rna_length": len(rna_clean),
                "orfs_found": len(orfs),
                "orfs": [
                    {
                        "orf_number": i + 1,
                        "start_position": orf["start_position"] + 1,  # 1-indexed
                        "end_position": orf["end_position"],
                        "protein_1letter": orf["protein_1letter"],
                        "protein_3letter": orf["protein_3letter"],
                        "amino_acid_count": orf["length"]
                    }
                    for i, orf in enumerate(orfs[:5])  # Limit to first 5 ORFs
                ],
                "message": f"Found {len(orfs)} Open Reading Frame(s) in the RNA sequence."
            }
        else:
            # Simple translation from position 0
            amino_acids = extract_amino_acids(rna_clean)
            
            if not amino_acids:
                return {
                    "success": True,
                    "rna_sequence": rna_clean[:50] + "..." if len(rna_clean) > 50 else rna_clean,
                    "amino_acids": [],
                    "protein_1letter": "",
                    "protein_3letter": "",
                    "message": "No amino acids could be translated from this sequence."
                }
            
            # Filter out STOP for protein sequence
            coding_aas = [aa for aa in amino_acids if aa["name_3letter"] != "STOP"]
            protein_1letter = "".join(aa["name_1letter"] for aa in coding_aas)
            protein_3letter = "-".join(aa["name_3letter"] for aa in coding_aas)
            
            return {
                "success": True,
                "rna_sequence": rna_clean[:50] + "..." if len(rna_clean) > 50 else rna_clean,
                "rna_length": len(rna_clean),
                "amino_acids": amino_acids[:20],  # Limit for display
                "amino_acid_count": len(coding_aas),
                "protein_1letter": protein_1letter[:50] + ("..." if len(protein_1letter) > 50 else ""),
                "protein_3letter": protein_3letter[:100] + ("..." if len(protein_3letter) > 100 else ""),
                "stopped_at_stop_codon": any(aa["name_3letter"] == "STOP" for aa in amino_acids),
                "message": f"Translated {len(rna_clean)} nt RNA to {len(coding_aas)} amino acids."
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to translate RNA: {str(e)}"
        }


# Export the main functions for use by the chatbot
__all__ = [
    "get_traits_count",
    "search_traits", 
    "get_trait_details",
    "list_traits_by_type",
    "list_traits_by_inheritance",
    "calculate_punnett_square",
    "parse_cross_from_message",
    # DNA/RNA/Protein tools
    "generate_random_dna_sequence",
    "transcribe_dna_to_mrna",
    "extract_codons_from_rna",
    "translate_rna_to_protein",
]
