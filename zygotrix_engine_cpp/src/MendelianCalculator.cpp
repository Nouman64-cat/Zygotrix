#include "zygotrix/MendelianCalculator.hpp"
#include <algorithm>
#include <numeric>
#include <sstream>
#include <stdexcept>
#include <cmath>

namespace zygotrix
{

    void GenotypeDistribution::normalize()
    {
        double total = std::accumulate(
            probabilities.begin(), probabilities.end(), 0.0,
            [](double sum, const auto &pair)
            { return sum + pair.second; });
        if (total > 0.0)
        {
            for (auto &[genotype, prob] : probabilities)
            {
                prob /= total;
            }
        }
    }

    void GenotypeDistribution::toPercentages()
    {
        for (auto &[genotype, prob] : probabilities)
        {
            prob *= 100.0;
        }
    }

    void PhenotypeDistribution::normalize()
    {
        double total = std::accumulate(
            probabilities.begin(), probabilities.end(), 0.0,
            [](double sum, const auto &pair)
            { return sum + pair.second; });
        if (total > 0.0)
        {
            for (auto &[phenotype, prob] : probabilities)
            {
                prob /= total;
            }
        }
    }

    void PhenotypeDistribution::toPercentages()
    {
        for (auto &[phenotype, prob] : probabilities)
        {
            prob *= 100.0;
        }
    }

    MendelianCalculator::MendelianCalculator(const Engine &engine)
        : engine_(engine) {}

    std::unordered_map<std::string, TraitResult> MendelianCalculator::calculateCross(
        const Individual &parent1,
        const Individual &parent2,
        const std::vector<std::string> &geneIds,
        bool asPercentages) const
    {
        std::unordered_map<std::string, TraitResult> results;

        for (const std::string &geneId : geneIds)
        {
            // Find the gene definition
            const GeneDefinition *geneDef = nullptr;
            for (const auto &gene : engine_.config().genes)
            {
                if (gene.id == geneId)
                {
                    geneDef = &gene;
                    break;
                }
            }

            if (!geneDef)
            {
                continue; // Skip if gene not found
            }

            // Get genotypes for this gene from both parents
            auto p1It = parent1.genotype.find(geneId);
            auto p2It = parent2.genotype.find(geneId);

            if (p1It == parent1.genotype.end() || p2It == parent2.genotype.end())
            {
                continue; // Skip if gene not present in either parent
            }

            TraitResult result = calculateSingleGene(
                *geneDef,
                p1It->second,
                p2It->second,
                parent1.sex,
                parent2.sex);

            if (asPercentages)
            {
                result.genotypic_ratios.toPercentages();
                result.phenotypic_ratios.toPercentages();
            }

            results[geneId] = std::move(result);
        }

        return results;
    }

    TraitResult MendelianCalculator::calculateSingleGene(
        const GeneDefinition &gene,
        const Genotype &parent1Genotype,
        const Genotype &parent2Genotype,
        Sex parent1Sex,
        Sex parent2Sex) const
    {
        // Step 1: Get gamete probabilities from each parent (Mendel's Law of Segregation)
        auto gametes1 = getGameteProbabilities(gene, parent1Genotype, parent1Sex);
        auto gametes2 = getGameteProbabilities(gene, parent2Genotype, parent2Sex);

        // Step 2: Combine gametes (Punnett square - Mendel's Law of Independent Assortment)
        GenotypeDistribution genotypes = combineGametes(gene, gametes1, gametes2);
        genotypes.normalize();

        // Step 3: Convert genotypes to phenotypes
        PhenotypeDistribution phenotypes = genotypesToPhenotypes(gene, genotypes);
        phenotypes.normalize();

        return TraitResult{genotypes, phenotypes};
    }

    std::unordered_map<std::string, double> MendelianCalculator::getGameteProbabilities(
        const GeneDefinition &gene,
        const Genotype &parentGenotype,
        Sex parentSex) const
    {
        std::unordered_map<std::string, double> gametes;

        if (gene.chromosome == ChromosomeType::Autosomal)
        {
            // Autosomal: 50% chance of each allele (assuming diploid)
            if (parentGenotype.size() == 2)
            {
                gametes[parentGenotype[0]] += 0.5;
                gametes[parentGenotype[1]] += 0.5;
            }
            else if (parentGenotype.size() == 1)
            {
                // Homozygous (represented as single allele)
                gametes[parentGenotype[0]] = 1.0;
            }
        }
        else if (gene.chromosome == ChromosomeType::X)
        {
            // X-linked
            if (parentSex == Sex::Female)
            {
                // XX: 50% chance of each X allele
                if (parentGenotype.size() >= 2)
                {
                    gametes[parentGenotype[0]] += 0.5;
                    gametes[parentGenotype[1]] += 0.5;
                }
                else if (parentGenotype.size() == 1)
                {
                    // Homozygous female
                    gametes[parentGenotype[0]] = 1.0;
                }
            }
            else
            {
                // XY male: 100% chance of passing the single X allele
                if (!parentGenotype.empty())
                {
                    gametes[parentGenotype[0]] = 1.0;
                }
            }
        }
        else if (gene.chromosome == ChromosomeType::Y)
        {
            // Y-linked: only passed from father to son
            if (parentSex == Sex::Male && !parentGenotype.empty())
            {
                gametes[parentGenotype[0]] = 1.0;
            }
        }

        return gametes;
    }

    GenotypeDistribution MendelianCalculator::combineGametes(
        const GeneDefinition &gene,
        const std::unordered_map<std::string, double> &gametes1,
        const std::unordered_map<std::string, double> &gametes2) const
    {
        GenotypeDistribution distribution;

        // Punnett square: combine each allele from parent1 with each from parent2
        for (const auto &[allele1, prob1] : gametes1)
        {
            for (const auto &[allele2, prob2] : gametes2)
            {
                // Multiply probabilities (independent events)
                double combinedProb = prob1 * prob2;

                // Create canonical genotype (sorted by dominance rank or alphabetically)
                std::string genotype = normalizeGenotypeString(gene, allele1, allele2);

                distribution.probabilities[genotype] += combinedProb;
            }
        }

        return distribution;
    }

    std::string MendelianCalculator::normalizeGenotypeString(
        const GeneDefinition &gene,
        const std::string &allele1,
        const std::string &allele2) const
    {
        // Find dominance ranks
        int rank1 = 0, rank2 = 0;
        bool found1 = false, found2 = false;

        for (const auto &allele : gene.alleles)
        {
            if (allele.id == allele1)
            {
                rank1 = allele.dominanceRank;
                found1 = true;
            }
            if (allele.id == allele2)
            {
                rank2 = allele.dominanceRank;
                found2 = true;
            }
        }

        // Sort by dominance rank (higher rank first), or alphabetically if equal
        if (!found1 && !found2)
        {
            return allele1 <= allele2 ? allele1 + allele2 : allele2 + allele1;
        }

        if (rank1 > rank2)
        {
            return allele1 + allele2;
        }
        else if (rank2 > rank1)
        {
            return allele2 + allele1;
        }
        else
        {
            // Equal ranks: sort alphabetically for consistency
            return allele1 <= allele2 ? allele1 + allele2 : allele2 + allele1;
        }
    }

    PhenotypeDistribution MendelianCalculator::genotypesToPhenotypes(
        const GeneDefinition &gene,
        const GenotypeDistribution &genotypes) const
    {
        PhenotypeDistribution distribution;

        for (const auto &[genotypeStr, prob] : genotypes.probabilities)
        {
            // Parse genotype string back to Genotype vector
            Genotype genotype = parseGenotypeString(gene, genotypeStr);

            // Get phenotype for this genotype
            std::string phenotype = getPhenotypeForGenotype(gene, genotype);

            distribution.probabilities[phenotype] += prob;
        }

        return distribution;
    }

    Genotype MendelianCalculator::parseGenotypeString(
        const GeneDefinition &gene,
        const std::string &genotypeStr) const
    {
        Genotype genotype;

        if (genotypeStr.empty())
        {
            return genotype;
        }

        // Try to split the genotype string into two alleles
        // Handle multi-character alleles (e.g., "Rh+", "IA")
        std::string remaining = genotypeStr;

        // Try each allele in the gene definition to find matches
        for (const auto &allele : gene.alleles)
        {
            size_t pos = remaining.find(allele.id);
            if (pos != std::string::npos)
            {
                genotype.push_back(allele.id);
                remaining.erase(pos, allele.id.length());

                if (remaining.empty())
                {
                    break;
                }
            }
        }

        // If we only found one allele, try to find another match
        if (genotype.size() == 1 && !remaining.empty())
        {
            for (const auto &allele : gene.alleles)
            {
                if (remaining == allele.id)
                {
                    genotype.push_back(allele.id);
                    break;
                }
            }
        }

        return genotype;
    }

    std::string MendelianCalculator::getPhenotypeForGenotype(
        const GeneDefinition &gene,
        const Genotype &genotype) const
    {
        if (genotype.empty())
        {
            return "Unknown";
        }

        // Handle different dominance patterns
        if (gene.dominance == DominancePattern::Complete)
        {
            // Complete dominance: highest rank allele determines phenotype
            const AlleleDefinition *dominantAllele = nullptr;
            int maxRank = -1;

            for (const std::string &alleleId : genotype)
            {
                const AlleleDefinition *allele = findAllele(gene, alleleId);
                if (allele && allele->dominanceRank > maxRank)
                {
                    maxRank = allele->dominanceRank;
                    dominantAllele = allele;
                }
            }

            if (dominantAllele && !dominantAllele->effects.empty())
            {
                return dominantAllele->effects[0].description;
            }
        }
        else if (gene.dominance == DominancePattern::Codominant)
        {
            // Codominant: both alleles express (e.g., AB blood type)
            // Use a set to avoid duplicates when homozygous
            std::vector<std::string> descriptions;
            std::vector<std::string> uniqueDescriptions;

            for (const std::string &alleleId : genotype)
            {
                const AlleleDefinition *allele = findAllele(gene, alleleId);
                if (allele && !allele->effects.empty() && allele->dominanceRank > 0)
                {
                    descriptions.push_back(allele->effects[0].description);
                }
            }

            // Remove duplicates while preserving order
            for (const auto &desc : descriptions)
            {
                bool found = false;
                for (const auto &unique : uniqueDescriptions)
                {
                    if (unique == desc)
                    {
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    uniqueDescriptions.push_back(desc);
                }
            }

            if (uniqueDescriptions.empty())
            {
                // Both alleles are recessive
                const AlleleDefinition *allele = findAllele(gene, genotype[0]);
                if (allele && !allele->effects.empty())
                {
                    return allele->effects[0].description;
                }
            }
            else if (uniqueDescriptions.size() == 1)
            {
                return uniqueDescriptions[0];
            }
            else
            {
                // Combine unique descriptions (e.g., "Blood Type A" + "Blood Type B" → "Blood Type AB")
                // For simplicity, concatenate
                std::string combined = uniqueDescriptions[0];
                for (size_t i = 1; i < uniqueDescriptions.size(); ++i)
                {
                    combined += ", " + uniqueDescriptions[i];
                }
                return combined;
            }
        }
        else if (gene.dominance == DominancePattern::Incomplete)
        {
            // Incomplete dominance: blending (would need magnitude values)
            // For now, if heterozygous, look for intermediate descriptor
            if (genotype.size() == 2 && genotype[0] != genotype[1])
            {
                const AlleleDefinition *allele1 = findAllele(gene, genotype[0]);
                const AlleleDefinition *allele2 = findAllele(gene, genotype[1]);

                if (allele1 && !allele1->effects.empty() &&
                    !allele1->effects[0].intermediateDescriptor.empty())
                {
                    return allele1->effects[0].intermediateDescriptor;
                }
                if (allele2 && !allele2->effects.empty() &&
                    !allele2->effects[0].intermediateDescriptor.empty())
                {
                    return allele2->effects[0].intermediateDescriptor;
                }
            }

            // Otherwise use dominant allele
            const AlleleDefinition *dominantAllele = nullptr;
            int maxRank = -1;

            for (const std::string &alleleId : genotype)
            {
                const AlleleDefinition *allele = findAllele(gene, alleleId);
                if (allele && allele->dominanceRank > maxRank)
                {
                    maxRank = allele->dominanceRank;
                    dominantAllele = allele;
                }
            }

            if (dominantAllele && !dominantAllele->effects.empty())
            {
                return dominantAllele->effects[0].description;
            }
        }

        // Fallback: use first allele's description
        const AlleleDefinition *firstAllele = findAllele(gene, genotype[0]);
        if (firstAllele && !firstAllele->effects.empty())
        {
            return firstAllele->effects[0].description;
        }

        return "Unknown";
    }

    const AlleleDefinition *MendelianCalculator::findAllele(
        const GeneDefinition &gene,
        const std::string &alleleId) const
    {
        for (const auto &allele : gene.alleles)
        {
            if (allele.id == alleleId)
            {
                return &allele;
            }
        }
        return nullptr;
    }

    std::string MendelianCalculator::genotypeToString(const Genotype &genotype) const
    {
        std::string result;
        for (const auto &allele : genotype)
        {
            result += allele;
        }
        return result;
    }

    std::unordered_map<std::string, double> MendelianCalculator::calculateJointPhenotypes(
        const Individual &parent1,
        const Individual &parent2,
        const std::vector<std::string> &geneIds,
        bool asPercentages) const
    {
        // First, calculate individual trait results
        auto individualResults = calculateCross(parent1, parent2, geneIds, false);

        // Then, combine phenotypes using Cartesian product
        std::unordered_map<std::string, double> jointProbabilities;

        // Recursive helper to generate all combinations
        std::function<void(size_t, std::vector<std::string>, double)> generateCombinations;
        generateCombinations = [&](size_t index, std::vector<std::string> currentPhenotypes, double currentProb)
        {
            if (index == geneIds.size())
            {
                // Combine phenotypes into single string
                if (currentPhenotypes.empty())
                {
                    return;
                }

                std::string combined = currentPhenotypes[0];
                for (size_t i = 1; i < currentPhenotypes.size(); ++i)
                {
                    combined += " + " + currentPhenotypes[i];
                }
                jointProbabilities[combined] += currentProb;
                return;
            }

            const std::string &geneId = geneIds[index];
            auto it = individualResults.find(geneId);
            if (it == individualResults.end())
            {
                return;
            }

            // For each phenotype of this trait
            for (const auto &[phenotype, prob] : it->second.phenotypic_ratios.probabilities)
            {
                auto newPhenotypes = currentPhenotypes;
                newPhenotypes.push_back(phenotype);
                generateCombinations(index + 1, newPhenotypes, currentProb * prob);
            }
        };

        generateCombinations(0, {}, 1.0);

        if (asPercentages)
        {
            for (auto &[phenotype, prob] : jointProbabilities)
            {
                prob *= 100.0;
            }
        }

        return jointProbabilities;
    }

} // namespace zygotrix
