---
sidebar_position: 2
---

# Messages

Send messages to the AI chatbot.

## Send Message

```
POST /api/zygotrix-ai/chat
```

### Request Body

```json
{
  "message": "What are the offspring of Aa × Aa?",
  "conversation_id": "uuid"  // Optional, creates new if omitted
}
```

### Response

```json
{
  "response": "When crossing Aa × Aa, the offspring...",
  "conversation_id": "uuid",
  "message_id": "msg-uuid",
  "tools_used": ["calculate_punnett_square"],
  "tokens_used": 150
}
```

## Streaming Response

```
POST /api/zygotrix-ai/chat/stream
```

Returns Server-Sent Events (SSE) for real-time streaming.

```javascript
const eventSource = new EventSource('/api/zygotrix-ai/chat/stream?message=...');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.chunk);
};
```

## Rate Limits

Check current usage:

```
GET /api/zygotrix-ai/rate-limit
```

```json
{
  "tokens_used": 5000,
  "tokens_limit": 50000,
  "requests_used": 10,
  "requests_limit": 100,
  "resets_at": "2024-01-02T00:00:00Z"
}
```
