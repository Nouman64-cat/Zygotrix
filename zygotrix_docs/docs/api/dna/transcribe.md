---
sidebar_position: 2
---

# Transcribe DNA

Convert DNA to mRNA.

## Endpoint

```
POST /api/genetics/dna/transcribe
```

## Request Body

```json
{
  "sequence": "ATGCGATCGATCGATC"
}
```

## Response

```json
{
  "dna": "ATGCGATCGATCGATC",
  "mrna": "AUGCGAUCGAUCGAUC",
  "template_strand": "TACGCTAGCTAGCTAG",
  "length": 16
}
```

## Transcription Rules

| DNA | mRNA |
|-----|------|
| A | U |
| T | A |
| G | C |
| C | G |

## Example

```bash
curl -X POST http://localhost:8000/api/genetics/dna/transcribe \
  -H "Content-Type: application/json" \
  -d '{"sequence": "ATGCGATCGATC"}'
```
