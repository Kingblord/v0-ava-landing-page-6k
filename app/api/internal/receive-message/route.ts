import { NextRequest, NextResponse } from 'next/server'
import { saveWhatsAppMessage, getContacts } from '@/lib/firestore'

/**
 * POST /api/internal/receive-message
 * Called by WhatsApp gateway when a message is received
 * Requires INTERNAL_API_KEY authorization
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.INTERNAL_API_KEY

    if (!authHeader?.startsWith('Bearer ') || !expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    if (token !== expectedKey) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { userId, from, text, platform, messageId, timestamp } = await request.json()

    if (!userId || !from || !text || !platform || !messageId || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, from, text, platform, messageId, timestamp' },
        { status: 400 }
      )
    }

    console.log(`[receive-message] Processing message from ${from}: ${text}`)

    // Save message to Firestore
    await saveWhatsAppMessage(userId, from, text, 'user', messageId, timestamp)

    // TODO: Call AI response generation here
    // For now, just acknowledge receipt
    // const aiResponse = await generateAIResponse(userId, from, text)
    // await sendAIResponse(userId, from, aiResponse)

    return NextResponse.json({
      success: true,
      message: 'Message received and stored',
    })
  } catch (error) {
    console.error('[receive-message] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
