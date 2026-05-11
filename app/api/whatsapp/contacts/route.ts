import { NextRequest, NextResponse } from 'next/server'
import { getContactsForBusiness, createContactDoc, updateContactDoc } from '@/lib/firestore-server'
import type { Contact } from '@/lib/types'

/**
 * GET /api/whatsapp/contacts?userId=...
 * Get all WhatsApp contacts for a business
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    console.log('[v0] Fetching contacts for business:', userId)
    const contacts = await getContactsForBusiness(userId)

    return NextResponse.json({
      success: true,
      contacts,
      count: contacts.length,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[v0] Error fetching contacts:', errorMsg)
    return NextResponse.json(
      { error: errorMsg || 'Failed to fetch contacts' },
      { status: 500 },
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
    console.log('[v0] Checking for existing contact:', jid)
    const contacts = await getContactsForBusiness(userId)
    const existing = contacts.find((c) => c.jid === jid)

    let contact: Contact
    if (existing) {
      // Update existing contact
      console.log('[v0] Updating existing contact:', existing.id)
      await updateContactDoc(userId, existing.id, {
        name: name || existing.name,
        aiEnabled: aiEnabled !== undefined ? aiEnabled : existing.aiEnabled,
      })
      contact = { ...existing, name: name || existing.name, aiEnabled: aiEnabled !== undefined ? aiEnabled : existing.aiEnabled }
    } else {
      // Create new contact
      console.log('[v0] Creating new contact:', jid)
      contact = (await createContactDoc(userId, {
        jid,
        phone,
        name: name || phone,
        aiEnabled: aiEnabled ?? false,
        lastMessage: '',
        lastTs: Date.now(),
      } as Contact)) as Contact
    }

    return NextResponse.json({
      success: true,
      contact,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[v0] Error saving contact:', errorMsg)
    return NextResponse.json(
      { error: errorMsg || 'Failed to save contact' },
      { status: 500 },
    )
  }
}
