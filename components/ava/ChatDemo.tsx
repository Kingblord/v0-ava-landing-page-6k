'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ShoppingBag, CreditCard, Zap } from 'lucide-react'

type MessageRole = 'user' | 'ava' | 'system'

interface Message {
  id: string
  role: MessageRole
  content: string
  type?: 'text' | 'product' | 'payment' | 'success'
  delay: number
}

const chatSequence: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Hi! Do you have the Premium Wireless Headphones in stock?',
    type: 'text',
    delay: 0,
  },
  {
    id: '2',
    role: 'ava',
    content: "Hey! Yes, we do! Here's what I found for you:",
    type: 'text',
    delay: 1200,
  },
  {
    id: '3',
    role: 'ava',
    content: 'product',
    type: 'product',
    delay: 2000,
  },
  {
    id: '4',
    role: 'user',
    content: "Perfect! I'll take one. Can I pay here?",
    type: 'text',
    delay: 3800,
  },
  {
    id: '5',
    role: 'ava',
    content: "Absolutely! I've prepared a secure checkout just for you:",
    type: 'text',
    delay: 4800,
  },
  {
    id: '6',
    role: 'ava',
    content: 'payment',
    type: 'payment',
    delay: 5600,
  },
  {
    id: '7',
    role: 'system',
    content: 'success',
    type: 'success',
    delay: 8000,
  },
]

const bubbleVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  },
}

function ProductCard() {
  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className="bg-[#1a2235] border border-[rgba(108,92,231,0.3)] rounded-2xl p-3 w-56 overflow-hidden relative"
    >
      <div className="bg-gradient-to-br from-[#6C5CE7]/20 to-[#00D1B2]/20 rounded-xl h-24 flex items-center justify-center mb-3">
        <ShoppingBag size={32} className="text-[#6C5CE7]" />
      </div>
      <p className="text-[#f0f4ff] text-xs font-semibold leading-tight">
        Premium Wireless Headphones
      </p>
      <p className="text-[#8892a4] text-[10px] mt-0.5">Sony WH-1000XM5 · Black</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[#00D1B2] text-sm font-bold">$349.99</span>
        <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
          In Stock
        </span>
      </div>
    </motion.div>
  )
}

function PaymentCard() {
  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-br from-[#6C5CE7]/20 to-[#00D1B2]/10 border border-[rgba(108,92,231,0.4)] rounded-2xl p-3.5 w-56 relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] flex items-center justify-center">
          <CreditCard size={14} className="text-white" />
        </div>
        <span className="text-[#f0f4ff] text-xs font-semibold">Secure Checkout</span>
      </div>
      <div className="space-y-1.5 text-[11px] mb-3">
        <div className="flex justify-between text-[#8892a4]">
          <span>Product</span>
          <span className="text-[#f0f4ff]">WH-1000XM5</span>
        </div>
        <div className="flex justify-between text-[#8892a4]">
          <span>Quantity</span>
          <span className="text-[#f0f4ff]">1x</span>
        </div>
        <div className="border-t border-[rgba(108,92,231,0.2)] pt-1.5 flex justify-between font-semibold">
          <span className="text-[#8892a4]">Total</span>
          <span className="text-[#00D1B2]">$349.99</span>
        </div>
      </div>
      <button className="w-full py-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] text-white text-[11px] font-semibold">
        Pay Now
      </button>
    </motion.div>
  )
}

function SuccessBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="flex flex-col items-center gap-2 py-4"
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00D1B2]/30 to-[#6C5CE7]/30 flex items-center justify-center glow-teal">
        <CheckCircle2 size={30} className="text-[#00D1B2]" />
      </div>
      <p className="text-[#00D1B2] text-sm font-bold">Payment Successful!</p>
      <p className="text-[#8892a4] text-[11px] text-center">
        Order confirmed. Tracking info sent to your email.
      </p>
    </motion.div>
  )
}

export default function ChatDemo() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [cycleKey, setCycleKey] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    setVisibleMessages([])
    setIsTyping(false)

    chatSequence.forEach((msg, i) => {
      // Show typing indicator before AVA messages
      if (msg.role === 'ava') {
        timers.push(
          setTimeout(() => setIsTyping(true), msg.delay - 600)
        )
      }

      timers.push(
        setTimeout(() => {
          setIsTyping(false)
          setVisibleMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }, msg.delay)
      )
    })

    // Restart loop
    const lastDelay = chatSequence[chatSequence.length - 1].delay
    timers.push(
      setTimeout(() => {
        setVisibleMessages([])
        setCycleKey((k) => k + 1)
      }, lastDelay + 3500)
    )

    return () => timers.forEach(clearTimeout)
  }, [cycleKey])

  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      {/* Ambient glow */}
      <div className="absolute -inset-8 bg-[#6C5CE7]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Phone frame */}
      <div className="relative bg-[#0d1220] border border-[rgba(108,92,231,0.3)] rounded-[2.5rem] p-3 shadow-2xl shadow-[rgba(0,0,0,0.5)] glow-purple animate-float">
        {/* Notch */}
        <div className="w-24 h-5 bg-[#0B0F1A] rounded-full mx-auto mb-3 flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7]/60" />
          <div className="w-8 h-1.5 rounded-full bg-[#1a2235]" />
        </div>

        {/* Chat header */}
        <div className="flex items-center gap-3 px-3 pb-3 border-b border-[rgba(108,92,231,0.15)]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00D1B2] flex items-center justify-center shadow-lg shadow-[rgba(108,92,231,0.4)]">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[#f0f4ff] text-xs font-semibold leading-tight">AVA</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D1B2] animate-pulse" />
              <span className="text-[10px] text-[#00D1B2]">Online</span>
            </div>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8892a4]/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#8892a4]/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#8892a4]/40" />
          </div>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-hidden px-2 py-3 flex flex-col gap-2.5 scrollbar-hide">
          <AnimatePresence>
            {visibleMessages.map((msg) => (
              <motion.div
                key={msg.id}
                variants={bubbleVariants}
                initial="hidden"
                animate="visible"
                className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
              >
                {msg.role === 'system' && msg.type === 'success' ? (
                  <SuccessBadge />
                ) : msg.type === 'product' ? (
                  <ProductCard />
                ) : msg.type === 'payment' ? (
                  <PaymentCard />
                ) : (
                  <div
                    className={`max-w-[78%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#6C5CE7] to-[#8b7cf0] text-white rounded-br-md'
                        : 'bg-[#1a2235] text-[#f0f4ff] border border-[rgba(108,92,231,0.15)] rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex justify-start"
              >
                <div className="bg-[#1a2235] border border-[rgba(108,92,231,0.15)] rounded-2xl rounded-bl-md px-3.5 py-2.5 flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7]"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-3 pt-3 border-t border-[rgba(108,92,231,0.15)]">
          <div className="flex-1 bg-[#1a2235] border border-[rgba(108,92,231,0.15)] rounded-xl px-3 py-2">
            <div className="w-20 h-2 bg-[#2d3748] rounded-full" />
          </div>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2] flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute -right-4 top-20 bg-[#1a2235] border border-[rgba(0,209,178,0.3)] rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl"
      >
        <div className="w-2 h-2 rounded-full bg-[#00D1B2] animate-pulse" />
        <span className="text-[11px] text-[#00D1B2] font-semibold whitespace-nowrap">
          +$2,847 Today
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="absolute -left-4 bottom-24 bg-[#1a2235] border border-[rgba(108,92,231,0.3)] rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl"
      >
        <CheckCircle2 size={13} className="text-[#6C5CE7]" />
        <span className="text-[11px] text-[#f0f4ff] font-medium whitespace-nowrap">
          24 deals closed
        </span>
      </motion.div>
    </div>
  )
}
