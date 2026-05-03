'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User } from 'firebase/auth'
import { onAuthChange, onBusinessChange, type BusinessProfile } from '@/lib/firebase-auth'

interface AuthContextValue {
  user: User | null
  business: BusinessProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  business: null,
  loading: true,
})

/**
 * AuthProvider: manages real-time Firebase Auth state and business profile sync.
 * Both are updated via listeners so any changes in Firestore/Auth appear instantly.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubAuth = onAuthChange((u) => {
      setUser(u)
      setLoading(false)
    })

    return () => {
      unsubAuth()
    }
  }, [])

  // Subscribe to business profile real-time updates whenever user changes
  useEffect(() => {
    if (!user) {
      setBusiness(null)
      return
    }

    const unsubBusiness = onBusinessChange(user.uid, (profile) => {
      setBusiness(profile)
    })

    return () => {
      unsubBusiness()
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, business, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
