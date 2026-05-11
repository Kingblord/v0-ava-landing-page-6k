import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

console.log('[v0] Firebase config loaded:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
})

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Use persistent cache so Firestore works offline and avoids "client is offline" errors.
// Only initialise once — if already initialised, fall back to getFirestore().
export const db = (() => {
  try {
    console.log('[v0] Initializing Firestore with persistent cache...')
    return initializeFirestore(app, {
      cache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch (err) {
    // Already initialised — return existing instance
    console.log('[v0] Firestore already initialized, using existing instance')
    return getFirestore(app)
  }
})()

export const auth = getAuth(app)

console.log('[v0] Firebase initialized successfully')
