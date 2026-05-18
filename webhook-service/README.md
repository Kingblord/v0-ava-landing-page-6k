# AroMsg AI Webhook Service

Standalone Node.js service that handles WhatsApp webhook events, generates AI responses using OpenRouter, and persists conversations to Firestore.

## Features

- **Webhook Processing**: Receives messages from WhatsApp gateway
- **AI Response Generation**: Calls OpenRouter API for intelligent responses
- **Product Context**: Loads business products and includes them in AI system prompt
- **Negotiation Support**: Recognizes product negotiation settings
- **Firestore Persistence**: Saves all messages and AI responses to Firestore
- **Business Linking**: Finds the correct business/user for each customer
- **Gateway Integration**: Sends replies back through the gateway
- **Health Checks**: Comprehensive health monitoring endpoint

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Required Variables

- `INTERNAL_API_KEY`: Used for webhook authentication
- `OPENROUTER_API_KEY`: Your OpenRouter API key (get from https://openrouter.ai)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Your Firebase private key (from service account JSON)
- `FIREBASE_CLIENT_EMAIL`: Your Firebase client email (from service account JSON)
- `GATEWAY_URL`: URL of your WhatsApp gateway (default: http://localhost:3001)
- `OPENROUTER_MODEL`: Model to use (default: openrouter/free)
- `PORT`: Server port (default: 3000)

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Settings → Service Accounts
4. Click "Generate New Private Key"
5. Copy the JSON file and extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

**Important**: When setting `FIREBASE_PRIVATE_KEY` in your `.env`, escape the newlines properly or use the JSON directly.

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### POST /webhook
Receives webhook from WhatsApp gateway

**Headers:**
```
Authorization: Bearer {INTERNAL_API_KEY}
Content-Type: application/json
```

**Payload:**
```json
{
  "userId": "business_id",
  "from": "1234567890@s.whatsapp.net",
  "text": "Customer message",
  "platform": "whatsapp",
  "messageId": "msg_123",
  "timestamp": 1234567890000
}
```

**Response:**
```json
{
  "success": true,
  "aiReply": "AI generated response",
  "messagesSaved": true,
  "gatewaySent": true
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-18T15:30:00.000Z",
  "checks": {
    "api_key": true,
    "openrouter_key": true,
    "firebase": true,
    "gateway": true
  }
}
```

## Firestore Structure

Messages are saved to:
```
businesses/{businessId}/whatsapp_messages/{messageId}
```

Each message document contains:
- `contactJid`: Normalized phone number
- `from`: Sender (phone number or businessId)
- `to`: Recipient
- `text`: Message content
- `role`: "user" or "assistant"
- `messageId`: Unique message ID
- `timestamp`: Message timestamp
- `direction`: "incoming" or "outgoing"

## Console Logging

All operations are logged with prefixes:
- `[WEBHOOK]` - Main webhook flow
- `[AUTH]` - Authentication checks
- `[DB]` - Database operations
- `[AI]` - AI generation
- `[GATEWAY]` - Gateway communication
- `[HEALTH]` - Health checks

## Deployment

This service can be deployed to:
- Railway.app
- Heroku
- Render
- AWS Lambda
- Google Cloud Run

Ensure all environment variables are set in your deployment platform.

## License

MIT
