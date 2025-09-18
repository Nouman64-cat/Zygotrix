"""Utility helpers for probability distributions and sampling."""

from __future__ import annotations

import random
from typing import Dict, Iterable, Mapping, MutableMapping, Sequence


def normalize_probabilities(distribution: Mapping[str, float]) -> Dict[str, float]:
    """Normalize probability weights so they sum to 1.0."""

    total = sum(distribution.values())
    if total == 0:
        return {key: 0.0 for key in distribution}
    return {key: value / total for key, value in distribution.items()}


def to_percentage_distribution(distribution: Mapping[str, float]) -> Dict[str, float]:
    """Convert a probability distribution to percentages (0-100)."""

    return {key: value * 100.0 for key, value in normalize_probabilities(distribution).items()}


def sample_from_distribution(
    distribution: Mapping[str, float], rng: random.Random | None = None
) -> str:
    """Randomly sample a key from a probability distribution."""

    normalized = normalize_probabilities(distribution)
    cumulative = 0.0
    threshold = (rng or random).random()
    for key, probability in normalized.items():
        cumulative += probability
        if threshold <= cumulative:
            return key
    # Fallback for floating point rounding
    return next(iter(normalized))


__all__ = [
    "normalize_probabilities",
    "to_percentage_distribution",
    "sample_from_distribution",
]
