---
sidebar_position: 2
---

# Backend Architecture

The Zygotrix backend is built with FastAPI, following a clean layered architecture.

## Layer Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Routes (API Layer)                    │
│  Handles HTTP requests, validation, authentication       │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                  Services (Business Logic)               │
│  Contains all business rules and orchestration           │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│               Repositories (Data Access)                 │
│  Abstracts database operations                           │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    Database (MongoDB)                    │
│  Persistent data storage                                 │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/app/
├── routes/                 # API endpoints
│   ├── auth.py            # Authentication endpoints
│   ├── traits.py          # Trait management
│   ├── genetics.py        # Genetics calculations
│   ├── gwas.py            # GWAS analysis
│   ├── zygotrix_ai.py     # AI chatbot
│   └── admin.py           # Admin operations
│
├── services/              # Business logic
│   ├── auth_service.py
│   ├── trait_service.py
│   ├── mendelian.py       # Mendelian calculations
│   ├── gwas_engine.py     # C++ GWAS interface
│   ├── gwas_analysis_service.py
│   └── zygotrix_ai/       # AI chatbot services
│       ├── chat_service.py
│       ├── claude_service.py
│       └── preference_detector.py
│
├── repositories/          # Data access layer
│   ├── base.py            # Abstract base repository
│   ├── user_repository.py
│   ├── trait_repository.py
│   └── gwas_dataset_repository.py
│
├── schema/                # Pydantic models
│   ├── auth.py
│   ├── traits.py
│   ├── gwas.py
│   └── cpp_engine.py
│
├── core/                  # Core utilities
│   ├── database/          # MongoDB connection
│   ├── security/          # JWT, password hashing
│   └── cache/             # Redis caching
│
├── mcp/                   # MCP (Model Context Protocol)
│   ├── server/            # MCP server implementation
│   ├── client/            # MCP client for Claude
│   └── claude_tools.py    # Tool execution
│
├── chatbot_tools/         # AI chatbot tool implementations
│   ├── trait_tools.py
│   ├── genetics_tools.py
│   ├── dna_tools.py
│   └── gwas_tools.py
│
├── config.py              # Configuration management
└── main.py                # Application entry point
```

## Configuration

All configuration is centralized in `config.py`:

```python
@dataclass(frozen=True)
class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    auth_secret_key: str = os.getenv("AUTH_SECRET_KEY", "change-me")
    use_cpp_engine: bool = _get_bool("USE_CPP_ENGINE", True)
    # ... more settings

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
```

Settings are:
- Loaded from environment variables
- Type-safe with dataclass
- Cached for performance
- Immutable (frozen=True)

## Routes Layer

Routes handle:
- Request parsing and validation
- Authentication/authorization
- Calling appropriate services
- Response formatting

```python
# Example: routes/genetics.py
@router.post("/cross", response_model=CrossResult)
async def calculate_cross(
    request: CrossRequest,
    current_user: User = Depends(get_current_user)
):
    """Calculate Punnett square for genetic cross."""
    result = await cross_service.calculate(
        parent1=request.parent1_genotype,
        parent2=request.parent2_genotype,
        user_id=current_user.id
    )
    return result
```

## Services Layer

Services contain business logic and orchestrate operations:

```python
# Example: services/mendelian.py
class MendelianService:
    def __init__(self):
        self.cpp_engine = CppEngineService()
    
    async def calculate_cross(
        self,
        parent1: str,
        parent2: str,
    ) -> CrossResult:
        # Use C++ engine for calculation
        if settings.use_cpp_engine:
            return self.cpp_engine.run_cross(parent1, parent2)
        
        # Fallback to Python implementation
        return self._python_cross(parent1, parent2)
```

## Repository Layer

Repositories abstract database operations:

```python
# Example: repositories/user_repository.py
class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(collection_name="users")
    
    async def find_by_email(self, email: str) -> Optional[User]:
        doc = await self.collection.find_one({"email": email})
        return User(**doc) if doc else None
    
    async def create(self, user: UserCreate) -> User:
        doc = user.model_dump()
        doc["created_at"] = datetime.utcnow()
        result = await self.collection.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        return User(**doc)
```

## Authentication Flow

```
Client                    Backend                    MongoDB
  │                          │                          │
  │ POST /auth/login         │                          │
  │ {email, password}        │                          │
  │─────────────────────────►│                          │
  │                          │ Find user by email       │
  │                          │─────────────────────────►│
  │                          │                          │
  │                          │◄─────────────────────────│
  │                          │ Verify password hash     │
  │                          │ Generate JWT token       │
  │◄─────────────────────────│                          │
  │ {access_token, user}     │                          │
  │                          │                          │
  │ GET /api/protected       │                          │
  │ Authorization: Bearer... │                          │
  │─────────────────────────►│                          │
  │                          │ Verify JWT token         │
  │                          │ Get user from token      │
  │◄─────────────────────────│                          │
  │ Protected data           │                          │
```

## Error Handling

Consistent error handling across the application:

```python
from fastapi import HTTPException

# Service layer raises HTTPException
def run_gwas_analysis(...):
    if not cli_path.exists():
        raise HTTPException(
            status_code=500,
            detail="C++ GWAS CLI not found. Build the engine first."
        )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

## Dependency Injection

FastAPI's dependency injection is used throughout:

```python
# Define dependencies
def get_db() -> Database:
    return database.get_database()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Database = Depends(get_db)
) -> User:
    # Validate token and return user
    ...

# Use in routes
@router.get("/me")
async def get_profile(user: User = Depends(get_current_user)):
    return user
```

## Next Steps

- [C++ Engine Architecture](./cpp-engine)
- [AI Chatbot Architecture](./ai-chatbot)
- [Database Schema](./database)
