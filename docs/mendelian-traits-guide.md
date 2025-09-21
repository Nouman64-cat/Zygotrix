# Mendelian Traits Feature Documentation

## Overview

The Mendelian Traits feature extends Zygotrix with 19 well-studied single-gene traits that follow classic Mendelian inheritance patterns. This implementation provides a foundation for genetic education and demonstrates real-world applications of inheritance principles.

## Features

### 🧬 19 Mendelian Traits

- **Physical Traits**: Eye color, hair color, hair texture, dimples, cleft chin, freckles, earlobes, and more
- **Sensory Traits**: PTC tasting ability
- **Behavioral Traits**: Hand clasping, finger interlocking preferences
- **Medical Conditions**: Albinism, red hair (MC1R gene)

### 🏷️ Rich Metadata System

- **Inheritance Pattern**: Autosomal dominant, recessive, or general autosomal
- **Verification Status**: Verified (scientifically confirmed) vs Simplified (textbook models)
- **Gene Information**: Specific genes where known (MC1R, TAS2R38, etc.)
- **Categories**: Physical, sensory, behavioral, disease traits

### 🔍 Advanced Filtering

- Filter traits by inheritance pattern
- Filter by verification status
- Filter by trait category
- Search by gene information

## Database Schema

### MongoDB Collection: `traits`

```javascript
{
  "_id": ObjectId("..."),
  "key": "red_hair",
  "name": "Red Hair",
  "alleles": ["R", "r"],
  "phenotype_map": {
    "RR": "Non-red",
    "Rr": "Non-red",
    "rr": "Red"
  },
  "description": "Red hair inheritance controlled strictly by MC1R gene",
  "metadata": {
    "source": "Verified single-gene trait",
    "gene_location": "16q24.3"
  },
  "inheritance_pattern": "autosomal_recessive",
  "verification_status": "verified",
  "gene_info": "MC1R",
  "category": "physical_traits"
}
```

### Field Descriptions

| Field                 | Type   | Description                                                                 |
| --------------------- | ------ | --------------------------------------------------------------------------- |
| `key`                 | String | Unique identifier for the trait                                             |
| `name`                | String | Human-readable trait name                                                   |
| `alleles`             | Array  | List of possible alleles (e.g., ["D", "d"])                                 |
| `phenotype_map`       | Object | Maps genotypes to observable phenotypes                                     |
| `description`         | String | Detailed description of the trait                                           |
| `metadata`            | Object | Additional key-value metadata                                               |
| `inheritance_pattern` | String | Pattern of inheritance (autosomal_dominant, autosomal_recessive, autosomal) |
| `verification_status` | String | Scientific verification level (verified, simplified)                        |
| `gene_info`           | String | Associated gene(s) when known                                               |
| `category`            | String | Trait category (physical_traits, sensory_traits, behavioral_traits)         |

## Setup and Installation

### 1. Database Setup

The feature uses your existing MongoDB configuration. No additional setup required.

### 2. Seeding Mendelian Traits

Run the seed script to populate your database with all 19 Mendelian traits:

```bash
cd backend
python seed_mendelian_traits.py
```

This script:

- Inserts all 19 traits with proper metadata
- Creates database indexes for efficient filtering
- Handles existing traits gracefully (upsert behavior)

### 3. Verification

Test the API to confirm traits are loaded:

```bash
curl http://localhost:8000/api/traits
```

You should see 22 total traits (3 original + 19 Mendelian).

## API Reference

### List Traits with Filtering

```http
GET /api/traits?inheritance_pattern=autosomal_dominant&verification_status=verified
```

**Query Parameters:**

- `inheritance_pattern`: Filter by inheritance pattern
  - `autosomal_dominant`
  - `autosomal_recessive`
  - `autosomal`
- `verification_status`: Filter by verification level
  - `verified`: Scientifically confirmed single-gene traits
  - `simplified`: Textbook models (may be more complex in reality)
- `category`: Filter by trait category
  - `physical_traits`
  - `sensory_traits`
  - `behavioral_traits`
- `gene_info`: Filter by specific gene

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

### Create/Update Traits with Metadata

```http
POST /api/traits
```

**Request Body:**

```json
{
  "key": "custom_trait",
  "name": "Custom Trait",
  "alleles": ["A", "a"],
  "phenotype_map": {
    "AA": "Dominant phenotype",
    "Aa": "Dominant phenotype",
    "aa": "Recessive phenotype"
  },
  "description": "A custom trait for testing",
  "inheritance_pattern": "autosomal_dominant",
  "verification_status": "simplified",
  "gene_info": "CUSTOM_GENE",
  "category": "physical_traits"
}
```

### Simulate Mendelian Inheritance

```http
POST /api/mendelian/simulate
```

**Request Body:**

```json
{
  "parent1": { "red_hair": "Rr" },
  "parent2": { "red_hair": "Rr" },
  "traits": ["red_hair"],
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
    }
  },
  "missing_traits": []
}
```

## Frontend Integration

### Enhanced Trait Display

The frontend now displays rich metadata for each trait:

- **Inheritance Pattern**: Visual badges showing dominant/recessive patterns
- **Verification Status**: "Verified" vs "Simplified" indicators
- **Gene Information**: Associated genes when available
- **Categories**: Trait categorization for better organization

### Advanced Filtering

Use the filter controls in the LiveSandbox:

- **Inheritance Pattern**: Filter by dominant, recessive, or general autosomal
- **Verification Status**: Show only verified traits or include simplified models
- **Category**: Browse by physical, sensory, or behavioral traits

### Example Usage

```typescript
// Fetch only verified traits
const verifiedTraits = await fetchTraits(undefined, {
  verification_status: "verified",
});

// Fetch autosomal dominant traits
const dominantTraits = await fetchTraits(undefined, {
  inheritance_pattern: "autosomal_dominant",
});

// Fetch physical traits
const physicalTraits = await fetchTraits(undefined, {
  category: "physical_traits",
});
```

## Educational Applications

### 1. Basic Mendelian Genetics

- Demonstrate dominant vs recessive inheritance
- Show classic 3:1 and 1:1 ratios
- Explore carrier concepts with recessive traits

### 2. Real-World Genetics

- Use verified traits (red hair, PTC tasting) for authentic examples
- Discuss the difference between textbook models and genetic reality
- Explore gene-trait relationships

### 3. Population Genetics

- Calculate allele frequencies
- Explore Hardy-Weinberg equilibrium with trait data
- Discuss genetic diversity in populations

## Trait Categories

### Physical Traits (16 traits)

Observable physical characteristics:

- **Eye color** (simplified model)
- **Hair color** (dark vs light)
- **Hair texture** (curly vs straight)
- **Red hair** (MC1R gene - verified)
- **Albinism** (multiple genes - verified)
- **Freckles**, **Dimples**, **Cleft chin**
- **Forehead shape** (widow's peak)
- **Unibrow**, **Earlobes**, **Darwin's tubercle**
- **Hitchhiker's thumb**, **Mid-digital hair**, **Bent little finger**

### Sensory Traits (1 trait)

- **PTC tasting ability** (TAS2R38 gene)

### Behavioral Traits (2 traits)

- **Hand clasping preference**
- **Finger interlocking habit**

## Verification Levels

### Verified Traits

Scientifically confirmed single-gene traits:

- **Red hair** (MC1R gene)
- **Albinism** (TYR, OCA2 genes)

### Simplified Traits

Traditional textbook models (may involve multiple genes):

- Most physical traits (eye color, dimples, etc.)
- Behavioral traits
- Educational models for learning basic concepts

## Best Practices

### 1. Educational Context

- Always explain the difference between verified and simplified traits
- Discuss the complexity of real genetic inheritance
- Use verified traits for authentic examples

### 2. API Usage

- Use filtering to create focused learning experiences
- Combine multiple filter parameters for specific subsets
- Cache filtered results when appropriate

### 3. Data Integrity

- Validate trait data before simulation
- Handle missing or invalid alleles gracefully
- Provide clear error messages for invalid combinations

## Troubleshooting

### Common Issues

**Problem**: Traits not appearing after seeding
**Solution**:

- Check MongoDB connection
- Verify collection name in environment variables
- Run seed script again (it handles duplicates)

**Problem**: Filter not working in frontend
**Solution**:

- Check API endpoint URL construction
- Verify filter parameters match backend expectations
- Check network requests in browser dev tools

**Problem**: Simulation errors with new traits
**Solution**:

- Verify trait exists in database
- Check allele format (single characters)
- Ensure phenotype_map covers all genotype combinations

### Support

For additional support:

1. Check the `examples/traits_example.json` for usage patterns
2. Review test cases in `backend/tests/test_mendelian_traits.py`
3. Examine the seed script for trait structure examples

## Future Enhancements

Potential additions to the Mendelian traits system:

- **Additional traits**: Expand beyond the current 19 traits
- **Population data**: Add allele frequency information
- **Pedigree analysis**: Family tree simulation capabilities
- **Multiple allele systems**: Support for traits with >2 alleles
- **Gene interaction models**: Epistasis and other complex patterns
