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
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F1A] overflow-hidden"
        >
          {/* Background ambient blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-[#6C5CE7]/10 blur-[160px]"
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#e040fb]/8 blur-[150px]"
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            />
            <motion.div
              className="absolute top-[45%] left-[40%] w-[400px] h-[400px] rounded-full bg-[#00D1B2]/6 blur-[130px]"
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            />
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Helmet image with glow + float animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.34, 1.4, 0.64, 1] }}
              className="relative flex items-center justify-center"
            >
              {/* Glow halo behind helmet */}
              <motion.div
                className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-[#6C5CE7]/30 via-[#e040fb]/20 to-[#00D1B2]/15 blur-[60px]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Floating helmet */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src="/ava-helmet.png"
                  alt="AVA"
                  width={220}
                  height={220}
                  className="object-contain relative z-10 drop-shadow-[0_0_48px_rgba(108,92,231,0.5)]"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Brand label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-col items-center gap-1"
            >
              <p className="text-[#8892a4] text-xs font-semibold tracking-[0.3em] uppercase">
                Loading
              </p>
            </motion.div>

            {/* Shimmer progress bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="w-40 h-[2px] bg-[#1a2235] rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] via-[#e040fb] to-[#00D1B2]"
                initial={{ x: '-100%' }}
                animate={{ x: '110%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 0.3,
                }}
              />
            </motion.div>

            {/* Three dot pulse */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-1.5"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7]"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
