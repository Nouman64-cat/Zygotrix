---
sidebar_position: 4
---

# DNA Tools

Generate, transcribe, and translate genetic sequences with Zygotrix's high-performance tools.

## DNA Generation

### Random DNA Sequence

Generate a random DNA sequence of specified length:

```bash
curl "http://localhost:8000/api/genetics/dna/random?length=1000"
```

**Response:**
```json
{
  "sequence": "ATGCGATCGATC...",
  "length": 1000,
  "gc_content": 0.52
}
```

### Large Sequences

For sequences >1M base pairs, the parallel C++ engine is automatically used:

```bash
curl "http://localhost:8000/api/genetics/dna/random?length=10000000"
```

## Transcription (DNA → mRNA)

Convert DNA to messenger RNA:

```bash
curl -X POST http://localhost:8000/api/genetics/dna/transcribe \
  -H "Content-Type: application/json" \
  -d '{"sequence": "ATGCGATCGATCGATC"}'
```

**Response:**
```json
{
  "dna": "ATGCGATCGATCGATC",
  "mrna": "AUGCGAUCGAUCGAUC",
  "template_strand": "TACGCTAGCTAGCTAG"
}
```

### Rules
- A → U (Adenine becomes Uracil)
- T → A
- G → C
- C → G

## Translation (mRNA → Protein)

Translate mRNA to amino acid sequence:

```bash
curl -X POST http://localhost:8000/api/genetics/rna/translate \
  -H "Content-Type: application/json" \
  -d '{"sequence": "AUGCGAUCGAUCGAUC"}'
```

**Response:**
```json
{
  "mrna": "AUGCGAUCGAUCGAUC",
  "codons": ["AUG", "CGA", "UCG", "AUC", "GAU", "C"],
  "protein": "Met-Arg-Ser-Ile-Asp",
  "amino_acids": ["M", "R", "S", "I", "D"]
}
```

## Codon Table

| Codon | Amino Acid | Abbreviation |
|-------|-----------|--------------|
| AUG | Methionine (Start) | M |
| UUU, UUC | Phenylalanine | F |
| UUA, UUG | Leucine | L |
| ... | ... | ... |
| UAA, UAG, UGA | Stop | * |

## Using with Zigi

### Generate and Transcribe

> **You:** Generate 500bp of DNA and transcribe it to mRNA
>
> **Zigi:** Here's a random 500bp DNA sequence:
> `ATGCGATC...`
> 
> Transcribed to mRNA:
> `AUGCGAUC...`

### Full Pipeline

> **You:** Generate 300bp of DNA, transcribe it, and translate to protein
>
> **Zigi:** Starting with random DNA...
> Final protein sequence: Met-Arg-Ser-Ile...

## Performance

| Operation | Sequence Length | Time |
|-----------|-----------------|------|
| Generate DNA | 1,000 bp | <10ms |
| Generate DNA | 1,000,000 bp | ~500ms |
| Transcription | Any | <1ms |
| Translation | 10,000 codons | <10ms |

## API Reference

### Generate Random DNA
`GET /api/genetics/dna/random?length={n}`

### Transcribe DNA
`POST /api/genetics/dna/transcribe`
```json
{"sequence": "ATGC..."}
```

### Extract Codons
`POST /api/genetics/rna/codons`
```json
{"sequence": "AUGC..."}
```

### Translate RNA
`POST /api/genetics/rna/translate`
```json
{"sequence": "AUGC..."}
```
