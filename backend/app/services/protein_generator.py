from __future__ import annotations

import time
from typing import Optional

from ..config import get_settings
from ..schema.protein_generator import (
    ProteinGenerateRequest,
    ProteinGenerateResponse,
    AminoAcidExtractRequest,
    AminoAcidExtractResponse,
    ProteinSequenceRequest,
    ProteinSequenceResponse,
    ORFData,
)
from app.services.aws_worker_client import get_aws_worker

# Import Python implementation as fallback
from .protein_generator_impl import (
    generate_dna_sequence as py_generate_dna_sequence,
    transcribe_to_rna as py_transcribe_to_rna,
    extract_amino_acids as py_extract_amino_acids,
    generate_protein_sequences as py_generate_protein_sequences,
    calculate_actual_gc as py_calculate_actual_gc,
)

def _use_cpp_engine() -> bool:
    """Check if C++ engine (Lambda) is enabled."""
    return get_settings().use_cpp_engine

def generate_dna_rna(request: ProteinGenerateRequest) -> ProteinGenerateResponse:
    """
    Generate DNA and RNA sequences.
    Uses AWS Lambda C++ engine if enabled, falls back to Python.
    """
    if _use_cpp_engine():
        try:
            print(f"🚀 [AWS LAMBDA] Generating DNA sequence ({request.length:,} bp)...")
            start_time = time.time()
            
            worker = get_aws_worker()
            payload = {
                "length": request.length,
                "gc_content": request.gc_content,
            }
            if request.seed is not None:
                payload["seed"] = request.seed
                
            result = worker.invoke(action="dna", payload=payload)
            
            elapsed = time.time() - start_time
            print(f"✅ [AWS LAMBDA] DNA generation complete! ⏱️ {elapsed:.3f}s")
            
            # Handle potential key variations from Lambda (dna_sequence vs sequence)
            dna_seq = result.get("dna_sequence") or result.get("sequence")
            if not dna_seq:
                raise KeyError("dna_sequence")

            return ProteinGenerateResponse(
                dna_sequence=dna_seq,
                rna_sequence=result.get("rna_sequence") or py_transcribe_to_rna(dna_seq),
                length=result["length"],
                gc_content=result["gc_content"],
                actual_gc=result["actual_gc"]
            )
        except Exception as e:
            print(f"⚠️ [AWS LAMBDA] Failed, falling back to Python: {e}")
    
    # Python fallback
    print(f"🐍 [PYTHON] Generating DNA sequence ({request.length:,} bp)...")
    start_time = time.time()
    dna_seq = py_generate_dna_sequence(request.length, request.gc_content, request.seed)
    rna_seq = py_transcribe_to_rna(dna_seq)
    actual_gc = py_calculate_actual_gc(dna_seq)
    elapsed = time.time() - start_time
    print(f"✅ [PYTHON] DNA generation complete! ⏱️ {elapsed:.3f}s")

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
    """
    if _use_cpp_engine():
        try:
            worker = get_aws_worker()
            # Explicitly state the action for the C++ engine
            result = worker.invoke(action="protein", payload={
                "action": "extract_amino_acids", 
                "rna_sequence": request.rna_sequence
            })
            return AminoAcidExtractResponse(amino_acids=result["amino_acids"])
        except Exception:
            pass
    
    # Python fallback
    amino_acids_list = py_extract_amino_acids(request.rna_sequence)
    amino_acids_str = "-".join(aa["name_3letter"] for aa in amino_acids_list)

    return AminoAcidExtractResponse(amino_acids=amino_acids_str)

def generate_protein_sequence(request: ProteinSequenceRequest) -> ProteinSequenceResponse:
    """
    Generate protein sequence from RNA.
    Uses AWS Lambda (action='protein') for ORF finding if enabled.
    """
    protein_data = None
    seq_len = len(request.rna_sequence)
    
    if _use_cpp_engine():
        try:
            print(f"🚀 [AWS LAMBDA] Finding ORFs in RNA sequence ({seq_len:,} bp)...")
            start_time = time.time()
            
            worker = get_aws_worker()
            # Pass 'action' in payload so C++ engine knows strictly what to do
            payload = {
                "action": "find_orfs",
                "rna_sequence": request.rna_sequence
            }
            
            result = worker.invoke(action="protein", payload=payload)
            elapsed = time.time() - start_time
            print(f"✅ [AWS LAMBDA] Found {result.get('total_orfs', 0):,} ORFs! ⏱️ {elapsed:.3f}s")
            
            protein_data = {
                "orfs": result.get("orfs", []),
                "total_orfs": result.get("total_orfs", 0),
                "sequence_3letter": result.get("sequence_3letter", ""),
                "sequence_1letter": result.get("sequence_1letter", ""),
            }
        except Exception as e:
            print(f"⚠️ [AWS LAMBDA] ORF finding failed, falling back to Python: {e}")
            protein_data = None
    
    # Python fallback
    if protein_data is None:
        print(f"🐍 [PYTHON] Finding ORFs in RNA sequence ({seq_len:,} bp)...")
        start_time = time.time()
        protein_data = py_generate_protein_sequences(request.rna_sequence)
        elapsed = time.time() - start_time
        print(f"✅ [PYTHON] Found {protein_data.get('total_orfs', 0):,} ORFs! ⏱️ {elapsed:.3f}s")
    
    # Get first ORF's amino acids for protein classification
    orfs = protein_data.get("orfs", [])
    if orfs:
        first_orf = orfs[0]
        protein_1letter = first_orf.get("protein_1letter", "")
        protein_length = len(protein_1letter)
    else:
        protein_length = 0

    # Simple classification based on composition
    if protein_length == 0:
        protein_type = "Invalid/Junk"
        stability_score = 0
    else:
        sequence = orfs[0].get("protein_1letter", "") if orfs else ""
        hydrophobic = set("IVLFMAW")
        hydrophobic_count = sum(1 for aa in sequence if aa in hydrophobic)
        charged = set("RKDEH")
        charged_count = sum(1 for aa in sequence if aa in charged)

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
            start_position=orf.get("start_position") or orf.get("start", 0),
            end_position=orf.get("end_position") or orf.get("end", 0),
            protein_3letter=orf.get("protein_3letter", ""),
            protein_1letter=orf.get("protein_1letter", ""),
            length=orf.get("length", 0)
        )
        for orf in orfs
    ]

    return ProteinSequenceResponse(
        protein_3letter=protein_data.get("sequence_3letter", ""),
        protein_1letter=protein_data.get("sequence_1letter", ""),
        protein_length=protein_length,
        protein_type=protein_type,
        stability_score=stability_score,
        orfs=orfs_data,
        total_orfs=len(orfs)
    )
