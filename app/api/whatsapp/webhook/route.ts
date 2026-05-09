import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import {
  serverGetBusinessByUserId,
  serverGetProducts,
  serverGetConversation,
  serverUpsertConversation,
  serverCreateOrder,
} from '@/lib/firebase-server'
import { runAI } from '@/lib/ai'
import type { Message } from '@/lib/types'

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:3001'

/**
 * WhatsApp Webhook - Receives messages from aromsg.render.com gateway
 * Gateway sends: { userId, from, text, platform, messageId, timestamp }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, from, text: incomingMessage, messageId, timestamp } = body

    if (!userId || !from || !incomingMessage?.trim()) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    console.log(`[WhatsApp Webhook] Message from ${from}: ${incomingMessage}`)

    // 1. Get business config by userId
    const business = await serverGetBusinessByUserId(userId)
    if (!business) {
      console.error(`[WhatsApp Webhook] Business not found for userId: ${userId}`)
      // Send error message back via gateway
      await axios.post(
        `${GATEWAY_URL}/send-message`,
        {
          userId,
          to: from,
          text: 'Business configuration not found. Please contact support.',
        },
        { timeout: 5000 }
      ).catch(console.error)
      return NextResponse.json({ success: true })
    }

    // 2. Load products
    const products = await serverGetProducts(business.id)

    // 3. Load or create conversation
    const existing = await serverGetConversation(business.id, from)
    const history: Message[] = existing?.messages ?? []
    const currentState = existing?.state ?? 'browsing'

    // 4. Run AI
    const { reply, newState, orderIntent } = await runAI({
      message: incomingMessage,
      products,
      conversationHistory: history,
      conversationState: currentState,
      businessConfig: {
        name: business.name,
        aiPersonality: business.aiPersonality,
        id: business.id,
        email: business.email,
        createdAt: business.createdAt,
      },
      model: business.aiModel,
    })

    // 5. Create order if intent detected
    if (orderIntent) {
      await serverCreateOrder({
        businessId: business.id,
        userId: from,
        productId: orderIntent.productId,
        productName: orderIntent.productName,
        amount: orderIntent.amount,
        status: 'pending',
        createdAt: Date.now(),
      })
    }

    // 6. Persist conversation
    const updatedMessages: Message[] = [
      ...history,
      { role: 'user', content: incomingMessage, timestamp },
      { role: 'assistant', content: reply, timestamp: Date.now() },
    ].slice(-40)

    await serverUpsertConversation(business.id, from, updatedMessages, newState)

    // 7. Send response back via gateway
    try {
      await axios.post(
        `${GATEWAY_URL}/send-message`,
        {
          userId,
          to: from,
          text: reply,
        },
        { timeout: 10000 }
      )
      console.log(`[WhatsApp Webhook] Response sent to ${from}`)
    } catch (err) {
      console.error('[WhatsApp Webhook] Failed to send response via gateway:', err)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[WhatsApp Webhook Error]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
