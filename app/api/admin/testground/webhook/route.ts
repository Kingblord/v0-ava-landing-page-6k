import { NextRequest, NextResponse } from 'next/server'
import { serverGetTestgroundConfig } from '@/lib/firebase-server'
import { runAI } from '@/lib/ai'

/**
 * Admin Testground Webhook
 * Receives Twilio sandbox messages and processes through AI using testground config
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

    console.log('[testground-webhook] Message from', from, ':', userMessage)

    if (!userMessage) {
      return twimlResponse('Please provide a message.')
    }

    // Load testground config and products from Firestore
    // Note: adminId is no longer required/used
    const config = await serverGetTestgroundConfig('')
    console.log('[testground-webhook] Config loaded:', {
      model: config.selectedModel,
      productCount: config.products.length,
      businessName: config.businessName,
    })

    // Process through AI with loaded config
    const aiOutput = await runAI({
      message: userMessage,
      products: config.products,
      conversationHistory: [],
      conversationState: 'browsing',
      businessConfig: {
        name: config.businessName,
        aiPersonality: config.aiPersonality,
        id: '',
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
    const msg = error instanceof Error ? error.message : 'Unknown error occurred'
    return twimlResponse(`Error: ${msg}`)
  }
}