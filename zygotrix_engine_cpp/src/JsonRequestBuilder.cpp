#include "zygotrix/JsonRequestBuilder.hpp"
#include <stdexcept>
#include <algorithm>
#include <cctype>
#include <unordered_map>

using json11::Json;
using namespace zygotrix;

namespace
{
    // All helper functions moved from CrossCli.cpp
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

    // Moved from a lambda in CrossCli.cpp's main
    std::unordered_map<std::string, Genotype> parse_genotype(const Json &genotypeJson)
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

} // namespace

JsonRequestBuilder::JsonRequestBuilder(const Json &request)
    : m_request(request)
{
}

EngineConfig JsonRequestBuilder::buildEngineConfig() const
{
    EngineConfig config;
    std::unordered_map<std::string, std::size_t> geneIndex;

    if (has_field(m_request, "genes"))
    {
        for (const Json &geneJson : m_request["genes"].array_items())
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
                        allele.effects.push_back(std::move(effect));
                    }
                }
                gene.alleles.push_back(std::move(allele));
            }

            std::size_t index = config.genes.size();
            geneIndex.emplace(gene.id, index);
            config.genes.push_back(std::move(gene));
        }
    }

    if (has_field(m_request, "linkage"))
    {
        std::size_t nextGroupId = 1;
        for (const Json &linkageJson : m_request["linkage"].array_items())
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

    if (has_field(m_request, "epistasis"))
    {
        for (const Json &epiJson : m_request["epistasis"].array_items())
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

    return config;
}

Individual JsonRequestBuilder::buildMother(const Engine &engine) const
{
    const Json &motherJson = m_request["mother"];
    Sex motherSex = Sex::Female;
    if (has_field(motherJson, "sex"))
    {
        motherSex = parse_sex(motherJson["sex"].string_value());
    }

    return engine.createIndividual(
        motherSex,
        parse_genotype(motherJson["genotype"]));
}

Individual JsonRequestBuilder::buildFather(const Engine &engine) const
{
    const Json &fatherJson = m_request["father"];
    Sex fatherSex = Sex::Male;
    if (has_field(fatherJson, "sex"))
    {
        fatherSex = parse_sex(fatherJson["sex"].string_value());
    }

    return engine.createIndividual(
        fatherSex,
        parse_genotype(fatherJson["genotype"]));
}