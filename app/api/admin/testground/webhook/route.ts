import { NextRequest, NextResponse } from 'next/server'
import { runAI } from '@/lib/ai'
import type { Product, Message, ConversationState } from '@/lib/types'

/**
 * Admin Testground Webhook
 * Allows admins to test AI responses using dynamically selected models
 * and temporary test products without hitting the real business database.
 */

function parseTwilioBody(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const pair of text.split('&')) {
    const [key, ...rest] = pair.split('=')
    result[decodeURIComponent(key)] = decodeURIComponent(rest.join('=').replace(/\+/g, ' '))
  }
  return result
}

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
    const bodyText = await request.text()
    const body = parseTwilioBody(bodyText)

    const incomingMessage = body['Body']?.trim()
    const model = body['model']?.trim() || 'openai/gpt-4o-mini'
    const productsJson = body['products']?.trim() || '[]'
    const businessName = body['businessName']?.trim() || 'Test Store'
    const aiPersonality = body['aiPersonality']?.trim() || 'You are a friendly sales agent.'
    const conversationStateStr = body['conversationState']?.trim() || 'browsing'
    const messagesJson = body['messages']?.trim() || '[]'

    if (!incomingMessage) {
      return twimlResponse('Please provide a message.')
    }

    let products: Product[] = []
    let messages: Message[] = []
    let conversationState: ConversationState = 'browsing'

    try {
      products = JSON.parse(productsJson)
      messages = JSON.parse(messagesJson)
      conversationState = conversationStateStr as ConversationState
    } catch {
      return twimlResponse('Invalid JSON in request parameters.')
    }

    // Build conversation history
    const history: Message[] = [
      ...messages,
      { role: 'user', content: incomingMessage, timestamp: Date.now() },
    ]

    // Run AI with specified model and convert products to Message format
    const aiResponse = await runAI({
      message: incomingMessage,
      products,
      conversationHistory: history,
      conversationState,
      businessConfig: {
        name: businessName,
        aiPersonality: aiPersonality,
      },
      model, // Pass the selected model
    })

    return twimlResponse(aiResponse)
  } catch (error) {
    console.error('[testground-webhook] Error:', error)
    return twimlResponse('An error occurred. Please try again.')
  }
}
