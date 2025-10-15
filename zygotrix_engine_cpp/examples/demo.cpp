#include "zygotrix/Engine.hpp"

#include <iostream>
#include <iomanip>
#include <string>
#include <unordered_map>
#include <vector>

using namespace zygotrix;

int main() {
    GeneDefinition furColor;
    furColor.id = "fur_color";
    furColor.chromosome = ChromosomeType::Autosomal;
    furColor.dominance = DominancePattern::Complete;
    furColor.defaultAlleleId = "B";
    furColor.alleles = {
        {"B", 2, {{"coat_color", 1.0, "black pigment"}}},
        {"b", 1, {{"coat_color", 0.6, "brown pigment"}}},
        {"bl", 0, {{"coat_color", 0.4, "dilute pigment"}}}
    };

    GeneDefinition pigmentGate;
    pigmentGate.id = "pigment_gate";
    pigmentGate.chromosome = ChromosomeType::Autosomal;
    pigmentGate.dominance = DominancePattern::Complete;
    pigmentGate.defaultAlleleId = "E";
    pigmentGate.alleles = {
        {"E", 1, {{"coat_color", 0.1, "pigment enabled"}}},
        {"e", 0, {{"coat_color", 0.0, "pigment disabled"}}}
    };

    GeneDefinition flowerColor;
    flowerColor.id = "flower_color";
    flowerColor.chromosome = ChromosomeType::Autosomal;
    flowerColor.dominance = DominancePattern::Incomplete;
    flowerColor.incompleteBlendWeight = 0.5;
    flowerColor.defaultAlleleId = "R";
    flowerColor.alleles = {
        {"R", 1, {{"petal_color", 1.0, "red hue"}}},
        {"W", 1, {{"petal_color", 0.0, "white hue"}}}
    };

    GeneDefinition bloodType;
    bloodType.id = "blood_type";
    bloodType.chromosome = ChromosomeType::Autosomal;
    bloodType.dominance = DominancePattern::Codominant;
    bloodType.defaultAlleleId = "i";
    bloodType.alleles = {
        {"IA", 1, {{"blood_markers", 1.0, "A antigen"}}},
        {"IB", 1, {{"blood_markers", 1.0, "B antigen"}}},
        {"i", 0, {{"blood_markers", 0.0, ""}}}
    };

    GeneDefinition linkedColor;
    linkedColor.id = "linked_color";
    linkedColor.chromosome = ChromosomeType::Autosomal;
    linkedColor.dominance = DominancePattern::Complete;
    linkedColor.linkageGroup = 1;
    linkedColor.recombinationProbability = 0.02;
    linkedColor.defaultAlleleId = "M";
    linkedColor.alleles = {
        {"M", 1, {{"pattern_color", 1.0, "deep shade"}}},
        {"m", 0, {{"pattern_color", 0.3, "soft shade"}}}
    };

    GeneDefinition linkedPattern;
    linkedPattern.id = "linked_pattern";
    linkedPattern.chromosome = ChromosomeType::Autosomal;
    linkedPattern.dominance = DominancePattern::Complete;
    linkedPattern.linkageGroup = 1;
    linkedPattern.recombinationProbability = 0.05;
    linkedPattern.defaultAlleleId = "S";
    linkedPattern.alleles = {
        {"S", 1, {{"pattern_shape", 1.0, "striped"}}},
        {"s", 0, {{"pattern_shape", 0.0, "solid"}}}
    };

    GeneDefinition vision;
    vision.id = "vision";
    vision.chromosome = ChromosomeType::X;
    vision.dominance = DominancePattern::Complete;
    vision.defaultAlleleId = "C";
    vision.alleles = {
        {"C", 1, {{"vision", 1.0, "normal color vision"}}},
        {"c", 0, {{"vision", 0.0, "colorblind"}}}
    };

    GeneDefinition growth;
    growth.id = "growth";
    growth.chromosome = ChromosomeType::Autosomal;
    growth.dominance = DominancePattern::Complete;
    growth.defaultAlleleId = "G";
    growth.alleles = {
        {"G", 1, {{"height", 5.0, "tall stature"}, {"weight", 8.0, "dense build"}}},
        {"g", 0, {{"height", -2.0, "short stature"}, {"weight", -4.0, "light build"}}}
    };

    EngineConfig config;
    config.genes = {furColor, pigmentGate, flowerColor, bloodType,
                    linkedColor, linkedPattern, vision, growth};

    EpistasisRule pigmentMask;
    pigmentMask.regulatorGene = "pigment_gate";
    pigmentMask.triggeringAllele = "e";
    pigmentMask.requirement = AlleleRequirement::Homozygous;
    pigmentMask.action = EpistasisAction::MaskTrait;
    pigmentMask.targetTrait = "coat_color";
    pigmentMask.overrideDescription = "albino (pigment blocked)";
    pigmentMask.overrideValue = 0.0;
    config.epistasis.push_back(pigmentMask);

    Engine engine(config);

    std::unordered_map<std::string, Genotype> motherGenes{
        {"fur_color", {"B", "bl"}},
        {"pigment_gate", {"E", "e"}},
        {"flower_color", {"R", "W"}},
        {"blood_type", {"IA", "IB"}},
        {"linked_color", {"M", "m"}},
        {"linked_pattern", {"S", "s"}},
        {"vision", {"C", "c"}},
        {"growth", {"G", "g"}}
    };

    std::unordered_map<std::string, Genotype> fatherGenes{
        {"fur_color", {"b", "bl"}},
        {"pigment_gate", {"e", "e"}},
        {"flower_color", {"W", "W"}},
        {"blood_type", {"IB", "i"}},
        {"linked_color", {"m", "m"}},
        {"linked_pattern", {"s", "s"}},
        {"vision", {"c"}},
        {"growth", {"g", "g"}}
    };

    Individual mother = engine.createIndividual(Sex::Female, motherGenes);
    Individual father = engine.createIndividual(Sex::Male, fatherGenes);

    for (int i = 0; i < 3; ++i) {
        Individual child = engine.mate(mother, father);
        Phenotype phenotype = engine.expressPhenotype(child);

        std::cout << "Child " << (i + 1) << " (" << (child.sex == Sex::Female ? "Female" : "Male") << ")\n";
        for (const auto& trait : phenotype.traits) {
            std::cout << "  - " << trait.first << ": "
                      << trait.second.summary()
                      << " [quantitative=" << std::fixed << std::setprecision(2)
                      << trait.second.quantitative << "]\n";
        }
        std::cout << '\n';
    }

    return 0;
}
