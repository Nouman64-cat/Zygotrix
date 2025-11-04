#pragma once

#include <string>
#include <vector>
#include <algorithm>
#include <cctype>

namespace zygotrix {

using Genotype = std::vector<std::string>;

namespace GenotypeUtils {

/**
 * Checks if a genotype contains a specific allele.
 */
bool containsAllele(const Genotype& genotype, const std::string& alleleId);

/**
 * Checks if a genotype is homozygous for a specific allele.
 */
bool isHomozygous(const Genotype& genotype, const std::string& alleleId);

/**
 * Checks if a genotype is heterozygous for a specific allele.
 */
bool isHeterozygous(const Genotype& genotype, const std::string& alleleId);

/**
 * Removes all non-alphanumeric characters from a string.
 */
std::string stripNonAlnum(const std::string& value);

/**
 * Converts a string to uppercase.
 */
std::string toUpperCopy(const std::string& value);

/**
 * Combines multiple descriptors into a single string.
 * Handles single-character alphabetic descriptors specially.
 */
std::string combineDescriptors(const std::vector<std::string>& descriptors);

}  // namespace GenotypeUtils

}  // namespace zygotrix
