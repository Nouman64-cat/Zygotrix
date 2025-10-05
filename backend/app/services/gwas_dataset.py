"""Utility functions for loading and querying the GWAS dataset."""

from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import List

import pandas as pd

DATASET_FILENAME = "gwas_dataset.parquet"
GOOGLE_DRIVE_FILE_ID = "1CjeS_Az5CEBYtyQGSKMLL6Ikt7yeJd_E"
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
DATASET_PATH = DATA_DIR / DATASET_FILENAME

_dataset_lock = Lock()
_dataset_df: pd.DataFrame | None = None


class DatasetLoadError(RuntimeError):
    """Raised when the GWAS dataset cannot be loaded."""


def ensure_dataset_loaded() -> pd.DataFrame:
    """Return the GWAS dataset DataFrame, downloading it if needed."""
    global _dataset_df

    if _dataset_df is not None:
        return _dataset_df

    with _dataset_lock:
        if _dataset_df is not None:
            return _dataset_df

        DATA_DIR.mkdir(parents=True, exist_ok=True)

        if not DATASET_PATH.exists():
            _download_dataset(DATASET_PATH)

        try:
            _dataset_df = pd.read_parquet(DATASET_PATH)
        except Exception as exc:  # pragma: no cover - defensive programming
            raise DatasetLoadError(f"Unable to load GWAS dataset: {exc}") from exc

        return _dataset_df


def _download_dataset(destination: Path) -> None:
    """Download the GWAS dataset using gdown."""
    try:
        import gdown  # type: ignore
    except ModuleNotFoundError as exc:  # pragma: no cover - import guard
        raise DatasetLoadError(
            "The gdown package is required to download the GWAS dataset."
        ) from exc

    url = f"https://drive.google.com/uc?id={GOOGLE_DRIVE_FILE_ID}"
    output = str(destination)

    try:
        gdown.download(url=url, output=output, quiet=False, fuzzy=False)
    except Exception as exc:  # pragma: no cover - network failure guard
        raise DatasetLoadError(f"Failed to download GWAS dataset: {exc}") from exc

    if not destination.exists():
        raise DatasetLoadError("GWAS dataset download did not produce an output file.")


def search_traits(query: str, limit: int = 20) -> List[str]:
    """Return up to ``limit`` distinct mapped traits that contain ``query``."""
    if not query:
        return []

    df = ensure_dataset_loaded()

    traits_series = (
        df["MAPPED_TRAIT"].astype(str).str.contains(query, case=False, na=False)
    )

    matches = df.loc[traits_series, "MAPPED_TRAIT"].dropna().astype(str).unique()
    return list(matches[:limit])


def trait_records(trait_name: str, limit: int = 50) -> list[dict]:
    """Return up to ``limit`` study rows for the provided ``trait_name``."""
    if not trait_name:
        return []

    df = ensure_dataset_loaded()

    mask = df["MAPPED_TRAIT"].astype(str).str.casefold() == trait_name.casefold()
    subset = df.loc[mask].head(limit)

    if subset.empty:
        return []

    sanitized = subset.where(pd.notna(subset), None)
    return json.loads(sanitized.to_json(orient="records"))


def dataset_columns() -> list[str]:
    """Return the dataset column names in their stored order."""
    df = ensure_dataset_loaded()
    return list(df.columns)
