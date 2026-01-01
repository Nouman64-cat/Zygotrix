---
sidebar_position: 1
---

# Conversations

Manage AI chatbot conversations.

## List Conversations

```
GET /api/zygotrix-ai/conversations
```

### Response

```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Punnett Square Help",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:30:00Z",
      "message_count": 5
    }
  ],
  "total": 10
}
```

## Get Conversation

```
GET /api/zygotrix-ai/conversations/:id
```

### Response

```json
{
  "id": "uuid",
  "title": "Punnett Square Help",
  "messages": [
    {
      "id": "msg-uuid",
      "role": "user",
      "content": "What is a Punnett square?",
      "timestamp": "2024-01-01T12:00:00Z"
    },
    {
      "id": "msg-uuid-2",
      "role": "assistant",
      "content": "A Punnett square is...",
      "timestamp": "2024-01-01T12:00:05Z",
      "tools_used": []
    }
  ]
}
```

## Delete Conversation

```
DELETE /api/zygotrix-ai/conversations/:id
```

### Response

```json
{
  "message": "Conversation deleted"
}
```
