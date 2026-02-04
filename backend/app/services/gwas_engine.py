"""
GWAS C++ Engine Interface
==========================
Provides interface to the C++ GWAS statistical analysis engine.
Follows the same subprocess pattern as cpp_engine.py for consistency.
Includes a Python fallback for environments without the C++ binary.
"""

from __future__ import annotations

import json
import os
import math
import subprocess
from pathlib import Path
from typing import Any, Dict, List

from fastapi import HTTPException

from ..config import get_settings
from ..schema.gwas import GwasAnalysisType


from app.services.aws_worker_client import get_aws_worker

def run_gwas_analysis(
    payload: Dict[str, Any],
    timeout: int = 600,
) -> Dict[str, Any]:
    """
    Run GWAS analysis via AWS Lambda (gwas_vcf action).
    """
    try:
        print(f"INFO: Engine - Invoking AWS Lambda (gwas_vcf) for s3_key: {payload.get('s3_key')}")
        worker = get_aws_worker()
        
        # Invoke Lambda with the pre-constructed cloud payload
        # Action is now 'gwas_vcf' as per Phase 1 requirements
        response = worker.invoke(action="gwas_vcf", payload=payload)
        
        print("INFO: Engine - AWS Lambda execution completed successfully")
        return response

    except Exception as e:
        print(f"ERROR: Engine - Critical failure: {e}")
        raise HTTPException(status_code=500, detail=f"GWAS analysis failed: {str(e)}")


def _python_linear_regression(
    snps: List[Dict[str, Any]],
    samples: List[Dict[str, Any]],
    analysis_type: GwasAnalysisType
) -> Dict[str, Any]:
    """
    Pure Python implementation of linear regression GWAS for fallback.
    """
    results = []
    
    # Extract phenotypes
    y = [s["phenotype"] for s in samples]
    n = len(y)
    
    if n < 3:
        return {"success": False, "error": "Not enough samples for analysis", "results": []}

    mean_y = sum(y) / n
    var_y = sum((yi - mean_y)**2 for yi in y)
    
    if var_y == 0:
        return {"success": False, "error": "Phenotype variance is zero", "results": []}
    
    snps_tested = 0
    snps_filtered = 0

    for i, snp in enumerate(snps):
        # Extract genotypes for this SNP across samples
        try:
            x = [s["genotypes"][i] for s in samples]
        except IndexError:
            snps_filtered += 1
            continue
            
        # Filter missing (-1)
        valid_data = [(xv, yv) for xv, yv in zip(x, y) if xv != -1]
        
        if len(valid_data) < 3:
            snps_filtered += 1
            continue
            
        x_clean = [v[0] for v in valid_data]
        y_clean = [v[1] for v in valid_data]
        n_clean = len(x_clean)
        
        # Calculate MAF
        maf = sum(x_clean) / (2 * n_clean)
        maf = min(maf, 1.0 - maf)
        if maf < 0.01 or maf > 0.99:
             snps_filtered += 1
             # We might want to keep it but mark as filtered? usually we skip.
             snps_filtered += 1
             # Skip SNPs with low MAF
             continue
        
        mean_x = sum(x_clean) / n_clean
        mean_y_clean = sum(y_clean) / n_clean
        
        # Calculate slope (beta)
        numerator = sum((x_clean[k] - mean_x) * (y_clean[k] - mean_y_clean) for k in range(n_clean))
        denominator = sum((x_clean[k] - mean_x)**2 for k in range(n_clean))
        
        if denominator == 0:
            snps_filtered += 1
            continue
            
        beta = numerator / denominator
        
        # Intercept (alpha)
        alpha = mean_y_clean - beta * mean_x
        
        # Standard error
        residuals = [y_clean[k] - (alpha + beta * x_clean[k]) for k in range(n_clean)]
        rss = sum(r**2 for r in residuals)
        sigma2 = rss / (n_clean - 2) if n_clean > 2 else 0
        se = math.sqrt(sigma2 / denominator) if sigma2 > 0 else 0
        
        # t-stat
        t_stat = beta / se if se > 0 else 0
        
        # Approximate p-value (using rough heuristic for t-distribution tail)
        # For large degrees of freedom, t approaches normal.
        # This is strictly a fallback approximation.
        try:
             # simple normal approx
             # p_value = 2 * (1 - normal_cdf(abs(t)))
             # Approximation for normal cdf
             def error_function(x):
                 # constants
                 a1 =  0.254829592
                 a2 = -0.284496736
                 a3 =  1.421413741
                 a4 = -1.453152027
                 a5 =  1.061405429
                 p  =  0.3275911
                 
                 sign = 1
                 if x < 0:
                     sign = -1
                 x = abs(x)
                 
                 t = 1.0/(1.0 + p*x)
                 y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*math.exp(-x*x)
                 return sign*y
             
             p_value = 1.0 - error_function(abs(t_stat)/math.sqrt(2.0))
        except:
             p_value = 1.0
             
        results.append({
            "rsid": snp.get("rsid", ""),
            "chromosome": snp.get("chromosome", 1),
            "position": snp.get("position", 0),
            "ref_allele": snp.get("ref_allele", ""),
            "alt_allele": snp.get("alt_allele", ""),
            "beta": beta,
            "se": se,
            "t_stat": t_stat,
            "p_value": p_value if p_value > 1e-30 else 1e-30,
            "maf": maf,
            "n_samples": n_clean
        })
        snps_tested += 1
        
    return {
        "success": True,
        "results": results,
        "snps_tested": snps_tested,
        "snps_filtered": snps_filtered,
        "execution_time_ms": 100, # Mock time
    }
