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
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
          <p className="text-[#8892a4] text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 lg:overflow-auto">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  )
}
