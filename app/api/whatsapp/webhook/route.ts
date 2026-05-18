import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { saveMessageDoc, getBusinessDoc, getProductsServer } from '@/lib/firestore-server'

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:3001'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'openrouter/free'

export async function POST(request: NextRequest) {
  try {
    console.log('[webhook] 📨 POST received from gateway')
    
    // ========================
    // AUTHENTICATION
    // ========================
    const authHeader = request.headers.get('authorization')
    const expectedKey = INTERNAL_API_KEY

    if (!expectedKey) {
      console.error('[webhook] ❌ Server misconfigured: missing INTERNAL_API_KEY')
      return NextResponse.json(
        { error: 'Server misconfigured: missing INTERNAL_API_KEY' },
        { status: 500 }
      )
    }

    if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== expectedKey) {
      console.log('[webhook] ❌ AUTH FAIL - Unauthorized webhook attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, from, text, platform, messageId, timestamp } = body

    console.log('[webhook] ✅ Auth validated')
    console.log('[webhook] 📋 Webhook payload:', JSON.stringify(body, null, 2))

    if (!userId || !from || !text || !platform || !messageId || !timestamp) {
      console.warn('[webhook] ⚠️ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: userId, from, text, platform, messageId, timestamp' },
        { status: 400 }
      )
    }

    // Normalize JID - strip @s.whatsapp.net or @lid
    const phoneNumber = from.replace('@s.whatsapp.net', '').replace('@lid', '')
    const normalizedJid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`

    console.log('[webhook] 📍 Contact:', phoneNumber, '| Message:', text.substring(0, 50) + (text.length > 50 ? '...' : ''))

    // ========================
    // 1. SAVE INCOMING MESSAGE
    // ========================
    console.log('[webhook] 💾 Saving incoming message to Firestore')
    try {
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
      console.log('[webhook] ✅ Incoming message persisted')
    } catch (err) {
      console.error('[webhook] ⚠️ Failed to save incoming message:', err)
    }

    // ========================
    // 2. FETCH BUSINESS CONFIG & PRODUCTS
    // ========================
    console.log('[webhook] 📦 Loading business config...')
    const business = await getBusinessDoc(userId)
    if (!business) {
      console.error('[webhook] ❌ Business not found for userId:', userId)
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }
    console.log('[webhook] ✅ Business loaded:', business.name)

    let productsContext = ''
    try {
      const products = await getProductsServer(userId)
      if (products && products.length > 0) {
        console.log(`[webhook] 🛍️ Found ${products.length} products`)
        productsContext = '\n\nAvailable products:\n' +
          products
            .map((p: any) => `- ${p.name} ($${p.price}${p.negotiationEnabled ? ', negotiable' : ''}): ${p.description}`)
            .join('\n')
      } else {
        console.log('[webhook] ℹ️ No products configured')
      }
    } catch (err) {
      console.error('[webhook] ⚠️ Error fetching products:', err)
    }

    // ========================
    // 3. GENERATE AI RESPONSE
    // ========================
    console.log('[webhook] 🤖 Generating AI reply...')
    const personality = business.aiPersonality?.trim() ||
      'You are a friendly and professional sales agent. Help customers find the right product and guide them toward a purchase.'

    const systemPrompt =
      `You are an AI sales assistant for ${business.name}.\n\n` +
      `${personality}${productsContext}\n\n` +
      `Keep replies concise (1-3 sentences). Never make up product info. Never reveal you are an AI unless asked.`

    let aiReplyText = ''

    try {
      const model = business.openrouterModel || DEFAULT_MODEL
      console.log(`[webhook] 🧠 Model: ${model}`)

      const { text: generated } = await generateText({
        model,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
        maxOutputTokens: 300,
        temperature: 0.7,
      })

      aiReplyText = generated.trim()
      console.log('[webhook] ✅ AI reply generated:', aiReplyText)
    } catch (aiErr) {
      console.error('[webhook] ❌ AI generation failed:', aiErr)
      aiReplyText = `Hi! Thanks for reaching out to ${business.name}. We'll get back to you shortly.`
      console.log('[webhook] ⚠️ Using fallback response')
    }

    // ========================
    // 4. SAVE AI RESPONSE
    // ========================
    console.log('[webhook] 💾 Saving AI response to Firestore')
    try {
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
      console.log('[webhook] ✅ AI response persisted')
    } catch (err) {
      console.error('[webhook] ⚠️ Failed to save AI response:', err)
    }

    // ========================
    // 5. SEND REPLY VIA GATEWAY
    // ========================
    console.log('[webhook] 📤 Queuing delivery to gateway...')
    try {
      const response = await fetch(`${GATEWAY_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          to: normalizedJid,  // Send normalized JID to gateway
          text: aiReplyText,
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        console.log(`[webhook] ✅ Message queued for delivery to ${phoneNumber}`)
      } else {
        const errorText = await response.text()
        console.warn(`[webhook] ⚠️ Gateway returned ${response.status}: ${errorText}`)
      }
    } catch (err) {
      console.error('[webhook] ❌ Failed to queue message:', err)
    }

    // ========================
    // 6. RESPOND TO GATEWAY
    // ========================
    console.log('[webhook] 🎯 Webhook complete - returning success')
    return NextResponse.json({
      success: true,
      reply: aiReplyText,
      contactJid: phoneNumber,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    console.error('[webhook] ❌ Unhandled error:', msg, err)
    return NextResponse.json({ error: msg, success: false }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('[webhook] 🏥 Health check requested')
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        config: {
          pass: !!INTERNAL_API_KEY && !!GATEWAY_URL && !!DEFAULT_MODEL,
          details: 'Required environment variables configured'
        },
        gateway: {
          pass: false,
          details: 'Gateway connection status unknown'
        }
      },
      version: '1.0.0'
    }

    // Test gateway connectivity
    try {
      const gatewayTest = await fetch(`${GATEWAY_URL}/status/health`, {
        signal: AbortSignal.timeout(5000)
      })
      health.checks.gateway.pass = gatewayTest.ok
      health.checks.gateway.details = `Gateway status: ${gatewayTest.status}`
      if (!gatewayTest.ok) {
        health.status = 'degraded'
      }
    } catch (err) {
      health.checks.gateway.pass = false
      health.checks.gateway.details = `Gateway unreachable: ${err instanceof Error ? err.message : 'unknown error'}`
      health.status = 'degraded'
    }

    const statusCode = health.status === 'healthy' ? 200 : 503
    console.log(`[webhook] 🏥 Health check complete: ${health.status}`)
    
    return NextResponse.json(health, { status: statusCode })
  } catch (err) {
    console.error('[webhook] ❌ Health check failed:', err)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
