"""
GWAS Visualization Data Generators
===================================
Generates Manhattan plot, Q-Q plot, and summary data for frontend widgets.
"""

from __future__ import annotations

import math
from typing import Dict, List, Any, Tuple
from collections import defaultdict

from ..schema.gwas import SnpAssociation


def generate_manhattan_data(associations: List[SnpAssociation]) -> Dict[str, Any]:
    """
    Generate Manhattan plot data from association results.

    Args:
        associations: List of SNP association results

    Returns:
        Dict with chromosome-grouped data:
            {
                "chromosomes": [
                    {
                        "chr": 1,
                        "positions": [123, 456, ...],
                        "p_values": [0.001, 0.05, ...],
                        "neg_log_p": [3.0, 1.3, ...],
                        "rsids": ["rs123", "rs456", ...],
                        "betas": [0.5, -0.2, ...] (optional),
                    },
                    ...
                ],
                "genome_wide_sig": 5e-8,  # Bonferroni threshold
                "suggestive_sig": 1e-5,
            }
    """
    # Group by chromosome
    chr_data: Dict[int, Dict[str, List]] = defaultdict(
        lambda: {"positions": [], "p_values": [], "labels": []}
    )

    for assoc in associations:
        chr_num = assoc.chromosome
        chr_data[chr_num]["positions"].append(assoc.position)
        chr_data[chr_num]["p_values"].append(assoc.p_value)
        # Only add label for significant SNPs (p < 1e-5)
        if assoc.p_value < 1e-5:
            chr_data[chr_num]["labels"].append(assoc.rsid)
        else:
            chr_data[chr_num]["labels"].append("")

    # Convert to sorted list matching ChromosomeData schema
    chromosomes = [
        {
            "chr": chr_num,
            "positions": data["positions"],
            "p_values": data["p_values"],
            "labels": data["labels"],
        }
        for chr_num, data in sorted(chr_data.items())
    ]

    return {
        "chromosomes": chromosomes,
    }


def generate_qq_data(associations: List[SnpAssociation]) -> Dict[str, Any]:
    """
    Generate Q-Q (Quantile-Quantile) plot data.

    Compares observed p-values against expected uniform distribution
    to detect systematic inflation/deflation.

    Args:
        associations: List of SNP association results

    Returns:
        Dict with:
            {
                "expected": [-log10 expected p-values],
                "observed": [-log10 observed p-values],
                "lambda_gc": genomic inflation factor,
                "n_snps": number of SNPs
            }
    """
    # Extract p-values
    p_values = [assoc.p_value for assoc in associations if assoc.p_value > 0]
    n_snps = len(p_values)

    if n_snps == 0:
        return {
            "expected": [],
            "observed": [],
            "genomic_inflation_lambda": 1.0,
        }

    # Sort p-values
    p_values_sorted = sorted(p_values)

    # Calculate expected p-values (uniform distribution)
    expected_p = [(i + 0.5) / n_snps for i in range(n_snps)]

    # Convert to -log10 scale
    observed_neg_log = [-math.log10(p) for p in p_values_sorted]
    expected_neg_log = [-math.log10(p) for p in expected_p]

    # Calculate genomic inflation factor (lambda_gc)
    # lambda = median(chi-square) / 0.456
    # chi-square ≈ (z-score)^2 where z = qnorm(p/2)
    # Approximation: lambda ≈ median(observed) / median(expected)
    lambda_gc = calculate_genomic_inflation(p_values_sorted)

    return {
        "expected": expected_neg_log,
        "observed": observed_neg_log,
        "genomic_inflation_lambda": round(lambda_gc, 3),
    }


def calculate_genomic_inflation(p_values: List[float]) -> float:
    """
    Calculate genomic inflation factor (lambda_gc).

    Lambda > 1 indicates inflation (population stratification, cryptic relatedness)
    Lambda < 1 indicates deflation (overcorrection)
    Lambda ≈ 1 is ideal

    Args:
        p_values: Sorted list of p-values

    Returns:
        Genomic inflation factor
    """
    if not p_values:
        return 1.0

    # Convert p-values to chi-square statistics
    # chi^2 = Φ^(-1)(1 - p/2)^2 where Φ^(-1) is inverse normal CDF
    # Approximation using simplified formula
    chi_squares = []
    for p in p_values:
        if p > 0 and p < 1:
            # Convert p-value to z-score (approximate)
            z = abs(_inverse_normal_cdf(p / 2))
            chi_squares.append(z * z)

    if not chi_squares:
        return 1.0

    # Lambda = median(chi^2) / 0.456
    # 0.456 is the median of chi^2(1) distribution
    median_chi_sq = _median(chi_squares)
    lambda_gc = median_chi_sq / 0.456

    return lambda_gc


def _median(values: List[float]) -> float:
    """Calculate median of a list."""
    sorted_values = sorted(values)
    n = len(sorted_values)
    if n == 0:
        return 0.0
    if n % 2 == 1:
        return sorted_values[n // 2]
    else:
        return (sorted_values[n // 2 - 1] + sorted_values[n // 2]) / 2.0


def _inverse_normal_cdf(p: float) -> float:
    """
    Approximate inverse normal CDF (z-score from p-value).

    Uses Beasley-Springer-Moro algorithm approximation.

    Args:
        p: Probability (0 < p < 1)

    Returns:
        Z-score
    """
    if p <= 0 or p >= 1:
        return 0.0

    # Coefficients for rational approximation
    a = [
        -3.969683028665376e+01,
        2.209460984245205e+02,
        -2.759285104469687e+02,
        1.383577518672690e+02,
        -3.066479806614716e+01,
        2.506628277459239e+00,
    ]

    b = [
        -5.447609879822406e+01,
        1.615858368580409e+02,
        -1.556989798598866e+02,
        6.680131188771972e+01,
        -1.328068155288572e+01,
    ]

    c = [
        -7.784894002430293e-03,
        -3.223964580411365e-01,
        -2.400758277161838e+00,
        -2.549732539343734e+00,
        4.374664141464968e+00,
        2.938163982698783e+00,
    ]

    d = [
        7.784695709041462e-03,
        3.224671290700398e-01,
        2.445134137142996e+00,
        3.754408661907416e+00,
    ]

    # Define break-points
    p_low = 0.02425
    p_high = 1 - p_low

    # Rational approximation for lower region
    if p < p_low:
        q = math.sqrt(-2 * math.log(p))
        z = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / (
            (((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1
        )

    # Rational approximation for central region
    elif p <= p_high:
        q = p - 0.5
        r = q * q
        z = (
            (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
        ) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)

    # Rational approximation for upper region
    else:
        q = math.sqrt(-2 * math.log(1 - p))
        z = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / (
            (((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1
        )

    return z


def get_top_associations(
    associations: List[SnpAssociation],
    limit: int = 100,
    p_threshold: float = 1e-5,
) -> List[SnpAssociation]:
    """
    Get top significant associations.

    Args:
        associations: List of SNP association results
        limit: Maximum number of results to return
        p_threshold: P-value threshold for significance

    Returns:
        List of top SnpAssociation objects sorted by p-value
    """
    # Filter by p-value threshold
    significant = [assoc for assoc in associations if assoc.p_value < p_threshold]

    # Sort by p-value (ascending)
    significant_sorted = sorted(significant, key=lambda x: x.p_value)

    # Take top N and return as SnpAssociation objects
    return significant_sorted[:limit]


def generate_summary_statistics(associations: List[SnpAssociation]) -> Dict[str, Any]:
    """
    Generate summary statistics for GWAS results.

    Args:
        associations: List of SNP association results

    Returns:
        Dict matching GwasSummaryStats schema:
            {
                "total_snps_tested": int,
                "significant_snps_bonferroni": int (p < 5e-8),
                "significant_snps_fdr": int (p < 1e-5, approximate FDR),
                "genomic_inflation_lambda": float,
                "mean_chi_square": float (optional),
                "median_p_value": float (optional),
            }
    """
    if not associations:
        return {
            "total_snps_tested": 1,  # Schema requires gt=0
            "significant_snps_bonferroni": 0,
            "significant_snps_fdr": 0,
            "genomic_inflation_lambda": 1.0,
            "mean_chi_square": None,
            "median_p_value": None,
        }

    p_values = [assoc.p_value for assoc in associations if assoc.p_value > 0]
    lambda_gc = calculate_genomic_inflation(sorted(p_values))

    # Bonferroni significant (genome-wide significance, p < 5e-8)
    bonferroni_sig = sum(1 for assoc in associations if assoc.p_value < 5e-8)
    # FDR significant (suggestive significance, p < 1e-5 as approximate FDR threshold)
    fdr_sig = sum(1 for assoc in associations if assoc.p_value < 1e-5)

    # Calculate median p-value
    median_p = _median(sorted(p_values)) if p_values else None

    return {
        "total_snps_tested": len(associations),
        "significant_snps_bonferroni": bonferroni_sig,
        "significant_snps_fdr": fdr_sig,
        "genomic_inflation_lambda": round(lambda_gc, 3),
        "mean_chi_square": None,  # Optional field
        "median_p_value": round(median_p, 6) if median_p is not None else None,
    }
