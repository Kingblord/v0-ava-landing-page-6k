'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { ArrowRight, MessageSquare, Package, ShoppingCart, Zap, Bot, Shield } from 'lucide-react'

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Human-Like Conversations',
    desc: 'AVA chats with your customers like a real salesperson — answering questions, recommending products, and handling objections naturally.',
  },
  {
    icon: Package,
    title: 'Your Product Catalogue',
    desc: 'Add your products once. AVA learns them instantly and only recommends what you actually sell — never invents items.',
  },
  {
    icon: ShoppingCart,
    title: 'Automatic Order Creation',
    desc: 'When a customer is ready to buy, AVA creates the order in your dashboard automatically. You focus on fulfilment.',
  },
  {
    icon: Zap,
    title: 'Instant Responses',
    desc: 'No more leaving customers on read. AVA responds to every message in seconds, 24/7, even while you sleep.',
  },
  {
    icon: Bot,
    title: 'Customisable Personality',
    desc: 'Define how AVA speaks — formal, casual, aggressive closer, soft advisor. Your brand, your voice.',
  },
  {
    icon: Shield,
    title: 'Price Negotiation Control',
    desc: 'Set a floor price per product. AVA will negotiate naturally within your limits so you never sell at a loss.',
  },
]

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (loading || user) return null

  return (
    <div className="min-h-screen bg-[#0B0F1A] overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[#6C5CE7]/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#00D1B2]/8 blur-[150px]" />
        <div className="absolute top-[50%] left-[40%] w-[400px] h-[400px] rounded-full bg-[#e040fb]/6 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="AVA" width={44} height={34} className="object-contain" />
          <span className="text-white font-bold text-lg">AVA</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-[#8892a4] hover:text-white">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-28 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#6C5CE7]/10 border border-[#6C5CE7]/25 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#00D1B2] animate-pulse" />
          <span className="text-[#8b7cf0] text-sm font-medium">Powered by OpenRouter AI</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6 text-balance">
          Your AI Sales Agent{' '}
          <span className="text-gradient-pink">Closes Deals</span>{' '}
          While You Sleep
        </h1>

        <p className="text-[#8892a4] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
          Connect your WhatsApp, add your products, and let AVA handle every customer conversation — from first question to confirmed order.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl px-8 h-12 text-base font-semibold gap-2 glow-purple transition-all"
            >
              Start for Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-8 h-12 text-base border-[#6C5CE7]/25 text-[#8892a4] hover:text-white hover:bg-[#1a2235] transition-all"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16 pt-10 border-t border-[#6C5CE7]/15">
          {[
            { value: '24/7', label: 'Always On' },
            { value: '<1s', label: 'Response Time' },
            { value: '100%', label: 'Your Products' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-white">{s.value}</p>
              <p className="text-[#8892a4] text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-28 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-balance">
            Everything you need to automate sales
          </h2>
          <p className="text-[#8892a4] text-lg max-w-xl mx-auto text-pretty">
            One platform to manage your AI agent, products, and orders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6 hover:border-[#6C5CE7]/35 transition-all duration-300 hover:-translate-y-0.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/10 flex items-center justify-center mb-4 group-hover:bg-[#6C5CE7]/20 transition-colors">
                  <Icon className="w-5 h-5 text-[#6C5CE7]" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-[#8892a4] text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 pb-28 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How AVA Works</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          {[
            { n: '1', title: 'Connect WhatsApp', desc: 'Paste the webhook URL into your Twilio WhatsApp Sandbox. Done in 2 minutes.' },
            { n: '2', title: 'Add Products', desc: 'Create your product catalogue with names, prices, and negotiation rules.' },
            { n: '3', title: 'AVA Takes Over', desc: 'Every incoming message is handled by AVA — automatically, intelligently, 24/7.' },
          ].map((s) => (
            <div key={s.n} className="flex-1 bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-[#6C5CE7] flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">{s.n}</span>
              </div>
              <h3 className="text-white font-semibold mb-2">{s.title}</h3>
              <p className="text-[#8892a4] text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-24 max-w-3xl mx-auto text-center">
        <div className="bg-[#111827] border border-[#6C5CE7]/25 rounded-3xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-balance">
            Ready to automate your sales?
          </h2>
          <p className="text-[#8892a4] mb-8 text-lg text-pretty">
            Create your account in under a minute. No credit card required.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl px-10 h-12 text-base font-semibold gap-2 glow-purple"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#6C5CE7]/15 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image src="/logo.png" alt="AVA" width={24} height={18} className="object-contain opacity-70" />
          <span className="text-[#8892a4] text-sm font-medium">AVA</span>
        </div>
        <p className="text-[#8892a4] text-xs">
          AI-powered sales automation for modern businesses.
        </p>
      </footer>
    </div>
  )
}
