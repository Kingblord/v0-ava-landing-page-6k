import { NextRequest, NextResponse } from 'next/server'
import { getContactsForBusiness, createContactDoc, updateContactDoc, deleteContactDoc, getUniqueJidsFromMessages } from '@/lib/firestore-server'
import type { Contact } from '@/lib/types'

/**
 * GET /api/whatsapp/contacts?userId=...
 * Returns saved contacts merged with any unknown JIDs that have sent messages.
 * Unknown senders appear as contacts using their phone number as the name.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Load saved contacts and all JIDs from messages in parallel
    const [savedContacts, messageJids] = await Promise.all([
      getContactsForBusiness(userId),
      getUniqueJidsFromMessages(userId),
    ])

    // Build a set of JIDs already in saved contacts
    const savedJidSet = new Set(
      savedContacts.map((c) => c.jid.replace('@s.whatsapp.net', '').replace('@lid', ''))
    )

    // Build synthetic contacts for JIDs not yet saved
    const unknownContacts: Contact[] = messageJids
      .filter(({ jid }) => !savedJidSet.has(jid))
      .map(({ jid, lastMessage, lastTs }) => ({
        id: `jid_${jid}`,
        jid: `${jid}@s.whatsapp.net`,
        phone: jid,
        name: jid,           // Show phone as name until user saves them
        aiEnabled: false,
        lastMessage,
        lastTs,
        unknown: true,       // Flag so UI can show a "Save contact" option
      } as Contact & { unknown?: boolean }))

    // Merge: saved contacts first (they may have richer metadata), unknown appended
    const contacts = [...savedContacts, ...unknownContacts]

    // Sort by most recent message
    contacts.sort((a, b) => ((b.lastTs ?? 0) - (a.lastTs ?? 0)))

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

/**
 * DELETE /api/whatsapp/contacts
 * Delete a contact by id
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId, contactId } = await request.json()
    if (!userId || !contactId) {
      return NextResponse.json({ error: 'Missing userId or contactId' }, { status: 400 })
    }
    await deleteContactDoc(userId, contactId)
    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[v0] Error deleting contact:', errorMsg)
    return NextResponse.json({ error: errorMsg || 'Failed to delete contact' }, { status: 500 })
  }
}
