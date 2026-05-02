'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Wifi, MessageSquare, DollarSign, CheckCircle2, ArrowRight, Zap } from 'lucide-react'

const steps = [
  {
    id: 0,
    icon: Wifi,
    label: 'Connect',
    color: '#6C5CE7',
    title: 'Connect Your Channels',
    description:
      'Link AVA to your WhatsApp Business account or Telegram bot in under 5 minutes. No developers, no code — just connect and configure your product catalog.',
    phoneContent: 'connect',
  },
  {
    id: 1,
    icon: MessageSquare,
    label: 'Chat',
    color: '#8b7cf0',
    title: 'AVA Engages Every Customer',
    description:
      'The moment a customer messages you, AVA responds instantly with intelligent, context-aware replies. It qualifies leads, handles objections, and drives intent to purchase.',
    phoneContent: 'chat',
  },
  {
    id: 2,
    icon: DollarSign,
    label: 'Revenue',
    color: '#00D1B2',
    title: 'Close Deals & Collect Payments',
    description:
      'AVA sends payment links, processes transactions, and confirms orders — all within the conversation. Your customer pays without ever leaving their chat app.',
    phoneContent: 'revenue',
  },
]

function PhoneContent({ type }: { type: string }) {
  if (type === 'connect') {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C5CE7]/30 to-[#6C5CE7]/10 border border-[rgba(108,92,231,0.4)] flex items-center justify-center">
          <Wifi size={28} className="text-[#6C5CE7]" />
        </div>
        <div className="text-center">
          <p className="text-[#f0f4ff] text-sm font-semibold">WhatsApp Connected</p>
          <p className="text-[#8892a4] text-xs mt-1">+1 (555) 000-0000</p>
        </div>
        <div className="w-full space-y-2">
          {['Product Catalog', 'Pricing Rules', 'Payment Gateway'].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between bg-[#1a2235] rounded-xl px-3 py-2.5"
            >
              <span className="text-xs text-[#8892a4]">{item}</span>
              <CheckCircle2 size={14} className="text-[#00D1B2]" />
            </div>
          ))}
        </div>
        <div className="w-full bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] rounded-xl py-2.5 text-center">
          <span className="text-white text-xs font-semibold">AVA is Live</span>
        </div>
      </div>
    )
  }

  if (type === 'chat') {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-start">
          <div className="bg-[#1a2235] border border-[rgba(108,92,231,0.15)] rounded-2xl rounded-bl-md px-3 py-2 text-[11px] text-[#f0f4ff] max-w-[85%]">
            Hi! I saw your ad. How much is the Pro plan?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-gradient-to-br from-[#6C5CE7] to-[#8b7cf0] rounded-2xl rounded-br-md px-3 py-2 text-[11px] text-white max-w-[85%]">
            Hey! Pro is $97/mo. Includes unlimited agents and priority support. Want to start a free trial today?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-[#1a2235] border border-[rgba(108,92,231,0.15)] rounded-2xl rounded-bl-md px-3 py-2 text-[11px] text-[#f0f4ff] max-w-[85%]">
            Is there a discount for annual billing?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-gradient-to-br from-[#6C5CE7] to-[#8b7cf0] rounded-2xl rounded-br-md px-3 py-2 text-[11px] text-white max-w-[85%]">
            Annual billing saves you 30% — just $67/mo. That&apos;s $360 in savings. Ready to lock it in?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-[#1a2235] border border-[rgba(108,92,231,0.15)] rounded-2xl rounded-bl-md px-3 py-2 text-[11px] text-[#f0f4ff]">
            Yes, let&apos;s do it!
          </div>
        </div>
      </div>
    )
  }

  if (type === 'revenue') {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-gradient-to-br from-[#6C5CE7]/20 to-[#00D1B2]/10 border border-[rgba(108,92,231,0.3)] rounded-2xl p-3.5">
          <p className="text-[#f0f4ff] text-xs font-semibold mb-2.5">Secure Payment</p>
          <div className="space-y-1.5 text-[11px] mb-3">
            <div className="flex justify-between">
              <span className="text-[#8892a4]">Plan</span>
              <span className="text-[#f0f4ff]">AVA Pro Annual</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8892a4]">Discount</span>
              <span className="text-green-400">-30%</span>
            </div>
            <div className="border-t border-[rgba(108,92,231,0.2)] pt-1.5 flex justify-between font-bold">
              <span className="text-[#8892a4]">Total</span>
              <span className="text-[#00D1B2]">$804/yr</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] rounded-xl py-2 text-center">
            <span className="text-white text-xs font-semibold">Pay Now</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#0d2b20] border border-[rgba(0,209,178,0.3)] rounded-xl px-3 py-2.5">
          <CheckCircle2 size={16} className="text-[#00D1B2] flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[#00D1B2]">Payment Confirmed!</p>
            <p className="text-[10px] text-[#8892a4]">Receipt sent to email</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function LiveFlow() {
  const [activeStep, setActiveStep] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="relative py-28 overflow-hidden">
      {/* BG */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00D1B2]/6 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#6C5CE7]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border border-[rgba(108,92,231,0.3)] bg-[rgba(108,92,231,0.06)] text-[#8b7cf0] mb-5">
            <Zap size={12} />
            How AVA Works
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-[#f0f4ff] text-balance">
            From first message to{' '}
            <span className="text-gradient">paid customer</span>
            <br />
            fully automated
          </h2>
        </motion.div>

        {/* Flow layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isActive = activeStep === i
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -32 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setActiveStep(i)}
                  className={`cursor-pointer p-6 rounded-3xl border transition-all duration-400 ${
                    isActive
                      ? 'bg-[#111827] border-[rgba(108,92,231,0.4)] shadow-lg shadow-[rgba(108,92,231,0.15)]'
                      : 'bg-[#0d1220]/60 border-[rgba(108,92,231,0.1)] hover:border-[rgba(108,92,231,0.25)] hover:bg-[#111827]/60'
                  }`}
                >
                  <div className="flex items-start gap-5">
                    {/* Step number + icon */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${step.color}33, ${step.color}11)`
                            : 'rgba(17,24,39,0.8)',
                          border: `1px solid ${step.color}${isActive ? '66' : '22'}`,
                        }}
                      >
                        <Icon
                          size={20}
                          style={{ color: isActive ? step.color : '#8892a4' }}
                        />
                      </div>
                      {i < steps.length - 1 && (
                        <div className="w-px h-6 bg-gradient-to-b from-[rgba(108,92,231,0.3)] to-transparent" />
                      )}
                    </div>

                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold tracking-widest uppercase"
                          style={{ color: step.color }}>
                          Step {i + 1}
                        </span>
                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(108,92,231,0.15)] text-[#8b7cf0]"
                          >
                            Active
                          </motion.span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-[#f0f4ff] tracking-tight mb-1.5">
                        {step.title}
                      </h3>
                      <AnimatePresence>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-[#8892a4] text-sm leading-relaxed"
                          >
                            {step.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Ambient */}
              <div
                className="absolute -inset-10 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-700"
                style={{ background: steps[activeStep].color }}
              />

              {/* Phone */}
              <div className="relative w-72 bg-[#0d1220] border border-[rgba(108,92,231,0.3)] rounded-[2.5rem] p-4 shadow-2xl shadow-[rgba(0,0,0,0.5)]">
                {/* Notch */}
                <div className="w-24 h-5 bg-[#0B0F1A] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-1.5 rounded-full bg-[#1a2235]" />
                </div>

                {/* App header */}
                <div className="flex items-center gap-2.5 px-1 pb-3 border-b border-[rgba(108,92,231,0.15)] mb-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${steps[activeStep].color}, ${steps[activeStep].color}88)`,
                    }}
                  >
                    {(() => {
                      const Icon = steps[activeStep].icon
                      return <Icon size={15} className="text-white" />
                    })()}
                  </div>
                  <div>
                    <p className="text-[#f0f4ff] text-xs font-semibold">AVA</p>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00D1B2]" />
                      <span className="text-[10px] text-[#00D1B2]">
                        {steps[activeStep].label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="min-h-[240px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35 }}
                    >
                      <PhoneContent type={steps[activeStep].phoneContent} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-3 mt-12">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(i)}
              className="flex items-center gap-2 group"
              aria-label={`Go to step ${i + 1}`}
            >
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: activeStep === i ? '32px' : '8px',
                  height: '8px',
                  background: activeStep === i
                    ? `linear-gradient(90deg, ${step.color}, #00D1B2)`
                    : 'rgba(108,92,231,0.25)',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
