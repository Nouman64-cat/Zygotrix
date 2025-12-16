from __future__ import annotations

import json
import subprocess
import os
import time
from pathlib import Path
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

# Import Python implementation as fallback
from .protein_generator_impl import (
    generate_dna_sequence as py_generate_dna_sequence,
    transcribe_to_rna as py_transcribe_to_rna,
    extract_amino_acids as py_extract_amino_acids,
    generate_protein_sequences as py_generate_protein_sequences,
    calculate_actual_gc as py_calculate_actual_gc,
    find_all_orfs as py_find_all_orfs,
)


def _get_cpp_cli_path() -> Optional[Path]:
    """Get the path to the C++ protein CLI, if available."""
    settings = get_settings()
    cli_path = Path(settings.cpp_protein_cli_path).resolve()
    
    # Try relative to the backend directory
    if not cli_path.exists():
        backend_dir = Path(__file__).parent.parent.parent
        cli_path = (backend_dir / settings.cpp_protein_cli_path).resolve()
    
    if cli_path.exists() and os.access(cli_path, os.X_OK):
        return cli_path
    
    return None


def _call_cpp_cli(request_data: dict, timeout: int = 120) -> dict:
    """
    Call the C++ CLI with the given request data.
    
    Args:
        request_data: Dictionary to send as JSON to the CLI
        timeout: Maximum seconds to wait for response
        
    Returns:
        Parsed JSON response from the CLI
        
    Raises:
        RuntimeError: If CLI fails or returns an error
    """
    cli_path = _get_cpp_cli_path()
    if not cli_path:
        raise RuntimeError("C++ CLI not available")
    
    result = subprocess.run(
        [str(cli_path)],
        input=json.dumps(request_data),
        capture_output=True,
        text=True,
        timeout=timeout
    )
    
    if result.returncode != 0:
        try:
            error_response = json.loads(result.stdout)
            if "error" in error_response:
                raise RuntimeError(f"C++ CLI error: {error_response['error']}")
        except json.JSONDecodeError:
            pass
        raise RuntimeError(f"C++ CLI failed: {result.stderr or result.stdout}")
    
    response = json.loads(result.stdout)
    
    if "error" in response:
        raise RuntimeError(f"C++ CLI error: {response['error']}")
    
    return response


def _use_cpp_engine() -> bool:
    """Check if C++ engine should be used."""
    settings = get_settings()
    return settings.use_cpp_engine and _get_cpp_cli_path() is not None


def generate_dna_rna(request: ProteinGenerateRequest) -> ProteinGenerateResponse:
    """
    Generate DNA and RNA sequences.
    Uses C++ engine if available, falls back to Python.
    """
    if _use_cpp_engine():
        try:
            cpp_request = {
                "action": "generate",
                "length": request.length,
                "gc_content": request.gc_content,
            }
            if request.seed is not None:
                cpp_request["seed"] = request.seed
            
            print(f"🚀 [C++ ENGINE] Generating DNA sequence ({request.length:,} bp)...")
            start_time = time.time()
            result = _call_cpp_cli(cpp_request)
            elapsed = time.time() - start_time
            print(f"✅ [C++ ENGINE] DNA generation complete! ⏱️ {elapsed:.3f}s")
            
            return ProteinGenerateResponse(
                dna_sequence=result["dna_sequence"],
                rna_sequence=result["rna_sequence"],
                length=result["length"],
                gc_content=result["gc_content"],
                actual_gc=result["actual_gc"]
            )
        except Exception as e:
            # Log and fall back to Python
            print(f"⚠️ [C++ ENGINE] Failed, falling back to Python: {e}")
    
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
            cpp_request = {
                "action": "extract_amino_acids",
                "rna_sequence": request.rna_sequence,
            }
            
            result = _call_cpp_cli(cpp_request)
            
            return AminoAcidExtractResponse(amino_acids=result["amino_acids"])
        except Exception as e:
            print(f"C++ engine failed, falling back to Python: {e}")
    
    # Python fallback
    amino_acids_list = py_extract_amino_acids(request.rna_sequence)
    amino_acids_str = "-".join(aa["name_3letter"] for aa in amino_acids_list)

    return AminoAcidExtractResponse(amino_acids=amino_acids_str)


def generate_protein_sequence(request: ProteinSequenceRequest) -> ProteinSequenceResponse:
    """
    Generate protein sequence from RNA.
    Uses C++ engine for ORF finding if available, falls back to Python.
    """
    protein_data = None
    seq_len = len(request.rna_sequence)
    
    # Try C++ engine first
    if _use_cpp_engine():
        try:
            cpp_request = {
                "action": "find_orfs",
                "rna_sequence": request.rna_sequence,
            }
            
            print(f"🚀 [C++ ENGINE] Finding ORFs in RNA sequence ({seq_len:,} bp)...")
            start_time = time.time()
            result = _call_cpp_cli(cpp_request, timeout=300)  # 5 minute timeout for large sequences
            elapsed = time.time() - start_time
            print(f"✅ [C++ ENGINE] Found {result.get('total_orfs', 0):,} ORFs! ⏱️ {elapsed:.3f}s")
            
            # Convert C++ response to match Python format
            protein_data = {
                "orfs": result.get("orfs", []),
                "total_orfs": result.get("total_orfs", 0),
                "sequence_3letter": result.get("sequence_3letter", ""),
                "sequence_1letter": result.get("sequence_1letter", ""),
                "amino_acids": []  # Not used for ORF-based response
            }
        except Exception as e:
            print(f"⚠️ [C++ ENGINE] ORF finding failed, falling back to Python: {e}")
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
        # For protein classification, parse the 1-letter sequence
        protein_1letter = first_orf.get("protein_1letter", "")
        protein_length = len(protein_1letter)
    else:
        protein_length = 0

    # Simple classification based on composition
    if protein_length == 0:
        protein_type = "Invalid/Junk"
        stability_score = 0
    else:
        # Get the first ORF's 1-letter sequence for classification
        sequence = orfs[0].get("protein_1letter", "") if orfs else ""
        
        # Count hydrophobic amino acids (1-letter codes)
        hydrophobic = set("IVLFMAW")
        hydrophobic_count = sum(1 for aa in sequence if aa in hydrophobic)

        # Count charged amino acids (1-letter codes)
        charged = set("RKDEH")
        charged_count = sum(1 for aa in sequence if aa in charged)

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
