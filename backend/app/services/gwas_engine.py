"""
GWAS C++ Engine Interface
==========================
Provides interface to the C++ GWAS statistical analysis engine.
Follows the same subprocess pattern as cpp_engine.py for consistency.
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any, Dict, List

from fastapi import HTTPException

from ..config import get_settings
from ..schema.gwas import GwasAnalysisType


def _load_gwas_cli_path() -> Path:
    """
    Locate the C++ GWAS CLI executable.

    Search order:
    1. Settings cpp_gwas_cli_path (can be overridden via CPP_GWAS_CLI_PATH env var)
    2. Auto-detect .exe extension on Windows

    Returns:
        Path to the executable

    Raises:
        HTTPException: If executable not found
    """
    settings = get_settings()
    candidates = [
        os.getenv("CPP_GWAS_CLI_PATH"),
        getattr(settings, "cpp_gwas_cli_path", None),
    ]

    for candidate in candidates:
        if not candidate:
            continue
        path = Path(candidate).expanduser().resolve()
        candidates_to_check = [path]

        # On Windows, try adding .exe extension if missing
        if os.name == "nt" and path.suffix == "":
            candidates_to_check.append(path.with_suffix(".exe"))

        for candidate_path in candidates_to_check:
            if candidate_path.exists() and os.access(candidate_path, os.X_OK):
                return candidate_path

    raise HTTPException(
        status_code=500,
        detail=(
            "C++ GWAS CLI executable not found. "
            "Build the engine first: see zygotrix_engine_cpp/GWAS_BUILD_INSTRUCTIONS.md"
        ),
    )


def run_gwas_analysis(
    snps: List[Dict[str, Any]],
    samples: List[Dict[str, Any]],
    analysis_type: GwasAnalysisType,
    maf_threshold: float = 0.01,
    num_threads: int = 4,
    timeout: int = 600,
) -> Dict[str, Any]:
    """
    Run GWAS analysis via C++ engine subprocess.

    Args:
        snps: List of SNP information dicts with keys:
            - rsid (str): SNP identifier
            - chromosome (int): Chromosome number
            - position (int): Base pair position
            - ref_allele (str): Reference allele
            - alt_allele (str): Alternate allele
            - maf (float, optional): Minor allele frequency
        samples: List of sample data dicts with keys:
            - sample_id (str): Sample identifier
            - phenotype (float): Phenotype value
            - genotypes (List[int]): Genotypes (0, 1, 2, or -9 for missing)
            - covariates (List[float], optional): Covariate values
        analysis_type: Type of analysis (linear, logistic, chi_square)
        maf_threshold: Minimum MAF threshold (default: 0.01)
        num_threads: Number of OpenMP threads (default: 4)
        timeout: Subprocess timeout in seconds (default: 600s = 10 minutes)

    Returns:
        Dict with keys:
            - success (bool): Whether analysis succeeded
            - results (List[Dict]): Association results
            - snps_tested (int): Number of SNPs that passed QC
            - snps_filtered (int): Number of SNPs filtered out
            - execution_time_ms (float): C++ execution time
            - error (str, optional): Error message if failed

    Raises:
        HTTPException: If C++ engine fails or times out

    Example:
        >>> snps = [{
        ...     "rsid": "rs1234567",
        ...     "chromosome": 1,
        ...     "position": 123456,
        ...     "ref_allele": "A",
        ...     "alt_allele": "G",
        ... }]
        >>> samples = [{
        ...     "sample_id": "s1",
        ...     "phenotype": 10.5,
        ...     "genotypes": [0],
        ...     "covariates": []
        ... }]
        >>> result = run_gwas_analysis(
        ...     snps=snps,
        ...     samples=samples,
        ...     analysis_type=GwasAnalysisType.LINEAR
        ... )
    """
    cli_path = _load_gwas_cli_path()

    # Build request payload for C++ engine
    request_data = {
        "snps": snps,
        "samples": samples,
        "test_type": analysis_type.value,  # Convert enum to string
        "maf_threshold": maf_threshold,
        "num_threads": num_threads,
    }

    payload = json.dumps(request_data, separators=(",", ":"))

    try:
        completed = subprocess.run(
            [str(cli_path)],
            input=payload.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=timeout,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"C++ GWAS CLI executable not found at {cli_path}",
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(
            status_code=504,
            detail=f"C++ GWAS engine timed out after {timeout} seconds. Try reducing dataset size or increasing timeout.",
        ) from exc

    # Check for non-zero exit code
    if completed.returncode != 0:
        detail = completed.stderr.decode("utf-8").strip() or completed.stdout.decode("utf-8").strip()
        if not detail:
            detail = f"C++ GWAS engine exited with status {completed.returncode}"
        raise HTTPException(status_code=500, detail=detail)

    # Parse JSON response
    try:
        response_payload: Any = json.loads(completed.stdout.decode("utf-8"))
    except json.JSONDecodeError as exc:
        stdout_preview = completed.stdout.decode("utf-8")[:500]
        raise HTTPException(
            status_code=500,
            detail=f"Malformed JSON from C++ GWAS engine: {exc}. Output: {stdout_preview}",
        ) from exc

    # Check for error in response
    if isinstance(response_payload, dict) and "error" in response_payload:
        if not response_payload.get("success", False):
            raise HTTPException(status_code=400, detail=response_payload["error"])

    return response_payload
