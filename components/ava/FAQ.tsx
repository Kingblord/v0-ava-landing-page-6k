'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Plus, HelpCircle } from 'lucide-react'
import type { FAQContent } from '@/lib/content'

interface FAQProps {
  content: FAQContent
}

export default function FAQ({ content }: FAQProps) {
  const [open, setOpen] = useState<number | null>(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="faq" className="relative py-28 overflow-hidden">
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-[#6C5CE7]/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border border-[rgba(108,92,231,0.3)] bg-[rgba(108,92,231,0.06)] text-[#8b7cf0] mb-5">
            <HelpCircle size={12} />
            {content.eyebrow}
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-[#f0f4ff] text-balance">
            {content.headline}{' '}
            <span className="text-gradient">{content.headlineGradient}</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {content.items.map((faq, i) => (
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
                  style={{ background: open === i ? 'rgba(108,92,231,0.2)' : 'rgba(108,92,231,0.06)' }}
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
                    <p className="px-6 pb-5 text-[#8892a4] text-sm leading-relaxed">{faq.a}</p>
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
