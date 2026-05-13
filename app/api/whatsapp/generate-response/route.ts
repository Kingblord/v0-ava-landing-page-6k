import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

/**
 * POST /api/whatsapp/generate-response
 * Generates AI response to WhatsApp messages using the business's AI personality
 * Uses the configured AI model from the business settings
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, businessName, aiPersonality, customerMessage, aiModel } = await request.json()

    if (!userId || !businessName || !customerMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, businessName, customerMessage' },
        { status: 400 }
      )
    }

    console.log('[v0] Generating AI response for:', businessName)

    const systemPrompt = `You are an AI assistant for ${businessName}.

${aiPersonality || 'You are a friendly and professional sales agent.'}

Respond to customer inquiries helpfully and professionally. Keep responses concise and relevant to the customer's question. Be conversational and warm.`

    const { text: response } = await generateText({
      model: openai(aiModel || 'gpt-4o-mini'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: customerMessage,
        },
      ],
      temperature: 0.7,
      maxTokens: 300,
    })

    console.log('[v0] AI response generated successfully')

    return NextResponse.json({
      success: true,
      response,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to generate response'
    console.error('[v0] AI generation error:', errorMsg)
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
