#ifndef PROTEIN_HPP
#define PROTEIN_HPP

#include <vector>
#include <string>
#include <iostream>
#include "GeneticCode.hpp"
#include "AminoProperties.hpp"

// Classification for your Simulation
enum class ProteinType {
    UNKNOWN,
    GLOBULAR_ENZYME,  // Balanced (Standard biological worker)
    FIBROUS_STRUCTURAL, // Highly hydrophobic (Like muscle/hair)
    DISORDERED_SIGNALING, // Highly charged (Like simple messages)
    INVALID // Broken/Too short
};

class Protein {
private:
    std::vector<AminoAcid> chain;
    
    // Simulation Stats
    int stability_score = 0;
    int hydrophobicity_score = 0;
    ProteinType type = ProteinType::UNKNOWN;

public:
    // --- 1. TRANSCRIPTION & TRANSLATION (The Ribosome) ---
    // Takes a raw DNA string, finds the amino acids, and builds the chain.
    void synthesize_from_dna(const std::string& dna_sequence) {
        chain.clear();
        
        // We iterate 3 bases at a time (Codons)
        for (size_t i = 0; i + 2 < dna_sequence.length(); i += 3) {
            std::string codon = dna_sequence.substr(i, 3);
            
            // DNA to RNA (T -> U) handling
            // Since our table uses U, we can just treat T as U for lookup
            for (char &c : codon) { if (c == 'T') c = 'U'; }

            // Lookup
            auto it = codon_table.find(codon);
            if (it != codon_table.end()) {
                AminoAcid aa = it->second;

                if (aa == AminoAcid::STOP) {
                    break; // Stop synthesis immediately
                }
                chain.push_back(aa);
            }
        }
        
        // Immediately trigger folding after synthesis
        fold();
    }

    // --- 2. FOLDING SIMULATION (The "Game Logic") ---
    // Calculates the stats based on the sequence
    void fold() {
        if (chain.empty()) {
            type = ProteinType::INVALID;
            return;
        }

        stability_score = 0;
        hydrophobicity_score = 0;
        int charge_balance = 0;

        for (AminoAcid aa : chain) {
            if (property_map.find(aa) == property_map.end()) continue;
            
            AminoStats stats = property_map.at(aa);
            
            // Sum up stats
            hydrophobicity_score += stats.hydrophobicity;
            stability_score += (stats.helix_propensity > 0.8f) ? 5 : 0; // Bonus for helices
            stability_score -= (stats.is_helix_breaker) ? 5 : 0;        // Penalty for breaks
            charge_balance += std::abs(stats.charge);
        }

        // Normalize scores based on length (Average per amino acid)
        int avg_hydro = hydrophobicity_score / chain.size();

        // --- 3. CLASSIFICATION ---
        // Determine what this protein "does" in the simulation
        if (avg_hydro > 60) {
            type = ProteinType::FIBROUS_STRUCTURAL; // Oily/Solid
        } else if (charge_balance > chain.size() / 2) {
            type = ProteinType::DISORDERED_SIGNALING; // Highly charged/Watery
        } else {
            type = ProteinType::GLOBULAR_ENZYME; // Balanced
        }
    }

    // --- Getters for the UI/API ---
    int get_length() const { return chain.size(); }
    int get_stability() const { return stability_score; }
    std::string get_type_name() const {
        switch(type) {
            case ProteinType::GLOBULAR_ENZYME: return "Enzyme (Globular)";
            case ProteinType::FIBROUS_STRUCTURAL: return "Structural (Fibrous)";
            case ProteinType::DISORDERED_SIGNALING: return "Signaling (Disordered)";
            case ProteinType::INVALID: return "Invalid/Junk";
            default: return "Unknown";
        }
    }
    

    void set_sequence(const std::vector<AminoAcid>& new_chain) {
        chain = new_chain;
        fold(); // Auto-calculate stats immediately
    }

    void print_structure() const {
        std::cout << "--- Protein Structure View ---" << std::endl;
        
        // ROW 1: The 3-Letter Code
        std::cout << "3-Letter: ";
        for(size_t i = 0; i < chain.size(); ++i) {
            // Get full name, take first 3 chars
            std::cout << get_amino_name(chain[i]).substr(0, 3);
            if (i < chain.size() - 1) std::cout << "-";
        }
        std::cout << "-STOP" << std::endl;

        // ROW 2: The 1-Letter Code
        std::cout << "1-Letter: ";
        for(size_t i = 0; i < chain.size(); ++i) {
            std::cout << get_amino_char(chain[i]);
        }
        std::cout << std::endl;
    }

    void synthesize_from_rna(const std::string& rna_sequence) {
        chain.clear();

        // Iterate 3 bases at a time (Codons)
        for (size_t i = 0; i + 2 < rna_sequence.length(); i += 3) {
            std::string codon = rna_sequence.substr(i, 3);

            // Note: We no longer need the T->U loop here, 
            // because the Transcriber class already did it!
            
            auto it = codon_table.find(codon);
            if (it != codon_table.end()) {
                AminoAcid aa = it->second;
                if (aa == AminoAcid::STOP) break;
                chain.push_back(aa);
            }
        }
        fold();
    }
};

#endif // PROTEIN_HPP