#ifndef DNA_GENERATOR_HPP
#define DNA_GENERATOR_HPP

#include <string>
#include <random>

/**
 * @class DnaGenerator
 * @brief Generates random DNA sequences with configurable GC content.
 *
 * Uses the Mersenne Twister engine (std::mt19937) for high-quality
 * random number generation suitable for genomic simulations.
 */
class DnaGenerator {
private:
    std::mt19937 rng; // Mersenne Twister engine (fast & high quality)

public:
    /**
     * @brief Constructs a DnaGenerator with a random seed.
     */
    DnaGenerator();

    /**
     * @brief Constructs a DnaGenerator with a specific seed.
     * @param seed The seed value for reproducible sequences.
     */
    explicit DnaGenerator(unsigned int seed);

    /**
     * @brief Generates a random DNA sequence.
     * @param length The number of base pairs (bp) to generate.
     * @param gc_content A float between 0.0 and 1.0 representing the
     *                   proportion of G and C nucleotides (e.g., 0.5 for 50%).
     * @return A string containing the generated DNA sequence (A, T, G, C).
     * @throws std::invalid_argument if gc_content is not in [0.0, 1.0].
     */
    std::string generate(size_t length, double gc_content);

    /**
     * @brief Reseeds the random number generator.
     * @param seed The new seed value.
     */
    void reseed(unsigned int seed);
};

#endif // DNA_GENERATOR_HPP
