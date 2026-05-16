'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { type User } from 'firebase/auth'
import { onAuthChange } from '@/lib/firebase-auth'
import type { Business } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  business: Business | null
  loading: boolean
  refreshBusiness: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  business: null,
  loading: true,
  refreshBusiness: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Fetch business data from the server API which uses Admin SDK.
   * This bypasses Firestore Security Rules entirely and is guaranteed to work.
   */
  const fetchBusiness = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/user/profile?uid=${uid}`)
      if (res.ok) {
        const data = await res.json()
        if (data.profile) {
          setBusiness(data.profile as Business)
        }
      } else if (res.status === 404) {
        // Business doc doesn't exist yet (race after signup) — retry after delay
        setTimeout(() => fetchBusiness(uid), 1000)
      }
    } catch (err) {
      console.error('[v0] Error fetching business profile:', err)
    }
  }, [])

  const refreshBusiness = useCallback(async () => {
    if (user) await fetchBusiness(user.uid)
  }, [user, fetchBusiness])

  useEffect(() => {
    const authUnsub = onAuthChange(async (u) => {
      setUser(u)
      if (u) {
        await fetchBusiness(u.uid)
      } else {
        setBusiness(null)
      }
      setLoading(false)
    })

    return () => authUnsub()
  }, [fetchBusiness])

  return (
    <AuthContext.Provider value={{ user, business, loading, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
