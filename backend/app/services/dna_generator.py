from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from ..config import get_settings
from ..schema.dna_generator import DnaGenerateRequest, DnaGenerateResponse


def _load_dna_cli_path() -> Path:
    """Load and validate the path to the DNA generator CLI executable."""
    settings = get_settings()
    candidates = [
        os.getenv("DNA_GENERATOR_CLI_PATH"),
        getattr(settings, "dna_generator_cli_path", None),
        # Fallback to default location
        str(Path(__file__).parent.parent.parent.parent / "zygotrix_engine_cpp" / "build" / "zyg_dna_cli"),
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
        detail="DNA generator CLI executable not found. Set DNA_GENERATOR_CLI_PATH to the compiled zyg_dna_cli binary or build the C++ project.",
    )


def generate_dna_sequence(request: DnaGenerateRequest) -> DnaGenerateResponse:
    """
    Generate a DNA sequence using the C++ DNA generator CLI.

    Args:
        request: DNA generation request with length, gc_content, and optional seed

    Returns:
        DnaGenerateResponse with the generated sequence and metadata

    Raises:
        HTTPException: If the CLI is not found, times out, or returns an error
    """
    cli_path = _load_dna_cli_path()

    payload = json.dumps(
        request.model_dump(exclude_none=True),
        separators=(",", ":"),
    )

    try:
        completed = subprocess.run(
            [str(cli_path)],
            input=payload.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=30,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"DNA generator CLI executable not found at {cli_path}",
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(
            status_code=504,
            detail="DNA generator timed out while generating sequence",
        ) from exc

    if completed.returncode != 0:
        detail = completed.stderr.decode("utf-8").strip() or completed.stdout.decode("utf-8").strip()
        if not detail:
            detail = f"DNA generator exited with status {completed.returncode}"
        raise HTTPException(status_code=500, detail=detail)

    try:
        response_payload: Any = json.loads(completed.stdout.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Malformed response from DNA generator: {exc}",
        ) from exc

    if isinstance(response_payload, dict) and "error" in response_payload:
        raise HTTPException(status_code=400, detail=response_payload["error"])

    return DnaGenerateResponse.parse_obj(response_payload)
