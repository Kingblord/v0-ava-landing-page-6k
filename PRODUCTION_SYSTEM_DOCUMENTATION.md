# Production System Documentation

## Complete System Architecture

This document describes the production-grade Firebase Admin SDK integration, real-time data synchronization, and WhatsApp AI response system.

---

## Firebase Admin SDK Integration

### Server-Side Operations (Admin SDK)

All write operations use Firebase Admin SDK for guaranteed reliability and full permissions.

**Location**: `lib/firestore-server.ts`

#### Business Documents
- `createBusinessDoc(uid, data)` - Creates business document during registration
- `updateBusinessDoc(uid, data)` - Updates business settings (name, email, AI personality, etc.)
- `getBusinessDoc(uid)` - Fetches business document server-side

#### Products
- `getProductsServer(businessId)` - Fetches all products for a business
- `createProductServer(businessId, data)` - Creates new product
- `updateProductServer(businessId, productId, data)` - Updates product
- `deleteProductServer(businessId, productId)` - Deletes product

#### Orders
- `getOrdersServer(businessId)` - Fetches all orders (sorted in-memory to avoid composite index)
- `createOrderServer(data)` - Creates new order
- `updateOrderStatusServer(orderId, status)` - Updates order status

#### Messages
- `saveMessageDoc(uid, message)` - Saves WhatsApp messages
- `getMessagesForContact(uid, contactJid, limit)` - Retrieves message history

#### Contacts
- `createContactDoc(uid, contact)` - Creates contact entry
- `getContactsForBusiness(uid)` - Lists all contacts
- `updateContactDoc(uid, contactId, data)` - Updates contact info
- `deleteContactDoc(uid, contactId)` - Removes contact

---

## Real-Time Data Synchronization

### Client-Side Snapshots

**Location**: `lib/firebase-auth.ts`

#### Business Data Listener
```typescript
onBusinessChange(uid, callback)
```
- Sets up real-time Firestore `onSnapshot` listener
- Automatically updates when business document changes
- Used by `AuthProvider` to sync data across all pages

### Auth Context with Fallback Polling

**Location**: `lib/auth-context.tsx`

The auth context provides real-time business data with automatic fallback:

1. **Primary**: `onSnapshot` listener for instant updates
2. **Fallback**: Polls `/api/user/profile` every 500ms for up to 5 seconds if data hasn't loaded
3. **Result**: Guaranteed data display within 5 seconds, typically instant

---

## API Endpoints (Server-Side Admin SDK)

### User Profile Management

**Endpoint**: `POST /api/user/profile`
- Updates business document via Admin SDK
- Returns updated data
- Verifies write succeeded before responding

**Endpoint**: `GET /api/user/profile?uid=xxx`
- Fetches business document via Admin SDK
- Used by fallback polling mechanism

### Business Registration

**Endpoint**: `POST /api/auth/create-business`
- Creates business document during signup
- Validates all fields (uid, email, businessName)
- Verifies document was written with retry logic
- Returns confirmation

### Orders Management

**Endpoint**: `GET /api/orders?userId=xxx`
- Fetches orders via `getOrdersServer()`
- Returns sorted order list

**Endpoint**: `PUT /api/orders`
- Updates order status via `updateOrderStatusServer()`
- Body: `{ orderId, status }`

### Products Management

**Endpoint**: `GET /api/products?userId=xxx`
- Fetches products via `getProductsServer()`

**Endpoint**: `POST /api/products`
- Creates product via `createProductServer()`

**Endpoint**: `PUT /api/products`
- Updates product via `updateProductServer()`

**Endpoint**: `DELETE /api/products`
- Deletes product via `deleteProductServer()`

---

## WhatsApp AI Integration

### Complete Message Flow

```
Customer sends WhatsApp message
  ↓
WhatsApp Gateway receives message
  ↓
Gateway POST /api/internal/receive-message
  ↓
Backend saves message via saveMessageDoc()
  ↓
Backend fetches business data via getBusinessDoc()
  ↓
Backend POST /api/whatsapp/generate-response
  ↓
AI SDK generates response using business personality
  ↓
Backend saves AI response via saveMessageDoc()
  ↓
Backend returns AI response to gateway
  ↓
Gateway sends response back to customer
  ↓
Customer receives AI response
```

### Message Receipt Endpoint

**Endpoint**: `POST /api/internal/receive-message`
**Auth**: Requires `INTERNAL_API_KEY` bearer token

**Request Body**:
```json
{
  "userId": "business-uid",
  "from": "customer-phone-number",
  "text": "customer message",
  "platform": "whatsapp",
  "messageId": "unique-message-id",
  "timestamp": 1234567890
}
```

**Response**:
```json
{
  "success": true,
  "incomingMessage": { "id": "msg-id", ... },
  "aiResponse": {
    "to": "customer-phone-number",
    "text": "AI generated response",
    "platform": "whatsapp"
  }
}
```

**Process**:
1. Validates authorization token
2. Saves incoming message to Firestore via Admin SDK
3. Fetches business settings (name, AI personality, model)
4. Calls AI generation endpoint
5. Saves AI response to Firestore
6. Returns response for gateway to send

### AI Response Generation

**Endpoint**: `POST /api/whatsapp/generate-response`

**Request Body**:
```json
{
  "userId": "business-uid",
  "businessName": "Business Name",
  "aiPersonality": "You are a friendly sales agent...",
  "customerMessage": "Hi, I need help",
  "aiModel": "openai/gpt-4o-mini"
}
```

**Response**:
```json
{
  "success": true,
  "response": "AI generated message text"
}
```

**Features**:
- Uses Vercel AI SDK with AI Gateway
- Respects business's configured model (OpenAI, Anthropic, etc.)
- Applies business's AI personality to system prompt
- Has graceful fallback if AI service fails
- Production-grade error handling

### WhatsApp Gateway Integration

**Location**: `whatsapp-gateway/create-session.ts`

**Message Handler**:
- Listens for incoming WhatsApp messages via Baileys
- Sends messages to backend `/api/internal/receive-message`
- Receives AI response from backend
- Sends AI response back to customer via WhatsApp

**Key Features**:
- Automatic AI response sending
- Session management per business
- QR code generation for connection
- Health check endpoint

---

## Environment Variables Required

### Firebase Admin SDK
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Internal API Security
```
INTERNAL_API_KEY=secure-random-key-here
```

### Application URL
```
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

---

## Data Flow Examples

### User Registration
1. User fills signup form → `signUp()` called
2. Firebase Auth creates user → UID generated
3. Call `POST /api/auth/create-business` with UID
4. Admin SDK creates business document
5. Verify document exists with retries
6. Redirect to dashboard
7. Auth context sets up snapshot listener
8. Business data appears instantly (or within 5s via fallback)

### Profile Update
1. User edits profile → `updateBusiness()` called
2. `POST /api/user/profile` with changes
3. Admin SDK writes to Firestore
4. 100ms delay for propagation
5. Snapshot listener fires automatically
6. All pages showing business data update instantly

### WhatsApp Customer Message
1. Customer: "Hi, what products do you have?"
2. Gateway receives via Baileys
3. Gateway POST to `/api/internal/receive-message`
4. Backend saves message (Admin SDK)
5. Backend fetches business personality
6. Backend generates AI response
7. Backend saves AI response
8. Gateway receives response
9. Gateway sends to customer
10. Customer: "We have three amazing products..."

---

## Production Features

### Reliability
- All writes use Admin SDK with full permissions
- Retry logic for document verification
- Fallback polling if snapshots delayed
- Graceful AI fallback messages
- Comprehensive error logging

### Security
- Server-side operations only for writes
- API key authentication for internal endpoints
- Environment variable validation
- No client-side write access

### Performance
- In-memory sorting to avoid composite indexes
- Snapshot listeners for instant updates
- Minimal API calls with efficient caching
- Optimized query patterns

### Error Handling
- Try-catch on all async operations
- Detailed console logging with [v0] prefix
- User-friendly error messages
- Automatic recovery mechanisms

---

## Testing the System

### 1. Test Registration
- Sign up new user → Check Firestore for business document
- Dashboard should show business name immediately

### 2. Test Profile Update
- Change business name → Save
- Verify all pages update instantly
- Check Firestore document updated

### 3. Test WhatsApp Flow
- Connect WhatsApp via QR code
- Send message from customer phone
- Verify message saved in Firestore
- Verify AI response received by customer
- Check message history in dashboard

### 4. Test Real-Time Sync
- Open dashboard in two browser tabs
- Update profile in tab 1
- Verify tab 2 updates automatically

---

## Troubleshooting

### Business data not appearing
- Check fallback polling logs in console
- Verify `/api/user/profile` endpoint works
- Check Firebase Admin SDK credentials
- Ensure onSnapshot listener set up

### WhatsApp messages not saving
- Check `INTERNAL_API_KEY` matches in gateway and backend
- Verify `/api/internal/receive-message` endpoint accessible
- Check Admin SDK permissions
- Review message receipt logs

### AI responses not sending
- Verify AI SDK configuration
- Check `/api/whatsapp/generate-response` logs
- Ensure model string is valid
- Review AI Gateway setup

---

## System Health Check

**Endpoint**: `GET /api/system/health`

Returns status of all critical components:
- Admin SDK initialization
- Firestore connectivity
- Auth service status
- Environment variables presence

Use this endpoint to verify system health before deployment.
