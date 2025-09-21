# Zygotrix API Reference

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, the API does not require authentication for basic operations.

## Endpoints

### Traits Management

#### List All Traits

```http
GET /api/traits
```

**Query Parameters:**

- `inheritance_pattern` (optional): Filter by inheritance pattern
  - `autosomal_dominant`
  - `autosomal_recessive`
  - `autosomal`
- `verification_status` (optional): Filter by verification level
  - `verified`: Scientifically confirmed traits
  - `simplified`: Educational/textbook models
- `category` (optional): Filter by trait category
  - `physical_traits`
  - `sensory_traits`
  - `behavioral_traits`
- `gene_info` (optional): Filter by specific gene

**Response:**

```json
{
  "traits": [
    {
      "key": "red_hair",
      "name": "Red Hair",
      "description": "Red hair inheritance controlled strictly by MC1R gene",
      "alleles": ["R", "r"],
      "phenotype_map": {
        "RR": "Non-red",
        "Rr": "Non-red",
        "rr": "Red"
      },
      "metadata": {
        "source": "Verified single-gene trait",
        "gene_location": "16q24.3"
      },
      "inheritance_pattern": "autosomal_recessive",
      "verification_status": "verified",
      "gene_info": "MC1R",
      "category": "physical_traits"
    }
  ]
}
```

#### Create or Update Trait

```http
POST /api/traits
```

**Request Body:**

```json
{
  "key": "example_trait",
  "name": "Example Trait",
  "alleles": ["A", "a"],
  "phenotype_map": {
    "AA": "Dominant phenotype",
    "Aa": "Dominant phenotype",
    "aa": "Recessive phenotype"
  },
  "description": "An example trait for demonstration",
  "inheritance_pattern": "autosomal_dominant",
  "verification_status": "simplified",
  "gene_info": "EXAMPLE_GENE",
  "category": "physical_traits"
}
```

**Response:**

```json
{
  "message": "Trait created successfully",
  "trait_key": "example_trait"
}
```

#### Get Trait Registry

```http
GET /api/trait-registry
```

**Query Parameters:**

- Same filtering options as `/api/traits`

**Response:**

```json
{
  "trait_registry": {
    "red_hair": {
      "name": "Red Hair",
      "alleles": ["R", "r"],
      "phenotype_map": {
        "RR": "Non-red",
        "Rr": "Non-red",
        "rr": "Red"
      },
      "inheritance_pattern": "autosomal_recessive",
      "verification_status": "verified",
      "gene_info": "MC1R",
      "category": "physical_traits"
    }
  }
}
```

### Genetic Simulations

#### Simulate Mendelian Inheritance

```http
POST /api/mendelian/simulate
```

**Request Body:**

```json
{
  "parent1": {
    "red_hair": "Rr",
    "dimples": "Dd"
  },
  "parent2": {
    "red_hair": "Rr",
    "dimples": "dd"
  },
  "traits": ["red_hair", "dimples"],
  "as_percentages": true
}
```

**Response:**

```json
{
  "results": {
    "red_hair": {
      "Non-red": 75.0,
      "Red": 25.0
    },
    "dimples": {
      "Dimples": 50.0,
      "No dimples": 50.0
    }
  },
  "missing_traits": []
}
```

#### Simulate Polygenic Traits

```http
POST /api/polygenic/simulate
```

**Request Body:**

```json
{
  "parent1": {
    "height": ["H1", "h1", "H2", "h2"]
  },
  "parent2": {
    "height": ["h1", "h1", "H2", "h2"]
  },
  "trait_name": "height",
  "num_loci": 2
}
```

**Response:**

```json
{
  "offspring_distributions": {
    "Very Short": 6.25,
    "Short": 25.0,
    "Medium": 37.5,
    "Tall": 25.0,
    "Very Tall": 6.25
  }
}
```

### Health Check

#### API Status

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Invalid trait configuration"
}
```

### 404 Not Found

```json
{
  "detail": "Trait not found"
}
```

### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": ["body", "alleles"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

## Examples

### Get Only Verified Traits

```bash
curl "http://localhost:8000/api/traits?verification_status=verified"
```

### Get Autosomal Dominant Traits

```bash
curl "http://localhost:8000/api/traits?inheritance_pattern=autosomal_dominant"
```

### Get Physical Traits

```bash
curl "http://localhost:8000/api/traits?category=physical_traits"
```

### Complex Filtering

```bash
curl "http://localhost:8000/api/traits?inheritance_pattern=autosomal_recessive&verification_status=verified&category=physical_traits"
```

### Simulate Red Hair Inheritance

```bash
curl -X POST "http://localhost:8000/api/mendelian/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "parent1": {"red_hair": "Rr"},
    "parent2": {"red_hair": "rr"},
    "traits": ["red_hair"],
    "as_percentages": true
  }'
```

### Create Custom Trait

```bash
curl -X POST "http://localhost:8000/api/traits" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "custom_eye_color",
    "name": "Custom Eye Color",
    "alleles": ["B", "b"],
    "phenotype_map": {
      "BB": "Brown eyes",
      "Bb": "Brown eyes",
      "bb": "Blue eyes"
    },
    "description": "Simplified eye color inheritance",
    "inheritance_pattern": "autosomal_dominant",
    "verification_status": "simplified",
    "category": "physical_traits"
  }'
```

## Rate Limits

Currently, no rate limits are enforced. In production, consider implementing:

- 100 requests per minute per IP
- 1000 requests per hour per IP

## Changelog

### v1.1.0 (Current)

- Added Mendelian traits filtering
- Enhanced trait metadata support
- Added verification status tracking
- Improved gene information handling

### v1.0.0

- Initial API release
- Basic trait management
- Mendelian and polygenic simulations
