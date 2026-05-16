import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { saveMessageDoc } from '@/lib/firestore-server'

/**
 * POST /api/whatsapp/send-message
 * Sends a message through the WhatsApp gateway
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, to, text } = await request.json()

    if (!userId || !to || !text) {
      return NextResponse.json({ error: 'Missing userId, to, or text' }, { status: 400 })
    }

    let gatewayUrl = process.env.WHATSAPP_GATEWAY_URL
    if (!gatewayUrl) {
      return NextResponse.json({ error: 'Gateway not configured' }, { status: 500 })
    }

    // Ensure gatewayUrl has protocol
    if (!gatewayUrl.startsWith('http://') && !gatewayUrl.startsWith('https://')) {
      gatewayUrl = `https://${gatewayUrl}`
    }

    // Normalize phone number to JID format
    const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`

    // Send through gateway
    const response = await axios.post(
      `${gatewayUrl}/send-message`,
      { userId, to: jid, text },
      { timeout: 10000 }
    )

    // Save to Firestore via Admin SDK — must match the contactJid schema
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const contactJid = jid.replace('@s.whatsapp.net', '')
    await saveMessageDoc(userId, {
      contactJid,
      from:      userId,      // sender: the business (manual send)
      to:        contactJid,
      text,
      role:      'assistant',
      messageId,
      timestamp: Date.now(),
      platform:  'whatsapp',
      direction: 'outgoing',
    })

    return NextResponse.json({
      success: true,
      messageId,
      message: 'Message sent',
    })
  } catch (error) {
    console.error('[send-message] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
