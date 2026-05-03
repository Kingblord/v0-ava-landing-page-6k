'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AppLoader } from '@/components/AppLoader'

interface ContentReadyContextValue {
  markContentReady: () => void
}

const ContentReadyContext = createContext<ContentReadyContextValue>({
  markContentReady: () => {},
})

export function useContentReady() {
  return useContext(ContentReadyContext)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth()
  const [contentReady, setContentReady] = useState(false)
  const calledRef = useRef(false)

  const markContentReady = useCallback(() => {
    calledRef.current = true
    setContentReady(true)
  }, [])

  // On pages that don't call markContentReady (dashboard, auth pages),
  // auto-dismiss the loader once Firebase Auth resolves.
  useEffect(() => {
    if (!authLoading && !calledRef.current) {
      const timer = setTimeout(() => {
        setContentReady(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [authLoading])

  const showLoader = authLoading || !contentReady

  return (
    <ContentReadyContext.Provider value={{ markContentReady }}>
      <AppLoader show={showLoader} />
      {children}
    </ContentReadyContext.Provider>
  )
}
