import { NextRequest, NextResponse } from 'next/server'
import { runAI } from '@/lib/ai'
import { getTestgroundConfig, getTestgroundProducts } from '@/lib/firestore'

/**
 * Admin Testground Webhook
 * Receives Twilio sandbox messages and processes through AI using testground config
 * 
 * Query params:
 * - adminId: The admin user ID (to load testground config + products from Firestore)
 * 
 * Twilio sends (urlencoded):
 * - From: Sender phone (e.g. whatsapp:+1234567890)
 * - To: Receiver phone (e.g. whatsapp:+14155238886)
 * - Body: Message text
 */

function parseForm(body: string): Record<string, string> {
  const params = new URLSearchParams(body)
  const obj: Record<string, string> = {}
  for (const [key, value] of params.entries()) {
    obj[key] = value
  }
  return obj
}

function escapeXML(str: string = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function twimlResponse(message: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXML(message)}</Message>
</Response>`
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

export async function GET(request: NextRequest) {
  return new NextResponse('AVA Testground webhook live', { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio urlencoded payload
    const bodyText = await request.text()
    const body = parseForm(bodyText)

    const userMessage = (body.Body || body.body || '').trim()
    const from = body.From || body.from || 'unknown'
    const adminId = body.adminId || body.admin_id

    console.log('[testground-webhook] Message from', from, ':', userMessage)

    if (!userMessage) {
      return twimlResponse('Please provide a message.')
    }

    // Load testground config and products
    let config, products
    
    if (adminId) {
      // If adminId provided, load that specific admin's config
      try {
        [config, products] = await Promise.all([
          getTestgroundConfig(adminId),
          getTestgroundProducts(adminId),
        ])
      } catch (err) {
        console.warn('[testground-webhook] Failed to load admin config, using defaults:', err)
        config = await getTestgroundConfig('default')
        products = []
      }
    } else {
      // No adminId provided - use default testground config
      config = await getTestgroundConfig('default')
      products = []
    }

    console.log('[testground-webhook] Using config:', {
      model: config.selectedModel,
      productCount: products.length,
      businessName: config.businessName,
    })

    // Process through AI with loaded config
    const aiOutput = await runAI({
      message: userMessage,
      products,
      conversationHistory: [],
      conversationState: 'browsing',
      businessConfig: {
        name: config.businessName,
        aiPersonality: config.aiPersonality,
        id: 'testground',
        email: 'admin@testground',
        createdAt: Date.now(),
      },
      model: config.selectedModel,
    })

    console.log('[testground-webhook] AI response generated:', {
      hasOrderIntent: !!aiOutput.orderIntent,
      replyLength: aiOutput.reply.length,
    })

    // Return only the reply text in TwiML
    return twimlResponse(aiOutput.reply)
  } catch (error) {
    console.error('[testground-webhook] Error:', error)
    return twimlResponse(`I&apos;m having trouble right now. Please try again in a moment.`)
  }
}
