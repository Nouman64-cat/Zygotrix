#include "zygotrix/Engine.hpp"
#include "json11/json11.hpp"

#include <algorithm>
#include <cctype>
#include <iostream>
#include <random>
#include <stdexcept>
#include <string>
#include <unordered_map>

using json11::Json;
using namespace zygotrix;

namespace {

std::string read_all_stdin() {
    std::istreambuf_iterator<char> begin(std::cin);
    std::istreambuf_iterator<char> end;
    return std::string(begin, end);
}

std::string to_lower(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
    return value;
}

ChromosomeType parse_chromosome(const std::string& value) {
    const std::string lowered = to_lower(value);
    if (lowered == "autosomal") {
        return ChromosomeType::Autosomal;
    }
    if (lowered == "x" || lowered == "x-linked" || lowered == "xlinked") {
        return ChromosomeType::X;
    }
    if (lowered == "y" || lowered == "y-linked" || lowered == "ylinked") {
        return ChromosomeType::Y;
    }
    throw std::invalid_argument("Unknown chromosome type: " + value);
}

DominancePattern parse_dominance(const std::string& value) {
    const std::string lowered = to_lower(value);
    if (lowered == "complete") {
        return DominancePattern::Complete;
    }
    if (lowered == "codominant" || lowered == "codominance") {
        return DominancePattern::Codominant;
    }
    if (lowered == "incomplete") {
        return DominancePattern::Incomplete;
    }
    throw std::invalid_argument("Unknown dominance pattern: " + value);
}

Sex parse_sex(const std::string& value) {
    const std::string lowered = to_lower(value);
    if (lowered == "male") {
        return Sex::Male;
    }
    if (lowered == "female") {
        return Sex::Female;
    }
    throw std::invalid_argument("Unknown sex value: " + value);
}

AlleleRequirement parse_requirement(const std::string& value) {
    const std::string lowered = to_lower(value);
    if (lowered == "present") {
        return AlleleRequirement::Present;
    }
    if (lowered == "homozygous") {
        return AlleleRequirement::Homozygous;
    }
    if (lowered == "heterozygous") {
        return AlleleRequirement::Heterozygous;
    }
    if (lowered == "hemizygous") {
        return AlleleRequirement::Hemizygous;
    }
    throw std::invalid_argument("Unknown allele requirement: " + value);
}

EpistasisAction parse_action(const std::string& value) {
    const std::string lowered = to_lower(value);
    if (lowered == "mask" || lowered == "masktrait" || lowered == "mask_trait") {
        return EpistasisAction::MaskTrait;
    }
    if (lowered == "modify" || lowered == "modifytrait" || lowered == "modify_trait") {
        return EpistasisAction::ModifyTraitValue;
    }
    throw std::invalid_argument("Unknown epistasis action: " + value);
}

bool has_field(const Json& obj, const std::string& field) {
    return obj.is_object() && obj.object_items().count(field) != 0;
}

}  // namespace

int main() {
    std::string input = read_all_stdin();
    std::string error;
    Json request = Json::parse(input, error);
    if (!error.empty()) {
        Json response = Json::object{
            {"error", Json("Invalid JSON: " + error)}
        };
        std::cout << response.dump() << std::endl;
        return 1;
    }

    try {
        EngineConfig config;

        if (has_field(request, "genes")) {
            for (const Json& geneJson : request["genes"].array_items()) {
                GeneDefinition gene;
                gene.id = geneJson["id"].string_value();
                gene.chromosome = parse_chromosome(geneJson["chromosome"].string_value());
                gene.dominance = parse_dominance(geneJson["dominance"].string_value());
                if (has_field(geneJson, "linkage_group") && !geneJson["linkage_group"].is_null()) {
                    gene.linkageGroup = static_cast<std::size_t>(geneJson["linkage_group"].number_value());
                }
                if (has_field(geneJson, "recombination_probability")) {
                    gene.recombinationProbability = geneJson["recombination_probability"].number_value();
                }
                if (has_field(geneJson, "incomplete_blend_weight")) {
                    gene.incompleteBlendWeight = geneJson["incomplete_blend_weight"].number_value();
                }
                gene.defaultAlleleId = geneJson["default_allele_id"].string_value();

                for (const Json& alleleJson : geneJson["alleles"].array_items()) {
                    AlleleDefinition allele;
                    allele.id = alleleJson["id"].string_value();
                    if (has_field(alleleJson, "dominance_rank")) {
                        allele.dominanceRank = static_cast<int>(alleleJson["dominance_rank"].number_value());
                    }
                    if (has_field(alleleJson, "effects")) {
                        for (const Json& effectJson : alleleJson["effects"].array_items()) {
                            AlleleEffect effect;
                            effect.traitId = effectJson["trait_id"].string_value();
                            effect.magnitude = effectJson["magnitude"].number_value();
                            if (has_field(effectJson, "description")) {
                                effect.description = effectJson["description"].string_value();
                            }
                            allele.effects.push_back(std::move(effect));
                        }
                    }
                    gene.alleles.push_back(std::move(allele));
                }

                config.genes.push_back(std::move(gene));
            }
        }

        if (has_field(request, "epistasis")) {
            for (const Json& epiJson : request["epistasis"].array_items()) {
                EpistasisRule rule;
                rule.regulatorGene = epiJson["regulator_gene"].string_value();
                rule.triggeringAllele = epiJson["triggering_allele"].string_value();
                if (has_field(epiJson, "requirement")) {
                    rule.requirement = parse_requirement(epiJson["requirement"].string_value());
                }
                if (has_field(epiJson, "action")) {
                    rule.action = parse_action(epiJson["action"].string_value());
                }
                rule.targetTrait = epiJson["target_trait"].string_value();
                if (has_field(epiJson, "modifier")) {
                    rule.modifier = epiJson["modifier"].number_value();
                }
                if (has_field(epiJson, "override_description")) {
                    rule.overrideDescription = epiJson["override_description"].string_value();
                }
                if (has_field(epiJson, "override_value")) {
                    rule.overrideValue = epiJson["override_value"].number_value();
                }
                config.epistasis.push_back(std::move(rule));
            }
        }

        Engine engine(config);

        const Json& motherJson = request["mother"];
        const Json& fatherJson = request["father"];

        Sex motherSex = Sex::Female;
        if (has_field(motherJson, "sex")) {
            motherSex = parse_sex(motherJson["sex"].string_value());
        }
        Sex fatherSex = Sex::Male;
        if (has_field(fatherJson, "sex")) {
            fatherSex = parse_sex(fatherJson["sex"].string_value());
        }

        auto parse_genotype = [](const Json& genotypeJson) {
            std::unordered_map<std::string, Genotype> genotype;
            for (const auto& kv : genotypeJson.object_items()) {
                Genotype alleles;
                for (const Json& allele : kv.second.array_items()) {
                    alleles.push_back(allele.string_value());
                }
                genotype.emplace(kv.first, std::move(alleles));
            }
            return genotype;
        };

        Individual mother = engine.createIndividual(
            motherSex,
            parse_genotype(motherJson["genotype"]));

        Individual father = engine.createIndividual(
            fatherSex,
            parse_genotype(fatherJson["genotype"]));

        int simulations = 100;
        if (has_field(request, "simulations")) {
            simulations = static_cast<int>(request["simulations"].number_value());
            if (simulations <= 0) {
                simulations = 1;
            }
        }

        std::unordered_map<std::string, std::unordered_map<std::string, int>> descriptorCounts;
        std::unordered_map<std::string, double> quantitativeSums;
        std::unordered_map<std::string, int> quantitativeCounts;
        std::unordered_map<std::string, int> sexCounts;

        for (int i = 0; i < simulations; ++i) {
            Individual child = engine.mate(mother, father);
            Phenotype phenotype = engine.expressPhenotype(child);

            sexCounts[child.sex == Sex::Female ? "female" : "male"] += 1;

            for (const auto& traitPair : phenotype.traits) {
                const std::string& traitId = traitPair.first;
                const TraitExpression& expression = traitPair.second;
                quantitativeSums[traitId] += expression.quantitative;
                quantitativeCounts[traitId] += 1;
                if (expression.descriptors.empty()) {
                    descriptorCounts[traitId][""] += 1;
                } else {
                    for (const std::string& descriptor : expression.descriptors) {
                        descriptorCounts[traitId][descriptor] += 1;
                    }
                }
            }
        }

        Json::JsonObject traitsJson;
        for (const auto& traitSum : quantitativeSums) {
            const std::string& traitId = traitSum.first;
            double total = traitSum.second;
            int count = quantitativeCounts[traitId];
            double mean = count > 0 ? total / static_cast<double>(count) : 0.0;

            Json::JsonObject traitObj;
            traitObj.emplace("mean_quantitative", Json(mean));

            Json::JsonObject descriptorObj;
            auto descriptorIt = descriptorCounts.find(traitId);
            if (descriptorIt != descriptorCounts.end()) {
                for (const auto& entry : descriptorIt->second) {
                    descriptorObj.emplace(entry.first, Json(static_cast<int>(entry.second)));
                }
            }
            traitObj.emplace("descriptor_counts", Json(descriptorObj));
            traitsJson.emplace(traitId, Json(traitObj));
        }

        Json::JsonObject sexJson;
        for (const auto& sexCount : sexCounts) {
            sexJson.emplace(sexCount.first, Json(static_cast<int>(sexCount.second)));
        }

        Json response = Json::object{
            {"simulations", Json(simulations)},
            {"sex_counts", Json(sexJson)},
            {"trait_summaries", Json(traitsJson)}
        };

        std::cout << response.dump() << std::endl;
        return 0;
    } catch (const std::exception& ex) {
        Json response = Json::object{
            {"error", Json(ex.what())}
        };
        std::cout << response.dump() << std::endl;
        return 2;
    }
}
