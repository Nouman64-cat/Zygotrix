---
sidebar_position: 5
---

# Breeding Simulation

Simulate multi-generation breeding experiments to study inheritance patterns.

## Overview

Create breeding simulations that track traits across multiple generations.

## Creating a Simulation

```bash
curl -X POST http://localhost:8000/api/genetics/breeding/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "parent1": {"genotype": "AaBb", "name": "Parent 1"},
    "parent2": {"genotype": "AaBb", "name": "Parent 2"},
    "generations": 3,
    "offspring_per_cross": 4
  }'
```

## Simulation Results

The simulation returns:
- F1, F2, F3... generation offspring
- Genotype frequencies
- Phenotype ratios
- Statistical analysis

## Use Cases

### Hardy-Weinberg Equilibrium

Study allele frequency changes over generations.

### Selection Pressure

Simulate natural or artificial selection.

### Genetic Drift

Observe random changes in small populations.

## Using with Zygotrix AI

> **You:** Simulate breeding Aa × Aa for 5 generations with 10 offspring each
>
> **Zygotrix AI:** Running breeding simulation...
> 
> **F1 Generation:**
> - AA: 2 (20%)
> - Aa: 5 (50%)
> - aa: 3 (30%)
> 
> **F5 Generation:**
> [Results with statistical analysis]
