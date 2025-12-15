#ifndef DNA_GENERATOR_HPP
#define DNA_GENERATOR_HPP

#include <string>
#include <random>

class DnaGenerator {
public:
    /**
     * @brief Default constructor.
     * Seeds the generator with a random device (non-deterministic).
     */
    DnaGenerator();

    /**
     * @brief Constructor with explicit seed.
     * Useful for reproducible simulations (the same seed yields the same DNA).
     * @param seed The seed value.
     */
    DnaGenerator(unsigned int seed);

    /**
     * @brief Resets the random number generator with a new seed.
     * @param seed The new seed value.
     */
    void reseed(unsigned int seed);

    /**
     * @brief Generates a random DNA sequence.
     * @param length The number of base pairs (A, T, C, G).
     * @param gc_content Probability of G or C (0.0 to 1.0).
     * @return A string containing the DNA sequence.
     */
    std::string generate(size_t length, double gc_content);

private:
    // The Mersenne Twister random number engine
    std::mt19937 rng;
};

#endif // DNA_GENERATOR_HPP