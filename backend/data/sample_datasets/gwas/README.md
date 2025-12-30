# Sample GWAS Datasets

This directory contains sample genomic datasets for testing the GWAS analysis feature.

## Files

### 1. `sample_gwas.vcf`
- **Format**: VCF (Variant Call Format)
- **SNPs**: 12 variants across chromosomes 1, 2, and 3
- **Samples**: 20 individuals (SAMPLE_001 to SAMPLE_020)
- **Use case**: Testing VCF parser and small dataset analysis

### 2. `sample_phenotypes.csv`
- **Format**: CSV
- **Samples**: 20 individuals matching the VCF samples
- **Phenotypes**: 
  - `height` (cm) - Continuous trait
  - `bmi` - Body Mass Index
  - `age` - Age in years
  - `sex` - 1=Male, 2=Female
- **Covariates**:
  - `cov_pc1` - Principal Component 1
  - `cov_pc2` - Principal Component 2
- **Use case**: Testing phenotype parsing and covariate adjustment

### 3. `sample_custom.json`
- **Format**: Custom JSON
- **SNPs**: 5 variants
- **Samples**: 10 individuals
- **Use case**: Testing custom format import and rapid prototyping

## Usage Examples

### Example 1: Upload VCF Dataset
```bash
curl -X POST "http://localhost:8000/api/gwas/datasets/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test VCF Dataset" \
  -F "description=Sample dataset for testing" \
  -F "file_format=vcf" \
  -F "trait_type=quantitative" \
  -F "trait_name=height" \
  -F "file=@sample_gwas.vcf"
```

### Example 2: Upload Phenotype File
```bash
curl -X POST "http://localhost:8000/api/gwas/datasets/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Phenotypes" \
  -F "file_format=custom" \
  -F "trait_type=quantitative" \
  -F "trait_name=height" \
  -F "file=@sample_phenotypes.csv"
```

### Example 3: Chat-based Upload
```
User: "Upload my VCF file for height analysis"
Claude: [Uses upload tool]
        "I've uploaded your dataset. It contains 12 SNPs and 20 samples."
```

## Expected Results

When running GWAS on these datasets with default parameters:
- **Processing time**: < 1 second (very small dataset)
- **Significant SNPs**: Likely 0-1 (random data)
- **Lambda GC**: Should be close to 1.0 (no population structure)

## Notes

- These are **synthetic datasets** created for testing only
- Genotypes and phenotypes are randomly generated
- Not suitable for biological interpretation
- Designed to test software functionality only
