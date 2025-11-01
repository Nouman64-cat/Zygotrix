from app.models import Trait
from app.schema.traits import TraitInfo
from typing import Dict


def normalize_probabilities(distribution: Dict[str, float]) -> Dict[str, float]:
    """Normalize a probability distribution to sum to 1.0"""
    total = sum(distribution.values())
    if total == 0:
        return distribution
    return {k: v / total for k, v in distribution.items()}


def to_percentage_distribution(distribution: Dict[str, float]) -> Dict[str, float]:
    """Convert probability distribution to percentages"""
    return {k: v * 100.0 for k, v in distribution.items()}


def trait_to_info(key: str, trait: Trait) -> TraitInfo:
    from datetime import datetime, timezone
    from app.schema.traits import TraitStatus, TraitVisibility

    metadata_dict = dict(trait.metadata)

    chromosome = None
    if "chromosome" in metadata_dict:
        try:
            chromosome = int(metadata_dict["chromosome"])
        except (ValueError, TypeError):
            chromosome = None

    genes = []
    chromosomes = []

    if "genes" in metadata_dict:
        genes = metadata_dict["genes"].split(",")
    elif "gene" in metadata_dict:
        genes = [metadata_dict["gene"]]

    if "chromosomes" in metadata_dict:
        chromosomes = metadata_dict["chromosomes"].split(",")
    elif "chromosome" in metadata_dict:
        chromosomes = [metadata_dict["chromosome"]]

    return TraitInfo(
        key=key,
        name=trait.name,
        description=trait.description or None,
        alleles=list(trait.alleles),
        phenotype_map=dict(trait.phenotype_map),
        metadata=metadata_dict,
        inheritance_pattern=metadata_dict.get("inheritance_pattern"),
        verification_status=metadata_dict.get("verification_status"),
        gene_info=None,
        category=metadata_dict.get("category"),
        trait_type=metadata_dict.get("trait_type"),
        genes=genes,
        chromosomes=chromosomes,
        owner_id="system",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        created_by="system",
        updated_by="system",
        status=TraitStatus.ACTIVE,
        visibility=TraitVisibility.PUBLIC,
        gene=metadata_dict.get("gene"),
        chromosome=chromosome,
    )
