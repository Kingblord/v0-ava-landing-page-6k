'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Twitter, Linkedin, Github, MessageCircle } from 'lucide-react'

const footerLinks = {
  Product: ['Features', 'Pricing', 'How It Works', 'Changelog', 'Roadmap'],
  Resources: ['Documentation', 'API Reference', 'Blog', 'Case Studies', 'Status'],
  Company: ['About', 'Careers', 'Press', 'Contact', 'Partners'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Security'],
}

export default function Footer() {
  const ref = useRef(null)
  const ctaRef = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const ctaInView = useInView(ctaRef, { once: true, margin: '-100px' })

  return (
    <>
      {/* Final CTA Section */}
      <section className="relative py-32 overflow-hidden" ref={ctaRef}>
        {/* Aurora / Mesh gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.12, 0.2, 0.12],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#6C5CE7] rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.08, 0.14, 0.08],
              x: [0, 60, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#00D1B2] rounded-full blur-[140px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05],
              x: [-40, 0, -40],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#e040fb] rounded-full blur-[160px]"
          />
          {/* Grid */}
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
              <p className="text-sm font-semibold text-[#8892a4] tracking-widest uppercase">
                Stop leaving money on the table
              </p>
              <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-[-0.03em] text-[#f0f4ff] leading-[1.05] text-balance">
                Stop losing customers
                <br />
                <span className="text-gradient">in your DMs</span>
              </h2>
              <p className="text-xl text-[#8892a4] leading-relaxed max-w-2xl mx-auto">
                Every unanswered message is a lost sale. AVA responds instantly, 24/7,
                closing deals while you focus on what matters most.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#pricing"
                className="shimmer relative inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-lg font-semibold text-white bg-gradient-to-r from-[#6C5CE7] via-[#8b7cf0] to-[#00D1B2] hover:opacity-90 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 shadow-2xl shadow-[rgba(108,92,231,0.5)] glow-purple"
              >
                Start Selling with AVA
                <ArrowRight size={20} />
              </a>
              <p className="text-xs text-[#8892a4] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D1B2]" />
                No credit card required &bull; Live in 5 minutes
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
              {[
                { value: '2,400+', label: 'Businesses' },
                { value: '$4.2M+', label: 'Revenue Processed' },
                { value: '99.9%', label: 'Uptime SLA' },
                { value: '< 1s', label: 'Response Time' },
              ].map((stat) => (
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
              <p className="text-sm text-[#8892a4] leading-relaxed max-w-xs">
                The AI Sales Agent that closes deals on WhatsApp and Telegram while
                you sleep. Automate your DMs, grow your revenue.
              </p>
              <div className="flex items-center gap-3 mt-5">
                {[
                  { icon: Twitter, href: '#', label: 'Twitter' },
                  { icon: Linkedin, href: '#', label: 'LinkedIn' },
                  { icon: Github, href: '#', label: 'GitHub' },
                  { icon: MessageCircle, href: '#', label: 'Discord' },
                ].map(({ icon: Icon, href, label }) => (
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

            {/* Links */}
            {Object.entries(footerLinks).map(([category, links], i) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * (i + 1) }}
              >
                <h4 className="text-xs font-bold text-[#f0f4ff] uppercase tracking-wider mb-4">
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-[#8892a4] hover:text-[#f0f4ff] transition-colors duration-200"
                      >
                        {link}
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
              &copy; {new Date().getFullYear()} AVA AI, Inc. All rights reserved.
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
          href="#pricing"
          className="shimmer pointer-events-auto flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] shadow-xl shadow-[rgba(108,92,231,0.4)]"
        >
          Get Started Free
          <ArrowRight size={18} />
        </a>
      </div>
    </>
  )
}
