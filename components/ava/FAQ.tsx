'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Plus, HelpCircle } from 'lucide-react'

const faqs = [
  {
    q: 'How quickly can I get AVA running?',
    a: 'You can go live in under 5 minutes. Connect your WhatsApp Business or Telegram account, upload your product catalog, set your pricing rules, and activate AVA. No code or developers required.',
  },
  {
    q: 'Does AVA really sound human?',
    a: 'Yes. AVA is trained on millions of real sales conversations and uses advanced language models to respond naturally, handle objections, and match the tone of your brand. Most customers have no idea they\'re talking to an AI.',
  },
  {
    q: 'What payment methods does AVA support?',
    a: 'AVA integrates with Stripe, PayPal, Flutterwave, Paystack, and most major payment gateways. It generates secure, branded payment links that customers can complete directly within the chat.',
  },
  {
    q: 'Can I customize what AVA says and how it behaves?',
    a: 'Absolutely. You can define AVA\'s personality, tone, negotiation limits, product knowledge, and response scripts. Think of it as training a new sales agent — you set the rules, AVA executes them perfectly.',
  },
  {
    q: 'What happens if a customer asks something AVA doesn\'t know?',
    a: 'AVA intelligently escalates complex or sensitive queries to a human agent when needed. You set the escalation triggers, and AVA hands off the conversation with full context so your team can pick up seamlessly.',
  },
  {
    q: 'Is my business data secure?',
    a: 'Yes. All data is encrypted end-to-end, stored on SOC 2 certified infrastructure, and never used to train models for other customers. We\'re fully GDPR compliant and offer data residency options for enterprise clients.',
  },
  {
    q: 'Can I try AVA before paying?',
    a: 'Every plan includes a 14-day free trial with full access to all features. No credit card required to start. You only pay when you decide AVA is right for your business.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="faq" className="relative py-28 overflow-hidden">
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-[#6C5CE7]/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border border-[rgba(108,92,231,0.3)] bg-[rgba(108,92,231,0.06)] text-[#8b7cf0] mb-5">
            <HelpCircle size={12} />
            Frequently Asked Questions
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-[#f0f4ff] text-balance">
            Everything you need to{' '}
            <span className="text-gradient">know about AVA</span>
          </h2>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.07 * i }}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                open === i
                  ? 'bg-[#111827] border-[rgba(108,92,231,0.35)]'
                  : 'bg-[#0d1220] border-[rgba(108,92,231,0.1)] hover:border-[rgba(108,92,231,0.25)]'
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={open === i}
              >
                <span className="text-[#f0f4ff] text-base font-medium leading-snug pr-4">
                  {faq.q}
                </span>
                <motion.div
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0 w-7 h-7 rounded-xl border border-[rgba(108,92,231,0.3)] flex items-center justify-center"
                  style={{
                    background: open === i ? 'rgba(108,92,231,0.2)' : 'rgba(108,92,231,0.06)',
                  }}
                >
                  <Plus size={15} className="text-[#8b7cf0]" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="px-6 pb-5 text-[#8892a4] text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
