import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { Business } from '@/lib/types'

export { auth, db }

export async function signUp(email: string, password: string, businessName: string) {
  try {
    console.log('[v0] Starting signup for:', email)
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = credential.user.uid
    console.log('[v0] User created with UID:', uid)

    // Call server action to save business document using Admin SDK
    console.log('[v0] Calling server action to save business document...')
    const response = await fetch('/api/auth/create-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email, businessName }),
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || 'Failed to create business document')
    }

    console.log('[v0] Business document created successfully via Admin SDK')
    return credential.user
  } catch (err) {
    console.error('[v0] Signup error:', err)
    throw err
  }
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

export async function getBusiness(uid: string): Promise<Business | null> {
  const snap = await getDoc(doc(db, 'businesses', uid))
  if (!snap.exists()) return null
  return snap.data() as Business
}

/** Real-time listener for a business document. Returns an unsubscribe function. */
export function onBusinessChange(
  uid: string,
  callback: (business: Business | null) => void,
) {
  return onSnapshot(doc(db, 'businesses', uid), (snap) => {
    callback(snap.exists() ? (snap.data() as Business) : null)
  })
}

/** Update any subset of Business fields for the given uid. */
export async function updateBusiness(uid: string, data: Partial<Omit<Business, 'id' | 'createdAt'>>) {
  await updateDoc(doc(db, 'businesses', uid), data as Record<string, unknown>)
}
