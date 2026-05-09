import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import https from 'https'
import {
  serverGetBusinessByUserId,
  serverGetProducts,
  serverGetConversation,
  serverUpsertConversation,
  serverCreateOrder,
} from '@/lib/firebase-server'
import { runAI } from '@/lib/ai'
import type { Message } from '@/lib/types'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

const GATEWAY_URL = (() => {
  let url = process.env.WHATSAPP_GATEWAY_URL
  if (!url) {
    console.warn('[webhook] WHATSAPP_GATEWAY_URL not configured')
    return null
  }
  
  // Ensure URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }
  
  // Remove trailing slash
  url = url.replace(/\/$/, '')
  
  return url
})()

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})

const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY

/**
 * WhatsApp Webhook - Receives messages from aromsg gateway
 * Gateway sends: { userId, from, text, messageId, timestamp, apiKey }
 * 
 * Flow:
 * 1. Validate gateway API key
 * 2. Load business & conversation history from Firestore (maintains session)
 * 3. Process message through AI with full conversation context
 * 4. Save updated conversation back to Firestore
 * 5. Send response via gateway
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, from, text: incomingMessage, messageId, timestamp, apiKey } = body

    // Validate required fields
    if (!userId || !from || !incomingMessage?.trim()) {
      return NextResponse.json(
        { error: 'Invalid webhook payload: missing userId, from, or text' },
        { status: 400 }
      )
    }

    // Validate gateway API key for security
    if (!apiKey || apiKey !== GATEWAY_API_KEY) {
      console.error('[WhatsApp Webhook] Unauthorized: invalid API key')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[WhatsApp Webhook] Message from ${from}: ${incomingMessage}`)

    // 1. Get business config by userId - validates the business exists
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
          apiKey: GATEWAY_API_KEY,
        },
        { timeout: 5000, httpsAgent }
      ).catch(console.error)

      return NextResponse.json({ success: true })
    }

    // 2. Create/update session tracking in Firestore
    await setDoc(
      doc(db, 'whatsapp_sessions', `${userId}_${from}`),
      {
        userId,
        contactPhone: from,
        lastMessage: incomingMessage,
        lastMessageAt: Date.now(),
        messageCount: (await serverGetConversation(business.id, from))?.messages?.length ?? 0,
        status: 'active',
        updatedAt: Date.now(),
      },
      { merge: true }
    )

    // 3. Load products
    const products = await serverGetProducts(business.id)

    // 4. Load conversation history (SESSION CONTEXT MAINTAINED HERE)
    const existing = await serverGetConversation(business.id, from)
    const history: Message[] = existing?.messages ?? []
    const currentState = existing?.state ?? 'browsing'

    console.log(`[WhatsApp Webhook] Loaded ${history.length} messages from conversation history`)

    // 5. Run AI with full conversation context
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

    // 6. Create order if intent detected
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

    // 7. Persist updated conversation (MAINTAINS SESSION FOR NEXT MESSAGE)
    const updatedMessages: Message[] = [
      ...history,
      { role: 'user', content: incomingMessage, timestamp: timestamp || Date.now() },
      { role: 'assistant', content: reply, timestamp: Date.now() },
    ].slice(-40) // Keep last 40 messages for context window

    await serverUpsertConversation(business.id, from, updatedMessages, newState)

    // 8. Send response back via gateway
    try {
      await axios.post(
        `${GATEWAY_URL}/send-message`,
        {
          userId,
          to: from,
          text: reply,
          apiKey: GATEWAY_API_KEY,
        },
        { timeout: 10000, httpsAgent }
      )
      console.log(`[WhatsApp Webhook] Response sent to ${from}`)
    } catch (err) {
      console.error('[WhatsApp Webhook] Failed to send response via gateway:', err)
    }

    return NextResponse.json({ 
      success: true,
      sessionActive: true,
      conversationLength: updatedMessages.length,
    })
  } catch (err) {
    console.error('[WhatsApp Webhook Error]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', webhook: 'ready' })
}
