---
sidebar_position: 3
---

# Translate RNA

Translate mRNA to protein sequence.

## Endpoint

```
POST /api/genetics/rna/translate
```

## Request Body

```json
{
  "sequence": "AUGCGAUCGAUCGAUC"
}
```

## Response

```json
{
  "mrna": "AUGCGAUCGAUCGAUC",
  "codons": ["AUG", "CGA", "UCG", "AUC", "GAU", "C"],
  "protein": "Met-Arg-Ser-Ile-Asp",
  "amino_acids": ["M", "R", "S", "I", "D"],
  "length": 5,
  "stop_codon": false
}
```

## Example

```bash
curl -X POST http://localhost:8000/api/genetics/rna/translate \
  -H "Content-Type: application/json" \
  -d '{"sequence": "AUGCGAUCGAUCGAUC"}'
```

## Notes

- Translation starts from position 0
- Incomplete codons are ignored
- Stop codons (UAA, UAG, UGA) terminate translation
