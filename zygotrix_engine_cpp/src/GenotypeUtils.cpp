#include "zygotrix/GenotypeUtils.hpp"

#include <algorithm>
#include <cctype>
#include <sstream>

namespace zygotrix {
namespace GenotypeUtils {

bool containsAllele(const Genotype& genotype, const std::string& alleleId) {
    return std::find(genotype.begin(), genotype.end(), alleleId) != genotype.end();
}

bool isHomozygous(const Genotype& genotype, const std::string& alleleId) {
    return genotype.size() == 2 &&
           genotype[0] == alleleId &&
           genotype[1] == alleleId;
}

bool isHeterozygous(const Genotype& genotype, const std::string& alleleId) {
    if (genotype.size() != 2) {
        return false;
    }
    bool first = genotype[0] == alleleId;
    bool second = genotype[1] == alleleId;
    return (first ^ second);
}

std::string stripNonAlnum(const std::string& value) {
    std::string cleaned;
    cleaned.reserve(value.size());
    for (char ch : value) {
        if (std::isalnum(static_cast<unsigned char>(ch))) {
            cleaned.push_back(ch);
        }
    }
    return cleaned;
}

std::string toUpperCopy(const std::string& value) {
    std::string result = value;
    std::transform(result.begin(), result.end(), result.begin(), [](unsigned char c) {
        return static_cast<char>(std::toupper(c));
    });
    return result;
}

std::string combineDescriptors(const std::vector<std::string>& descriptors) {
    std::vector<std::string> uniqueDescriptors;
    uniqueDescriptors.reserve(descriptors.size());
    for (const std::string& descriptor : descriptors) {
        if (descriptor.empty()) {
            continue;
        }
        if (std::find(uniqueDescriptors.begin(), uniqueDescriptors.end(), descriptor) == uniqueDescriptors.end()) {
            uniqueDescriptors.push_back(descriptor);
        }
    }
    if (uniqueDescriptors.empty()) {
        return {};
    }
    if (uniqueDescriptors.size() == 1) {
        return uniqueDescriptors.front();
    }

    bool allSingleAlpha = true;
    for (const std::string& descriptor : uniqueDescriptors) {
        if (descriptor.size() != 1 || !std::isalpha(static_cast<unsigned char>(descriptor[0]))) {
            allSingleAlpha = false;
            break;
        }
    }

    if (allSingleAlpha) {
        std::vector<std::string> sortedDescriptors = uniqueDescriptors;
        std::sort(sortedDescriptors.begin(), sortedDescriptors.end());
        std::string combined;
        combined.reserve(sortedDescriptors.size());
        for (const std::string& descriptor : sortedDescriptors) {
            combined += descriptor;
        }
        return combined;
    }

    std::string combined = uniqueDescriptors.front();
    for (std::size_t i = 1; i < uniqueDescriptors.size(); ++i) {
        combined += ", " + uniqueDescriptors[i];
    }
    return combined;
}

}  // namespace GenotypeUtils
}  // namespace zygotrix
