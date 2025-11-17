#pragma once

#include "zygotrix/Engine.hpp"
#include <unordered_map>
#include <vector>

namespace zygotrix {

/**
 * Base class for phenotype modifiers using Chain of Responsibility pattern.
 */
class IPhenotypeModifier {
public:
    virtual ~IPhenotypeModifier() = default;

    /**
     * Applies modifications to the phenotype.
     * @param individual The individual whose phenotype is being modified
     * @param phenotype The phenotype to modify
     */
    virtual void apply(const Individual& individual, Phenotype& phenotype) const = 0;
};

/**
 * Applies epistasis rules to phenotypes.
 */
class EpistasisModifier : public IPhenotypeModifier {
public:
    explicit EpistasisModifier(const std::vector<EpistasisRule>& rules)
        : rules_(rules) {}

    void apply(const Individual& individual, Phenotype& phenotype) const override;

private:
    const std::vector<EpistasisRule>& rules_;
};

/**
 * Applies specific phenotype overrides for cat coat color genetics.
 * This handles special cases like dominant white masking and tortoiseshell patterns.
 */
class CatCoatOverrideModifier : public IPhenotypeModifier {
public:
    explicit CatCoatOverrideModifier(
        const std::unordered_map<std::string, const GeneDefinition*>& geneIndex)
        : geneIndex_(geneIndex) {}

    void apply(const Individual& individual, Phenotype& phenotype) const override;

private:
    const std::unordered_map<std::string, const GeneDefinition*>& geneIndex_;
};

/**
 * Combines linked traits into composite trait descriptions.
 */
class LinkageTraitModifier : public IPhenotypeModifier {
public:
    explicit LinkageTraitModifier(
        const std::unordered_map<std::size_t, std::vector<const GeneDefinition*>>& linkageMap,
        const std::unordered_map<std::size_t, std::vector<std::string>>& linkageTraitIds)
        : linkageMap_(linkageMap), linkageTraitIds_(linkageTraitIds) {}

    void apply(const Individual& individual, Phenotype& phenotype) const override;

private:
    const std::unordered_map<std::size_t, std::vector<const GeneDefinition*>>& linkageMap_;
    const std::unordered_map<std::size_t, std::vector<std::string>>& linkageTraitIds_;
};

}  // namespace zygotrix
