---
sidebar_position: 3
---

# Testing

Testing guidelines for Zygotrix.

## Backend Testing

### Running Tests

```bash
cd backend
pytest
```

### Test Structure

```
tests/
├── test_auth.py
├── test_traits.py
├── test_genetics.py
├── test_gwas.py
└── conftest.py        # Fixtures
```

### Writing Tests

```python
import pytest
from app.services.mendelian import MendelianService

class TestMendelianService:
    def test_simple_cross(self):
        """Test simple monohybrid cross."""
        service = MendelianService()
        result = service.calculate_cross("Aa", "Aa")
        
        assert len(result.offspring) == 3
        assert result.offspring["AA"] == 0.25
        assert result.offspring["Aa"] == 0.50
        assert result.offspring["aa"] == 0.25

    def test_invalid_genotype(self):
        """Test error handling for invalid genotype."""
        service = MendelianService()
        
        with pytest.raises(ValueError):
            service.calculate_cross("Aaa", "Aa")  # Invalid
```

### Fixtures

```python
# conftest.py
import pytest
from motor.motor_asyncio import AsyncIOMotorClient

@pytest.fixture
async def db_client():
    """Create test database connection."""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    yield client
    client.close()

@pytest.fixture
def mock_user():
    """Create mock user for testing."""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "role": "user"
    }
```

## Frontend Testing

### Running Tests

```bash
cd zygotrix_ai
npm test
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { PunnettSquare } from './PunnettSquare';

describe('PunnettSquare', () => {
  it('renders parent genotypes', () => {
    render(<PunnettSquare parent1="Aa" parent2="Aa" />);
    
    expect(screen.getByText('Aa')).toBeInTheDocument();
  });
});
```

## C++ Testing

### Running Tests

```bash
cd zygotrix_engine_cpp
cmake -B build -DBUILD_TESTS=ON
cmake --build build
./build/zyg_test_mendelian
```

### Unit Tests

```cpp
#include <gtest/gtest.h>
#include "MendelianCalculator.hpp"

TEST(MendelianCalculatorTest, SimpleCross) {
    MendelianCalculator calc;
    auto result = calc.calculateCross("Aa", "Aa");
    
    EXPECT_EQ(result.offspring.size(), 3);
    EXPECT_DOUBLE_EQ(result.offspring["AA"], 0.25);
}
```

## Test Coverage

Generate coverage report:

```bash
# Python
pytest --cov=app --cov-report=html

# View report
open htmlcov/index.html
```

## CI/CD Testing

Tests run automatically on:
- Pull request creation
- Push to main branch
- Release tagging
