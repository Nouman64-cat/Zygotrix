"""
Trait to C++ Gene Definition Converter

Converts MongoDB Trait models to C++ GeneDefinition JSON format
for the zygotrix_engine_cpp CLI.
"""

from typing import Dict, List, Any, Optional


def trait_to_cpp_gene_definition(trait: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert a Trait (from MongoDB or registry) to C++ GeneDefinition JSON format.

    Args:
        trait: Dictionary with keys: key, name, alleles, phenotype_map, metadata

    Returns:
        Dictionary in C++ GeneDefinition format

    Example:
        Input:
        {
            "key": "eye_color",
            "name": "Eye Color",
            "alleles": ["B", "b"],
            "phenotype_map": {"BB": "Brown", "Bb": "Brown", "bb": "Blue"},
            "metadata": {"inheritance_pattern": "complete_dominance"}
        }

        Output:
        {
            "id": "eye_color",
            "chromosome": "autosomal",
            "dominance": "complete",
            "default_allele_id": "B",
            "alleles": [
                {
                    "id": "B",
                    "dominance_rank": 1,
                    "effects": [{"trait_id": "eye_color", "magnitude": 1.0, "description": "Brown"}]
                },
                {
                    "id": "b",
                    "dominance_rank": 0,
                    "effects": [{"trait_id": "eye_color", "magnitude": 0.0, "description": "Blue"}]
                }
            ]
        }
    """
    trait_key = trait.get("key") or trait.get("id", "unknown_trait")
    alleles_list = list(trait.get("alleles", []))
    phenotype_map = trait.get("phenotype_map", {})
    metadata = trait.get("metadata", {})

    # Infer dominance pattern from metadata or phenotype map
    dominance = _infer_dominance_pattern(metadata, phenotype_map, alleles_list)

    # Determine chromosome type
    chromosome = _infer_chromosome_type(metadata)

    # Build alleles with effects
    alleles = _build_allele_definitions(
        trait_key, alleles_list, phenotype_map, dominance
    )

    return {
        "id": trait_key,
        "chromosome": chromosome,
        "dominance": dominance,
        "default_allele_id": alleles_list[0] if alleles_list else "",
        "alleles": alleles
    }


def _infer_dominance_pattern(
    metadata: Dict[str, Any],
    phenotype_map: Dict[str, str],
    alleles: List[str]
) -> str:
    """Infer dominance pattern from metadata or phenotype map."""

    # Check metadata first
    if metadata:
        pattern = str(metadata.get("inheritance_pattern", "")).lower()
        if "codominant" in pattern or "co-dominant" in pattern:
            return "codominant"
        elif "incomplete" in pattern or "partial" in pattern:
            return "incomplete"
        elif "complete" in pattern:
            return "complete"

    # Try to infer from phenotype map
    if len(alleles) >= 2 and phenotype_map:
        # Check if heterozygote has unique phenotype (incomplete/codominant)
        heterozygotes = []
        homozygotes = []

        for genotype in phenotype_map.keys():
            if len(set(genotype)) == 1:  # Homozygous
                homozygotes.append(genotype)
            else:  # Heterozygous
                heterozygotes.append(genotype)

        if heterozygotes and homozygotes:
            het_phenotypes = {phenotype_map[g] for g in heterozygotes}
            homo_phenotypes = {phenotype_map[g] for g in homozygotes}

            # If heterozygote phenotype is different from all homozygotes
            if not het_phenotypes.intersection(homo_phenotypes):
                # Could be incomplete or codominant
                # Check if heterozygote phenotype contains "+" or ","
                het_pheno = list(het_phenotypes)[0] if het_phenotypes else ""
                if "," in het_pheno or " and " in het_pheno.lower():
                    return "codominant"
                else:
                    return "incomplete"

    # Default to complete dominance
    return "complete"


def _infer_chromosome_type(metadata: Dict[str, Any]) -> str:
    """Infer chromosome type from metadata."""
    if not metadata:
        return "autosomal"

    chromosome = str(metadata.get("chromosome", "")).lower()
    sex_linked = metadata.get("sex_linked", False)

    if "x" in chromosome or sex_linked:
        return "x"
    elif "y" in chromosome:
        return "y"

    return "autosomal"


def _build_allele_definitions(
    trait_key: str,
    alleles: List[str],
    phenotype_map: Dict[str, str],
    dominance: str
) -> List[Dict[str, Any]]:
    """Build allele definitions with effects."""

    allele_defs = []

    for idx, allele_id in enumerate(alleles):
        # Assign dominance rank (first allele = highest rank)
        dominance_rank = len(alleles) - idx - 1

        # Find phenotype for this allele
        # Look for homozygous genotype first
        phenotype = _find_phenotype_for_allele(
            allele_id, phenotype_map, alleles, dominance
        )

        # Magnitude: 1.0 for dominant, 0.0 for recessive
        magnitude = 1.0 if dominance_rank > 0 else 0.0

        allele_defs.append({
            "id": allele_id,
            "dominance_rank": dominance_rank,
            "effects": [{
                "trait_id": trait_key,
                "magnitude": magnitude,
                "description": phenotype
            }]
        })

    return allele_defs


def _find_phenotype_for_allele(
    allele_id: str,
    phenotype_map: Dict[str, str],
    all_alleles: List[str],
    dominance: str
) -> str:
    """Find the phenotype description for an allele."""

    # Try homozygous genotype first
    homo_genotype = allele_id + allele_id
    if homo_genotype in phenotype_map:
        return phenotype_map[homo_genotype]

    # Try single allele (for haploid or shorthand)
    if allele_id in phenotype_map:
        return phenotype_map[allele_id]

    # Try heterozygous combinations
    for other_allele in all_alleles:
        if other_allele == allele_id:
            continue

        # Try both orders
        het1 = allele_id + other_allele
        het2 = other_allele + allele_id

        if het1 in phenotype_map:
            return phenotype_map[het1]
        if het2 in phenotype_map:
            return phenotype_map[het2]

    # Fallback: capitalize allele ID
    return f"{allele_id} phenotype"


def build_cpp_engine_request(
    parent1_genotypes: Dict[str, str],
    parent2_genotypes: Dict[str, str],
    traits: List[Dict[str, Any]],
    as_percentages: bool = True,
    joint_phenotypes: bool = False
) -> Dict[str, Any]:
    """
    Build complete JSON request for C++ engine CLI.

    Args:
        parent1_genotypes: Dict mapping trait_key to genotype string (e.g., {"eye_color": "Bb"})
        parent2_genotypes: Dict mapping trait_key to genotype string
        traits: List of trait dictionaries
        as_percentages: Whether to return results as percentages
        joint_phenotypes: Whether to calculate joint phenotypes

    Returns:
        Dictionary in C++ CLI request format
    """

    # Convert traits to gene definitions
    genes = [trait_to_cpp_gene_definition(trait) for trait in traits]

    # Parse parent genotypes to C++ format
    def parse_genotype(genotype_str: str, trait: Dict[str, Any]) -> List[str]:
        """Convert 'AB' or 'Bb' to ['A', 'B'] or ['B', 'b']."""
        alleles_list = list(trait.get("alleles", []))
        if not alleles_list:
            return []

        # Try to split the genotype string
        result = []
        remaining = genotype_str

        # Sort alleles by length (longest first) to handle multi-char alleles
        sorted_alleles = sorted(alleles_list, key=len, reverse=True)

        for allele in sorted_alleles:
            while allele in remaining:
                result.append(allele)
                remaining = remaining.replace(allele, "", 1)
                if len(result) >= 2:
                    break
            if len(result) >= 2:
                break

        return result[:2]  # Return at most 2 alleles

    # Build genotype maps
    mother_genotype = {}
    father_genotype = {}

    trait_by_key = {trait.get("key") or trait.get(
        "id"): trait for trait in traits}

    for trait_key, genotype_str in parent1_genotypes.items():
        if trait_key in trait_by_key:
            mother_genotype[trait_key] = parse_genotype(
                genotype_str, trait_by_key[trait_key]
            )

    for trait_key, genotype_str in parent2_genotypes.items():
        if trait_key in trait_by_key:
            father_genotype[trait_key] = parse_genotype(
                genotype_str, trait_by_key[trait_key]
            )

    return {
        "genes": genes,
        "mother": {
            "sex": "female",
            "genotype": mother_genotype
        },
        "father": {
            "sex": "male",
            "genotype": father_genotype
        },
        "as_percentages": as_percentages,
        "joint_phenotypes": joint_phenotypes
    }
