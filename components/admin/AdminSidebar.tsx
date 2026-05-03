'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Navigation, Layers, Zap,
  MessageSquare, Star, CreditCard, HelpCircle, Footprints,
  Settings, ExternalLink,
} from 'lucide-react'

const SECTIONS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Twilio WhatsApp', href: '/admin/twilio', icon: Settings },
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
    <aside className="w-60 min-h-screen bg-[#0d1120] border-r border-[#6C5CE7]/15 flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#6C5CE7]/15">
        <Image src="/logo.png" alt="AVA" width={32} height={32} className="object-contain" style={{ width: 32, height: 'auto' }} />
        <div>
          <p className="text-white font-bold text-sm">AVA Admin</p>
          <p className="text-[#8892a4] text-xs">Landing Editor</p>
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
                  ? 'bg-[#6C5CE7]/20 text-white border border-[#6C5CE7]/30'
                  : 'text-[#8892a4] hover:text-white hover:bg-[#6C5CE7]/10'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-3 pb-4 border-t border-[#6C5CE7]/15 pt-4 flex flex-col gap-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#8892a4] hover:text-white hover:bg-[#6C5CE7]/10 transition-all"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          View Landing Page
        </Link>
      </div>
    </aside>
  )
}
