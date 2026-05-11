import { adminDb } from '@/lib/firebase-admin'
import type { Business, Contact } from '@/lib/types'

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
    const snap = await adminDb.collection('businesses').doc(uid).get()
    if (!snap.exists) {
      console.log('[v0] Business document not found for:', uid)
      return null
    }
    console.log('[v0] Business document retrieved for:', uid)
    return { id: snap.id, ...snap.data() } as Business
  } catch (err) {
    console.error('[v0] Error getting business document:', err)
    throw err
  }
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
    const snap = await adminDb
      .collection('businesses')
      .doc(uid)
      .collection('whatsapp_messages')
      .where('from', '==', contactJid)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()
    const messages = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return messages.reverse()
  } catch (err) {
    console.error('[v0] Error getting messages:', err)
    throw err
  }
}
