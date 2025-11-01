#include "zygotrix/Engine.hpp"
#include "zygotrix/MendelianCalculator.hpp"
#include "json11/json11.hpp"

#include <algorithm>
#include <cctype>
#include <iostream>
#include <random>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <sstream>

using json11::Json;
using namespace zygotrix;

namespace
{

    std::string read_all_stdin()
    {
        std::istreambuf_iterator<char> begin(std::cin);
        std::istreambuf_iterator<char> end;
        return std::string(begin, end);
    }

    std::string to_lower(std::string value)
    {
        std::transform(value.begin(), value.end(), value.begin(), [](unsigned char c)
                       { return static_cast<char>(std::tolower(c)); });
        return value;
    }

    ChromosomeType parse_chromosome(const std::string &value)
    {
        const std::string lowered = to_lower(value);
        if (lowered == "autosomal")
        {
            return ChromosomeType::Autosomal;
        }
        if (lowered == "x" || lowered == "x-linked" || lowered == "xlinked")
        {
            return ChromosomeType::X;
        }
        if (lowered == "y" || lowered == "y-linked" || lowered == "ylinked")
        {
            return ChromosomeType::Y;
        }
        throw std::invalid_argument("Unknown chromosome type: " + value);
    }

    DominancePattern parse_dominance(const std::string &value)
    {
        const std::string lowered = to_lower(value);
        if (lowered == "complete")
        {
            return DominancePattern::Complete;
        }
        if (lowered == "codominant" || lowered == "codominance")
        {
            return DominancePattern::Codominant;
        }
        if (lowered == "incomplete")
        {
            return DominancePattern::Incomplete;
        }
        throw std::invalid_argument("Unknown dominance pattern: " + value);
    }

    Sex parse_sex(const std::string &value)
    {
        const std::string lowered = to_lower(value);
        if (lowered == "male")
        {
            return Sex::Male;
        }
        if (lowered == "female")
        {
            return Sex::Female;
        }
        throw std::invalid_argument("Unknown sex value: " + value);
    }

    AlleleRequirement parse_requirement(const std::string &value)
    {
        const std::string lowered = to_lower(value);
        if (lowered == "present")
        {
            return AlleleRequirement::Present;
        }
        if (lowered == "homozygous")
        {
            return AlleleRequirement::Homozygous;
        }
        if (lowered == "heterozygous")
        {
            return AlleleRequirement::Heterozygous;
        }
        if (lowered == "hemizygous")
        {
            return AlleleRequirement::Hemizygous;
        }
        throw std::invalid_argument("Unknown allele requirement: " + value);
    }

    EpistasisAction parse_action(const std::string &value)
    {
        const std::string lowered = to_lower(value);
        if (lowered == "mask" || lowered == "masktrait" || lowered == "mask_trait")
        {
            return EpistasisAction::MaskTrait;
        }
        if (lowered == "modify" || lowered == "modifytrait" || lowered == "modify_trait")
        {
            return EpistasisAction::ModifyTraitValue;
        }
        throw std::invalid_argument("Unknown epistasis action: " + value);
    }

    bool has_field(const Json &obj, const std::string &field)
    {
        return obj.is_object() && obj.object_items().count(field) != 0;
    }

} // namespace

int main()
{
    std::string input = read_all_stdin();
    std::string error;
    Json request = Json::parse(input, error);
    if (!error.empty())
    {
        Json response = Json(Json::JsonObject{
            {"error", Json("Invalid JSON: " + error)}});
        std::cout << response.dump() << std::endl;
        return 1;
    }

    try
    {
        EngineConfig config;

        std::unordered_map<std::string, std::size_t> geneIndex;

        std::vector<std::string> traitOrdering;
        std::unordered_map<std::string, bool> traitSeen;
        std::unordered_map<std::string, bool> traitSexSpecific;

        if (has_field(request, "genes"))
        {
            for (const Json &geneJson : request["genes"].array_items())
            {
                GeneDefinition gene;
                gene.id = geneJson["id"].string_value();
                gene.chromosome = parse_chromosome(geneJson["chromosome"].string_value());
                gene.dominance = parse_dominance(geneJson["dominance"].string_value());
                if (has_field(geneJson, "linkage_group") && !geneJson["linkage_group"].is_null())
                {
                    gene.linkageGroup = static_cast<std::size_t>(geneJson["linkage_group"].number_value());
                }
                if (has_field(geneJson, "recombination_probability"))
                {
                    gene.recombinationProbability = geneJson["recombination_probability"].number_value();
                }
                if (has_field(geneJson, "incomplete_blend_weight"))
                {
                    gene.incompleteBlendWeight = geneJson["incomplete_blend_weight"].number_value();
                }
                gene.defaultAlleleId = geneJson["default_allele_id"].string_value();

                for (const Json &alleleJson : geneJson["alleles"].array_items())
                {
                    AlleleDefinition allele;
                    allele.id = alleleJson["id"].string_value();
                    if (has_field(alleleJson, "dominance_rank"))
                    {
                        allele.dominanceRank = static_cast<int>(alleleJson["dominance_rank"].number_value());
                    }
                    if (has_field(alleleJson, "effects"))
                    {
                        for (const Json &effectJson : alleleJson["effects"].array_items())
                        {
                            AlleleEffect effect;
                            effect.traitId = effectJson["trait_id"].string_value();
                            effect.magnitude = effectJson["magnitude"].number_value();
                            if (has_field(effectJson, "description"))
                            {
                                effect.description = effectJson["description"].string_value();
                            }
                            else if (has_field(effectJson, "descriptor"))
                            {
                                effect.description = effectJson["descriptor"].string_value();
                            }
                            if (has_field(effectJson, "intermediate_descriptor"))
                            {
                                effect.intermediateDescriptor = effectJson["intermediate_descriptor"].string_value();
                            }
                            std::string traitIdForRegistration = effect.traitId;
                            allele.effects.push_back(std::move(effect));

                            if (!traitIdForRegistration.empty())
                            {
                                bool isSexLinked = gene.chromosome != ChromosomeType::Autosomal;
                                auto [it, inserted] = traitSeen.emplace(traitIdForRegistration, true);
                                if (inserted)
                                {
                                    traitOrdering.push_back(traitIdForRegistration);
                                }
                                if (isSexLinked)
                                {
                                    traitSexSpecific[traitIdForRegistration] = true;
                                }
                                else if (!traitSexSpecific.count(traitIdForRegistration))
                                {
                                    traitSexSpecific[traitIdForRegistration] = false;
                                }
                            }
                        }
                    }
                    gene.alleles.push_back(std::move(allele));
                }

                std::size_t index = config.genes.size();
                geneIndex.emplace(gene.id, index);
                config.genes.push_back(std::move(gene));
            }
        }

        if (has_field(request, "linkage"))
        {
            std::size_t nextGroupId = 1;
            for (const Json &linkageJson : request["linkage"].array_items())
            {
                std::vector<std::string> geneNames;
                if (has_field(linkageJson, "genes"))
                {
                    const Json &genesArray = linkageJson["genes"];
                    if (genesArray.is_array())
                    {
                        for (const Json &entry : genesArray.array_items())
                        {
                            if (entry.is_string())
                            {
                                geneNames.push_back(entry.string_value());
                            }
                        }
                    }
                    else if (genesArray.is_string())
                    {
                        geneNames.push_back(genesArray.string_value());
                    }
                }
                else
                {
                    for (const char *key : {"gene1_id", "gene2_id", "gene1", "gene2"})
                    {
                        if (has_field(linkageJson, key))
                        {
                            geneNames.push_back(linkageJson[key].string_value());
                        }
                    }
                }

                std::vector<std::string> deduped;
                for (const std::string &name : geneNames)
                {
                    if (!name.empty() &&
                        std::find(deduped.begin(), deduped.end(), name) == deduped.end())
                    {
                        deduped.push_back(name);
                    }
                }
                if (deduped.size() < 2)
                {
                    continue;
                }

                std::size_t groupId = nextGroupId++;
                double recombination = 0.5;
                if (has_field(linkageJson, "recombination_frequency"))
                {
                    recombination = linkageJson["recombination_frequency"].number_value();
                }
                for (const std::string &geneName : deduped)
                {
                    auto it = geneIndex.find(geneName);
                    if (it == geneIndex.end())
                    {
                        continue;
                    }
                    GeneDefinition &gene = config.genes[it->second];
                    gene.linkageGroup = groupId;
                    gene.recombinationProbability = recombination;
                }
            }
        }

        if (has_field(request, "epistasis"))
        {
            for (const Json &epiJson : request["epistasis"].array_items())
            {
                EpistasisRule rule;
                rule.regulatorGene = epiJson["regulator_gene"].string_value();
                rule.triggeringAllele = epiJson["triggering_allele"].string_value();
                if (has_field(epiJson, "requirement"))
                {
                    rule.requirement = parse_requirement(epiJson["requirement"].string_value());
                }
                if (has_field(epiJson, "action"))
                {
                    rule.action = parse_action(epiJson["action"].string_value());
                }
                rule.targetTrait = epiJson["target_trait"].string_value();
                if (has_field(epiJson, "modifier"))
                {
                    rule.modifier = epiJson["modifier"].number_value();
                }
                if (has_field(epiJson, "override_description"))
                {
                    rule.overrideDescription = epiJson["override_description"].string_value();
                }
                if (has_field(epiJson, "override_value"))
                {
                    rule.overrideValue = epiJson["override_value"].number_value();
                }
                config.epistasis.push_back(std::move(rule));
            }
        }

        Engine engine(config);

        const Json &motherJson = request["mother"];
        const Json &fatherJson = request["father"];

        Sex motherSex = Sex::Female;
        if (has_field(motherJson, "sex"))
        {
            motherSex = parse_sex(motherJson["sex"].string_value());
        }
        Sex fatherSex = Sex::Male;
        if (has_field(fatherJson, "sex"))
        {
            fatherSex = parse_sex(fatherJson["sex"].string_value());
        }

        auto parse_genotype = [](const Json &genotypeJson)
        {
            std::unordered_map<std::string, Genotype> genotype;
            for (const auto &kv : genotypeJson.object_items())
            {
                Genotype alleles;
                for (const Json &allele : kv.second.array_items())
                {
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

        // Determine if we should use exact Mendelian calculation or Monte Carlo simulation
        bool useExactMode = false;
        bool asPercentages = false;
        bool jointPhenotypes = false;

        // Use exact mode if:
        // 1. No simulations parameter specified (default to exact)
        // 2. as_percentages is specified (indicates exact calculation request)
        // 3. exact parameter is explicitly true
        if (!has_field(request, "simulations"))
        {
            useExactMode = true;
        }
        if (has_field(request, "exact") && request["exact"].bool_value())
        {
            useExactMode = true;
        }
        if (has_field(request, "as_percentages"))
        {
            asPercentages = request["as_percentages"].bool_value();
            useExactMode = true; // as_percentages implies exact mode
        }
        if (has_field(request, "joint_phenotypes") && request["joint_phenotypes"].bool_value())
        {
            jointPhenotypes = true;
            useExactMode = true;
        }

        // EXACT MODE: Use MendelianCalculator for exact Punnett square calculations
        if (useExactMode)
        {
            MendelianCalculator calculator(engine);

            // Collect gene IDs
            std::vector<std::string> geneIds;
            for (const auto &gene : config.genes)
            {
                geneIds.push_back(gene.id);
            }

            if (jointPhenotypes)
            {
                // Calculate joint phenotypes (e.g., "Brown + Curly")
                auto jointResults = calculator.calculateJointPhenotypes(
                    mother, father, geneIds, asPercentages);

                Json::JsonObject resultsJson;
                for (const auto &[phenotype, prob] : jointResults)
                {
                    resultsJson[phenotype] = prob;
                }

                Json response = Json::JsonObject{
                    {"results", Json(resultsJson)},
                    {"missing_traits", Json(Json::JsonArray{})}};

                std::cout << response.dump() << std::endl;
                return 0;
            }
            else
            {
                // Calculate individual trait results (genotypic + phenotypic ratios)
                auto results = calculator.calculateCross(
                    mother, father, geneIds, asPercentages);

                Json::JsonObject resultsJson;
                for (const auto &[geneId, result] : results)
                {
                    Json::JsonObject genotypicRatios;
                    for (const auto &[genotype, prob] : result.genotypic_ratios.probabilities)
                    {
                        genotypicRatios[genotype] = prob;
                    }

                    Json::JsonObject phenotypicRatios;
                    for (const auto &[phenotype, prob] : result.phenotypic_ratios.probabilities)
                    {
                        phenotypicRatios[phenotype] = prob;
                    }

                    resultsJson[geneId] = Json::JsonObject{
                        {"genotypic_ratios", Json(genotypicRatios)},
                        {"phenotypic_ratios", Json(phenotypicRatios)}};
                }

                Json response = Json::JsonObject{
                    {"results", Json(resultsJson)},
                    {"missing_traits", Json(Json::JsonArray{})}};

                std::cout << response.dump() << std::endl;
                return 0;
            }
        }

        // SIMULATION MODE: Monte Carlo simulation (existing code)
        int simulations = 100;
        if (has_field(request, "simulations"))
        {
            simulations = static_cast<int>(request["simulations"].number_value());
            if (simulations <= 0)
            {
                simulations = 1;
            }
        }

        std::unordered_map<std::string, std::unordered_map<std::string, int>> descriptorCounts;
        std::unordered_map<std::string, double> quantitativeSums;
        std::unordered_map<std::string, int> quantitativeCounts;
        std::unordered_map<std::string, int> sexCounts;
        std::unordered_map<std::string, int> combinedDescriptorCounts;

        std::string combinedTraitId;
        if (!traitOrdering.empty())
        {
            combinedTraitId = traitOrdering.front();
            for (std::size_t i = 1; i < traitOrdering.size(); ++i)
            {
                combinedTraitId += "__" + traitOrdering[i];
            }
        }

        for (int i = 0; i < simulations; ++i)
        {
            Individual child = engine.mate(mother, father);
            Phenotype phenotype = engine.expressPhenotype(child);

            sexCounts[child.sex == Sex::Female ? "female" : "male"] += 1;

            std::unordered_map<std::string, std::string> selectedDescriptors;

            for (const auto &traitPair : phenotype.traits)
            {
                const std::string &traitId = traitPair.first;
                const TraitExpression &expression = traitPair.second;
                quantitativeSums[traitId] += expression.quantitative;
                quantitativeCounts[traitId] += 1;
                if (expression.descriptors.empty())
                {
                    descriptorCounts[traitId][""] += 1;
                    selectedDescriptors[traitId] = "";
                }
                else
                {
                    for (const std::string &descriptor : expression.descriptors)
                    {
                        descriptorCounts[traitId][descriptor] += 1;
                    }
                    selectedDescriptors[traitId] = expression.descriptors.front();
                }
            }

            if (!combinedTraitId.empty())
            {
                std::vector<std::string> parts;
                parts.reserve(traitOrdering.size());
                for (const auto &traitId : traitOrdering)
                {
                    auto it = selectedDescriptors.find(traitId);
                    std::string descriptor;
                    if (it != selectedDescriptors.end())
                    {
                        descriptor = it->second;
                    }
                    else
                    {
                        auto traitIt = phenotype.traits.find(traitId);
                        if (traitIt != phenotype.traits.end())
                        {
                            const TraitExpression &expr = traitIt->second;
                            if (!expr.descriptors.empty())
                            {
                                descriptor = expr.descriptors.front();
                            }
                            else
                            {
                                std::ostringstream os;
                                os << expr.quantitative;
                                descriptor = os.str();
                            }
                        }
                    }

                    if (traitSexSpecific[traitId])
                    {
                        if (!descriptor.empty())
                        {
                            descriptor += " ";
                        }
                        descriptor += child.sex == Sex::Female ? "Female" : "Male";
                    }

                    if (!descriptor.empty())
                    {
                        parts.push_back(descriptor);
                    }
                }

                if (!parts.empty())
                {
                    std::string combinedDescriptor = parts.front();
                    for (std::size_t idx = 1; idx < parts.size(); ++idx)
                    {
                        combinedDescriptor += ", " + parts[idx];
                    }
                    combinedDescriptorCounts[combinedDescriptor] += 1;
                }
            }
        }

        Json::JsonObject traitsJson;
        bool emitIndividualTraits = traitOrdering.size() <= 1;

        for (const auto &traitSum : quantitativeSums)
        {
            if (!emitIndividualTraits)
            {
                continue;
            }
            const std::string &traitId = traitSum.first;
            double total = traitSum.second;
            int count = quantitativeCounts[traitId];
            double mean = count > 0 ? total / static_cast<double>(count) : 0.0;

            Json::JsonObject traitObj;
            traitObj.emplace("mean_quantitative", Json(mean));

            Json::JsonObject descriptorObj;
            auto descriptorIt = descriptorCounts.find(traitId);
            if (descriptorIt != descriptorCounts.end())
            {
                for (const auto &entry : descriptorIt->second)
                {
                    descriptorObj.emplace(entry.first, Json(static_cast<int>(entry.second)));
                }
            }
            traitObj.emplace("descriptor_counts", Json(descriptorObj));
            traitsJson.emplace(traitId, Json(traitObj));
        }

        if (traitOrdering.size() > 1 && !combinedDescriptorCounts.empty())
        {
            Json::JsonObject traitObj;
            traitObj.emplace("mean_quantitative", Json(0.0));

            Json::JsonObject descriptorObj;
            for (const auto &entry : combinedDescriptorCounts)
            {
                descriptorObj.emplace(entry.first, Json(static_cast<int>(entry.second)));
            }
            traitObj.emplace("descriptor_counts", Json(descriptorObj));
            traitsJson[combinedTraitId] = Json(traitObj);
        }

        Json::JsonObject sexJson;
        for (const auto &sexCount : sexCounts)
        {
            sexJson.emplace(sexCount.first, Json(static_cast<int>(sexCount.second)));
        }

        Json response = Json(Json::JsonObject{
            {"simulations", Json(simulations)},
            {"sex_counts", Json(sexJson)},
            {"trait_summaries", Json(traitsJson)}});

        std::cout << response.dump() << std::endl;
        return 0;
    }
    catch (const std::exception &ex)
    {
        Json response = Json(Json::JsonObject{
            {"error", Json(ex.what())}});
        std::cout << response.dump() << std::endl;
        return 2;
    }
}
