import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export { auth, db }

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
