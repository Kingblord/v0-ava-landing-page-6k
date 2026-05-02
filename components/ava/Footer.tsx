'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Twitter, Linkedin, Github, MessageCircle, Mail, Phone, MapPin } from 'lucide-react'
import type { FooterContent } from '@/lib/content'

interface FooterProps {
  content: FooterContent
}

export default function Footer({ content }: FooterProps) {
  const ref = useRef(null)
  const ctaRef = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const ctaInView = useInView(ctaRef, { once: true, margin: '-100px' })

  const socialLinks = [
    { icon: Twitter, href: content.socials.twitter, label: 'Twitter' },
    { icon: Linkedin, href: content.socials.linkedin, label: 'LinkedIn' },
    { icon: Github, href: content.socials.github, label: 'GitHub' },
    { icon: MessageCircle, href: content.socials.discord, label: 'Discord' },
  ]

  return (
    <>
      {/* Final CTA Section */}
      <section className="relative py-32 overflow-hidden" ref={ctaRef}>
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#6C5CE7] rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.08, 0.14, 0.08], x: [0, 60, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#00D1B2] rounded-full blur-[140px]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05], x: [-40, 0, -40] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#e040fb] rounded-full blur-[160px]"
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(rgba(108,92,231,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,92,231,1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div className="space-y-5">
              <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-[-0.03em] text-[#f0f4ff] leading-[1.05] text-balance">
                {content.ctaHeadlineLine1}
                <br />
                <span className="text-gradient">{content.ctaHeadlineGradient}</span>
              </h2>
              <p className="text-xl text-[#8892a4] leading-relaxed max-w-2xl mx-auto">
                {content.ctaSubtext}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={content.ctaButtonHref}
                className="shimmer relative inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-lg font-semibold text-white bg-gradient-to-r from-[#6C5CE7] via-[#8b7cf0] to-[#00D1B2] hover:opacity-90 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 shadow-2xl shadow-[rgba(108,92,231,0.5)] glow-purple"
              >
                {content.ctaButtonLabel}
                <ArrowRight size={20} />
              </a>
              <p className="text-xs text-[#8892a4] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D1B2]" />
                {content.ctaSmallNote}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
              {content.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-gradient">{stat.value}</p>
                  <p className="text-xs text-[#8892a4] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer ref={ref} className="border-t border-[rgba(108,92,231,0.12)] bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="col-span-2"
            >
              <a href="#" className="flex items-center gap-2.5 mb-4 group">
                <Image
                  src="/logo.png"
                  alt="AVA Logo"
                  width={40}
                  height={40}
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <span className="text-xl font-bold tracking-tight text-gradient">AVA</span>
              </a>
              <p className="text-sm text-[#8892a4] leading-relaxed max-w-xs">{content.tagline}</p>

              {/* Contact info */}
              {(content.contact.email || content.contact.phone || content.contact.address) && (
                <div className="mt-5 space-y-2">
                  {content.contact.email && (
                    <a
                      href={`mailto:${content.contact.email}`}
                      className="flex items-center gap-2 text-xs text-[#8892a4] hover:text-[#f0f4ff] transition-colors"
                    >
                      <Mail size={13} className="text-[#6C5CE7]" />
                      {content.contact.email}
                    </a>
                  )}
                  {content.contact.phone && (
                    <a
                      href={`tel:${content.contact.phone}`}
                      className="flex items-center gap-2 text-xs text-[#8892a4] hover:text-[#f0f4ff] transition-colors"
                    >
                      <Phone size={13} className="text-[#00D1B2]" />
                      {content.contact.phone}
                    </a>
                  )}
                  {content.contact.address && (
                    <div className="flex items-start gap-2 text-xs text-[#8892a4]">
                      <MapPin size={13} className="text-[#e040fb] flex-shrink-0 mt-0.5" />
                      {content.contact.address}
                    </div>
                  )}
                </div>
              )}

              {/* Socials */}
              <div className="flex items-center gap-3 mt-5">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-9 h-9 rounded-xl bg-[#111827] border border-[rgba(108,92,231,0.15)] flex items-center justify-center text-[#8892a4] hover:text-[#f0f4ff] hover:border-[rgba(108,92,231,0.4)] hover:bg-[rgba(108,92,231,0.1)] transition-all duration-200"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Link columns */}
            {content.links.map((col, i) => (
              <motion.div
                key={col.category}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * (i + 1) }}
              >
                <h4 className="text-xs font-bold text-[#f0f4ff] uppercase tracking-wider mb-4">
                  {col.category}
                </h4>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="text-sm text-[#8892a4] hover:text-[#f0f4ff] transition-colors duration-200"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[rgba(108,92,231,0.1)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#8892a4]">
              &copy; {new Date().getFullYear()} {content.copyright}
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D1B2] animate-pulse" />
              <span className="text-xs text-[#8892a4]">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/95 to-transparent pointer-events-none">
        <a
          href={content.ctaButtonHref}
          className="shimmer pointer-events-auto flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] shadow-xl shadow-[rgba(108,92,231,0.4)]"
        >
          {content.ctaButtonLabel}
          <ArrowRight size={18} />
        </a>
      </div>
    </>
  )
}
