import Link from 'next/link'
import { Navigation, Layers, Zap, MessageSquare, Star, CreditCard, HelpCircle, Footprints } from 'lucide-react'

const SECTIONS = [
  { label: 'Navbar', href: '/admin/navbar', icon: Navigation, desc: 'Brand name, nav links, CTA button labels' },
  { label: 'Hero', href: '/admin/hero', icon: Layers, desc: 'Headline, subheadline, badges, stats bar' },
  { label: 'Features (Bento)', href: '/admin/bento', icon: Zap, desc: 'Section title and all 8 feature cards' },
  { label: 'How It Works', href: '/admin/liveflow', icon: MessageSquare, desc: 'Section title and 3 step cards' },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star, desc: 'Section title and all testimonials' },
  { label: 'Pricing', href: '/admin/pricing', icon: CreditCard, desc: 'Plans, prices, features lists' },
  { label: 'FAQ', href: '/admin/faq', icon: HelpCircle, desc: 'All questions and answers' },
  { label: 'Footer', href: '/admin/footer', icon: Footprints, desc: 'CTA, links, contact info, social URLs' },
]

export default function AdminOverview() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Landing Page Editor</h1>
        <p className="text-[#8892a4] text-sm mt-1">
          Edit each section of the landing page. Changes are saved to Firestore and reflected live on the site.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(({ label, href, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="group bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-5 flex items-start gap-4 hover:border-[#6C5CE7]/40 hover:bg-[#6C5CE7]/5 transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-xl bg-[#6C5CE7]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#6C5CE7]/25 transition-colors">
              <Icon className="w-4.5 h-4.5 text-[#6C5CE7]" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{label}</p>
              <p className="text-[#8892a4] text-xs mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
