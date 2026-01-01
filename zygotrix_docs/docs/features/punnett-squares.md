---
sidebar_position: 2
---

# Punnett Squares

Calculate genetic crosses from simple monohybrid to complex multi-gene scenarios.

## What is a Punnett Square?

A Punnett square is a visual tool for predicting the genotypes and phenotypes of offspring from a genetic cross.

## Basic Crosses

### Monohybrid Cross (One Gene)

Cross two heterozygous parents: **Aa × Aa**

|   | **A** | **a** |
|---|-------|-------|
| **A** | AA | Aa |
| **a** | Aa | aa |

**Results:**
- 25% AA (homozygous dominant)
- 50% Aa (heterozygous)
- 25% aa (homozygous recessive)

**Phenotype ratio:** 3:1 (dominant:recessive)

### Using the API

```bash
curl -X POST http://localhost:8000/api/genetics/cross \
  -H "Content-Type: application/json" \
  -d '{
    "parent1_genotype": "Aa",
    "parent2_genotype": "Aa"
  }'
```

### Using Zygotrix AI

Simply ask:
> "What are the offspring of Aa × Aa?"

## Complex Crosses

### Dihybrid Cross (Two Genes)

Cross **AaBb × AaBb**:

**Results:**
- 9/16 dominant for both traits
- 3/16 dominant A, recessive B
- 3/16 recessive A, dominant B
- 1/16 recessive for both

**Phenotype ratio:** 9:3:3:1

### Trihybrid and Beyond

Zygotrix supports multi-gene crosses:

```bash
curl -X POST http://localhost:8000/api/genetics/cross \
  -d '{
    "parent1_genotype": "AaBbCc",
    "parent2_genotype": "AaBbCc"
  }'
```

## Inheritance Patterns

### Complete Dominance

One allele completely masks the other:
- **AA, Aa** → Dominant phenotype
- **aa** → Recessive phenotype

### Incomplete Dominance

Heterozygotes show intermediate phenotype:
- **RR** → Red flowers
- **Rr** → Pink flowers
- **rr** → White flowers

### Codominance

Both alleles fully expressed:
- **AB** → Both A and B traits visible
- Example: Blood type AB

## Examples by Trait

### Eye Color (Simplified)

| Parent 1 | Parent 2 | Offspring |
|----------|----------|-----------|
| BB × BB | All BB | All Brown |
| BB × bb | All Bb | All Brown |
| Bb × Bb | BB:Bb:bb = 1:2:1 | 3 Brown : 1 Blue |
| Bb × bb | Bb:bb = 1:1 | 1 Brown : 1 Blue |

### Coat Color in Animals

| Genotype | Phenotype |
|----------|-----------|
| BB, Bb | Black coat |
| bb | Brown coat |

## Calculation Performance

| Cross Complexity | Calculation Time |
|-----------------|------------------|
| Monohybrid (1 gene) | Under 10ms |
| Dihybrid (2 genes) | Under 20ms |
| Trihybrid (3 genes) | Under 50ms |
| 5+ genes | Under 200ms |

Powered by the C++ engine for maximum performance.

## API Reference

See [API: Genetics](/docs/api/dna/generate) for full API documentation.
