# GWAS Analysis Implementation Plan

**Project**: Zygotrix
**Feature**: Genome-Wide Association Study (GWAS) Analysis
**Date**: 2025-12-30
**Status**: Planning

---

## Executive Summary

This document outlines the implementation plan for adding GWAS (Genome-Wide Association Study) analysis capabilities to Zygotrix. GWAS will enable users to identify statistical associations between genetic variants (SNPs) and phenotypic traits across populations.

**Key Decision**: Implement using **hybrid Python + C++ architecture** following the existing pattern of `zyg_cross_cli`, `zyg_protein_cli`, and `zyg_parallel_dna_cli`.

---

## Table of Contents

1. [Background](#background)
2. [Technical Architecture](#technical-architecture)
3. [Implementation Phases](#implementation-phases)
4. [Database Schema](#database-schema)
5. [C++ Engine Design](#c-engine-design)
6. [Python Service Layer](#python-service-layer)
7. [API Endpoints](#api-endpoints)
8. [Frontend Integration](#frontend-integration)
9. [Testing Strategy](#testing-strategy)
10. [Performance Considerations](#performance-considerations)
11. [Security & Validation](#security--validation)
12. [Timeline & Milestones](#timeline--milestones)

---

## Background

### What is GWAS?

Genome-Wide Association Studies (GWAS) identify associations between genetic variants (typically SNPs - Single Nucleotide Polymorphisms) and phenotypic traits by testing millions of variants across the genome for statistical significance.

### Core Statistical Methods

1. **Linear Regression** - Quantitative traits (height, BMI, cholesterol levels)
2. **Logistic Regression** - Binary traits (disease presence/absence)
3. **Chi-Square Test** - Genotype-phenotype association (1 d.f.)
4. **Mixed Models** - Population structure correction (REGENIE, GEMMA, fastGWA-GLMM)

### Why C++ Implementation?

**Performance Requirements**:
- GWAS tests millions of SNPs (variants) against phenotypes
- Optimized implementations are **20-200x faster** than naive approaches
- Matrix operations and regression calculations are CPU-intensive
- Parallelization is essential for real-world datasets

**Consistency**:
- Follows existing Zygotrix architecture pattern
- Proven IPC mechanism (JSON via stdin/stdout)
- Familiar subprocess integration via `cpp_engine.py`

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/TypeScript)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  GWAS Visualization Widget (GwasWidget.tsx)            │ │
│  │  - Manhattan Plot                                      │ │
│  │  - Q-Q Plot                                            │ │
│  │  - Association Table                                   │ │
│  │  - Download Results                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                Backend (FastAPI/Python)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes (routes/gwas.py)                           │ │
│  │  - POST /api/gwas/analyze                              │ │
│  │  - GET /api/gwas/results/{job_id}                      │ │
│  │  - GET /api/gwas/datasets                              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Service Layer (services/gwas_service.py)              │ │
│  │  - Data preprocessing                                  │ │
│  │  - Quality control                                     │ │
│  │  - Call C++ engine                                     │ │
│  │  - Result parsing                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Repository Layer (repositories/gwas_repository.py)    │ │
│  │  - MongoDB storage                                     │ │
│  │  - Job tracking                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓ Subprocess (JSON IPC)
┌─────────────────────────────────────────────────────────────┐
│              C++ Engine (zyg_gwas_cli)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Statistical Methods                                   │ │
│  │  - Linear Regression (quantitative traits)             │ │
│  │  - Logistic Regression (binary traits)                 │ │
│  │  - Chi-Square Test (association testing)               │ │
│  │  - Mixed Models (population structure)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Linear Algebra (Eigen library)                        │ │
│  │  - Matrix operations                                   │ │
│  │  - Eigenvalue decomposition                            │ │
│  │  - SVD for PCA                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Parallelization (OpenMP)                              │ │
│  │  - Multi-threaded SNP testing                          │ │
│  │  - SIMD optimizations                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Collections                       │
│  - gwas_datasets      (SNP data, phenotypes)                │
│  - gwas_jobs          (analysis jobs, status)               │
│  - gwas_results       (association results)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

**MongoDB Collections & Schema**
- [ ] Create `gwas_datasets` collection with indexes
- [ ] Create `gwas_jobs` collection for job tracking
- [ ] Create `gwas_results` collection for storing results
- [ ] Write migration scripts

**Repository Layer**
- [ ] `GwasDatasetRepository` - CRUD for datasets
- [ ] `GwasJobRepository` - Job lifecycle management
- [ ] `GwasResultRepository` - Store and query results

**Pydantic Schemas**
- [ ] `GwasDataset`, `GwasDatasetCreate`
- [ ] `GwasAnalysisRequest`, `GwasAnalysisResponse`
- [ ] `GwasJob`, `GwasResult`
- [ ] `SnpAssociation`, `ManhattanPlotData`

### Phase 2: C++ Engine (Week 2-4)

**Core Statistical Engine (`zyg_gwas_cli`)**
- [ ] Set up C++ project structure with CMake
- [ ] Integrate Eigen library for linear algebra
- [ ] Implement linear regression for quantitative traits
- [ ] Implement logistic regression for binary traits
- [ ] Implement chi-square test
- [ ] Implement PCA for population structure
- [ ] Add OpenMP parallelization
- [ ] JSON input/output handling (nlohmann/json)
- [ ] Unit tests (Google Test framework)

**Compile targets**:
- `zyg_gwas_cli.exe` (Windows)
- `zyg_gwas_cli` (Linux)

### Phase 3: Python Service Layer (Week 3-4)

**GWAS Service** (`services/gwas_service.py`)
- [ ] Data preprocessing (quality control, MAF filtering)
- [ ] Genotype encoding (additive, dominant, recessive)
- [ ] Subprocess management for C++ engine
- [ ] Result parsing and validation
- [ ] Manhattan plot data generation
- [ ] Q-Q plot data generation
- [ ] Bonferroni correction (genome-wide significance)
- [ ] FDR correction (Benjamini-Hochberg)

**Integration with existing services**:
- [ ] Rate limiting integration
- [ ] User activity tracking
- [ ] Redis caching for results

### Phase 4: API Endpoints (Week 4-5)

**Routes** (`routes/gwas.py`)
- [ ] `POST /api/gwas/datasets` - Upload/create dataset
- [ ] `GET /api/gwas/datasets` - List user's datasets
- [ ] `GET /api/gwas/datasets/{dataset_id}` - Get dataset details
- [ ] `DELETE /api/gwas/datasets/{dataset_id}` - Delete dataset
- [ ] `POST /api/gwas/analyze` - Start GWAS analysis
- [ ] `GET /api/gwas/jobs/{job_id}` - Get job status
- [ ] `GET /api/gwas/results/{job_id}` - Get analysis results
- [ ] `GET /api/gwas/results/{job_id}/download` - Download CSV
- [ ] `DELETE /api/gwas/jobs/{job_id}` - Cancel/delete job

**Authentication & Authorization**:
- All endpoints require `get_current_user()` dependency
- Rate limiting per user (max 10 concurrent jobs)
- Storage quotas per user tier

### Phase 5: Frontend Integration (Week 5-6)

**GWAS Widget** (`zygotrix_ai/src/components/gwas/GwasWidget.tsx`)
- [ ] Manhattan plot visualization (Plotly.js/Recharts)
- [ ] Q-Q plot for p-value distribution
- [ ] Interactive association table
- [ ] SNP detail modal
- [ ] Download results (CSV, JSON)
- [ ] Responsive design

**MCP Tool Integration** (`backend/app/chatbot_tools/tools.py`)
- [ ] `run_gwas_analysis()` tool for Claude
- [ ] Return widget metadata for visualization
- [ ] Integration with conversation context

**Chat Types** (`zygotrix_ai/src/types/chat.types.ts`)
- [ ] Add `gwas_analyzer` to `widget_type` union
- [ ] Add `gwas_data` interface to `MessageMetadata`

### Phase 6: Testing & Optimization (Week 6-7)

**Unit Tests**
- [ ] C++ engine tests (Google Test)
- [ ] Python service tests (pytest)
- [ ] Repository tests with mongomock
- [ ] API endpoint tests

**Integration Tests**
- [ ] End-to-end analysis workflow
- [ ] Frontend widget rendering
- [ ] Claude tool calling

**Performance Optimization**
- [ ] Benchmark C++ engine performance
- [ ] Profile Python service bottlenecks
- [ ] Optimize database queries
- [ ] Add result caching

**Documentation**
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide for GWAS analysis
- [ ] Developer documentation for C++ engine
- [ ] Example datasets and tutorials

---

## Database Schema

### Collection: `gwas_datasets`

```javascript
{
  _id: ObjectId,
  user_id: String,                    // Owner of dataset
  name: String,                       // "My Case-Control Study"
  description: String,
  trait_type: "quantitative" | "binary",
  trait_name: String,                 // "Height (cm)" or "Type 2 Diabetes"

  // SNP data
  snps: [
    {
      rsid: String,                   // "rs1234567"
      chromosome: Number,             // 1-22, X, Y
      position: Number,               // Base pair position
      ref_allele: String,             // "A"
      alt_allele: String,             // "G"
      maf: Number,                    // Minor allele frequency
    }
  ],

  // Sample data
  samples: [
    {
      sample_id: String,
      phenotype: Number,              // Trait value or 0/1 for binary
      genotypes: [Number],            // 0, 1, 2 (additive encoding) for each SNP
      covariates: {                   // Optional
        age: Number,
        sex: Number,                  // 0=female, 1=male
        pc1: Number,                  // Principal component 1
        pc2: Number,
        // ... additional PCs
      }
    }
  ],

  // Metadata
  num_snps: Number,
  num_samples: Number,
  created_at: ISODate,
  updated_at: ISODate,
  status: "uploading" | "processing" | "ready" | "error",
  file_format: "vcf" | "plink" | "custom",

  // Indexes
  indexes: [
    { user_id: 1, created_at: -1 },
    { user_id: 1, status: 1 }
  ]
}
```

### Collection: `gwas_jobs`

```javascript
{
  _id: ObjectId,
  job_id: String,                     // UUID
  user_id: String,
  dataset_id: ObjectId,

  // Analysis parameters
  analysis_type: "linear" | "logistic" | "chi_square" | "mixed_model",
  covariates: [String],               // ["age", "sex", "pc1", "pc2"]
  maf_threshold: Number,              // Minimum allele frequency (e.g., 0.01)
  significance_threshold: Number,     // p-value threshold (5e-8)

  // Job status
  status: "queued" | "running" | "completed" | "failed" | "cancelled",
  progress: Number,                   // 0-100
  error_message: String,

  // Results reference
  result_id: ObjectId,                // Reference to gwas_results

  // Timestamps
  created_at: ISODate,
  started_at: ISODate,
  completed_at: ISODate,

  // Computational metrics
  snps_tested: Number,
  significant_snps: Number,
  execution_time_seconds: Number,

  // Indexes
  indexes: [
    { job_id: 1 },
    { user_id: 1, created_at: -1 },
    { user_id: 1, status: 1 }
  ]
}
```

### Collection: `gwas_results`

```javascript
{
  _id: ObjectId,
  job_id: String,
  user_id: String,
  dataset_id: ObjectId,

  // Association results
  associations: [
    {
      rsid: String,
      chromosome: Number,
      position: Number,
      ref_allele: String,
      alt_allele: String,
      beta: Number,                   // Effect size
      se: Number,                     // Standard error
      p_value: Number,                // Association p-value
      maf: Number,
      n_samples: Number,              // Samples with complete data
    }
  ],

  // Summary statistics
  summary: {
    total_snps_tested: Number,
    significant_snps_bonferroni: Number,
    significant_snps_fdr: Number,
    genomic_inflation_lambda: Number,  // QC metric
    mean_chi_square: Number,
  },

  // Plot data (for fast rendering)
  manhattan_plot_data: {
    chromosomes: [
      {
        chr: Number,
        positions: [Number],
        p_values: [Number],
        labels: [String],             // rsids for significant SNPs
      }
    ]
  },

  qq_plot_data: {
    expected: [Number],
    observed: [Number],
  },

  // Top associations
  top_hits: [
    {
      rsid: String,
      p_value: Number,
      beta: Number,
      nearest_gene: String,           // Optional annotation
    }
  ],

  created_at: ISODate,

  // Indexes
  indexes: [
    { job_id: 1 },
    { user_id: 1, created_at: -1 }
  ]
}
```

---

## C++ Engine Design

### Project Structure

```
cpp/
├── gwas_cli/
│   ├── CMakeLists.txt
│   ├── src/
│   │   ├── main.cpp                 // Entry point, JSON I/O
│   │   ├── gwas_engine.cpp          // Core GWAS orchestration
│   │   ├── gwas_engine.h
│   │   ├── statistics/
│   │   │   ├── linear_regression.cpp
│   │   │   ├── linear_regression.h
│   │   │   ├── logistic_regression.cpp
│   │   │   ├── logistic_regression.h
│   │   │   ├── chi_square.cpp
│   │   │   ├── chi_square.h
│   │   │   ├── mixed_model.cpp      // Future: REGENIE-style
│   │   │   └── mixed_model.h
│   │   ├── preprocessing/
│   │   │   ├── qc_filters.cpp       // Quality control
│   │   │   ├── qc_filters.h
│   │   │   ├── encoding.cpp         // Genotype encoding
│   │   │   └── encoding.h
│   │   ├── linalg/
│   │   │   ├── matrix_ops.cpp       // Wrapper for Eigen
│   │   │   ├── matrix_ops.h
│   │   │   ├── pca.cpp              // Principal component analysis
│   │   │   └── pca.h
│   │   └── utils/
│   │       ├── json_parser.cpp
│   │       ├── json_parser.h
│   │       ├── parallel.cpp         // OpenMP utilities
│   │       └── parallel.h
│   ├── tests/
│   │   ├── test_linear_regression.cpp
│   │   ├── test_logistic_regression.cpp
│   │   ├── test_chi_square.cpp
│   │   └── test_qc_filters.cpp
│   ├── vendor/
│   │   ├── eigen/                   // Eigen library
│   │   └── json/                    // nlohmann/json
│   └── build/
│       └── (compiled binaries)
```

### Key Dependencies

1. **Eigen** (https://eigen.tuxfamily.org/)
   - Header-only C++ linear algebra library
   - Matrix operations, decompositions, solvers
   - Highly optimized with SIMD support

2. **nlohmann/json** (https://github.com/nlohmann/json)
   - Modern C++ JSON library
   - Header-only, easy integration
   - Standard for Zygotrix C++ engines

3. **OpenMP**
   - Parallel programming API
   - Multi-threading for SNP-level tests
   - Compiler support: GCC, Clang, MSVC

4. **Google Test** (Optional, for testing)
   - C++ testing framework

### JSON Input Format

```json
{
  "operation": "run_gwas",
  "analysis_type": "linear",
  "data": {
    "snps": [
      {
        "rsid": "rs1234567",
        "chromosome": 1,
        "position": 123456,
        "ref_allele": "A",
        "alt_allele": "G"
      }
    ],
    "genotypes": [
      [0, 1, 2, 1, 0],  // Genotypes for SNP 1 across samples
      [1, 1, 0, 2, 1]   // Genotypes for SNP 2 across samples
    ],
    "phenotypes": [23.5, 24.1, 22.8, 25.3, 23.9],
    "covariates": {
      "age": [30, 35, 28, 40, 33],
      "sex": [0, 1, 0, 1, 0]
    }
  },
  "parameters": {
    "maf_threshold": 0.01,
    "num_threads": 4
  }
}
```

### JSON Output Format

```json
{
  "success": true,
  "results": [
    {
      "rsid": "rs1234567",
      "chromosome": 1,
      "position": 123456,
      "beta": 0.543,
      "se": 0.123,
      "t_stat": 4.414,
      "p_value": 1.23e-5,
      "maf": 0.23,
      "n_samples": 1000
    }
  ],
  "summary": {
    "snps_tested": 500000,
    "execution_time_ms": 1234,
    "threads_used": 4
  }
}
```

### Core Algorithms

#### Linear Regression (Quantitative Traits)

For each SNP, fit the model:
```
Y = β₀ + β₁X + β₂C₁ + β₃C₂ + ... + ε
```
Where:
- Y = phenotype vector
- X = genotype vector (0, 1, 2)
- C₁, C₂, ... = covariates (age, sex, PCs)
- β₁ = SNP effect size
- p-value from t-test on β₁

**Implementation**: Use Eigen's QR decomposition for least squares.

#### Logistic Regression (Binary Traits)

For case-control studies:
```
logit(P(Y=1)) = β₀ + β₁X + β₂C₁ + ...
```
**Implementation**: Iteratively reweighted least squares (IRLS).

#### Chi-Square Test

For genotype-phenotype association (no covariates):
```
χ² = Σ (Observed - Expected)² / Expected
```
1 degree of freedom, fast for simple associations.

---

## Python Service Layer

### `services/gwas_service.py`

```python
from typing import List, Dict, Optional
import numpy as np
from subprocess import Popen, PIPE, TimeoutExpired
import json
from ..core.config import config
from ..repositories.gwas_repository import GwasDatasetRepository, GwasJobRepository, GwasResultRepository
from ..schema.gwas import GwasAnalysisRequest, GwasJob, GwasResult

class GwasService:
    """Service for GWAS analysis orchestration."""

    def __init__(
        self,
        dataset_repo: GwasDatasetRepository,
        job_repo: GwasJobRepository,
        result_repo: GwasResultRepository
    ):
        self.dataset_repo = dataset_repo
        self.job_repo = job_repo
        self.result_repo = result_repo
        self.engine_path = self._get_engine_path()

    def _get_engine_path(self) -> str:
        """Get path to compiled C++ GWAS engine."""
        # Similar to cpp_engine.py
        if config.PLATFORM == "win32":
            return "cpp/gwas_cli/build/zyg_gwas_cli.exe"
        return "cpp/gwas_cli/build/zyg_gwas_cli"

    async def start_analysis(
        self,
        user_id: str,
        request: GwasAnalysisRequest
    ) -> GwasJob:
        """Start a new GWAS analysis job."""
        # 1. Validate dataset exists and user has access
        dataset = await self.dataset_repo.get_by_id(request.dataset_id)
        if not dataset or dataset.user_id != user_id:
            raise HTTPException(404, "Dataset not found")

        # 2. Create job record
        job = await self.job_repo.create_job(
            user_id=user_id,
            dataset_id=request.dataset_id,
            analysis_type=request.analysis_type,
            parameters=request.parameters
        )

        # 3. Run analysis (async background task)
        background_tasks.add_task(
            self._run_gwas_analysis,
            job_id=job.job_id,
            dataset=dataset,
            request=request
        )

        return job

    async def _run_gwas_analysis(
        self,
        job_id: str,
        dataset: GwasDataset,
        request: GwasAnalysisRequest
    ):
        """Execute GWAS analysis using C++ engine."""
        try:
            # Update status to running
            await self.job_repo.update_status(job_id, "running")

            # Prepare input data
            input_data = self._prepare_input(dataset, request)

            # Call C++ engine
            result = await self._call_cpp_engine(input_data)

            # Parse and store results
            gwas_result = await self._parse_results(result, job_id, dataset)

            # Update job status
            await self.job_repo.update_status(
                job_id,
                "completed",
                result_id=gwas_result.id
            )

        except Exception as e:
            logger.error(f"GWAS analysis failed: {e}")
            await self.job_repo.update_status(
                job_id,
                "failed",
                error_message=str(e)
            )

    def _prepare_input(
        self,
        dataset: GwasDataset,
        request: GwasAnalysisRequest
    ) -> Dict:
        """Prepare JSON input for C++ engine."""
        return {
            "operation": "run_gwas",
            "analysis_type": request.analysis_type,
            "data": {
                "snps": [
                    {
                        "rsid": snp.rsid,
                        "chromosome": snp.chromosome,
                        "position": snp.position,
                        "ref_allele": snp.ref_allele,
                        "alt_allele": snp.alt_allele,
                    }
                    for snp in dataset.snps
                ],
                "genotypes": self._encode_genotypes(dataset),
                "phenotypes": [s.phenotype for s in dataset.samples],
                "covariates": self._extract_covariates(dataset, request.covariates),
            },
            "parameters": {
                "maf_threshold": request.maf_threshold,
                "num_threads": 4,
            }
        }

    async def _call_cpp_engine(self, input_data: Dict) -> Dict:
        """Call C++ engine via subprocess."""
        input_json = json.dumps(input_data)

        process = Popen(
            [self.engine_path],
            stdin=PIPE,
            stdout=PIPE,
            stderr=PIPE,
            text=True
        )

        try:
            stdout, stderr = process.communicate(
                input=input_json,
                timeout=300  # 5 minutes
            )

            if process.returncode != 0:
                raise RuntimeError(f"C++ engine error: {stderr}")

            return json.loads(stdout)

        except TimeoutExpired:
            process.kill()
            raise RuntimeError("GWAS analysis timed out")

    async def _parse_results(
        self,
        cpp_output: Dict,
        job_id: str,
        dataset: GwasDataset
    ) -> GwasResult:
        """Parse C++ output and create result record."""
        associations = cpp_output["results"]

        # Apply multiple testing correction
        bonferroni_threshold = 0.05 / len(associations)
        fdr_corrected = self._benjamini_hochberg([a["p_value"] for a in associations])

        # Generate Manhattan plot data
        manhattan_data = self._generate_manhattan_data(associations)

        # Generate Q-Q plot data
        qq_data = self._generate_qq_data([a["p_value"] for a in associations])

        # Store in database
        result = await self.result_repo.create_result(
            job_id=job_id,
            user_id=dataset.user_id,
            dataset_id=dataset.id,
            associations=associations,
            summary={
                "total_snps_tested": len(associations),
                "significant_snps_bonferroni": sum(
                    1 for a in associations if a["p_value"] < bonferroni_threshold
                ),
                "significant_snps_fdr": sum(1 for p in fdr_corrected if p < 0.05),
                "genomic_inflation_lambda": self._calculate_lambda(
                    [a["p_value"] for a in associations]
                ),
            },
            manhattan_plot_data=manhattan_data,
            qq_plot_data=qq_data,
        )

        return result

    def _benjamini_hochberg(self, p_values: List[float]) -> List[float]:
        """Apply Benjamini-Hochberg FDR correction."""
        n = len(p_values)
        sorted_indices = np.argsort(p_values)
        sorted_p = np.array(p_values)[sorted_indices]

        # FDR = p * n / rank
        fdr = sorted_p * n / np.arange(1, n + 1)
        fdr = np.minimum.accumulate(fdr[::-1])[::-1]  # Monotonic

        # Restore original order
        corrected = np.empty(n)
        corrected[sorted_indices] = fdr
        return corrected.tolist()

    def _calculate_lambda(self, p_values: List[float]) -> float:
        """Calculate genomic inflation factor."""
        # λ = median(χ²) / 0.456
        from scipy.stats import chi2
        chi_sq = [chi2.ppf(1 - p, df=1) for p in p_values if p > 0]
        return np.median(chi_sq) / 0.456 if chi_sq else 1.0
```

---

## API Endpoints

### `routes/gwas.py`

```python
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List
from ..schema.gwas import (
    GwasDataset, GwasDatasetCreate,
    GwasAnalysisRequest, GwasJob, GwasResult
)
from ..services.gwas_service import get_gwas_service
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/gwas", tags=["GWAS"])

@router.post("/datasets", response_model=GwasDataset)
async def create_dataset(
    dataset: GwasDatasetCreate,
    current_user = Depends(get_current_user),
    service = Depends(get_gwas_service)
):
    """Upload a new GWAS dataset."""
    return await service.create_dataset(current_user.id, dataset)

@router.get("/datasets", response_model=List[GwasDataset])
async def list_datasets(
    current_user = Depends(get_current_user),
    service = Depends(get_gwas_service)
):
    """List all datasets for the current user."""
    return await service.list_datasets(current_user.id)

@router.post("/analyze", response_model=GwasJob)
async def start_analysis(
    request: GwasAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    service = Depends(get_gwas_service)
):
    """Start a new GWAS analysis."""
    return await service.start_analysis(current_user.id, request)

@router.get("/jobs/{job_id}", response_model=GwasJob)
async def get_job_status(
    job_id: str,
    current_user = Depends(get_current_user),
    service = Depends(get_gwas_service)
):
    """Get the status of a GWAS job."""
    job = await service.get_job(job_id)
    if job.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
    return job

@router.get("/results/{job_id}", response_model=GwasResult)
async def get_results(
    job_id: str,
    current_user = Depends(get_current_user),
    service = Depends(get_gwas_service)
):
    """Get the results of a completed GWAS analysis."""
    result = await service.get_result(job_id)
    if result.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
    return result
```

---

## Frontend Integration

See [GWAS_INTEGRATION_GUIDE.md](./zygotrix_ai/GWAS_INTEGRATION_GUIDE.md) for detailed frontend and AI chatbot integration.

---

## Testing Strategy

### Unit Tests

**C++ Engine (Google Test)**
```cpp
TEST(LinearRegressionTest, SimpleAssociation) {
    // Test data
    Eigen::VectorXd genotypes(5);
    genotypes << 0, 1, 2, 1, 0;
    Eigen::VectorXd phenotypes(5);
    phenotypes << 10.2, 12.5, 15.1, 13.0, 10.8;

    // Run regression
    LinearRegression lr;
    auto result = lr.fit(genotypes, phenotypes);

    // Assert
    EXPECT_NEAR(result.beta, 2.45, 0.1);
    EXPECT_LT(result.p_value, 0.05);
}
```

**Python Service (pytest)**
```python
@pytest.mark.asyncio
async def test_gwas_analysis_workflow(mock_dataset):
    service = GwasService(dataset_repo, job_repo, result_repo)

    request = GwasAnalysisRequest(
        dataset_id=mock_dataset.id,
        analysis_type="linear",
        covariates=["age", "sex"]
    )

    job = await service.start_analysis("user123", request)

    assert job.status == "queued"
    assert job.user_id == "user123"
```

### Integration Tests

1. **End-to-end workflow**: Upload dataset → Start analysis → Check results
2. **Widget rendering**: Ensure GWAS results display correctly
3. **Claude tool calling**: Test AI chatbot GWAS integration

---

## Performance Considerations

### Expected Performance

**Target**: Analyze 500,000 SNPs × 1,000 samples in < 2 minutes

**Optimizations**:
1. **C++ with Eigen**: Matrix operations optimized with SIMD
2. **OpenMP parallelization**: Distribute SNP tests across cores
3. **Efficient memory layout**: Column-major for cache efficiency
4. **Result caching**: Store Manhattan/Q-Q plot data in MongoDB
5. **Pagination**: Return top N associations, paginate full results

### Scalability

- Small datasets (< 10K SNPs): Real-time analysis (< 10s)
- Medium datasets (< 100K SNPs): < 1 minute
- Large datasets (> 500K SNPs): Background jobs with progress tracking

---

## Security & Validation

### Input Validation

1. **MAF threshold**: 0.001 ≤ MAF ≤ 0.5
2. **Sample size**: Minimum 50 samples
3. **SNP count**: Maximum 10M SNPs per dataset
4. **File size limits**: Max 500 MB upload
5. **Genotype encoding**: Only 0, 1, 2 (or missing)

### Rate Limiting

- Max 10 concurrent GWAS jobs per user
- Max 5 datasets per free-tier user
- Max 50 datasets per premium user

### Data Privacy

- User datasets are private by default
- No cross-user data access
- Option to delete datasets permanently
- GDPR compliance for EU users

---

## Timeline & Milestones

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Infrastructure | 1-2 weeks | MongoDB collections, repositories, schemas |
| Phase 2: C++ Engine | 2-4 weeks | Compiled `zyg_gwas_cli`, unit tests |
| Phase 3: Python Service | 1-2 weeks | GWAS service, integration with C++ |
| Phase 4: API Endpoints | 1 week | FastAPI routes, authentication |
| Phase 5: Frontend | 2 weeks | GWAS widget, Manhattan/Q-Q plots |
| Phase 6: Testing & Docs | 1-2 weeks | E2E tests, documentation |
| **Total** | **7-11 weeks** | Production-ready GWAS feature |

---

## References

1. **GWAS Methods**:
   - [Statistical analysis for GWAS | PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4547377/)
   - [GWAS Statistical Testing | STAT 555](https://online.stat.psu.edu/stat555/node/114/)

2. **Computational Approaches**:
   - [Divide and conquer for GWAS | Genetics](https://academic.oup.com/genetics/article/229/4/iyaf019/8075099)
   - [PascalX: Python/C++ hybrid | Bioinformatics](https://academic.oup.com/bioinformatics/article/39/5/btad296/7151067)

3. **Tools**:
   - [PLINK](https://www.cog-genomics.org/plink/)
   - [REGENIE](https://rgcgithub.github.io/regenie/)
   - [GEMMA](https://github.com/genetics-statistics/GEMMA)

---

## Appendix: Example Usage

### Via API

```bash
# 1. Upload dataset
curl -X POST http://localhost:8000/api/gwas/datasets \
  -H "Authorization: Bearer $TOKEN" \
  -d @dataset.json

# 2. Start analysis
curl -X POST http://localhost:8000/api/gwas/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "dataset_id": "dataset_123",
    "analysis_type": "linear",
    "covariates": ["age", "sex"],
    "maf_threshold": 0.01
  }'

# 3. Check status
curl http://localhost:8000/api/gwas/jobs/job_456 \
  -H "Authorization: Bearer $TOKEN"

# 4. Get results
curl http://localhost:8000/api/gwas/results/job_456 \
  -H "Authorization: Bearer $TOKEN"
```

### Via AI Chatbot

```
User: "Run a GWAS analysis on my height dataset"

Zigi: I'll run a GWAS analysis for you. Let me analyze the associations
      between SNPs and height in your dataset.

[GWAS Widget displays Manhattan plot showing genome-wide results]

Zigi: I found 23 genome-wide significant associations (p < 5×10⁻⁸).
      The strongest signal is rs1234567 on chromosome 6 (p = 3.2×10⁻¹²).

      Would you like me to explore specific regions in more detail?
```

---

**End of Implementation Plan**
