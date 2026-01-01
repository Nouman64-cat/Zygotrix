---
sidebar_position: 3
---

# Login

Authenticate and receive an access token.

## Endpoint

```
POST /api/auth/login
```

## Request Body

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

## Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "email_verified": true
  }
}
```

## Usage

Include the token in subsequent requests:

```bash
curl http://localhost:8000/api/protected \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Errors

| Code | Message |
|------|---------|
| 401 | Invalid credentials |
| 403 | Email not verified |
