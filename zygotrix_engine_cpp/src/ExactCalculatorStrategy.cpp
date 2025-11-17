#include "zygotrix/ExactCalculatorStrategy.hpp"
#include "zygotrix/MendelianCalculator.hpp"
#include "json11/json11.hpp"

using json11::Json;
using namespace zygotrix;

namespace
{

    bool has_field(const Json &obj, const std::string &field)
    {
        return obj.is_object() && obj.object_items().count(field) != 0;
    }
}

Json ExactCalculatorStrategy::calculate(
    const Engine &engine,
    const Individual &mother,
    const Individual &father,
    const Json &request) const
{
    MendelianCalculator calculator(engine);

    std::vector<std::string> geneIds;
    for (const auto &gene : engine.config().genes)
    {
        geneIds.push_back(gene.id);
    }

    bool asPercentages = false;
    if (has_field(request, "as_percentages"))
    {
        asPercentages = request["as_percentages"].bool_value();
    }

    bool jointPhenotypes = false;
    if (has_field(request, "joint_phenotypes") && request["joint_phenotypes"].bool_value())
    {
        jointPhenotypes = true;
    }

    if (jointPhenotypes)
    {

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

        return response;
    }
    else
    {

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

        return response;
    }
}