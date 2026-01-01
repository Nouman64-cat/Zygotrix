# GWAS Engine Build Instructions

## Prerequisites

### 1. Install Eigen Library (Required)

Eigen is a header-only C++ linear algebra library. Download and install:

```bash
# Option 1: Download Eigen directly
cd D:\Zygotrix\zygotrix_engine_cpp\third_party
# Download Eigen 3.4+ from https://eigen.tuxfamily.org/
# Extract to: third_party/eigen/

# Option 2: Using Git
cd D:\Zygotrix\zygotrix_engine_cpp\third_party
git clone https://gitlab.com/libeigen/eigen.git
cd eigen
git checkout 3.4.0  # Or latest stable version

# Option 3: Using vcpkg (Windows)
vcpkg install eigen3:x64-windows
```

**Verify installation:**
```bash
dir D:\Zygotrix\zygotrix_engine_cpp\third_party\eigen
# Should contain: Eigen/ folder with Core, Dense, etc.
```

### 2. Install OpenMP (Optional but Recommended)

OpenMP enables parallel processing for faster GWAS analysis.

**Windows (Visual Studio):**
- OpenMP is included by default in Visual Studio 2017+
- Enabled automatically via `/openmp` flag

**Windows (MinGW):**
```bash
# Install MinGW with OpenMP support
# Or use GCC with -fopenmp flag
```

**Linux:**
```bash
sudo apt-get install libomp-dev  # Ubuntu/Debian
sudo yum install libomp-devel    # CentOS/RHEL
```

## Build Steps

### Option 1: Visual Studio (Windows)

```bash
cd D:\Zygotrix\zygotrix_engine_cpp

# Configure with CMake
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build build --config Release

# Output location (Visual Studio multi-config)
build\Release\zyg_gwas_cli.exe
# Note: MinGW/Makefiles output to build\zyg_gwas_cli.exe (no Release folder)
```

### Option 2: MinGW (Windows)

```bash
cd D:\Zygotrix\zygotrix_engine_cpp

# Configure
cmake -B build -S . -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build build

# Output location
build\zyg_gwas_cli.exe
```

### Option 3: Linux/Mac

```bash
cd /path/to/zygotrix_engine_cpp

# Configure
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build build -j4  # Use 4 cores

# Output location
build/zyg_gwas_cli
```

## Verify Build

Test the GWAS CLI:

```bash
# Create test input (adjust path based on your build: build\ for MinGW, build\Release\ for VS)
echo '{"snps":[{"rsid":"rs1","chromosome":1,"position":1000,"ref_allele":"A","alt_allele":"G"}],"samples":[{"sample_id":"s1","phenotype":1.5,"genotypes":[0]},{"sample_id":"s2","phenotype":2.0,"genotypes":[1]},{"sample_id":"s3","phenotype":2.5,"genotypes":[2]}],"test_type":"linear","maf_threshold":0.01,"num_threads":4}' | build\zyg_gwas_cli.exe

# Expected output: JSON with success=true and association results
```

## Troubleshooting

### Error: "Eigen/Dense not found"

**Solution:**
1. Verify Eigen is in `third_party/eigen/`
2. Check that `third_party/eigen/Eigen/Dense` exists
3. Re-run CMake configuration

### Error: "OpenMP not found"

**Solution:**
- OpenMP is optional. Build will succeed without it (single-threaded)
- To enable: Install OpenMP library for your compiler
- Check CMake output for "OpenMP_CXX_FOUND"

### Error: "json11.hpp not found"

**Solution:**
- json11 should be in `third_party/json11/`
- This is already in the repository
- Verify `third_party/json11/json11.hpp` exists

## Testing

### Unit Test (Basic Functionality)

Create `test_gwas.json`:
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
    {"sample_id": "s1", "phenotype": 10.5, "genotypes": [0], "covariates": []},
    {"sample_id": "s2", "phenotype": 11.2, "genotypes": [0], "covariates": []},
    {"sample_id": "s3", "phenotype": 12.8, "genotypes": [1], "covariates": []},
    {"sample_id": "s4", "phenotype": 13.1, "genotypes": [1], "covariates": []},
    {"sample_id": "s5", "phenotype": 15.2, "genotypes": [2], "covariates": []},
    {"sample_id": "s6", "phenotype": 15.8, "genotypes": [2], "covariates": []}
  ],
  "test_type": "linear",
  "maf_threshold": 0.01,
  "num_threads": 4
}
```

Run:
```bash
# Use build\ for MinGW, build\Release\ for Visual Studio
type test_gwas.json | build\zyg_gwas_cli.exe
```

Expected output:
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
      ...
    }
  ],
  "snps_tested": 1,
  "snps_filtered": 0,
  "execution_time_ms": 5.2
}
```

## Performance Benchmarks

Expected performance (approximate):

| SNPs     | Samples | Threads | Time      |
|----------|---------|---------|-----------|
| 1,000    | 1,000   | 1       | < 1s      |
| 10,000   | 1,000   | 4       | < 5s      |
| 100,000  | 1,000   | 4       | < 30s     |
| 1,000,000| 1,000   | 8       | < 5min    |

## Integration with Python Backend

**No configuration needed!** The Python backend automatically finds the GWAS CLI at:
- `../zygotrix_engine_cpp/build/zyg_gwas_cli.exe` (Windows)
- `../zygotrix_engine_cpp/build/zyg_gwas_cli` (Linux/Mac)

This works automatically when running from the `backend/` directory.

**Optional override:** If you need a custom path, set the environment variable:
```bash
# Windows
set CPP_GWAS_CLI_PATH=C:\custom\path\zyg_gwas_cli.exe

# Linux/Mac
export CPP_GWAS_CLI_PATH=/custom/path/zyg_gwas_cli
```

## Next Steps

1. ✅ Build C++ engine (`zyg_gwas_cli`)
2. ⏭️ Implement Python GWAS service (Phase 4)
3. ⏭️ Create API endpoints (Phase 5)
4. ⏭️ Add MCP chatbot tool (Phase 6)
5. ⏭️ Build frontend widgets (Phase 7)

## Support

For issues:
- Check CMake output for detailed error messages
- Verify all prerequisites are installed
- Ensure C++17 compiler support (GCC 7+, Clang 5+, MSVC 2017+)
