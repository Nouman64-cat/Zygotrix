# Trait Management Usage Examples

This document provides practical examples of using the Zygotrix trait management API.

## Setup

First, obtain an authentication token:

```bash
# Sign up and verify email
curl -X POST "http://localhost:8000/api/auth/signup/initiate" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "researcher@university.edu",
    "password": "secure_password123",
    "full_name": "Dr. Researcher"
  }'

# After email verification
curl -X POST "http://localhost:8000/api/auth/signup/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "researcher@university.edu",
    "otp": "123456"
  }'

# Login to get token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "researcher@university.edu",
    "password": "secure_password123"
  }'
```

Save the returned JWT token for use in subsequent requests.

## Creating a New Trait

### Example 1: Simple Dominant Trait

```bash
curl -X POST "http://localhost:8000/api/traits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "key": "brown_eyes",
    "name": "Brown Eyes",
    "alleles": ["B", "b"],
    "phenotype_map": {
      "BB": "Brown eyes",
      "Bb": "Brown eyes",
      "bb": "Blue eyes"
    },
    "inheritance_pattern": "autosomal_dominant",
    "verification_status": "simplified",
    "category": "physical_traits",
    "gene_info": {
      "gene": "HERC2",
      "chromosome": "15",
      "locus": "15q13.1"
    },
    "tags": ["eyes", "pigmentation", "dominant"],
    "education_note": "Classic example of dominant inheritance pattern",
    "visibility": "public"
  }'
```

### Example 2: Complex Trait with Population Data

```bash
curl -X POST "http://localhost:8000/api/traits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "key": "lactose_tolerance",
    "name": "Lactose Tolerance",
    "alleles": ["T", "t"],
    "phenotype_map": {
      "TT": "Lactose tolerant",
      "Tt": "Lactose tolerant",
      "tt": "Lactose intolerant"
    },
    "inheritance_pattern": "autosomal_dominant",
    "verification_status": "verified",
    "category": "metabolic_traits",
    "gene_info": {
      "gene": "LCT",
      "chromosome": "2",
      "locus": "2q21.3"
    },
    "allele_freq": {
      "northern_european": 0.90,
      "east_asian": 0.05,
      "african": 0.20,
      "global_average": 0.35
    },
    "references": [
      "https://pubmed.ncbi.nlm.nih.gov/17159977",
      "https://pubmed.ncbi.nlm.nih.gov/12567112"
    ],
    "education_note": "Shows geographic variation in allele frequencies due to evolutionary selection",
    "tags": ["metabolism", "lactose", "population_genetics", "evolution"],
    "visibility": "public"
  }'
```

## Querying Traits

### Example 1: List All Public Traits

```bash
curl "http://localhost:8000/api/traits"
```

### Example 2: Search for Eye-Related Traits

```bash
curl "http://localhost:8000/api/traits?search=eyes&category=physical_traits"
```

### Example 3: Find Verified Dominant Traits

```bash
curl "http://localhost:8000/api/traits?inheritance_pattern=autosomal_dominant&verification_status=verified"
```

### Example 4: Get User's Private Traits

```bash
curl "http://localhost:8000/api/traits?visibility=private" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 5: Search by Gene

```bash
curl "http://localhost:8000/api/traits?gene=MC1R"
```

## Getting a Specific Trait

```bash
curl "http://localhost:8000/api/traits/brown_eyes"
```

For private traits, include authentication:

```bash
curl "http://localhost:8000/api/traits/my_private_trait" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Updating a Trait

### Example 1: Update Trait Name and Add Reference

```bash
curl -X PUT "http://localhost:8000/api/traits/brown_eyes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Brown Eye Color",
    "references": [
      "https://pubmed.ncbi.nlm.nih.gov/example123",
      "https://genetics.edu/brown-eyes-study"
    ]
  }'
```

### Example 2: Change Visibility and Add Tags

```bash
curl -X PUT "http://localhost:8000/api/traits/lactose_tolerance" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "visibility": "public",
    "tags": ["metabolism", "lactose", "population_genetics", "evolution", "dietary_adaptation"]
  }'
```

### Example 3: Update Phenotype Map

```bash
curl -X PUT "http://localhost:8000/api/traits/brown_eyes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phenotype_map": {
      "BB": "Dark brown eyes",
      "Bb": "Medium brown eyes",
      "bb": "Light blue eyes"
    },
    "education_note": "Updated with more detailed phenotype descriptions"
  }'
```

## Deleting a Trait

```bash
curl -X DELETE "http://localhost:8000/api/traits/old_trait" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Note: This performs a soft delete, setting the trait status to "deprecated".

## Advanced Filtering Examples

### Example 1: Complex Query with Multiple Filters

```bash
curl "http://localhost:8000/api/traits?category=physical_traits&inheritance_pattern=autosomal_dominant&verification_status=verified&tags=pigmentation" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 2: Full-Text Search

```bash
curl "http://localhost:8000/api/traits?search=genetic%20disease%20chromosome" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 3: Filter by Status

```bash
curl "http://localhost:8000/api/traits?status=active&visibility=public"
```

## Working with Trait Validation

The API automatically validates trait data:

### Validation Rules

1. **Phenotype Map Coverage**: Must include all possible genotype combinations
2. **Allele Requirements**: At least one allele must be specified
3. **Key Uniqueness**: Trait key must be unique per owner
4. **Genotype Canonicalization**: Genotypes are automatically sorted (e.g., "aA" becomes "Aa")

### Example: Invalid Trait (Missing Genotype)

```bash
# This will fail validation
curl -X POST "http://localhost:8000/api/traits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "key": "invalid_trait",
    "name": "Invalid Trait",
    "alleles": ["A", "a"],
    "phenotype_map": {
      "AA": "Dominant",
      "Aa": "Dominant"
      // Missing "aa" genotype
    }
  }'
```

Response:

```json
{
  "detail": "Validation failed: Missing genotype phenotypes: aa"
}
```

## Error Handling

Common HTTP status codes:

- `200 OK`: Successful request
- `201 Created`: Trait created successfully
- `204 No Content`: Trait deleted successfully
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required or invalid token
- `404 Not Found`: Trait not found or access denied
- `409 Conflict`: Trait key already exists for this owner
- `500 Internal Server Error`: Database or server error

## Best Practices

1. **Use descriptive trait keys**: `red_hair` instead of `trait1`
2. **Include comprehensive phenotype maps**: Cover all possible genotype combinations
3. **Add educational notes**: Help other researchers understand the trait
4. **Use appropriate visibility settings**: Start with "private" for work-in-progress traits
5. **Include references**: Link to scientific papers or educational resources
6. **Use consistent tags**: Facilitate searching and categorization
7. **Update gradually**: Make small, incremental updates rather than large changes
8. **Test with small datasets**: Validate your trait definitions before large-scale use

## Integration with Simulation

Once traits are created, they can be used in Mendelian simulations:

```bash
curl -X POST "http://localhost:8000/api/mendelian/cross" \
  -H "Content-Type: application/json" \
  -d '{
    "traits": ["brown_eyes", "lactose_tolerance"],
    "parent1_genotype": {
      "brown_eyes": "Bb",
      "lactose_tolerance": "Tt"
    },
    "parent2_genotype": {
      "brown_eyes": "bb",
      "lactose_tolerance": "tt"
    },
    "offspring_count": 100
  }'
```

This creates a powerful workflow where you can define custom traits and immediately use them in genetic simulations and educational scenarios.
