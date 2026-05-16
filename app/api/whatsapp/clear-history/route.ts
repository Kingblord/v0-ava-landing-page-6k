import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

/**
 * DELETE /api/whatsapp/clear-history
 * Deletes all whatsapp_messages for a specific contact (contactJid) under a business.
 * Body: { userId: string, contactJid: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId, contactJid } = await request.json()

    if (!userId || !contactJid) {
      return NextResponse.json({ error: 'Missing userId or contactJid' }, { status: 400 })
    }

    const bare = contactJid.replace('@s.whatsapp.net', '')

    const snap = await adminDb
      .collection('businesses')
      .doc(userId)
      .collection('whatsapp_messages')
      .where('contactJid', '==', bare)
      .get()

    // Firestore batch delete — max 500 per batch
    const batchSize = 500
    let i = 0
    while (i < snap.docs.length) {
      const batch = adminDb.batch()
      snap.docs.slice(i, i + batchSize).forEach((doc) => batch.delete(doc.ref))
      await batch.commit()
      i += batchSize
    }

    return NextResponse.json({ success: true, deleted: snap.docs.length })
  } catch (err) {
    console.error('[clear-history] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to clear history' },
      { status: 500 },
    )
  }
}
