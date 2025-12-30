cmake_minimum_required(VERSION 3.16)

project(zygotrix_engine_cpp VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Find threading library (required for parallel generation)
find_package(Threads REQUIRED)

# Find OpenMP (for GWAS parallelization)
find_package(OpenMP)

add_library(zygotrix_engine STATIC
    src/Engine.cpp
    src/GenotypeUtils.cpp
    src/GenotypeNormalizer.cpp
    src/GameteGenerator.cpp
    src/DominanceStrategy.cpp
    src/PhenotypeModifier.cpp
    src/MendelianCalculator.cpp
    src/JsonRequestBuilder.cpp
    src/ExactCalculatorStrategy.cpp
    src/SimulationCalculatorStrategy.cpp
    src/DnaGenerator.cpp
    src/ParallelDnaGenerator.cpp
    src/ThreadPool.cpp
    src/ParallelOrfFinder.cpp
    # GWAS sources
    src/gwas/LinearRegression.cpp
    src/gwas/ChiSquareTest.cpp
    src/gwas/GwasAnalyzer.cpp
    third_party/json11/json11.cpp
)

target_include_directories(zygotrix_engine
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/third_party
        ${CMAKE_CURRENT_SOURCE_DIR}/third_party/json11
        ${CMAKE_CURRENT_SOURCE_DIR}/third_party/eigen
)

# Link threading library to the engine
target_link_libraries(zygotrix_engine PUBLIC Threads::Threads)

# Link OpenMP if available
if(OpenMP_CXX_FOUND)
    target_link_libraries(zygotrix_engine PUBLIC OpenMP::OpenMP_CXX)
    target_compile_definitions(zygotrix_engine PRIVATE _OPENMP)
endif()

add_executable(zyg_demo examples/demo.cpp)
target_link_libraries(zyg_demo PRIVATE zygotrix_engine)

add_executable(zyg_test_mendelian examples/test_mendelian.cpp)
target_link_libraries(zyg_test_mendelian PRIVATE zygotrix_engine)

add_executable(zyg_dna_generator examples/dna_generator_demo.cpp)
target_link_libraries(zyg_dna_generator PRIVATE zygotrix_engine)

add_executable(zyg_cross_cli
    src/CrossCli.cpp
)
target_link_libraries(zyg_cross_cli PRIVATE zygotrix_engine)
target_include_directories(zyg_cross_cli PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/json11
)

add_executable(zyg_dna_cli
    src/DnaGeneratorCli.cpp
)
target_link_libraries(zyg_dna_cli PRIVATE zygotrix_engine)
target_include_directories(zyg_dna_cli PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/json11
)

# Parallel DNA generator CLI (multi-threaded, supports large sequences)
add_executable(zyg_parallel_dna_cli
    src/ParallelDnaGeneratorCli.cpp
)
target_link_libraries(zyg_parallel_dna_cli PRIVATE zygotrix_engine)
target_include_directories(zyg_parallel_dna_cli PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/json11
)

add_executable(zyg_protein_cli
    src/ProteinGeneratorCli.cpp
)
target_link_libraries(zyg_protein_cli PRIVATE zygotrix_engine)
target_include_directories(zyg_protein_cli PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/json11
)

# GWAS CLI (statistical analysis engine)
add_executable(zyg_gwas_cli
    src/GwasCli.cpp
)
target_link_libraries(zyg_gwas_cli PRIVATE zygotrix_engine)
target_include_directories(zyg_gwas_cli PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/json11
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/eigen
)

enable_testing()

