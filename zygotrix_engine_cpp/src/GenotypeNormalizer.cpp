#include "zygotrix/GenotypeNormalizer.hpp"
#include <stdexcept>

namespace zygotrix {

const AlleleDefinition& GenotypeNormalizer::requireAllele(
    const GeneDefinition& gene,
    const std::string& alleleId,
    const std::unordered_map<std::string,
        std::unordered_map<std::string, const AlleleDefinition*>>& alleleIndex) {
    
    auto geneIt = alleleIndex.find(gene.id);
    if (geneIt == alleleIndex.end()) {
        throw std::invalid_argument("Gene '" + gene.id + "' has no allele index.");
    }
    auto alleleIt = geneIt->second.find(alleleId);
    if (alleleIt == geneIt->second.end()) {
        throw std::invalid_argument("Allele '" + alleleId + "' is not defined for gene '" + gene.id + "'");
    }
    return *alleleIt->second;
}

Genotype GenotypeNormalizer::normalize(
    const GeneDefinition& gene,
    const Genotype& provided,
    Sex sex,
    const std::unordered_map<std::string,
        std::unordered_map<std::string, const AlleleDefinition*>>& alleleIndex) {
    
    Genotype result = provided;
    const std::string& defaultAllele = gene.defaultAlleleId;

    auto ensureAlleleExists = [&](const std::string& allele) {
        requireAllele(gene, allele, alleleIndex);
    };

    auto ensureTwoAlleles = [&]() {
        if (result.empty()) {
            result = {defaultAllele, defaultAllele};
        } else if (result.size() == 1) {
            ensureAlleleExists(result.front());
            result.push_back(result.front());
        } else if (result.size() == 2) {
            ensureAlleleExists(result.front());
            ensureAlleleExists(result.back());
        } else {
            throw std::invalid_argument("Autosomal gene '" + gene.id + "' must have one or two alleles.");
        }
    };

    switch (gene.chromosome) {
        case ChromosomeType::Autosomal:
            ensureTwoAlleles();
            break;
        case ChromosomeType::X:
            if (sex == Sex::Female) {
                ensureTwoAlleles();
            } else {
                if (result.empty()) {
                    result = {defaultAllele};
                } else if (result.size() == 1) {
                    ensureAlleleExists(result.front());
                } else {
                    throw std::invalid_argument("Male individual must supply exactly one X-linked allele for gene '" +
                                                gene.id + "'");
                }
            }
            break;
        case ChromosomeType::Y:
            if (sex == Sex::Female) {
                if (!result.empty()) {
                    throw std::invalid_argument("Female individuals cannot carry Y-linked gene '" + gene.id + "'");
                }
            } else {
                if (result.empty()) {
                    result = {defaultAllele};
                } else if (result.size() == 1) {
                    ensureAlleleExists(result.front());
                } else {
                    throw std::invalid_argument("Y-linked gene '" + gene.id + "' must have exactly one allele.");
                }
            }
            break;
    }

    return result;
}

}  // namespace zygotrix
