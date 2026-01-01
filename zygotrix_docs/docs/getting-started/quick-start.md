---
sidebar_position: 2
---

# Quick Start

Get up and running with Zygotrix in under 5 minutes!

## Prerequisites

Make sure you've completed the [Installation Guide](./installation) first.

## Your First Punnett Square

### Using the API

```bash
curl -X POST http://localhost:8000/api/genetics/cross \
  -H "Content-Type: application/json" \
  -d '{
    "parent1_genotype": "Aa",
    "parent2_genotype": "Aa"
  }'
```

**Response:**

```json
{
  "offspring": [
    {"genotype": "AA", "probability": 0.25},
    {"genotype": "Aa", "probability": 0.50},
    {"genotype": "aa", "probability": 0.25}
  ],
  "phenotype_ratios": {
    "Dominant": 0.75,
    "Recessive": 0.25
  }
}
```

### Using the AI Chatbot

Simply ask Zigi:

> "What are the offspring genotypes when crossing Aa × Aa?"

Zigi will calculate the Punnett square and explain the results!

## DNA Sequence Generation

### Generate Random DNA

```bash
curl "http://localhost:8000/api/genetics/dna/random?length=100"
```

### Transcribe DNA to mRNA

```bash
curl -X POST http://localhost:8000/api/genetics/dna/transcribe \
  -H "Content-Type: application/json" \
  -d '{"sequence": "ATGCGATCGATCG"}'
```

### Translate to Protein

```bash
curl -X POST http://localhost:8000/api/genetics/rna/translate \
  -H "Content-Type: application/json" \
  -d '{"sequence": "AUGCGAUCGAUCG"}'
```

## GWAS Analysis

### 1. Upload Your Dataset

Upload a VCF file through the chatbot or API:

```bash
curl -X POST http://localhost:8000/api/gwas/datasets/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@your_data.vcf"
```

### 2. Run Analysis

```bash
curl -X POST http://localhost:8000/api/gwas/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "your-dataset-id",
    "analysis_type": "linear"
  }'
```

### 3. Get Results

```bash
curl http://localhost:8000/api/gwas/results/YOUR_JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Explore the Interactive Docs

Visit http://localhost:8000/docs for the interactive Swagger UI where you can:
- Try all API endpoints
- See request/response schemas
- Test with your own data

## Next Steps

- [Configuration Guide](./configuration) - Customize settings
- [AI Chatbot Features](../features/ai-chatbot) - Learn about Zigi
- [GWAS Analysis](../features/gwas-analysis) - Deep dive into GWAS
- [API Reference](../api/introduction) - Full API documentation
