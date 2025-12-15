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

// 3. Helper: Convert Enum back to Standard 3-Letter Code
// FIXED: Now returns standard abbreviations (e.g., "Asn") instead of full names
inline std::string get_amino_name(AminoAcid aa) {
    switch (aa) {
        case AminoAcid::PHE: return "Phe";
        case AminoAcid::LEU: return "Leu";
        case AminoAcid::ILE: return "Ile";
        case AminoAcid::MET: return "Met";
        case AminoAcid::VAL: return "Val";
        case AminoAcid::SER: return "Ser";
        case AminoAcid::PRO: return "Pro";
        case AminoAcid::THR: return "Thr";
        case AminoAcid::ALA: return "Ala";
        case AminoAcid::TYR: return "Tyr";
        case AminoAcid::HIS: return "His";
        
        // These were the problem cases in the old version
        case AminoAcid::GLN: return "Gln"; 
        case AminoAcid::ASN: return "Asn"; 
        case AminoAcid::LYS: return "Lys";
        case AminoAcid::ASP: return "Asp";
        case AminoAcid::GLU: return "Glu";
        
        case AminoAcid::CYS: return "Cys";
        case AminoAcid::TRP: return "Trp";
        case AminoAcid::ARG: return "Arg";
        case AminoAcid::GLY: return "Gly";
        case AminoAcid::STOP: return "STOP";
        default: return "UNK";
    }
}

// 4. Helper: Convert Enum to Standard 1-Letter Code
inline char get_amino_char(AminoAcid aa) {
    switch (aa) {
        case AminoAcid::ALA: return 'A';
        case AminoAcid::ARG: return 'R'; 
        case AminoAcid::ASN: return 'N'; 
        case AminoAcid::ASP: return 'D'; 
        case AminoAcid::CYS: return 'C';
        case AminoAcid::GLN: return 'Q'; 
        case AminoAcid::GLU: return 'E'; 
        case AminoAcid::GLY: return 'G';
        case AminoAcid::HIS: return 'H';
        case AminoAcid::ILE: return 'I';
        case AminoAcid::LEU: return 'L';
        case AminoAcid::LYS: return 'K'; 
        case AminoAcid::MET: return 'M';
        case AminoAcid::PHE: return 'F'; 
        case AminoAcid::PRO: return 'P';
        case AminoAcid::SER: return 'S';
        case AminoAcid::THR: return 'T';
        case AminoAcid::TRP: return 'W'; 
        case AminoAcid::TYR: return 'Y'; 
        case AminoAcid::VAL: return 'V';
        case AminoAcid::STOP: return '*'; 
        default: return '?';
    }
}

#endif // GENETIC_CODE_HPP