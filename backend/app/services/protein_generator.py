from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from ..config import get_settings
from ..schema.protein_generator import (
    ProteinGenerateRequest,
    ProteinGenerateResponse,
    AminoAcidExtractRequest,
    AminoAcidExtractResponse,
    ProteinSequenceRequest,
    ProteinSequenceResponse,
)


def _load_protein_cli_path() -> Path:
    """Load and validate the path to the protein generator CLI executable."""
    settings = get_settings()
    candidates = [
        os.getenv("PROTEIN_GENERATOR_CLI_PATH"),
        getattr(settings, "protein_generator_cli_path", None),
        # Fallback to default location
        str(Path(__file__).parent.parent.parent.parent / "zygotrix_engine_cpp" / "build" / "zyg_protein_cli"),
    ]
    for candidate in candidates:
        if not candidate:
            continue
        path = Path(candidate).expanduser().resolve()
        candidates_to_check = [path]
        if os.name == "nt" and path.suffix == "":
            candidates_to_check.append(path.with_suffix(".exe"))
        for candidate_path in candidates_to_check:
            if candidate_path.exists() and os.access(candidate_path, os.X_OK):
                return candidate_path
    raise HTTPException(
        status_code=500,
        detail="Protein generator CLI executable not found. Set PROTEIN_GENERATOR_CLI_PATH to the compiled zyg_protein_cli binary or build the C++ project.",
    )


def _call_protein_cli(payload: dict) -> dict:
    """Call the C++ protein generator CLI with the given payload."""
    cli_path = _load_protein_cli_path()

    payload_json = json.dumps(payload, separators=(",", ":"))

    try:
        completed = subprocess.run(
            [str(cli_path)],
            input=payload_json.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=30,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Protein generator CLI executable not found at {cli_path}",
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(
            status_code=504,
            detail="Protein generator timed out",
        ) from exc

    if completed.returncode != 0:
        detail = completed.stderr.decode("utf-8").strip() or completed.stdout.decode("utf-8").strip()
        if not detail:
            detail = f"Protein generator exited with status {completed.returncode}"
        raise HTTPException(status_code=500, detail=detail)

    try:
        response_payload: Any = json.loads(completed.stdout.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Malformed response from protein generator: {exc}",
        ) from exc

    if isinstance(response_payload, dict) and "error" in response_payload:
        raise HTTPException(status_code=400, detail=response_payload["error"])

    return response_payload


def generate_dna_rna(request: ProteinGenerateRequest) -> ProteinGenerateResponse:
    """
    Generate DNA and RNA sequences.

    Args:
        request: DNA generation request with length, gc_content, and optional seed

    Returns:
        ProteinGenerateResponse with DNA and RNA sequences

    Raises:
        HTTPException: If the CLI is not found, times out, or returns an error
    """
    payload = {
        "action": "generate",
        **request.model_dump(exclude_none=True),
    }

    response_payload = _call_protein_cli(payload)
    return ProteinGenerateResponse.parse_obj(response_payload)


def extract_amino_acids(request: AminoAcidExtractRequest) -> AminoAcidExtractResponse:
    """
    Extract amino acids from RNA sequence.

    Args:
        request: Amino acid extraction request with RNA sequence

    Returns:
        AminoAcidExtractResponse with amino acids

    Raises:
        HTTPException: If the CLI is not found, times out, or returns an error
    """
    payload = {
        "action": "extract_amino_acids",
        **request.model_dump(exclude_none=True),
    }

    response_payload = _call_protein_cli(payload)
    return AminoAcidExtractResponse.parse_obj(response_payload)


def generate_protein_sequence(request: ProteinSequenceRequest) -> ProteinSequenceResponse:
    """
    Generate protein sequence from RNA.

    Args:
        request: Protein generation request with RNA sequence

    Returns:
        ProteinSequenceResponse with protein sequences in 3-letter and 1-letter formats

    Raises:
        HTTPException: If the CLI is not found, times out, or returns an error
    """
    payload = {
        "action": "generate_protein",
        **request.model_dump(exclude_none=True),
    }

    response_payload = _call_protein_cli(payload)
    return ProteinSequenceResponse.parse_obj(response_payload)
