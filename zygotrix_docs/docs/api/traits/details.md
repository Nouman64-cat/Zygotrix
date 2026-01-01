---
sidebar_position: 3
---

# Get Trait Details

Get full details for a specific trait.

## Endpoint

```
GET /api/traits/:id
```

## Response

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Eye Color",
  "type": "simple_dominant",
  "inheritance_pattern": "mendelian",
  "description": "Eye color is determined by the amount of melanin...",
  "alleles": [
    {
      "symbol": "B",
      "name": "Brown",
      "dominant": true,
      "description": "Produces melanin"
    },
    {
      "symbol": "b",
      "name": "Blue",
      "dominant": false,
      "description": "Reduced melanin"
    }
  ],
  "phenotypes": [
    {
      "genotypes": ["BB", "Bb"],
      "name": "Brown eyes",
      "description": "High melanin concentration"
    },
    {
      "genotypes": ["bb"],
      "name": "Blue eyes",
      "description": "Low melanin concentration"
    }
  ],
  "tags": ["human", "eye", "pigmentation"],
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Example

```bash
curl http://localhost:8000/api/traits/507f1f77bcf86cd799439011
```
