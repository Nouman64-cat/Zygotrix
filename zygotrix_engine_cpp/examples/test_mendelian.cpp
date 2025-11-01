#include "zygotrix/Engine.hpp"
#include "zygotrix/MendelianCalculator.hpp"
#include <iostream>
#include <iomanip>

using namespace zygotrix;

int main()
{
    std::cout << "=== Testing MendelianCalculator ===" << std::endl
              << std::endl;

    // Test 1: Simple Mendelian trait (Eye color: B=brown dominant, b=blue recessive)
    std::cout << "Test 1: Eye Color (Bb × Bb)" << std::endl;
    std::cout << "Expected: BB=25%, Bb=50%, bb=25% → Brown=75%, Blue=25%" << std::endl;

    GeneDefinition eyeColor;
    eyeColor.id = "eye_color";
    eyeColor.chromosome = ChromosomeType::Autosomal;
    eyeColor.dominance = DominancePattern::Complete;
    eyeColor.defaultAlleleId = "B";
    eyeColor.alleles = {
        {"B", 1, {{"eye_color", 1.0, "Brown"}}},
        {"b", 0, {{"eye_color", 0.0, "Blue"}}}};

    EngineConfig config1;
    config1.genes = {eyeColor};

    Engine engine1(config1);
    MendelianCalculator calculator1(engine1);

    Individual parent1 = engine1.createIndividual(Sex::Female, {{"eye_color", {"B", "b"}}});

    Individual parent2 = engine1.createIndividual(Sex::Male, {{"eye_color", {"B", "b"}}});

    auto results1 = calculator1.calculateCross(
        parent1, parent2,
        {"eye_color"},
        true // as percentages
    );

    for (const auto &[geneId, result] : results1)
    {
        std::cout << "Gene: " << geneId << std::endl;

        std::cout << "  Genotypic Ratios:" << std::endl;
        for (const auto &[genotype, prob] : result.genotypic_ratios.probabilities)
        {
            std::cout << "    " << genotype << ": "
                      << std::fixed << std::setprecision(2) << prob << "%" << std::endl;
        }

        std::cout << "  Phenotypic Ratios:" << std::endl;
        for (const auto &[phenotype, prob] : result.phenotypic_ratios.probabilities)
        {
            std::cout << "    " << phenotype << ": "
                      << std::fixed << std::setprecision(2) << prob << "%" << std::endl;
        }
    }

    std::cout << std::endl;

    // Test 2: Codominant trait (ABO blood type)
    std::cout << "Test 2: ABO Blood Type (AB × AO)" << std::endl;
    std::cout << "Expected: AA=25%, AO=25%, AB=25%, BO=25% → A=50%, AB=25%, B=25%" << std::endl;

    GeneDefinition aboBlood;
    aboBlood.id = "abo_blood";
    aboBlood.chromosome = ChromosomeType::Autosomal;
    aboBlood.dominance = DominancePattern::Codominant;
    aboBlood.defaultAlleleId = "O";
    aboBlood.alleles = {
        {"A", 1, {{"blood_type", 1.0, "Blood Type A"}}},
        {"B", 1, {{"blood_type", 1.0, "Blood Type B"}}},
        {"O", 0, {{"blood_type", 0.0, "Blood Type O"}}}};

    EngineConfig config2;
    config2.genes = {aboBlood};

    Engine engine2(config2);
    MendelianCalculator calculator2(engine2);

    Individual parent3 = engine2.createIndividual(Sex::Female, {{"abo_blood", {"A", "B"}}});

    Individual parent4 = engine2.createIndividual(Sex::Male, {{"abo_blood", {"A", "O"}}});

    auto results2 = calculator2.calculateCross(
        parent3, parent4,
        {"abo_blood"},
        true);

    for (const auto &[geneId, result] : results2)
    {
        std::cout << "Gene: " << geneId << std::endl;

        std::cout << "  Genotypic Ratios:" << std::endl;
        for (const auto &[genotype, prob] : result.genotypic_ratios.probabilities)
        {
            std::cout << "    " << genotype << ": "
                      << std::fixed << std::setprecision(2) << prob << "%" << std::endl;
        }

        std::cout << "  Phenotypic Ratios:" << std::endl;
        for (const auto &[phenotype, prob] : result.phenotypic_ratios.probabilities)
        {
            std::cout << "    " << phenotype << ": "
                      << std::fixed << std::setprecision(2) << prob << "%" << std::endl;
        }
    }

    std::cout << std::endl;

    // Test 3: Joint phenotypes (Eye color + Blood type)
    std::cout << "Test 3: Joint Phenotypes (Eye Bb × Bb + Blood AB × AO)" << std::endl;

    EngineConfig config3;
    config3.genes = {eyeColor, aboBlood};

    Engine engine3(config3);
    MendelianCalculator calculator3(engine3);

    Individual parent5 = engine3.createIndividual(Sex::Female, {{"eye_color", {"B", "b"}},
                                                                {"abo_blood", {"A", "B"}}});

    Individual parent6 = engine3.createIndividual(Sex::Male, {{"eye_color", {"B", "b"}},
                                                              {"abo_blood", {"A", "O"}}});

    auto jointResults = calculator3.calculateJointPhenotypes(
        parent5, parent6,
        {"eye_color", "abo_blood"},
        true);

    std::cout << "Joint Phenotype Probabilities:" << std::endl;
    for (const auto &[phenotype, prob] : jointResults)
    {
        std::cout << "  " << phenotype << ": "
                  << std::fixed << std::setprecision(2) << prob << "%" << std::endl;
    }

    std::cout << std::endl
              << "=== All tests completed ===" << std::endl;

    return 0;
}
