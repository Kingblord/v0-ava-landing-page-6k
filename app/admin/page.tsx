import Link from 'next/link'
import {
  Navigation,
  Sparkles,
  Layers,
  Play,
  MessageSquare,
  DollarSign,
  HelpCircle,
  FootprintsIcon,
  ArrowRight,
} from 'lucide-react'

const SECTIONS = [
  { label: 'Navbar', href: '/admin/navbar', icon: Navigation, description: 'Nav links, CTA buttons, sign in text' },
  { label: 'Hero', href: '/admin/hero', icon: Sparkles, description: 'Headline, subtext, CTAs, trust items' },
  { label: 'Features', href: '/admin/bento', icon: Layers, description: '8 feature card titles and descriptions' },
  { label: 'How It Works', href: '/admin/liveflow', icon: Play, description: '3-step flow titles and descriptions' },
  { label: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare, description: 'Customer reviews, names, metrics' },
  { label: 'Pricing', href: '/admin/pricing', icon: DollarSign, description: 'Plans, prices, features, CTA labels' },
  { label: 'FAQ', href: '/admin/faq', icon: HelpCircle, description: 'Questions and answers accordion' },
  { label: 'Footer', href: '/admin/footer', icon: FootprintsIcon, description: 'CTA, links, contact info, social URLs' },
]

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#f0f4ff] tracking-tight">Content Manager</h1>
        <p className="text-[#8892a4] mt-2 text-sm">
          Select a section to edit. Changes are saved directly to Firestore and reflected on the live site instantly.
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-8 flex items-start gap-3 bg-[rgba(108,92,231,0.08)] border border-[rgba(108,92,231,0.2)] rounded-2xl px-5 py-4">
        <div className="w-2 h-2 rounded-full bg-[#00D1B2] mt-1.5 animate-pulse shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[#f0f4ff]">Auto-initialization enabled</p>
          <p className="text-xs text-[#8892a4] mt-0.5">
            If a section has never been edited, the first save will initialize it with the default hardcoded content. You can then freely edit and save changes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group bg-[#0d1117] border border-[rgba(108,92,231,0.15)] rounded-2xl p-6 hover:border-[rgba(108,92,231,0.4)] hover:bg-[rgba(108,92,231,0.04)] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[rgba(108,92,231,0.12)] border border-[rgba(108,92,231,0.2)] flex items-center justify-center">
                  <Icon size={18} className="text-[#8b7cf0]" />
                </div>
                <ArrowRight
                  size={15}
                  className="text-[#8892a4] group-hover:text-[#8b7cf0] group-hover:translate-x-1 transition-all duration-200"
                />
              </div>
              <h3 className="text-sm font-bold text-[#f0f4ff] mb-1">{s.label}</h3>
              <p className="text-xs text-[#8892a4] leading-relaxed">{s.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
