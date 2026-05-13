import { adminDb } from '@/lib/firebase-admin'
import type { Business, Contact, Product, Order, Message } from '@/lib/types'

/**
 * Server-side Firestore operations using Firebase Admin SDK
 * These functions run on the server and have full admin privileges
 */

// ─── User Businesses ──────────────────────────────────────────────────────────

export async function createBusinessDoc(uid: string, data: Partial<Business>) {
  try {
    console.log('[v0] Creating business document for:', uid)
    await adminDb.collection('businesses').doc(uid).set(data, { merge: false })
    console.log('[v0] Business document created successfully')
    return { id: uid, ...data }
  } catch (err) {
    console.error('[v0] Error creating business document:', err)
    throw err
  }
}

export async function updateBusinessDoc(uid: string, data: Partial<Business>) {
  try {
    console.log('[v0] Updating business document for:', uid)
    await adminDb.collection('businesses').doc(uid).update(data)
    console.log('[v0] Business document updated successfully')
  } catch (err) {
    console.error('[v0] Error updating business document:', err)
    throw err
  }
}

export async function getBusinessDoc(uid: string): Promise<Business | null> {
  try {
    console.log('[v0] Getting business document for:', uid)
    const snap = await adminDb.collection('businesses').doc(uid).get()
    if (!snap.exists()) {
      console.log('[v0] Business document not found for:', uid)
      return null
    }
    const data = snap.data()
    console.log('[v0] Business document retrieved for:', uid, 'data:', data)
    return { id: snap.id, ...data } as Business
  } catch (err) {
    console.error('[v0] Error getting business document:', err)
    throw err
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProductsServer(businessId: string): Promise<Product[]> {
  try {
    const snap = await adminDb
      .collection('businesses')
      .doc(businessId)
      .collection('products')
      .orderBy('createdAt', 'desc')
      .get()
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
  } catch (err) {
    console.error('[v0] Error fetching products:', err)
    return []
  }
}

export async function createProductServer(
  businessId: string,
  data: Omit<Product, 'id' | 'businessId' | 'createdAt'>,
): Promise<Product> {
  const payload = { ...data, businessId, createdAt: Date.now() }
  const ref = await adminDb
    .collection('businesses')
    .doc(businessId)
    .collection('products')
    .add(payload)
  return { id: ref.id, ...payload }
}

export async function updateProductServer(
  businessId: string,
  productId: string,
  data: Partial<Omit<Product, 'id' | 'businessId' | 'createdAt'>>,
): Promise<void> {
  await adminDb
    .collection('businesses')
    .doc(businessId)
    .collection('products')
    .doc(productId)
    .update(data)
}

export async function deleteProductServer(businessId: string, productId: string): Promise<void> {
  await adminDb
    .collection('businesses')
    .doc(businessId)
    .collection('products')
    .doc(productId)
    .delete()
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrdersServer(businessId: string): Promise<Order[]> {
  try {
    console.log('[v0] Fetching orders for businessId:', businessId)
    const snap = await adminDb
      .collection('orders')
      .where('businessId', '==', businessId)
      .get()
    
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
    
    // Sort by createdAt in memory to avoid composite index requirement
    orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    
    console.log('[v0] Retrieved', orders.length, 'orders for business:', businessId)
    return orders
  } catch (err) {
    console.error('[v0] Error fetching orders:', err)
    return []
  }
}

export async function createOrderServer(data: Omit<Order, 'id'>): Promise<Order> {
  const ref = await adminDb.collection('orders').add({ ...data, createdAt: Date.now() })
  return { id: ref.id, ...data }
}

export async function updateOrderStatusServer(orderId: string, status: Order['status']): Promise<void> {
  await adminDb.collection('orders').doc(orderId).update({ status, updatedAt: Date.now() })
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function createContactDoc(uid: string, contact: Contact) {
  try {
    console.log('[v0] Creating contact for business:', uid)
    const ref = await adminDb.collection('businesses').doc(uid).collection('contacts').add(contact)
    console.log('[v0] Contact created with ID:', ref.id)
    return { id: ref.id, ...contact }
  } catch (err) {
    console.error('[v0] Error creating contact:', err)
    throw err
  }
}

export async function getContactsForBusiness(uid: string): Promise<Contact[]> {
  try {
    const snap = await adminDb.collection('businesses').doc(uid).collection('contacts').get()
    const contacts = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Contact))
    console.log('[v0] Retrieved', contacts.length, 'contacts for business:', uid)
    return contacts
  } catch (err) {
    console.error('[v0] Error getting contacts:', err)
    throw err
  }
}

export async function updateContactDoc(uid: string, contactId: string, data: Partial<Contact>) {
  try {
    await adminDb
      .collection('businesses')
      .doc(uid)
      .collection('contacts')
      .doc(contactId)
      .update(data)
    console.log('[v0] Contact updated:', contactId)
  } catch (err) {
    console.error('[v0] Error updating contact:', err)
    throw err
  }
}

export async function deleteContactDoc(uid: string, contactId: string) {
  try {
    await adminDb
      .collection('businesses')
      .doc(uid)
      .collection('contacts')
      .doc(contactId)
      .delete()
    console.log('[v0] Contact deleted:', contactId)
  } catch (err) {
    console.error('[v0] Error deleting contact:', err)
    throw err
  }
}

// ─── Messages ──────────────────────────────────────────────────────────────────

export async function saveMessageDoc(uid: string, message: Record<string, unknown>) {
  try {
    const ref = await adminDb
      .collection('businesses')
      .doc(uid)
      .collection('whatsapp_messages')
      .add(message)
    console.log('[v0] Message saved with ID:', ref.id)
    return { id: ref.id, ...message }
  } catch (err) {
    console.error('[v0] Error saving message:', err)
    throw err
  }
}

export async function getMessagesForContact(
  uid: string,
  contactJid: string,
  limit: number = 50,
): Promise<Record<string, unknown>[]> {
  try {
    console.log('[v0] Fetching messages for contact:', contactJid, 'limit:', limit)
    const snap = await adminDb
      .collection('businesses')
      .doc(uid)
      .collection('whatsapp_messages')
      .where('from', '==', contactJid)
      .limit(limit)
      .get()
    
    const messages = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    
    // Sort by timestamp in memory to avoid composite index requirement
    messages.sort((a, b) => ((b.timestamp as number) || 0) - ((a.timestamp as number) || 0))
    
    return messages.reverse()
  } catch (err) {
    console.error('[v0] Error getting messages:', err)
    throw err
  }
}

// ─── Landing Page Content ──────────────────────────────���──────────────────────

export async function getLandingContent<T extends Record<string, unknown>>(
  section: string,
  defaultContent: T,
): Promise<T> {
  try {
    const doc = await adminDb.collection('landingContent').doc(section).get()
    if (doc.exists) {
      return doc.data() as T
    }
    // Initialize with default if doesn't exist
    await adminDb.collection('landingContent').doc(section).set(defaultContent)
    return defaultContent
  } catch (err) {
    console.error('[v0] Error fetching landing content:', err)
    return defaultContent
  }
}

export async function saveLandingContent<T extends Record<string, unknown>>(
  section: string,
  data: T,
): Promise<void> {
  try {
    await adminDb.collection('landingContent').doc(section).set(data, { merge: true })
    console.log('[v0] Landing content saved:', section)
  } catch (err) {
    console.error('[v0] Error saving landing content:', err)
    throw err
  }
}

// ─── WhatsApp Session ──────────────────────────────────────────────────────────

export async function saveWhatsAppSessionServer(
  businessId: string,
  phoneNumber: string,
  connected: boolean,
): Promise<void> {
  try {
    await adminDb.collection('businesses').doc(businessId).update({
      whatsappPhone: phoneNumber,
      whatsappConnected: connected,
      whatsappConnectedAt: connected ? Date.now() : null,
      updatedAt: Date.now(),
    })
    console.log('[v0] WhatsApp session saved:', businessId)
  } catch (err) {
    console.error('[v0] Error saving WhatsApp session:', err)
    throw err
  }
}

