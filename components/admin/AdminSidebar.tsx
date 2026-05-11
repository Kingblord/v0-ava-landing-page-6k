'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Navigation, Layers, Zap,
  MessageSquare, Star, CreditCard, HelpCircle, Footprints,
  Beaker, ExternalLink,
} from 'lucide-react'

const SECTIONS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Testground', href: '/admin/testground', icon: Beaker },
  { label: 'Navbar', href: '/admin/navbar', icon: Navigation },
  { label: 'Hero', href: '/admin/hero', icon: Layers },
  { label: 'Features (Bento)', href: '/admin/bento', icon: Zap },
  { label: 'How It Works', href: '/admin/liveflow', icon: MessageSquare },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star },
  { label: 'Pricing', href: '/admin/pricing', icon: CreditCard },
  { label: 'FAQ', href: '/admin/faq', icon: HelpCircle },
  { label: 'Footer', href: '/admin/footer', icon: Footprints },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 min-h-screen bg-card border-r border-[var(--aro-border)] flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--aro-border)]">
        <Image src="/aromsg-logo.png" alt="AroMsg" width={32} height={32} className="object-contain" style={{ width: 32, height: 'auto' }} />
        <div>
          <p className="font-bold text-sm">
            <span className="text-[var(--aro-green)]">Aro</span>
            <span className="text-foreground">Msg</span>
            <span className="text-muted-foreground font-normal"> Admin</span>
          </p>
          <p className="text-muted-foreground text-xs">Landing Editor</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        {SECTIONS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-[var(--aro-green)]/15 text-[var(--aro-green)] border border-[var(--aro-green)]/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[var(--aro-surface-2)]'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-3 pb-4 border-t border-[var(--aro-border)] pt-4 flex flex-col gap-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--aro-surface-2)] transition-all"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          View Landing Page
        </Link>
      </div>
    </aside>
  )
}
