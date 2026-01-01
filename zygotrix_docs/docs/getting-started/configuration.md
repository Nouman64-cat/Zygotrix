---
sidebar_position: 3
---

# Configuration

Zygotrix is highly configurable through environment variables. This guide covers all available options.

## Environment Variables

All configuration is done through the `.env` file in the `backend/` directory.

### Core Settings

```bash
# Environment: "Development" or "Production"
BACKEND_ENV=Development

# Backend URL (used for generating links)
BACKEND_URL=http://localhost:8000

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:5173
```

### Database Configuration

```bash
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017

# Database name
MONGODB_DB_NAME=zygotrix

# Collection names (optional, defaults shown)
MONGODB_TRAITS_COLLECTION=traits
MONGODB_USERS_COLLECTION=users
```

### Redis Configuration

```bash
# Redis connection URL
REDIS_URL=redis://localhost:6379/0

# Cache TTL in seconds (default: 5 minutes)
REDIS_CACHE_TTL_SECONDS=300
```

### Authentication

```bash
# JWT secret key (MUST be changed in production!)
AUTH_SECRET_KEY=your-super-secure-random-key

# Token expiration in minutes
AUTH_TOKEN_TTL_MINUTES=60

# JWT algorithm
AUTH_JWT_ALGORITHM=HS256
```

:::danger Security Warning
Always use a strong, random `AUTH_SECRET_KEY` in production. Generate one with:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
:::

### AI Chatbot (Zigi)

```bash
# Anthropic API key for Claude
ANTHROPIC_API_KEY=sk-ant-...

# Bot name (displayed in UI)
ZYGOTRIX_BOT_NAME=Zigi

# Model selection (optional)
CLAUDE_MODEL=claude-sonnet-4-20250514
```

### Email Configuration (AWS SES)

```bash
# AWS SES SMTP credentials
AWS_SES_USERNAME=your-ses-username
AWS_SES_PASSWORD=your-ses-password
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=no-reply@zygotrix.com
AWS_SMTP_PORT=465

# OTP expiration
SIGNUP_OTP_TTL_MINUTES=10
PASSWORD_RESET_OTP_TTL_MINUTES=10
```

### WhatsApp Notifications (Twilio)

```bash
# Twilio credentials
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=+14155238886

# Admin notification recipient
ADMIN_WHATSAPP_TO=+1234567890
```

### Intelligent Routing

```bash
# Enable smart query classification
ENABLE_INTELLIGENT_ROUTING=true

# Use LLM for ambiguous queries
ENABLE_LLM_CLASSIFIER=true

# Confidence threshold (0.0-1.0)
CLASSIFIER_CONFIDENCE_THRESHOLD=0.85
```

### C++ Engine

```bash
# Enable C++ engine for Mendelian calculations
USE_CPP_ENGINE=true

# Parallel DNA generation threshold (base pairs)
PARALLEL_DNA_THRESHOLD=1000000

# Optional: Override default paths (usually not needed)
# CPP_ENGINE_CLI_PATH=/custom/path/to/zyg_cross_cli
# CPP_GWAS_CLI_PATH=/custom/path/to/zyg_gwas_cli
```

## Configuration by Environment

### Development

```bash
BACKEND_ENV=Development
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379/0
```

### Production

```bash
BACKEND_ENV=Production
BACKEND_URL=https://api.zygotrix.com
FRONTEND_URL=https://zygotrix.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/zygotrix
REDIS_URL=redis://user:pass@redis-host:6379/0
```

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `USE_CPP_ENGINE` | `true` | Use C++ for Mendelian calculations |
| `ENABLE_INTELLIGENT_ROUTING` | `true` | Smart query classification |
| `ENABLE_LLM_CLASSIFIER` | `true` | LLM fallback for classification |
| `TRAITS_JSON_ONLY` | `false` | Disable trait CRUD, use JSON only |

## Validating Configuration

Start the backend and check the logs:

```bash
uvicorn app.main:app --reload
```

Look for configuration confirmations:
```
INFO: ✅ MongoDB connected
INFO: ✅ Redis connected  
INFO: ✅ Claude API configured
INFO: ✅ C++ engine found
```

## Next Steps

- [Architecture Overview](../architecture/overview) - Understand the system
- [Deployment Guide](../developer-guide/deployment) - Deploy to production
