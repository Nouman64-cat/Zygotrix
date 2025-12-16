from __future__ import annotations

from ..schema.protein_generator import (
    ProteinGenerateRequest,
    ProteinGenerateResponse,
    AminoAcidExtractRequest,
    AminoAcidExtractResponse,
    ProteinSequenceRequest,
    ProteinSequenceResponse,
)

# Import Python implementation
from .protein_generator_impl import (
    generate_dna_sequence,
    transcribe_to_rna,
    extract_amino_acids,
    generate_protein_sequences,
    calculate_actual_gc,
)


def generate_dna_rna(request: ProteinGenerateRequest) -> ProteinGenerateResponse:
    """
    Generate DNA and RNA sequences.

    Args:
        request: DNA generation request with length, gc_content, and optional seed

    Returns:
        ProteinGenerateResponse with DNA and RNA sequences
    """
    dna_seq = generate_dna_sequence(request.length, request.gc_content, request.seed)
    rna_seq = transcribe_to_rna(dna_seq)
    actual_gc = calculate_actual_gc(dna_seq)

    return ProteinGenerateResponse(
        dna_sequence=dna_seq,
        rna_sequence=rna_seq,
        length=len(dna_seq),
        gc_content=request.gc_content,
        actual_gc=actual_gc
    )


def extract_amino_acids_from_rna(request: AminoAcidExtractRequest) -> AminoAcidExtractResponse:
    """
    Extract amino acids from RNA sequence.

    Args:
        request: Amino acid extraction request with RNA sequence

    Returns:
        AminoAcidExtractResponse with amino acids
    """
    amino_acids_list = extract_amino_acids(request.rna_sequence)

    # Format as 3-letter codes joined by hyphens
    amino_acids_str = "-".join(aa["name_3letter"] for aa in amino_acids_list)

    return AminoAcidExtractResponse(amino_acids=amino_acids_str)


def generate_protein_sequence(request: ProteinSequenceRequest) -> ProteinSequenceResponse:
    """
    Generate protein sequence from RNA.

    Args:
        request: Protein generation request with RNA sequence

    Returns:
        ProteinSequenceResponse with protein sequences in 3-letter and 1-letter formats
    """
    from ..schema.protein_generator import ORFData

    protein_data = generate_protein_sequences(request.rna_sequence)
    amino_acids_list = protein_data["amino_acids"]

    # Calculate protein properties
    coding_amino_acids = [aa for aa in amino_acids_list if aa["name_3letter"] != "STOP"]
    protein_length = len(coding_amino_acids)

    # Simple classification based on composition
    if protein_length == 0:
        protein_type = "Invalid/Junk"
        stability_score = 0
    else:
        # Count hydrophobic amino acids
        hydrophobic = {"Ile", "Val", "Leu", "Phe", "Met", "Ala", "Trp"}
        hydrophobic_count = sum(1 for aa in coding_amino_acids if aa["name_3letter"] in hydrophobic)

        # Count charged amino acids
        charged = {"Arg", "Lys", "Asp", "Glu", "His"}
        charged_count = sum(1 for aa in coding_amino_acids if aa["name_3letter"] in charged)

        # Classify
        if hydrophobic_count / protein_length > 0.4:
            protein_type = "Structural (Fibrous)"
            stability_score = 45 + (hydrophobic_count * 2)
        elif charged_count / protein_length > 0.3:
            protein_type = "Signaling (Disordered)"
            stability_score = 25 + (charged_count * 2)
        else:
            protein_type = "Enzyme (Globular)"
            stability_score = 35 + (protein_length // 5)

    # Convert ORFs to ORFData schema
    orfs_data = [
        ORFData(
            start_position=orf["start_position"],
            end_position=orf["end_position"],
            protein_3letter=orf["protein_3letter"],
            protein_1letter=orf["protein_1letter"],
            length=orf["length"]
        )
        for orf in protein_data.get("orfs", [])
    ]

    return ProteinSequenceResponse(
        protein_3letter=protein_data["sequence_3letter"],
        protein_1letter=protein_data["sequence_1letter"],
        protein_length=protein_length,
        protein_type=protein_type,
        stability_score=stability_score,
        orfs=orfs_data,
        total_orfs=protein_data.get("total_orfs", 0)
    )
