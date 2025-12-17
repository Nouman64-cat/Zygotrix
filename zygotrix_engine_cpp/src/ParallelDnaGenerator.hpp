#ifndef DNA_GENERATOR_PARALLEL_HPP
#define DNA_GENERATOR_PARALLEL_HPP

#include <string>
#include <random>
#include <thread>
#include <vector>
#include <future>

class ThreadPool;

class ParallelDnaGenerator {
public:
    /**
     * @brief Default constructor.
     * Uses hardware concurrency for thread count.
     */
    ParallelDnaGenerator();

    /**
     * @brief Constructor with explicit thread count.
     * @param num_threads Number of threads to use for generation.
     */
    explicit ParallelDnaGenerator(unsigned int num_threads);

    /**
     * @brief Constructor with explicit seed.
     * @param seed Base seed for reproducibility.
     * @param num_threads Number of threads to use.
     */
    ParallelDnaGenerator(unsigned int seed, unsigned int num_threads);

    /**
     * @brief Generates a random DNA sequence using parallel threads.
     * Splits the work across multiple threads for faster generation.
     * @param length The number of base pairs (A, T, C, G).
     * @param gc_content Probability of G or C (0.0 to 1.0).
     * @return A string containing the DNA sequence.
     */
    std::string generate(size_t length, double gc_content);

    /**
     * @brief Generates a random DNA sequence using the global ThreadPool.
     * This is the preferred method for server environments as it reuses threads
     * instead of creating new ones for each request.
     * @param length The number of base pairs (A, T, C, G).
     * @param gc_content Probability of G or C (0.0 to 1.0).
     * @param pool Reference to the thread pool to use.
     * @return A string containing the DNA sequence.
     */
    std::string generateWithPool(size_t length, double gc_content, ThreadPool& pool);

    /**
     * @brief Sets the base seed for reproducible generation.
     * Each thread uses base_seed + thread_id for determinism.
     * @param seed The base seed value.
     */
    void setSeed(unsigned int seed);

    /**
     * @brief Get the number of threads being used.
     */
    unsigned int getThreadCount() const { return num_threads_; }

private:
    unsigned int num_threads_;
    unsigned int base_seed_;
    bool use_seed_;

    /**
     * @brief Generate a chunk of DNA sequence (called by each thread).
     * @param length Length of this chunk.
     * @param gc_content GC content ratio.
     * @param seed Seed for this specific thread.
     * @return Generated DNA chunk.
     */
    static std::string generateChunk(size_t length, double gc_content, unsigned int seed);
};

#endif // DNA_GENERATOR_PARALLEL_HPP
