#ifndef GWAS_ANALYZER_HPP
#define GWAS_ANALYZER_HPP

#include "GwasTypes.hpp"
#include "LinearRegression.hpp"
#include "ChiSquareTest.hpp"
#include <memory>

namespace zygotrix {
namespace gwas {

/**
 * @brief Main GWAS analysis orchestrator
 *
 * Coordinates GWAS analysis across multiple SNPs with parallel processing.
 */
class GwasAnalyzer {
public:
    GwasAnalyzer();
    ~GwasAnalyzer();

    /**
     * @brief Run GWAS analysis
     *
     * @param request GWAS analysis request with SNPs, samples, parameters
     * @param response Output GWAS analysis response
     * @return true if successful
     */
    bool analyze(const GwasRequest& request, GwasResponse& response);

    /**
     * @brief Set number of OpenMP threads
     *
     * @param num_threads Number of threads (default: 4)
     */
    void set_num_threads(int num_threads);

private:
    /**
     * @brief Analyze a single SNP
     *
     * @param snp_index Index in SNP list
     * @param request GWAS request
     * @param result Output association result
     * @return true if SNP passed QC and analysis succeeded
     */
    bool analyze_snp(
        int snp_index,
        const GwasRequest& request,
        AssociationResult& result
    );

    /**
     * @brief Extract genotype column for a SNP across all samples
     *
     * @param snp_index Index in SNP list
     * @param samples Sample data
     * @return Genotype vector for this SNP
     */
    std::vector<Genotype> extract_genotypes(
        int snp_index,
        const std::vector<Sample>& samples
    );

    /**
     * @brief Extract phenotype values from samples
     *
     * @param samples Sample data
     * @return Phenotype vector
     */
    std::vector<double> extract_phenotypes(
        const std::vector<Sample>& samples
    );

    /**
     * @brief Build covariate matrix from samples
     *
     * @param samples Sample data
     * @return Covariate matrix (n_samples x n_covariates)
     */
    Eigen::MatrixXd build_covariate_matrix(
        const std::vector<Sample>& samples
    );

    /**
     * @brief Check if SNP passes quality control filters
     *
     * @param genotypes Genotype vector
     * @param maf_threshold Minimum MAF threshold
     * @param maf Output calculated MAF
     * @return true if passes QC
     */
    bool passes_qc(
        const std::vector<Genotype>& genotypes,
        double maf_threshold,
        double& maf
    );

    int num_threads_;
    std::unique_ptr<LinearRegression> linear_reg_;
    std::unique_ptr<ChiSquareTest> chi_square_;
};

} // namespace gwas
} // namespace zygotrix

#endif // GWAS_ANALYZER_HPP
