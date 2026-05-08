import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/whatsapp/qr
 * Returns current QR code for scanning
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // TODO: Implement QR code retrieval
    // 1. Query WhatsApp gateway service for current QR
    // 2. Return QR string (not data URL - convert on frontend)
    // 3. Check if QR is expired (>60 seconds)
    // 4. Generate new QR if expired

    return NextResponse.json({
      qrCode: 'mock-qr-string-for-testing',
      expiresIn: 60,
    })
  } catch (error) {
    console.error('[whatsapp-qr] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get QR code' },
      { status: 500 }
    )
  }
}
