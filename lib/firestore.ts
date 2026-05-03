import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase-auth'
import type { Product, Order, Conversation, Business, Message, ConversationState } from '@/lib/types'

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(businessId: string): Promise<Product[]> {
  const snap = await getDocs(
    query(
      collection(db, 'businesses', businessId, 'products'),
      orderBy('createdAt', 'desc'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
}

export async function createProduct(
  businessId: string,
  data: Omit<Product, 'id' | 'businessId' | 'createdAt'>,
): Promise<Product> {
  const payload = { ...data, businessId, createdAt: Date.now() }
  const ref = await addDoc(
    collection(db, 'businesses', businessId, 'products'),
    payload,
  )
  return { id: ref.id, ...payload }
}

export async function updateProduct(
  businessId: string,
  productId: string,
  data: Partial<Omit<Product, 'id' | 'businessId' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'businesses', businessId, 'products', productId), data)
}

export async function deleteProduct(businessId: string, productId: string): Promise<void> {
  await deleteDoc(doc(db, 'businesses', businessId, 'products', productId))
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(businessId: string): Promise<Order[]> {
  const snap = await getDocs(
    query(
      collection(db, 'orders'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
}

export async function createOrder(data: Omit<Order, 'id'>): Promise<Order> {
  const ref = await addDoc(collection(db, 'orders'), data)
  return { id: ref.id, ...data }
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status })
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getConversation(
  businessId: string,
  userId: string,
): Promise<Conversation | null> {
  const id = `${businessId}_${userId.replace(/\D/g, '')}`
  const snap = await getDoc(doc(db, 'conversations', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Conversation
}

export async function upsertConversation(
  businessId: string,
  userId: string,
  messages: Message[],
  state: ConversationState,
): Promise<void> {
  const id = `${businessId}_${userId.replace(/\D/g, '')}`
  await setDoc(
    doc(db, 'conversations', id),
    { userId, businessId, messages, state, lastActiveAt: Date.now() },
    { merge: true },
  )
}

export async function getConversations(businessId: string): Promise<Conversation[]> {
  const snap = await getDocs(
    query(
      collection(db, 'conversations'),
      where('businessId', '==', businessId),
      orderBy('lastActiveAt', 'desc'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation))
}

// ─── Business ─────────────────────────────────────────────────────────────────

export async function getBusiness(businessId: string): Promise<Business | null> {
  const snap = await getDoc(doc(db, 'businesses', businessId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Business
}

export async function updateBusiness(
  businessId: string,
  data: Partial<Omit<Business, 'id' | 'email' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'businesses', businessId), data)
}

// ─── Testground Products ──────────────────────────────────────────────────────
// Temporary test products for admin testing - stored at admin_testground_products collection

export async function getTestgroundProducts(adminId: string): Promise<Product[]> {
  const snap = await getDocs(
    query(
      collection(db, 'admin_testground_products'),
      where('adminId', '==', adminId),
      orderBy('createdAt', 'desc'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, businessId: 'testground', ...d.data() } as Product))
}

export async function createTestgroundProduct(
  adminId: string,
  data: Omit<Product, 'id' | 'businessId' | 'createdAt'>,
): Promise<Product> {
  const payload = { ...data, businessId: 'testground', adminId, createdAt: Date.now() }
  const ref = await addDoc(collection(db, 'admin_testground_products'), payload)
  return { id: ref.id, ...payload }
}

export async function updateTestgroundProduct(
  adminId: string,
  productId: string,
  data: Partial<Omit<Product, 'id' | 'businessId' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'admin_testground_products', productId), data)
}

export async function deleteTestgroundProduct(
  adminId: string,
  productId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'admin_testground_products', productId))
}
