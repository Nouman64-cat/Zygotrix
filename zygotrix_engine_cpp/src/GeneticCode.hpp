#ifndef GENETIC_CODE_HPP
#define GENETIC_CODE_HPP

#include <unordered_map>
#include <string>

// 1. The Lightweight Enum (Uses 1 byte of memory per amino acid usually)
enum class AminoAcid {
    PHE, LEU, ILE, MET, VAL, 
    SER, PRO, THR, ALA, TYR, 
    HIS, GLN, ASN, LYS, ASP, 
    GLU, CYS, TRP, ARG, GLY, 
    STOP, UNKNOWN
};

// 2. The Lookup Table
// Maps string codons ("AUG") to the lightweight Enum (AminoAcid::MET)
const std::unordered_map<std::string, AminoAcid> codon_table = {
    // Phe
    {"UUU", AminoAcid::PHE}, {"UUC", AminoAcid::PHE},
    // Leu
    {"UUA", AminoAcid::LEU}, {"UUG", AminoAcid::LEU}, {"CUU", AminoAcid::LEU}, 
    {"CUC", AminoAcid::LEU}, {"CUA", AminoAcid::LEU}, {"CUG", AminoAcid::LEU},
    // Ile
    {"AUU", AminoAcid::ILE}, {"AUC", AminoAcid::ILE}, {"AUA", AminoAcid::ILE},
    // Met (Start)
    {"AUG", AminoAcid::MET},
    // Val
    {"GUU", AminoAcid::VAL}, {"GUC", AminoAcid::VAL}, {"GUA", AminoAcid::VAL}, {"GUG", AminoAcid::VAL},
    // Ser
    {"UCU", AminoAcid::SER}, {"UCC", AminoAcid::SER}, {"UCA", AminoAcid::SER}, 
    {"UCG", AminoAcid::SER}, {"AGU", AminoAcid::SER}, {"AGC", AminoAcid::SER},
    // Pro
    {"CCU", AminoAcid::PRO}, {"CCC", AminoAcid::PRO}, {"CCA", AminoAcid::PRO}, {"CCG", AminoAcid::PRO},
    // Thr
    {"ACU", AminoAcid::THR}, {"ACC", AminoAcid::THR}, {"ACA", AminoAcid::THR}, {"ACG", AminoAcid::THR},
    // Ala
    {"GCU", AminoAcid::ALA}, {"GCC", AminoAcid::ALA}, {"GCA", AminoAcid::ALA}, {"GCG", AminoAcid::ALA},
    // Tyr
    {"UAU", AminoAcid::TYR}, {"UAC", AminoAcid::TYR},
    // Stop
    {"UAA", AminoAcid::STOP}, {"UAG", AminoAcid::STOP}, {"UGA", AminoAcid::STOP},
    // His
    {"CAU", AminoAcid::HIS}, {"CAC", AminoAcid::HIS},
    // Gln
    {"CAA", AminoAcid::GLN}, {"CAG", AminoAcid::GLN},
    // Asn
    {"AAU", AminoAcid::ASN}, {"AAC", AminoAcid::ASN},
    // Lys
    {"AAA", AminoAcid::LYS}, {"AAG", AminoAcid::LYS},
    // Asp
    {"GAU", AminoAcid::ASP}, {"GAC", AminoAcid::ASP},
    // Glu
    {"GAA", AminoAcid::GLU}, {"GAG", AminoAcid::GLU},
    // Cys
    {"UGU", AminoAcid::CYS}, {"UGC", AminoAcid::CYS},
    // Trp
    {"UGG", AminoAcid::TRP},
    // Arg
    {"CGU", AminoAcid::ARG}, {"CGC", AminoAcid::ARG}, {"CGA", AminoAcid::ARG}, 
    {"CGG", AminoAcid::ARG}, {"AGA", AminoAcid::ARG}, {"AGG", AminoAcid::ARG},
    // Gly
    {"GGU", AminoAcid::GLY}, {"GGC", AminoAcid::GLY}, {"GGA", AminoAcid::GLY}, {"GGG", AminoAcid::GLY}
};

// 3. Helper: Convert Enum back to String (For UI/Debugging)
// You call this only when you need to print something to the screen.
inline std::string get_amino_name(AminoAcid aa) {
    switch (aa) {
        case AminoAcid::PHE: return "Phenylalanine";
        case AminoAcid::LEU: return "Leucine";
        case AminoAcid::ILE: return "Isoleucine";
        case AminoAcid::MET: return "Methionine (Start)";
        case AminoAcid::VAL: return "Valine";
        case AminoAcid::SER: return "Serine";
        case AminoAcid::PRO: return "Proline";
        case AminoAcid::THR: return "Threonine";
        case AminoAcid::ALA: return "Alanine";
        case AminoAcid::TYR: return "Tyrosine";
        case AminoAcid::HIS: return "Histidine";
        case AminoAcid::GLN: return "Glutamine";
        case AminoAcid::ASN: return "Asparagine";
        case AminoAcid::LYS: return "Lysine";
        case AminoAcid::ASP: return "Aspartic Acid";
        case AminoAcid::GLU: return "Glutamic Acid";
        case AminoAcid::CYS: return "Cysteine";
        case AminoAcid::TRP: return "Tryptophan";
        case AminoAcid::ARG: return "Arginine";
        case AminoAcid::GLY: return "Glycine";
        case AminoAcid::STOP: return "STOP";
        default: return "Unknown";
    }
}

#endif // GENETIC_CODE_HPP