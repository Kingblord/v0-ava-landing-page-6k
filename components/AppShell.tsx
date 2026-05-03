'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-context'

// ssr:false ensures AppLoader never renders on the server, eliminating
// all Framer Motion hydration mismatches. body.ava-loading hides content
// until the client-side loader takes over.
const AppLoader = dynamic(
  () => import('@/components/AppLoader').then((m) => ({ default: m.AppLoader })),
  { ssr: false }
)

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

  // On pages that never call markContentReady (dashboard, auth pages),
  // auto-dismiss once Firebase Auth resolves.
  useEffect(() => {
    if (!authLoading && !calledRef.current) {
      const timer = setTimeout(() => setContentReady(true), 150)
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
