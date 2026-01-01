---
sidebar_position: 1
---

# Upload GWAS Dataset

Upload a VCF or PLINK file for GWAS analysis.

## Endpoint

```
POST /api/gwas/datasets/upload
```

## Authentication

Required. Include JWT token in Authorization header.

## Request

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | VCF or PLINK file |
| `name` | string | No | Dataset name |

## Example

```bash
curl -X POST http://localhost:8000/api/gwas/datasets/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@data.vcf" \
  -F "name=My GWAS Dataset"
```

## Response

```json
{
  "dataset_id": "507f1f77bcf86cd799439011",
  "name": "data.vcf",
  "status": "processing",
  "snp_count": null,
  "sample_count": null,
  "created_at": "2024-01-01T12:00:00Z"
}
```

## File Processing

After upload, the file is processed asynchronously:
1. VCF/PLINK parsing
2. SNP extraction
3. Sample identification
4. Quality control

Check status with `GET /api/gwas/datasets/:id`

## Supported Formats

| Format | Extensions | Max Size |
|--------|------------|----------|
| VCF | `.vcf`, `.vcf.gz` | 500MB |
| PLINK | `.bed`, `.bim`, `.fam` | 1GB |

## Errors

| Code | Message |
|------|---------|
| 400 | Unsupported file format |
| 413 | File too large |
| 422 | File parsing failed |
