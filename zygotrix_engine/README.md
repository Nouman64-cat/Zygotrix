# Zygotrix Engine

Zygotrix Engine is a lightweight genetics toolkit that powers Mendelian and polygenic simulations. It bundles a small trait registry, probability helpers, and a high-level simulator for composing inheritance scenarios in Python.

## Features
- **Trait modelling**: Define diploid traits with allele validation, canonical genotypes, and phenotype mapping (`Trait`).
- **Mendelian inheritance**: Calculate offspring genotype and phenotype probabilities using Punnett-like logic (`MendelianCalculator`).
- **Polygenic scoring**: Derive expected additive polygenic scores from parental SNP dosages (`PolygenicCalculator`).
- **Simulation orchestration**: Run bundled traits or custom registries through a single interface (`Simulator`).
- **Probability utilities**: Normalise, convert to percentages, and sample from arbitrary distributions (`utils`).

## Installation

The engine targets Python 3.10+ and has no third-party runtime dependencies.

From the project root:

```bash
pip install -e zygotrix_engine
```

Or within the package directory:

```bash
cd zygotrix_engine
pip install -e .
```

If you prefer an isolated environment:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -e zygotrix_engine
```

## Quick Start

```python
from zygotrix_engine import Simulator

sim = Simulator()

parent1 = {"eye_color": "Bb", "blood_type": "AO", "hair_color": "Hh"}
parent2 = {"eye_color": "bb", "blood_type": "BO", "hair_color": "hh"}

phenotype_percentages = sim.simulate_mendelian_traits(
    parent1,
    parent2,
    as_percentages=True,
)

for trait_key, distribution in phenotype_percentages.items():
    print(trait_key, distribution)
```

_Output_
```
eye_color {'Brown': 50.0, 'Blue': 50.0}
blood_type {'A': 25.0, 'B': 25.0, 'AB': 25.0, 'O': 25.0}
hair_color {'Brown': 50.0, 'Blonde': 50.0}
```

## Working With Traits

The package ships with a minimal trait registry (`eye_color`, `blood_type`, `hair_color`). You can register your own `Trait` instances to extend the simulation:

```python
from zygotrix_engine import Trait, Simulator

COAT_COLOR = Trait(
    name="Coat Color",
    alleles=("B", "b"),
    phenotype_map={"BB": "Black", "Bb": "Black", "bb": "Brown"},
    description="Simplified coat color example.",
)

sim = Simulator(trait_registry={"coat_color": COAT_COLOR})
parent1 = {"coat_color": "Bb"}
parent2 = {"coat_color": "bb"}

print(sim.simulate_mendelian_traits(parent1, parent2))
# {'coat_color': {'Black': 0.5, 'Brown': 0.5}}
```

## Polygenic Scores

Polygenic scores aggregate allele dosages using additive weights:

```python
from zygotrix_engine import PolygenicCalculator

calculator = PolygenicCalculator()
parent1 = {"rs1": 1.0, "rs2": 0.0}
parent2 = {"rs1": 2.0, "rs2": 0.0}
weights = {"rs1": 0.6, "rs2": -0.2}

score = calculator.calculate_polygenic_score(parent1, parent2, weights)
print(score)  # 0.9
```

## Utilities

`zygotrix_engine.utils` exposes helpers that support the calculators:
- `normalize_probabilities(mapping)` ensures weights sum to 1.0.
- `to_percentage_distribution(mapping)` converts probabilities to 0-100.
- `sample_from_distribution(mapping, rng=None)` draws outcomes from a distribution.

## Running Tests

```bash
pip install -e zygotrix_engine
pip install pytest
pytest
```

The test suite currently focuses on Mendelian probability calculations (`tests/test_mendelian.py`).

## License

This package is distributed under the terms specified in the project's root `LICENSE` file.