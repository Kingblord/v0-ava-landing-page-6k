import { NextRequest, NextResponse } from 'next/server'
import { runAI } from '@/lib/ai'
import { getTestgroundConfig, getTestgroundProducts } from '@/lib/firestore'
import type { Product } from '@/lib/types'

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

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    description: '6.9" display, A18 Pro chip, advanced camera system with 5x optical zoom, titanium design',
    price: 1199,
    minPrice: 1000,
    businessId: 'testground',
    negotiationEnabled: true,
    createdAt: Date.now(),
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    description: '6.3" display, A18 Pro chip, dual camera system, titanium design with action button',
    price: 999,
    minPrice: 850,
    businessId: 'testground',
    negotiationEnabled: true,
    createdAt: Date.now(),
  },
  {
    id: 'iphone-16',
    name: 'iPhone 16',
    description: '6.1" display, A18 chip, dual rear cameras, all-day battery life',
    price: 799,
    minPrice: 699,
    businessId: 'testground',
    negotiationEnabled: true,
    createdAt: Date.now(),
  },
  {
    id: 'iphone-16-plus',
    name: 'iPhone 16 Plus',
    description: '6.7" display, A18 chip, extended battery life, dual camera system',
    price: 899,
    minPrice: 799,
    businessId: 'testground',
    negotiationEnabled: true,
    createdAt: Date.now(),
  },
]

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

    // Load testground config and products with fallback
    let config, products

    try {
      if (adminId) {
        // If adminId provided, load that specific admin's config
        [config, products] = await Promise.all([
          getTestgroundConfig(adminId),
          getTestgroundProducts(adminId),
        ])
      } else {
        // No adminId provided - use default testground config
        config = await getTestgroundConfig('default')
        products = []
      }

      // Use fallback products if none loaded from database
      if (!products || products.length === 0) {
        console.log('[testground-webhook] No products in database, using fallback iPhone products')
        products = FALLBACK_PRODUCTS
      }
    } catch (err) {
      console.warn('[testground-webhook] Failed to load config/products, using defaults:', err)
      config = {
        selectedModel: 'openai/gpt-4o-mini',
        businessName: 'Test Store',
        aiPersonality: 'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision. Be concise, warm, and human.',
      }
      products = FALLBACK_PRODUCTS
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
