from zygotrix_engine import Trait
from .schema.traits import TraitInfo


def trait_to_info(key: str, trait: Trait) -> TraitInfo:
    # Extract Mendelian trait metadata from trait.metadata
    metadata_dict = dict(trait.metadata)

    # Extract chromosome as integer if present
    chromosome = None
    if "chromosome" in metadata_dict:
        try:
            chromosome = int(metadata_dict["chromosome"])
        except (ValueError, TypeError):
            chromosome = None

    return TraitInfo(
        key=key,
        name=trait.name,
        description=trait.description or None,
        alleles=list(trait.alleles),
        phenotype_map=dict(trait.phenotype_map),
        metadata=metadata_dict,
        inheritance_pattern=metadata_dict.get("inheritance_pattern"),
        verification_status=metadata_dict.get("verification_status"),
        gene_info=metadata_dict.get("gene_info"),
        category=metadata_dict.get("category"),
        gene=metadata_dict.get("gene"),
        chromosome=chromosome,
    )
