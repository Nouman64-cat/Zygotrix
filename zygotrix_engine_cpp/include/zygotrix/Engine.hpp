#pragma once

#include <optional>
#include <random>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

namespace zygotrix {

enum class DominancePattern {
    Complete,
    Codominant,
    Incomplete
};

enum class ChromosomeType {
    Autosomal,
    X,
    Y
};

enum class Sex {
    Male,
    Female
};

enum class EpistasisAction {
    MaskTrait,
    ModifyTraitValue
};

enum class AlleleRequirement {
    Present,
    Homozygous,
    Heterozygous,
    Hemizygous
};

struct TraitExpression {
    double quantitative{0.0};
    std::vector<std::string> descriptors;

    void add(double value, const std::string& descriptor);
    std::string summary() const;
};

struct AlleleEffect {
    std::string traitId;
    double magnitude{0.0};
    std::string description;
    std::string intermediateDescriptor;
};

struct AlleleDefinition {
    std::string id;
    int dominanceRank{0};
    std::vector<AlleleEffect> effects;
};

struct GeneDefinition {
    std::string id;
    ChromosomeType chromosome{ChromosomeType::Autosomal};
    DominancePattern dominance{DominancePattern::Complete};
    std::optional<std::size_t> linkageGroup;
    double recombinationProbability{0.5};
    double incompleteBlendWeight{0.5};
    std::string defaultAlleleId;
    std::vector<AlleleDefinition> alleles;
};

struct EpistasisRule {
    std::string regulatorGene;
    std::string triggeringAllele;
    AlleleRequirement requirement{AlleleRequirement::Present};
    EpistasisAction action{EpistasisAction::MaskTrait};
    std::string targetTrait;
    double modifier{1.0};
    std::string overrideDescription;
    double overrideValue{0.0};
};

using Genotype = std::vector<std::string>;

struct Individual {
    Sex sex{Sex::Female};
    std::unordered_map<std::string, Genotype> genotype;
};

struct EngineConfig {
    std::vector<GeneDefinition> genes;
    std::vector<EpistasisRule> epistasis;
};

struct Phenotype {
    std::unordered_map<std::string, TraitExpression> traits;
};

struct Gamete {
    std::unordered_map<std::string, std::string> alleles;
    bool carriesX{false};
    bool carriesY{false};
};

class Engine {
public:
    explicit Engine(EngineConfig config);

    Individual createIndividual(Sex sex,
                                const std::unordered_map<std::string, Genotype>& genotype) const;

    Individual mate(const Individual& firstParent,
                    const Individual& secondParent) const;

    Phenotype expressPhenotype(const Individual& individual) const;

    const EngineConfig& config() const { return config_; }

private:
    const GeneDefinition* findGene(const std::string& geneId) const;
    const GeneDefinition& requireGene(const std::string& geneId) const;
    const AlleleDefinition& requireAllele(const GeneDefinition& gene,
                                          const std::string& alleleId) const;
    Genotype normalizedGenotype(const GeneDefinition& gene,
                                const Genotype& provided,
                                Sex sex) const;

    Gamete generateGamete(
        const Individual& parent,
        Sex sex,
        std::mt19937& rng) const;

    void generateGameteForGroup(const std::vector<const GeneDefinition*>& group,
                                const Individual& parent,
                                Gamete& gamete,
                                bool parentPassesX,
                                std::mt19937& rng) const;

    void applyEpistasis(const Individual& individual,
                        Phenotype& phenotype) const;
    void applyPhenotypeOverrides(const Individual& individual,
                                 Phenotype& phenotype) const;
    void applyLinkageTraits(Phenotype& phenotype) const;

    std::unordered_map<std::size_t, std::vector<const GeneDefinition*>> linkageMap_;
    std::unordered_map<std::size_t, std::vector<std::string>> linkageTraitIds_;
    std::unordered_map<std::string, const GeneDefinition*> geneIndex_;
    std::unordered_map<std::string,
        std::unordered_map<std::string, const AlleleDefinition*>> alleleIndex_;
    EngineConfig config_;
};

}  // namespace zygotrix
