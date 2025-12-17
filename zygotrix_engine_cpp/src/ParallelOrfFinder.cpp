#include "ParallelOrfFinder.hpp"
#include "ThreadPool.hpp"
#include <algorithm>
#include <future>
#include <iostream>

std::vector<ORFResult> ParallelOrfFinder::findOrfsInChunk(
    const std::string& rna_sequence,
    size_t start_pos,
    size_t end_pos
) {
    std::vector<ORFResult> orfs;
    const size_t seq_len = rna_sequence.length();

    // Scan through the chunk looking for start codons (AUG)
    for (size_t i = start_pos; i < end_pos && i + 2 < seq_len; ++i) {
        std::string codon = rna_sequence.substr(i, 3);

        // Found a start codon
        if (codon == "AUG") {
            std::vector<std::string> amino_acids_3letter;
            std::string amino_acids_1letter;
            size_t orf_start = i;
            size_t j = i;

            // Read codons from this start position until a stop codon
            while (j + 2 < seq_len) {
                std::string current_codon = rna_sequence.substr(j, 3);

                auto it = codon_table.find(current_codon);
                if (it != codon_table.end()) {
                    AminoAcid aa = it->second;

                    // Stop at stop codon
                    if (aa == AminoAcid::STOP) {
                        // Only add ORFs that have at least one amino acid
                        if (!amino_acids_3letter.empty()) {
                            ORFResult orf;
                            orf.start_position = orf_start;
                            orf.end_position = j + 3;

                            // Build 3-letter format
                            std::string protein_3letter;
                            for (size_t k = 0; k < amino_acids_3letter.size(); ++k) {
                                protein_3letter += amino_acids_3letter[k];
                                if (k < amino_acids_3letter.size() - 1) {
                                    protein_3letter += "-";
                                }
                            }
                            orf.protein_3letter = protein_3letter;
                            orf.protein_1letter = amino_acids_1letter;
                            orf.length = amino_acids_3letter.size();

                            orfs.push_back(orf);
                        }
                        break;
                    }

                    amino_acids_3letter.push_back(get_amino_name(aa));
                    amino_acids_1letter += get_amino_char(aa);
                } else {
                    // Unknown codon - skip this ORF
                    break;
                }

                j += 3;
            }
        }
    }

    return orfs;
}

std::vector<ORFResult> ParallelOrfFinder::findOrfs(const std::string& rna_sequence) {
    return findOrfsInChunk(rna_sequence, 0, rna_sequence.length());
}

std::vector<ORFResult> ParallelOrfFinder::findOrfsWithPool(
    const std::string& rna_sequence,
    ThreadPool& pool
) {
    const size_t seq_len = rna_sequence.length();

    std::cerr << "[OrfFinder] Starting ORF search: " << seq_len << " bp sequence" << std::endl;

    // For small sequences, use single-threaded processing
    if (seq_len < MIN_PARALLEL_LENGTH) {
        std::cerr << "[OrfFinder] Sequence too short for parallel processing, using single-threaded mode" << std::endl;
        return findOrfs(rna_sequence);
    }

    // Determine number of chunks based on pool size
    size_t num_chunks = pool.getThreadCount();

    std::cerr << "[OrfFinder] Splitting sequence into " << num_chunks << " chunks for thread pool" << std::endl;

    // Calculate chunk size with overlap to handle ORFs spanning chunk boundaries
    // Overlap of 300 bases (100 codons) should be sufficient for most ORFs
    const size_t OVERLAP = 300;
    size_t base_chunk_size = seq_len / num_chunks;

    // Submit tasks to the thread pool
    std::vector<std::future<std::vector<ORFResult>>> futures;
    futures.reserve(num_chunks);

    for (size_t i = 0; i < num_chunks; ++i) {
        size_t start_pos = i * base_chunk_size;
        size_t end_pos;

        if (i == num_chunks - 1) {
            // Last chunk goes to the end
            end_pos = seq_len;
        } else {
            // Add overlap for chunks that aren't the last
            end_pos = std::min((i + 1) * base_chunk_size + OVERLAP, seq_len);
        }

        std::cerr << "[OrfFinder] Submitting chunk " << i << " to pool: positions "
                  << start_pos << "-" << end_pos << " (" << (end_pos - start_pos) << " bp)" << std::endl;

        // Capture by value for thread safety
        futures.push_back(pool.submit(
            [&rna_sequence, start_pos, end_pos]() {
                return findOrfsInChunk(rna_sequence, start_pos, end_pos);
            }
        ));
    }

    std::cerr << "[OrfFinder] All " << num_chunks << " tasks submitted, waiting for results..." << std::endl;

    // Collect results
    std::vector<ORFResult> all_orfs;

    for (size_t i = 0; i < futures.size(); ++i) {
        std::cerr << "[OrfFinder] Collecting results from chunk " << i << std::endl;
        std::vector<ORFResult> chunk_orfs = futures[i].get();
        std::cerr << "[OrfFinder] Chunk " << i << " found " << chunk_orfs.size() << " ORFs" << std::endl;
        all_orfs.insert(all_orfs.end(), chunk_orfs.begin(), chunk_orfs.end());
    }

    std::cerr << "[OrfFinder] Total ORFs before deduplication: " << all_orfs.size() << std::endl;

    // Remove duplicates (ORFs found in overlapping regions)
    // Sort by start position first
    std::sort(all_orfs.begin(), all_orfs.end(),
        [](const ORFResult& a, const ORFResult& b) {
            return a.start_position < b.start_position;
        }
    );

    // Remove duplicates (same start and end position)
    auto it = std::unique(all_orfs.begin(), all_orfs.end(),
        [](const ORFResult& a, const ORFResult& b) {
            return a.start_position == b.start_position &&
                   a.end_position == b.end_position;
        }
    );
    all_orfs.erase(it, all_orfs.end());

    std::cerr << "[OrfFinder] ORF search complete: " << all_orfs.size() << " unique ORFs found" << std::endl;

    return all_orfs;
}
