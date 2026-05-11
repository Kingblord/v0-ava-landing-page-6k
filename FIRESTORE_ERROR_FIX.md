## Firestore Write Error - Troubleshooting & Fix

### What Was Changed
1. **Simplified Firebase initialization** - Removed complex persistent cache config that was causing gRPC errors
2. **Added retry logic** - Signup now retries Firestore writes up to 3 times with exponential backoff
3. **Created diagnostic endpoint** - `/api/firestore-test` for testing Firestore connectivity

### How to Verify It Works

#### 1. Test Firestore Connectivity
```bash
# Test write
curl -X POST http://localhost:3000/api/firestore-test \
  -H "Content-Type: application/json" \
  -d '{"action":"test-write"}'

# Response should include testId:
# {"success":true,"testId":"test-1778462183145","message":"Write successful"}
```

#### 2. Sign Up and Verify Document Created
1. Go to `/auth/signup`
2. Create a new account
3. Check Firebase Console > Firestore Database > Collections
4. Look for the `businesses` collection with your user ID as the document ID

#### 3. Verify the Document Has All Fields
Your document should look like:
```
{
  "id": "USER_ID",
  "name": "Business Name",
  "email": "user@example.com",
  "whatsappPhone": "",
  "whatsappConnected": false,
  "openrouterModel": "openai/gpt-4o-mini",
  "avatarUrl": "",
  "aiPersonality": "You are a friendly...",
  "createdAt": 1778462183145
}
```

### If Still Getting Errors

#### Check Firestore Security Rules
1. Firebase Console > Firestore Database > Rules
2. Paste the rules from `/firestore.rules` file
3. Click "Publish"

#### Check Environment Variables
Verify these are set in Vercel project settings:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Check Browser Console
Look for any errors in DevTools Console (F12)

### Retry Logic
The signup function now:
1. Tries to write to Firestore
2. If it fails, waits 2 seconds and retries
3. If it fails again, waits 4 seconds and retries one more time
4. If all 3 attempts fail, shows the error to the user

This handles temporary network hiccups automatically.
