#ifndef PARALLEL_ORF_FINDER_HPP
#define PARALLEL_ORF_FINDER_HPP

#include <string>
#include <vector>
#include "GeneticCode.hpp"

class ThreadPool;

/**
 * @brief Structure to hold ORF (Open Reading Frame) data.
 */
struct ORFResult {
    size_t start_position;
    size_t end_position;
    std::string protein_3letter;
    std::string protein_1letter;
    size_t length;
};

/**
 * @brief Parallel ORF (Open Reading Frame) finder optimized for concurrent processing.
 *
 * This class provides both single-threaded and thread-pool based ORF scanning.
 * For single-core servers, the thread pool approach provides concurrency through
 * task queuing, allowing multiple requests to be processed efficiently.
 */
class ParallelOrfFinder {
public:
    /**
     * @brief Default constructor.
     */
    ParallelOrfFinder() = default;

    /**
     * @brief Find all ORFs in an RNA sequence (single-threaded).
     * @param rna_sequence The RNA sequence to scan (using AUG as start codon).
     * @return Vector of ORF results.
     */
    std::vector<ORFResult> findOrfs(const std::string& rna_sequence);

    /**
     * @brief Find all ORFs using the thread pool for concurrent processing.
     *
     * This method divides the sequence into chunks and processes them
     * concurrently. On a single-core server, this provides concurrency
     * through task scheduling rather than parallelism.
     *
     * @param rna_sequence The RNA sequence to scan.
     * @param pool Reference to the thread pool.
     * @return Vector of ORF results sorted by start position.
     */
    std::vector<ORFResult> findOrfsWithPool(const std::string& rna_sequence, ThreadPool& pool);

    /**
     * @brief Minimum sequence length for parallel processing.
     * Sequences shorter than this use single-threaded processing.
     */
    static constexpr size_t MIN_PARALLEL_LENGTH = 10000; // 10K bp

private:
    /**
     * @brief Find ORFs in a chunk of the sequence.
     * @param rna_sequence The full RNA sequence.
     * @param start_pos Starting position in the sequence.
     * @param end_pos Ending position in the sequence.
     * @return Vector of ORF results found in this chunk.
     */
    static std::vector<ORFResult> findOrfsInChunk(
        const std::string& rna_sequence,
        size_t start_pos,
        size_t end_pos
    );
};

#endif // PARALLEL_ORF_FINDER_HPP
