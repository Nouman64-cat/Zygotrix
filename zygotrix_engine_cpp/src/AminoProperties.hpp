#ifndef AMINO_PROPERTIES_HPP
#define AMINO_PROPERTIES_HPP

#include <unordered_map>
#include "GeneticCode.hpp" // Your previous file with the Enum

struct AminoStats {
    // 0 = Loves Water (Hydrophilic), 100 = Hates Water (Hydrophobic/Oily)
    // High numbers want to be in the CENTER of the protein.
    int hydrophobicity; 

    // -1 = Negative, 0 = Neutral, 1 = Positive
    // Opposites attract (+ and - stick together).
    int charge;

    // 0.0 to 1.0 probability of forming an Alpha Helix.
    // If > 0.8, this part of the chain naturally coils up.
    float helix_propensity; 
    
    // True if this amino acid breaks the chain flow (like a kink in a wire)
    bool is_helix_breaker;
};

// The Lookup Table: O(1) Access time
const std::unordered_map<AminoAcid, AminoStats> property_map = {
    // --- The "Oily" Core Builders (Hydrophobic) ---
    // These drive the folding. They bury themselves inside.
    {AminoAcid::ILE, {100,  0, 0.90f, false}}, // Most hydrophobic
    {AminoAcid::VAL, { 97,  0, 0.85f, false}},
    {AminoAcid::LEU, { 95,  0, 0.95f, false}}, // Strong helix former
    {AminoAcid::PHE, { 80,  0, 0.70f, false}},
    {AminoAcid::MET, { 70,  0, 0.80f, false}}, // Start codon usually
    
    // --- The "Water Lovers" (Hydrophilic/Polar) ---
    // These stay on the outside surface to interact with the cell.
    {AminoAcid::ARG, {  0,  1, 0.60f, false}}, // Positive Charge
    {AminoAcid::LYS, {  5,  1, 0.85f, false}}, // Positive Charge
    {AminoAcid::ASP, {  5, -1, 0.40f, false}}, // Negative Charge
    {AminoAcid::GLU, {  5, -1, 0.95f, false}}, // Negative Charge (Helix lover)
    {AminoAcid::ASN, { 10,  0, 0.30f, false}},
    {AminoAcid::GLN, { 10,  0, 0.75f, false}},
    {AminoAcid::HIS, { 15,  1, 0.50f, false}}, // Often the "active site" in enzymes
    
    // --- The "Neutral/Intermediate" Ones ---
    {AminoAcid::ALA, { 60,  0, 0.98f, false}}, // Simple, versatile
    {AminoAcid::CYS, { 75,  0, 0.30f, false}}, // Special: Forms Disulfide bonds (Glue)
    {AminoAcid::TYR, { 40,  0, 0.50f, false}},
    {AminoAcid::TRP, { 35,  0, 0.60f, false}},
    {AminoAcid::THR, { 30,  0, 0.40f, false}},
    {AminoAcid::SER, { 20,  0, 0.40f, false}},

    // --- The "Rule Breakers" ---
    // PROLINE: Rigid. Kinks the chain. Cannot exist inside a normal helix.
    {AminoAcid::PRO, { 30,  0, 0.00f, true }}, 
    
    // GLYCINE: Too flexible. The "hinge" of the protein.
    {AminoAcid::GLY, { 45,  0, 0.10f, false}}, 
    
    // STOP/UNKNOWN
    {AminoAcid::STOP,    {0, 0, 0.0f, false}},
    {AminoAcid::UNKNOWN, {0, 0, 0.0f, false}}
};

#endif // AMINO_PROPERTIES_HPP