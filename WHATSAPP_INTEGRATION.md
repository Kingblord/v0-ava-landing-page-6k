# WhatsApp Integration with aromsg Gateway

This system integrates with the deployed aromsg gateway at `https://aromsg.render.com` to receive and process WhatsApp messages in real-time through AI.

## Architecture

```
WhatsApp User
    ↓ (sends message)
aromsg Gateway (aromsg.render.com)
    ↓ (forwards to webhook)
Your System Webhook (/api/whatsapp/webhook)
    ↓ (processes through AI)
AI System (runAI)
    ↓ (generates response)
Your System Response
    ↓ (sends back to gateway)
aromsg Gateway
    ↓ (sends to WhatsApp)
WhatsApp User (receives response)
```

## Setup Steps

### 1. Configure aromsg Gateway

1. Go to `https://aromsg.render.com`
2. Log in or create an account
3. Create a new session and connect your WhatsApp account via QR code
4. In the gateway settings, find "Webhook Configuration" or "Message Forwarding"
5. Add your webhook URL: `https://your-domain.com/api/whatsapp/webhook`
6. Set the method to `POST`
7. Make sure the gateway is enabled and active

### 2. Environment Variables

Add these to your Vercel project settings:

```
WHATSAPP_GATEWAY_URL=http://localhost:3001    # For local development
WHATSAPP_GATEWAY_URL=https://aromsg.render.com # For production
```

The webhook endpoint will use this URL to send responses back to the gateway.

### 3. Add Products

Before testing, add at least one product in the Products section of your dashboard. The AI uses these products to make recommendations and handle orders.

## How Messages Flow

### Incoming Message
1. User sends message on WhatsApp
2. aromsg gateway receives it
3. Gateway makes a `POST` request to your webhook with:
   ```json
   {
     "userId": "business-user-id",
     "from": "+1234567890",
     "text": "Hello, I want to buy something",
     "messageId": "msg-123",
     "timestamp": 1234567890
   }
   ```

### Processing
1. Your webhook (`/api/whatsapp/webhook`) receives the message
2. Extracts business config from `userId`
3. Loads conversation history
4. Calls `runAI()` to generate response
5. Stores conversation in Firestore
6. Creates order if order intent detected

### Outgoing Response
1. Webhook calls aromsg gateway's `/send-message` endpoint
2. Sends response text back to the user's WhatsApp number
3. Gateway delivers message via WhatsApp API

## Webhook Payload Format

**Request (from aromsg gateway):**
```json
POST /api/whatsapp/webhook
{
  "userId": "uid-of-business-owner",
  "from": "+1234567890",
  "text": "What products do you have?",
  "messageId": "msg-id-123",
  "timestamp": 1609459200000
}
```

**Response (from your system):**
```json
{
  "success": true
}
```

The AI response is sent back to the gateway via a separate `POST` to `WHATSAPP_GATEWAY_URL/send-message`.

## Testing

### Local Testing
1. Make sure your app is running on `localhost:3000`
2. Use a tunneling service like `ngrok` to expose your local webhook:
   ```bash
   ngrok http 3000
   ```
3. Get the public URL from ngrok (e.g., `https://abc123.ngrok.io`)
4. Configure this URL in the aromsg gateway webhook settings
5. Send a WhatsApp message and verify response

### Production Testing
1. Deploy to Vercel
2. Configure webhook URL as `https://your-vercel-domain.com/api/whatsapp/webhook`
3. Make sure `WHATSAPP_GATEWAY_URL` is set to `https://aromsg.render.com`
4. Send a test message via WhatsApp

## Debugging

Check server logs for webhook activity:
```
[WhatsApp Webhook] Message from +1234567890: Hello
[WhatsApp Webhook] Response sent to +1234567890
```

## Error Handling

The webhook handles errors gracefully:
- Missing business config → logs error, responds 200 OK
- AI processing error → sends apology message to user
- Gateway communication error → logs but still returns 200 OK

## Conversation Persistence

All conversations are stored in Firestore:
- Collection: `conversations/{businessId}/{userId}`
- Includes message history, conversation state, and detected order intents
- Last 40 messages are kept for context

## Order Processing

When the AI detects an order intent:
1. Order is created in Firestore with status `pending`
2. Contains product ID, name, and amount
3. Business can view and manage orders in the dashboard

## Rate Limiting

No built-in rate limiting in the webhook. If needed, add middleware to limit requests per user/number.
