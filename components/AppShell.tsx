'use client'

import { useAuth } from '@/lib/auth-context'
import { AppLoader } from '@/components/AppLoader'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()
  return (
    <>
      <AppLoader show={loading} />
      {children}
    </>
  )
}
