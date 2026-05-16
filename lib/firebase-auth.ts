import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import type { Business } from '@/lib/types'

export { auth }

/** Map Firebase error codes to human-readable messages */
export function firebaseErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  const messages: Record<string, string> = {
    'auth/invalid-email':            'That email address is not valid.',
    'auth/user-not-found':           'No account found with that email.',
    'auth/wrong-password':           'Incorrect password. Please try again.',
    'auth/invalid-credential':       'Incorrect email or password.',
    'auth/email-already-in-use':     'An account with this email already exists.',
    'auth/weak-password':            'Password must be at least 6 characters.',
    'auth/too-many-requests':        'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed':   'Network error. Check your connection and try again.',
    'auth/popup-closed-by-user':     'Google sign-in was cancelled.',
    'auth/cancelled-popup-request':  'Only one sign-in window allowed at a time.',
    'auth/requires-recent-login':    'Please sign in again before changing your password.',
  }
  return messages[code] ?? 'Something went wrong. Please try again.'
}

export async function signUp(email: string, password: string, businessName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid

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
}

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const credential = await signInWithPopup(auth, provider)
  return credential.user
}

export async function sendReset(email: string) {
  await sendPasswordResetEmail(auth, email)
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('No authenticated user.')
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
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
