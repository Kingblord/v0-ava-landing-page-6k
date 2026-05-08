import { NextRequest, NextResponse } from 'next/server'
import { runAI } from '@/lib/ai'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * POST /api/whatsapp/process-message
 * Called by the WhatsApp bot server to process incoming messages through AI
 * This endpoint receives the message, processes it, and returns the AI response
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, userMessage, remoteJid, business } = await request.json()

    if (!userId || !userMessage || !remoteJid || !business) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userMessage, remoteJid, business' },
        { status: 400 }
      )
    }

    // Process message through AI
    const aiOutput = await runAI({
      message: userMessage,
      products: business.products || [],
      conversationHistory: [],
      conversationState: 'browsing',
      businessConfig: business,
      model: business.aiModel || 'openai/gpt-4o-mini',
    })

    // Log conversation to Firestore
    await setDoc(
      doc(db, 'whatsapp_conversations', `${userId}_${Date.now()}`),
      {
        userId,
        remoteJid,
        userMessage,
        aiResponse: aiOutput.reply,
        orderIntent: aiOutput.orderIntent || null,
        conversationState: aiOutput.newState || 'browsing',
        createdAt: Date.now(),
      },
      { merge: true }
    )

    console.log(`[process-message] Processed message for ${userId} from ${remoteJid}`)

    return NextResponse.json({
      reply: aiOutput.reply,
      orderIntent: aiOutput.orderIntent,
      newState: aiOutput.newState,
    })
  } catch (error) {
    console.error('[process-message] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process message' },
      { status: 500 }
    )
  }
}
