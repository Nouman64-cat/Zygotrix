#include "zygotrix/SimulationCalculatorStrategy.hpp"
#include "json11/json11.hpp"

#include <sstream>
#include <unordered_map>
#include <vector>

using json11::Json;
using namespace zygotrix;

namespace
{
    // Helper function moved from CrossCli.cpp
    bool has_field(const Json &obj, const std::string &field)
    {
        return obj.is_object() && obj.object_items().count(field) != 0;
    }
} // namespace

Json SimulationCalculatorStrategy::calculate(
    const Engine &engine,
    const Individual &mother,
    const Individual &father,
    const Json &request) const
{
    // Logic for tracking trait order and sex-specificity
    // This was moved from CrossCli.cpp (lines 172-204)
    std::vector<std::string> traitOrdering;
    std::unordered_map<std::string, bool> traitSeen;
    std::unordered_map<std::string, bool> traitSexSpecific;

    for (const auto &gene : engine.config().genes)
    {
        for (const auto &allele : gene.alleles)
        {
            for (const auto &effect : allele.effects)
            {
                std::string traitIdForRegistration = effect.traitId;
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

    return response;
}