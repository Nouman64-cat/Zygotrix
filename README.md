# Zygotrix

## Zygotrix Engine

The Zygotrix engine is developed in **C++** because the engine is responsible for pure computational workflows and ultimately responsible solely for computational outcomes.

---

### Stochastic Simulation Engine

The "Stochastic" here means **"random"**. The `src/Engine.cpp` component of the Zygotrix project is designed as a stochastic simulation engine. This means it models genetic inheritance by mimicking biological processes through random chance, producing one unique outcome per "run" or "simulation."

---

### Why is it "Stochastic"?

The engine's stochastic nature stems directly from its implementation, which heavily relies on random number generation to model the inherent unpredictability of biological events:

1.  **Random Number Generation:** The engine explicitly uses the C++ `<random>` library, employing a `std::mt19937` (Mersenne Twister) random number generator.

2.  **Random Gamete Selection:** During gamete formation, `std::bernoulli_distribution(0.5)` is used to randomly select which of a parent's two alleles will be passed on, reflecting Mendelian segregation.

3.  **Random Sex Determination:** For sex-linked traits, `std::bernoulli_distribution(0.5)` is used to randomly determine the sex of the offspring,
    typically representing the 50/50 chance of inheriting an X or Y chromosome from the paternal gamete.

4.  **Random Crossover Events:** For linked genes, `std::bernoulli_distribution(gene->recombinationProbability)` is employed to model the random occurrence of genetic recombination (crossover) between loci, based on their defined recombination frequency.

---

### Confidence in Results

While a single run of the Engine is just one random outcome, confidence in the Engine's overall behavior comes from the **Law of Large Numbers**.

#### Use Case Validation: ABO Blood Group Simulation

To illustrate this, we examined a cross for the ABO blood group system with 5000 simulations:

- **Parent A Genotype:** `BA` (Gametes: 50% `B`, 50% `A`)
- **Parent B Genotype:** `OO` (Gametes: 100% `O`)

This cross produces two expected genotypes (`BO` and `AO`) and two expected phenotypes (Blood Type B and Blood Type A), each with a 50% probability.

#### Simulation Validation: Expected vs. Actual Results (5000 Runs)

| Metric                       | Expected Count | Expected % | Actual Count | Actual % |
| :--------------------------- | :------------- | :--------- | :----------- | :------- |
| Blood Type A (Genotype `AO`) | 2500           | 50.00%     | 2479         | 49.58%   |
| Blood Type B (Genotype `BO`) | 2500           | 50.00%     | 2521         | 50.42%   |
| **Total Phenotype**          | **5000**       | **100%**   | **5000**     | **100%** |
| Female                       | 2500           | 50.00%     | 2531         | 50.62%   |
| Male                         | 2500           | 50.00%     | 2469         | 49.38%   |
| **Total Sex**                | **5000**       | **100%**   | **5000**     | **100%** |

#### Conclusion from Actual Results

The actual results from 5000 simulations are perfectly consistent with the expected probabilistic outcomes and validate the stochastic nature of the Engine:

- The observed frequencies for Blood Type A (**49.58%**) and Blood Type B (**50.42%**) are extremely close to the theoretical 50%/50% split.
- Similarly, the observed sex ratios (Female: **50.62%**, Male: **49.38%**) are nearly identical to the expected 50%/50%.
- The minor deviations from the exact 2500/2500 split are precisely what is anticipated from random sampling in a stochastic simulation. These variations demonstrate that the engine is indeed introducing randomness while accurately reflecting the underlying biological probabilities over a sufficient number of trials.

## Deterministic Probabilistic Engine

The `src/MendelianCalculator.cpp` is the deterministic probabilistic engine. Its purpose is opposite of the `stochastic simulation engine` instead of simulating one random outcome, it calculates the exact, unchanging probabilities for all possible offspring from a genetic cross.

`It is, in effect, a perfect, automated Punnett square.`

### Why is it "Deterministic"?

The engine is **deterministic** because its operation is based entirely on mathematical calculations. Given the same two parents, it will produce the exact same set of probabilities every single time, with zero randomness.

1. **No Randomness:** The file does not include the C++ `<random>` library. Its logic is purely mathematical and predictable.
2. **Calculates, Not Simulates:** Its functions do not "pick" a random outcome. They calculate the odds for all outcomes.
3. `getGameteProbabilities:` This function doesn't randomly choose one gamete. It returns a map of all possible gametes and their precise probabilities (e.g., a `Bb` parent deterministically produces a map of `{"B": 0.5, "b": 0.5}`).
4. `combineGametes:` This function mathematically performs the Punnett square. It multiplies the probabilities of the parent gametes `(combinedProb = prob1 * prob2)` to get the exact probability for each resulting genotype.
5. `genotypesToPhenotypes:` This function aggregates the probabilities of different genotypes that lead to the same phenotype `(e.g., adding the 25% chance of "BB" and 50% chance of "Bb" to get a 75% chance of "Brown")`. This is a simple summation, not a simulation.

## Stochastic vs. Deterministic

- `Engine` **(Stochastic):** Simulates one random outcome. `(e.g., "Child 1 has Blood Type A")`.

- `MendelianCalculator` (**Deterministic):** Calculates the set of all probabilities for any outcome. `(e.g., "There is a 50% chance of a child having Blood Type A").`

## Blueprint `Engine.hpp`

In short, `Engine.hpp` is the foundational blueprint for the entire genetic model. It defines both the "language" (the data structures) that the entire project speaks and the "public API" (the class declaration) for the stochastic simulation engine.

Here are its specific roles:

---

### 1. Defines the Core Data "Language"

This is its most important job. `Engine.hpp` defines all the `enum class` and `struct` types that represent the genetic concepts. These structs are the data containers used by every part of the project:

- `EngineConfig`: The top-level struct that holds the entire genetic setup.
- `GeneDefinition`: Defines a single gene, its chromosome, dominance pattern, and alleles.
- `AlleleDefinition`: Defines a specific allele and its effects.
- `AlleleEffect`: Defines how an allele impacts a specific trait.
- `EpistasisRule`: Defines how one gene can mask or modify another.
- `Individual`: Defines what constitutes a parent or child (their `Sex` and genotype).

Every other file—`Engine.cpp`, `MendelianCalculator.cpp`, and `CrossCli.cpp`—includes `Engine.hpp` so they can create, read, and understand these data structures.

---

### 2. Declares the Engine Class API

This is its second role. It provides the public "contract" or "interface" for the stochastic `Engine` class, telling other files what functions they can call. This includes:

- `explicit Engine(EngineConfig config)`: The constructor, showing that the `Engine` is built from a configuration.
- `Individual mate(...)`: The public function for simulating a single, random offspring.
- `Phenotype expressPhenotype(...)`: The public function for translating a genotype into its physical traits.

`Engine.cpp` then provides the implementation for these declared functions.

---

### 3. Acts as the Central Configuration Hub

Because `Engine.hpp` defines both the `EngineConfig` struct and the `Engine` class that holds it, it establishes the `Engine` class as the central owner of the genetic rules.

This is why `MendelianCalculator.hpp` also includes `Engine.hpp`. The `MendelianCalculator`'s constructor takes a `const Engine&` not because it needs to run the stochastic simulation, but because it needs to read the `EngineConfig` (all the gene definitions and rules) that the `Engine` object is holding.

---

**In summary:** `Engine.hpp` is the central header file for the entire `zygotrix_engine` library. It defines all the data structures that represent the genetic model and declares the public functions for the stochastic simulation engine.
