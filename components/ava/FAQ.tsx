'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    q: 'Does AVA really sound human?',
    a: 'Yes. AVA is powered by the latest large language models via OpenRouter. Customers consistently report that conversations feel completely natural. You can also customise the tone, style, and personality to match your brand.',
  },
  {
    q: 'What happens if AVA can\'t answer a question?',
    a: 'If a customer asks something outside AVA\'s knowledge base (your products and configured responses), AVA will politely let them know and can optionally escalate or flag the conversation for you to review.',
  },
  {
    q: 'How does price negotiation work?',
    a: 'For each product you set a "floor price" — the minimum you\'re willing to accept. AVA will negotiate naturally within that range, starting from your listed price and moving down strategically, never going below your floor.',
  },
  {
    q: 'Do I need technical knowledge to set up AVA?',
    a: 'No. Setup involves pasting a webhook URL into Twilio and filling in your product details. It takes under 10 minutes. No code, no servers, no developers needed.',
  },
  {
    q: 'What WhatsApp providers does AVA support?',
    a: 'AVA currently works with Twilio\'s WhatsApp API (Sandbox and Production). Support for Meta Business API and other providers is on the roadmap.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — every plan starts with a 14-day free trial. No credit card required to get started. You can upgrade, downgrade, or cancel anytime.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="px-6 py-24 max-w-3xl mx-auto">
      <div className="text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[var(--ava-purple-light)] text-sm font-medium uppercase tracking-widest mb-4">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white text-balance">
            Questions{' '}
            <span className="text-gradient">answered</span>
          </h2>
        </motion.div>
      </div>

      <div className="flex flex-col gap-3">
        {FAQS.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="bg-[var(--ava-surface)] border border-[var(--ava-border)] rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-white font-medium text-sm pr-4">{faq.q}</span>
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--ava-purple)]/15 flex items-center justify-center">
                {open === i
                  ? <Minus className="w-3.5 h-3.5 text-[var(--ava-purple-light)]" />
                  : <Plus className="w-3.5 h-3.5 text-[var(--ava-purple-light)]" />
                }
              </span>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="px-5 pb-5 text-[var(--ava-text-muted)] text-sm leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
