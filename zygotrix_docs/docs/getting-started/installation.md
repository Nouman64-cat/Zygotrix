---
sidebar_position: 1
---

# Installation

This guide will help you set up Zygotrix for local development or production deployment.

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

## Step 1: Clone the Repository

```bash
git clone https://github.com/Nouman64-cat/Zygotrix.git
cd Zygotrix
```

## Step 2: Backend Setup

### Create Virtual Environment

```bash
cd backend
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/Mac)
source .venv/bin/activate
```

### Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment

```bash
# Copy the example config
cp .env.example .env

# Edit with your values
nano .env
```

**Required environment variables:**

```bash
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=zygotrix

# Authentication
AUTH_SECRET_KEY=your-secure-random-key

# AI Chatbot (get from Anthropic)
ANTHROPIC_API_KEY=sk-ant-...
```

See `.env.example` for all available options.

## Step 3: C++ Engine Setup

The C++ engines provide high-performance calculations for genetics operations.

### Linux (Production)

```bash
# Install dependencies
sudo apt update
sudo apt install cmake build-essential libeigen3-dev libomp-dev

# Build the engines
cd zygotrix_engine_cpp
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
cmake --build build

# Verify build (should see multiple executables)
ls -la build/zyg_*
```

### Windows (Development)

```powershell
cd zygotrix_engine_cpp

# Using MinGW
cmake -B build -S . -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release
cmake --build build

# Verify
dir build\*.exe
```

:::tip No Configuration Needed
The backend **automatically finds** the C++ binaries. No environment variables required!
:::

## Step 4: Start the Services

### Start MongoDB

```bash
# Linux
sudo systemctl start mongodb

# macOS (Homebrew)
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:6
```

### Start Redis

```bash
# Linux
sudo systemctl start redis

# macOS (Homebrew)
brew services start redis

# Docker
docker run -d -p 6379:6379 --name redis redis:7
```

### Start Backend

```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Development (with hot reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend (Optional)

```bash
cd zygotrix_ai
npm install
npm run dev
```

## Step 5: Verify Installation

1. **Backend API**: Open http://localhost:8000/docs
2. **Frontend**: Open http://localhost:5173
3. **Test GWAS**: Upload a VCF file through the chatbot

## Next Steps

- [Quick Start Guide](./quick-start) - Build your first Punnett square
- [Configuration](./configuration) - Customize your installation
- [Architecture Overview](../architecture/overview) - Understand the system design
