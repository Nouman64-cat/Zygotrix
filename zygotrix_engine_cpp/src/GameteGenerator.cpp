#include "zygotrix/GameteGenerator.hpp"
#include <stdexcept>

namespace zygotrix {

Gamete GameteGenerator::generate(
    const Individual& parent,
    Sex sex,
    const std::vector<GeneDefinition>& genes,
    const std::unordered_map<std::size_t, std::vector<const GeneDefinition*>>& linkageMap,
    std::mt19937& rng) {
    
    Gamete gamete;
    bool passesX = true;

    if (sex == Sex::Male) {
        std::bernoulli_distribution decide(0.5);
        passesX = decide(rng);
        gamete.carriesX = passesX;
        gamete.carriesY = !passesX;
    } else {
        gamete.carriesX = true;
    }

    // Process linkage groups first
    for (const auto& entry : linkageMap) {
        generateGameteForGroup(entry.second, parent, gamete, passesX, rng);
    }

    std::bernoulli_distribution chooseAllele(0.5);

    // Process non-linked genes
    for (const auto& gene : genes) {
        if (gene.linkageGroup) {
            continue;  // Already processed in linkage groups
        }

        auto it = parent.genotype.find(gene.id);
        if (it == parent.genotype.end()) {
            throw std::runtime_error("Parent genotype missing gene " + gene.id);
        }
        const Genotype& alleles = it->second;

        auto takeAllele = [&](const std::string& allele) {
            gamete.alleles[gene.id] = allele;
            if (gene.chromosome == ChromosomeType::X) {
                gamete.carriesX = true;
            } else if (gene.chromosome == ChromosomeType::Y) {
                gamete.carriesY = true;
            }
        };

        switch (gene.chromosome) {
            case ChromosomeType::Autosomal: {
                if (alleles.empty()) {
                    throw std::runtime_error("Autosomal gene '" + gene.id + "' has no alleles recorded.");
                }
                if (alleles.size() == 1) {
                    takeAllele(alleles.front());
                } else {
                    std::size_t idx = chooseAllele(rng);
                    takeAllele(alleles[idx]);
                }
                break;
            }
            case ChromosomeType::X: {
                if (sex == Sex::Female) {
                    if (alleles.size() == 1) {
                        takeAllele(alleles.front());
                    } else if (alleles.size() == 2) {
                        std::size_t idx = chooseAllele(rng);
                        takeAllele(alleles[idx]);
                    } else {
                        throw std::runtime_error("X-linked gene '" + gene.id + "' has invalid allele count.");
                    }
                } else if (passesX) {
                    if (alleles.empty()) {
                        throw std::runtime_error("Male parent missing X-linked allele for gene '" + gene.id + "'");
                    }
                    takeAllele(alleles.front());
                }
                break;
            }
            case ChromosomeType::Y: {
                if (sex == Sex::Male && !passesX) {
                    if (alleles.empty()) {
                        throw std::runtime_error("Male parent missing Y-linked allele for gene '" + gene.id + "'");
                    }
                    takeAllele(alleles.front());
                }
                break;
            }
        }
    }

    return gamete;
}

void GameteGenerator::generateGameteForGroup(
    const std::vector<const GeneDefinition*>& group,
    const Individual& parent,
    Gamete& gamete,
    bool parentPassesX,
    std::mt19937& rng) {
    
    if (group.empty()) {
        return;
    }

    bool anchorSet = false;
    std::size_t homologIndex = 0;
    std::bernoulli_distribution pick(0.5);

    for (const GeneDefinition* gene : group) {
        auto it = parent.genotype.find(gene->id);
        if (it == parent.genotype.end()) {
            throw std::runtime_error("Parent genotype missing gene " + gene->id);
        }
        const Genotype& alleles = it->second;
        if (alleles.empty()) {
            continue;
        }

        bool skipGene = false;
        if (gene->chromosome == ChromosomeType::X && parent.sex == Sex::Male && !parentPassesX) {
            skipGene = true;
        }
        if (gene->chromosome == ChromosomeType::Y && parent.sex == Sex::Male && parentPassesX) {
            skipGene = true;
        }
        if (gene->chromosome == ChromosomeType::Y && parent.sex == Sex::Female) {
            skipGene = true;
        }

        if (skipGene) {
            continue;
        }

        std::string selectedAllele;
        if (alleles.size() <= 1) {
            selectedAllele = alleles.front();
        } else {
            if (!anchorSet) {
                homologIndex = pick(rng);
                anchorSet = true;
            } else {
                std::bernoulli_distribution crossover(gene->recombinationProbability);
                if (crossover(rng)) {
                    homologIndex = 1 - homologIndex;
                }
            }
            selectedAllele = alleles[homologIndex];
        }

        gamete.alleles[gene->id] = selectedAllele;
        if (gene->chromosome == ChromosomeType::X) {
            gamete.carriesX = true;
        } else if (gene->chromosome == ChromosomeType::Y) {
            gamete.carriesY = true;
        }
    }
}

}  // namespace zygotrix
