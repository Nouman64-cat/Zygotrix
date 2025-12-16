#include "DnaGenerator.hpp"
#include "DnaTranscription.hpp"
#include "Protein.hpp"
#include "GeneticCode.hpp"
#include "json11/json11.hpp"

#include <iostream>
#include <string>
#include <sstream>
#include <stdexcept>
#include <algorithm>
#include <vector>

using json11::Json;

namespace
{
    std::string read_all_stdin()
    {
        std::istreambuf_iterator<char> begin(std::cin);
        std::istreambuf_iterator<char> end;
        return std::string(begin, end);
    }

    bool has_field(const Json &obj, const std::string &field)
    {
        return obj.is_object() && obj.object_items().count(field) != 0;
    }

    double calculate_actual_gc(const std::string &sequence)
    {
        if (sequence.empty())
        {
            return 0.0;
        }

        size_t gc_count = 0;
        for (char base : sequence)
        {
            if (base == 'G' || base == 'C' || base == 'g' || base == 'c')
            {
                gc_count++;
            }
        }

        return static_cast<double>(gc_count) / sequence.length();
    }

    std::string extract_amino_acids_from_rna(const std::string& rna_sequence)
    {
        std::vector<std::string> amino_acids;

        for (size_t i = 0; i + 2 < rna_sequence.length(); i += 3) {
            std::string codon = rna_sequence.substr(i, 3);

            auto it = codon_table.find(codon);
            if (it != codon_table.end()) {
                AminoAcid aa = it->second;
                if (aa == AminoAcid::STOP) {
                    amino_acids.push_back("STOP");
                    break;
                }
                amino_acids.push_back(get_amino_name(aa));
            }
        }

        std::string result;
        for (size_t i = 0; i < amino_acids.size(); ++i) {
            result += amino_acids[i];
            if (i < amino_acids.size() - 1) {
                result += "-";
            }
        }

        return result;
    }

    std::string get_protein_sequence_3letter(const std::string& rna_sequence)
    {
        Protein protein;
        protein.synthesize_from_rna(rna_sequence);

        std::vector<std::string> amino_acids;
        for (size_t i = 0; i + 2 < rna_sequence.length(); i += 3) {
            std::string codon = rna_sequence.substr(i, 3);

            auto it = codon_table.find(codon);
            if (it != codon_table.end()) {
                AminoAcid aa = it->second;
                if (aa == AminoAcid::STOP) break;
                amino_acids.push_back(get_amino_name(aa));
            }
        }

        std::string result;
        for (size_t i = 0; i < amino_acids.size(); ++i) {
            result += amino_acids[i];
            if (i < amino_acids.size() - 1) {
                result += "-";
            }
        }

        return result;
    }

    std::string get_protein_sequence_1letter(const std::string& rna_sequence)
    {
        std::string result;

        for (size_t i = 0; i + 2 < rna_sequence.length(); i += 3) {
            std::string codon = rna_sequence.substr(i, 3);

            auto it = codon_table.find(codon);
            if (it != codon_table.end()) {
                AminoAcid aa = it->second;
                if (aa == AminoAcid::STOP) break;
                result += get_amino_char(aa);
            }
        }

        return result;
    }

    // Structure to hold ORF data
    struct ORFData {
        size_t start_position;
        size_t end_position;
        std::string protein_3letter;
        std::string protein_1letter;
        size_t length;
    };

    // Find all Open Reading Frames in an RNA sequence
    std::vector<ORFData> find_all_orfs(const std::string& rna_sequence)
    {
        std::vector<ORFData> orfs;
        const size_t seq_len = rna_sequence.length();

        // Scan through the entire sequence looking for start codons (AUG)
        for (size_t i = 0; i + 2 < seq_len; ++i) {
            std::string codon = rna_sequence.substr(i, 3);

            // Found a start codon
            if (codon == "AUG") {
                std::vector<std::string> amino_acids_3letter;
                std::string amino_acids_1letter;
                size_t start_position = i;
                size_t j = i;

                // Read codons from this start position until a stop codon
                while (j + 2 < seq_len) {
                    std::string current_codon = rna_sequence.substr(j, 3);

                    auto it = codon_table.find(current_codon);
                    if (it != codon_table.end()) {
                        AminoAcid aa = it->second;

                        // Stop at stop codon
                        if (aa == AminoAcid::STOP) {
                            // Only add ORFs that have at least one amino acid
                            if (!amino_acids_3letter.empty()) {
                                ORFData orf;
                                orf.start_position = start_position;
                                orf.end_position = j + 3;
                                
                                // Build 3-letter format
                                std::string protein_3letter;
                                for (size_t k = 0; k < amino_acids_3letter.size(); ++k) {
                                    protein_3letter += amino_acids_3letter[k];
                                    if (k < amino_acids_3letter.size() - 1) {
                                        protein_3letter += "-";
                                    }
                                }
                                orf.protein_3letter = protein_3letter;
                                orf.protein_1letter = amino_acids_1letter;
                                orf.length = amino_acids_3letter.size();
                                
                                orfs.push_back(orf);
                            }
                            break;
                        }
                        
                        amino_acids_3letter.push_back(get_amino_name(aa));
                        amino_acids_1letter += get_amino_char(aa);
                    } else {
                        // Unknown codon - skip this ORF
                        break;
                    }

                    j += 3;
                }
            }
        }

        return orfs;
    }

}

int main()
{
    std::string input = read_all_stdin();
    std::string error;
    Json request = Json::parse(input, error);

    if (!error.empty())
    {
        Json response = Json(Json::JsonObject{
            {"error", Json("Invalid JSON: " + error)}
        });
        std::cout << response.dump() << std::endl;
        return 1;
    }

    try
    {
        // Check what action is requested
        std::string action = "generate"; // Default action
        if (has_field(request, "action")) {
            action = request["action"].string_value();
        }

        if (action == "generate") {
            // Generate DNA and RNA
            if (!has_field(request, "length"))
            {
                throw std::runtime_error("Missing required field: length");
            }
            if (!has_field(request, "gc_content"))
            {
                throw std::runtime_error("Missing required field: gc_content");
            }

            int length = static_cast<int>(request["length"].number_value());
            double gc_content = request["gc_content"].number_value();

            if (length <= 0)
            {
                throw std::runtime_error("Length must be greater than 0");
            }
            if (length > 100000000)
            {
                throw std::runtime_error("Length must not exceed 100,000,000");
            }
            if (gc_content < 0.0 || gc_content > 1.0)
            {
                throw std::runtime_error("GC content must be between 0.0 and 1.0");
            }

            DnaGenerator generator;

            if (has_field(request, "seed") && !request["seed"].is_null())
            {
                unsigned int seed = static_cast<unsigned int>(request["seed"].number_value());
                generator.reseed(seed);
            }

            // Generate DNA
            std::string dna_sequence = generator.generate(static_cast<size_t>(length), gc_content);
            double actual_gc = calculate_actual_gc(dna_sequence);

            // Transcribe to RNA
            DnaTranscriber transcriber;
            std::string rna_sequence = transcriber.transcribe(dna_sequence);

            Json response = Json(Json::JsonObject{
                {"dna_sequence", Json(dna_sequence)},
                {"rna_sequence", Json(rna_sequence)},
                {"length", Json(static_cast<int>(dna_sequence.length()))},
                {"gc_content", Json(gc_content)},
                {"actual_gc", Json(actual_gc)}
            });

            std::cout << response.dump() << std::endl;
            return 0;
        }
        else if (action == "extract_amino_acids") {
            if (!has_field(request, "rna_sequence"))
            {
                throw std::runtime_error("Missing required field: rna_sequence");
            }

            std::string rna_sequence = request["rna_sequence"].string_value();
            std::string amino_acids = extract_amino_acids_from_rna(rna_sequence);

            Json response = Json(Json::JsonObject{
                {"amino_acids", Json(amino_acids)}
            });

            std::cout << response.dump() << std::endl;
            return 0;
        }
        else if (action == "generate_protein") {
            if (!has_field(request, "rna_sequence"))
            {
                throw std::runtime_error("Missing required field: rna_sequence");
            }

            std::string rna_sequence = request["rna_sequence"].string_value();
            std::string protein_3letter = get_protein_sequence_3letter(rna_sequence);
            std::string protein_1letter = get_protein_sequence_1letter(rna_sequence);

            // Get protein info using Protein class
            Protein protein;
            protein.synthesize_from_rna(rna_sequence);

            Json response = Json(Json::JsonObject{
                {"protein_3letter", Json(protein_3letter)},
                {"protein_1letter", Json(protein_1letter)},
                {"protein_length", Json(protein.get_length())},
                {"protein_type", Json(protein.get_type_name())},
                {"stability_score", Json(protein.get_stability())}
            });

            std::cout << response.dump() << std::endl;
            return 0;
        }
        else if (action == "find_orfs") {
            if (!has_field(request, "rna_sequence"))
            {
                throw std::runtime_error("Missing required field: rna_sequence");
            }

            std::string rna_sequence = request["rna_sequence"].string_value();
            
            // Find all ORFs
            std::vector<ORFData> orfs = find_all_orfs(rna_sequence);
            
            // Convert to JSON array
            std::vector<Json> orfs_json;
            for (const auto& orf : orfs) {
                orfs_json.push_back(Json(Json::JsonObject{
                    {"start_position", Json(static_cast<int>(orf.start_position))},
                    {"end_position", Json(static_cast<int>(orf.end_position))},
                    {"protein_3letter", Json(orf.protein_3letter)},
                    {"protein_1letter", Json(orf.protein_1letter)},
                    {"length", Json(static_cast<int>(orf.length))}
                }));
            }
            
            // Get first ORF for backwards compatibility
            std::string sequence_3letter = "";
            std::string sequence_1letter = "";
            if (!orfs.empty()) {
                sequence_3letter = orfs[0].protein_3letter;
                sequence_1letter = orfs[0].protein_1letter;
            }

            Json response = Json(Json::JsonObject{
                {"orfs", Json(orfs_json)},
                {"total_orfs", Json(static_cast<int>(orfs.size()))},
                {"sequence_3letter", Json(sequence_3letter)},
                {"sequence_1letter", Json(sequence_1letter)}
            });

            std::cout << response.dump() << std::endl;
            return 0;
        }
        else {
            throw std::runtime_error("Unknown action: " + action);
        }
    }
    catch (const std::exception &ex)
    {
        Json response = Json(Json::JsonObject{
            {"error", Json(std::string(ex.what()))}
        });
        std::cout << response.dump() << std::endl;
        return 2;
    }
}
