'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check, Zap, Star, ArrowRight, Crown } from 'lucide-react'
import type { PricingContent } from '@/lib/content'

const PLAN_COLORS = ['#6C5CE7', '#00D1B2', '#8b7cf0']

function BorderBeam() {
  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
      <motion.div
        className="absolute h-[2px] w-32"
        style={{ background: 'linear-gradient(90deg, transparent, #00D1B2, transparent)', top: 0 }}
        animate={{ left: ['-10%', '110%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
      />
      <motion.div
        className="absolute w-[2px] h-32"
        style={{ background: 'linear-gradient(180deg, transparent, #6C5CE7, transparent)', right: 0 }}
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 0.5, delay: 0.8 }}
      />
      <motion.div
        className="absolute h-[2px] w-32"
        style={{ background: 'linear-gradient(90deg, transparent, #00D1B2, transparent)', bottom: 0 }}
        animate={{ left: ['110%', '-10%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 0.5, delay: 1.6 }}
      />
      <motion.div
        className="absolute w-[2px] h-32"
        style={{ background: 'linear-gradient(180deg, transparent, #6C5CE7, transparent)', left: 0 }}
        animate={{ top: ['110%', '-10%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 0.5, delay: 2.4 }}
      />
    </div>
  )
}

interface PricingProps {
  content: PricingContent
}

export default function Pricing({ content }: PricingProps) {
  const [annual, setAnnual] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="pricing" className="relative py-28 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#6C5CE7]/6 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border border-[rgba(108,92,231,0.3)] bg-[rgba(108,92,231,0.06)] text-[#8b7cf0] mb-5">
            <Crown size={12} />
            {content.eyebrow}
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-[#f0f4ff] mb-5 text-balance">
            {content.headline}{' '}
            <span className="text-gradient">{content.headlineGradient}</span>
          </h2>
          <p className="text-[#8892a4] text-lg max-w-xl mx-auto mb-8">{content.subtext}</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-[#111827] border border-[rgba(108,92,231,0.2)] rounded-full p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                !annual
                  ? 'bg-gradient-to-r from-[#6C5CE7] to-[#8b7cf0] text-white shadow-lg'
                  : 'text-[#8892a4] hover:text-[#f0f4ff]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                annual
                  ? 'bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] text-white shadow-lg'
                  : 'text-[#8892a4] hover:text-[#f0f4ff]'
              }`}
            >
              Annual
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(0,209,178,0.2)] text-[#00D1B2]">
                {content.annualSaveLabel}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {content.plans.map((plan, i) => {
            const color = PLAN_COLORS[i] ?? '#6C5CE7'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
                className={`relative noise-texture rounded-3xl p-8 flex flex-col gap-6 ${
                  plan.popular
                    ? 'bg-[#0f1a2e] border border-[rgba(0,209,178,0.3)] animate-pulse-glow'
                    : 'bg-[#111827] border border-[rgba(108,92,231,0.15)]'
                }`}
              >
                {plan.popular && <BorderBeam />}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] text-white shadow-lg shadow-[rgba(108,92,231,0.4)]">
                      <Star size={11} className="fill-white" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}22`, border: `1px solid ${color}44` }}
                    >
                      <Zap size={15} style={{ color }} />
                    </div>
                    <h3 className="text-lg font-bold text-[#f0f4ff]">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-[#8892a4]">{plan.tagline}</p>
                </div>

                <div className="flex items-end gap-2">
                  <motion.span
                    key={annual ? 'annual' : 'monthly'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-5xl font-bold text-[#f0f4ff] tracking-tight"
                  >
                    ${annual ? plan.annualPrice : plan.monthlyPrice}
                  </motion.span>
                  <span className="text-[#8892a4] text-sm pb-1.5">/month</span>
                </div>
                {annual && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-[#00D1B2] -mt-4"
                  >
                    Billed annually — saves ${(plan.monthlyPrice - plan.annualPrice) * 12}/yr
                  </motion.p>
                )}

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${color}22` }}
                      >
                        <Check size={11} style={{ color }} strokeWidth={2.5} />
                      </div>
                      <span className="text-sm text-[#8892a4] leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  className={`shimmer inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] text-white shadow-xl shadow-[rgba(108,92,231,0.3)]'
                      : 'bg-[rgba(108,92,231,0.12)] border border-[rgba(108,92,231,0.25)] text-[#8b7cf0] hover:bg-[rgba(108,92,231,0.2)]'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={15} />
                </a>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-[#8892a4] text-sm">{content.footerNote}</p>
        </motion.div>
      </div>
    </section>
  )
}
