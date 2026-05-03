import { NextRequest, NextResponse } from 'next/server'
import {
  serverGetBusinessByPhone,
  serverGetProducts,
  serverGetConversation,
  serverUpsertConversation,
  serverCreateOrder,
} from '@/lib/firebase-server'
import { runAI } from '@/lib/ai'
import type { Message } from '@/lib/types'

/**
 * Twilio sends application/x-www-form-urlencoded POST requests.
 * We parse the body manually to avoid a dependency on the `qs` package in this route.
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
    const fromNumber = body['From']?.trim()  // e.g. whatsapp:+2348012345678
    const toNumber = body['To']?.trim()      // e.g. whatsapp:+14155238886

    if (!incomingMessage || !fromNumber || !toNumber) {
      return twimlResponse('Sorry, I could not read your message.')
    }

    // 1. Identify business by the Twilio number this message was sent TO
    const business = await serverGetBusinessByPhone(toNumber)
    if (!business) {
      return twimlResponse("This number isn't set up yet. Please contact the business directly.")
    }

    // 2. Load products
    const products = await serverGetProducts(business.id)

    // 3. Load or create conversation
    const existing = await serverGetConversation(business.id, fromNumber)
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
      },
    })

    // 5. Persist order if intent detected
    if (orderIntent) {
      await serverCreateOrder({
        businessId: business.id,
        userId: fromNumber,
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
      { role: 'user', content: incomingMessage, timestamp: Date.now() },
      { role: 'assistant', content: reply, timestamp: Date.now() },
    ].slice(-40) // keep last 40 messages

    await serverUpsertConversation(business.id, fromNumber, updatedMessages, newState)

    // 7. Return TwiML
    return twimlResponse(reply)
  } catch (err) {
    console.error('[AVA Webhook Error]', err)
    return twimlResponse("I'm having trouble right now. Please try again in a moment.")
  }
}

// Twilio also sends a GET for sandbox verification
export async function GET() {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml' } },
  )
}
