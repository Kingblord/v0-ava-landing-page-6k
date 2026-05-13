import { NextRequest, NextResponse } from 'next/server'
import { saveMessageDoc, getBusinessDoc } from '@/lib/firestore-server'

/**
 * POST /api/internal/receive-message
 * Called by WhatsApp gateway when a message is received
 * Stores message and generates AI response using business personality
 * Requires INTERNAL_API_KEY authorization
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.INTERNAL_API_KEY

    if (!authHeader?.startsWith('Bearer ') || !expectedKey) {
      console.error('[v0] Unauthorized message request - missing auth')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    if (token !== expectedKey) {
      console.error('[v0] Unauthorized message request - invalid token')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { userId, from, text, platform, messageId, timestamp } = await request.json()

    if (!userId || !from || !text || !platform || !messageId || !timestamp) {
      console.error('[v0] Missing required fields in message')
      return NextResponse.json(
        { error: 'Missing required fields: userId, from, text, platform, messageId, timestamp' },
        { status: 400 }
      )
    }

    console.log('[v0] Received WhatsApp message:', { userId, from, text, platform })

    // Save incoming message to Firestore via Admin SDK
    const incomingMsg = await saveMessageDoc(userId, {
      from,
      text,
      role: 'user',
      platform,
      messageId,
      timestamp,
      direction: 'incoming',
    })

    console.log('[v0] Incoming message saved:', incomingMsg.id)

    // Get business data to fetch AI personality and settings
    const business = await getBusinessDoc(userId)
    if (!business) {
      console.error('[v0] Business not found for userId:', userId)
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    console.log('[v0] Business found:', business.name, 'AI Model:', business.openrouterModel)

    // Generate AI response using the business's configured model
    let aiResponse = ''
    try {
      console.log('[v0] Calling AI service for response generation...')
      const aiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/whatsapp/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          businessName: business.name,
          aiPersonality: business.aiPersonality || 'You are a friendly and professional sales agent.',
          customerMessage: text,
          aiModel: business.openrouterModel || 'openai/gpt-4o-mini',
        }),
      })

      if (aiRes.ok) {
        const aiData = await aiRes.json()
        aiResponse = aiData.response || "I couldn't process that request. Please try again."
        console.log('[v0] AI response generated:', aiResponse.substring(0, 100))
      } else {
        const errData = await aiRes.json().catch(() => ({}))
        console.error('[v0] AI service error:', errData)
        aiResponse = "I'm temporarily unavailable. Please try again later."
      }
    } catch (err) {
      console.error('[v0] Error calling AI service:', err)
      aiResponse = "Sorry, I'm having trouble responding right now. Please try again."
    }

    // Save AI response to Firestore via Admin SDK
    const outgoingMsg = await saveMessageDoc(userId, {
      from: userId,
      to: from,
      text: aiResponse,
      role: 'assistant',
      platform,
      timestamp: Date.now(),
      direction: 'outgoing',
    })

    console.log('[v0] AI response saved:', outgoingMsg.id)

    // Return response for gateway to send back to customer
    return NextResponse.json({
      success: true,
      incomingMessage: incomingMsg,
      aiResponse: {
        to: from,
        text: aiResponse,
        platform,
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error'
    console.error('[v0] Error receiving message:', errorMsg)
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}

