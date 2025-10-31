from zygotrix_engine import Trait
from .schema.traits import TraitInfo


def trait_to_info(key: str, trait: Trait) -> TraitInfo:
    # Extract Mendelian trait metadata from trait.metadata
    metadata_dict = dict(trait.metadata)

    # Extract chromosome as integer if present (legacy)
    chromosome = None
    if "chromosome" in metadata_dict:
        try:
            chromosome = int(metadata_dict["chromosome"])
        except (ValueError, TypeError):
            chromosome = None

    # Extract new array format for genes and chromosomes
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

    from datetime import datetime, timezone

    return TraitInfo(
        key=key,
        name=trait.name,
        description=trait.description or None,
        alleles=list(trait.alleles),
        phenotype_map=dict(trait.phenotype_map),
        metadata=metadata_dict,
        inheritance_pattern=metadata_dict.get("inheritance_pattern"),
        verification_status=metadata_dict.get("verification_status"),
        gene_info=None,  # JSON traits don't use structured gene_info
        category=metadata_dict.get("category"),
        trait_type=metadata_dict.get("trait_type"),
        genes=genes,
        chromosomes=chromosomes,
        # Default values for JSON-loaded traits
        owner_id="system",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        created_by="system",
        updated_by="system",
        # Legacy fields for backward compatibility
        gene=metadata_dict.get("gene"),
        chromosome=chromosome,
    )
