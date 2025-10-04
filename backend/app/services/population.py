from __future__ import annotations

import json
import math
import random
from functools import lru_cache
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

from fastapi import HTTPException

from ..schema.population import (
    PhenotypeConfidenceInterval,
    PopulationSimRequest,
    PopulationSimResponse,
    PopulationTraitResult,
)
from .traits import get_trait_registry


ALLELE_FREQ_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "allele_freqs.json"
)


@lru_cache(maxsize=1)
def load_allele_frequencies() -> Dict[str, Dict[str, Dict[str, Dict[str, float]]]]:
    if not ALLELE_FREQ_PATH.exists():
        raise HTTPException(status_code=500, detail="Allele frequency reference missing.")
    with ALLELE_FREQ_PATH.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return data


def _wilson_ci(count: int, total: int, z: float = 1.96) -> Tuple[float, float]:
    if total == 0:
        return 0.0, 0.0
    phat = count / total
    denominator = 1 + (z**2) / total
    center = phat + (z**2) / (2 * total)
    margin = z * math.sqrt((phat * (1 - phat) + (z**2) / (4 * total)) / total)
    lower = max(0.0, (center - margin) / denominator)
    upper = min(1.0, (center + margin) / denominator)
    return lower, upper


def _generate_genotype_distribution(allele_freqs: Dict[str, float]) -> Dict[str, float]:
    alleles = list(allele_freqs.keys())
    distribution: Dict[str, float] = {}
    for i, allele_a in enumerate(alleles):
        for j, allele_b in enumerate(alleles):
            if j < i:
                continue
            freq_a = allele_freqs.get(allele_a, 0.0)
            freq_b = allele_freqs.get(allele_b, 0.0)
            if i == j:
                probability = freq_a * freq_a
            else:
                probability = 2 * freq_a * freq_b
            genotype = "".join(sorted((allele_a, allele_b)))
            distribution[genotype] = distribution.get(genotype, 0.0) + probability
    total = sum(distribution.values())
    if total == 0:
        return distribution
    return {key: value / total for key, value in distribution.items()}


def simulate_population(request: PopulationSimRequest) -> PopulationSimResponse:
    registry = get_trait_registry()
    freq_reference = load_allele_frequencies()

    population_key = request.population.upper()
    if population_key not in freq_reference:
        raise HTTPException(
            status_code=422,
            detail=f"Population '{request.population}' is not available in presets.",
        )

    rng = random.Random(request.seed)
    population_freqs = freq_reference[population_key]

    results: List[PopulationTraitResult] = []
    missing_traits: List[str] = []

    for trait_key in request.trait_keys:
        warnings: List[str] = []
        trait = registry.get(trait_key)
        if trait is None:
            missing_traits.append(trait_key)
            continue

        trait_freq_entry = population_freqs.get(trait_key)
        if not trait_freq_entry:
            missing_traits.append(trait_key)
            continue

        allele_freqs = trait_freq_entry.get("allele_freqs", {})
        if not allele_freqs:
            warnings.append("Allele frequencies missing; skipping trait.")
            missing_traits.append(trait_key)
            continue

        freq_total = sum(allele_freqs.values())
        if abs(freq_total - 1.0) > 0.05:
            warnings.append(
                f"Allele frequencies sum to {freq_total:.3f}; results may be unreliable."
            )
            normalization = freq_total or 1.0
            allele_freqs = {k: v / normalization for k, v in allele_freqs.items()}

        genotype_distribution = _generate_genotype_distribution(allele_freqs)
        if not genotype_distribution:
            warnings.append("Could not derive genotype distribution for trait.")
            missing_traits.append(trait_key)
            continue

        genotypes = list(genotype_distribution.keys())
        probabilities = [genotype_distribution[g] for g in genotypes]

        genotype_counts: Dict[str, int] = {g: 0 for g in genotypes}
        phenotype_counts: Dict[str, int] = {}

        for _ in range(request.n):
            genotype = rng.choices(genotypes, weights=probabilities, k=1)[0]
            genotype_counts[genotype] += 1
            phenotype = trait.phenotype_for(genotype)
            phenotype_counts[phenotype] = phenotype_counts.get(phenotype, 0) + 1

        phenotype_ci = {
            phenotype: PhenotypeConfidenceInterval(
                lower=ci[0],
                upper=ci[1],
            )
            for phenotype, ci in (
                (
                    phenotype,
                    _wilson_ci(count, request.n),
                )
                for phenotype, count in phenotype_counts.items()
            )
        }

        results.append(
            PopulationTraitResult(
                trait_key=trait_key,
                population=population_key,
                sample_size=request.n,
                allele_frequencies=dict(allele_freqs),
                genotype_counts=genotype_counts,
                phenotype_counts=phenotype_counts,
                phenotype_ci=phenotype_ci,
                warnings=warnings,
            )
        )

    return PopulationSimResponse(results=results, missing_traits=missing_traits)

