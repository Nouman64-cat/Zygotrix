from __future__ import annotations

import json
import os
import logging
from typing import Any, Dict, List

from zygotrix_engine import Trait
from app.schema.traits import TraitInfo, TraitFilters
from app.utils.trait_helpers import trait_to_info

logger = logging.getLogger(__name__)


def _load_real_gene_traits() -> Dict[str, Trait]:

    current_dir = os.path.dirname(os.path.abspath(__file__))
    traits_file_path = os.path.join(
        current_dir, "..", "..", "data", "traits_dataset.json"
    )
    traits_file_path = os.path.normpath(traits_file_path)

    if not os.path.exists(traits_file_path):
        logger.error(f"❌ Traits dataset file not found at: {traits_file_path}")
        return {}

    real_gene_traits: Dict[str, Trait] = {}
    try:
        with open(traits_file_path, "r", encoding="utf-8") as f:
            traits_data = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        logger.error(f"Failed to load or decode traits_dataset.json: {e}")
        return {}

    for idx, trait_data in enumerate(traits_data):
        try:
            name = trait_data.get("trait")
            alleles = trait_data.get("alleles")
            phenotypes = trait_data.get("phenotypes")
            if (
                not name
                or not isinstance(alleles, (list, tuple))
                or not isinstance(phenotypes, dict)
            ):
                raise ValueError("Missing required fields: trait, alleles, phenotypes")

            trait_key = str(name).lower().replace(" ", "_").replace("-", "_")
            genes = trait_data.get("gene", [])
            chromosomes = trait_data.get("chromosome", [])
            trait_type = trait_data.get("type", "unknown")
            inheritance = trait_data.get("inheritance")

            if not isinstance(genes, list):
                genes = [genes] if genes is not None else []
            if not isinstance(chromosomes, list):
                chromosomes = [chromosomes] if chromosomes is not None else []

            is_real_gene = len(genes) > 0 and len(chromosomes) > 0

            metadata = {
                "inheritance_pattern": inheritance,
                "category": "real_gene" if is_real_gene else "simple_trait",
                "verification_status": "verified" if is_real_gene else "simplified",
                "trait_type": trait_type,
            }

            if genes:
                metadata["genes"] = ",".join(str(g) for g in genes)
                metadata["gene"] = str(genes[0])
            if chromosomes:
                metadata["chromosomes"] = ",".join(str(c) for c in chromosomes)
                metadata["chromosome"] = str(chromosomes[0])

            if is_real_gene:
                if trait_type == "polygenic":
                    gene_list = ", ".join(genes)
                    chr_list = ", ".join(str(c) for c in chromosomes)
                    description = f"Polygenic trait - genes: {gene_list} on chromosomes: {chr_list}"
                else:
                    description = f"Monogenic trait - {genes[0]} gene on chromosome {chromosomes[0]}"
            else:
                description = trait_data.get("description", "")

            trait = Trait(
                name=name,
                alleles=tuple(str(a) for a in alleles),
                phenotype_map={str(k): str(v) for k, v in phenotypes.items()},
                description=description,
                metadata=metadata,
            )
            real_gene_traits[trait_key] = trait
        except Exception as e:
            logger.warning(f"⚠️ Warning: Skipping trait at index {idx}: {e}")
            continue

    logger.info(f"✅ Loaded {len(real_gene_traits)} traits from traits_dataset.json")
    return real_gene_traits


REAL_GENE_TRAITS = _load_real_gene_traits()
ALL_TRAITS = dict(REAL_GENE_TRAITS)


def _convert_json_trait_to_trait_info(key: str, trait: Trait) -> TraitInfo:

    return trait_to_info(key, trait)


def _filter_json_traits(filters: TraitFilters) -> List[TraitInfo]:

    json_traits = []
    for key, trait in REAL_GENE_TRAITS.items():
        trait_info = _convert_json_trait_to_trait_info(key, trait)

        if (
            filters.inheritance_pattern
            and trait_info.inheritance_pattern != filters.inheritance_pattern
        ):
            continue
        if (
            filters.verification_status
            and trait_info.verification_status != filters.verification_status
        ):
            continue
        if filters.category and trait_info.category != filters.category:
            continue

        if filters.gene and trait_info.gene:
            if filters.gene.lower() not in trait_info.gene.lower():
                continue
        elif filters.gene and not trait_info.gene:
            continue

        if filters.tags and not any(tag in trait_info.tags for tag in filters.tags):
            continue
        if filters.status and trait_info.status != filters.status:
            continue
        if filters.visibility and trait_info.visibility != filters.visibility:
            continue

        if filters.search:
            search_text = filters.search.lower()
            searchable_text = (
                f"{trait_info.name} "
                f"{trait_info.gene or ''} "
                f"{trait_info.category or ''} "
                f"{' '.join(trait_info.tags)}"
            ).lower()
            if search_text not in searchable_text:
                continue

        json_traits.append(trait_info)
    return json_traits


class TraitLoader:

    def get_json_traits(self, filters: TraitFilters) -> List[TraitInfo]:

        return _filter_json_traits(filters)

    def get_json_engine_traits(self) -> Dict[str, Trait]:

        return dict(ALL_TRAITS)

    def get_json_trait_by_key(self, key: str) -> Optional[TraitInfo]:

        trait = REAL_GENE_TRAITS.get(key)
        if trait:
            return _convert_json_trait_to_trait_info(key, trait)
        return None
