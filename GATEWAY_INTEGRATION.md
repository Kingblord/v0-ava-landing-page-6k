# WhatsApp Gateway Integration Guide

## Backend Setup Complete ✅

Your Next.js backend now has all required endpoints:

### API Endpoints Ready
- `POST /api/internal/receive-message` — Receives messages from gateway (requires INTERNAL_API_KEY)
- `POST /api/whatsapp/send-message` — Sends messages and logs to Firestore
- `GET/POST /api/whatsapp/contacts` — Sync contacts with Firestore
- `GET /api/whatsapp/messages` — Retrieve chat history
- `GET /api/whatsapp/session-status` — Check connection status
- `POST /api/whatsapp/initiate` — Start WhatsApp connection
- `GET /api/whatsapp/get-qr` — Get QR code for scanning

## Gateway Configuration Required

Your gateway must be updated to send messages to your backend. Add this to your gateway's `/receive-message` or webhook handler:

### Example Gateway Update (Node.js):

```typescript
// In your gateway's message handler
async function handleIncomingMessage(userId: string, from: string, text: string, messageId: string) {
  try {
    const response = await fetch('https://your-app.vercel.app/api/internal/receive-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
      },
      body: JSON.stringify({
        userId,
        from,
        text,
        platform: 'whatsapp',
        messageId,
        timestamp: Date.now(),
      }),
    })

    const result = await response.json()
    console.log('[gateway] Message stored:', result)
  } catch (error) {
    console.error('[gateway] Error sending to backend:', error)
  }
}
```

### Environment Variables

Your gateway needs:
```
INTERNAL_API_KEY=<your-key-from-vercel>
NEXT_APP_URL=https://your-app.vercel.app
```

Your Next.js app has:
```
INTERNAL_API_KEY=<same-key>
NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
... (other Firebase env vars)
```

## Data Flow

1. **User connects WhatsApp** → QR scan via gateway → stores session state
2. **Incoming message** → Gateway receives via Baileys → Posts to `/api/internal/receive-message`
3. **Backend validates INTERNAL_API_KEY** → Stores message in Firestore
4. **Frontend polls contacts** → Loads chat list from Firestore
5. **User clicks contact** → Loads messages from `/api/whatsapp/messages`
6. **User sends message** → Frontend calls `/api/whatsapp/send-message` → Gateway delivers via WhatsApp

## Firestore Collections

```
businesses/{businessId}/
  ├── contacts/
  │   └── {contactId}
  │       ├── name, phone, jid
  │       ├── aiEnabled, aiPersonality, aiModel
  │       └── lastMessage, lastTs, unread
  │
  └── whatsapp_messages/
      └── {messageId}
          ├── from, text, role (user|assistant)
          ├── messageId, timestamp, platform
```

## Testing the Integration

1. Connect WhatsApp via the dashboard
2. Have someone send you a message on WhatsApp
3. Check Firestore console:
   - Should see message in `businesses/{uid}/whatsapp_messages`
   - Contact should appear in `businesses/{uid}/contacts`
4. Message should appear in the chat UI automatically
5. Send a reply from the dashboard
6. Check WhatsApp — message should arrive

## Troubleshooting

**Messages not appearing:**
- Check gateway logs for errors posting to `/api/internal/receive-message`
- Verify `INTERNAL_API_KEY` matches on both gateway and Vercel
- Check Firestore auth rules allow writes to `whatsapp_messages`

**Connection not persisting after logout:**
- Ensure `whatsappConnected=true` saved to Firestore
- On login, app checks `/api/whatsapp/session-status` to restore

**Contacts not loading:**
- Check `/api/whatsapp/contacts` returns data from Firestore
- Verify gateway is sending contact list on connection
