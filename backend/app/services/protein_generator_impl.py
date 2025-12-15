"""
Python fallback implementation for protein generation.
Used when the C++ CLI is not available.
"""
from __future__ import annotations

import random
from typing import Optional


# Standard genetic code - Maps RNA codons to amino acids
CODON_TABLE = {
    # Phenylalanine
    "UUU": ("Phe", "F"), "UUC": ("Phe", "F"),
    # Leucine
    "UUA": ("Leu", "L"), "UUG": ("Leu", "L"),
    "CUU": ("Leu", "L"), "CUC": ("Leu", "L"), "CUA": ("Leu", "L"), "CUG": ("Leu", "L"),
    # Isoleucine
    "AUU": ("Ile", "I"), "AUC": ("Ile", "I"), "AUA": ("Ile", "I"),
    # Methionine (Start)
    "AUG": ("Met", "M"),
    # Valine
    "GUU": ("Val", "V"), "GUC": ("Val", "V"), "GUA": ("Val", "V"), "GUG": ("Val", "V"),
    # Serine
    "UCU": ("Ser", "S"), "UCC": ("Ser", "S"), "UCA": ("Ser", "S"), "UCG": ("Ser", "S"),
    "AGU": ("Ser", "S"), "AGC": ("Ser", "S"),
    # Proline
    "CCU": ("Pro", "P"), "CCC": ("Pro", "P"), "CCA": ("Pro", "P"), "CCG": ("Pro", "P"),
    # Threonine
    "ACU": ("Thr", "T"), "ACC": ("Thr", "T"), "ACA": ("Thr", "T"), "ACG": ("Thr", "T"),
    # Alanine
    "GCU": ("Ala", "A"), "GCC": ("Ala", "A"), "GCA": ("Ala", "A"), "GCG": ("Ala", "A"),
    # Tyrosine
    "UAU": ("Tyr", "Y"), "UAC": ("Tyr", "Y"),
    # Stop codons
    "UAA": ("STOP", "*"), "UAG": ("STOP", "*"), "UGA": ("STOP", "*"),
    # Histidine
    "CAU": ("His", "H"), "CAC": ("His", "H"),
    # Glutamine
    "CAA": ("Gln", "Q"), "CAG": ("Gln", "Q"),
    # Asparagine
    "AAU": ("Asn", "N"), "AAC": ("Asn", "N"),
    # Lysine
    "AAA": ("Lys", "K"), "AAG": ("Lys", "K"),
    # Aspartic Acid
    "GAU": ("Asp", "D"), "GAC": ("Asp", "D"),
    # Glutamic Acid
    "GAA": ("Glu", "E"), "GAG": ("Glu", "E"),
    # Cysteine
    "UGU": ("Cys", "C"), "UGC": ("Cys", "C"),
    # Tryptophan
    "UGG": ("Trp", "W"),
    # Arginine
    "CGU": ("Arg", "R"), "CGC": ("Arg", "R"), "CGA": ("Arg", "R"), "CGG": ("Arg", "R"),
    "AGA": ("Arg", "R"), "AGG": ("Arg", "R"),
    # Glycine
    "GGU": ("Gly", "G"), "GGC": ("Gly", "G"), "GGA": ("Gly", "G"), "GGG": ("Gly", "G"),
}


def generate_dna_sequence(length: int, gc_content: float, seed: Optional[int] = None) -> str:
    """
    Generate a random DNA sequence with specified GC content.
    
    Args:
        length: Number of base pairs
        gc_content: Proportion of G and C nucleotides (0.0 to 1.0)
        seed: Optional seed for reproducibility
        
    Returns:
        DNA sequence string containing A, T, G, C
    """
    if seed is not None:
        random.seed(seed)
    
    # Calculate probabilities
    p_gc = gc_content / 2.0  # Probability for G or C individually
    p_at = (1.0 - gc_content) / 2.0  # Probability for A or T individually
    
    bases = ['A', 'T', 'G', 'C']
    weights = [p_at, p_at, p_gc, p_gc]
    
    sequence = random.choices(bases, weights=weights, k=length)
    return ''.join(sequence)


def transcribe_to_rna(dna_sequence: str) -> str:
    """
    Transcribe DNA to RNA by replacing T with U.
    
    Args:
        dna_sequence: Input DNA string
        
    Returns:
        RNA sequence string
    """
    return dna_sequence.replace('T', 'U').replace('t', 'u')


def calculate_actual_gc(sequence: str) -> float:
    """
    Calculate the actual GC content of a sequence.
    
    Args:
        sequence: DNA or RNA sequence
        
    Returns:
        GC content as a proportion (0.0 to 1.0)
    """
    if not sequence:
        return 0.0
    
    gc_count = sum(1 for base in sequence.upper() if base in ('G', 'C'))
    return gc_count / len(sequence)


def extract_amino_acids(rna_sequence: str) -> list[dict]:
    """
    Extract amino acids from RNA sequence by reading codons.
    
    Args:
        rna_sequence: Input RNA string
        
    Returns:
        List of amino acid dictionaries with codon, name_3letter, name_1letter
    """
    amino_acids = []
    rna = rna_sequence.upper()
    
    for i in range(0, len(rna) - 2, 3):
        codon = rna[i:i+3]
        
        if codon in CODON_TABLE:
            name_3, name_1 = CODON_TABLE[codon]
            
            # Stop translation at stop codons
            if name_3 == "STOP":
                amino_acids.append({
                    "codon": codon,
                    "name_3letter": name_3,
                    "name_1letter": name_1
                })
                break
                
            amino_acids.append({
                "codon": codon,
                "name_3letter": name_3,
                "name_1letter": name_1
            })
        else:
            # Unknown codon
            amino_acids.append({
                "codon": codon,
                "name_3letter": "UNK",
                "name_1letter": "?"
            })
    
    return amino_acids


def generate_protein_sequences(rna_sequence: str) -> dict:
    """
    Generate protein sequences from RNA in both 3-letter and 1-letter formats.
    
    Args:
        rna_sequence: Input RNA string
        
    Returns:
        Dictionary with sequence_3letter, sequence_1letter, amino_acid_count
    """
    amino_acids = extract_amino_acids(rna_sequence)
    
    # Filter out STOP codons for display
    coding_amino_acids = [aa for aa in amino_acids if aa["name_3letter"] != "STOP"]
    
    sequence_3letter = "-".join(aa["name_3letter"] for aa in coding_amino_acids)
    sequence_1letter = "".join(aa["name_1letter"] for aa in coding_amino_acids)
    
    return {
        "sequence_3letter": sequence_3letter,
        "sequence_1letter": sequence_1letter,
        "amino_acid_count": len(coding_amino_acids),
        "amino_acids": amino_acids
    }
