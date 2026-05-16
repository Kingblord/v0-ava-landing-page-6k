import { NextResponse } from 'next/server'

/**
 * GET /api/currency
 * Fetches live NGN exchange rates from ExchangeRate-API (free tier, no key needed for base NGN)
 * Falls back to hardcoded rates if the API is unavailable.
 * Products are stored in NGN; this converts to the user's selected display currency.
 */

// Fallback rates relative to NGN (1 NGN = x currency)
const FALLBACK_RATES: Record<string, number> = {
  NGN: 1,
  USD: 0.00065,
  EUR: 0.00059,
  GBP: 0.00051,
  GHS: 0.0099,
  KES: 0.084,
  ZAR: 0.012,
  CAD: 0.00088,
  AUD: 0.00099,
  JPY: 0.098,
  CNY: 0.0047,
}

let cache: { rates: Record<string, number>; fetchedAt: number } | null = null
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function GET() {
  try {
    const now = Date.now()

    // Return cached rates if still fresh
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json({ rates: cache.rates, source: 'cache', fetchedAt: cache.fetchedAt })
    }

    // Fetch from ExchangeRate-API (free, no key needed for NGN base via open.er-api.com)
    const res = await fetch('https://open.er-api.com/v6/latest/NGN', {
      next: { revalidate: 3600 },
    })

    if (!res.ok) throw new Error(`ExchangeRate API responded ${res.status}`)

    const data = await res.json() as { result: string; rates: Record<string, number> }

    if (data.result !== 'success' || !data.rates) {
      throw new Error('Invalid response from exchange rate API')
    }

    cache = { rates: data.rates, fetchedAt: now }
    return NextResponse.json({ rates: data.rates, source: 'live', fetchedAt: now })
  } catch (err) {
    console.error('[v0] Currency API error, using fallback rates:', err)
    // Return fallback rates so the app never breaks
    return NextResponse.json({
      rates: FALLBACK_RATES,
      source: 'fallback',
      fetchedAt: Date.now(),
    })
  }
}
