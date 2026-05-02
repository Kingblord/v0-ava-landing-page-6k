'use client'

import { useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import {
  MessageSquare,
  CreditCard,
  TrendingUp,
  Shield,
  Globe,
  BarChart3,
  Bot,
  Clock,
  Sparkles,
} from 'lucide-react'

interface BentoCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

function BentoCard({ children, className = '', delay = 0 }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 200, damping: 25 })
  const springY = useSpring(mouseY, { stiffness: 200, damping: 25 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const handleMouseLeave = () => {
    mouseX.set(-999)
    mouseY.set(-999)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group noise-texture bg-[#111827] border border-[rgba(108,92,231,0.15)] rounded-3xl overflow-hidden ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Mouse-follow gradient border glow */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(350px circle at ${springX}px ${springY}px, rgba(108,92,231,0.25), rgba(0,209,178,0.1), transparent 70%)`,
          zIndex: 0,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  )
}

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

export default function BentoGrid() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" className="relative py-28 overflow-hidden">
      {/* BG glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#6C5CE7]/6 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          ref={ref}
          variants={sectionVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border border-[rgba(0,209,178,0.3)] bg-[rgba(0,209,178,0.06)] text-[#00D1B2] mb-5">
            <Sparkles size={12} />
            Everything You Need to Sell at Scale
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-[#f0f4ff] max-w-3xl mx-auto leading-tight text-balance">
            Built for businesses that demand{' '}
            <span className="text-gradient">results, not complexity</span>
          </h2>
          <p className="text-[#8892a4] text-lg mt-5 max-w-xl mx-auto leading-relaxed">
            AVA combines cutting-edge AI with battle-tested sales psychology to turn every
            conversation into a closed deal.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-[minmax(200px,auto)]">
          {/* Card 1 — Human-like Conversations (wide) */}
          <BentoCard className="lg:col-span-2 p-8" delay={0}>
            <div className="flex flex-col h-full gap-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C5CE7]/30 to-[#6C5CE7]/10 border border-[rgba(108,92,231,0.3)] flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={22} className="text-[#8b7cf0]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#f0f4ff] tracking-tight">
                    Human-like Conversations
                  </h3>
                  <p className="text-[#8892a4] text-sm mt-1.5 leading-relaxed">
                    AVA reads context, handles objections, and builds rapport exactly like
                    your best salesperson — but available 24/7 across every conversation
                    simultaneously.
                  </p>
                </div>
              </div>

              {/* Mini conversation preview */}
              <div className="mt-auto space-y-2.5">
                {[
                  { side: 'right', msg: "What's the best price you can do?", color: 'from-[#6C5CE7] to-[#8b7cf0]' },
                  { side: 'left', msg: "For you, I can offer 15% off — that's $297. This is our best offer today only.", color: '' },
                  { side: 'right', msg: "Deal! How do I pay?", color: 'from-[#6C5CE7] to-[#8b7cf0]' },
                ].map((item, i) => (
                  <div key={i} className={`flex ${item.side === 'right' ? 'justify-end' : 'justify-start'}`}>
                    <span className={`inline-block px-4 py-2 rounded-2xl text-xs max-w-[70%] ${
                      item.side === 'right'
                        ? `bg-gradient-to-r ${item.color} text-white`
                        : 'bg-[#1a2235] text-[#f0f4ff] border border-[rgba(108,92,231,0.15)]'
                    }`}>
                      {item.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Card 2 — Auto-Payments */}
          <BentoCard className="p-8" delay={0.1}>
            <div className="flex flex-col h-full gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D1B2]/30 to-[#00D1B2]/10 border border-[rgba(0,209,178,0.3)] flex items-center justify-center">
                <CreditCard size={22} className="text-[#00D1B2]" />
              </div>
              <h3 className="text-xl font-bold text-[#f0f4ff] tracking-tight">
                Auto-Payments
              </h3>
              <p className="text-[#8892a4] text-sm leading-relaxed">
                Send instant payment links, accept card payments, and confirm orders —
                all without leaving the chat.
              </p>
              <div className="mt-auto bg-[#0d1220] border border-[rgba(0,209,178,0.2)] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-[#8892a4]">Today&apos;s Revenue</span>
                  <span className="text-[11px] text-[#00D1B2]">+23.4%</span>
                </div>
                <p className="text-2xl font-bold text-[#00D1B2]">$12,847</p>
                <div className="mt-2 flex gap-1">
                  {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#1a2235] rounded-sm overflow-hidden">
                      <div
                        className="bg-gradient-to-t from-[#00D1B2]/60 to-[#00D1B2]/20 rounded-sm"
                        style={{ height: `${h * 0.4}px` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Card 3 — Smart Negotiation */}
          <BentoCard className="p-8" delay={0.15}>
            <div className="flex flex-col h-full gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e040fb]/30 to-[#e040fb]/10 border border-[rgba(224,64,251,0.3)] flex items-center justify-center">
                <TrendingUp size={22} className="text-[#e040fb]" />
              </div>
              <h3 className="text-xl font-bold text-[#f0f4ff] tracking-tight">
                Smart Negotiation
              </h3>
              <p className="text-[#8892a4] text-sm leading-relaxed">
                AVA dynamically adjusts pricing within your defined rules, maximizing
                conversion while protecting your margins.
              </p>
              <div className="mt-auto grid grid-cols-2 gap-3">
                {[
                  { label: 'Close Rate', value: '73%', color: '#e040fb' },
                  { label: 'Avg Deal Size', value: '$340', color: '#6C5CE7' },
                  { label: 'Response Time', value: '< 1s', color: '#00D1B2' },
                  { label: 'Uptime', value: '99.9%', color: '#8b7cf0' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#0d1220] rounded-2xl p-3 text-center">
                    <p className="text-lg font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-[#8892a4] mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Card 4 — Multi-Platform */}
          <BentoCard className="p-8" delay={0.2}>
            <div className="flex flex-col h-full gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C5CE7]/30 to-[#00D1B2]/20 border border-[rgba(108,92,231,0.3)] flex items-center justify-center">
                <Globe size={22} className="text-[#8b7cf0]" />
              </div>
              <h3 className="text-xl font-bold text-[#f0f4ff] tracking-tight">
                Multi-Platform Reach
              </h3>
              <p className="text-[#8892a4] text-sm leading-relaxed">
                Deploy AVA on WhatsApp, Telegram, Instagram, and web chat from a single
                dashboard. One agent, infinite channels.
              </p>
              <div className="mt-auto flex gap-3">
                {[
                  { label: 'WhatsApp', color: '#25D366', icon: '📱' },
                  { label: 'Telegram', color: '#0088CC', icon: '✈️' },
                  { label: 'Instagram', color: '#E1306C', icon: '📸' },
                ].map((platform) => (
                  <div
                    key={platform.label}
                    className="flex-1 bg-[#0d1220] rounded-xl p-2.5 text-center border border-[rgba(255,255,255,0.05)]"
                  >
                    <div
                      className="w-6 h-6 rounded-full mx-auto mb-1.5 flex items-center justify-center text-xs"
                      style={{ background: `${platform.color}22`, border: `1px solid ${platform.color}44` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: platform.color }} />
                    </div>
                    <p className="text-[10px] text-[#8892a4]">{platform.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Card 5 — Analytics (wide) */}
          <BentoCard className="lg:col-span-2 p-8" delay={0.25}>
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              <div className="flex flex-col gap-4 flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D1B2]/30 to-[#6C5CE7]/20 border border-[rgba(0,209,178,0.3)] flex items-center justify-center">
                  <BarChart3 size={22} className="text-[#00D1B2]" />
                </div>
                <h3 className="text-xl font-bold text-[#f0f4ff] tracking-tight max-w-[200px]">
                  Real-Time Revenue Analytics
                </h3>
                <p className="text-[#8892a4] text-sm leading-relaxed max-w-xs">
                  Track every deal, conversation, and conversion in a live dashboard
                  built for operators who care about outcomes.
                </p>
              </div>
              <div className="flex-1 bg-[#0d1220] rounded-2xl border border-[rgba(108,92,231,0.15)] p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8892a4] font-medium">Conversions This Week</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[rgba(0,209,178,0.1)] text-[#00D1B2]">
                    +38%
                  </span>
                </div>
                <div className="flex items-end gap-2 h-20">
                  {[30, 52, 41, 68, 74, 88, 95].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${h}%`,
                          background:
                            i === 6
                              ? 'linear-gradient(to top, #6C5CE7, #00D1B2)'
                              : `rgba(108,92,231,${0.15 + i * 0.04})`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-[#8892a4]">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Card 6 — Security */}
          <BentoCard className="p-8" delay={0.3}>
            <div className="flex flex-col gap-4 h-full">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C5CE7]/30 to-[#6C5CE7]/10 border border-[rgba(108,92,231,0.3)] flex items-center justify-center">
                <Shield size={22} className="text-[#8b7cf0]" />
              </div>
              <h3 className="text-xl font-bold text-[#f0f4ff] tracking-tight">
                Enterprise Security
              </h3>
              <p className="text-[#8892a4] text-sm leading-relaxed">
                End-to-end encryption, SOC 2 compliance, and role-based access control
                protect your business data at every layer.
              </p>
              <div className="mt-auto space-y-2">
                {['256-bit Encryption', 'SOC 2 Certified', 'GDPR Compliant'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <span className="text-xs text-[#8892a4]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Card 7 — Instant Setup */}
          <BentoCard className="p-8" delay={0.35}>
            <div className="flex flex-col gap-4 h-full">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e040fb]/30 to-[#e040fb]/10 border border-[rgba(224,64,251,0.3)] flex items-center justify-center">
                <Clock size={22} className="text-[#e040fb]" />
              </div>
              <h3 className="text-xl font-bold text-[#f0f4ff] tracking-tight">
                5-Minute Setup
              </h3>
              <p className="text-[#8892a4] text-sm leading-relaxed">
                Connect your WhatsApp Business account, add your products, and go live.
                No code, no developers required.
              </p>
              <div className="mt-auto flex items-center gap-3 bg-[#0d1220] rounded-2xl p-3 border border-[rgba(224,64,251,0.15)]">
                <Bot size={20} className="text-[#e040fb]" />
                <div>
                  <p className="text-xs font-semibold text-[#f0f4ff]">AVA is live</p>
                  <p className="text-[10px] text-[#8892a4]">Connected to WhatsApp</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-[#00D1B2] animate-pulse" />
              </div>
            </div>
          </BentoCard>

          {/* Card 8 — Learning AI */}
          <BentoCard className="p-8" delay={0.4}>
            <div className="flex flex-col gap-4 h-full">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D1B2]/30 to-[#6C5CE7]/20 border border-[rgba(0,209,178,0.3)] flex items-center justify-center">
                <Sparkles size={22} className="text-[#00D1B2]" />
              </div>
              <h3 className="text-xl font-bold text-[#f0f4ff] tracking-tight">
                Self-Learning AI
              </h3>
              <p className="text-[#8892a4] text-sm leading-relaxed">
                AVA learns from every conversation, continuously improving its close
                rate based on what actually works for your specific products and customers.
              </p>
              <div className="mt-auto flex items-center gap-2">
                <div className="flex-1 bg-[#0d1220] rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '78%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    viewport={{ once: true }}
                    className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2]"
                  />
                </div>
                <span className="text-xs text-[#00D1B2] font-semibold whitespace-nowrap">
                  78% improvement
                </span>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  )
}
