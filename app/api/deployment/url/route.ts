import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return NextResponse.json({ url })
}
