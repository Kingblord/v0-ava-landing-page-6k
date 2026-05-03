import { NextRequest, NextResponse } from 'next/server'
import { serverGetConversations, serverGetConversation, serverUpsertConversation } from '@/lib/firebase-server'
import type { ConversationState, Message } from '@/lib/types'

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get('businessId')
  const userId = request.nextUrl.searchParams.get('userId')

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  try {
    if (userId) {
      // Single conversation
      const conversation = await serverGetConversation(businessId, userId)
      return NextResponse.json({ conversation })
    }
    // All conversations for a business
    const conversations = await serverGetConversations(businessId)
    return NextResponse.json({ conversations })
  } catch (err) {
    console.error('[/api/conversations GET]', err)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, userId, messages, state } = body as {
      businessId: string
      userId: string
      messages: Message[]
      state: ConversationState
    }

    if (!businessId || !userId) {
      return NextResponse.json({ error: 'businessId and userId required' }, { status: 400 })
    }

    await serverUpsertConversation(businessId, userId, messages ?? [], state ?? 'browsing')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/conversations POST]', err)
    return NextResponse.json({ error: 'Failed to upsert conversation' }, { status: 500 })
  }
}
