#include "zygotrix/Engine.hpp"

#include <algorithm>
#include <cctype>
#include <numeric>
#include <random>
#include <sstream>
#include <stdexcept>
#include <unordered_map>
#include <vector>

namespace zygotrix {

namespace {

bool containsAllele(const Genotype& genotype, const std::string& alleleId) {
    return std::find(genotype.begin(), genotype.end(), alleleId) != genotype.end();
}

bool isHomozygous(const Genotype& genotype, const std::string& alleleId) {
    return genotype.size() == 2 &&
           genotype[0] == alleleId &&
           genotype[1] == alleleId;
}

bool isHeterozygous(const Genotype& genotype, const std::string& alleleId) {
    if (genotype.size() != 2) {
        return false;
    }
    bool first = genotype[0] == alleleId;
    bool second = genotype[1] == alleleId;
    return (first ^ second);
}

std::string stripNonAlnum(const std::string& value) {
    std::string cleaned;
    cleaned.reserve(value.size());
    for (char ch : value) {
        if (std::isalnum(static_cast<unsigned char>(ch))) {
            cleaned.push_back(ch);
        }
    }
    return cleaned;
}

std::string toUpperCopy(const std::string& value) {
    std::string result = value;
    std::transform(result.begin(), result.end(), result.begin(), [](unsigned char c) {
        return static_cast<char>(std::toupper(c));
    });
    return result;
}

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

std::string combineDescriptors(const std::vector<std::string>& descriptors) {
    std::vector<std::string> uniqueDescriptors;
    uniqueDescriptors.reserve(descriptors.size());
    for (const std::string& descriptor : descriptors) {
        if (descriptor.empty()) {
            continue;
        }
        if (std::find(uniqueDescriptors.begin(), uniqueDescriptors.end(), descriptor) == uniqueDescriptors.end()) {
            uniqueDescriptors.push_back(descriptor);
        }
    }
    if (uniqueDescriptors.empty()) {
        return {};
    }
    if (uniqueDescriptors.size() == 1) {
        return uniqueDescriptors.front();
    }

    bool allSingleAlpha = true;
    for (const std::string& descriptor : uniqueDescriptors) {
        if (descriptor.size() != 1 || !std::isalpha(static_cast<unsigned char>(descriptor[0]))) {
            allSingleAlpha = false;
            break;
        }
    }

    if (allSingleAlpha) {
        std::vector<std::string> sortedDescriptors = uniqueDescriptors;
        std::sort(sortedDescriptors.begin(), sortedDescriptors.end());
        std::string combined;
        combined.reserve(sortedDescriptors.size());
        for (const std::string& descriptor : sortedDescriptors) {
            combined += descriptor;
        }
        return combined;
    }

    std::string combined = uniqueDescriptors.front();
    for (std::size_t i = 1; i < uniqueDescriptors.size(); ++i) {
        combined += ", " + uniqueDescriptors[i];
    }
    return combined;
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
        individual.genotype[gene.id] = normalizedGenotype(gene, supplied, sex);
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

    Gamete maternal = generateGamete(*female, Sex::Female, rng);
    Gamete paternal = generateGamete(*male, Sex::Male, rng);

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

        auto applyEffects = [&](const AlleleDefinition& alleleDef) {
            for (const auto& effect : alleleDef.effects) {
                phenotype.traits[effect.traitId].add(effect.magnitude, effect.description);
            }
        };

        if (gene.dominance == DominancePattern::Complete) {
            const AlleleDefinition* expressed = nullptr;
            if (resolved1.id == resolved2.id) {
                expressed = &resolved1;
            } else if (resolved1.dominanceRank > resolved2.dominanceRank) {
                expressed = &resolved1;
            } else if (resolved2.dominanceRank > resolved1.dominanceRank) {
                expressed = &resolved2;
            } else {
                expressed = &resolved1;
            }
            applyEffects(*expressed);
        } else if (gene.dominance == DominancePattern::Codominant) {
            if (resolved1.id == resolved2.id) {
                applyEffects(resolved1);
            } else if (resolved1.dominanceRank != resolved2.dominanceRank) {
                const AlleleDefinition& dominant =
                    resolved1.dominanceRank > resolved2.dominanceRank ? resolved1 : resolved2;
                applyEffects(dominant);
            } else {
                std::unordered_map<std::string, std::vector<const AlleleEffect*>> effectsByTrait;
                for (const auto& effect : resolved1.effects) {
                    effectsByTrait[effect.traitId].push_back(&effect);
                }
                for (const auto& effect : resolved2.effects) {
                    effectsByTrait[effect.traitId].push_back(&effect);
                }

                for (const auto& entry : effectsByTrait) {
                    const std::string& traitId = entry.first;
                    const auto& effects = entry.second;

                    double magnitudeSum = 0.0;
                    int magnitudeCount = 0;
                    std::vector<std::string> descriptors;

                    for (const AlleleEffect* effectPtr : effects) {
                        magnitudeSum += effectPtr->magnitude;
                        ++magnitudeCount;
                        if (!effectPtr->description.empty()) {
                            descriptors.push_back(effectPtr->description);
                        }
                    }

                    TraitExpression& expr = phenotype.traits[traitId];
                    if (descriptors.empty() && magnitudeCount > 0) {
                        expr.quantitative += magnitudeSum / static_cast<double>(magnitudeCount);
                    } else {
                        expr.quantitative = 0.0;
                    }

                    std::string descriptor = combineDescriptors(descriptors);
                    expr.descriptors.clear();
                    if (!descriptor.empty()) {
                        expr.descriptors.push_back(descriptor);
                    }
                }
            }
        } else {  // Incomplete dominance
            if (resolved1.id == resolved2.id) {
                applyEffects(resolved1);
            } else {
                std::unordered_map<std::string, const AlleleEffect*> map1;
                std::unordered_map<std::string, const AlleleEffect*> map2;
                for (const auto& effect : resolved1.effects) {
                    map1.emplace(effect.traitId, &effect);
                }
                for (const auto& effect : resolved2.effects) {
                    map2.emplace(effect.traitId, &effect);
                }
                std::unordered_map<std::string, bool> visited;
                for (const auto& effectEntry : map1) {
                    const std::string& traitId = effectEntry.first;
                    visited[traitId] = true;
                    const AlleleEffect* firstEffect = effectEntry.second;
                    const auto secondIt = map2.find(traitId);
                    const AlleleEffect* secondEffect = secondIt != map2.end() ? secondIt->second : nullptr;

                    double firstMagnitude = firstEffect ? firstEffect->magnitude : 0.0;
                    double secondMagnitude = secondEffect ? secondEffect->magnitude : 0.0;
                    double blended = gene.incompleteBlendWeight * firstMagnitude +
                                     (1.0 - gene.incompleteBlendWeight) * secondMagnitude;

                    std::string desc;
                    if (firstEffect && !firstEffect->intermediateDescriptor.empty()) {
                        desc = firstEffect->intermediateDescriptor;
                    } else if (secondEffect && !secondEffect->intermediateDescriptor.empty()) {
                        desc = secondEffect->intermediateDescriptor;
                    } else {
                        std::string firstDesc = firstEffect ? firstEffect->description : std::string();
                        std::string secondDesc = secondEffect ? secondEffect->description : std::string();
                        if (!firstDesc.empty() || !secondDesc.empty()) {
                            desc = "blend(" + firstDesc;
                            if (!secondDesc.empty()) {
                                desc += ", " + secondDesc;
                            }
                            desc += ")";
                        }
                    }

                    phenotype.traits[traitId].add(blended, desc);
                }
                for (const auto& effectEntry : map2) {
                    if (visited.count(effectEntry.first)) {
                        continue;
                    }
                    const AlleleEffect* effect = effectEntry.second;
                    double blended = (1.0 - gene.incompleteBlendWeight) * (effect ? effect->magnitude : 0.0);
                    std::string desc;
                    if (effect && !effect->intermediateDescriptor.empty()) {
                        desc = effect->intermediateDescriptor;
                    } else if (effect && !effect->description.empty()) {
                        desc = "blend(" + effect->description + ")";
                    }
                    phenotype.traits[effectEntry.first].add(blended, desc);
                }
            }
        }
    }

    applyPhenotypeOverrides(individual, phenotype);
    applyEpistasis(individual, phenotype);
    applyLinkageTraits(phenotype);
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

Genotype Engine::normalizedGenotype(const GeneDefinition& gene,
                                    const Genotype& provided,
                                    Sex sex) const {
    Genotype result = provided;
    const std::string& defaultAllele = gene.defaultAlleleId;

    auto ensureAlleleExists = [&](const std::string& allele) {
        requireAllele(gene, allele);
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

const GeneDefinition* Engine::findGene(const std::string& geneId) const {
    auto it = geneIndex_.find(geneId);
    if (it == geneIndex_.end()) {
        return nullptr;
    }
    return it->second;
}

Gamete Engine::generateGamete(const Individual& parent,
                              Sex sex,
                              std::mt19937& rng) const {
    Gamete gamete;
    bool passesX = true;

    if (sex == Sex::Male) {
        std::bernoulli_distribution decide(0.5);
        passesX = decide(rng);
        gamete.carriesX = passesX;
        gamete.carriesY = !passesX;
    } else {
        gamete.carriesX = true;
    }

    for (const auto& entry : linkageMap_) {
        generateGameteForGroup(entry.second, parent, gamete, passesX, rng);
    }

    std::bernoulli_distribution chooseAllele(0.5);

    for (const auto& gene : config_.genes) {
        if (gene.linkageGroup) {
            continue;
        }

        auto it = parent.genotype.find(gene.id);
        if (it == parent.genotype.end()) {
            throw std::runtime_error("Parent genotype missing gene " + gene.id);
        }
        const Genotype& alleles = it->second;

        auto takeAllele = [&](const std::string& allele) {
            gamete.alleles[gene.id] = allele;
            if (gene.chromosome == ChromosomeType::X) {
                gamete.carriesX = true;
            } else if (gene.chromosome == ChromosomeType::Y) {
                gamete.carriesY = true;
            }
        };

        switch (gene.chromosome) {
            case ChromosomeType::Autosomal: {
                if (alleles.empty()) {
                    throw std::runtime_error("Autosomal gene '" + gene.id + "' has no alleles recorded.");
                }
                if (alleles.size() == 1) {
                    takeAllele(alleles.front());
                } else {
                    std::size_t idx = chooseAllele(rng);
                    takeAllele(alleles[idx]);
                }
                break;
            }
            case ChromosomeType::X: {
                if (sex == Sex::Female) {
                    if (alleles.size() == 1) {
                        takeAllele(alleles.front());
                    } else if (alleles.size() == 2) {
                        std::size_t idx = chooseAllele(rng);
                        takeAllele(alleles[idx]);
                    } else {
                        throw std::runtime_error("X-linked gene '" + gene.id + "' has invalid allele count.");
                    }
                } else if (passesX) {
                    if (alleles.empty()) {
                        throw std::runtime_error("Male parent missing X-linked allele for gene '" + gene.id + "'");
                    }
                    takeAllele(alleles.front());
                }
                break;
            }
            case ChromosomeType::Y: {
                if (sex == Sex::Male && !passesX) {
                    if (alleles.empty()) {
                        throw std::runtime_error("Male parent missing Y-linked allele for gene '" + gene.id + "'");
                    }
                    takeAllele(alleles.front());
                }
                break;
            }
        }
    }

    return gamete;
}

void Engine::generateGameteForGroup(const std::vector<const GeneDefinition*>& group,
                                    const Individual& parent,
                                    Gamete& gamete,
                                    bool parentPassesX,
                                    std::mt19937& rng) const {
    if (group.empty()) {
        return;
    }

    bool anchorSet = false;
    std::size_t homologIndex = 0;
    std::bernoulli_distribution pick(0.5);

    for (const GeneDefinition* gene : group) {
        auto it = parent.genotype.find(gene->id);
        if (it == parent.genotype.end()) {
            throw std::runtime_error("Parent genotype missing gene " + gene->id);
        }
        const Genotype& alleles = it->second;
        if (alleles.empty()) {
            continue;
        }

        bool skipGene = false;
        if (gene->chromosome == ChromosomeType::X && parent.sex == Sex::Male && !parentPassesX) {
            skipGene = true;
        }
        if (gene->chromosome == ChromosomeType::Y && parent.sex == Sex::Male && parentPassesX) {
            skipGene = true;
        }
        if (gene->chromosome == ChromosomeType::Y && parent.sex == Sex::Female) {
            skipGene = true;
        }

        if (skipGene) {
            continue;
        }

        std::string selectedAllele;
        if (alleles.size() <= 1) {
            selectedAllele = alleles.front();
        } else {
            if (!anchorSet) {
                homologIndex = pick(rng);
                anchorSet = true;
            } else {
                std::bernoulli_distribution crossover(gene->recombinationProbability);
                if (crossover(rng)) {
                    homologIndex = 1 - homologIndex;
                }
            }
            selectedAllele = alleles[homologIndex];
        }

        gamete.alleles[gene->id] = selectedAllele;
        if (gene->chromosome == ChromosomeType::X) {
            gamete.carriesX = true;
        } else if (gene->chromosome == ChromosomeType::Y) {
            gamete.carriesY = true;
        }
    }
}

void Engine::applyEpistasis(const Individual& individual,
                            Phenotype& phenotype) const {
    for (const auto& rule : config_.epistasis) {
        const auto geneIt = individual.genotype.find(rule.regulatorGene);
        if (geneIt == individual.genotype.end()) {
            continue;
        }
        const Genotype& genotype = geneIt->second;

        bool conditionMet = false;
        switch (rule.requirement) {
            case AlleleRequirement::Present:
                conditionMet = containsAllele(genotype, rule.triggeringAllele);
                break;
            case AlleleRequirement::Homozygous:
                conditionMet = isHomozygous(genotype, rule.triggeringAllele);
                break;
            case AlleleRequirement::Heterozygous:
                conditionMet = isHeterozygous(genotype, rule.triggeringAllele);
                break;
            case AlleleRequirement::Hemizygous:
                conditionMet = genotype.size() == 1 &&
                               genotype.front() == rule.triggeringAllele;
                break;
        }

        if (!conditionMet) {
            continue;
        }

        TraitExpression& expr = phenotype.traits[rule.targetTrait];
        if (rule.action == EpistasisAction::MaskTrait) {
            expr.quantitative = rule.overrideValue;
            expr.descriptors.clear();
            if (!rule.overrideDescription.empty()) {
                expr.descriptors.push_back(rule.overrideDescription);
            }
        } else {
            expr.quantitative *= rule.modifier;
            if (!rule.overrideDescription.empty()) {
                expr.descriptors.push_back(rule.overrideDescription);
            }
        }
    }
}

void Engine::applyPhenotypeOverrides(const Individual& individual,
                                     Phenotype& phenotype) const {
    const GeneDefinition* whiteMask = findGene("white_masking");
    const GeneDefinition* blackOrange = findGene("black_orange");
    const GeneDefinition* dilute = findGene("dilute");

    const auto findGenotype = [&](const GeneDefinition* gene) -> const Genotype* {
        if (!gene) {
            return nullptr;
        }
        auto it = individual.genotype.find(gene->id);
        if (it == individual.genotype.end()) {
            return nullptr;
        }
        return &it->second;
    };

    const Genotype* whiteMaskGenotype = findGenotype(whiteMask);
    const Genotype* blackOrangeGenotype = findGenotype(blackOrange);
    const Genotype* diluteGenotype = findGenotype(dilute);

    if (!whiteMaskGenotype && !blackOrangeGenotype && !diluteGenotype) {
        return;
    }

    auto& coatExpr = phenotype.traits["coat_color"];
    auto& pigmentExpr = phenotype.traits["pigment_intensity"];

    bool hasDominantWhite = false;
    if (whiteMaskGenotype) {
        for (const auto& allele : *whiteMaskGenotype) {
            const std::string cleaned = stripNonAlnum(allele);
            if (cleaned == "W") {
                hasDominantWhite = true;
                break;
            }
            const std::string normalized = toUpperCopy(cleaned);
            if (normalized == "WHITE" || normalized == "WMASK") {
                hasDominantWhite = true;
                break;
            }
        }
    }

    bool isDilute = false;
    if (diluteGenotype && !diluteGenotype->empty()) {
        if (diluteGenotype->size() == 2) {
            isDilute = true;
            for (const auto& allele : *diluteGenotype) {
                const std::string cleaned = stripNonAlnum(allele);
                if (cleaned != "d") {
                    isDilute = false;
                    break;
                }
            }
        }
    }

    std::string coatDescriptor;
    if (hasDominantWhite) {
        coatDescriptor = "Solid White";
    } else if (blackOrangeGenotype && !blackOrangeGenotype->empty()) {
        bool hasBlackAllele = false;
        bool hasOrangeAllele = false;
        for (const auto& allele : *blackOrangeGenotype) {
            std::string cleaned = stripNonAlnum(allele);
            std::string upper = toUpperCopy(cleaned);
            if (upper == "XB" || upper == "B") {
                hasBlackAllele = true;
            } else if (upper == "XO" || upper == "O") {
                hasOrangeAllele = true;
            }
        }

        if (individual.sex == Sex::Female) {
            if (hasBlackAllele && hasOrangeAllele) {
                coatDescriptor = isDilute ? "Dilute Tortoiseshell Female" : "Tortoiseshell Female";
            } else if (hasBlackAllele) {
                coatDescriptor = isDilute ? "Blue Female" : "Black Female";
            } else if (hasOrangeAllele) {
                coatDescriptor = isDilute ? "Cream Female" : "Orange Female";
            }
        } else {
            if (hasBlackAllele) {
                coatDescriptor = isDilute ? "Blue Male" : "Black Male";
            } else if (hasOrangeAllele) {
                coatDescriptor = isDilute ? "Cream Male" : "Orange Male";
            }
        }
    }

    // Override the quantitative value and descriptors for qualitative traits.
    coatExpr.quantitative = 0.0;
    coatExpr.descriptors.clear();
    if (!coatDescriptor.empty()) {
        coatExpr.descriptors.push_back(coatDescriptor);
    }

    pigmentExpr.quantitative = 0.0;
    pigmentExpr.descriptors.clear();
    if (diluteGenotype && !diluteGenotype->empty()) {
        pigmentExpr.descriptors.push_back(isDilute ? "Dilute" : "Dense");
    }
}

void Engine::applyLinkageTraits(Phenotype& phenotype) const {
    for (const auto& entry : linkageMap_) {
        const auto& genes = entry.second;
        if (genes.size() < 2) {
            continue;
        }

        auto traitListIt = linkageTraitIds_.find(entry.first);
        if (traitListIt == linkageTraitIds_.end() || traitListIt->second.empty()) {
            continue;
        }

        std::vector<std::string> descriptorPieces;
        std::vector<std::string> processedTraitIds;
        descriptorPieces.reserve(traitListIt->second.size());

        for (const std::string& traitId : traitListIt->second) {
            auto traitIt = phenotype.traits.find(traitId);
            if (traitIt == phenotype.traits.end()) {
                continue;
            }
            TraitExpression& expr = traitIt->second;

            std::string piece;
            if (expr.descriptors.empty()) {
                piece = expr.summary();
            } else if (expr.descriptors.size() == 1) {
                piece = expr.descriptors.front();
            } else {
                for (std::size_t i = 0; i < expr.descriptors.size(); ++i) {
                    if (!piece.empty()) {
                        piece += "/";
                    }
                    piece += expr.descriptors[i];
                }
            }

            descriptorPieces.push_back(piece);
            processedTraitIds.push_back(traitId);
        }

        if (descriptorPieces.empty()) {
            continue;
        }

        std::string combinedDescriptor = descriptorPieces.front();
        for (std::size_t i = 1; i < descriptorPieces.size(); ++i) {
            combinedDescriptor += ", " + descriptorPieces[i];
        }

        std::string combinedTraitId;
        for (std::size_t i = 0; i < processedTraitIds.size(); ++i) {
            if (i > 0) {
                combinedTraitId += "_";
            }
            combinedTraitId += processedTraitIds[i];
        }
        if (combinedTraitId.empty()) {
            combinedTraitId = "linkage_group_" + std::to_string(entry.first);
        }

        for (const std::string& traitId : processedTraitIds) {
            phenotype.traits.erase(traitId);
        }

        TraitExpression& combinedExpr = phenotype.traits[combinedTraitId];
        combinedExpr.quantitative = 0.0;
        combinedExpr.descriptors.clear();
        combinedExpr.descriptors.push_back(combinedDescriptor);
    }
}

}  // namespace zygotrix
