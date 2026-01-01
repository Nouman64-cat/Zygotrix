---
sidebar_position: 3
---

# GWAS Analysis

Perform Genome-Wide Association Studies on your genetic data with Zygotrix's high-performance C++ engine.

## What is GWAS?

GWAS (Genome-Wide Association Study) identifies genetic variants (SNPs) associated with traits or diseases by testing each variant for statistical association with a phenotype.

## Supported File Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| VCF | `.vcf` | Variant Call Format |
| PLINK | `.bed/.bim/.fam` | Binary genotype format |
| 23andMe | `.txt` | Direct-to-consumer format |

## Quick Start

### 1. Upload Your Dataset

Through the API:
```bash
curl -X POST http://localhost:8000/api/gwas/datasets/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@your_data.vcf"
```

Or through Zigi:
> [Upload file] "Analyze this VCF file"

### 2. Run Analysis

```bash
curl -X POST http://localhost:8000/api/gwas/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "your-dataset-id",
    "analysis_type": "linear",
    "maf_threshold": 0.01
  }'
```

### 3. Get Results

```bash
curl http://localhost:8000/api/gwas/results/YOUR_JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Analysis Types

### Linear Regression

For **continuous phenotypes** (height, blood pressure, etc.):

```
Y = β₀ + β₁G + ε
```

Where:
- Y = phenotype value
- G = genotype (0, 1, or 2)
- β₁ = effect size

**Best for:** Quantitative traits

### Logistic Regression

For **binary phenotypes** (case/control, disease/healthy):

```
log(p/(1-p)) = β₀ + β₁G
```

**Best for:** Disease association studies

### Chi-Square Test

For **categorical associations**:

```
χ² = Σ(O-E)²/E
```

**Best for:** Simple allele frequency comparisons

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maf_threshold` | 0.01 | Minimum minor allele frequency |
| `num_threads` | 4 | Parallel processing threads |
| `analysis_type` | linear | Type of statistical test |

## Understanding Results

### Result Fields

```json
{
  "rsid": "rs1234567",
  "chromosome": 1,
  "position": 123456,
  "ref_allele": "A",
  "alt_allele": "G",
  "beta": 0.25,
  "se": 0.05,
  "p_value": 1.5e-8,
  "maf": 0.15
}
```

| Field | Description |
|-------|-------------|
| `rsid` | SNP identifier |
| `beta` | Effect size (per allele) |
| `se` | Standard error |
| `p_value` | Statistical significance |
| `maf` | Minor allele frequency |

### Significance Thresholds

| Threshold | Value | Interpretation |
|-----------|-------|----------------|
| Genome-wide significant | p < 5×10⁻⁸ | Strong evidence |
| Suggestive | p < 1×10⁻⁵ | Worth investigating |
| Nominal | p < 0.05 | Weak evidence |

## Performance

Powered by the C++ GWAS engine with Eigen library:

| Dataset Size | Analysis Time |
|--------------|---------------|
| 1,000 SNPs, 100 samples | Under 1 second |
| 10,000 SNPs, 500 samples | ~5 seconds |
| 100,000 SNPs, 1,000 samples | ~30 seconds |
| 1M SNPs, 1,000 samples | ~5 minutes |

## Quality Control

### MAF Filtering

SNPs with MAF < threshold are excluded (default: 1%).

### Missing Data

Genotypes marked as -9 or ./. are treated as missing.

## Example Workflow

```python
# 1. Upload dataset
response = requests.post(
    f"{API_URL}/gwas/datasets/upload",
    headers={"Authorization": f"Bearer {token}"},
    files={"file": open("data.vcf", "rb")}
)
dataset_id = response.json()["dataset_id"]

# 2. Start analysis
response = requests.post(
    f"{API_URL}/gwas/analyze",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "dataset_id": dataset_id,
        "analysis_type": "linear",
        "maf_threshold": 0.05
    }
)
job_id = response.json()["job_id"]

# 3. Poll for results
while True:
    status = requests.get(f"{API_URL}/gwas/jobs/{job_id}/status")
    if status.json()["status"] == "completed":
        break
    time.sleep(5)

# 4. Get results
results = requests.get(f"{API_URL}/gwas/results/{job_id}")
significant_snps = [r for r in results.json()["results"] if r["p_value"] < 5e-8]
```

## Troubleshooting

### "C++ GWAS CLI not found"

Build the C++ engine:
```bash
cd zygotrix_engine_cpp
sudo apt install libeigen3-dev
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

### Analysis timeout

For large datasets, increase the timeout or reduce dataset size.

### Low-quality results

Check:
- Sample size (need 50+ for reliable results)
- MAF threshold (too low = noisy results)
- Phenotype distribution
