'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const MIN_DISPLAY_MS = 2500

interface AppLoaderProps {
  show: boolean
}

export function AppLoader({ show }: AppLoaderProps) {
  // visible stays true until BOTH: show is false AND the minimum time has elapsed
  const [visible, setVisible] = useState(true)
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!show) {
      const elapsed = Date.now() - startRef.current
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
      timerRef.current = setTimeout(() => {
        setVisible(false)
        // Remove ava-loading class so page content becomes visible
        document.body.classList.remove('ava-loading')
      }, remaining)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [show])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="ava-loader-root"
          key="app-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ zIndex: 99999 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-[#0B0F1A] overflow-hidden"
        >
          {/* Ambient blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-[#6C5CE7]/10 blur-[160px]"
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#e040fb]/[0.08] blur-[150px]"
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            />
            <motion.div
              className="absolute top-[40%] left-[35%] w-[400px] h-[400px] rounded-full bg-[#00D1B2]/[0.07] blur-[130px]"
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            />
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Helmet with glow halo + float */}
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-[#6C5CE7]/30 via-[#e040fb]/20 to-[#00D1B2]/15 blur-[60px]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10"
              >
                <Image
                  src="/ava-helmet.png"
                  alt="AVA"
                  width={220}
                  height={186}
                  className="object-contain drop-shadow-[0_0_48px_rgba(108,92,231,0.55)]"
                  style={{ width: 220, height: 'auto' }}
                  priority
                />
              </motion.div>
            </div>

            {/* Loading label */}
            <p className="text-[#8892a4] text-[11px] font-bold tracking-[0.3em] uppercase">
              Loading
            </p>

            {/* Shimmer progress bar */}
            <div className="w-40 h-[2px] bg-[#1a2235] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] via-[#e040fb] to-[#00D1B2]"
                initial={{ x: '-110%' }}
                animate={{ x: '110%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 0.2,
                }}
              />
            </div>

            {/* Dot pulse */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] inline-block"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
