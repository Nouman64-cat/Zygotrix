# Zygotrix Backend

The Zygotrix backend exposes a REST API for Mendelian and polygenic simulations powered by the core `zygotrix_engine` package. It is built with FastAPI and now supports persisting custom trait definitions in MongoDB so they can be shared across clients.

## Features
- **Trait catalogue** – discover the bundled traits and their allele/phenotype mappings, with optional overrides stored in MongoDB.
- **Trait management** – create, update, and delete custom traits via REST endpoints.
- **Mendelian simulation** – submit parent genotypes and receive phenotype probability or percentage distributions.
- **Polygenic scoring** – compute expected offspring scores from additive SNP weights.
- **CORS-enabled** – ready to be queried by local web/mobile clients.

## Project layout
```
backend/
├─ app/
│  ├─ __init__.py
│  ├─ config.py       # Environment-driven settings (MongoDB URI, etc.)
│  ├─ main.py         # FastAPI application entrypoint
│  ├─ schemas.py      # Pydantic request/response models
│  └─ services.py     # Orchestrates zygotrix_engine + MongoDB integrations
├─ requirements.txt   # Runtime dependencies
├─ .env.example       # Backend environment configuration template
└─ tests/
   └─ test_api.py     # API-level tests with TestClient & mongomock
```

## Getting started

1. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   pip install -r requirements.txt
   pip install -e ../zygotrix_engine
   ```

2. Copy the example environment file and fill in your MongoDB connection details:
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `MONGODB_URI`: connection string (e.g. `mongodb+srv://...`)
   - `MONGODB_DB_NAME`: database to target (defaults to `zygotrix`)
   - `MONGODB_TRAITS_COLLECTION`: collection for persisted traits (defaults to `traits`)

3. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

4. Explore the interactive docs at http://127.0.0.1:8000/docs.

## Available endpoints
- `GET /health` – basic readiness probe.
- `GET /api/traits` – list the registered traits (bundled + custom).
- `POST /api/traits` – create or overwrite a trait definition.
- `PUT /api/traits/{key}` – update an existing trait by key.
- `DELETE /api/traits/{key}` – remove a trait from the persistent store.
- `POST /api/mendelian/simulate` – request phenotype distributions.
- `POST /api/polygenic/score` – calculate an expected polygenic score.

## Testing

Install testing dependencies and run pytest (mongomock is used automatically for MongoDB interactions):
```bash
pip install -r requirements.txt
pip install -e ../zygotrix_engine
pytest
```

The suite exercises the public API surface to ensure correct integration with the engine and the persistence layer.