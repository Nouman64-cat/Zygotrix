#pragma once

#include "zygotrix/Engine.hpp"
#include <unordered_map>

namespace zygotrix {

/**
 * Strategy interface for expressing phenotypes based on dominance patterns.
 */
class IDominanceStrategy {
public:
    virtual ~IDominanceStrategy() = default;

    /**
     * Expresses phenotype for a gene based on its dominance pattern.
     * @param gene The gene definition
     * @param allele1 First allele definition
     * @param allele2 Second allele definition
     * @param phenotype The phenotype to update
     */
    virtual void express(
        const GeneDefinition& gene,
        const AlleleDefinition& allele1,
        const AlleleDefinition& allele2,
        Phenotype& phenotype) const = 0;
};

/**
 * Strategy for complete dominance.
 * Expresses the more dominant allele's effects.
 */
class CompleteDominanceStrategy : public IDominanceStrategy {
public:
    void express(
        const GeneDefinition& gene,
        const AlleleDefinition& allele1,
        const AlleleDefinition& allele2,
        Phenotype& phenotype) const override;
};

/**
 * Strategy for codominance.
 * Both alleles are expressed together.
 */
class CodominanceStrategy : public IDominanceStrategy {
public:
    void express(
        const GeneDefinition& gene,
        const AlleleDefinition& allele1,
        const AlleleDefinition& allele2,
        Phenotype& phenotype) const override;
};

/**
 * Strategy for incomplete dominance.
 * Alleles blend together based on blend weight.
 */
class IncompleteDominanceStrategy : public IDominanceStrategy {
public:
    void express(
        const GeneDefinition& gene,
        const AlleleDefinition& allele1,
        const AlleleDefinition& allele2,
        Phenotype& phenotype) const override;
};

/**
 * Factory for creating dominance strategies.
 */
class DominanceStrategyFactory {
public:
    static const IDominanceStrategy& getStrategy(DominancePattern pattern);

private:
    static CompleteDominanceStrategy completeStrategy_;
    static CodominanceStrategy codominantStrategy_;
    static IncompleteDominanceStrategy incompleteStrategy_;
};

}  // namespace zygotrix
