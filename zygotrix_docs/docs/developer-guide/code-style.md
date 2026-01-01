---
sidebar_position: 2
---

# Code Style

Coding standards for Zygotrix.

## Python (Backend)

### Formatting

Use **Black** for formatting:
```bash
black app/
```

Use **isort** for imports:
```bash
isort app/
```

### Style Guidelines

```python
# Good: Descriptive names
def calculate_punnett_square(parent1_genotype: str, parent2_genotype: str) -> CrossResult:
    """Calculate offspring genotypes from genetic cross."""
    ...

# Bad: Unclear names
def calc(p1, p2):
    ...
```

### Type Hints

Always use type hints:
```python
def get_user_by_email(email: str) -> Optional[User]:
    ...
```

### Docstrings

Use Google-style docstrings:
```python
def run_gwas_analysis(
    snps: List[Dict],
    samples: List[Dict],
    analysis_type: str
) -> Dict[str, Any]:
    """
    Run GWAS analysis on provided data.
    
    Args:
        snps: List of SNP information dictionaries.
        samples: List of sample data dictionaries.
        analysis_type: Type of analysis (linear, logistic).
    
    Returns:
        Dictionary containing analysis results.
    
    Raises:
        HTTPException: If analysis fails.
    """
```

## TypeScript/JavaScript (Frontend)

### Formatting

Use **Prettier**:
```bash
npx prettier --write src/
```

### Style Guidelines

```typescript
// Good: Typed components
interface PunnettSquareProps {
  parent1: string;
  parent2: string;
  onCalculate: (result: CrossResult) => void;
}

const PunnettSquare: React.FC<PunnettSquareProps> = ({ parent1, parent2, onCalculate }) => {
  // ...
};
```

## C++ (Engine)

### Formatting

Use **clang-format**:
```bash
clang-format -i src/*.cpp
```

### Style Guidelines

```cpp
// Good: Clear naming, const correctness
std::vector<CrossResult> calculateCross(
    const std::string& parent1,
    const std::string& parent2
) const;

// Good: RAII for resource management
class FileHandler {
public:
    explicit FileHandler(const std::string& path);
    ~FileHandler();
    // ...
};
```

## File Organization

### Python
```
backend/app/
├── routes/          # API endpoints only
├── services/        # Business logic
├── repositories/    # Data access
├── schema/          # Pydantic models
└── core/            # Utilities
```

### TypeScript
```
src/
├── components/      # React components
├── hooks/           # Custom hooks
├── services/        # API calls
├── types/           # TypeScript types
└── utils/           # Helper functions
```
