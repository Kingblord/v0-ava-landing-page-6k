import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { saveMessageDoc, getBusinessDoc, getProductsServer } from '@/lib/firestore-server'

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:3001'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'openrouter/free'


/**
 * Official Baileys-style JID Normalizer
 */
function normalizeJid(jid: string): string {
  if (!jid) return jid;

  if (jid.includes('@')) {
    if (jid.endsWith('@lid')) {
      return jid.replace('@lid', '@s.whatsapp.net');
    }
    return jid;
  }

  // Raw number
  let clean = jid.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = clean.slice(1);
  return `${clean}@s.whatsapp.net`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[webhook] 📨 POST received from gateway')
   
    const authHeader = request.headers.get('authorization')
    const expectedKey = INTERNAL_API_KEY

    if (!expectedKey) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing INTERNAL_API_KEY' },
        { status: 500 }
      )
    }

    if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== expectedKey) {
      console.log('[webhook] ❌ AUTH FAIL')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, from, text, platform, messageId, timestamp } = body

    console.log('[webhook] ✅ Auth validated. Message from:', from, '| Text:', text)

    if (!userId || !from || !text || !platform || !messageId || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // === IMPROVED JID NORMALIZATION ===
    const normalizedFrom = normalizeJid(from);
    const contactJid = normalizedFrom;           // Keep full JID for logging
    const phoneNumber = normalizedFrom.replace('@s.whatsapp.net', '');

    console.log('[webhook] 📍 Normalized JID:', normalizedFrom);

    // 1. Save incoming customer message
    console.log('[webhook] 💾 Saving incoming message to Firestore')
    await saveMessageDoc(userId, {
      contactJid: phoneNumber,
      from: phoneNumber,
      to: userId,
      text,
      role: 'user',
      platform,
      messageId,
      timestamp: Number(timestamp),
      direction: 'incoming',
    })
    console.log('[webhook] ✅ Incoming message saved')

    // 2. Fetch business profile
    const business = await getBusinessDoc(userId)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }
    console.log('[webhook] 📦 Business loaded:', business.name)

    // 2b. Fetch products for context
    let productsContext = ''
    try {
      const products = await getProductsServer(userId)
      if (products.length > 0) {
        console.log('[webhook] 🛍️ Found', products.length, 'products')
        productsContext = '\n\nAvailable products:\n' +
          products
            .map((p) => `- ${p.name} ($${p.price}${p.negotiationEnabled ? ', negotiable' : ''}): ${p.description}`)
            .join('\n')
      }
    } catch (err) {
      console.error('[webhook] ⚠️ Error fetching products:', err)
    }

    // 3. Generate AI reply
    console.log('[webhook] 🤖 Generating AI response...')
    const personality = business.aiPersonality?.trim() || 
      'You are a friendly and professional sales agent.'

    const systemPrompt = 
      `You are an AI sales assistant for ${business.name}.\n\n` +
      `${personality}${productsContext}\n\n` +
      `Keep your replies concise (1-3 short sentences) and conversational. ` +
      `Do not make up product information. Never reveal that you are an AI unless asked.`

    let aiReplyText: string

    try {
      const model = business.openrouterModel || DEFAULT_MODEL
      console.log('[webhook] 🧠 Using model:', model)

      const { text: generated } = await generateText({
        model,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
        maxOutputTokens: 300,
        temperature: 0.7,
      })

      aiReplyText = generated.trim()
      console.log('[webhook] ✅ AI response generated:', aiReplyText)
    } catch (aiErr) {
      console.error('[webhook] ❌ AI generation error:', aiErr)
      aiReplyText = `Hi! Thanks for reaching out to ${business.name}. We'll get back to you shortly.`
    }

    // 4. Save AI reply to Firestore
    console.log('[webhook] 💾 Saving AI response to Firestore')
    await saveMessageDoc(userId, {
      contactJid: phoneNumber,
      from: userId,
      to: phoneNumber,
      text: aiReplyText,
      role: 'assistant',
      platform,
      messageId: `ai_${Date.now()}`,
      timestamp: Date.now(),
      direction: 'outgoing',
    })
    console.log('[webhook] ✅ AI response saved')

    // 5. Send reply via Gateway
    console.log('[webhook] 📤 Sending reply to gateway...')
    try {
      const response = await fetch(`${GATEWAY_URL}/send-message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Authorization not needed if your gateway doesn't require it for internal calls
        },
        body: JSON.stringify({
          userId,
          to: normalizedFrom,        // ← Send full normalized JID (best practice)
          text: aiReplyText,
        }),
      });

      if (!response.ok) {
        console.warn(`[webhook] ⚠️ Gateway responded with status: ${response.status}`);
      } else {
        console.log(`[webhook] ✅ Reply successfully queued to ${normalizedFrom}`);
      }
    } catch (sendErr) {
      console.error('[webhook] ❌ Gateway delivery failed:', sendErr);
    }

    return NextResponse.json({ success: true, reply: aiReplyText })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    console.error('[webhook] ❌ Unhandled error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', webhook: 'ready' })
}
