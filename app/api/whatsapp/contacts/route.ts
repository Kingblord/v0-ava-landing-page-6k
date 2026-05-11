import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getContacts, createContact, updateContact } from '@/lib/firestore'

/**
 * GET /api/whatsapp/contacts?userId=...
 * Get all WhatsApp contacts for a business
 * Syncs with Firestore to get contact list with AI settings
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Get contacts from Firestore
    const contacts = await getContacts(userId)

    return NextResponse.json({
      success: true,
      contacts,
      count: contacts.length,
    })
  } catch (error) {
    console.error('[contacts] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/whatsapp/contacts
 * Create or update a contact
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, phone, name, aiEnabled } = await request.json()

    if (!userId || !phone) {
      return NextResponse.json({ error: 'Missing userId or phone' }, { status: 400 })
    }

    const jid = phone.includes('@s.whatsapp.net') ? phone : `${phone}@s.whatsapp.net`

    // Check if contact exists
    const contacts = await getContacts(userId)
    const existing = contacts.find((c) => c.jid === jid)

    let contact
    if (existing) {
      // Update
      await updateContact(userId, existing.id, {
        name: name || existing.name,
        aiEnabled: aiEnabled !== undefined ? aiEnabled : existing.aiEnabled,
      })
      contact = { ...existing, name: name || existing.name, aiEnabled }
    } else {
      // Create
      contact = await createContact(userId, {
        jid,
        phone,
        name: name || phone,
        aiEnabled: aiEnabled ?? false,
      })
    }

    return NextResponse.json({
      success: true,
      contact,
    })
  } catch (error) {
    console.error('[contacts POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save contact' },
      { status: 500 }
    )
  }
}
