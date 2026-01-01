---
sidebar_position: 2
---

# Sign Up

Register a new user account.

## Endpoint

```
POST /api/auth/signup
```

## Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

## Response

```json
{
  "message": "OTP sent to user@example.com",
  "expires_in_minutes": 10
}
```

## Verify OTP

After receiving the OTP via email:

```
POST /api/auth/verify-otp
```

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

## Errors

| Code | Message |
|------|---------|
| 400 | Email already registered |
| 422 | Invalid email format |
| 422 | Password too weak |
