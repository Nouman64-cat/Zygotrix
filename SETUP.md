# Zygotrix Setup Guide

This guide covers setting up the Zygotrix backend for local development and production deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [C++ Engine Setup](#c-engine-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.11+ | Backend API |
| Node.js | 22+ | Frontend builds |
| MongoDB | 6.0+ | Database |
| Redis | 7.0+ | Caching & sessions |
| CMake | 3.16+ | C++ engine builds |
| GCC/G++ | 12+ | C++ compilation |

### Optional Software

| Software | Purpose |
|----------|---------|
| Docker | Containerized deployment |
| libeigen3-dev | GWAS statistical analysis |
| libomp-dev | OpenMP parallel processing |

---

## Backend Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Nouman64-cat/Zygotrix.git
cd Zygotrix
```

### 2. Create Python Virtual Environment

```bash
cd backend
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/Mac)
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
# Copy example config
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

**Required variables:**
- `MONGODB_URI` - MongoDB connection string
- `AUTH_SECRET_KEY` - JWT signing key (generate a secure random string)
- `ANTHROPIC_API_KEY` - For AI chatbot features

See `.env.example` for all available options.

### 5. Start the Backend

```bash
# Development (with hot reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

---

## C++ Engine Setup

The C++ engines provide high-performance calculations for:
- **Mendelian genetics** (Punnett squares, genetic crosses)
- **DNA/RNA processing** (transcription, translation)
- **GWAS analysis** (genome-wide association studies)

### Why C++?

GWAS analysis involves heavy matrix math on potentially millions of SNPs. The C++ engine with Eigen library is **10-50x faster** than Python.

### Build Instructions

#### Linux (Production)

```bash
# 1. Install dependencies
sudo apt update
sudo apt install cmake build-essential libeigen3-dev libomp-dev

# 2. Build the engines
cd zygotrix_engine_cpp
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
cmake --build build

# 3. Verify build
ls -la build/zyg_*
# Expected: zyg_cross_cli, zyg_gwas_cli, zyg_protein_cli, etc.
```

#### Windows (Development)

```powershell
# Using MinGW
cd zygotrix_engine_cpp
cmake -B build -S . -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release
cmake --build build

# Verify
dir build\*.exe
```

### No Configuration Needed!

The backend **automatically finds** the C++ binaries at:
```
../zygotrix_engine_cpp/build/zyg_*
```

No environment variables required. Just build and run!


---

## Production Deployment

### Quick Deploy Checklist

```bash
# 1. Pull latest code
git pull origin main

# 2. Update Python dependencies
cd backend
source .venv/bin/activate
pip install -r requirements.txt

# 3. Build C++ engines
cd ../zygotrix_engine_cpp
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
cmake --build build

# 4. Restart backend
# (Use your process manager: systemd, supervisor, pm2, etc.)
sudo systemctl restart zygotrix-backend
```

### Systemd Service Example

Create `/etc/systemd/system/zygotrix-backend.service`:

```ini
[Unit]
Description=Zygotrix Backend API
After=network.target mongodb.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/Zygotrix/backend
Environment="PATH=/path/to/Zygotrix/backend/.venv/bin"
ExecStart=/path/to/Zygotrix/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable zygotrix-backend
sudo systemctl start zygotrix-backend
```

---

## Troubleshooting

### C++ GWAS CLI not found

**Error:** `C++ GWAS CLI executable not found`

**Solution:**
```bash
cd zygotrix_engine_cpp
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

### Eigen/Dense not found

**Error:** `fatal error: Eigen/Dense: No such file or directory`

**Solution:**
```bash
# Install Eigen library system-wide
sudo apt install libeigen3-dev

# Or clone to third_party
cd zygotrix_engine_cpp/third_party
git clone https://gitlab.com/libeigen/eigen.git
```

### MongoDB connection failed

**Error:** `ServerSelectionTimeoutError`

**Solution:**
1. Verify MongoDB is running: `sudo systemctl status mongodb`
2. Check `MONGODB_URI` in `.env`
3. Ensure network access is allowed

### Redis connection failed

**Error:** `ConnectionRefusedError: Redis`

**Solution:**
1. Verify Redis is running: `sudo systemctl status redis`
2. Check `REDIS_URL` in `.env`

---

*Last updated: January 2026*
