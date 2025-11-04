#pragma once

#include "zygotrix/Engine.hpp"
#include <random>
#include <unordered_map>
#include <vector>

namespace zygotrix {

/**
 * Responsible for generating gametes from parent individuals.
 * Handles chromosome segregation, linkage groups, and recombination.
 */
class GameteGenerator {
public:
    /**
     * Generates a gamete from a parent individual.
     * @param parent The parent individual
     * @param sex The sex of the parent
     * @param genes List of all gene definitions
     * @param linkageMap Map of linkage group IDs to genes in that group
     * @param rng Random number generator
     * @return Generated gamete
     */
    static Gamete generate(
        const Individual& parent,
        Sex sex,
        const std::vector<GeneDefinition>& genes,
        const std::unordered_map<std::size_t, std::vector<const GeneDefinition*>>& linkageMap,
        std::mt19937& rng);

private:
    /**
     * Generates alleles for a linkage group, handling recombination.
     */
    static void generateGameteForGroup(
        const std::vector<const GeneDefinition*>& group,
        const Individual& parent,
        Gamete& gamete,
        bool parentPassesX,
        std::mt19937& rng);
};

}  // namespace zygotrix
