# Zygotrix Backend

The Zygotrix backend exposes a REST API for Mendelian and polygenic simulations powered by the core `zygotrix_engine` package. It is built with FastAPI and now supports persisting custom trait definitions in MongoDB so they can be shared across clients.

## Features

- **Trait catalogue** � discover the bundled traits and their allele/phenotype mappings, with optional overrides stored in MongoDB.
- **Trait management** � create, update, and delete custom traits via REST endpoints.
- **Mendelian simulation** � submit parent genotypes and receive phenotype probability or percentage distributions.
- **Polygenic scoring** � compute expected offspring scores from additive SNP weights.
- **Authentication** � password-based login backed by JWT access tokens with configurable TTLs.
- **OTP-protected signup** � request an email one-time password to validate new accounts (Resend.com integration, 10-minute expiry, resend support).
- **CORS-enabled** � ready to be queried by local web/mobile clients.

## Project layout

```
backend/
+-- app/
�   +-- __init__.py
�   +-- config.py       # Environment-driven settings (MongoDB URI, auth secrets, Resend, etc.)
�   +-- main.py         # FastAPI application entrypoint
�   +-- schemas.py      # Pydantic request/response models
�   +-- services.py     # Orchestrates zygotrix_engine + MongoDB integrations
+-- requirements.txt    # Runtime dependencies
+-- .env.example        # Backend environment configuration template
+-- tests/
    +-- test_api.py     # API-level tests with TestClient & mongomock
```

## Getting started

1. Create a virtual environment and install dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   pip install -r requirements.txt
   pip install -e ../zygotrix_engine
   ```

2. Copy the example environment file and fill in your MongoDB connection + auth/email details:

   ```bash
   cp .env.example .env
   ```

   Required variables:

   - `MONGODB_URI`: connection string (e.g. `mongodb+srv://...` or `mongomock://localhost` for local testing)
   - `MONGODB_DB_NAME`: database to target (defaults to `zygotrix`)
   - `MONGODB_TRAITS_COLLECTION`: collection for persisted traits (defaults to `traits`)
   - `MONGODB_USERS_COLLECTION`: collection for stored user accounts (defaults to `users`)
   - `MONGODB_PENDING_SIGNUPS_COLLECTION`: collection holding pending OTP signups (defaults to `pending_signups`)
   - `AUTH_SECRET_KEY`: HMAC secret used to sign JWT access tokens
   - `AUTH_TOKEN_TTL_MINUTES`: access token lifetime in minutes (defaults to `60`)
   - `AUTH_JWT_ALGORITHM`: JWT signing algorithm (defaults to `HS256`)
   - `RESEND_API_KEY`: API key for [Resend](https://resend.com) email delivery
   - `RESEND_FROM_EMAIL`: email sender used for OTP messages (defaults to `onboarding@resend.dev`; replace with your verified domain address in production)
   - `SIGNUP_OTP_TTL_MINUTES`: OTP validity window in minutes (defaults to `10`)

3. Run the development server:

   ```bash
   uvicorn app.main:app --reload
   ```

4. Explore the interactive docs at http://127.0.0.1:8000/docs.

## Available endpoints

- `GET /health` — basic readiness probe.
- `POST /api/auth/signup` — initiate signup, generate OTP, and send via email.
- `POST /api/auth/signup/verify` — validate the OTP and create the user account.
- `POST /api/auth/signup/resend` — issue a fresh OTP email.
- `POST /api/auth/login` — authenticate an existing account.
- `GET /api/auth/me` — fetch the profile of the authenticated user.
- `GET /api/portal/status` — example protected endpoint for portal clients.
- `GET /api/traits` — list the registered traits (bundled + custom).
- `POST /api/traits` — create or overwrite a trait definition.
- `PUT /api/traits/{key}` — update an existing trait by key.
- `DELETE /api/traits/{key}` — remove a trait from the persistent store.
- `POST /api/mendelian/simulate` — request phenotype distributions.
- `POST /api/polygenic/score` — calculate an expected polygenic score.

### Admin Endpoints (requires admin or super_admin role)

- `GET /api/admin/users` — list all users with pagination and filtering.
- `GET /api/admin/users/{user_id}` — get detailed user information.
- `POST /api/admin/users/{user_id}/deactivate` — deactivate a user account.
- `POST /api/admin/users/{user_id}/reactivate` — reactivate a deactivated user.
- `DELETE /api/admin/users/{user_id}` — permanently delete a user (super_admin only).
- `PATCH /api/admin/users/{user_id}/role` — update user role (super_admin only).
- `GET /api/admin/stats` — get user statistics.

## Super Admin Setup

To designate a super admin, set the `SUPER_ADMIN_EMAIL` environment variable to the email address of the user who should have super admin privileges. When a user registers with this email, they will automatically be assigned the `super_admin` role.

```bash
SUPER_ADMIN_EMAIL=admin@yourcompany.com
```

User roles:

- `user` — Standard user with access to their own data
- `admin` — Can view all users and deactivate/reactivate accounts
- `super_admin` — Full access including user deletion and role management

## Testing

Install testing dependencies and run pytest (mongomock is used automatically for MongoDB interactions when `MONGODB_URI` is set to `mongomock://localhost`):

```bash
pip install -r requirements.txt
pip install -e ../zygotrix_engine
pip install pytest httpx setuptools
pytest
```

The suite exercises the public API surface, including the OTP-authenticated signup flow, to ensure correct integration with the engine and the persistence layer.
