import { NextRequest, NextResponse } from 'next/server'
import { serverGetTestgroundConfig } from '@/lib/firebase-server'
import { runAI } from '@/lib/ai'

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

function twimlResponse(message: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message>
</Response>`
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Extract admin ID from query params
    const adminId = request.nextUrl.searchParams.get('adminId')
    if (!adminId) {
      return twimlResponse('Error: Missing adminId parameter')
    }

    // Parse Twilio urlencoded payload
    const formData = await request.formData()
    const incomingMessage = formData.get('Body') as string
    const from = formData.get('From') as string

    if (!incomingMessage) {
      return twimlResponse('Please provide a message.')
    }

    console.log('[testground-webhook] Received message from', from, ':', incomingMessage)

    // Load testground config and products from Firestore
    const config = await serverGetTestgroundConfig(adminId)
    console.log('[testground-webhook] Config loaded:', { model: config.selectedModel, productCount: config.products.length })

    // Process through AI with loaded config
    const aiOutput = await runAI({
      message: incomingMessage,
      products: config.products,
      conversationHistory: [],
      conversationState: 'browsing',
      businessConfig: {
        name: config.businessName,
        aiPersonality: config.aiPersonality,
        id: adminId,
        email: 'admin@testground',
        createdAt: Date.now(),
      },
      model: config.selectedModel,
    })

    console.log('[testground-webhook] AI response generated, orderIntent:', !!aiOutput.orderIntent)

    // Return only the reply text in TwiML
    return twimlResponse(aiOutput.reply)
  } catch (error) {
    console.error('[testground-webhook] Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return twimlResponse(`Error: ${msg}`)
  }
}
