---
sidebar_position: 1
---

# Contributing

Guidelines for contributing to Zygotrix.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/Zygotrix.git
cd Zygotrix

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# C++ engine (if modifying)
cd ../zygotrix_engine_cpp
cmake -B build -S .
cmake --build build

# Frontend (if modifying)
cd ../zygotrix_ai
npm install
```

## Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-gwas-visualization` |
| Bug fix | `fix/description` | `fix/punnett-square-error` |
| Docs | `docs/description` | `docs/update-api-reference` |

## Commit Messages

Follow conventional commits:

```
feat: add GWAS visualization
fix: correct Punnett square calculation
docs: update API documentation
refactor: simplify auth service
test: add trait search tests
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Request review from maintainers
5. Address feedback

## What to Contribute

### Good First Issues
- Documentation improvements
- Bug fixes with existing tests
- Small feature enhancements

### Larger Contributions
- New genetics tools
- Performance improvements
- New AI chatbot capabilities

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn
