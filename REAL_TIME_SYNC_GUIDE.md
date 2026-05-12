# Real-Time Business Data Synchronization Guide

## Overview
All dashboard pages now correctly display user data from the Firestore database with real-time synchronization.

## How It Works

### 1. Data Flow Architecture
```
User Updates (Settings/Profile)
    ↓
API Endpoint (/api/user/profile)
    ↓
Firebase Admin SDK (Server-side write)
    ↓
Firestore Database
    ↓
Real-time Listener (onSnapshot)
    ↓
Auth Context (React State)
    ↓
Dashboard/Pages Display Updated Data
```

### 2. Real-Time Listeners

**Auth Context** (`lib/auth-context.tsx`):
- Sets up `onBusinessChange()` listener when user authenticates
- Listener subscribes to `businesses/{uid}` document in Firestore
- Updates React state whenever business data changes

**Firebase Auth** (`lib/firebase-auth.ts`):
- `onBusinessChange()` - Real-time listener for business document
- `onSnapshot()` - Firestore real-time listener that triggers on any change
- Error handler to log connection issues

### 3. Server-Side Writes

**Admin SDK** (`lib/firebase-admin.ts`):
- Initializes Firebase Admin with service account credentials
- Provides `adminDb` - Admin database instance with full write privileges
- Never fails due to security rules

**API Endpoint** (`/api/user/profile`):
- POST: Updates business data via Admin SDK
- Returns updated profile immediately after write
- Includes error handling and logging

**Firestore Server Functions** (`lib/firestore-server.ts`):
- `updateBusinessDoc()` - Updates business profile
- `getBusinessDoc()` - Fetches current business data
- All operations logged for debugging

### 4. Pages That Display Business Data

1. **Dashboard** (`/app/dashboard/page.tsx`)
   - Shows: Business name, products, orders
   - Updates: Real-time from `business` prop in auth context

2. **Profile** (`/app/dashboard/profile/page.tsx`)
   - Shows: Business name, avatar
   - Edit: Updates name and avatar via updateBusiness()
   - Sync: Automatic after save due to listener

3. **Settings** (`/app/dashboard/settings/page.tsx`)
   - Shows: Business name, AI personality, WhatsApp phone, avatar
   - Edit: All tabs update via updateBusiness()
   - Sync: Fields auto-populate from business context

4. **Products** (`/app/dashboard/products/page.tsx`)
   - Shows: User's products via /api/products
   - Uses business context for business-specific data

## Data Sync Flow Example: Updating Business Name

1. **User Action**
   - Types new name in Settings → Profile tab
   - Clicks "Save Changes"

2. **Save Handler**
   ```js
   await updateBusiness(user.uid, { name: 'New Name' })
   ```

3. **API Call**
   - POST `/api/user/profile`
   - Body: `{ uid, name: 'New Name' }`

4. **Server Processing**
   - Validates uid and data
   - Calls `updateBusinessDoc()` via Admin SDK
   - Returns updated profile: `{ id, name: 'New Name', ...rest }`

5. **Firestore Write**
   - Admin SDK writes to `businesses/{uid}` document
   - No security rules blocking (Admin SDK has full access)

6. **Real-Time Sync**
   - `onSnapshot` listener fires
   - Auth context receives updated business object
   - React state updates: `setBusiness(updatedData)`

7. **UI Update**
   - Dashboard header re-renders with new business name
   - Profile page shows new name immediately
   - All pages using `business` context update

## Console Logs to Watch For

When updating business data, check console for:

```
[v0] Updating business profile via API: <uid> {name: 'New Name'}
[v0] Business profile updated successfully: {success: true, profile: {...}}
[v0] Setting up real-time listener for business: <uid>
[v0] Business snapshot received: true {name: 'New Name', ...}
[v0] Business data updated in auth context: {name: 'New Name', ...}
```

## Troubleshooting

### Business Name Not Displaying
1. Check Auth Context is initialized
2. Verify `business` prop is being passed to components
3. Check console for listener errors
4. Refresh page to force re-initialize

### Updates Not Syncing
1. Check `/api/user/profile` response in Network tab
2. Verify Firestore rules allow writes
3. Check `onSnapshot` listener errors in console
4. Ensure user.uid is correct

### Blank Values After Save
1. May be timing issue - page might refresh listener
2. Check if `getBusinessDoc()` returns correct data
3. Verify Firestore document structure matches Business type
4. Look for 404 or 500 errors in Network tab

## Environment Setup

Required environment variables (already set):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

These enable Admin SDK for server-side writes.

## Best Practices

1. **Always use `useAuth()` context** for business data
2. **Call updateBusiness() through API** - never direct Firestore writes from client
3. **Check console logs** when debugging sync issues
4. **Wait for listener to fire** - use 100ms delay after API calls if needed
5. **Validate data server-side** before writing to Firestore
