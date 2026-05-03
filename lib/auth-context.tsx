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

    const authUnsub = onAuthChange((u) => {
      setUser(u)
      setLoading(false)

      // Tear down previous business listener
      businessUnsub?.()
      businessUnsub = null

      if (u) {
        // Subscribe to real-time business profile
        businessUnsub = onBusinessChange(u.uid, (b) => {
          setBusiness(b)
        })
      } else {
        setBusiness(null)
      }
    })

    return () => {
      authUnsub()
      businessUnsub?.()
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
