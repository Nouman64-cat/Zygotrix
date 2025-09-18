# Zygotrix Backend

The Zygotrix backend exposes a REST API for Mendelian and polygenic simulations powered by the core `zygotrix_engine` package. It is built with FastAPI and designed to serve the landing page, notebooks, or other clients interested in genetics modelling.

## Features
- **Trait catalogue** – discover the bundled traits and their allele/phenotype mappings.
- **Mendelian simulation** – submit parent genotypes and receive phenotype probability or percentage distributions.
- **Polygenic scoring** – compute expected offspring scores from additive SNP weights.
- **CORS-enabled** – ready to be queried by local web/mobile clients.

## Project layout
```
backend/
+- app/
¦  +- __init__.py
¦  +- main.py          # FastAPI application entrypoint
¦  +- schemas.py       # Pydantic request/response models
¦  +- services.py      # Orchestrates zygotrix_engine integrations
+- requirements.txt    # Runtime dependencies
+- tests/
   +- test_api.py      # API-level tests with TestClient
```

## Getting started

1. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   pip install -r requirements.txt
   # Make the engine package importable
   pip install -e ../zygotrix_engine
   ```

2. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

3. Explore the interactive docs at http://127.0.0.1:8000/docs.

## Available endpoints
- `GET /health` – basic readiness probe.
- `GET /api/traits` – list the registered traits.
- `POST /api/mendelian/simulate` – request phenotype distributions.
- `POST /api/polygenic/score` – calculate an expected polygenic score.

## Testing

Install testing dependencies and run pytest:
```bash
pip install pytest httpx
pytest
```

The suite exercises the public API surface to ensure correct integration with the engine.
