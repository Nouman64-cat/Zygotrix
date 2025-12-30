/**
 * GWAS CLI - Command-line interface for GWAS analysis
 *
 * Reads JSON input from stdin, runs GWAS analysis, outputs JSON to stdout.
 * Follows the same pattern as zyg_cross_cli for consistency.
 */

#include "gwas/GwasAnalyzer.hpp"
#include "gwas/GwasTypes.hpp"
#include "third_party/json11/json11.hpp"

#include <iostream>
#include <string>
#include <sstream>
#include <vector>

using namespace zygotrix::gwas;
using namespace json11;

/**
 * Parse JSON input into GwasRequest
 */
bool parse_request(const Json& json_input, GwasRequest& request, std::string& error) {
    // Parse SNPs
    if (!json_input["snps"].is_array()) {
        error = "Missing or invalid 'snps' array";
        return false;
    }

    for (const auto& snp_json : json_input["snps"].array_items()) {
        Snp snp;
        snp.rsid = snp_json["rsid"].string_value();
        snp.chromosome = snp_json["chromosome"].int_value();
        snp.position = snp_json["position"].number_value();
        snp.ref_allele = snp_json["ref_allele"].string_value();
        snp.alt_allele = snp_json["alt_allele"].string_value();
        snp.maf = snp_json["maf"].number_value();

        request.snps.push_back(snp);
    }

    // Parse samples
    if (!json_input["samples"].is_array()) {
        error = "Missing or invalid 'samples' array";
        return false;
    }

    for (const auto& sample_json : json_input["samples"].array_items()) {
        Sample sample;
        sample.sample_id = sample_json["sample_id"].string_value();
        sample.phenotype = sample_json["phenotype"].number_value();

        // Parse genotypes
        if (sample_json["genotypes"].is_array()) {
            for (const auto& g : sample_json["genotypes"].array_items()) {
                sample.genotypes.push_back(g.int_value());
            }
        }

        // Parse covariates
        if (sample_json["covariates"].is_array()) {
            for (const auto& c : sample_json["covariates"].array_items()) {
                sample.covariates.push_back(c.number_value());
            }
        }

        request.samples.push_back(sample);
    }

    // Parse parameters
    request.test_type = json_input["test_type"].string_value();
    if (request.test_type.empty()) {
        request.test_type = "linear";  // Default
    }

    request.maf_threshold = json_input["maf_threshold"].number_value();
    if (request.maf_threshold == 0.0) {
        request.maf_threshold = 0.01;  // Default
    }

    request.num_threads = json_input["num_threads"].int_value();
    if (request.num_threads == 0) {
        request.num_threads = 4;  // Default
    }

    return true;
}

/**
 * Convert GwasResponse to JSON
 */
Json response_to_json(const GwasResponse& response) {
    // Convert results to JSON array
    std::vector<Json> results_json;

    for (const auto& result : response.results) {
        results_json.push_back(Json::object {
            {"rsid", result.rsid},
            {"chromosome", result.chromosome},
            {"position", static_cast<double>(result.position)},
            {"ref_allele", result.ref_allele},
            {"alt_allele", result.alt_allele},
            {"beta", result.beta},
            {"se", result.se},
            {"t_stat", result.t_stat},
            {"p_value", result.p_value},
            {"maf", result.maf},
            {"n_samples", result.n_samples},
            {"odds_ratio", result.odds_ratio},
            {"ci_lower", result.ci_lower},
            {"ci_upper", result.ci_upper},
        });
    }

    return Json::object {
        {"success", response.error.empty()},
        {"results", results_json},
        {"snps_tested", response.snps_tested},
        {"snps_filtered", response.snps_filtered},
        {"execution_time_ms", response.execution_time_ms},
        {"error", response.error},
    };
}

int main(int argc, char* argv[]) {
    try {
        // Read JSON from stdin
        std::stringstream buffer;
        buffer << std::cin.rdbuf();
        std::string input_str = buffer.str();

        // Parse JSON
        std::string parse_error;
        Json json_input = Json::parse(input_str, parse_error);

        if (!parse_error.empty()) {
            Json error_response = Json::object {
                {"success", false},
                {"error", "JSON parse error: " + parse_error}
            };
            std::cout << error_response.dump() << std::endl;
            return 1;
        }

        // Parse request
        GwasRequest request;
        std::string error;

        if (!parse_request(json_input, request, error)) {
            Json error_response = Json::object {
                {"success", false},
                {"error", "Invalid request: " + error}
            };
            std::cout << error_response.dump() << std::endl;
            return 1;
        }

        // Run GWAS analysis
        GwasAnalyzer analyzer;
        analyzer.set_num_threads(request.num_threads);

        GwasResponse response;
        if (!analyzer.analyze(request, response)) {
            Json error_response = Json::object {
                {"success", false},
                {"error", response.error.empty() ? "Analysis failed" : response.error}
            };
            std::cout << error_response.dump() << std::endl;
            return 1;
        }

        // Output JSON response
        Json json_response = response_to_json(response);
        std::cout << json_response.dump() << std::endl;

        return 0;

    } catch (const std::exception& e) {
        Json error_response = Json::object {
            {"success", false},
            {"error", std::string("Exception: ") + e.what()}
        };
        std::cout << error_response.dump() << std::endl;
        return 1;
    } catch (...) {
        Json error_response = Json::object {
            {"success", false},
            {"error", "Unknown exception occurred"}
        };
        std::cout << error_response.dump() << std::endl;
        return 1;
    }
}
