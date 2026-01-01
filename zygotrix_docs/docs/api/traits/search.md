---
sidebar_position: 2
---

# Search Traits

Search traits by keyword.

## Endpoint

```
GET /api/traits/search
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `limit` | int | No | Max results (default: 10) |

## Response

```json
{
  "results": [
    {
      "id": "...",
      "name": "Eye Color",
      "type": "simple_dominant",
      "score": 0.95
    }
  ],
  "query": "eye",
  "count": 3
}
```

## Example

```bash
curl "http://localhost:8000/api/traits/search?q=color&limit=5"
```
