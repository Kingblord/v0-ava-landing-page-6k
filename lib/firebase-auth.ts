import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export async function signUp(email: string, password: string, businessName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid
  await setDoc(doc(db, 'businesses', uid), {
    id: uid,
    name: businessName,
    email,
    aiPersonality:
      'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision.',
    createdAt: Date.now(),
  })
  return credential.user
}

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function logOut() {
  await signOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function getBusiness(uid: string) {
  const snap = await getDoc(doc(db, 'businesses', uid))
  if (!snap.exists()) return null
  return snap.data()
}
