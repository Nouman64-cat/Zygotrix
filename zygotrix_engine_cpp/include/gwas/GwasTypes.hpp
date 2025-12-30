#ifndef GWAS_TYPES_HPP
#define GWAS_TYPES_HPP

#include <string>
#include <vector>
#include <cstdint>

namespace zygotrix {
namespace gwas {

/**
 * @brief Single Nucleotide Polymorphism (SNP) information
 */
struct Snp {
    std::string rsid;           // SNP identifier (e.g., "rs1234567")
    int chromosome;             // Chromosome number (1-22, 23=X)
    uint64_t position;          // Base pair position
    std::string ref_allele;     // Reference allele
    std::string alt_allele;     // Alternate allele
    double maf;                 // Minor allele frequency

    Snp() : chromosome(0), position(0), maf(0.0) {}
};

/**
 * @brief Genotype encoding
 * 0 = homozygous reference (e.g., AA)
 * 1 = heterozygous (e.g., Aa)
 * 2 = homozygous alternate (e.g., aa)
 * -9 = missing data
 */
using Genotype = int;

/**
 * @brief Sample data for GWAS analysis
 */
struct Sample {
    std::string sample_id;
    double phenotype;                  // Trait value (quantitative) or case/control (0/1 for binary)
    std::vector<Genotype> genotypes;   // Genotypes for each SNP (same order as variant list)
    std::vector<double> covariates;    // Covariate values (age, sex, PCs, etc.)

    Sample() : phenotype(0.0) {}
};

/**
 * @brief Association test result for a single SNP
 */
struct AssociationResult {
    std::string rsid;
    int chromosome;
    uint64_t position;
    std::string ref_allele;
    std::string alt_allele;

    double beta;                // Effect size (linear regression)
    double se;                  // Standard error
    double t_stat;              // T-statistic (linear) or Z-statistic (logistic)
    double p_value;             // Association p-value
    double maf;                 // Minor allele frequency
    int n_samples;              // Number of samples with complete data

    // Logistic regression specific
    double odds_ratio;          // Odds ratio (logistic regression)
    double ci_lower;            // 95% CI lower bound
    double ci_upper;            // 95% CI upper bound

    AssociationResult()
        : chromosome(0), position(0), beta(0.0), se(0.0), t_stat(0.0),
          p_value(1.0), maf(0.0), n_samples(0), odds_ratio(1.0),
          ci_lower(0.0), ci_upper(0.0) {}
};

/**
 * @brief GWAS analysis request
 */
struct GwasRequest {
    std::vector<Snp> snps;              // List of SNPs to test
    std::vector<Sample> samples;         // Sample data
    std::string test_type;              // "linear", "logistic", or "chi_square"
    double maf_threshold;               // Minimum MAF filter (default 0.01)
    int num_threads;                    // Number of OpenMP threads (default 4)

    GwasRequest() : test_type("linear"), maf_threshold(0.01), num_threads(4) {}
};

/**
 * @brief GWAS analysis response
 */
struct GwasResponse {
    std::vector<AssociationResult> results;
    int snps_tested;
    int snps_filtered;                  // SNPs filtered due to low MAF
    double execution_time_ms;
    std::string error;

    GwasResponse() : snps_tested(0), snps_filtered(0), execution_time_ms(0.0) {}
};

/**
 * @brief Analysis type enum
 */
enum class AnalysisType {
    LINEAR,      // Linear regression for quantitative traits
    LOGISTIC,    // Logistic regression for binary traits
    CHI_SQUARE   // Chi-square test for allelic association
};

} // namespace gwas
} // namespace zygotrix

#endif // GWAS_TYPES_HPP
