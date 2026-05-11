# Firestore Security Rules Setup

## Issue Resolution

The GrpcConnection Write error occurs when Firestore security rules reject write operations. The app now includes proper security rules that allow authenticated users to write their own business documents and subcollections.

## How to Apply the Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the existing rules with the content from `firestore.rules` in this project
5. Click **Publish**

## Rules Overview

The security rules allow:
- ✅ Authenticated users to read/write their own `/businesses/{uid}` document
- ✅ Authenticated users to read/write all subcollections under their business (contacts, products, orders, whatsapp_messages, conversations, testground_logs)
- ❌ Unauthenticated users cannot access any data
- ❌ Users cannot access other users' data

## Data Structure

```
businesses/{uid}/
├── id: string (UID)
├── name: string (Business name)
├── email: string (Email)
├── whatsappPhone: string (Connected WhatsApp number)
├── whatsappConnected: boolean (Connection status)
├── whatsappConnectedAt: number (Timestamp)
├── openrouterModel: string (AI model)
├── avatarUrl: string (Avatar image URL)
├── aiPersonality: string (AI system prompt)
├── createdAt: number (Signup timestamp)
│
├── contacts/
│   ├── {contactId}
│   ├── {contactId}
│   └── ...
│
├── products/
│   ├── {productId}
│   ├── {productId}
│   └── ...
│
├── orders/
│   ├── {orderId}
│   ├── {orderId}
│   └── ...
│
├── whatsapp_messages/
│   ├── {messageId}
│   ├── {messageId}
│   └── ...
│
└── conversations/
    ├── {conversationId}
    ├── {conversationId}
    └── ...
```

## Testing

After applying the rules:
1. Sign up with a new account
2. Check browser console for `[v0]` debug logs confirming writes
3. Go to Firebase Console → Firestore → Data tab
4. You should see a new `businesses` collection with your UID as the document ID

## Troubleshooting

- **Still seeing Write errors?** Check that the rules are published (look for the "Published" indicator)
- **No data appearing?** Check browser console for errors and ensure Firebase env vars are set correctly
- **Data in cache but not in Firebase?** Clear browser cache and try signing up again
