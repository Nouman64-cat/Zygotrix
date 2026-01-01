---
sidebar_position: 2
---

# Run GWAS Analysis

Start a GWAS analysis job on an uploaded dataset.

## Endpoint

```
POST /api/gwas/analyze
```

## Authentication

Required.

## Request Body

```json
{
  "dataset_id": "507f1f77bcf86cd799439011",
  "analysis_type": "linear",
  "phenotype_column": "phenotype",
  "maf_threshold": 0.01,
  "num_threads": 4
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `dataset_id` | string | Required | Dataset to analyze |
| `analysis_type` | string | `linear` | `linear`, `logistic`, `chi_square` |
| `phenotype_column` | string | - | Column name for phenotype |
| `maf_threshold` | float | 0.01 | Minimum MAF |
| `num_threads` | int | 4 | Parallel threads |

## Response

```json
{
  "job_id": "507f1f77bcf86cd799439012",
  "status": "pending",
  "created_at": "2024-01-01T12:00:00Z"
}
```

## Job Status

Check job progress:

```
GET /api/gwas/jobs/:job_id/status
```

```json
{
  "job_id": "...",
  "status": "running",
  "progress": 45,
  "started_at": "2024-01-01T12:00:05Z"
}
```

## Status Values

| Status | Description |
|--------|-------------|
| `pending` | Queued for processing |
| `running` | Analysis in progress |
| `completed` | Results ready |
| `failed` | Error occurred |
