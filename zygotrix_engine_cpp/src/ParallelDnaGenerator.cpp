#include "ParallelDnaGenerator.hpp"
#include "ThreadPool.hpp"
#include <stdexcept>
#include <algorithm>
#include <iostream>

ParallelDnaGenerator::ParallelDnaGenerator()
    : num_threads_(std::max(1u, std::thread::hardware_concurrency()))
    , base_seed_(0)
    , use_seed_(false)
{
}

ParallelDnaGenerator::ParallelDnaGenerator(unsigned int num_threads)
    : num_threads_(std::max(1u, num_threads))
    , base_seed_(0)
    , use_seed_(false)
{
}

ParallelDnaGenerator::ParallelDnaGenerator(unsigned int seed, unsigned int num_threads)
    : num_threads_(std::max(1u, num_threads))
    , base_seed_(seed)
    , use_seed_(true)
{
}

void ParallelDnaGenerator::setSeed(unsigned int seed) {
    base_seed_ = seed;
    use_seed_ = true;
}

std::string ParallelDnaGenerator::generateChunk(size_t length, double gc_content, unsigned int seed) {
    // Each thread has its own RNG instance
    std::mt19937 rng(seed);

    // Calculate probabilities for each nucleotide
    double p_gc = gc_content / 2.0;
    double p_at = (1.0 - gc_content) / 2.0;

    // Create distribution: A, T, G, C
    std::discrete_distribution<> dist({p_at, p_at, p_gc, p_gc});

    const char bases[] = {'A', 'T', 'G', 'C'};

    std::string sequence;
    sequence.reserve(length);

    for (size_t i = 0; i < length; ++i) {
        sequence += bases[dist(rng)];
    }

    return sequence;
}

std::string ParallelDnaGenerator::generate(size_t length, double gc_content) {
    if (gc_content < 0.0 || gc_content > 1.0) {
        throw std::invalid_argument("GC content must be between 0.0 and 1.0");
    }

    // For small sequences, don't bother with threads
    const size_t MIN_PARALLEL_LENGTH = 100000; // 100K bp
    if (length < MIN_PARALLEL_LENGTH || num_threads_ == 1) {
        // Use single-threaded generation
        std::random_device rd;
        unsigned int seed = use_seed_ ? base_seed_ : rd();
        return generateChunk(length, gc_content, seed);
    }

    // Calculate chunk sizes
    size_t chunk_size = length / num_threads_;
    size_t remainder = length % num_threads_;

    // Create seeds for each thread
    std::random_device rd;
    std::vector<unsigned int> seeds(num_threads_);
    for (unsigned int i = 0; i < num_threads_; ++i) {
        seeds[i] = use_seed_ ? (base_seed_ + i) : rd();
    }

    // Launch threads using async (legacy behavior for backwards compatibility)
    std::vector<std::future<std::string>> futures;
    futures.reserve(num_threads_);

    for (unsigned int i = 0; i < num_threads_; ++i) {
        // Add remainder to the last thread
        size_t this_chunk_size = chunk_size + (i == num_threads_ - 1 ? remainder : 0);

        futures.push_back(std::async(
            std::launch::async,
            &ParallelDnaGenerator::generateChunk,
            this_chunk_size,
            gc_content,
            seeds[i]
        ));
    }

    // Collect results and concatenate
    std::string result;
    result.reserve(length);

    for (auto& future : futures) {
        result += future.get();
    }

    return result;
}

std::string ParallelDnaGenerator::generateWithPool(size_t length, double gc_content, ThreadPool& pool) {
    if (gc_content < 0.0 || gc_content > 1.0) {
        throw std::invalid_argument("GC content must be between 0.0 and 1.0");
    }

    std::cerr << "[DnaGenerator] Starting DNA generation: " << length << " bp, GC: " << gc_content << std::endl;

    // For small sequences, don't bother with parallel processing
    const size_t MIN_PARALLEL_LENGTH = 100000; // 100K bp
    if (length < MIN_PARALLEL_LENGTH) {
        std::cerr << "[DnaGenerator] Sequence too short for parallel processing, using single-threaded mode" << std::endl;
        std::random_device rd;
        unsigned int seed = use_seed_ ? base_seed_ : rd();
        return generateChunk(length, gc_content, seed);
    }

    // Get the number of workers from the pool
    size_t num_workers = pool.getThreadCount();

    std::cerr << "[DnaGenerator] Splitting work into " << num_workers << " chunks for thread pool" << std::endl;

    // Calculate chunk sizes
    size_t chunk_size = length / num_workers;
    size_t remainder = length % num_workers;

    // Create seeds for each chunk
    std::random_device rd;
    std::vector<unsigned int> seeds(num_workers);
    for (size_t i = 0; i < num_workers; ++i) {
        seeds[i] = use_seed_ ? (base_seed_ + static_cast<unsigned int>(i)) : rd();
    }

    // Submit tasks to the thread pool
    std::vector<std::future<std::string>> futures;
    futures.reserve(num_workers);

    for (size_t i = 0; i < num_workers; ++i) {
        size_t this_chunk_size = chunk_size + (i == num_workers - 1 ? remainder : 0);

        std::cerr << "[DnaGenerator] Submitting chunk " << i << " to pool: " << this_chunk_size << " bp" << std::endl;

        futures.push_back(pool.submit(
            &ParallelDnaGenerator::generateChunk,
            this_chunk_size,
            gc_content,
            seeds[i]
        ));
    }

    std::cerr << "[DnaGenerator] All " << num_workers << " tasks submitted, waiting for results..." << std::endl;

    // Collect results and concatenate
    std::string result;
    result.reserve(length);

    for (size_t i = 0; i < futures.size(); ++i) {
        std::cerr << "[DnaGenerator] Collecting result from chunk " << i << std::endl;
        result += futures[i].get();
    }

    std::cerr << "[DnaGenerator] DNA generation complete: " << result.length() << " bp" << std::endl;

    return result;
}
