#pragma once

#include "zygotrix/Engine.hpp"
#include <unordered_map>
#include <string>

namespace zygotrix {

/**
 * Responsible for normalizing genotypes based on gene definitions and sex.
 * Validates alleles and applies default alleles when needed.
 */
class GenotypeNormalizer {
public:
    /**
     * Normalizes a genotype for a specific gene, sex, and allele index.
     * @param gene The gene definition
     * @param provided The provided genotype (may be empty or incomplete)
     * @param sex The sex of the individual
     * @param alleleIndex Map of gene IDs to their allele definitions
     * @return Normalized genotype with proper allele count
     */
    static Genotype normalize(
        const GeneDefinition& gene,
        const Genotype& provided,
        Sex sex,
        const std::unordered_map<std::string,
            std::unordered_map<std::string, const AlleleDefinition*>>& alleleIndex);

private:
    static const AlleleDefinition& requireAllele(
        const GeneDefinition& gene,
        const std::string& alleleId,
        const std::unordered_map<std::string,
            std::unordered_map<std::string, const AlleleDefinition*>>& alleleIndex);
};

}  // namespace zygotrix
