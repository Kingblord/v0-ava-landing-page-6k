# User Data Flow & Schema Verification

## Firestore Schema
All user data is stored in the `businesses` collection with the document ID being the user's UID:

```json
{
  "id": "xG3xSFzIhdYJIfDijL3jasVNutC2",
  "name": "ETEAKWU LUXURY",
  "email": "contact@litcooperation.tech",
  "avatarUrl": "",
  "whatsappPhone": "",
  "whatsappConnected": false,
  "openrouterModel": "openai/gpt-4o-mini",
  "aiPersonality": "You are a friendly and professional sales agent...",
  "createdAt": 1778631940351,
  "updatedAt": 1778631940351
}
```

## Display Locations

### Dashboard Homepage
- **Business Name**: Displayed in hero header (line 239)
  - Source: `business?.name` from auth context
  - Updates: Real-time via `onSnapshot` listener
  - Fallback: Shows email first part or "Dashboard" if not available

### Profile Page (`/dashboard/profile`)
- **Avatar**: Large preview in view/edit mode (96x96px)
  - Source: `business?.avatarUrl`
  - Editable: Yes, via ImageUpload component
  - Updates saved to Firestore via `/api/user/profile`

- **Business Name**: Displayed and editable
  - Source: `business?.name`
  - Shows as "Business Name" label

- **Email**: Displayed and editable (NEW)
  - Source: `business?.email` or `user?.email`
  - Field added to both view and edit modes
  - Validates email format before save

- **Account ID**: Read-only
  - Source: `user?.uid`
  - Shows Firebase Auth UID

- **Member Since**: Read-only
  - Source: `business?.createdAt`
  - Formatted as localized date

### Settings Page (`/dashboard/settings`)
Organized into tabs:

**Profile Tab**
- Avatar upload with preview
- Business name input (required)
- Saves to: `{ avatarUrl, name }`

**AI Tab**
- AI Personality textarea: `business?.aiPersonality`
- Model selection: `business?.openrouterModel`
- Saves to: `{ aiPersonality, openrouterModel }`

**Phone Tab**
- WhatsApp phone number: `business?.whatsappPhone`
- WhatsApp status indicator: `business?.whatsappConnected`
- Saves to: `{ whatsappPhone, whatsappConnected }`

**Account Tab**
- Read-only fields: email, UID, created at

## Data Flow & Updates

### 1. Registration
- User registers via `/auth/signup`
- Firebase Auth creates user
- API call to `/api/auth/create-business` creates Firestore doc with default values
- Verification loop ensures document is written
- Auth context listener picks up the new business document

### 2. Real-Time Sync
- `onSnapshot` listener in auth-context watches `businesses/{uid}`
- Fallback polling every 500ms for 5 seconds if listener doesn't fire initially
- Updates `business` state in context
- All pages using `useAuth()` instantly reflect changes

### 3. Profile Updates
- User edits profile/settings
- Form calls `updateBusiness(uid, { fieldName: value, ... })`
- Function sends POST to `/api/user/profile`
- Admin SDK writes to Firestore with verification
- Listener fires, context updates, UI re-renders

### 4. API Endpoints
- **POST `/api/user/profile`**: Update any business fields, returns updated doc
- **GET `/api/user/profile?uid=...`**: Fetch business doc
- **POST `/api/auth/create-business`**: Create business doc on registration with verification

## Type Definition
```typescript
interface Business {
  id: string                    // User UID
  name: string                  // Business name
  email: string                 // Contact email
  whatsappPhone?: string        // Phone for WhatsApp
  whatsappConnected?: boolean   // WhatsApp integration status
  whatsappConnectedAt?: number  // When connected
  openrouterModel?: string      // AI model (default: openai/gpt-4o-mini)
  avatarUrl?: string            // Logo/avatar URL
  aiPersonality: string         // System prompt for AI agent
  createdAt: number             // Account creation timestamp
  updatedAt?: number            // Last update timestamp
}
```

## Verification Checklist
✓ Dashboard displays business name (not email)
✓ Profile page shows all fields including email
✓ Settings page displays and allows editing all personalizations
✓ Email field is now editable in profile
✓ Real-time listeners sync data across all pages
✓ Fallback polling ensures data appears even with delays
✓ All updates saved to Firestore via Admin SDK
✓ Database schema matches type definition
