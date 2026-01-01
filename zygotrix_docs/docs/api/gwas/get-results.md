---
sidebar_position: 3
---

# Get GWAS Results

Retrieve results from a completed GWAS analysis.

## Endpoint

```
GET /api/gwas/results/:job_id
```

## Authentication

Required.

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `p_threshold` | float | 1.0 | Filter by p-value |
| `limit` | int | 100 | Max results |
| `sort_by` | string | `p_value` | Sort field |

## Response

```json
{
  "job_id": "507f1f77bcf86cd799439012",
  "status": "completed",
  "analysis_type": "linear",
  "execution_time_ms": 5234,
  "snps_tested": 10000,
  "snps_filtered": 500,
  "results": [
    {
      "rsid": "rs1234567",
      "chromosome": 1,
      "position": 123456,
      "ref_allele": "A",
      "alt_allele": "G",
      "beta": 0.25,
      "se": 0.05,
      "p_value": 1.5e-8,
      "maf": 0.15,
      "n_samples": 500
    }
  ],
  "summary": {
    "significant_snps": 15,
    "suggestive_snps": 42,
    "top_chromosome": 6,
    "genomic_inflation": 1.02
  }
}
```

## Example

Get genome-wide significant results only:

```bash
curl "http://localhost:8000/api/gwas/results/JOB_ID?p_threshold=5e-8" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Download Full Results

```
GET /api/gwas/results/:job_id/download
```

Returns a CSV file with all results.
