'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { AppShell } from '@/components/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        <AppShell>
          {children}
        </AppShell>
        <Toaster position="bottom-right" />
      </AuthProvider>
    </ThemeProvider>
  )
}
