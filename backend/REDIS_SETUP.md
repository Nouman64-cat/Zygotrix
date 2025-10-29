# Redis Setup for Zygotrix Backend

## Overview

The backend now uses Redis for caching Hygraph API responses instead of in-memory caching. This provides:

- Persistent cache across server restarts
- Shared cache across multiple server instances
- Better scalability for production

## Installation

### 1. Install Redis Python Client

```bash
pip install -r requirements.txt
```

### 2. Install Redis Server

#### Windows (using WSL2 or Docker)

**Option A: Using Docker**

```bash
docker run -d -p 6379:6379 --name redis-zygotrix redis:latest
```

**Option B: Using WSL2**

```bash
# In WSL terminal
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

#### macOS

```bash
brew install redis
brew services start redis
```

#### Linux

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

## Configuration

Add to your `.env` file:

```env
REDIS_URL=redis://localhost:6379/0
REDIS_CACHE_TTL_SECONDS=300
```

**Production Redis URL examples:**

- Local: `redis://localhost:6379/0`
- Remote with auth: `redis://:password@hostname:6379/0`
- Redis Cloud: `redis://default:password@redis-xxxxx.cloud.redislabs.com:16379`

## Cache Management

### Automatic Caching

Courses from Hygraph are automatically cached for 5 minutes (300 seconds) by default.

### Manual Cache Clearing

You can clear the cache via API:

```bash
POST /api/university/cache/clear
Authorization: Bearer <your-token>
```

Or programmatically:

```python
from app.utils.redis_client import clear_cache_pattern
clear_cache_pattern("hygraph:*")
```

## Fallback Behavior

If Redis is unavailable:

- The app will log a warning and continue without caching
- Each request will fetch fresh data from Hygraph
- No errors will be thrown

## Testing Redis Connection

```bash
# In your terminal
redis-cli ping
# Should return: PONG
```

## Cache Keys

- Courses: `hygraph:courses`
- You can add more patterns as needed

## Monitoring

Check Redis keys:

```bash
redis-cli KEYS "hygraph:*"
```

Check TTL of a key:

```bash
redis-cli TTL "hygraph:courses"
```
