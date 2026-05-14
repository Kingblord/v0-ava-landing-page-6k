import { NextRequest, NextResponse } from 'next/server'
import { createBusinessDoc } from '@/lib/firestore-server'

export async function POST(req: NextRequest) {
  try {
    const { uid, email, businessName } = await req.json()

    if (!uid || !email || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, email, businessName' },
        { status: 400 },
      )
    }

    console.log('[v0] API: Creating business document for:', uid)

    const businessData = {
      id: uid,
      name: businessName,
      email,
      whatsappPhone: '',
      whatsappConnected: false,
      openrouterModel: 'openai/gpt-4o-mini',
      avatarUrl: '',
      aiPersonality:
        'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision.',
      createdAt: Date.now(),
    }

    // Use Admin SDK to create the document
    await createBusinessDoc(uid, businessData)

    console.log('[v0] API: Business document created successfully')
    return NextResponse.json({ success: true, message: 'Business document created' })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[v0] API: Error creating business document:', errorMsg)
    return NextResponse.json(
      { error: errorMsg || 'Failed to create business document' },
      { status: 500 },
    )
  }
}
