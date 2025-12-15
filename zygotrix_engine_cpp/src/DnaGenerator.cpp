#include "DnaGenerator.hpp"
#include <stdexcept>

DnaGenerator::DnaGenerator() {
    // Seed with random device for non-deterministic sequences
    std::random_device rd;
    rng.seed(rd());
}

DnaGenerator::DnaGenerator(unsigned int seed) : rng(seed) {
    // Constructor with explicit seed for reproducible sequences
}

void DnaGenerator::reseed(unsigned int seed) {
    rng.seed(seed);
}

std::string DnaGenerator::generate(size_t length, double gc_content) {
    if (gc_content < 0.0 || gc_content > 1.0) {
        throw std::invalid_argument("GC content must be between 0.0 and 1.0");
    }

    // Calculate probabilities for each nucleotide
    // GC content is split equally between G and C
    // AT content (1 - GC) is split equally between A and T
    double p_gc = gc_content / 2.0;        // Probability for G or C individually
    double p_at = (1.0 - gc_content) / 2.0; // Probability for A or T individually

    // Create a discrete distribution based on weights
    // Order: A, T, G, C
    std::discrete_distribution<> dist({p_at, p_at, p_gc, p_gc});

    const char bases[] = {'A', 'T', 'G', 'C'};

    std::string sequence;
    sequence.reserve(length); // Pre-allocate memory to avoid re-allocations

    for (size_t i = 0; i < length; ++i) {
        int index = dist(rng);
        sequence += bases[index];
    }

    return sequence;
}
