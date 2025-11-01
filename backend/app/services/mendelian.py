from typing import Mapping, Iterable, List, Dict, Tuple, Optional
import logging
import subprocess
import json
from pathlib import Path

from app.models import Simulator, Trait, MendelianCalculator
from app.utils.trait_helpers import normalize_probabilities, to_percentage_distribution
from .service_factory import get_service_factory
from .trait_converter import build_cpp_engine_request
from ..config import get_settings

logger = logging.getLogger(__name__)

_trait_service = get_service_factory().get_trait_service()


def get_simulator():
    return _trait_service.get_simulator()


def filter_traits(trait_filter: Iterable[str] | None):
    return _trait_service.filter_engine_traits(trait_filter)


def _use_cpp_engine() -> bool:
    """Check if C++ engine should be used."""
    settings = get_settings()
    return settings.use_cpp_engine


def _run_cpp_cli(request_data: Dict) -> Dict:
    """
    Run the C++ CLI executable with exact-mode request and return JSON response.

    Args:
        request_data: Dictionary with genes, mother, father, as_percentages, joint_phenotypes

    Returns:
        Dictionary with results and missing_traits

    Raises:
        RuntimeError: If CLI execution fails or returns error
    """
    settings = get_settings()

    # Get CLI path
    cli_path_str = settings.cpp_engine_cli_path
    if not cli_path_str:
        raise RuntimeError("C++ engine CLI path not configured in settings")

    cli_path = Path(cli_path_str).expanduser().resolve()
    if not cli_path.exists():
        raise RuntimeError(f"C++ engine CLI not found at {cli_path}")

    # Log the request for debugging (at debug level)
    logger.debug(
        f"Calling C++ engine with {len(request_data.get('genes', []))} genes")

    # Run CLI with JSON input
    payload = json.dumps(request_data, separators=(',', ':'))
    try:
        completed = subprocess.run(
            [str(cli_path)],
            input=payload.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=30,
        )
    except subprocess.TimeoutExpired as exc:
        logger.error("C++ engine timed out after 30 seconds")
        raise RuntimeError("C++ engine timed out") from exc

    if completed.returncode != 0:
        error_msg = completed.stderr.decode(
            "utf-8").strip() or completed.stdout.decode("utf-8").strip()
        logger.error(
            f"C++ engine failed with exit code {completed.returncode}: {error_msg}")
        raise RuntimeError(f"C++ engine error: {error_msg}")

    # Parse JSON response
    try:
        response = json.loads(completed.stdout.decode("utf-8"))
    except json.JSONDecodeError as exc:
        logger.error(f"C++ engine returned invalid JSON: {exc}")
        raise RuntimeError(f"Invalid JSON from C++ engine: {exc}") from exc

    if isinstance(response, dict) and "error" in response:
        logger.error(f"C++ engine returned error: {response['error']}")
        raise RuntimeError(f"C++ engine error: {response['error']}")

    logger.debug(
        f"C++ engine returned {len(response.get('results', {}))} trait results")
    return response


def simulate_mendelian_traits(
    parent1: Mapping[str, str],
    parent2: Mapping[str, str],
    trait_filter: Iterable[str] | None,
    as_percentages: bool,
    max_traits: int = 5,
) -> Tuple[Dict[str, Dict[str, Dict[str, float]]], List[str]]:
    """
    Simulate Mendelian traits using the C++ engine.

    Args:
        parent1: Genotypes for parent 1 (e.g., {"abo_blood_group": "AO"})
        parent2: Genotypes for parent 2
        trait_filter: Optional list of trait keys to filter
        as_percentages: Return probabilities as percentages (True) or decimals (False)
        max_traits: Maximum number of traits to simulate

    Returns:
        Tuple of (results dict, missing traits list)
    """
    registry, missing = filter_traits(trait_filter)
    trait_keys = set(parent1.keys()) & set(
        parent2.keys()) & set(registry.keys())
    if len(trait_keys) > max_traits:
        raise ValueError(
            f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")

    # Convert Trait objects to dictionaries for C++ engine
    trait_dicts = []
    for trait_key, trait_obj in registry.items():
        trait_dict = {
            "key": trait_key,
            "name": trait_obj.name,
            "alleles": list(trait_obj.alleles),
            "phenotype_map": dict(trait_obj.phenotype_map),
            "metadata": dict(trait_obj.metadata) if trait_obj.metadata else {}
        }
        trait_dicts.append(trait_dict)

    # Build C++ engine request
    request = build_cpp_engine_request(
        parent1_genotypes=dict(parent1),
        parent2_genotypes=dict(parent2),
        traits=trait_dicts,
        as_percentages=as_percentages,
        joint_phenotypes=False
    )

    # Call C++ engine
    cpp_result = _run_cpp_cli(request)

    # Return results in expected format
    ordered_results: Dict[str, Dict[str, Dict[str, float]]] = {}
    for key in registry.keys() if not trait_filter else trait_filter:
        if key in cpp_result.get("results", {}):
            ordered_results[key] = cpp_result["results"][key]

    return ordered_results, cpp_result.get("missing_traits", missing)


def simulate_joint_phenotypes(
    parent1: Mapping[str, str],
    parent2: Mapping[str, str],
    trait_filter: Iterable[str] | None,
    as_percentages: bool,
    max_traits: int = 5,
) -> Tuple[Dict[str, float], List[str]]:
    registry, missing = filter_traits(trait_filter)
    trait_keys = set(parent1.keys()) & set(
        parent2.keys()) & set(registry.keys())
    if len(trait_keys) > max_traits:
        raise ValueError(
            f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")

    # Convert Trait objects to dictionaries for C++ engine
    trait_dicts = []
    for trait_key, trait_obj in registry.items():
        trait_dict = {
            "key": trait_key,  # Use "key" instead of "trait_key"
            "name": trait_obj.name,
            "alleles": list(trait_obj.alleles),
            "phenotype_map": dict(trait_obj.phenotype_map),
            "metadata": dict(trait_obj.metadata) if trait_obj.metadata else {}
        }
        trait_dicts.append(trait_dict)

    # Build C++ engine request
    request = build_cpp_engine_request(
        parent1_genotypes=dict(parent1),
        parent2_genotypes=dict(parent2),
        traits=trait_dicts,
        as_percentages=as_percentages,
        joint_phenotypes=True
    )

    # Call C++ engine
    cpp_result = _run_cpp_cli(request)

    # Return joint phenotype results
    return cpp_result.get("results", {}), cpp_result.get("missing_traits", missing)


def get_possible_genotypes_for_traits(
    trait_keys: List[str],
    max_traits: int = 5,
) -> Tuple[Dict[str, List[str]], List[str]]:
    if len(trait_keys) > max_traits:
        raise ValueError(
            f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")
    registry, missing = filter_traits(trait_keys)
    simulator = Simulator(trait_registry=registry)
    valid_trait_keys = [key for key in trait_keys if key in registry]
    try:
        genotypes = simulator.get_possible_genotypes_for_traits(
            valid_trait_keys)
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
        raise PreviewValidationError(
            ["At least two alleles are required for preview."])
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
    missing = [gen for gen in trait.all_genotypes()
               if gen not in canonical_map]
    if missing:
        raise PreviewValidationError(
            ["Missing phenotype mapping for genotypes: " +
                ", ".join(sorted(missing))]
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
    # Type-safe extraction with defaults
    alleles_raw = trait_data.get("alleles", [])
    alleles = list(alleles_raw) if isinstance(
        alleles_raw, (list, tuple)) else []

    phenotype_map_raw = trait_data.get("phenotype_map", {})
    phenotype_map = dict(phenotype_map_raw) if isinstance(
        phenotype_map_raw, dict) else {}

    inheritance_raw = trait_data.get("inheritance_pattern")
    inheritance_pattern = str(
        inheritance_raw) if inheritance_raw is not None else None

    trait = _build_preview_trait(
        name=str(trait_data.get("name", "Preview Trait")),
        alleles=alleles,
        phenotype_map=phenotype_map,
        inheritance_pattern=inheritance_pattern,
    )
    calculator = MendelianCalculator()

    try:
        parent1_canonical = trait.canonical_genotype(parent1)
    except ValueError as exc:
        raise PreviewValidationError(
            [f"Parent 1 genotype invalid: {exc}"]) from exc
    try:
        parent2_canonical = trait.canonical_genotype(parent2)
    except ValueError as exc:
        raise PreviewValidationError(
            [f"Parent 2 genotype invalid: {exc}"]) from exc

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
    phenotype_distribution = trait.phenotype_distribution(
        genotype_distribution)

    total_geno = sum(genotype_distribution.values())
    total_pheno = sum(phenotype_distribution.values())
    tolerance = 0.001
    errors: List[str] = []
    if abs(total_geno - 1.0) > tolerance:
        errors.append(
            f"Genotype probabilities sum to {total_geno:.6f}; expected 1.0.")
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
