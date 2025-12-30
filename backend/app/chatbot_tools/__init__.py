"""Chatbot tools module for Zygotrix assistant."""

from .tools import (
    get_traits_count,
    search_traits,
    get_trait_details,
    list_traits_by_type,
    list_traits_by_inheritance,
    calculate_punnett_square,
    parse_cross_from_message,
    # DNA/RNA/Protein tools
    generate_random_dna_sequence,
    transcribe_dna_to_mrna,
    extract_codons_from_rna,
    translate_rna_to_protein,
    # Breeding simulation tools
    create_breeding_simulation,
)

from .gwas_tools import (
    list_gwas_datasets,
    get_gwas_job_status,
    run_gwas_analysis,
    get_gwas_results,
    list_gwas_jobs,
)

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
    # Breeding simulation tools
    "create_breeding_simulation",
    # GWAS tools
    "list_gwas_datasets",
    "get_gwas_job_status",
    "run_gwas_analysis",
    "get_gwas_results",
    "list_gwas_jobs",
]

