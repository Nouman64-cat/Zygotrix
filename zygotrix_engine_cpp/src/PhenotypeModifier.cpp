#include "zygotrix/PhenotypeModifier.hpp"
#include "zygotrix/GenotypeUtils.hpp"
#include <stdexcept>

namespace zygotrix {

void EpistasisModifier::apply(const Individual& individual, Phenotype& phenotype) const {
    for (const auto& rule : rules_) {
        const auto geneIt = individual.genotype.find(rule.regulatorGene);
        if (geneIt == individual.genotype.end()) {
            continue;
        }
        const Genotype& genotype = geneIt->second;

        bool conditionMet = false;
        switch (rule.requirement) {
            case AlleleRequirement::Present:
                conditionMet = GenotypeUtils::containsAllele(genotype, rule.triggeringAllele);
                break;
            case AlleleRequirement::Homozygous:
                conditionMet = GenotypeUtils::isHomozygous(genotype, rule.triggeringAllele);
                break;
            case AlleleRequirement::Heterozygous:
                conditionMet = GenotypeUtils::isHeterozygous(genotype, rule.triggeringAllele);
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

void CatCoatOverrideModifier::apply(const Individual& individual, Phenotype& phenotype) const {
    const GeneDefinition* whiteMask = nullptr;
    const GeneDefinition* blackOrange = nullptr;
    const GeneDefinition* dilute = nullptr;

    auto findGene = [&](const std::string& geneId) -> const GeneDefinition* {
        auto it = geneIndex_.find(geneId);
        return it != geneIndex_.end() ? it->second : nullptr;
    };

    whiteMask = findGene("white_masking");
    blackOrange = findGene("black_orange");
    dilute = findGene("dilute");

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
            const std::string cleaned = GenotypeUtils::stripNonAlnum(allele);
            if (cleaned == "W") {
                hasDominantWhite = true;
                break;
            }
            const std::string normalized = GenotypeUtils::toUpperCopy(cleaned);
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
                const std::string cleaned = GenotypeUtils::stripNonAlnum(allele);
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
            std::string cleaned = GenotypeUtils::stripNonAlnum(allele);
            std::string upper = GenotypeUtils::toUpperCopy(cleaned);
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

void LinkageTraitModifier::apply(const Individual& individual, Phenotype& phenotype) const {
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
