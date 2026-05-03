import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateEmail,
  type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export { auth, db }

export interface BusinessProfile {
  id: string
  name: string
  email: string
  aiPersonality: string
  createdAt: number
  updatedAt: number
  whatsappConnected?: boolean
  phoneNumber?: string
  website?: string
  description?: string
}

/**
 * Create a new user account and initialize their business profile in Firestore.
 * All operations are atomic — if Firestore fails, the auth user is kept but the profile won't sync properly.
 */
export async function signUp(
  email: string,
  password: string,
  businessName: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid
  const now = Timestamp.now().toMillis()

  const profile: BusinessProfile = {
    id: uid,
    name: businessName,
    email,
    aiPersonality:
      'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision.',
    createdAt: now,
    updatedAt: now,
    whatsappConnected: false,
  }

  await setDoc(doc(db, 'businesses', uid), profile)
  return credential.user
}

/**
 * Sign in with email and password.
 */
export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

/**
 * Sign out the current user.
 */
export async function logOut(): Promise<void> {
  await signOut(auth)
}

/**
 * Subscribe to auth state changes in real-time.
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

/**
 * Fetch a business profile once (not real-time).
 */
export async function getBusiness(uid: string): Promise<BusinessProfile | null> {
  const snap = await getDoc(doc(db, 'businesses', uid))
  if (!snap.exists()) return null
  return snap.data() as BusinessProfile
}

/**
 * Subscribe to real-time business profile updates.
 * Returns an unsubscribe function.
 */
export function onBusinessChange(uid: string, callback: (profile: BusinessProfile | null) => void) {
  return onSnapshot(
    doc(db, 'businesses', uid),
    (snap) => {
      if (!snap.exists()) {
        callback(null)
      } else {
        callback(snap.data() as BusinessProfile)
      }
    },
    (error) => {
      console.error('[v0] Business profile snapshot error:', error)
      callback(null)
    },
  )
}

/**
 * Update a business profile field(s) in Firestore.
 */
export async function updateBusiness(uid: string, updates: Partial<BusinessProfile>): Promise<void> {
  const ref = doc(db, 'businesses', uid)
  await updateDoc(ref, {
    ...updates,
    updatedAt: Timestamp.now().toMillis(),
  })
}

/**
 * Update the authenticated user's email.
 */
export async function updateUserEmail(newEmail: string): Promise<void> {
  if (!auth.currentUser) throw new Error('No user logged in')
  await updateEmail(auth.currentUser, newEmail)
  // Also update Firestore record
  if (auth.currentUser.uid) {
    await updateBusiness(auth.currentUser.uid, { email: newEmail })
  }
}

/**
 * Update the authenticated user's password.
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  if (!auth.currentUser) throw new Error('No user logged in')
  await updatePassword(auth.currentUser, newPassword)
}
