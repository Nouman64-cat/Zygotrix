#include <iostream>
#include "DnaGenerator.hpp"

int main() {
    DnaGenerator gen;

    // Generate 100 base pairs with 60% GC content
    std::string dna1 = gen.generate(100, 0.6);
    std::cout << ">Random_Sequence_GC_60" << std::endl;
    std::cout << dna1 << std::endl;

    // Generate 50 base pairs with 50% GC content (balanced)
    std::string dna2 = gen.generate(50, 0.5);
    std::cout << "\n>Random_Sequence_GC_50" << std::endl;
    std::cout << dna2 << std::endl;

    // Generate AT-rich sequence (20% GC)
    std::string dna3 = gen.generate(80, 0.2);
    std::cout << "\n>AT_Rich_Sequence_GC_20" << std::endl;
    std::cout << dna3 << std::endl;

    // Generate GC-rich sequence (80% GC)
    std::string dna4 = gen.generate(80, 0.8);
    std::cout << "\n>GC_Rich_Sequence_GC_80" << std::endl;
    std::cout << dna4 << std::endl;

    // Reproducible sequence with explicit seed
    DnaGenerator seeded_gen(42);
    std::string reproducible = seeded_gen.generate(30, 0.5);
    std::cout << "\n>Reproducible_Sequence_Seed_42" << std::endl;
    std::cout << reproducible << std::endl;

    return 0;
}
