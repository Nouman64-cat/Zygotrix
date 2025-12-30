#include "gwas/LinearRegression.hpp"
#include <cmath>
#include <algorithm>
#include <numeric>

namespace zygotrix {
namespace gwas {

LinearRegression::LinearRegression() {}

LinearRegression::~LinearRegression() {}

bool LinearRegression::fit(
    const std::vector<Genotype>& genotypes,
    const std::vector<double>& phenotypes,
    const Eigen::MatrixXd& covariates,
    AssociationResult& result
) {
    // Clean data (remove missing)
    Eigen::VectorXd clean_geno, clean_pheno;
    Eigen::MatrixXd clean_cov;

    int n = remove_missing_data(genotypes, phenotypes, covariates,
                                clean_geno, clean_pheno, clean_cov);

    if (n < 10) {  // Minimum sample size
        return false;
    }

    // Calculate MAF
    std::vector<Genotype> clean_geno_vec(clean_geno.data(),
                                         clean_geno.data() + clean_geno.size());
    result.maf = calculate_maf(clean_geno_vec);
    result.n_samples = n;

    // Build design matrix: [intercept, genotype, covariates]
    Eigen::MatrixXd X(n, 2 + clean_cov.cols());
    X.col(0) = Eigen::VectorXd::Ones(n);  // Intercept
    X.col(1) = clean_geno;                 // Genotype
    if (clean_cov.cols() > 0) {
        X.rightCols(clean_cov.cols()) = clean_cov;  // Covariates
    }

    // Compute OLS regression
    Eigen::VectorXd beta, se;
    double residual_variance;

    if (!compute_ols(X, clean_pheno, beta, se, residual_variance)) {
        return false;
    }

    // Extract results for genotype coefficient (index 1)
    result.beta = beta(1);
    result.se = se(1);

    // Calculate t-statistic and p-value
    int df = n - X.cols();  // Degrees of freedom
    calculate_p_value(result.beta, result.se, df, result.t_stat, result.p_value);

    return true;
}

bool LinearRegression::fit_simple(
    const std::vector<Genotype>& genotypes,
    const std::vector<double>& phenotypes,
    AssociationResult& result
) {
    // Empty covariate matrix
    Eigen::MatrixXd empty_cov(genotypes.size(), 0);
    return fit(genotypes, phenotypes, empty_cov, result);
}

double LinearRegression::calculate_maf(const std::vector<Genotype>& genotypes) {
    int allele_count = 0;
    int total_alleles = 0;

    for (Genotype g : genotypes) {
        if (g >= 0 && g <= 2) {
            allele_count += g;      // 0, 1, or 2 copies of alt allele
            total_alleles += 2;     // Diploid
        }
    }

    if (total_alleles == 0) {
        return 0.0;
    }

    double freq = static_cast<double>(allele_count) / total_alleles;
    return std::min(freq, 1.0 - freq);  // Return minor allele frequency
}

int LinearRegression::remove_missing_data(
    const std::vector<Genotype>& genotypes,
    const std::vector<double>& phenotypes,
    const Eigen::MatrixXd& covariates,
    Eigen::VectorXd& clean_genotypes,
    Eigen::VectorXd& clean_phenotypes,
    Eigen::MatrixXd& clean_covariates
) {
    std::vector<int> valid_indices;

    for (size_t i = 0; i < genotypes.size(); ++i) {
        // Check for missing data
        if (genotypes[i] < 0 || genotypes[i] > 2) continue;  // Missing genotype
        if (std::isnan(phenotypes[i])) continue;             // Missing phenotype

        // Check covariates for missing
        bool cov_missing = false;
        if (covariates.cols() > 0) {
            for (int j = 0; j < covariates.cols(); ++j) {
                if (std::isnan(covariates(i, j))) {
                    cov_missing = true;
                    break;
                }
            }
        }
        if (cov_missing) continue;

        valid_indices.push_back(i);
    }

    int n = valid_indices.size();
    if (n == 0) {
        return 0;
    }

    // Extract clean data
    clean_genotypes.resize(n);
    clean_phenotypes.resize(n);

    if (covariates.cols() > 0) {
        clean_covariates.resize(n, covariates.cols());
    } else {
        clean_covariates.resize(n, 0);
    }

    for (int i = 0; i < n; ++i) {
        int idx = valid_indices[i];
        clean_genotypes(i) = static_cast<double>(genotypes[idx]);
        clean_phenotypes(i) = phenotypes[idx];

        if (covariates.cols() > 0) {
            clean_covariates.row(i) = covariates.row(idx);
        }
    }

    return n;
}

bool LinearRegression::compute_ols(
    const Eigen::MatrixXd& X,
    const Eigen::VectorXd& Y,
    Eigen::VectorXd& beta,
    Eigen::VectorXd& se,
    double& residual_variance
) {
    try {
        // OLS solution: β = (X'X)^(-1) X'Y
        Eigen::MatrixXd XtX = X.transpose() * X;
        Eigen::VectorXd XtY = X.transpose() * Y;

        // Solve using QR decomposition (more stable than direct inverse)
        beta = XtX.ldlt().solve(XtY);

        // Calculate residuals
        Eigen::VectorXd residuals = Y - X * beta;

        // Residual variance: σ² = RSS / (n - p)
        int n = X.rows();
        int p = X.cols();
        int df = n - p;

        if (df <= 0) {
            return false;
        }

        residual_variance = residuals.squaredNorm() / df;

        // Standard errors: SE(β) = sqrt(diag((X'X)^(-1)) * σ²)
        Eigen::MatrixXd XtX_inv = XtX.inverse();
        se.resize(p);

        for (int i = 0; i < p; ++i) {
            se(i) = std::sqrt(XtX_inv(i, i) * residual_variance);
        }

        return true;

    } catch (...) {
        return false;
    }
}

void LinearRegression::calculate_p_value(
    double beta,
    double se,
    int df,
    double& t_stat,
    double& p_value
) {
    if (se <= 0.0) {
        t_stat = 0.0;
        p_value = 1.0;
        return;
    }

    t_stat = beta / se;
    p_value = t_distribution_p_value(std::abs(t_stat), df);
}

double LinearRegression::t_distribution_p_value(double t, int df) {
    // Approximation of Student's t-distribution CDF using normal approximation
    // For df > 30, t-distribution ≈ normal distribution
    // For smaller df, use more accurate approximation

    if (df >= 30) {
        // Use normal approximation
        // P(Z > t) where Z ~ N(0,1)
        double z = t;

        // Complementary error function approximation
        // erfc(z/sqrt(2)) / 2 ≈ P(Z > z)
        double erfcx = std::erfc(z / std::sqrt(2.0));
        double p_one_tail = erfcx / 2.0;

        return 2.0 * p_one_tail;  // Two-tailed
    }

    // For small df, use approximation based on beta function
    // This is a simplified approximation - for production, use boost library
    double x = df / (df + t * t);

    // Incomplete beta function approximation (very rough)
    // For accurate results, integrate with Boost library
    double a = df / 2.0;
    double b = 0.5;

    // Rough approximation using normal distribution with correction
    double correction = 1.0 + (1.0 / (4.0 * df));
    double z_approx = t / correction;
    double erfcx = std::erfc(std::abs(z_approx) / std::sqrt(2.0));
    double p_value = erfcx;

    return std::min(1.0, std::max(0.0, p_value));
}

} // namespace gwas
} // namespace zygotrix
