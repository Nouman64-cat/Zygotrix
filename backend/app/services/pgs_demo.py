from __future__ import annotations

import math
from typing import Dict, List, Tuple

from fastapi import HTTPException

from ..schema.pgs_demo import PGSDemoRequest, PGSDemoResponse


def _standard_normal_cdf(z: float) -> float:
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def compute_pgs_demo(request: PGSDemoRequest) -> PGSDemoResponse:
    if len(request.weights) > 500:
        raise HTTPException(
            status_code=422,
            detail="A maximum of 500 SNP weights are supported in the demo.",
        )

    genotype_map = {key.lower(): float(value) for key, value in request.genotype_calls.items()}

    used_snps: List[str] = []
    missing_snps: List[str] = []
    warnings: List[str] = []

    raw_score = 0.0
    for weight_entry in request.weights:
        rsid_key = weight_entry.rsid.lower()
        dosage = genotype_map.get(rsid_key)
        if dosage is None:
            missing_snps.append(weight_entry.rsid)
            continue
        if not (0.0 <= dosage <= 2.0):
            warnings.append(
                f"Dosage {dosage} for {weight_entry.rsid} is outside the 0-2 range; clamping."
            )
            dosage = max(0.0, min(2.0, dosage))
        raw_score += weight_entry.weight * dosage
        used_snps.append(weight_entry.rsid)

    if not used_snps:
        raise HTTPException(
            status_code=422,
            detail="None of the supplied SNP weights matched the provided genotypes.",
        )

    reference_mean = request.reference_mean if request.reference_mean is not None else 0.0
    reference_sd = request.reference_sd if request.reference_sd is not None else 1.0
    if reference_sd <= 0:
        warnings.append("Reference SD must be positive; defaulting to 1.0.")
        reference_sd = 1.0

    z_score = (raw_score - reference_mean) / reference_sd
    percentile = _standard_normal_cdf(z_score) * 100.0

    return PGSDemoResponse(
        raw_score=raw_score,
        z_score=z_score,
        percentile=percentile,
        used_snps=used_snps,
        missing_snps=missing_snps,
        warnings=warnings,
    )

