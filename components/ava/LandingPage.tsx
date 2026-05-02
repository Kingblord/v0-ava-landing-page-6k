'use client'

import { useEffect, useState } from 'react'
import { getAllContent, DEFAULTS } from '@/lib/content'
import type { SiteContent } from '@/lib/content'
import Navbar from './Navbar'
import Hero from './Hero'
import BentoGrid from './BentoGrid'
import LiveFlow from './LiveFlow'
import Testimonials from './Testimonials'
import Pricing from './Pricing'
import FAQ from './FAQ'
import Footer from './Footer'

export default function LandingPage() {
  const [content, setContent] = useState<SiteContent>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getAllContent()
      .then((data) => {
        setContent(data)
        setLoaded(true)
      })
      .catch(() => {
        // Firestore unavailable — use hardcoded defaults silently
        setLoaded(true)
      })
  }, [])

  return (
    <main className="relative bg-[#0B0F1A] min-h-screen">
      <Navbar content={content.navbar} />
      <Hero content={content.hero} />
      <BentoGrid content={content.bento} />
      <LiveFlow content={content.liveFlow} />
      <Testimonials content={content.testimonials} />
      <Pricing content={content.pricing} />
      <FAQ content={content.faq} />
      <Footer content={content.footer} />
    </main>
  )
}
