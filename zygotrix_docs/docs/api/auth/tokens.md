---
sidebar_position: 4
---

# Token Management

Managing JWT tokens for authentication.

## Token Structure

JWT tokens contain:

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "user",
  "exp": 1704067200,
  "iat": 1704063600
}
```

## Refresh Token

Get a new access token:

```
POST /api/auth/refresh
```

```json
{
  "refresh_token": "..."
}
```

## Get Current User

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "...",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "user"
}
```

## Token Expiration

When a token expires, you'll receive:

```json
{
  "detail": "Token has expired"
}
```

Refresh the token or login again.
