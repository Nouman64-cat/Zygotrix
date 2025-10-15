# Zygotrix Engine (C++)

This C++ engine simulates Mendelian inheritance while surfacing nine classical genetics principles. It provides a reusable library (`zygotrix_engine`) and a sample program (`zyg_demo`) that demonstrates each concept.

## Building

The project uses CMake.

```bash
cmake -S . -B build
cmake --build build
```

On Windows with Visual Studio generators, replace the second command with `cmake --build build --config Release`.

## Running the demo

After building, execute the demo application to generate several random offspring and inspect their phenotypes.

```bash
./build/zyg_demo
```

The output lists the child's sex, quantitative trait score, and qualitative descriptors aggregated from expressed alleles.

## Genetic principles covered

- **Law of segregation** - `Engine::mate` forms gametes that contribute one allele per gene from each parent before combining them into the child genotype.
- **Law of independent assortment** - Unlinked genes (no `linkageGroup`) are sampled independently when gametes are produced.
- **Dominance and recessiveness** - `DominancePattern::Complete` genes evaluate allele `dominanceRank` values to decide which allele expresses (e.g., `fur_color` in the demo).
- **Codominance** - `DominancePattern::Codominant` delivers full, parallel expression of both alleles for heterozygotes (`blood_type`).
- **Incomplete dominance** - `DominancePattern::Incomplete` blends allele effects using `incompleteBlendWeight` (`flower_color`).
- **Linkage** - Genes sharing a `linkageGroup` inherit together, with crossover frequency managed by `recombinationProbability` (`linked_color` and `linked_pattern`).
- **Sex-linked traits** - X-linked genes adjust allele counts by sex; male gametes randomly contribute X or Y (`vision`).
- **Pleiotropy** - Single genes may affect multiple traits because each allele lists several `AlleleEffect` entries (`growth` contributes to `height` and `weight`).
- **Epistasis** - `EpistasisRule` instances can mask or scale traits when specific genotypes appear (`pigment_gate` masks `coat_color` when `ee`).

In addition, each `GeneDefinition` can enumerate any number of alleles, enabling multi-allelic loci such as the ABO blood group. Multiple genes can contribute effects to the same trait id, so traits may exhibit fully polygenic behaviour.

## Extending the engine

- Add new genes by appending `GeneDefinition` entries to the configuration.
- Model complex interactions by adding more `EpistasisRule` records.
- Tune linkage behaviour per gene using real-world recombination rates in the `recombinationProbability` field.
