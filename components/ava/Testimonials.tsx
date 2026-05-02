'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import type { TestimonialsContent } from '@/lib/content'

const AVATAR_COLORS = ['#6C5CE7', '#00D1B2', '#e040fb', '#8b7cf0', '#00D1B2', '#6C5CE7']

interface TestimonialsProps {
  content: TestimonialsContent
}

export default function Testimonials({ content }: TestimonialsProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00D1B2]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#6C5CE7]/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border border-[rgba(0,209,178,0.3)] bg-[rgba(0,209,178,0.06)] text-[#00D1B2] mb-5">
            <Quote size={12} />
            {content.eyebrow}
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-[#f0f4ff] text-balance">
            {content.headline}{' '}
            <span className="text-gradient">{content.headlineGradient}</span>
          </h2>
        </motion.div>

        {/* Testimonials grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {content.items.map((t, i) => {
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
                className="break-inside-avoid bg-[#111827] border border-[rgba(108,92,231,0.15)] rounded-3xl p-6 hover:border-[rgba(108,92,231,0.35)] transition-all duration-300 group"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-[#f0f4ff] text-sm leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                  style={{
                    background: `${color}15`,
                    border: `1px solid ${color}33`,
                    color,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  {t.metric}
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[#f0f4ff] text-sm font-semibold">{t.name}</p>
                    <p className="text-[#8892a4] text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
