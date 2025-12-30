#include "gwas/ChiSquareTest.hpp"
#include <cmath>
#include <algorithm>
#include <numeric>

namespace zygotrix {
namespace gwas {

ChiSquareTest::ChiSquareTest() {}

ChiSquareTest::~ChiSquareTest() {}

bool ChiSquareTest::test_binary(
    const std::vector<Genotype>& genotypes,
    const std::vector<double>& phenotypes,
    AssociationResult& result
) {
    if (genotypes.size() != phenotypes.size()) {
        return false;
    }

    // Build contingency table: [case/control][AA/Aa/aa]
    int observed[2][3] = {{0}};
    int n_complete = 0;

    for (size_t i = 0; i < genotypes.size(); ++i) {
        if (genotypes[i] < 0 || genotypes[i] > 2) continue;  // Missing
        if (std::isnan(phenotypes[i])) continue;

        int pheno_group = (phenotypes[i] > 0.5) ? 1 : 0;  // 1 = case, 0 = control
        observed[pheno_group][genotypes[i]]++;
        n_complete++;
    }

    if (n_complete < 10) {
        return false;
    }

    result.n_samples = n_complete;
    result.maf = calculate_maf(genotypes);

    // Calculate chi-square
    double chi_sq;
    int df;
    return calculate_chi_square(observed, chi_sq, result.p_value, df);
}

bool ChiSquareTest::test_quantitative(
    const std::vector<Genotype>& genotypes,
    const std::vector<double>& phenotypes,
    AssociationResult& result
) {
    // Split by median into high/low groups
    std::vector<double> valid_phenotypes;
    for (size_t i = 0; i < phenotypes.size(); ++i) {
        if (!std::isnan(phenotypes[i]) && genotypes[i] >= 0 && genotypes[i] <= 2) {
            valid_phenotypes.push_back(phenotypes[i]);
        }
    }

    if (valid_phenotypes.size() < 10) {
        return false;
    }

    // Find median
    std::sort(valid_phenotypes.begin(), valid_phenotypes.end());
    double median = valid_phenotypes[valid_phenotypes.size() / 2];

    // Create binary phenotype (0 = below median, 1 = above median)
    std::vector<double> binary_pheno(phenotypes.size());
    for (size_t i = 0; i < phenotypes.size(); ++i) {
        binary_pheno[i] = (phenotypes[i] > median) ? 1.0 : 0.0;
    }

    return test_binary(genotypes, binary_pheno, result);
}

bool ChiSquareTest::calculate_chi_square(
    const int observed[2][3],
    double& chi_square,
    double& p_value,
    int& df
) {
    // Calculate row and column totals
    int row_total[2] = {0};
    int col_total[3] = {0};
    int grand_total = 0;

    for (int i = 0; i < 2; ++i) {
        for (int j = 0; j < 3; ++j) {
            row_total[i] += observed[i][j];
            col_total[j] += observed[i][j];
            grand_total += observed[i][j];
        }
    }

    if (grand_total == 0) {
        return false;
    }

    // Calculate expected frequencies and chi-square statistic
    chi_square = 0.0;

    for (int i = 0; i < 2; ++i) {
        for (int j = 0; j < 3; ++j) {
            double expected = (static_cast<double>(row_total[i]) * col_total[j]) / grand_total;

            if (expected > 0) {
                double diff = observed[i][j] - expected;
                chi_square += (diff * diff) / expected;
            }
        }
    }

    // Degrees of freedom = (rows - 1) * (cols - 1)
    df = (2 - 1) * (3 - 1); // = 2

    p_value = chi_square_p_value(chi_square, df);
    return true;
}

double ChiSquareTest::chi_square_p_value(double chi_sq, int df) {
    // Approximation for chi-square p-value
    // For df=2 (most common in GWAS), we can use a simpler formula

    if (df == 2) {
        // P(χ² > x) = e^(-x/2)  for df=2
        return std::exp(-chi_sq / 2.0);
    }

    // General approximation using Wilson-Hilferty transformation
    // χ²/df ≈ N(1 - 2/(9*df), 2/(9*df))
    double mean = 1.0 - 2.0 / (9.0 * df);
    double var = 2.0 / (9.0 * df);

    double z = (std::pow(chi_sq / df, 1.0/3.0) - mean) / std::sqrt(var);

    // Standard normal CDF
    double p_value = std::erfc(std::abs(z) / std::sqrt(2.0)) / 2.0;

    return std::min(1.0, std::max(0.0, p_value));
}

double ChiSquareTest::calculate_maf(const std::vector<Genotype>& genotypes) {
    int allele_count = 0;
    int total_alleles = 0;

    for (Genotype g : genotypes) {
        if (g >= 0 && g <= 2) {
            allele_count += g;
            total_alleles += 2;
        }
    }

    if (total_alleles == 0) {
        return 0.0;
    }

    double freq = static_cast<double>(allele_count) / total_alleles;
    return std::min(freq, 1.0 - freq);
}

} // namespace gwas
} // namespace zygotrix
