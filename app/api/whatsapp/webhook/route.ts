import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { saveMessageDoc, getBusinessDoc } from '@/lib/firestore-server'

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:3001'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

/**
 * WhatsApp Webhook - POST /api/whatsapp/webhook
 * Receives messages from the WhatsApp gateway.
 * 
 * Flow:
 * 1. Validate INTERNAL_API_KEY
 * 2. Save incoming message to Firestore
 * 3. Generate AI reply
 * 4. Save AI reply to Firestore
 * 5. Queue message delivery via gateway /send-message
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedKey = INTERNAL_API_KEY

    if (!expectedKey) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing INTERNAL_API_KEY' },
        { status: 500 }
      )
    }

    if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== expectedKey) {
      console.log('[webhook] AUTH FAIL - sent:', authHeader?.slice(7), 'expected:', expectedKey)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, from, text, platform, messageId, timestamp } = body

    if (!userId || !from || !text || !platform || !messageId || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, from, text, platform, messageId, timestamp' },
        { status: 400 }
      )
    }

    // Normalise the contact JID
    const normalizedFrom = from.endsWith('@s.whatsapp.net')
      ? from
      : from.endsWith('@lid')
        ? `${from.replace('@lid', '')}@s.whatsapp.net`
        : `${from}@s.whatsapp.net`

    const contactJid = normalizedFrom.replace('@s.whatsapp.net', '')

    // 1. Save incoming customer message
    await saveMessageDoc(userId, {
      contactJid,
      from: contactJid,
      to: userId,
      text,
      role: 'user',
      platform,
      messageId,
      timestamp: Number(timestamp),
      direction: 'incoming',
    })

    // 2. Fetch business profile
    const business = await getBusinessDoc(userId)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // 3. Generate AI reply
    const personality =
      business.aiPersonality?.trim() ||
      'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision.'

    const systemPrompt =
      `You are an AI sales assistant for ${business.name}.\n\n` +
      `${personality}\n\n` +
      `Keep your replies concise (1-3 short sentences) and conversational. ` +
      `Do not make up product information you don't have. ` +
      `Never reveal that you are an AI unless directly asked.`

    let aiReplyText: string

    try {
      const { text: generated } = await generateText({
        model: 'openai/gpt-4o-mini',
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
        maxOutputTokens: 300,
        temperature: 0.7,
      })
      aiReplyText = generated.trim()
    } catch (aiErr) {
      console.error('[webhook] AI generation error:', aiErr)
      aiReplyText = `Hi! Thanks for reaching out to ${business.name}. We'll get back to you shortly.`
    }

    // 4. Save AI reply to Firestore
    await saveMessageDoc(userId, {
      contactJid,
      from: userId,
      to: contactJid,
      text: aiReplyText,
      role: 'assistant',
      platform,
      messageId: `ai_${Date.now()}`,
      timestamp: Date.now(),
      direction: 'outgoing',
    })

    // 5. Queue delivery via gateway (fire-and-forget)
    setTimeout(() => {
      fetch(`${GATEWAY_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          to: contactJid,
          text: aiReplyText,
        }),
      }).catch((err) => console.error('[webhook] Gateway delivery failed:', err))
    }, 100)

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    console.error('[webhook] Unhandled error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', webhook: 'ready' })
}
