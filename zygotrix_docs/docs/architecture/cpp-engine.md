---
sidebar_position: 3
---

# C++ Engine Architecture

The C++ engine provides high-performance calculations for computationally intensive genetics operations.

## Why C++?

| Metric | Python | C++ (Eigen) | Speedup |
|--------|--------|-------------|---------|
| 10K SNPs GWAS | 60s | 3s | **20x** |
| Matrix inversion (1000x1000) | 2s | 0.1s | **20x** |
| DNA generation (1M bp) | 5s | 0.5s | **10x** |

### Key Technologies

- **Eigen** - Fast linear algebra (matrix operations, regression)
- **OpenMP** - Parallel processing across multiple CPU cores
- **JSON11** - Lightweight JSON parsing

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Python Backend (FastAPI)                      │
│                                                                  │
│  gwas_engine.py ──────────────────────────────────────────────┐ │
│       │                                                       │ │
│       │ subprocess.run([cli_path], input=json, stdout=PIPE)   │ │
│       │                                                       │ │
│       ▼                                                       │ │
│  ┌─────────────────────────────────────────────────────────┐  │ │
│  │                   C++ CLI Process                        │  │ │
│  │                                                          │  │ │
│  │  stdin (JSON) ─────► [Computation] ─────► stdout (JSON)  │  │ │
│  │                                                          │  │ │
│  └─────────────────────────────────────────────────────────┘  │ │
│                                                               │ │
│  ◄────────────────────────────────────────────────────────────┘ │
│       │                                                          │
│       ▼                                                          │
│  Return result to API                                            │
└──────────────────────────────────────────────────────────────────┘
```

## Available CLIs

| CLI | Purpose | Input | Output |
|-----|---------|-------|--------|
| `zyg_cross_cli` | Punnett squares, genetic crosses | Parent genotypes | Offspring ratios |
| `zyg_gwas_cli` | GWAS statistical analysis | SNPs + phenotypes | p-values, beta |
| `zyg_protein_cli` | Protein translation | RNA sequence | Amino acid chain |
| `zyg_parallel_dna_cli` | Large DNA generation | Length, params | DNA sequence |

## Directory Structure

```
zygotrix_engine_cpp/
├── src/
│   ├── Engine.cpp              # Main engine class
│   ├── MendelianCalculator.cpp # Punnett square logic
│   ├── GwasCli.cpp             # GWAS CLI entry point
│   ├── gwas/
│   │   ├── GwasAnalyzer.cpp    # GWAS analysis engine
│   │   └── LinearRegression.cpp # Statistical tests
│   └── ...
├── include/
│   ├── Engine.hpp
│   ├── gwas/
│   │   ├── GwasTypes.hpp       # GWAS data structures
│   │   └── GwasAnalyzer.hpp
│   └── ...
├── third_party/
│   ├── eigen/                   # Eigen linear algebra library
│   └── json11/                  # JSON parsing
├── build/                       # Compiled binaries
│   ├── zyg_cross_cli(.exe)
│   ├── zyg_gwas_cli(.exe)
│   └── ...
└── CMakeLists.txt              # Build configuration
```

## GWAS Engine Details

### Input Format

```json
{
  "snps": [
    {
      "rsid": "rs1234567",
      "chromosome": 1,
      "position": 123456,
      "ref_allele": "A",
      "alt_allele": "G"
    }
  ],
  "samples": [
    {
      "sample_id": "s1",
      "phenotype": 10.5,
      "genotypes": [0],
      "covariates": []
    }
  ],
  "test_type": "linear",
  "maf_threshold": 0.01,
  "num_threads": 4
}
```

### Output Format

```json
{
  "success": true,
  "results": [
    {
      "rsid": "rs1234567",
      "chromosome": 1,
      "position": 123456,
      "beta": 2.65,
      "se": 0.35,
      "p_value": 0.001,
      "maf": 0.25
    }
  ],
  "snps_tested": 1000,
  "snps_filtered": 50,
  "execution_time_ms": 1523.4
}
```

### Statistical Tests

| Test | Use Case | Formula |
|------|----------|---------|
| **Linear** | Continuous phenotypes | Y = β₀ + β₁X + ε |
| **Logistic** | Binary phenotypes (case/control) | log(p/(1-p)) = β₀ + β₁X |
| **Chi-Square** | Categorical analysis | χ² = Σ(O-E)²/E |

## Building the Engine

### Prerequisites

```bash
# Ubuntu/Debian
sudo apt install cmake build-essential libeigen3-dev libomp-dev

# macOS
brew install cmake eigen libomp

# Windows (MSYS2/MinGW)
pacman -S mingw-w64-x86_64-cmake mingw-w64-x86_64-eigen3
```

### Build Commands

```bash
cd zygotrix_engine_cpp

# Configure
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build build

# Verify
./build/zyg_gwas_cli --version
```

### Build Options

| Option | Default | Description |
|--------|---------|-------------|
| `CMAKE_BUILD_TYPE` | Debug | Release for production |
| `WITH_OPENMP` | ON | Enable parallel processing |
| `BUILD_TESTS` | OFF | Build unit tests |

## Python Integration

### gwas_engine.py

```python
def _load_gwas_cli_path() -> Path:
    """Auto-discover GWAS CLI path."""
    settings = get_settings()
    path = Path(settings.cpp_gwas_cli_path).resolve()
    
    if path.exists():
        return path
    
    raise HTTPException(
        status_code=500,
        detail="C++ GWAS CLI not found. Build the engine first."
    )

def run_gwas_analysis(snps, samples, analysis_type, ...):
    cli_path = _load_gwas_cli_path()
    
    # Prepare JSON input
    request_data = {
        "snps": snps,
        "samples": samples,
        "test_type": analysis_type.value,
        "num_threads": num_threads
    }
    
    # Run subprocess
    completed = subprocess.run(
        [str(cli_path)],
        input=json.dumps(request_data).encode(),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=600
    )
    
    return json.loads(completed.stdout)
```

## Performance Optimization

### OpenMP Parallelization

```cpp
#pragma omp parallel for schedule(dynamic)
for (size_t i = 0; i < snps.size(); ++i) {
    results[i] = runLinearRegression(snps[i], phenotypes);
}
```

### Eigen Optimizations

```cpp
// Use Eigen's optimized matrix operations
Eigen::MatrixXd X = genotypes.cast<double>();
Eigen::VectorXd Y = phenotypes;

// Solve linear regression: β = (X'X)^(-1) X'Y
Eigen::VectorXd beta = (X.transpose() * X)
    .ldlt()  // Cholesky decomposition
    .solve(X.transpose() * Y);
```

## Error Handling

### C++ Side

```cpp
try {
    auto result = analyzer.run(input);
    std::cout << result.toJson().dump() << std::endl;
} catch (const std::exception& e) {
    json11::Json error = json11::Json::object {
        {"success", false},
        {"error", e.what()}
    };
    std::cerr << error.dump() << std::endl;
    return 1;
}
```

### Python Side

```python
if completed.returncode != 0:
    detail = completed.stderr.decode().strip()
    raise HTTPException(status_code=500, detail=detail)
```

## Troubleshooting

### "Eigen/Dense not found"

```bash
sudo apt install libeigen3-dev
# Or
cd third_party && git clone https://gitlab.com/libeigen/eigen.git
```

### "OpenMP not found"

Build will succeed without OpenMP (single-threaded). To enable:
```bash
sudo apt install libomp-dev
```

### Slow performance

- Ensure `CMAKE_BUILD_TYPE=Release`
- Check OpenMP is enabled: look for "Found OpenMP" in CMake output
- Increase `num_threads` parameter

## Next Steps

- [AI Chatbot Architecture](./ai-chatbot)
- [Database Schema](./database)
