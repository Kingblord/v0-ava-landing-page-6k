'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
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
  Sun,
  Moon,
  ArrowLeft,
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
          ? 'bg-[var(--aro-green)]/15 text-[var(--aro-green)] border border-[var(--aro-green)]/25'
          : 'text-muted-foreground hover:text-foreground hover:bg-[var(--aro-surface-2)]',
      )}
    >
      <Icon
        className={cn(
          'w-4 h-4 shrink-0 transition-colors',
          isActive ? 'text-[var(--aro-green)]' : 'text-current',
        )}
      />
      {label}
    </Link>
  )
}

function ThemeToggle({ full = false }: { full?: boolean }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  if (full) {
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={cn(
          'flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          'text-muted-foreground hover:text-foreground hover:bg-[var(--aro-surface-2)]',
          'border border-[var(--aro-border)]',
        )}
      >
        {isDark ? (
          <Sun className="w-4 h-4 shrink-0 text-[var(--aro-green)]" />
        ) : (
          <Moon className="w-4 h-4 shrink-0 text-[var(--aro-green)]" />
        )}
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </button>
    )
  }
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--aro-surface-2)] transition-colors"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}

export default function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // The nav is only shown on the root dashboard page.
  // All sub-pages get a simple back-to-dashboard header instead.
  const isRootDashboard = pathname === '/dashboard'

  async function handleLogout() {
    await logOut()
    router.push('/auth/login')
  }

  // ── Desktop sidebar (always visible on lg+) ─────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--aro-border)]">
        <Image
          src="/aromsg-logo.png"
          alt="AroMsg"
          width={36}
          height={36}
          className="object-contain"
          style={{ width: 36, height: 'auto' }}
        />
        <div>
          <p className="font-bold text-sm leading-none">
            <span className="text-[var(--aro-green)]">Aro</span>
            <span className="text-foreground">Msg</span>
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">Sales Platform</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="mx-4 mt-4 flex items-center gap-2 bg-[var(--aro-green)]/10 border border-[var(--aro-green)]/20 rounded-lg px-3 py-2">
        <span className="w-2 h-2 rounded-full bg-[var(--aro-green)] animate-pulse shrink-0" />
        <span className="text-[var(--aro-green)] text-xs font-medium">Arobi Active</span>
        <Zap className="w-3 h-3 text-[var(--aro-green)] ml-auto" />
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

      {/* Theme toggle + Logout */}
      <div className="px-3 pb-4 border-t border-[var(--aro-border)] pt-4 flex flex-col gap-1">
        <ThemeToggle full />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-card border-r border-[var(--aro-border)] h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* ── Mobile header ───────────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-b border-[var(--aro-border)] h-14 flex items-center px-4 gap-3">

        {isRootDashboard ? (
          /* Root dashboard — show logo + hamburger */
          <>
            <div className="flex items-center gap-2 flex-1">
              <Image
                src="/aromsg-logo.png"
                alt="AroMsg"
                width={28}
                height={28}
                className="object-contain"
                style={{ width: 28, height: 'auto' }}
              />
              <span className="font-bold text-sm">
                <span className="text-[var(--aro-green)]">Aro</span>
                <span className="text-foreground">Msg</span>
              </span>
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </>
        ) : (
          /* Sub-page — show back button + page title + theme toggle */
          <>
            <button
              onClick={() => router.push('/dashboard')}
              aria-label="Back to dashboard"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--aro-surface-2)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="flex-1 text-sm font-semibold text-foreground truncate">
              {navItems.find((n) => !n.exact && pathname.startsWith(n.href))?.label ?? 'Dashboard'}
            </span>
            <ThemeToggle />
          </>
        )}
      </header>

      {/* ── Mobile drawer (root dashboard only) ─────────────────────────────── */}
      {mobileOpen && isRootDashboard && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute top-14 left-0 bottom-0 w-72 bg-card border-r border-[var(--aro-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
