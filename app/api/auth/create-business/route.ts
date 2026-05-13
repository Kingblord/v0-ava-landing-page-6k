import { NextRequest, NextResponse } from 'next/server'
import { createBusinessDoc, getBusinessDoc } from '@/lib/firestore-server'

export async function POST(req: NextRequest) {
  try {
    const { uid, email, businessName } = await req.json()

    // Validate inputs
    if (!uid || !email || !businessName) {
      console.error('[v0] API: Missing required fields', { uid: !!uid, email: !!email, businessName: !!businessName })
      return NextResponse.json(
        { error: 'Missing required fields: uid, email, businessName' },
        { status: 400 },
      )
    }

    if (!businessName.trim()) {
      return NextResponse.json(
        { error: 'Business name cannot be empty' },
        { status: 400 },
      )
    }

    console.log('[v0] API: Creating business document for:', uid, 'email:', email, 'business:', businessName.trim())

    const businessData = {
      id: uid,
      name: businessName.trim(),
      email,
      whatsappPhone: '',
      whatsappConnected: false,
      openrouterModel: 'openai/gpt-4o-mini',
      avatarUrl: '',
      aiPersonality: 'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Create document using Admin SDK
    await createBusinessDoc(uid, businessData)
    console.log('[v0] API: Business document write initiated for:', uid)

    // Verify document was actually written (retry up to 3 times)
    let verified = false
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)))
      const doc = await getBusinessDoc(uid)
      if (doc) {
        console.log('[v0] API: Business document verified in Firestore at attempt', attempt + 1)
        verified = true
        break
      }
    }

    if (!verified) {
      console.warn('[v0] API: Could not verify business document write immediately (may still succeed)')
    }

    console.log('[v0] API: Business document created successfully')
    return NextResponse.json({
      success: true,
      message: 'Business document created',
      uid,
      name: businessData.name,
      email,
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[v0] API: Error creating business document:', errorMsg, err)
    return NextResponse.json(
      { error: errorMsg || 'Failed to create business document' },
      { status: 500 },
    )
  }
}
