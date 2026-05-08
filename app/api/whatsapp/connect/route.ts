import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/whatsapp/connect
 * Initiates WhatsApp connection by creating a new Baileys session
 * Returns QR code for scanning
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // TODO: Implement Baileys session creation
    // 1. Call WhatsApp gateway service to create session
    // 2. Generate QR code
    // 3. Store session state in Firestore
    // 4. Return status

    return NextResponse.json({
      success: true,
      status: 'qr_pending',
      message: 'WhatsApp connection initiated. Scan QR code.',
    })
  } catch (error) {
    console.error('[connect-whatsapp] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect WhatsApp' },
      { status: 500 }
    )
  }
}
