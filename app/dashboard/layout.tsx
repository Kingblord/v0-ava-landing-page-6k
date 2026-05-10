'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--aro-green)] border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      {/* 
        Mobile: pt-14 (top header) + pb-20 (bottom nav clearance)
        Desktop: no extra padding needed – sidebar is sticky aside
      */}
      <main className="flex-1 min-w-0 overflow-y-auto pt-14 pb-20 lg:pt-0 lg:pb-0">
        {children}
      </main>
      <Toaster position="bottom-center" theme="dark" />
    </div>
  )
}
