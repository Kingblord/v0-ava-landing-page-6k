/**
 * Server-side Firestore access using the Firebase client SDK.
 * We use the same client SDK (not Admin) since we don't have a service account.
 * This module is safe to import in API routes (server only).
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  query,
  where,
  orderBy,
  type Firestore,
} from 'firebase/firestore'
import type {
  Product,
  Order,
  Conversation,
  Business,
  Message,
  ConversationState,
} from '@/lib/types'

function getServerApp(): FirebaseApp {
  if (getApps().length) return getApp()
  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  })
}

function getDb(): Firestore {
  return getFirestore(getServerApp())
}

export async function serverGetBusinessByPhone(phone: string): Promise<Business | null> {
  const db = getDb()
  const snap = await getDocs(
    query(collection(db, 'businesses'), where('whatsappPhone', '==', phone)),
  )
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Business
}

export async function serverGetProducts(businessId: string): Promise<Product[]> {
  const db = getDb()
  const snap = await getDocs(
    query(collection(db, 'businesses', businessId, 'products'), orderBy('createdAt', 'desc')),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
}

export async function serverGetConversation(
  businessId: string,
  userId: string,
): Promise<Conversation | null> {
  const db = getDb()
  const id = `${businessId}_${userId.replace(/\D/g, '')}`
  const snap = await getDoc(doc(db, 'conversations', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Conversation
}

export async function serverUpsertConversation(
  businessId: string,
  userId: string,
  messages: Message[],
  state: ConversationState,
): Promise<void> {
  const db = getDb()
  const id = `${businessId}_${userId.replace(/\D/g, '')}`
  await setDoc(
    doc(db, 'conversations', id),
    { userId, businessId, messages, state, lastActiveAt: Date.now() },
    { merge: true },
  )
}

export async function serverCreateOrder(data: Omit<Order, 'id'>): Promise<Order> {
  const db = getDb()
  const ref = await addDoc(collection(db, 'orders'), data)
  return { id: ref.id, ...data }
}

export async function serverGetOrders(businessId: string): Promise<Order[]> {
  const db = getDb()
  const snap = await getDocs(
    query(collection(db, 'orders'), where('businessId', '==', businessId), orderBy('createdAt', 'desc')),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
}

export async function serverGetConversations(businessId: string): Promise<Conversation[]> {
  const db = getDb()
  const snap = await getDocs(
    query(collection(db, 'conversations'), where('businessId', '==', businessId)),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation))
}
