import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Verify all config values are present
const missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key, _]) => key)

if (missingVars.length > 0) {
  console.error('[v0] Missing Firebase config variables:', missingVars)
  throw new Error(`Firebase config incomplete. Missing: ${missingVars.join(', ')}`)
}

console.log('[v0] Firebase config loaded successfully with all 6 values:', {
  apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId?.substring(0, 10) + '...',
})

// Initialize Firebase app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Get Firestore instance (uses default settings)
export const db = getFirestore(app)
export const auth = getAuth(app)

console.log('[v0] Firebase and Firestore initialized successfully')
