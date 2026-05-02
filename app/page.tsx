import Navbar from '@/components/ava/Navbar'
import Hero from '@/components/ava/Hero'
import BentoGrid from '@/components/ava/BentoGrid'
import LiveFlow from '@/components/ava/LiveFlow'
import Testimonials from '@/components/ava/Testimonials'
import Pricing from '@/components/ava/Pricing'
import FAQ from '@/components/ava/FAQ'
import Footer from '@/components/ava/Footer'

export default function HomePage() {
  return (
    <main className="relative bg-[#0B0F1A] min-h-screen">
      <Navbar />
      <Hero />
      <BentoGrid />
      <LiveFlow />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  )
}
