import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export const CURRENCY_META: Record<string, { symbol: string; label: string; locale: string }> = {
  NGN: { symbol: '₦', label: 'Nigerian Naira',       locale: 'en-NG' },
  USD: { symbol: '$', label: 'US Dollar',             locale: 'en-US' },
  EUR: { symbol: '€', label: 'Euro',                  locale: 'de-DE' },
  GBP: { symbol: '£', label: 'British Pound',         locale: 'en-GB' },
  GHS: { symbol: '₵', label: 'Ghanaian Cedi',         locale: 'en-GH' },
  KES: { symbol: 'KSh', label: 'Kenyan Shilling',     locale: 'en-KE' },
  ZAR: { symbol: 'R',  label: 'South African Rand',   locale: 'en-ZA' },
  CAD: { symbol: 'C$', label: 'Canadian Dollar',      locale: 'en-CA' },
  AUD: { symbol: 'A$', label: 'Australian Dollar',    locale: 'en-AU' },
  JPY: { symbol: '¥',  label: 'Japanese Yen',         locale: 'ja-JP' },
  CNY: { symbol: '¥',  label: 'Chinese Yuan',         locale: 'zh-CN' },
}

let ratesCache: Record<string, number> | null = null
let ratesFetchedAt = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

async function fetchRates(): Promise<Record<string, number>> {
  const now = Date.now()
  if (ratesCache && now - ratesFetchedAt < CACHE_TTL) return ratesCache

  try {
    const res = await fetch('/api/currency')
    if (!res.ok) throw new Error('Currency API error')
    const data = await res.json() as { rates: Record<string, number> }
    ratesCache = data.rates
    ratesFetchedAt = now
    return data.rates
  } catch {
    // Return basic fallback so the UI never breaks
    return { NGN: 1, USD: 0.00065, EUR: 0.00059, GBP: 0.00051, GHS: 0.0099 }
  }
}

/**
 * useCurrency — reads the user's preferred currency from their business profile,
 * fetches live NGN→X rates, and exposes a `fmt(amountInNGN)` formatter.
 */
export function useCurrency() {
  const { business } = useAuth()
  const currency = business?.currency ?? 'NGN'
  const [rates, setRates] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    fetchRates().then(setRates)
  }, [])

  const convert = useCallback(
    (amountInNGN: number): number => {
      if (!rates) return amountInNGN
      const rate = rates[currency] ?? 1
      return amountInNGN * rate
    },
    [rates, currency],
  )

  const fmt = useCallback(
    (amountInNGN: number): string => {
      const meta = CURRENCY_META[currency] ?? CURRENCY_META.NGN
      const converted = convert(amountInNGN)
      try {
        return new Intl.NumberFormat(meta.locale, {
          style: 'currency',
          currency,
          maximumFractionDigits: currency === 'JPY' ? 0 : 2,
          minimumFractionDigits: currency === 'JPY' ? 0 : 2,
        }).format(converted)
      } catch {
        return `${meta.symbol}${converted.toFixed(2)}`
      }
    },
    [convert, currency],
  )

  const symbol = CURRENCY_META[currency]?.symbol ?? '₦'

  return { fmt, convert, currency, symbol, rates }
}
