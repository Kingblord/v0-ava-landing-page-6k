'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { type User } from 'firebase/auth'
import { onAuthChange, onBusinessChange } from '@/lib/firebase-auth'
import type { Business } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  business: Business | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  business: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let businessUnsub: (() => void) | null = null
    let fallbackPollInterval: NodeJS.Timeout | null = null

    const authUnsub = onAuthChange((u) => {
      setUser(u)
      setLoading(false)

      // Tear down previous business listener and poll
      businessUnsub?.()
      businessUnsub = null
      if (fallbackPollInterval) clearInterval(fallbackPollInterval)
      fallbackPollInterval = null

      if (u) {
        console.log('[v0] Auth user set, subscribing to business data:', u.uid)
        
        // Set up real-time listener
        businessUnsub = onBusinessChange(u.uid, (b) => {
          console.log('[v0] Business data updated in auth context:', b?.name || 'none')
          setBusiness(b)
        })

        // Add fallback polling mechanism in case real-time listener doesn't fire initially
        // This ensures data appears even if there's a race condition
        let pollAttempts = 0
        const maxPollAttempts = 10 // Poll for up to 5 seconds (500ms x 10)
        fallbackPollInterval = setInterval(async () => {
          pollAttempts++
          if (pollAttempts > maxPollAttempts) {
            clearInterval(fallbackPollInterval!)
            fallbackPollInterval = null
            return
          }

          try {
            // Only fetch if we don't have business data yet
            if (!business) {
              console.log('[v0] Fallback poll attempt', pollAttempts, 'to fetch business data')
              const response = await fetch(`/api/user/profile?uid=${u.uid}`)
              if (response.ok) {
                const data = await response.json()
                if (data.profile) {
                  console.log('[v0] Fallback poll succeeded, received business data:', data.profile.name)
                  setBusiness(data.profile)
                  // Stop polling once we get data
                  clearInterval(fallbackPollInterval!)
                  fallbackPollInterval = null
                }
              }
            } else {
              // Stop polling once we have business data
              clearInterval(fallbackPollInterval!)
              fallbackPollInterval = null
            }
          } catch (err) {
            console.error('[v0] Fallback poll error:', err instanceof Error ? err.message : err)
          }
        }, 500)
      } else {
        console.log('[v0] User logged out, clearing business data')
        setBusiness(null)
      }
    })

    return () => {
      authUnsub()
      businessUnsub?.()
      if (fallbackPollInterval) clearInterval(fallbackPollInterval)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, business, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
