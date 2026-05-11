import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { Business } from '@/lib/types'

export { auth, db }

export async function signUp(email: string, password: string, businessName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid
  await setDoc(doc(db, 'businesses', uid), {
    id: uid,
    name: businessName,
    email,
    whatsappPhone: '',
    whatsappConnected: false,
    openrouterModel: 'openai/gpt-4o-mini',
    avatarUrl: '',
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
