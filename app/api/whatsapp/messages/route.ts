import { NextRequest, NextResponse } from 'next/server'
import { getMessagesForContact } from '@/lib/firestore-server'

/**
 * GET /api/whatsapp/messages?userId=...&from=...
 * Get ALL WhatsApp messages for a specific contact
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const from = request.nextUrl.searchParams.get('from')
    const limitStr = request.nextUrl.searchParams.get('limit')
    // Default to fetching all messages (10000 limit), or use specified limit
    const limit = limitStr ? Math.min(parseInt(limitStr), 10000) : 10000

    if (!userId || !from) {
      return NextResponse.json({ error: 'Missing userId or from' }, { status: 400 })
    }

    const messages = await getMessagesForContact(userId, from, limit)

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length,
    })
  } catch (error) {
    console.error('[messages] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
