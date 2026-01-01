---
sidebar_position: 1
---

# List Traits

Get all traits from the database.

## Endpoint

```
GET /api/traits
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `page_size` | int | 20 | Items per page |
| `type` | string | - | Filter by type |

## Response

```json
{
  "traits": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Eye Color",
      "type": "simple_dominant",
      "inheritance_pattern": "mendelian",
      "description": "...",
      "alleles": [
        {"symbol": "B", "name": "Brown", "dominant": true},
        {"symbol": "b", "name": "Blue", "dominant": false}
      ]
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

## Example

```bash
curl http://localhost:8000/api/traits?type=simple_dominant
```
