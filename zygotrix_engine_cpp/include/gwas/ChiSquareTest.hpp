#ifndef CHI_SQUARE_TEST_HPP
#define CHI_SQUARE_TEST_HPP

#include "GwasTypes.hpp"
#include <vector>

namespace zygotrix {
namespace gwas {

/**
 * @brief Chi-square test for allelic association
 *
 * Tests association between genotype and phenotype using chi-square statistic.
 * Fast and simple test, but doesn't adjust for covariates.
 *
 * For binary traits: 2x3 contingency table (case/control × genotype AA/Aa/aa)
 * For quantitative traits: Split into high/low and test as binary
 */
class ChiSquareTest {
public:
    ChiSquareTest();
    ~ChiSquareTest();

    /**
     * @brief Perform chi-square test for binary trait (case/control)
     *
     * @param genotypes Genotype vector (0, 1, 2)
     * @param phenotypes Phenotype vector (0 = control, 1 = case)
     * @param result Output association result
     * @return true if successful
     */
    bool test_binary(
        const std::vector<Genotype>& genotypes,
        const std::vector<double>& phenotypes,
        AssociationResult& result
    );

    /**
     * @brief Perform chi-square test for quantitative trait
     * Splits samples into high/low groups by median
     *
     * @param genotypes Genotype vector
     * @param phenotypes Phenotype values
     * @param result Output association result
     * @return true if successful
     */
    bool test_quantitative(
        const std::vector<Genotype>& genotypes,
        const std::vector<double>& phenotypes,
        AssociationResult& result
    );

private:
    /**
     * @brief Calculate chi-square statistic from contingency table
     *
     * @param observed 2x3 observed counts [case/control][AA/Aa/aa]
     * @param chi_square Output chi-square statistic
     * @param p_value Output p-value
     * @param df Degrees of freedom
     * @return true if successful
     */
    bool calculate_chi_square(
        const int observed[2][3],
        double& chi_square,
        double& p_value,
        int& df
    );

    /**
     * @brief Chi-square distribution CDF (for p-value)
     *
     * @param chi_sq Chi-square statistic
     * @param df Degrees of freedom
     * @return P-value
     */
    double chi_square_p_value(double chi_sq, int df);

    /**
     * @brief Calculate MAF from genotype vector
     */
    double calculate_maf(const std::vector<Genotype>& genotypes);
};

} // namespace gwas
} // namespace zygotrix

#endif // CHI_SQUARE_TEST_HPP
