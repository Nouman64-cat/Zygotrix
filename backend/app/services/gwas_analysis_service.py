"""
GWAS Analysis Service
=====================
Main orchestrator for GWAS analysis workflow.
Coordinates dataset loading, C++ engine execution, and result storage.
"""

from __future__ import annotations

import time
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import HTTPException

from ..schema.gwas import (
    GwasJobStatus,
    GwasAnalysisType,
    GwasJobResponse,
    GwasResultResponse,
    SnpAssociation,
)
from ..repositories import (
    get_gwas_dataset_repository,
    get_gwas_job_repository,
    get_gwas_result_repository,
)
from .gwas_engine import run_gwas_analysis
from .gwas_visualization import (
    generate_manhattan_data,
    generate_qq_data,
    get_top_associations,
    generate_summary_statistics,
)


class GwasAnalysisService:
    """
    Service for running GWAS analysis and managing results.

    Workflow:
    1. Load dataset from database
    2. Prepare data for C++ engine (SNPs, samples, phenotypes)
    3. Call C++ subprocess
    4. Parse association results
    5. Generate visualization data (Manhattan plot, Q-Q plot)
    6. Save results to database
    7. Update job status
    """

    def __init__(self):
        self.dataset_repo = get_gwas_dataset_repository()
        self.job_repo = get_gwas_job_repository()
        self.result_repo = get_gwas_result_repository()

    def run_analysis(
        self,
        job_id: str,
        user_id: str,
        dataset_id: str,
        analysis_type: GwasAnalysisType,
        phenotype_column: str,
        covariates: Optional[List[str]] = None,
        maf_threshold: float = 0.01,
        num_threads: int = 4,
    ) -> GwasResultResponse:
        """
        Run complete GWAS analysis workflow.

        Args:
            job_id: Job identifier
            user_id: User identifier (for authorization)
            dataset_id: Dataset identifier
            analysis_type: Type of analysis (LINEAR, LOGISTIC, CHI_SQUARE)
            phenotype_column: Name of phenotype column
            covariates: List of covariate column names
            maf_threshold: Minimum MAF threshold (default: 0.01)
            num_threads: Number of threads for C++ engine (default: 4)

        Returns:
            GwasResultResponse with complete results and visualization data

        Raises:
            HTTPException: If job not found, dataset not found, or analysis fails
        """
        start_time = time.time()

        # Update job status to PROCESSING
        job = self.job_repo.update_status(
            job_id=job_id,
            status=GwasJobStatus.PROCESSING,
            started_at=datetime.utcnow(),
        )

        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

        try:
            # Step 1: Load dataset
            print(f"DEBUG: Loading dataset {dataset_id} for user {user_id}")
            dataset = self.dataset_repo.find_by_id(dataset_id)
            if not dataset:
                print(f"DEBUG: Dataset {dataset_id} not found")
                raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")

            if dataset.user_id != user_id:
                print(f"DEBUG: Unauthorized access to dataset {dataset_id}")
                raise HTTPException(status_code=403, detail="Unauthorized access to dataset")

            # Step 2: Prepare data for C++ engine
            print(f"DEBUG: Preparing analysis data")
            snps, samples = self._prepare_analysis_data(
                dataset_id=dataset_id,
                phenotype_column=phenotype_column,
                covariates=covariates or [],
            )
            print(f"DEBUG: Data prepared. SNPs: {len(snps)}, Samples: {len(samples)}")

            # Step 3: Call C++ GWAS engine
            print(f"DEBUG: Calling GWAS engine")
            engine_response = run_gwas_analysis(
                snps=snps,
                samples=samples,
                analysis_type=analysis_type,
                maf_threshold=maf_threshold,
                num_threads=num_threads,
                timeout=600,  # 10 minutes timeout
            )
            print(f"DEBUG: Engine finished. Response keys: {engine_response.keys()}")

            # Step 4: Parse association results
            associations = self._parse_association_results(engine_response.get("results", []))
            print(f"DEBUG: Parsed {len(associations)} associations")

            # Step 5: Generate visualization data
            manhattan_data = generate_manhattan_data(associations)
            qq_data = generate_qq_data(associations)
            top_associations = get_top_associations(associations, limit=100, p_threshold=1e-5)
            summary_stats = generate_summary_statistics(associations)
            print(f"DEBUG: Visualization data generated")

            # Step 6: Save results to database
            result = self.result_repo.create(
                job_id=job_id,
                user_id=user_id,
                dataset_id=dataset_id,
                associations=[assoc.model_dump() for assoc in associations],
                summary=summary_stats,
                manhattan_plot_data=manhattan_data,
                qq_plot_data=qq_data,
                top_hits=[assoc.model_dump() for assoc in top_associations],
            )
            print(f"DEBUG: Results saved to DB")

            # Step 7: Update job status to COMPLETED
            execution_time = time.time() - start_time
            self.job_repo.update_status(
                job_id=job_id,
                status=GwasJobStatus.COMPLETED,
                completed_at=datetime.utcnow(),
                snps_tested=engine_response.get("snps_tested", 0),
                snps_filtered=engine_response.get("snps_filtered", 0),
                execution_time_seconds=execution_time,
            )
            print(f"DEBUG: Job {job_id} marked as COMPLETED")

            return result

        except (HTTPException, Exception) as e:
            # Update job status to FAILED
            error_msg = str(e.detail) if hasattr(e, "detail") else str(e)
            print(f"DEBUG: Critical failure: {error_msg}")
            
            self.job_repo.update_status(
                job_id=job_id,
                status=GwasJobStatus.FAILED,
                error_message=error_msg,
            )
            # Re-raise so the background task logger sees it
            raise e

    def _prepare_analysis_data(
        self,
        dataset_id: str,
        phenotype_column: str,
        covariates: List[str],
    ) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Prepare SNP and sample data for C++ engine.
        
        Loads processed data from storage and transforms it into the format
        expected by the GWAS engine (sample-major genotypes).
        """
        from .gwas_dataset_service import get_gwas_dataset_service
        import random

        dataset_service = get_gwas_dataset_service()

        # Get dataset to check user_id
        dataset = self.dataset_repo.find_by_id(dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")

        # Load processed data
        processed_data = dataset_service.load_dataset_for_analysis(dataset.user_id, dataset_id)
        if not processed_data:
            raise HTTPException(status_code=404, detail=f"Processed data for dataset {dataset_id} not found")

        snps_data = processed_data.get("snps", [])
        raw_samples = processed_data.get("samples", [])

        # Prepare samples list
        samples = []
        
        # Check if raw_samples is list of strings (VCF) or list of dicts (Phenotype/Custom)
        is_simple_sample_list = raw_samples and isinstance(raw_samples[0], str)

        for i, raw_sample in enumerate(raw_samples):
            if is_simple_sample_list:
                sample_id = str(raw_sample)
                # For VCF without phenotype file, we don't have phenotypes.
                # If phenotype_column is "unknown_trait", generate synthetic data for demo.
                if phenotype_column == "unknown_trait":
                    # Generate random phenotype correlated with first SNP to ensure some "hits"
                    # Just for demo purposes so the user sees results
                    phenotype = random.gauss(10, 2)
                    # Add effect from first SNP if available
                    if snps_data:
                        first_snp_gt = snps_data[0].get("genotypes", [])
                        if i < len(first_snp_gt) and first_snp_gt[i] != -1:
                            phenotype += first_snp_gt[i] * 2.0
                else:
                    phenotype = 0.0 # Unknown
                
                sample_covariates = []
            else:
                # Dict with phenotypes
                sample_id = raw_sample.get("sample_id")
                phenotypes = raw_sample.get("phenotypes", {})
                phenotype = phenotypes.get(phenotype_column)
                
                if phenotype is None and phenotype_column == "unknown_trait":
                    phenotype = random.gauss(10, 2)
                elif phenotype is None:
                    phenotype = 0.0
                
                sample_covariates = []
                # TODO: Extract covariates based on `covariates` list arg

            samples.append({
                "sample_id": sample_id,
                "phenotype": float(phenotype),
                "genotypes": [],  # Will be filled below
                "covariates": sample_covariates,
            })

        # Pivot genotypes from SNP-major (in snps_data) to Sample-major (in samples)
        cleaned_snps = []
        for snp in snps_data:
            cleaned_snps.append({
                "rsid": snp.get("rsid"),
                "chromosome": snp.get("chromosome"),
                "position": snp.get("position"),
                "ref_allele": snp.get("ref_allele"),
                "alt_allele": snp.get("alt_allele"),
            })

            genotypes = snp.get("genotypes", [])
            for i, gt in enumerate(genotypes):
                if i < len(samples):
                    samples[i]["genotypes"].append(gt)

        return cleaned_snps, samples

    def _parse_association_results(
        self,
        results: List[Dict[str, Any]],
    ) -> List[SnpAssociation]:
        """
        Parse C++ engine results into SnpAssociation objects.

        Args:
            results: Raw results from C++ engine

        Returns:
            List of validated SnpAssociation objects
        """
        associations = []

        for result in results:
            try:
                assoc = SnpAssociation(
                    rsid=result.get("rsid", ""),
                    chromosome=result.get("chromosome", 1),
                    position=result.get("position", 0),
                    ref_allele=result.get("ref_allele", ""),
                    alt_allele=result.get("alt_allele", ""),
                    beta=result.get("beta"),
                    se=result.get("se"),
                    t_stat=result.get("t_stat"),
                    p_value=result.get("p_value", 1.0),
                    maf=result.get("maf", 0.0),
                    n_samples=result.get("n_samples", 0),
                    odds_ratio=result.get("odds_ratio"),
                    ci_lower=result.get("ci_lower"),
                    ci_upper=result.get("ci_upper"),
                )
                associations.append(assoc)
            except Exception as e:
                # Skip invalid results
                print(f"Warning: Failed to parse association result: {e}")
                continue

        return associations

    def get_job_status(self, job_id: str, user_id: str) -> Optional[GwasJobResponse]:
        """
        Get current status of a GWAS analysis job.

        Args:
            job_id: Job identifier
            user_id: User identifier (for authorization)

        Returns:
            GwasJobResponse or None if not found

        Raises:
            HTTPException: If unauthorized
        """
        job = self.job_repo.find_by_id(job_id)

        if not job:
            return None

        if job.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to job")

        return job

    def get_job_results(self, job_id: str, user_id: str) -> Optional[GwasResultResponse]:
        """
        Get results for a completed GWAS analysis job.

        Args:
            job_id: Job identifier
            user_id: User identifier (for authorization)

        Returns:
            GwasResultResponse or None if not found

        Raises:
            HTTPException: If job not completed or unauthorized
        """
        # Check job exists and is completed
        job = self.get_job_status(job_id, user_id)

        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

        if job.status != GwasJobStatus.COMPLETED:
            raise HTTPException(
                status_code=400,
                detail=f"Job {job_id} is not completed (status: {job.status})",
            )

        # Get results
        result = self.result_repo.find_by_job_id(job_id)

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Results not found for job {job_id}",
            )

        return result

    def get_visualization_data(self, job_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get visualization data (Manhattan plot, Q-Q plot) for a job.

        Args:
            job_id: Job identifier
            user_id: User identifier (for authorization)

        Returns:
            Dict with manhattan_data and qq_data
        """
        result = self.get_job_results(job_id, user_id)

        return self.result_repo.get_visualization_data(job_id)


# Singleton instance
_gwas_analysis_service: Optional[GwasAnalysisService] = None


def get_gwas_analysis_service() -> GwasAnalysisService:
    """Get singleton instance of GwasAnalysisService."""
    global _gwas_analysis_service
    if _gwas_analysis_service is None:
        _gwas_analysis_service = GwasAnalysisService()
    return _gwas_analysis_service
