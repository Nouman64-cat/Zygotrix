from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from ..config import get_settings
from ..schema.cpp_engine import GeneticCrossRequest, GeneticCrossResponse


def _load_cli_path() -> Path:
    settings = get_settings()
    candidates = [
        os.getenv("CPP_ENGINE_CLI_PATH"),
        getattr(settings, "cpp_engine_cli_path", None),
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
        detail="C++ engine CLI executable not found. Set CPP_ENGINE_CLI_PATH to the compiled zyg_cross_cli binary.",
    )


def run_cpp_cross(request: GeneticCrossRequest) -> GeneticCrossResponse:
    cli_path = _load_cli_path()

    payload = json.dumps(
        request.dict(by_alias=True, exclude_none=True),
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
            detail=f"C++ engine CLI executable not found at {cli_path}",
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(
            status_code=504,
            detail="C++ engine timed out while computing the genetic cross",
        ) from exc

    if completed.returncode != 0:
        detail = completed.stderr.decode("utf-8").strip() or completed.stdout.decode("utf-8").strip()
        if not detail:
            detail = f"C++ engine exited with status {completed.returncode}"
        raise HTTPException(status_code=500, detail=detail)

    try:
        response_payload: Any = json.loads(completed.stdout.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Malformed response from C++ engine: {exc}",
        ) from exc

    if isinstance(response_payload, dict) and "error" in response_payload:
        raise HTTPException(status_code=400, detail=response_payload["error"])

    return GeneticCrossResponse.parse_obj(response_payload)
