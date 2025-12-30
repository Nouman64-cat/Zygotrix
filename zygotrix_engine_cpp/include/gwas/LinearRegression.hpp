#ifndef LINEAR_REGRESSION_HPP
#define LINEAR_REGRESSION_HPP

#include "GwasTypes.hpp"
#include <Eigen/Dense>
#include <vector>

namespace zygotrix {
namespace gwas {

/**
 * @brief Linear regression for quantitative trait GWAS
 *
 * Fits the model: Y = β₀ + β₁X + β₂C₁ + β₃C₂ + ... + ε
 * Where:
 *   Y = phenotype vector
 *   X = genotype vector (0, 1, 2)
 *   C₁, C₂, ... = covariates (age, sex, principal components)
 *   β₁ = SNP effect size
 *   p-value computed from t-test on β₁
 */
class LinearRegression {
public:
    LinearRegression();
    ~LinearRegression();

    /**
     * @brief Fit linear regression for a single SNP
     *
     * @param genotypes Genotype vector for the SNP (0, 1, 2, or -9 for missing)
     * @param phenotypes Phenotype values
     * @param covariates Covariate matrix (n_samples x n_covariates)
     * @param result Output association result
     * @return true if successful, false if insufficient data
     */
    bool fit(
        const std::vector<Genotype>& genotypes,
        const std::vector<double>& phenotypes,
        const Eigen::MatrixXd& covariates,
        AssociationResult& result
    );

    /**
     * @brief Fit linear regression without covariates
     *
     * @param genotypes Genotype vector
     * @param phenotypes Phenotype values
     * @param result Output association result
     * @return true if successful
     */
    bool fit_simple(
        const std::vector<Genotype>& genotypes,
        const std::vector<double>& phenotypes,
        AssociationResult& result
    );

    /**
     * @brief Calculate MAF from genotype vector
     *
     * @param genotypes Genotype vector
     * @return Minor allele frequency
     */
    static double calculate_maf(const std::vector<Genotype>& genotypes);

private:
    /**
     * @brief Remove samples with missing data
     *
     * @param genotypes Input genotypes
     * @param phenotypes Input phenotypes
     * @param covariates Input covariates
     * @param clean_genotypes Output clean genotypes
     * @param clean_phenotypes Output clean phenotypes
     * @param clean_covariates Output clean covariates
     * @return Number of complete samples
     */
    int remove_missing_data(
        const std::vector<Genotype>& genotypes,
        const std::vector<double>& phenotypes,
        const Eigen::MatrixXd& covariates,
        Eigen::VectorXd& clean_genotypes,
        Eigen::VectorXd& clean_phenotypes,
        Eigen::MatrixXd& clean_covariates
    );

    /**
     * @brief Compute OLS (Ordinary Least Squares) regression
     *
     * @param X Design matrix (genotype + covariates)
     * @param Y Phenotype vector
     * @param beta Output coefficients
     * @param se Output standard errors
     * @param residual_variance Output residual variance
     * @return true if successful
     */
    bool compute_ols(
        const Eigen::MatrixXd& X,
        const Eigen::VectorXd& Y,
        Eigen::VectorXd& beta,
        Eigen::VectorXd& se,
        double& residual_variance
    );

    /**
     * @brief Calculate t-statistic and p-value
     *
     * @param beta Coefficient estimate
     * @param se Standard error
     * @param df Degrees of freedom
     * @param t_stat Output t-statistic
     * @param p_value Output p-value
     */
    void calculate_p_value(
        double beta,
        double se,
        int df,
        double& t_stat,
        double& p_value
    );

    /**
     * @brief Student's t-distribution CDF (for p-value calculation)
     *
     * @param t T-statistic
     * @param df Degrees of freedom
     * @return P-value (two-tailed)
     */
    double t_distribution_p_value(double t, int df);
};

} // namespace gwas
} // namespace zygotrix

#endif // LINEAR_REGRESSION_HPP
