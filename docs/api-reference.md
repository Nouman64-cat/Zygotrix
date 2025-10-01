# Zygotrix API Reference

## Base URL

```
http://localhost:8000
```

## Authentication

The Zygotrix API uses JWT Bearer token authentication for protected endpoints.

### Authentication Headers

For protected endpoints, include the JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Getting Authentication Token

Use the authentication endpoints to obtain a JWT token:

```http
POST /api/auth/signup/initiate
POST /api/auth/signup/verify
POST /api/auth/login
```

## Endpoints

### Traits Management

The trait management system supports full CRUD operations with MongoDB storage, access control, and advanced filtering.

#### List Traits

```http
GET /api/traits
```

**Query Parameters:**

- `inheritance_pattern` (optional): Filter by inheritance pattern
  - `autosomal_dominant`
  - `autosomal_recessive`
  - `autosomal`
  - `x_linked`
  - `y_linked`
  - `mitochondrial`
- `verification_status` (optional): Filter by verification level
  - `verified`: Scientifically confirmed traits
  - `simplified`: Educational/textbook models
  - `experimental`: Research-based traits
- `category` (optional): Filter by trait category
  - `physical_traits`
  - `sensory_traits`
  - `behavioral_traits`
  - `disease_traits`
  - `metabolic_traits`
- `gene` (optional): Filter by gene name (supports partial matching)
- `tags` (optional): Filter by tags (array of strings)
- `search` (optional): Full-text search across name, gene, category, and tags
- `status` (optional): Filter by trait status
  - `draft`: Work in progress
  - `active`: Published and available
  - `deprecated`: No longer maintained
- `visibility` (optional): Filter by visibility level
  - `private`: Only visible to owner
  - `team`: Visible to team members
  - `public`: Visible to everyone

**Authentication:** Optional (provides access to private traits if authenticated)

**Access Control:**

- Public traits are visible to everyone
- Private/team traits are only visible to authenticated owners
- Without authentication, only public traits are returned

**Response:**

```json
{
  "traits": [
    {
      "key": "red_hair",
      "name": "Red Hair",
      "alleles": ["R", "r"],
      "phenotype_map": {
        "RR": "Non-red",
        "Rr": "Non-red",
        "rr": "Red hair"
      },
      "inheritance_pattern": "autosomal_recessive",
      "verification_status": "verified",
      "category": "physical_traits",
      "gene_info": {
        "gene": "MC1R",
        "chromosome": "16",
        "locus": "16q24.3"
      },
      "allele_freq": {
        "european": 0.04,
        "global": 0.02
      },
      "education_note": "Classic example of recessive inheritance",
      "references": ["https://pubmed.gov/12345678"],
      "version": "1.2.0",
      "status": "active",
      "owner_id": "user123",
      "visibility": "public",
      "tags": ["hair", "pigmentation", "recessive"],
      "validation_rules": {
        "passed": true,
        "errors": []
      },
      "created_at": "2023-10-01T10:00:00Z",
      "updated_at": "2023-10-15T14:30:00Z",
      "created_by": "user123",
      "updated_by": "user123"
    }
  ]
}
```

#### Create Trait

```http
POST /api/traits
```

**Authentication:** Required

**Request Body:**

```json
{
  "key": "new_trait",
  "name": "New Genetic Trait",
  "alleles": ["A", "a"],
  "phenotype_map": {
    "AA": "Dominant phenotype",
    "Aa": "Dominant phenotype",
    "aa": "Recessive phenotype"
  },
  "inheritance_pattern": "autosomal_dominant",
  "verification_status": "simplified",
  "category": "physical_traits",
  "gene_info": {
    "gene": "EXAMPLE",
    "chromosome": "1",
    "locus": "1p36.1"
  },
  "allele_freq": {
    "population1": 0.25,
    "population2": 0.15
  },
  "epistasis_hint": "May interact with gene X",
  "education_note": "Good example for teaching dominant inheritance",
  "references": ["https://pubmed.gov/example1", "https://example.edu/paper"],
  "visibility": "private",
  "tags": ["example", "teaching", "dominant"],
  "test_case_seed": "example_seed_123"
}
```

**Response:**

```json
{
  "trait": {
    "key": "new_trait",
    "name": "New Genetic Trait",
    "version": "1.0.0",
    "status": "draft",
    "owner_id": "user123",
    "created_at": "2023-10-20T15:00:00Z",
    "validation_rules": {
      "passed": true,
      "errors": []
    }
  }
}
```

**Validation:**

- `key` must be unique per owner
- `alleles` must be non-empty
- `phenotype_map` must cover all possible genotype combinations
- Genotypes are automatically canonicalized (sorted alphabetically)

#### Get Trait by Key

```http
GET /api/traits/{key}
```

**Authentication:** Optional (required for private traits)

**Path Parameters:**

- `key`: Unique trait identifier

**Response:** Same as individual trait object in list response

**Access Control:**

- Public traits: accessible to everyone
- Private traits: only accessible to owner

#### Update Trait

```http
PUT /api/traits/{key}
```

**Authentication:** Required (must be trait owner)

**Path Parameters:**

- `key`: Unique trait identifier

**Request Body:** (All fields optional for updates)

```json
{
  "name": "Updated Trait Name",
  "alleles": ["A", "a", "B"],
  "phenotype_map": {
    "AA": "New phenotype A",
    "AB": "New phenotype AB"
  },
  "inheritance_pattern": "polygenic",
  "visibility": "public",
  "tags": ["updated", "example"]
}
```

**Response:**

```json
{
  "trait": {
    "key": "trait_key",
    "name": "Updated Trait Name",
    "version": "1.0.1",
    "updated_at": "2023-10-20T16:00:00Z",
    "previous_version": {
      "version": "1.0.0",
      "updated_at": "2023-10-15T14:30:00Z",
      "updated_by": "user123"
    }
  }
}
```

**Features:**

- Automatic version bumping (patch version increment)
- Audit trail preservation
- Re-validation of updated data
- Only trait owner can update

#### Delete Trait

```http
DELETE /api/traits/{key}
```

**Authentication:** Required (must be trait owner)

**Path Parameters:**

- `key`: Unique trait identifier

**Response:** `204 No Content`

**Behavior:**

- Performs soft delete (sets status to "deprecated")
- Trait remains in database for audit purposes
- Only trait owner can delete
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

````

#### Create or Update Trait

```http
POST /api/traits
````

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
