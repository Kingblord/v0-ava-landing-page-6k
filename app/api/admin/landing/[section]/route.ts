import { NextRequest, NextResponse } from 'next/server'
import { getLandingContent, saveLandingContent } from '@/lib/firestore-server'

/**
 * GET /api/admin/landing/[section]
 * Fetch landing page content section from Firestore (Admin SDK)
 */
export async function GET(request: NextRequest, { params }: { params: { section: string } }) {
  try {
    const section = params.section
    if (!section) {
      return NextResponse.json({ error: 'Missing section' }, { status: 400 })
    }

    // Import default content to pass as fallback
    const { DEFAULT_CONTENT } = await import('@/lib/content')
    const defaultSection = (DEFAULT_CONTENT as Record<string, unknown>)[section]

    if (!defaultSection) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }

    const content = await getLandingContent(section, defaultSection as Record<string, unknown>)
    return NextResponse.json({ success: true, content })
  } catch (err) {
    console.error('[v0] Error fetching landing content:', err)
    return NextResponse.json({ error: 'Failed to fetch landing content' }, { status: 500 })
  }
}

/**
 * POST /api/admin/landing/[section]
 * Save landing page content section to Firestore (Admin SDK)
 */
export async function POST(request: NextRequest, { params }: { params: { section: string } }) {
  try {
    const section = params.section
    const data = await request.json()

    if (!section || !data) {
      return NextResponse.json({ error: 'Missing section or data' }, { status: 400 })
    }

    console.log('[v0] Saving landing content section:', section)
    await saveLandingContent(section, data)

    return NextResponse.json({ success: true, message: `${section} saved successfully` })
  } catch (err) {
    console.error('[v0] Error saving landing content:', err)
    return NextResponse.json({ error: 'Failed to save landing content' }, { status: 500 })
  }
}
