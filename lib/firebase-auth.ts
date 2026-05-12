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
  getDoc,
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
  try {
    const response = await fetch(`/api/user/profile?uid=${uid}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.profile as Business
  } catch (err) {
    console.error('[v0] Error getting business:', err)
    return null
  }
}

/** Real-time listener for a business document. Returns an unsubscribe function. */
export function onBusinessChange(
  uid: string,
  callback: (business: Business | null) => void,
) {
  console.log('[v0] Setting up real-time listener for business:', uid)
  const unsubscribe = onSnapshot(
    doc(db, 'businesses', uid),
    (snap) => {
      console.log('[v0] Business snapshot received:', snap.exists(), snap.data())
      callback(snap.exists() ? (snap.data() as Business) : null)
    },
    (err) => {
      console.error('[v0] Error in business snapshot listener:', err)
    },
  )
  return unsubscribe
}

/** Update any subset of Business fields for the given uid via API (Admin SDK server-side). */
export async function updateBusiness(uid: string, data: Partial<Omit<Business, 'id' | 'createdAt'>>) {
  try {
    console.log('[v0] Updating business profile via API:', uid, data)
    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, ...data }),
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log('[v0] Business profile updated successfully:', result)
    
    // Small delay to ensure Firestore has written the data before listeners fire
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    return result
  } catch (err) {
    console.error('[v0] Error updating business profile:', err)
    throw err
  }
}
