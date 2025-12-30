#include "gwas/GwasAnalyzer.hpp"
#include <chrono>
#include <algorithm>

#ifdef _OPENMP
#include <omp.h>
#endif

namespace zygotrix {
namespace gwas {

GwasAnalyzer::GwasAnalyzer()
    : num_threads_(4),
      linear_reg_(std::make_unique<LinearRegression>()),
      chi_square_(std::make_unique<ChiSquareTest>()) {
}

GwasAnalyzer::~GwasAnalyzer() {}

void GwasAnalyzer::set_num_threads(int num_threads) {
    num_threads_ = std::max(1, num_threads);
}

bool GwasAnalyzer::analyze(const GwasRequest& request, GwasResponse& response) {
    auto start_time = std::chrono::high_resolution_clock::now();

    // Validate input
    if (request.snps.empty() || request.samples.empty()) {
        response.error = "Empty SNPs or samples";
        return false;
    }

    int num_snps = request.snps.size();
    int num_samples = request.samples.size();

    // Pre-allocate results vector
    std::vector<AssociationResult> all_results(num_snps);
    std::vector<bool> snp_passed(num_snps, false);

    response.snps_tested = 0;
    response.snps_filtered = 0;

    // Set OpenMP threads
#ifdef _OPENMP
    omp_set_num_threads(num_threads_);
#endif

    // Parallel SNP analysis
#pragma omp parallel for schedule(dynamic)
    for (int i = 0; i < num_snps; ++i) {
        AssociationResult result;

        // Copy SNP info
        result.rsid = request.snps[i].rsid;
        result.chromosome = request.snps[i].chromosome;
        result.position = request.snps[i].position;
        result.ref_allele = request.snps[i].ref_allele;
        result.alt_allele = request.snps[i].alt_allele;

        // Analyze SNP
        if (analyze_snp(i, request, result)) {
            all_results[i] = result;
            snp_passed[i] = true;

#pragma omp atomic
            response.snps_tested++;
        } else {
#pragma omp atomic
            response.snps_filtered++;
        }
    }

    // Collect results from SNPs that passed
    for (int i = 0; i < num_snps; ++i) {
        if (snp_passed[i]) {
            response.results.push_back(all_results[i]);
        }
    }

    // Calculate execution time
    auto end_time = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
    response.execution_time_ms = duration.count();

    return true;
}

bool GwasAnalyzer::analyze_snp(
    int snp_index,
    const GwasRequest& request,
    AssociationResult& result
) {
    // Extract data for this SNP
    std::vector<Genotype> genotypes = extract_genotypes(snp_index, request.samples);
    std::vector<double> phenotypes = extract_phenotypes(request.samples);

    // Quality control
    double maf;
    if (!passes_qc(genotypes, request.maf_threshold, maf)) {
        return false;
    }

    // Run appropriate test based on test_type
    bool success = false;

    if (request.test_type == "linear") {
        // Linear regression for quantitative traits
        Eigen::MatrixXd covariates = build_covariate_matrix(request.samples);
        success = linear_reg_->fit(genotypes, phenotypes, covariates, result);

    } else if (request.test_type == "logistic") {
        // Logistic regression (not yet implemented - use chi-square for now)
        // TODO: Implement logistic regression
        success = chi_square_->test_binary(genotypes, phenotypes, result);

    } else if (request.test_type == "chi_square") {
        // Chi-square test
        // Determine if binary or quantitative
        bool is_binary = true;
        for (double p : phenotypes) {
            if (!std::isnan(p) && p != 0.0 && p != 1.0) {
                is_binary = false;
                break;
            }
        }

        if (is_binary) {
            success = chi_square_->test_binary(genotypes, phenotypes, result);
        } else {
            success = chi_square_->test_quantitative(genotypes, phenotypes, result);
        }
    } else {
        return false;  // Unknown test type
    }

    return success;
}

std::vector<Genotype> GwasAnalyzer::extract_genotypes(
    int snp_index,
    const std::vector<Sample>& samples
) {
    std::vector<Genotype> genotypes;
    genotypes.reserve(samples.size());

    for (const auto& sample : samples) {
        if (snp_index < static_cast<int>(sample.genotypes.size())) {
            genotypes.push_back(sample.genotypes[snp_index]);
        } else {
            genotypes.push_back(-9);  // Missing
        }
    }

    return genotypes;
}

std::vector<double> GwasAnalyzer::extract_phenotypes(
    const std::vector<Sample>& samples
) {
    std::vector<double> phenotypes;
    phenotypes.reserve(samples.size());

    for (const auto& sample : samples) {
        phenotypes.push_back(sample.phenotype);
    }

    return phenotypes;
}

Eigen::MatrixXd GwasAnalyzer::build_covariate_matrix(
    const std::vector<Sample>& samples
) {
    if (samples.empty()) {
        return Eigen::MatrixXd(0, 0);
    }

    int n_samples = samples.size();
    int n_covariates = samples[0].covariates.size();

    if (n_covariates == 0) {
        return Eigen::MatrixXd(n_samples, 0);
    }

    Eigen::MatrixXd covariates(n_samples, n_covariates);

    for (int i = 0; i < n_samples; ++i) {
        for (int j = 0; j < n_covariates; ++j) {
            if (j < static_cast<int>(samples[i].covariates.size())) {
                covariates(i, j) = samples[i].covariates[j];
            } else {
                covariates(i, j) = std::nan("");  // Missing
            }
        }
    }

    return covariates;
}

bool GwasAnalyzer::passes_qc(
    const std::vector<Genotype>& genotypes,
    double maf_threshold,
    double& maf
) {
    // Calculate MAF
    int allele_count = 0;
    int total_alleles = 0;
    int missing_count = 0;

    for (Genotype g : genotypes) {
        if (g < 0 || g > 2) {
            missing_count++;
        } else {
            allele_count += g;
            total_alleles += 2;
        }
    }

    // Check missing rate (fail if >10% missing)
    double missing_rate = static_cast<double>(missing_count) / genotypes.size();
    if (missing_rate > 0.1) {
        return false;
    }

    // Check MAF
    if (total_alleles == 0) {
        return false;
    }

    double freq = static_cast<double>(allele_count) / total_alleles;
    maf = std::min(freq, 1.0 - freq);

    return maf >= maf_threshold;
}

} // namespace gwas
} // namespace zygotrix
