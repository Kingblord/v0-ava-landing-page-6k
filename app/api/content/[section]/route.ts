import { NextRequest, NextResponse } from 'next/server'
import { saveSection, resetSection, getSection, DEFAULTS } from '@/lib/content'
import type { SiteContent } from '@/lib/content'

type Params = { params: Promise<{ section: string }> }

const VALID_SECTIONS = Object.keys(DEFAULTS) as (keyof SiteContent)[]

export async function GET(_req: NextRequest, { params }: Params) {
  const { section } = await params
  if (!VALID_SECTIONS.includes(section as keyof SiteContent)) {
    return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
  }
  const data = await getSection(section as keyof SiteContent)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { section } = await params
  if (!VALID_SECTIONS.includes(section as keyof SiteContent)) {
    return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
  }
  const body = await req.json()
  await saveSection(section as keyof SiteContent, body)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { section } = await params
  if (!VALID_SECTIONS.includes(section as keyof SiteContent)) {
    return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
  }
  const defaults = await resetSection(section as keyof SiteContent)
  return NextResponse.json(defaults)
}
