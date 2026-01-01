---
sidebar_position: 1
---

# Authentication Overview

Zygotrix uses JWT (JSON Web Tokens) for authentication.

## Flow

```
1. User signs up → Receives OTP via email
2. User verifies OTP → Account created
3. User logs in → Receives JWT token
4. User includes token in requests → Access granted
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/verify-otp` | Verify email OTP |
| POST | `/auth/login` | Get access token |
| GET | `/auth/me` | Get current user |
| POST | `/auth/refresh` | Refresh token |
| POST | `/auth/forgot-password` | Request reset |
| POST | `/auth/reset-password` | Reset password |

## Token Lifetime

| Token Type | Lifetime |
|------------|----------|
| Access Token | 60 minutes (configurable) |
| Refresh Token | 7 days |
| OTP | 10 minutes |

## Security Notes

- Tokens are signed with HS256
- Passwords are hashed with bcrypt
- OTPs are 6-digit codes
- Rate limiting prevents brute force
