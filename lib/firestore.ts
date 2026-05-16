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
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Product, Conversation, Message, ConversationState, TestgroundConversationLog } from '@/lib/types'

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

// ─── Testground Products ──────────────────────────────────────────────────────
// Temporary test products for admin testing - stored at admin_testground_products collection
// Falls back to local storage if Firebase is not configured

function isFirebaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
}

function getLocalTestgroundProducts(): Product[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('testground_products') || '[]')
  } catch {
    return []
  }
}

function saveLocalTestgroundProducts(products: Product[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('testground_products', JSON.stringify(products))
}

export async function getTestgroundProducts(adminId: string): Promise<Product[]> {
  try {
    if (!isFirebaseConfigured()) {
      console.log('[firestore] Firebase not configured, loading testground products from local storage')
      return getLocalTestgroundProducts()
    }

    const snap = await getDocs(
      query(
        collection(db, 'admin_testground_products'),
        where('adminId', '==', adminId),
        orderBy('createdAt', 'desc'),
      ),
    )
    return snap.docs.map((d) => ({ id: d.id, businessId: 'testground', ...d.data() } as Product))
  } catch (error) {
    console.warn('[firestore] Failed to load testground products from Firebase, falling back to local storage:', error)
    return getLocalTestgroundProducts()
  }
}

export async function createTestgroundProduct(
  adminId: string,
  data: Omit<Product, 'id' | 'businessId' | 'createdAt'>,
): Promise<Product> {
  try {
    if (!isFirebaseConfigured()) {
      console.log('[firestore] Firebase not configured, saving testground product to local storage')
      return saveTestgroundProductLocal(data)
    }

    const payload = { ...data, businessId: 'testground', adminId, createdAt: Date.now() }
    console.log('[firestore] Creating testground product with payload:', payload)
    
    const ref = await addDoc(collection(db, 'admin_testground_products'), payload)
    console.log('[firestore] Product created with ID:', ref.id)
    
    return { id: ref.id, ...payload }
  } catch (error) {
    console.warn('[firestore] Failed to create testground product in Firebase, falling back to local storage:', error)
    return saveTestgroundProductLocal(data)
  }
}

function saveTestgroundProductLocal(data: Omit<Product, 'id' | 'businessId' | 'createdAt'>): Product {
  const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const product: Product = { id, ...data, businessId: 'testground', createdAt: Date.now() }
  const products = getLocalTestgroundProducts()
  products.unshift(product)
  saveLocalTestgroundProducts(products)
  console.log('[firestore] Product saved to local storage:', product)
  return product
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

// ─── Testground Config ────────────────────────────────────────────────────────
// Saves admin testground configuration (model, AI personality, business name) for webhook access

export interface TestgroundConfig {
  products: Product[]
  businessName: string
  aiPersonality: string
  selectedModel: string
}

export async function saveTestgroundConfig(
  adminId: string,
  config: TestgroundConfig,
): Promise<void> {
  await setDoc(doc(db, 'admin_testground_config', adminId), config, { merge: true })
}

export async function getTestgroundConfig(adminId: string): Promise<TestgroundConfig> {
  const snap = await getDoc(doc(db, 'admin_testground_config', adminId))
  if (!snap.exists()) {
    return {
      products: [],
      businessName: 'Test Store',
      aiPersonality: 'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision. Be concise, warm, and human.',
      selectedModel: 'openai/gpt-4o-mini',
    }
  }
  return snap.data() as TestgroundConfig
}

// ─── Testground Conversation Logs ────────────────────────────────────────────
// Stores all WhatsApp messages and AI responses for inspection

export async function saveTestgroundConversationLog(
  phoneNumber: string,
  userMessage: string,
  aiResponse: string,
  aiState: ConversationState,
  orderIntent?: { productId: string; productName: string; amount: number },
): Promise<void> {
  try {
    if (!isFirebaseConfigured()) {
      console.log('[firestore] Firebase not configured, skipping conversation log save')
      return
    }

    const logEntry = {
      phoneNumber,
      userMessage,
      aiResponse,
      aiState,
      orderIntent,
      createdAt: Date.now(),
    }

    await addDoc(collection(db, 'admin_testground_logs'), logEntry)
    console.log('[firestore] Conversation log saved for', phoneNumber)
  } catch (error) {
    console.warn('[firestore] Failed to save conversation log:', error)
    // Don't throw - conversation should still work even if logging fails
  }
}

export async function getTestgroundConversationLogs(): Promise<TestgroundConversationLog[]> {
  try {
    if (!isFirebaseConfigured()) {
      console.log('[firestore] Firebase not configured, returning empty logs')
      return []
    }

    const snap = await getDocs(
      query(
        collection(db, 'admin_testground_logs'),
        orderBy('createdAt', 'desc'),
      ),
    )
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TestgroundConversationLog))
  } catch (error) {
    console.warn('[firestore] Failed to load conversation logs:', error)
    return []
  }
}

export async function deleteTestgroundConversationLog(logId: string): Promise<void> {
  try {
    if (!isFirebaseConfigured()) return
    await deleteDoc(doc(db, 'admin_testground_logs', logId))
  } catch (error) {
    console.warn('[firestore] Failed to delete conversation log:', error)
  }
}
