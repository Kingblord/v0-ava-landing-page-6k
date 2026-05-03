'use client'

import { Navbar } from './Navbar'
import { Hero } from './Hero'
import { BentoGrid } from './BentoGrid'
import { LiveFlow } from './LiveFlow'
import { Testimonials } from './Testimonials'
import { Pricing } from './Pricing'
import { FAQ } from './FAQ'
import { Footer } from './Footer'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--ava-bg)] overflow-x-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-[var(--ava-purple)]/8 blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--ava-teal)]/6 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[var(--ava-pink)]/5 blur-[150px]" />
      </div>

      <Navbar />
      <main>
        <Hero />
        <BentoGrid />
        <LiveFlow />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
