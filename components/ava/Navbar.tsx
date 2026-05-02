'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import type { NavbarContent } from '@/lib/content'

interface NavbarProps {
  content: NavbarContent
}

export default function Navbar({ content }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'glass border-b border-[rgba(108,92,231,0.15)] py-3'
            : 'py-5 bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="AVA Logo"
              width={48}
              height={48}
              className="object-contain group-hover:scale-105 transition-transform duration-300"
              priority
            />
            <span className="text-xl font-bold tracking-tight text-gradient">AVA</span>
          </a>

          {/* Desktop Links */}
          <ul className="hidden md:flex items-center gap-8">
            {content.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-[#8892a4] hover:text-[#f0f4ff] transition-colors duration-200 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] group-hover:w-full transition-all duration-300" />
                </a>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={content.signInHref}
              className="text-sm text-[#8892a4] hover:text-[#f0f4ff] transition-colors duration-200"
            >
              {content.signInLabel}
            </a>
            <a
              href={content.ctaHref}
              className="shimmer relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-[rgba(108,92,231,0.3)]"
            >
              {content.ctaLabel}
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#8892a4] hover:text-[#f0f4ff] transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 left-0 right-0 bottom-0 z-40 glass pt-20 px-6 flex flex-col"
          >
            <ul className="flex flex-col gap-6 mt-8">
              {content.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-xl font-medium text-[#f0f4ff] hover:text-gradient transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-auto pb-12 flex flex-col gap-4">
              <a
                href={content.ctaHref}
                onClick={() => setMobileOpen(false)}
                className="shimmer w-full text-center py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] shadow-lg shadow-[rgba(108,92,231,0.3)]"
              >
                {content.ctaLabel}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
