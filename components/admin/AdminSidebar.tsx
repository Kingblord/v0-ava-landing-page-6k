'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Navigation,
  Layers,
  Sparkles,
  Play,
  MessageSquare,
  DollarSign,
  HelpCircle,
  FootprintsIcon,
  ExternalLink,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Navbar', href: '/admin/navbar', icon: Navigation },
  { label: 'Hero', href: '/admin/hero', icon: Sparkles },
  { label: 'Features', href: '/admin/bento', icon: Layers },
  { label: 'How It Works', href: '/admin/liveflow', icon: Play },
  { label: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare },
  { label: 'Pricing', href: '/admin/pricing', icon: DollarSign },
  { label: 'FAQ', href: '/admin/faq', icon: HelpCircle },
  { label: 'Footer', href: '/admin/footer', icon: FootprintsIcon },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 bg-[#0d1117] border-r border-[rgba(108,92,231,0.12)] flex flex-col sticky top-0 h-screen">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[rgba(108,92,231,0.12)] flex items-center gap-3">
        <Image src="/logo.png" alt="AVA" width={36} height={36} className="object-contain" />
        <div>
          <p className="text-sm font-bold text-[#f0f4ff]">AVA Admin</p>
          <p className="text-[10px] text-[#8892a4]">Content Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="px-5 mb-2 text-[10px] font-bold text-[#8892a4] uppercase tracking-widest">
          Sections
        </p>
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-[rgba(108,92,231,0.15)] text-[#f0f4ff] border border-[rgba(108,92,231,0.25)]'
                      : 'text-[#8892a4] hover:text-[#f0f4ff] hover:bg-[rgba(108,92,231,0.08)]'
                  }`}
                >
                  <Icon
                    size={16}
                    className={isActive ? 'text-[#8b7cf0]' : 'text-[#8892a4]'}
                  />
                  {item.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6C5CE7]" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* View site link */}
      <div className="px-4 py-4 border-t border-[rgba(108,92,231,0.12)]">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-medium text-[#8892a4] border border-[rgba(108,92,231,0.15)] hover:text-[#f0f4ff] hover:border-[rgba(108,92,231,0.35)] hover:bg-[rgba(108,92,231,0.06)] transition-all duration-200"
        >
          <ExternalLink size={13} />
          View Live Site
        </a>
      </div>
    </aside>
  )
}
