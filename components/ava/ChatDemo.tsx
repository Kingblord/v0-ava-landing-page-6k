'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const MESSAGES = [
  { id: 1, from: 'customer', text: 'Hi! Do you have the Air Max 270 in size 42?' },
  {
    id: 2,
    from: 'ava',
    text: 'Hey! Yes we do — the Air Max 270 in size 42 is available in Black/White and Triple White. Which colour were you thinking?',
  },
  { id: 3, from: 'customer', text: 'Triple White. How much?' },
  {
    id: 4,
    from: 'ava',
    text: '',
    isCard: true,
    card: {
      name: 'Air Max 270 — Triple White',
      size: 'Size 42',
      price: '$129.99',
      img: null,
    },
  },
  { id: 5, from: 'customer', text: "Can you do $110? That's my budget." },
  {
    id: 6,
    from: 'ava',
    text: "I can stretch to $119 for you — that's my best price and still includes free delivery. Deal?",
  },
  { id: 7, from: 'customer', text: 'Deal! How do I pay?' },
  {
    id: 8,
    from: 'ava',
    text: '',
    isPayment: true,
  },
  {
    id: 9,
    from: 'ava',
    text: 'Order confirmed! Your Air Max 270 will be delivered within 2–3 days. Thanks for shopping with us!',
    isSuccess: true,
  },
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[#1a2235] rounded-2xl rounded-bl-sm w-fit">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--ava-purple-light)]"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

function ProductCard({ card }: { card: NonNullable<(typeof MESSAGES)[0]['card']> }) {
  return (
    <div className="bg-[#0f1829] border border-[var(--ava-border)] rounded-xl overflow-hidden w-52">
      <div className="bg-[#1a2235] h-28 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[var(--ava-purple)]/20 flex items-center justify-center">
          <span className="text-3xl">👟</span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-white text-xs font-semibold leading-tight">{card.name}</p>
        <p className="text-[var(--ava-text-muted)] text-xs mt-0.5">{card.size}</p>
        <p className="text-[var(--ava-teal)] font-bold mt-1">{card.price}</p>
        <div className="mt-2 bg-[var(--ava-purple)]/20 rounded-lg px-3 py-1.5 text-center">
          <span className="text-[var(--ava-purple-light)] text-xs font-medium">View Details</span>
        </div>
      </div>
    </div>
  )
}

function PaymentButton() {
  return (
    <div className="bg-[#0f1829] border border-[var(--ava-teal)]/30 rounded-xl p-3 w-52">
      <p className="text-[var(--ava-text-muted)] text-xs mb-2">Secure Payment</p>
      <div className="bg-[var(--ava-teal)] rounded-lg px-3 py-2 text-center">
        <span className="text-[#0B0F1A] text-sm font-bold">Pay $119.00</span>
      </div>
      <p className="text-[var(--ava-text-muted)] text-xs mt-2 text-center">Visa •••• 4242</p>
    </div>
  )
}

export function ChatDemo() {
  const [visibleCount, setVisibleCount] = useState(0)
  const [showTyping, setShowTyping] = useState(false)

  useEffect(() => {
    if (visibleCount >= MESSAGES.length) {
      const reset = setTimeout(() => setVisibleCount(0), 4000)
      return () => clearTimeout(reset)
    }

    const nextMsg = MESSAGES[visibleCount]
    const isAva = nextMsg?.from === 'ava'
    let delay = visibleCount === 0 ? 800 : 1200

    if (isAva) {
      const typingTimer = setTimeout(() => setShowTyping(true), delay - 400)
      const showTimer = setTimeout(() => {
        setShowTyping(false)
        setVisibleCount((c) => c + 1)
      }, delay + 800)
      return () => {
        clearTimeout(typingTimer)
        clearTimeout(showTimer)
      }
    } else {
      const timer = setTimeout(() => setVisibleCount((c) => c + 1), delay)
      return () => clearTimeout(timer)
    }
  }, [visibleCount])

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Phone frame */}
      <div className="bg-[#0d1424] border border-[var(--ava-border)] rounded-[2rem] overflow-hidden shadow-2xl shadow-[var(--ava-purple)]/20">
        {/* Header */}
        <div className="bg-[var(--ava-surface)] px-4 py-3 flex items-center gap-3 border-b border-[var(--ava-border)]">
          <div className="w-9 h-9 rounded-full bg-[var(--aro-green)]/20 flex items-center justify-center flex-shrink-0">
            <Image src="/aromsg-logo.png" alt="Arobi" width={24} height={24} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-semibold">Arobi Sales Agent</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--aro-green)] animate-pulse" />
              <span className="text-[var(--aro-green)] text-xs">Online</span>
            </div>
          </div>
          <div className="text-muted-foreground text-xs">WhatsApp</div>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-hidden px-3 py-3 flex flex-col gap-2 relative">
          <AnimatePresence>
            {MESSAGES.slice(0, visibleCount).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`flex ${msg.from === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.isCard && msg.card ? (
                  <ProductCard card={msg.card} />
                ) : msg.isPayment ? (
                  <PaymentButton />
                ) : (
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                      msg.from === 'customer'
                        ? 'bg-[var(--ava-purple)] text-white rounded-br-sm'
                        : msg.isSuccess
                        ? 'bg-[var(--ava-teal)]/20 border border-[var(--ava-teal)]/40 text-[var(--ava-teal)] rounded-bl-sm'
                        : 'bg-[#1a2235] text-[var(--ava-text)] rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {showTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <TypingIndicator />
            </motion.div>
          )}
        </div>

        {/* Input bar */}
        <div className="bg-[#111827] px-3 py-2.5 border-t border-[var(--ava-border)] flex items-center gap-2">
          <div className="flex-1 bg-[#1a2235] rounded-full px-3 py-1.5 text-xs text-[var(--ava-text-muted)]">
            Type a message...
          </div>
          <div className="w-7 h-7 rounded-full bg-[var(--ava-teal)] flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-[#0B0F1A]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Glow */}
      <div className="absolute inset-0 rounded-[2rem] bg-[var(--ava-purple)]/10 blur-2xl -z-10 scale-95" />
    </div>
  )
}
