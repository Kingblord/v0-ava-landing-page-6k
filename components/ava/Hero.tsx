'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play, Star, Zap } from 'lucide-react'
import ChatDemo from './ChatDemo'
import type { HeroContent } from '@/lib/content'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
}

interface HeroProps {
  content: HeroContent
}

export default function Hero({ content }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#6C5CE7]/12 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00D1B2]/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#6C5CE7]/5 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(108,92,231,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,92,231,1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-7"
          >
            {/* Eyebrow badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-[rgba(108,92,231,0.3)] bg-[rgba(108,92,231,0.08)] text-[#8b7cf0]">
                <Zap size={12} className="text-[#00D1B2]" />
                {content.eyebrow}
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D1B2] animate-pulse" />
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-[-0.03em] leading-[1.05] text-[#f0f4ff]"
            >
              <span className="block">{content.headlineLine1}</span>
              <span className="block">{content.headlineLine2}</span>
              <span className="block text-gradient">{content.headlineGradient}</span>
              <span className="block">{content.headlineLine4}</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={itemVariants}
              className="text-lg text-[#8892a4] leading-relaxed max-w-lg"
            >
              {content.subtext}
            </motion.p>

            {/* Social proof */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {['#6C5CE7', '#00D1B2', '#e040fb', '#8b7cf0', '#33dbc2'].map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0B0F1A] flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${color}88, ${color})` }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-[#8892a4] mt-0.5">
                  <span className="text-[#f0f4ff] font-semibold">{content.socialProofCount}</span>{' '}
                  {content.socialProofLabel}
                </p>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <a
                href={content.primaryCtaHref}
                className="shimmer relative inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-[#6C5CE7] via-[#8b7cf0] to-[#00D1B2] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl shadow-[rgba(108,92,231,0.35)] glow-purple"
              >
                {content.primaryCtaLabel}
                <ArrowRight size={18} />
              </a>
              <button className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl text-base font-semibold text-[#f0f4ff] border border-[rgba(108,92,231,0.3)] hover:border-[rgba(108,92,231,0.6)] hover:bg-[rgba(108,92,231,0.08)] transition-all duration-200 group">
                <span className="w-9 h-9 rounded-full bg-[rgba(108,92,231,0.15)] border border-[rgba(108,92,231,0.3)] flex items-center justify-center group-hover:bg-[rgba(108,92,231,0.25)] transition-colors">
                  <Play size={14} className="text-[#8b7cf0] ml-0.5" />
                </span>
                {content.secondaryCtaLabel}
              </button>
            </motion.div>

            {/* Trust strip */}
            <motion.div variants={itemVariants} className="flex items-center gap-6 pt-2 flex-wrap">
              {content.trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i === 0 ? '#00D1B2' : i === 1 ? '#6C5CE7' : '#8b7cf0' }}
                  />
                  <span className="text-xs text-[#8892a4]">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Animated Chat Demo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <ChatDemo />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[11px] text-[#8892a4] tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-px h-10 bg-gradient-to-b from-[#6C5CE7] to-transparent"
          />
        </motion.div>
      </div>
    </section>
  )
}
