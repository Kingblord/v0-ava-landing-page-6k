# WhatsApp AI Integration Guide

## Overview

The WhatsApp gateway now fully integrates with the backend to generate AI responses to customer messages using the business's configured AI personality and model.

## Architecture Flow

```
WhatsApp Customer -> WhatsApp Gateway -> /api/internal/receive-message
                                           ↓
                                    Save incoming message (Admin SDK)
                                    Get business data
                                           ↓
                                    /api/whatsapp/generate-response
                                    (Call AI with personality)
                                           ↓
                                    Save AI response (Admin SDK)
                                           ↓
                                    Gateway sends response back to customer
```

## Key Components

### 1. WhatsApp Gateway (`whatsapp-gateway/create-session.ts`)
- Listens for incoming WhatsApp messages
- Posts to `/api/internal/receive-message` with authentication
- Receives AI response from backend
- Sends AI-generated response back to customer via WhatsApp

### 2. Message Receiver API (`/api/internal/receive-message`)
- **Auth**: Validates `INTERNAL_API_KEY` via Bearer token
- **Input**: `{ userId, from, text, platform, messageId, timestamp }`
- **Process**:
  1. Saves incoming message to Firestore via Admin SDK
  2. Fetches business data (name, aiPersonality, aiModel)
  3. Calls `/api/whatsapp/generate-response` for AI generation
  4. Saves AI response to Firestore
- **Output**: AI response with customer phone number for gateway

### 3. AI Response Generator (`/api/whatsapp/generate-response`)
- **Input**: `{ userId, businessName, aiPersonality, customerMessage, aiModel }`
- **Process**:
  1. Creates system prompt with business personality
  2. Calls AI (via AI SDK with configured model)
  3. Returns AI-generated response text
- **Model**: Uses business's configured model (default: `gpt-4o-mini`)

## Required Environment Variables

```env
# Backend
BACKEND_URL=http://localhost:3001              # WhatsApp Gateway URL
INTERNAL_API_KEY=your-secret-api-key           # Shared secret for gateway-backend auth
NEXT_PUBLIC_API_URL=http://localhost:3000      # Frontend API base URL

# AI
OPENAI_API_KEY=sk-...                          # OpenAI API key (or other provider)
```

## Message Flow Example

1. **Customer sends message**: "Do you have product X in stock?"
2. **Gateway receives** and posts to backend with user's business ID
3. **Backend**:
   - Saves message as "user" role
   - Retrieves business: `{ name: "Acme Shop", aiPersonality: "Friendly sales agent", aiModel: "gpt-4o-mini" }`
   - Calls AI with personality: "You are Acme Shop's friendly sales agent. Help customers..."
   - AI generates: "Yes! We have Product X in stock and it's currently 20% off!"
   - Saves response as "assistant" role
4. **Gateway sends back** via WhatsApp
5. **All messages stored** in Firestore for conversation history

## Dashboard Integration

Users can:
- View conversation history in WhatsApp page
- Edit AI personality in settings
- Select different AI models
- All changes automatically reflected in next customer conversation

## Error Handling

- **No business found**: Returns 404 (check user ID)
- **AI service error**: Falls back to default message "temporarily unavailable"
- **Gateway timeout**: Message still saved, can retry response generation
- **Invalid auth**: Returns 401 (check INTERNAL_API_KEY)

## Testing

```bash
# Test the message receiver (requires INTERNAL_API_KEY)
curl -X POST http://localhost:3000/api/internal/receive-message \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "from": "1234567890@s.whatsapp.net",
    "text": "Hello, do you have...?",
    "platform": "whatsapp",
    "messageId": "msg_123",
    "timestamp": 1234567890
  }'
```

## Monitoring

Check logs for:
- `[v0] Received WhatsApp message:` - Incoming message logged
- `[v0] Generating AI response for:` - AI generation started
- `[v0] AI response generated successfully` - AI returned response
- `[v0] Error` - Any errors in process

All messages and responses stored in Firestore under `businesses/{userId}/whatsapp_messages`
