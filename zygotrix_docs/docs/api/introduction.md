---
sidebar_position: 1
---

# API Introduction

The Zygotrix API provides programmatic access to all genetics tools and features.

## Base URL

```
Development: http://localhost:8000/api
Production:  https://api.zygotrix.com/api
```

## Authentication

Most endpoints require authentication via JWT tokens.

### Getting a Token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Using the Token

Include the token in the `Authorization` header:

```bash
curl http://localhost:8000/api/protected-endpoint \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Response Format

All responses are JSON with consistent structure:

### Success Response

```json
{
  "data": { ... },
  "message": "Success"
}
```

### Error Response

```json
{
  "detail": "Error message here"
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 10/minute |
| General API | 100/minute |
| GWAS Upload | 5/hour |

## API Categories

### Authentication
- [POST /auth/signup](./auth/signup)
- [POST /auth/login](./auth/login)
- [Token Management](./auth/tokens)

### Traits
- [GET /traits](./traits/list)
- [GET /traits/search](./traits/search)
- [GET /traits/:id](./traits/details)

### DNA Tools
- [GET /genetics/dna/random](./dna/generate)
- [POST /genetics/dna/transcribe](./dna/transcribe)
- [POST /genetics/rna/translate](./dna/translate)

### GWAS
- [POST /gwas/datasets/upload](./gwas/upload-dataset)
- [POST /gwas/analyze](./gwas/run-analysis)
- [GET /gwas/results/:id](./gwas/get-results)

### AI Chatbot
- [GET /zygotrix-ai/conversations](./chatbot/conversations)
- [POST /zygotrix-ai/chat](./chatbot/messages)

## Interactive Documentation

Visit `/docs` for Swagger UI:
```
http://localhost:8000/docs
```

Or ReDoc:
```
http://localhost:8000/redoc
```

## SDKs & Libraries

Coming soon:
- Python SDK
- JavaScript/TypeScript SDK
- R package for GWAS
