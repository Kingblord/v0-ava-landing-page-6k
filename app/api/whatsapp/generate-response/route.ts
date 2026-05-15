import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'

/**
 * POST /api/whatsapp/generate-response
 * Generates AI response to WhatsApp messages using the business's AI personality
 * Uses the configured AI model from the business settings via Vercel AI Gateway
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, businessName, aiPersonality, customerMessage, aiModel } = await request.json()

    if (!userId || !businessName || !customerMessage) {
      console.error('[v0] Missing required fields for AI generation')
      return NextResponse.json(
        { error: 'Missing required fields: userId, businessName, customerMessage' },
        { status: 400 }
      )
    }

    console.log('[v0] Generating AI response for:', businessName, 'using model:', aiModel || 'default')

    const systemPrompt = `You are an AI assistant for ${businessName}.

${aiPersonality || 'You are a friendly and professional sales agent.'}

Respond to customer inquiries helpfully and professionally. Keep responses concise and relevant to the customer's question. Be conversational and warm.`

    try {
      const { text: response } = await generateText({
        model: aiModel ? { apiIdentifier: aiModel } : { apiIdentifier: 'openai/gpt-4o-mini' },
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

      console.log('[v0] AI response generated successfully for:', businessName)

      return NextResponse.json({
        success: true,
        response,
      })
    } catch (aiErr) {
      const aiErrorMsg = aiErr instanceof Error ? aiErr.message : 'AI service error'
      console.error('[v0] AI service error:', aiErrorMsg)
      
      // Return a graceful fallback response if AI fails
      const fallbackResponse = `Hi! Thank you for reaching out to ${businessName}. I'm currently unavailable to respond immediately, but I'll get back to you as soon as possible.`
      
      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        fallback: true,
      })
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to generate response'
    console.error('[v0] Error processing AI generation request:', errorMsg)
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
