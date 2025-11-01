#pragma once

#include "Engine.hpp"
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

namespace zygotrix
{

    // Result structures matching Python engine output
    struct GenotypeDistribution
    {
        std::unordered_map<std::string, double> probabilities;

        void normalize();     // Ensure probabilities sum to 1.0
        void toPercentages(); // Convert to percentages (multiply by 100)
    };

    struct PhenotypeDistribution
    {
        std::unordered_map<std::string, double> probabilities;

        void normalize();
        void toPercentages();
    };

    struct TraitResult
    {
        GenotypeDistribution genotypic_ratios;
        PhenotypeDistribution phenotypic_ratios;
    };

    class MendelianCalculator
    {
    public:
        explicit MendelianCalculator(const Engine &engine);

        // Main API: Calculate exact probabilities for multiple traits
        std::unordered_map<std::string, TraitResult> calculateCross(
            const Individual &parent1,
            const Individual &parent2,
            const std::vector<std::string> &geneIds,
            bool asPercentages = false) const;

        // Joint phenotype calculation (e.g., "Brown Eyes + Curly Hair")
        std::unordered_map<std::string, double> calculateJointPhenotypes(
            const Individual &parent1,
            const Individual &parent2,
            const std::vector<std::string> &geneIds,
            bool asPercentages = false) const;

    private:
        const Engine &engine_;

        // Core calculation for single gene/trait
        TraitResult calculateSingleGene(
            const GeneDefinition &gene,
            const Genotype &parent1Genotype,
            const Genotype &parent2Genotype,
            Sex parent1Sex,
            Sex parent2Sex) const;

        // Get gamete probabilities (Mendel's Law of Segregation)
        std::unordered_map<std::string, double> getGameteProbabilities(
            const GeneDefinition &gene,
            const Genotype &parentGenotype,
            Sex parentSex) const;

        // Combine gametes to get offspring genotype probabilities (Punnett square)
        GenotypeDistribution combineGametes(
            const GeneDefinition &gene,
            const std::unordered_map<std::string, double> &gametes1,
            const std::unordered_map<std::string, double> &gametes2) const;

        // Convert genotype probabilities to phenotype probabilities
        PhenotypeDistribution genotypesToPhenotypes(
            const GeneDefinition &gene,
            const GenotypeDistribution &genotypes) const;

        // Get phenotype description for a genotype
        std::string getPhenotypeForGenotype(
            const GeneDefinition &gene,
            const Genotype &genotype) const;

        // Normalize genotype to canonical form (e.g., "Aa" → "Aa", "aA" → "Aa")
        std::string normalizeGenotypeString(
            const GeneDefinition &gene,
            const std::string &allele1,
            const std::string &allele2) const;

        // Parse genotype string back to Genotype vector
        Genotype parseGenotypeString(
            const GeneDefinition &gene,
            const std::string &genotypeStr) const;

        // Convert Genotype to string representation
        std::string genotypeToString(const Genotype &genotype) const;

        // Helper: Find allele definition by ID
        const AlleleDefinition *findAllele(
            const GeneDefinition &gene,
            const std::string &alleleId) const;
    };

} // namespace zygotrix
