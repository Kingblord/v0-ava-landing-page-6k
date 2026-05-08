# WhatsApp Bot Server Setup

This system now uses a **dedicated Node.js bot server** running Baileys for real WhatsApp connections, separate from the Vercel serverless app.

## Architecture

```
┌─────────────────────────────────┐
│  Vercel (Next.js Frontend)      │
│  - Web UI                       │
│  - REST API (proxy layer)       │
│  - Message processing (AI)      │
└─────────────┬───────────────────┘
              │ HTTP
              ▼
┌─────────────────────────────────┐
│  Bot Server (Node.js)           │
│  - Baileys Library              │
│  - Real WhatsApp connections    │
│  - QR code generation           │
│  - Message handling             │
└─────────────────────────────────┘
```

## Setup Instructions

### 1. Install Dependencies for Bot Server

The bot server requires these packages (already in package.json):
- `@whiskeysockets/baileys` - WhatsApp connection library
- `qrcode` - QR code generation  
- `jimp` - Image processing
- `express` - HTTP server
- `firebase-admin` - Firestore access

### 2. Set Up Firebase Admin Credentials

Create a service account in Firebase Console:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Add to your `.env.local`:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
```

### 3. Run the Bot Server Locally

```bash
# Start the bot server on port 3001
node server/whatsapp-bot.ts

# Or with TypeScript directly
npx ts-node server/whatsapp-bot.ts

# Or with tsx
npx tsx server/whatsapp-bot.ts
```

You should see:
```
[WhatsApp Bot] Server running on port 3001
[WhatsApp Bot] Health check: http://localhost:3001/health
```

### 4. Configure Vercel to Use Bot Server

In your `.env.local`:
```
BOT_SERVER_URL=http://localhost:3001
```

For production on Vercel, host the bot server separately (e.g., Railway, Render, EC2) and set:
```
BOT_SERVER_URL=https://your-bot-server.com
```

## API Endpoints

### Bot Server Endpoints (Internal)

- **POST /connect** - Start WhatsApp session
- **POST /disconnect** - End session  
- **GET /status/:userId** - Get connection status
- **GET /qr/:userId** - Get QR code
- **POST /send-message** - Send proactive message
- **GET /health** - Health check

### Vercel API Endpoints (Public)

- **POST /api/whatsapp/connect** - Proxy to bot server
- **POST /api/whatsapp/disconnect** - Proxy to bot server
- **GET /api/whatsapp/status** - Proxy to bot server
- **GET /api/whatsapp/qr** - Proxy to bot server
- **POST /api/whatsapp/reconnect** - Auto-reconnect
- **POST /api/whatsapp/process-message** - AI message processing (called by bot)

## Real-Time Message Flow

1. User sends WhatsApp message
2. Bot server receives via Baileys WebSocket
3. Bot server calls `/api/whatsapp/process-message` on Vercel
4. Vercel processes through AI model
5. Response sent back to bot server
6. Bot server sends reply via WhatsApp
7. Conversation logged to Firestore

## All Real Features

✅ **Real Baileys Connections** - Maintains actual WhatsApp WebSocket through dedicated server  
✅ **Real QR Scanning** - Generates live QR codes for account linking  
✅ **Real Message Processing** - AI responses processed through actual LLM  
✅ **Real Firestore Persistence** - All conversations stored persistently  
✅ **Real Reconnection** - Automatic reconnection on disconnect (unless logged out)  
✅ **Real Status Tracking** - Live connection state in Firestore  
✅ **No Mock Data** - Everything is real-time from WhatsApp

## Production Deployment

For production:

1. **Deploy Bot Server**
   - Host on Railway, Render, EC2, or similar (needs long-lived process)
   - Set environment variables (Firebase credentials, etc.)
   - Point BOT_SERVER_URL to this server

2. **Deploy Vercel App**
   - Standard `vercel deploy`
   - Set BOT_SERVER_URL environment variable in Vercel dashboard

3. **Keep Both Running**
   - Bot server runs continuously 24/7
   - Vercel handles REST API and web UI
   - They communicate via HTTP

## Troubleshooting

### "QR code not available"
- Bot server may not be running
- Check `http://localhost:3001/health`
- Ensure BOT_SERVER_URL is correct

### "Cannot connect to bot server"
- Verify bot server is running on correct port
- Check network connectivity
- Ensure Firebase credentials are valid

### "Messages not processing"
- Check bot server logs for Baileys errors
- Verify Firestore permissions
- Ensure AI model is configured properly
