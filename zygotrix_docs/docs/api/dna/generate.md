---
sidebar_position: 1
---

# Generate DNA

Generate random DNA sequences.

## Endpoint

```
GET /api/genetics/dna/random
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `length` | int | 100 | Sequence length (bp) |
| `gc_content` | float | - | Target GC content (0.0-1.0) |

## Response

```json
{
  "sequence": "ATGCGATCGATCGATCGATC...",
  "length": 100,
  "gc_content": 0.52,
  "base_counts": {
    "A": 25,
    "T": 23,
    "G": 26,
    "C": 26
  }
}
```

## Example

```bash
# Generate 1000bp sequence
curl "http://localhost:8000/api/genetics/dna/random?length=1000"

# Generate with specific GC content
curl "http://localhost:8000/api/genetics/dna/random?length=500&gc_content=0.6"
```

## Performance

| Length | Time |
|--------|------|
| 1,000 bp | <10ms |
| 100,000 bp | ~50ms |
| 1,000,000 bp | ~500ms |
| 10,000,000 bp | ~5s (parallel C++) |
