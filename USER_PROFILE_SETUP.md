# User Profile & Settings System - Complete Setup

## Overview
User profiles and settings now use **Firebase Admin SDK** for all server-side data writes, ensuring reliable persistence and real-time sync across all devices.

## Architecture

### API Endpoints

#### `/api/user/profile` (GET/POST)
- **GET** - Fetch user's business profile (name, avatar, AI settings, etc.)
  - Query: `?uid={userId}`
  - Returns: `{ profile: Business }`
  - Uses Admin SDK for server-side reads

- **POST** - Update user profile fields via Admin SDK
  - Body: `{ uid, name?, avatarUrl?, aiPersonality?, openrouterModel?, whatsappPhone? }`
  - Returns: `{ profile: Business }` (updated)
  - **All writes go through Admin SDK** - guarantees persistence

### Client Functions

#### `updateBusiness(uid, data)` (`lib/firebase-auth.ts`)
- Calls `/api/user/profile` endpoint
- Supports all Business fields (except `id`, `email`, `createdAt`)
- Automatically sets `updatedAt` timestamp
- Throws errors with descriptive messages
- Real-time listeners update UI automatically

#### `getBusiness(uid)` (`lib/firebase-auth.ts`)
- Calls `/api/user/profile?uid=...` endpoint
- Returns cached Business data
- Falls back gracefully if unavailable

#### `onBusinessChange(uid, callback)` (`lib/firebase-auth.ts`)
- Real-time Firestore listener
- Triggers callback when ANY field changes
- Used by `useAuth()` to sync profile across app

### Server Functions

All in `lib/firestore-server.ts` using Admin SDK:

- `getBusinessDoc(uid)` - Fetch business by ID
- `updateBusinessDoc(uid, data)` - Update fields with `updatedAt` timestamp
- `createBusinessDoc(uid, data)` - Initial document creation (signup)

## Pages

### `/dashboard/profile`
- **View Mode**: Displays name, avatar, email, account ID, member since
- **Edit Mode**: Upload new avatar, change business name
- All changes saved via `/api/user/profile` endpoint
- Real-time sync on save

### `/dashboard/settings`
Tabbed interface with sections:

1. **Profile Tab**
   - Business name
   - Avatar upload
   - Saved to `/businesses/{uid}` collection

2. **AI Tab**
   - AI personality (system prompt)
   - Model selection (OpenRouter slug)
   - Real-time personality customization

3. **Phone Tab**
   - WhatsApp number linking
   - Connected to gateway for incoming messages

4. **Account Tab**
   - Email (read-only)
   - Account ID (copyable)
   - Current plan status

## Data Flow

```
User Action (Settings/Profile Page)
    ↓
updateBusiness(uid, {name, avatar, ...})
    ↓
POST /api/user/profile
    ↓
Admin SDK (updateBusinessDoc)
    ↓
Firestore Update + updatedAt
    ↓
Real-time Listener (onBusinessChange)
    ↓
useAuth() Context Updated
    ↓
UI Re-renders with New Data
```

## Real-Time Sync

1. **When data is saved**, `updatedAt` is automatically set server-side
2. **Firestore listeners** in `useAuth()` detect changes
3. **Context is updated**, triggering re-renders in all subscribed components
4. **Across devices**: Open same account in 2 tabs → changes sync in real-time

## File Uploads (Avatar)

- Uses `ImageUpload` component
- Uploads to Vercel Blob storage (`avatars/` folder)
- Returns URL → saved to Firestore via `/api/user/profile`
- Supports: JPG, PNG, WebP
- Min size: 256x256px

## Error Handling

- All API calls include try/catch with descriptive error messages
- Console logs: `[v0] Saving/updating profile...`
- User feedback via toast notifications
- Failed saves show error reason to user

## Database Schema

```firestore
/businesses/{uid}
  ├── id: string
  ├── name: string (mutable)
  ├── email: string (immutable)
  ├── avatarUrl: string (mutable)
  ├── aiPersonality: string (mutable)
  ├── openrouterModel: string (mutable)
  ├── whatsappPhone: string (mutable)
  ├── whatsappConnected: boolean
  ├── whatsappConnectedAt: number
  ├── createdAt: number (immutable)
  └── updatedAt: number (auto-set on changes)
```

## Testing the System

1. **Sign up** → Business document created with initial defaults
2. **Navigate to Profile** → View profile information
3. **Click Edit** → Upload avatar + change name → Save
4. **Check Firestore Console** → Verify avatar URL + name are updated, `updatedAt` is current timestamp
5. **Open in another tab/device** → Changes sync in real-time via `onBusinessChange` listener
6. **Settings page** → Modify AI personality → Save → Verify in Firestore

## Debugging

Enable console logging to trace profile operations:

```javascript
// In browser console
localStorage.debug = '*'
```

All profile operations log `[v0]` prefixed messages for debugging.
