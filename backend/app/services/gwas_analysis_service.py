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
            dataset = self.dataset_repo.find_by_id(dataset_id)
            if not dataset:
                raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")

            if dataset.user_id != user_id:
                raise HTTPException(status_code=403, detail="Unauthorized access to dataset")

            # Step 2: Prepare data for C++ engine
            snps, samples = self._prepare_analysis_data(
                dataset_id=dataset_id,
                phenotype_column=phenotype_column,
                covariates=covariates or [],
            )

            # Step 3: Call C++ GWAS engine
            engine_response = run_gwas_analysis(
                snps=snps,
                samples=samples,
                analysis_type=analysis_type,
                maf_threshold=maf_threshold,
                num_threads=num_threads,
                timeout=600,  # 10 minutes timeout
            )

            # Step 4: Parse association results
            associations = self._parse_association_results(engine_response.get("results", []))

            # Step 5: Generate visualization data
            manhattan_data = generate_manhattan_data(associations)
            qq_data = generate_qq_data(associations)
            top_associations = get_top_associations(associations, limit=100, p_threshold=1e-5)
            summary_stats = generate_summary_statistics(associations)

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

            return result

        except HTTPException:
            # Re-raise HTTP exceptions
            raise

        except Exception as e:
            # Update job status to FAILED
            self.job_repo.update_status(
                job_id=job_id,
                status=GwasJobStatus.FAILED,
                error_message=str(e),
            )
            raise HTTPException(
                status_code=500,
                detail=f"GWAS analysis failed: {str(e)}",
            )

    def _prepare_analysis_data(
        self,
        dataset_id: str,
        phenotype_column: str,
        covariates: List[str],
    ) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Prepare SNP and sample data for C++ engine.

        This is a placeholder implementation. In production, this would:
        1. Load genotype data from file storage (VCF/PLINK)
        2. Load phenotype data from CSV or database
        3. Match samples across genotype and phenotype files
        4. Filter missing data

        Args:
            dataset_id: Dataset identifier
            phenotype_column: Phenotype column name
            covariates: List of covariate names

        Returns:
            Tuple of (snps, samples) in C++ engine format
        """
        # TODO: Implement actual data loading from file storage
        # For now, return placeholder data structure

        # This would typically:
        # 1. Read VCF/PLINK files from backend/data/gwas_datasets/{user_id}/{dataset_id}/
        # 2. Parse genotype matrix
        # 3. Load phenotype CSV
        # 4. Match samples and filter missing data

        # Placeholder SNP data
        snps = [
            {
                "rsid": f"rs{i}",
                "chromosome": (i % 22) + 1,
                "position": i * 1000,
                "ref_allele": "A",
                "alt_allele": "G",
            }
            for i in range(1, 11)  # 10 SNPs for demo
        ]

        # Placeholder sample data
        samples = [
            {
                "sample_id": f"sample_{i}",
                "phenotype": 10.0 + i * 0.5,
                "genotypes": [i % 3 for _ in range(10)],  # 0, 1, 2 genotypes
                "covariates": [],
            }
            for i in range(100)  # 100 samples for demo
        ]

        return snps, samples

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
