---
sidebar_position: 4
---

# Deployment

Deploy Zygotrix to production.

## Prerequisites

- Ubuntu 22.04+ server
- Domain with DNS configured
- MongoDB Atlas or self-hosted
- Redis instance

## Quick Deploy

```bash
# 1. Clone repository
git clone https://github.com/Nouman64-cat/Zygotrix.git
cd Zygotrix

# 2. Install dependencies
sudo apt update
sudo apt install python3.11 python3.11-venv cmake build-essential libeigen3-dev

# 3. Build C++ engine
cd zygotrix_engine_cpp
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
cmake --build build

# 4. Setup backend
cd ../backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 5. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 6. Start with systemd
sudo cp zygotrix-backend.service /etc/systemd/system/
sudo systemctl enable zygotrix-backend
sudo systemctl start zygotrix-backend
```

## Systemd Service

Create `/etc/systemd/system/zygotrix-backend.service`:

```ini
[Unit]
Description=Zygotrix Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/deploy/Zygotrix/backend
Environment="PATH=/home/deploy/Zygotrix/backend/.venv/bin"
ExecStart=/home/deploy/Zygotrix/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.zygotrix.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.zygotrix.com;

    ssl_certificate /etc/letsencrypt/live/api.zygotrix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.zygotrix.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Docker Deployment

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

# Install C++ build tools
RUN apt-get update && apt-get install -y \
    cmake build-essential libeigen3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Build C++ engine
COPY zygotrix_engine_cpp /app/zygotrix_engine_cpp
RUN cd zygotrix_engine_cpp && \
    cmake -B build -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend /app/backend

WORKDIR /app/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7

volumes:
  mongo_data:
```

## Environment Variables (Production)

```bash
# Production settings
BACKEND_ENV=Production
BACKEND_URL=https://api.zygotrix.com
FRONTEND_URL=https://zygotrix.com

# Security
AUTH_SECRET_KEY=<generate-secure-key>

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/zygotrix

# Redis
REDIS_URL=redis://user:pass@redis-host:6379

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
```

## Health Checks

```bash
# Backend health
curl https://api.zygotrix.com/health

# C++ engine check
curl https://api.zygotrix.com/api/genetics/dna/random?length=10
```

## Monitoring

- **Logs**: Check with `journalctl -u zygotrix-backend -f`
- **Metrics**: Add Prometheus/Grafana for monitoring
- **Errors**: Configure Sentry for error tracking

## Updates

```bash
# Pull latest code
git pull origin main

# Rebuild C++ engine (if changed)
cd zygotrix_engine_cpp
cmake --build build

# Update Python dependencies
cd ../backend
source .venv/bin/activate
pip install -r requirements.txt

# Restart service
sudo systemctl restart zygotrix-backend
```
