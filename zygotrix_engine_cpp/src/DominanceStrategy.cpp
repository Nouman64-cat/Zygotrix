#include "zygotrix/DominanceStrategy.hpp"
#include "zygotrix/GenotypeUtils.hpp"
#include <unordered_map>
#include <vector>

namespace zygotrix {

// Static member initialization
CompleteDominanceStrategy DominanceStrategyFactory::completeStrategy_;
CodominanceStrategy DominanceStrategyFactory::codominantStrategy_;
IncompleteDominanceStrategy DominanceStrategyFactory::incompleteStrategy_;

const IDominanceStrategy& DominanceStrategyFactory::getStrategy(DominancePattern pattern) {
    switch (pattern) {
        case DominancePattern::Complete:
            return completeStrategy_;
        case DominancePattern::Codominant:
            return codominantStrategy_;
        case DominancePattern::Incomplete:
            return incompleteStrategy_;
        default:
            return completeStrategy_;
    }
}

void CompleteDominanceStrategy::express(
    const GeneDefinition& gene,
    const AlleleDefinition& allele1,
    const AlleleDefinition& allele2,
    Phenotype& phenotype) const {
    
    const AlleleDefinition* expressed = nullptr;
    if (allele1.id == allele2.id) {
        expressed = &allele1;
    } else if (allele1.dominanceRank > allele2.dominanceRank) {
        expressed = &allele1;
    } else if (allele2.dominanceRank > allele1.dominanceRank) {
        expressed = &allele2;
    } else {
        expressed = &allele1;
    }

    for (const auto& effect : expressed->effects) {
        phenotype.traits[effect.traitId].add(effect.magnitude, effect.description);
    }
}

void CodominanceStrategy::express(
    const GeneDefinition& gene,
    const AlleleDefinition& allele1,
    const AlleleDefinition& allele2,
    Phenotype& phenotype) const {
    
    if (allele1.id == allele2.id) {
        for (const auto& effect : allele1.effects) {
            phenotype.traits[effect.traitId].add(effect.magnitude, effect.description);
        }
    } else if (allele1.dominanceRank != allele2.dominanceRank) {
        const AlleleDefinition& dominant =
            allele1.dominanceRank > allele2.dominanceRank ? allele1 : allele2;
        for (const auto& effect : dominant.effects) {
            phenotype.traits[effect.traitId].add(effect.magnitude, effect.description);
        }
    } else {
        // Both alleles have equal dominance - average their effects
        std::unordered_map<std::string, std::vector<const AlleleEffect*>> effectsByTrait;
        for (const auto& effect : allele1.effects) {
            effectsByTrait[effect.traitId].push_back(&effect);
        }
        for (const auto& effect : allele2.effects) {
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

            std::string descriptor = GenotypeUtils::combineDescriptors(descriptors);
            expr.descriptors.clear();
            if (!descriptor.empty()) {
                expr.descriptors.push_back(descriptor);
            }
        }
    }
}

void IncompleteDominanceStrategy::express(
    const GeneDefinition& gene,
    const AlleleDefinition& allele1,
    const AlleleDefinition& allele2,
    Phenotype& phenotype) const {
    
    if (allele1.id == allele2.id) {
        for (const auto& effect : allele1.effects) {
            phenotype.traits[effect.traitId].add(effect.magnitude, effect.description);
        }
    } else {
        // Blend the alleles
        std::unordered_map<std::string, const AlleleEffect*> map1;
        std::unordered_map<std::string, const AlleleEffect*> map2;
        for (const auto& effect : allele1.effects) {
            map1.emplace(effect.traitId, &effect);
        }
        for (const auto& effect : allele2.effects) {
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

}  // namespace zygotrix
