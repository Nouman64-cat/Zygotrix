from __future__ import annotations
import itertools
from typing import Any, Dict, List, Optional, Tuple, Union

from packaging import version as pkg_version

from app.schema.traits import (
    TraitCreatePayload,
    TraitUpdatePayload,
    ValidationRules,
)


def _canonicalize_genotype(genotype: str) -> str:

    return "".join(sorted(genotype))


def _validate_phenotype_coverage(
    alleles: List[str], phenotype_map: Dict[str, str]
) -> List[str]:

    if not alleles:
        return ["Alleles list cannot be empty"]

    errors = []
    expected_genotypes = set()
    for allele1, allele2 in itertools.product(alleles, repeat=2):
        canonical = _canonicalize_genotype(allele1 + allele2)
        expected_genotypes.add(canonical)

    provided_genotypes = {_canonicalize_genotype(g) for g in phenotype_map.keys()}

    missing = expected_genotypes - provided_genotypes
    if missing:
        errors.append(f"Missing genotype phenotypes: {', '.join(sorted(missing))}")

    extra = provided_genotypes - expected_genotypes
    if extra:
        errors.append(
            f"Unexpected genotypes in phenotype map: {', '.join(sorted(extra))}"
        )
    return errors


def _get_alleles_and_phenotype_map(
    payload: Union[TraitCreatePayload, TraitUpdatePayload],
    existing_trait: Optional[Dict] = None,
) -> Tuple[List[str], Dict[str, str]]:

    if isinstance(payload, TraitCreatePayload):
        return payload.alleles, dict(payload.phenotype_map)

    existing_alleles = existing_trait.get("alleles", []) if existing_trait else []
    existing_phenotype = (
        existing_trait.get("phenotype_map", {}) if existing_trait else {}
    )

    alleles = payload.alleles if payload.alleles is not None else existing_alleles
    phenotype_map = (
        dict(payload.phenotype_map)
        if payload.phenotype_map is not None
        else existing_phenotype
    )
    return alleles, phenotype_map


def _validate_create_payload(payload: TraitCreatePayload) -> List[str]:

    errors = []
    if not payload.key.strip():
        errors.append("Trait key cannot be empty")
    if not payload.name.strip():
        errors.append("Trait name cannot be empty")
    if not payload.alleles:
        errors.append("At least one allele must be provided")
    return errors


def _validate_version_format(
    payload: Union[TraitCreatePayload, TraitUpdatePayload],
) -> List[str]:

    errors = []
    payload_any: Any = payload
    version_value = getattr(payload_any, "version", None)
    if version_value:
        try:
            pkg_version.Version(str(version_value))
        except pkg_version.InvalidVersion:
            errors.append("Invalid version format (use semantic versioning)")
    return errors


def validate_trait_data(
    payload: Union[TraitCreatePayload, TraitUpdatePayload],
    existing_trait: Optional[Dict] = None,
) -> ValidationRules:

    errors = []
    alleles, phenotype_map = _get_alleles_and_phenotype_map(payload, existing_trait)

    if alleles and phenotype_map:
        coverage_errors = _validate_phenotype_coverage(alleles, phenotype_map)
        errors.extend(coverage_errors)

    if isinstance(payload, TraitCreatePayload):
        create_errors = _validate_create_payload(payload)
        errors.extend(create_errors)

    version_errors = _validate_version_format(payload)
    errors.extend(version_errors)

    return ValidationRules(passed=len(errors) == 0, errors=errors)
