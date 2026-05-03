'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logOut } from '@/lib/firebase-auth'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  onClick,
}: {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-[#6C5CE7]/15 text-[#8b7cf0] border border-[#6C5CE7]/25'
          : 'text-[#8892a4] hover:text-[#f0f4ff] hover:bg-[#1a2235]',
      )}
    >
      <Icon
        className={cn(
          'w-4 h-4 shrink-0 transition-colors',
          isActive ? 'text-[#6C5CE7]' : 'text-current',
        )}
      />
      {label}
    </Link>
  )
}

export default function DashboardSidebar() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await logOut()
    router.push('/auth/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#6C5CE7]/15">
        <Image src="/logo.png" alt="AVA" width={36} height={28} className="object-contain" />
        <div>
          <p className="text-white font-bold text-sm leading-none">AVA</p>
          <p className="text-[#8892a4] text-xs mt-0.5">Sales Agent</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="mx-4 mt-4 flex items-center gap-2 bg-[#00D1B2]/10 border border-[#00D1B2]/20 rounded-lg px-3 py-2">
        <span className="w-2 h-2 rounded-full bg-[#00D1B2] animate-pulse shrink-0" />
        <span className="text-[#00D1B2] text-xs font-medium">Agent Active</span>
        <Zap className="w-3 h-3 text-[#00D1B2] ml-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-[#6C5CE7]/15 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#8892a4] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#111827] border-r border-[#6C5CE7]/15 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#111827]/95 backdrop-blur-md border-b border-[#6C5CE7]/15 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="AVA" width={28} height={22} className="object-contain" />
          <span className="text-white font-bold text-sm">AVA</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-[#8892a4] hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute top-14 left-0 bottom-0 w-72 bg-[#111827] border-r border-[#6C5CE7]/15"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
