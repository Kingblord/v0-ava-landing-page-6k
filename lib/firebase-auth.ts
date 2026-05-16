import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import type { Business } from '@/lib/types'

export { auth }

export async function signUp(email: string, password: string, businessName: string) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = credential.user.uid

    // Create business document via Admin SDK (server-side, bypasses security rules)
    const response = await fetch('/api/auth/create-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email, businessName }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || 'Failed to create business document')
    }

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

/**
 * Fetch the business profile via the server API (uses Admin SDK — no security rule issues).
 */
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

/**
 * Update business fields via the server API (Admin SDK write + returns updated profile).
 * Callers should invoke refreshBusiness() from useAuth() after this resolves.
 */
export async function updateBusiness(
  uid: string,
  data: Partial<Omit<Business, 'id' | 'createdAt'>>,
): Promise<Business> {
  const response = await fetch('/api/user/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, ...data }),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error || `HTTP ${response.status}`)
  }

  const result = await response.json()
  return result.profile as Business
}
