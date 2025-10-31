from typing import Mapping, Iterable, List, Dict, Tuple, Optional
from zygotrix_engine import Simulator, Trait
from zygotrix_engine.mendelian import MendelianCalculator
from zygotrix_engine.utils import normalize_probabilities, to_percentage_distribution
from .traits import filter_traits


def simulate_mendelian_traits(
    parent1: Mapping[str, str],
    parent2: Mapping[str, str],
    trait_filter: Iterable[str] | None,
    as_percentages: bool,
    max_traits: int = 5,
) -> Tuple[Dict[str, Dict[str, Dict[str, float]]], List[str]]:
    registry, missing = filter_traits(trait_filter)
    trait_keys = set(parent1.keys()) & set(parent2.keys()) & set(registry.keys())
    if len(trait_keys) > max_traits:
        raise ValueError(f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")
    simulator = Simulator(trait_registry=registry)
    parent1_filtered = {key: parent1[key] for key in parent1 if key in registry}
    parent2_filtered = {key: parent2[key] for key in parent2 if key in registry}
    results = simulator.simulate_mendelian_traits(
        parent1_filtered,
        parent2_filtered,
        as_percentages=as_percentages,
        max_traits=max_traits,
    )
    ordered_results: Dict[str, Dict[str, Dict[str, float]]] = {}
    for key in registry.keys() if not trait_filter else trait_filter:
        if key in results:
            ordered_results[key] = results[key]
    return ordered_results, missing


def simulate_joint_phenotypes(
    parent1: Mapping[str, str],
    parent2: Mapping[str, str],
    trait_filter: Iterable[str] | None,
    as_percentages: bool,
    max_traits: int = 5,
) -> Tuple[Dict[str, float], List[str]]:
    registry, missing = filter_traits(trait_filter)
    trait_keys = set(parent1.keys()) & set(parent2.keys()) & set(registry.keys())
    if len(trait_keys) > max_traits:
        raise ValueError(f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")
    simulator = Simulator(trait_registry=registry)
    parent1_filtered = {key: parent1[key] for key in parent1 if key in registry}
    parent2_filtered = {key: parent2[key] for key in parent2 if key in registry}
    results = simulator.simulate_joint_phenotypes(
        parent1_filtered,
        parent2_filtered,
        as_percentages=as_percentages,
        max_traits=max_traits,
    )
    return results, missing


def get_possible_genotypes_for_traits(
    trait_keys: List[str],
    max_traits: int = 5,
) -> Tuple[Dict[str, List[str]], List[str]]:
    if len(trait_keys) > max_traits:
        raise ValueError(f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")
    registry, missing = filter_traits(trait_keys)
    simulator = Simulator(trait_registry=registry)
    valid_trait_keys = [key for key in trait_keys if key in registry]
    try:
        genotypes = simulator.get_possible_genotypes_for_traits(valid_trait_keys)
        return genotypes, missing
    except ValueError as e:
        raise ValueError(str(e)) from e


class PreviewValidationError(ValueError):
    def __init__(self, errors: List[str]):
        super().__init__("; ".join(errors))
        self.errors = errors


def _build_preview_trait(
    name: str,
    alleles: Iterable[str],
    phenotype_map: Dict[str, str],
    inheritance_pattern: Optional[str] = None,
) -> Trait:
    allele_list = list(alleles)
    if len(allele_list) < 2:
        raise PreviewValidationError(["At least two alleles are required for preview."])
    metadata: Dict[str, str] = {}
    if inheritance_pattern:
        metadata["inheritance_pattern"] = inheritance_pattern
    base_trait = Trait(
        name=name,
        alleles=tuple(alleles),
        phenotype_map=phenotype_map,
        metadata=metadata,
    )
    canonical_map: Dict[str, str] = {}
    for genotype, phenotype in phenotype_map.items():
        canonical = base_trait.canonical_genotype(genotype)
        canonical_map[canonical] = phenotype
    trait = Trait(
        name=name,
        alleles=base_trait.alleles,
        phenotype_map=canonical_map,
        metadata=metadata,
    )
    missing = [gen for gen in trait.all_genotypes() if gen not in canonical_map]
    if missing:
        raise PreviewValidationError(
            ["Missing phenotype mapping for genotypes: " + ", ".join(sorted(missing))]
        )
    return trait


def _scale(value: float, as_percentages: bool) -> float:
    return value * 100.0 if as_percentages else value


def preview_mendelian(
    trait_data: Dict[str, object],
    parent1: str,
    parent2: str,
    as_percentages: bool,
) -> Dict[str, object]:
    trait = _build_preview_trait(
        name=str(trait_data.get("name", "Preview Trait")),
        alleles=trait_data.get("alleles", []),
        phenotype_map=trait_data.get("phenotype_map", {}),
        inheritance_pattern=trait_data.get("inheritance_pattern"),
    )
    calculator = MendelianCalculator()

    try:
        parent1_canonical = trait.canonical_genotype(parent1)
    except ValueError as exc:
        raise PreviewValidationError([f"Parent 1 genotype invalid: {exc}"]) from exc
    try:
        parent2_canonical = trait.canonical_genotype(parent2)
    except ValueError as exc:
        raise PreviewValidationError([f"Parent 2 genotype invalid: {exc}"]) from exc

    gametes_p1 = calculator._gamete_distribution(parent1_canonical, trait)
    gametes_p2 = calculator._gamete_distribution(parent2_canonical, trait)

    punnett_rows = []
    steps: List[str] = []

    def _format(probability: float) -> str:
        if as_percentages:
            return f"{probability * 100:.2f}%"
        return f"{probability:.4f}"

    steps.append(
        "P1 gametes: "
        + ", ".join(
            f"{allele} ({_format(prob)})" for allele, prob in gametes_p1.items()
        )
    )
    steps.append(
        "P2 gametes: "
        + ", ".join(
            f"{allele} ({_format(prob)})" for allele, prob in gametes_p2.items()
        )
    )

    gametes_payload = {
        "p1": [
            {"allele": allele, "probability": _scale(prob, as_percentages)}
            for allele, prob in gametes_p1.items()
        ],
        "p2": [
            {"allele": allele, "probability": _scale(prob, as_percentages)}
            for allele, prob in gametes_p2.items()
        ],
    }

    for allele1, prob1 in gametes_p1.items():
        row = []
        for allele2, prob2 in gametes_p2.items():
            cell_prob = prob1 * prob2
            genotype = trait.canonical_genotype(allele1 + allele2)
            steps.append(
                f"Cell {allele1}×{allele2} = {genotype} ({_format(cell_prob)})"
            )
            row.append(
                {
                    "genotype": genotype,
                    "probability": _scale(cell_prob, as_percentages),
                    "parent1_allele": allele1,
                    "parent2_allele": allele2,
                }
            )
        punnett_rows.append(row)

    genotype_distribution = calculator.calculate_offspring_probabilities(
        parent1_canonical,
        parent2_canonical,
        trait,
    )
    phenotype_distribution = trait.phenotype_distribution(genotype_distribution)

    total_geno = sum(genotype_distribution.values())
    total_pheno = sum(phenotype_distribution.values())
    tolerance = 0.001
    errors: List[str] = []
    if abs(total_geno - 1.0) > tolerance:
        errors.append(f"Genotype probabilities sum to {total_geno:.6f}; expected 1.0.")
    if abs(total_pheno - 1.0) > tolerance:
        errors.append(
            f"Phenotype probabilities sum to {total_pheno:.6f}; expected 1.0."
        )
    if errors:
        raise PreviewValidationError(errors)

    scaled_genotype = (
        to_percentage_distribution(genotype_distribution)
        if as_percentages
        else normalize_probabilities(genotype_distribution)
    )
    scaled_phenotype = (
        to_percentage_distribution(phenotype_distribution)
        if as_percentages
        else normalize_probabilities(phenotype_distribution)
    )

    for genotype, probability in genotype_distribution.items():
        steps.append(f"Sum {genotype} = {_format(probability)}")
    for phenotype, probability in phenotype_distribution.items():
        steps.append(f"Phenotype {phenotype} = {_format(probability)}")

    return {
        "gametes": gametes_payload,
        "punnett": punnett_rows,
        "genotype_dist": scaled_genotype,
        "phenotype_dist": scaled_phenotype,
        "steps": steps,
        "errors": [],
    }
