#include "zygotrix/Engine.hpp"
#include "zygotrix/GenotypeNormalizer.hpp"
#include "zygotrix/GameteGenerator.hpp"
#include "zygotrix/DominanceStrategy.hpp"
#include "zygotrix/PhenotypeModifier.hpp"

#include <algorithm>
#include <random>
#include <sstream>
#include <stdexcept>
#include <unordered_map>
#include <vector>

namespace zygotrix {

namespace {

std::vector<std::string> gatherTraitIds(const GeneDefinition& gene) {
    std::vector<std::string> traitIds;
    for (const auto& allele : gene.alleles) {
        for (const auto& effect : allele.effects) {
            if (effect.traitId.empty()) {
                continue;
            }
            if (std::find(traitIds.begin(), traitIds.end(), effect.traitId) == traitIds.end()) {
                traitIds.push_back(effect.traitId);
            }
        }
    }
    if (traitIds.empty()) {
        traitIds.push_back(gene.id);
    }
    return traitIds;
}

}  // namespace

void TraitExpression::add(double value, const std::string& descriptor) {
    if (!descriptor.empty()) {
        descriptors.push_back(descriptor);
        return;
    }
    quantitative += value;
}

std::string TraitExpression::summary() const {
    if (descriptors.empty()) {
        std::ostringstream os;
        os << quantitative;
        return os.str();
    }
    std::ostringstream os;
    for (std::size_t i = 0; i < descriptors.size(); ++i) {
        if (i > 0) {
            os << ", ";
        }
        os << descriptors[i];
    }
    return os.str();
}

Engine::Engine(EngineConfig config) : config_(std::move(config)) {
    for (auto& gene : config_.genes) {
        if (gene.alleles.empty()) {
            throw std::invalid_argument("Gene '" + gene.id + "' must define at least one allele.");
        }

        auto& alleleMap = alleleIndex_[gene.id];
        for (auto& allele : gene.alleles) {
            auto [_, inserted] = alleleMap.emplace(allele.id, &allele);
            if (!inserted) {
                throw std::invalid_argument("Duplicate allele id '" + allele.id + "' in gene '" + gene.id + "'");
            }
        }

        if (gene.defaultAlleleId.empty()) {
            gene.defaultAlleleId = gene.alleles.front().id;
        } else if (alleleMap.find(gene.defaultAlleleId) == alleleMap.end()) {
            throw std::invalid_argument("Gene '" + gene.id + "' default allele '" +
                                        gene.defaultAlleleId + "' is not defined.");
        }

        geneIndex_.emplace(gene.id, &gene);
        if (gene.linkageGroup) {
            std::size_t groupId = *gene.linkageGroup;
            linkageMap_[groupId].push_back(&gene);
            auto& traitIds = linkageTraitIds_[groupId];
            for (const auto& traitId : gatherTraitIds(gene)) {
                if (std::find(traitIds.begin(), traitIds.end(), traitId) == traitIds.end()) {
                    traitIds.push_back(traitId);
                }
            }
        }
    }
}

Individual Engine::createIndividual(
    Sex sex,
    const std::unordered_map<std::string, Genotype>& genotype) const {
    Individual individual;
    individual.sex = sex;

    for (const auto& gene : config_.genes) {
        auto provided = genotype.find(gene.id);
        const Genotype empty;
        const Genotype& supplied = provided == genotype.end() ? empty : provided->second;
        individual.genotype[gene.id] = GenotypeNormalizer::normalize(gene, supplied, sex, alleleIndex_);
    }

    return individual;
}

Individual Engine::mate(const Individual& firstParent,
                        const Individual& secondParent) const {
    const Individual* male = nullptr;
    const Individual* female = nullptr;

    if (firstParent.sex == Sex::Male) {
        male = &firstParent;
    } else {
        female = &firstParent;
    }

    if (secondParent.sex == Sex::Male) {
        male = &secondParent;
    } else {
        female = &secondParent;
    }

    if (!male || !female) {
        throw std::invalid_argument("Mating requires one male and one female parent.");
    }

    std::random_device rd;
    std::mt19937 rng(rd());

    Gamete maternal = GameteGenerator::generate(*female, Sex::Female, config_.genes, linkageMap_, rng);
    Gamete paternal = GameteGenerator::generate(*male, Sex::Male, config_.genes, linkageMap_, rng);

    Sex childSex = paternal.carriesY ? Sex::Male : Sex::Female;
    std::unordered_map<std::string, Genotype> childGenotype;

    for (const auto& gene : config_.genes) {
        switch (gene.chromosome) {
            case ChromosomeType::Autosomal: {
                auto matIt = maternal.alleles.find(gene.id);
                auto patIt = paternal.alleles.find(gene.id);
                if (matIt == maternal.alleles.end() || patIt == paternal.alleles.end()) {
                    throw std::runtime_error("Missing autosomal allele in gamete for gene " + gene.id);
                }
                childGenotype[gene.id] = {matIt->second, patIt->second};
                break;
            }
            case ChromosomeType::X: {
                auto matIt = maternal.alleles.find(gene.id);
                if (matIt == maternal.alleles.end()) {
                    throw std::runtime_error("Maternal gamete missing X-linked gene " + gene.id);
                }
                if (childSex == Sex::Female) {
                    auto patIt = paternal.alleles.find(gene.id);
                    if (patIt == paternal.alleles.end()) {
                        throw std::runtime_error("Paternal gamete missing X-linked gene " + gene.id + " for female child");
                    }
                    childGenotype[gene.id] = {matIt->second, patIt->second};
                } else {
                    childGenotype[gene.id] = {matIt->second};
                }
                break;
            }
            case ChromosomeType::Y: {
                if (childSex == Sex::Male) {
                    auto patIt = paternal.alleles.find(gene.id);
                    if (patIt == paternal.alleles.end()) {
                        throw std::runtime_error("Paternal gamete missing Y-linked gene " + gene.id + " for male child");
                    }
                    childGenotype[gene.id] = {patIt->second};
                }
                break;
            }
        }
    }

    return Individual{childSex, std::move(childGenotype)};
}

Phenotype Engine::expressPhenotype(const Individual& individual) const {
    Phenotype phenotype;

    for (const auto& gene : config_.genes) {
        const auto genotypeIt = individual.genotype.find(gene.id);
        if (genotypeIt == individual.genotype.end()) {
            continue;
        }
        const Genotype& genotype = genotypeIt->second;
        if (genotype.empty()) {
            continue;
        }

        std::string allele1 = genotype.front();
        std::string allele2 = genotype.size() > 1 ? genotype.back() : genotype.front();

        const auto& resolved1 = requireAllele(gene, allele1);
        const auto& resolved2 = requireAllele(gene, allele2);

        // Use Strategy pattern for dominance
        const IDominanceStrategy& strategy = DominanceStrategyFactory::getStrategy(gene.dominance);
        strategy.express(gene, resolved1, resolved2, phenotype);
    }

    // Apply modifiers using Chain of Responsibility pattern
    EpistasisModifier epistasisModifier(config_.epistasis);
    epistasisModifier.apply(individual, phenotype);

    CatCoatOverrideModifier catCoatModifier(geneIndex_);
    catCoatModifier.apply(individual, phenotype);

    LinkageTraitModifier linkageModifier(linkageMap_, linkageTraitIds_);
    linkageModifier.apply(individual, phenotype);

    return phenotype;
}

const GeneDefinition& Engine::requireGene(const std::string& geneId) const {
    auto it = geneIndex_.find(geneId);
    if (it == geneIndex_.end()) {
        throw std::invalid_argument("Unknown gene id: " + geneId);
    }
    return *it->second;
}

const AlleleDefinition& Engine::requireAllele(const GeneDefinition& gene,
                                              const std::string& alleleId) const {
    auto geneIt = alleleIndex_.find(gene.id);
    if (geneIt == alleleIndex_.end()) {
        throw std::invalid_argument("Gene '" + gene.id + "' has no allele index.");
    }
    auto alleleIt = geneIt->second.find(alleleId);
    if (alleleIt == geneIt->second.end()) {
        throw std::invalid_argument("Allele '" + alleleId + "' is not defined for gene '" + gene.id + "'");
    }
    return *alleleIt->second;
}

const GeneDefinition* Engine::findGene(const std::string& geneId) const {
    auto it = geneIndex_.find(geneId);
    if (it == geneIndex_.end()) {
        return nullptr;
    }
    return it->second;
}

}  // namespace zygotrix
