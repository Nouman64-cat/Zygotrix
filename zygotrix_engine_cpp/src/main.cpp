#include <iostream>
#include <vector>
#include "Protein.hpp"

void verify_protein() {
    Protein myoglobin; // Renamed variable for accuracy

    // Myoglobin Sequence (154 Amino Acids)
    // This is a "Globular" protein known for high stability (alpha helices).
    std::vector<AminoAcid> real_protein_seq = {
        // 1-10: Met-Val-Leu-Ser-Glu-Gly-Glu-Trp-Gln-Leu
        AminoAcid::MET, AminoAcid::VAL, AminoAcid::LEU, AminoAcid::SER, AminoAcid::GLU, 
        AminoAcid::GLY, AminoAcid::GLU, AminoAcid::TRP, AminoAcid::GLN, AminoAcid::LEU,

        // 11-20: Val-Leu-His-Val-Trp-Ala-Lys-Val-Glu-Ala
        AminoAcid::VAL, AminoAcid::LEU, AminoAcid::HIS, AminoAcid::VAL, AminoAcid::TRP, 
        AminoAcid::ALA, AminoAcid::LYS, AminoAcid::VAL, AminoAcid::GLU, AminoAcid::ALA,

        // 21-30: Asp-Val-Ala-Gly-His-Gly-Gln-Glu-Val-Leu
        AminoAcid::ASP, AminoAcid::VAL, AminoAcid::ALA, AminoAcid::GLY, AminoAcid::HIS, 
        AminoAcid::GLY, AminoAcid::GLN, AminoAcid::GLU, AminoAcid::VAL, AminoAcid::LEU,

        // 31-40: Ile-Arg-Leu-Phe-Thr-Gly-His-Pro-Glu-Thr
        AminoAcid::ILE, AminoAcid::ARG, AminoAcid::LEU, AminoAcid::PHE, AminoAcid::THR, 
        AminoAcid::GLY, AminoAcid::HIS, AminoAcid::PRO, AminoAcid::GLU, AminoAcid::THR,

        // 41-50: Leu-Glu-Lys-Phe-Asp-Lys-Phe-Lys-His-Leu
        AminoAcid::LEU, AminoAcid::GLU, AminoAcid::LYS, AminoAcid::PHE, AminoAcid::ASP, 
        AminoAcid::LYS, AminoAcid::PHE, AminoAcid::LYS, AminoAcid::HIS, AminoAcid::LEU,

        // 51-60: Lys-Ser-Glu-Asp-Glu-Met-Lys-Ala-Ser-Glu
        AminoAcid::LYS, AminoAcid::SER, AminoAcid::GLU, AminoAcid::ASP, AminoAcid::GLU, 
        AminoAcid::MET, AminoAcid::LYS, AminoAcid::ALA, AminoAcid::SER, AminoAcid::GLU,

        // 61-70: Asp-Leu-Lys-Lys-His-Gly-Ala-Thr-Val-Leu
        AminoAcid::ASP, AminoAcid::LEU, AminoAcid::LYS, AminoAcid::LYS, AminoAcid::HIS, 
        AminoAcid::GLY, AminoAcid::ALA, AminoAcid::THR, AminoAcid::VAL, AminoAcid::LEU,

        // 71-80: Thr-Ala-Leu-Gly-Gly-Ile-Leu-Lys-Lys-Lys
        AminoAcid::THR, AminoAcid::ALA, AminoAcid::LEU, AminoAcid::GLY, AminoAcid::GLY, 
        AminoAcid::ILE, AminoAcid::LEU, AminoAcid::LYS, AminoAcid::LYS, AminoAcid::LYS,

        // 81-90: Gly-His-His-Glu-Ala-Glu-Ile-Lys-Pro-Leu
        AminoAcid::GLY, AminoAcid::HIS, AminoAcid::HIS, AminoAcid::GLU, AminoAcid::ALA, 
        AminoAcid::GLU, AminoAcid::ILE, AminoAcid::LYS, AminoAcid::PRO, AminoAcid::LEU,

        // 91-100: Ala-Gln-Ser-His-Ala-Thr-Lys-His-Lys-Ile
        AminoAcid::ALA, AminoAcid::GLN, AminoAcid::SER, AminoAcid::HIS, AminoAcid::ALA, 
        AminoAcid::THR, AminoAcid::LYS, AminoAcid::HIS, AminoAcid::LYS, AminoAcid::ILE,

        // 101-110: Pro-Val-Lys-Tyr-Leu-Glu-Phe-Ile-Ser-Glu
        AminoAcid::PRO, AminoAcid::VAL, AminoAcid::LYS, AminoAcid::TYR, AminoAcid::LEU, 
        AminoAcid::GLU, AminoAcid::PHE, AminoAcid::ILE, AminoAcid::SER, AminoAcid::GLU,

        // 111-120: Cys-Ile-Ile-Gln-Val-Leu-Gln-Ser-Lys-His
        AminoAcid::CYS, AminoAcid::ILE, AminoAcid::ILE, AminoAcid::GLN, AminoAcid::VAL, 
        AminoAcid::LEU, AminoAcid::GLN, AminoAcid::SER, AminoAcid::LYS, AminoAcid::HIS,

        // 121-130: Pro-Gly-Asp-Phe-Gly-Ala-Asp-Ala-Gln-Gly
        AminoAcid::PRO, AminoAcid::GLY, AminoAcid::ASP, AminoAcid::PHE, AminoAcid::GLY, 
        AminoAcid::ALA, AminoAcid::ASP, AminoAcid::ALA, AminoAcid::GLN, AminoAcid::GLY,

        // 131-140: Ala-Met-Asn-Lys-Ala-Leu-Glu-Leu-Phe-Arg
        AminoAcid::ALA, AminoAcid::MET, AminoAcid::ASN, AminoAcid::LYS, AminoAcid::ALA, 
        AminoAcid::LEU, AminoAcid::GLU, AminoAcid::LEU, AminoAcid::PHE, AminoAcid::ARG,

        // 141-150: Lys-Asp-Ile-Ala-Ala-Lys-Tyr-Lys-Glu-Leu
        AminoAcid::LYS, AminoAcid::ASP, AminoAcid::ILE, AminoAcid::ALA, AminoAcid::ALA, 
        AminoAcid::LYS, AminoAcid::TYR, AminoAcid::LYS, AminoAcid::GLU, AminoAcid::LEU,

        // 151-154: Gly-Phe-Gln-Gly
        AminoAcid::GLY, AminoAcid::PHE, AminoAcid::GLN, AminoAcid::GLY
    };

    // Load the data!
    myoglobin.set_sequence(real_protein_seq);

    // Print Results
    std::cout << "--- Extracted Sequence ---" << std::endl;
    myoglobin.print_structure(); 
    std::cout << "--------------------------" << std::endl;

    std::cout << "--- Myoglobin Benchmark ---" << std::endl;
    std::cout << "Length:    " << myoglobin.get_length() << " (Expected 154)" << std::endl;
    std::cout << "Stability: " << myoglobin.get_stability() << " (Expected VERY HIGH, > 200)" << std::endl;
    std::cout << "Type:      " << myoglobin.get_type_name() << " (Expected Enzyme/Globular)" << std::endl;
}

int main() {
    verify_protein();
    return 0;
}