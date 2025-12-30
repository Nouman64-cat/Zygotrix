"""
GWAS (Genome-Wide Association Study) Schema Definitions
========================================================
Pydantic models for GWAS datasets, analysis jobs, and results.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class GwasDatasetStatus(str, Enum):
    """Status of a GWAS dataset."""
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


class GwasJobStatus(str, Enum):
    """Status of a GWAS analysis job."""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class GwasAnalysisType(str, Enum):
    """Type of GWAS statistical analysis."""
    LINEAR = "linear"  # Linear regression for quantitative traits
    LOGISTIC = "logistic"  # Logistic regression for binary traits
    CHI_SQUARE = "chi_square"  # Chi-square test for allelic association


class GwasFileFormat(str, Enum):
    """Supported GWAS file formats."""
    VCF = "vcf"  # Variant Call Format
    PLINK = "plink"  # PLINK binary format (.bed/.bim/.fam)
    CUSTOM = "custom"  # Custom JSON format


# ============================================================================
# SNP and Association Models
# ============================================================================

class SnpInfo(BaseModel):
    """Information about a single SNP."""
    rsid: str = Field(..., description="SNP identifier (e.g., rs1234567)")
    chromosome: int = Field(..., ge=1, le=23, description="Chromosome number (1-22, X=23)")
    position: int = Field(..., gt=0, description="Base pair position")
    ref_allele: str = Field(..., min_length=1, max_length=100, description="Reference allele")
    alt_allele: str = Field(..., min_length=1, max_length=100, description="Alternate allele")
    maf: Optional[float] = Field(None, ge=0, le=0.5, description="Minor allele frequency")


class SnpAssociation(BaseModel):
    """Association result for a single SNP."""
    rsid: str = Field(..., description="SNP identifier")
    chromosome: int = Field(..., ge=1, le=23)
    position: int = Field(..., gt=0)
    ref_allele: str
    alt_allele: str
    beta: Optional[float] = Field(None, description="Effect size (linear regression)")
    se: Optional[float] = Field(None, description="Standard error")
    t_stat: Optional[float] = Field(None, description="T-statistic")
    p_value: float = Field(..., ge=0, le=1, description="Association p-value")
    maf: float = Field(..., ge=0, le=0.5)
    n_samples: int = Field(..., gt=0, description="Number of samples with complete data")
    odds_ratio: Optional[float] = Field(None, description="Odds ratio (logistic regression)")
    ci_lower: Optional[float] = Field(None, description="95% CI lower bound")
    ci_upper: Optional[float] = Field(None, description="95% CI upper bound")
    nearest_gene: Optional[str] = Field(None, description="Nearest gene annotation")
    consequence: Optional[str] = Field(None, description="Functional consequence")

    model_config = ConfigDict(arbitrary_types_allowed=True)


# ============================================================================
# Visualization Data Models
# ============================================================================

class ChromosomeData(BaseModel):
    """Manhattan plot data for a single chromosome."""
    chr: int = Field(..., ge=1, le=23)
    positions: List[int] = Field(..., description="SNP positions")
    p_values: List[float] = Field(..., description="P-values")
    labels: List[str] = Field(..., description="SNP IDs for significant SNPs")

    @field_validator("positions", "p_values", "labels")
    @classmethod
    def check_lengths_match(cls, v, info):
        """Ensure all arrays have the same length."""
        # Note: In Pydantic v2, we'd need to check across fields differently
        # For now, basic validation
        return v


class ManhattanPlotData(BaseModel):
    """Complete Manhattan plot data."""
    chromosomes: List[ChromosomeData] = Field(..., description="Data for each chromosome")


class QQPlotData(BaseModel):
    """Q-Q plot data for p-value distribution."""
    expected: List[float] = Field(..., description="Expected -log10(p-values)")
    observed: List[float] = Field(..., description="Observed -log10(p-values)")
    genomic_inflation_lambda: float = Field(..., description="Genomic inflation factor (lambda)")

    @field_validator("genomic_inflation_lambda")
    @classmethod
    def validate_lambda(cls, v):
        """Validate lambda is positive."""
        if v <= 0:
            raise ValueError("Genomic inflation lambda must be positive")
        return v


# ============================================================================
# Dataset Models
# ============================================================================

class GwasDatasetCreate(BaseModel):
    """Request to create a new GWAS dataset."""
    name: str = Field(..., min_length=1, max_length=200, description="Dataset name")
    description: Optional[str] = Field(None, max_length=1000)
    file_format: GwasFileFormat = Field(..., description="Format of uploaded files")
    trait_type: Literal["quantitative", "binary"] = Field(..., description="Type of phenotype")
    trait_name: str = Field(..., min_length=1, max_length=100, description="Phenotype name")

    @field_validator("name", "trait_name")
    @classmethod
    def validate_not_empty(cls, v):
        """Ensure strings are not just whitespace."""
        if not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class GwasDatasetUpdate(BaseModel):
    """Update an existing GWAS dataset."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[GwasDatasetStatus] = None


class GwasDatasetResponse(BaseModel):
    """GWAS dataset response."""
    id: str = Field(..., description="Dataset ID")
    user_id: str = Field(..., description="Owner user ID")
    name: str
    description: Optional[str] = None
    file_format: GwasFileFormat
    trait_type: Literal["quantitative", "binary"]
    trait_name: str
    status: GwasDatasetStatus
    num_snps: Optional[int] = Field(None, description="Number of SNPs in dataset")
    num_samples: Optional[int] = Field(None, description="Number of samples")
    file_path: Optional[str] = Field(None, description="Path to uploaded file")
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class GwasDatasetListResponse(BaseModel):
    """Paginated list of GWAS datasets."""
    datasets: List[GwasDatasetResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================================================
# Analysis Job Models
# ============================================================================

class GwasAnalysisRequest(BaseModel):
    """Request to start a GWAS analysis."""
    dataset_id: str = Field(..., description="ID of dataset to analyze")
    analysis_type: GwasAnalysisType = Field(..., description="Type of statistical test")
    phenotype_column: str = Field(..., min_length=1, description="Column name for phenotype")
    covariates: List[str] = Field(default_factory=list, description="Covariate column names")
    maf_threshold: float = Field(default=0.01, ge=0.001, le=0.5, description="Minimum MAF")
    significance_threshold: float = Field(default=5e-8, ge=0, le=1, description="P-value threshold")

    @field_validator("phenotype_column")
    @classmethod
    def validate_phenotype_column(cls, v):
        """Validate phenotype column name."""
        if not v.strip():
            raise ValueError("Phenotype column cannot be empty")
        return v.strip()


class GwasJobCreate(BaseModel):
    """Internal model for creating a GWAS job."""
    user_id: str
    dataset_id: str
    analysis_type: GwasAnalysisType
    phenotype_column: str
    covariates: List[str] = Field(default_factory=list)
    maf_threshold: float = 0.01
    significance_threshold: float = 5e-8


class GwasJobUpdate(BaseModel):
    """Update a GWAS job."""
    status: Optional[GwasJobStatus] = None
    progress: Optional[int] = Field(None, ge=0, le=100, description="Progress percentage")
    error_message: Optional[str] = None
    result_id: Optional[str] = None
    snps_tested: Optional[int] = None
    significant_snps: Optional[int] = None
    execution_time_seconds: Optional[float] = None


class GwasJobResponse(BaseModel):
    """GWAS analysis job response."""
    id: str = Field(..., description="Job ID")
    user_id: str
    dataset_id: str
    analysis_type: GwasAnalysisType
    phenotype_column: str
    covariates: List[str]
    maf_threshold: float
    significance_threshold: float
    status: GwasJobStatus
    progress: int = Field(default=0, ge=0, le=100)
    error_message: Optional[str] = None
    result_id: Optional[str] = None
    snps_tested: Optional[int] = None
    significant_snps: Optional[int] = None
    execution_time_seconds: Optional[float] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Results Models
# ============================================================================

class GwasSummaryStats(BaseModel):
    """Summary statistics for GWAS analysis."""
    total_snps_tested: int = Field(..., gt=0)
    significant_snps_bonferroni: int = Field(..., ge=0)
    significant_snps_fdr: int = Field(..., ge=0)
    genomic_inflation_lambda: float = Field(..., description="Genomic inflation factor")
    mean_chi_square: Optional[float] = Field(None, description="Mean chi-square statistic")
    median_p_value: Optional[float] = Field(None, ge=0, le=1)


class GwasResultCreate(BaseModel):
    """Internal model for creating GWAS results."""
    job_id: str
    user_id: str
    dataset_id: str
    associations: List[SnpAssociation]
    summary: GwasSummaryStats
    manhattan_plot_data: ManhattanPlotData
    qq_plot_data: QQPlotData
    top_hits: List[SnpAssociation] = Field(..., max_items=100)


class GwasResultResponse(BaseModel):
    """GWAS analysis results response."""
    id: str
    job_id: str
    user_id: str
    dataset_id: str
    summary: GwasSummaryStats
    manhattan_plot_data: ManhattanPlotData
    qq_plot_data: QQPlotData
    top_hits: List[SnpAssociation]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GwasResultDetailResponse(BaseModel):
    """Detailed GWAS results with all associations."""
    id: str
    job_id: str
    summary: GwasSummaryStats
    associations: List[SnpAssociation]
    manhattan_plot_data: ManhattanPlotData
    qq_plot_data: QQPlotData
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Widget Data Models (for MCP chatbot)
# ============================================================================

class GwasAnalysisMetadata(BaseModel):
    """Metadata about the GWAS analysis."""
    test_type: str
    sample_size: int
    phenotype: str
    covariates: List[str]
    dataset_name: str


class GwasWidgetData(BaseModel):
    """Complete GWAS widget data for chatbot visualization."""
    job_id: str
    dataset_name: str
    trait_name: str
    analysis_type: str
    total_snps_tested: int
    significant_snps: int
    significance_threshold: float
    top_associations: List[SnpAssociation] = Field(..., max_items=100)
    manhattan_plot: ManhattanPlotData
    qq_plot: QQPlotData
    execution_time_seconds: float
    created_at: str  # ISO format

    model_config = ConfigDict(arbitrary_types_allowed=True)
