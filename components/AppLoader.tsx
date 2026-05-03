'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface AppLoaderProps {
  show: boolean
}

export function AppLoader({ show }: AppLoaderProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="app-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F1A]"
        >
          {/* Ambient blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[#6C5CE7]/12 blur-[140px]"
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#00D1B2]/8 blur-[130px]"
              animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
            <motion.div
              className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full bg-[#e040fb]/6 blur-[120px]"
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </div>

          {/* Logo + animation */}
          <div className="relative flex flex-col items-center gap-8 z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative"
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-[-16px] rounded-full border border-[#6C5CE7]/20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-[-32px] rounded-full border border-[#6C5CE7]/10"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              />

              <Image
                src="/logo.png"
                alt="AVA"
                width={100}
                height={76}
                className="object-contain drop-shadow-[0_0_32px_rgba(108,92,231,0.6)]"
                priority
              />
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center gap-2"
            >
              <h1 className="text-3xl font-extrabold text-white tracking-[0.25em]">AVA</h1>
              <p className="text-[#8892a4] text-sm font-medium tracking-widest uppercase">
                AI Sales Agent
              </p>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="w-48 h-0.5 bg-[#1a2235] rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] via-[#e040fb] to-[#00D1B2]"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 0.2,
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
