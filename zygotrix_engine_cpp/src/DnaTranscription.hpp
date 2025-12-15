#ifndef DNA_TRANSCRIPTION_HPP
#define DNA_TRANSCRIPTION_HPP

#include <string>
#include <algorithm>
#include <stdexcept>
#include <iostream>

class DnaTranscriber {
public:
    /**
     * @brief Simulates RNA Polymerase.
     * Converts a DNA Coding Strand into Messenger RNA (mRNA).
     * Biologically: Replaces Thymine (T) with Uracil (U).
     * * @param dna_sequence The input DNA string (e.g., "ATGC")
     * @return std::string The resulting RNA string (e.g., "AUGC")
     */
    std::string transcribe(const std::string& dna_sequence) {
        if (dna_sequence.empty()) {
            return "";
        }

        std::string rna = dna_sequence;

        // Efficiently replace all 'T' with 'U'
        // We iterate once through the string (O(N) complexity)
        for (char &base : rna) {
            if (base == 'T') {
                base = 'U';
            } else if (base == 't') { // Handle lowercase just in case
                base = 'u';
            }
            // Optional: You could add validation here to throw error if base is not A,C,G,T
        }

        return rna;
    }
};

#endif // DNA_TRANSCRIPTION_HPP