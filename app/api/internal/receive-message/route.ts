import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { saveMessageDoc, getBusinessDoc } from '@/lib/firestore-server'

// Allow up to 60 seconds — AI generation + 2 Firestore writes can exceed the default 10s
export const maxDuration = 60

/**
 * POST /api/internal/receive-message
 * Called by the WhatsApp gateway when an inbound customer message arrives.
 * 1. Validates the INTERNAL_API_KEY bearer token.
 * 2. Saves the incoming message to Firestore (Admin SDK).
 * 3. Fetches the business AI personality from Firestore.
 * 4. Generates an AI reply with generateText (Vercel AI Gateway).
 * 5. Saves the AI reply to Firestore.
 * 6. Returns the reply so the gateway can send it back via WhatsApp.
 */
export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const expectedKey = process.env.INTERNAL_API_KEY

  if (!expectedKey) {
    return NextResponse.json({ error: 'Server misconfigured: missing INTERNAL_API_KEY' }, { status: 500 })
  }

  if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: {
    userId: string
    from: string
    text: string
    platform: string
    messageId: string
    timestamp: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { userId, from, text, platform, messageId, timestamp } = body

  if (!userId || !from || !text || !platform || !messageId || !timestamp) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, from, text, platform, messageId, timestamp' },
      { status: 400 },
    )
  }

  // Normalise the contact JID — strip any WhatsApp suffix so queries are consistent.
  // Baileys may send @s.whatsapp.net or @lid — we convert @lid to @s.whatsapp.net
  // before storing, and always store the bare phone number as contactJid.
  const normalizedFrom = from.endsWith('@s.whatsapp.net')
    ? from
    : from.endsWith('@lid')
      ? `${from.replace('@lid', '')}@s.whatsapp.net`
      : `${from}@s.whatsapp.net`

  const contactJid = normalizedFrom.replace('@s.whatsapp.net', '')

  try {
    // ── 1. Save incoming customer message ─────────────────────────────────
    await saveMessageDoc(userId, {
      contactJid,          // consistent query field — always the bare number
      from:  contactJid,   // sender: the customer
      to:    userId,       // recipient: the business
      text,
      role:      'user',
      platform,
      messageId,
      timestamp: Number(timestamp),
      direction: 'incoming',
    })

    // ── 2. Fetch business profile ─────────────────────────────────────────
    const business = await getBusinessDoc(userId)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // ── 3. Generate AI reply ──────────────────────────────────────────────
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
        model:          'openai/gpt-4o-mini',
        system:         systemPrompt,
        messages:       [{ role: 'user', content: text }],
        maxOutputTokens: 300,
        temperature:    0.7,
      })
      aiReplyText = generated.trim()
    } catch (aiErr) {
      // Log but don't fail the request — send a graceful fallback
      console.error('[receive-message] AI generation error:', aiErr)
      aiReplyText =
        `Hi! Thanks for reaching out to ${business.name}. ` +
        `We'll get back to you shortly.`
    }

    // ── 4. Save AI reply ──────────────────────────────────────────────────
    await saveMessageDoc(userId, {
      contactJid,          // same consistent query field
      from:      userId,   // sender: the business / AI
      to:        contactJid,
      text:      aiReplyText,
      role:      'assistant',
      platform,
      messageId: `ai_${Date.now()}`,
      timestamp: Date.now(),
      direction: 'outgoing',
    })

    // ── 5. Return reply to gateway ────────────────────────────────────────
    return NextResponse.json({
      success: true,
      aiResponse: {
        to:   normalizedFrom,   // always @s.whatsapp.net — gateway can send to it directly
        text: aiReplyText,
        platform,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    console.error('[receive-message] Unhandled error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
