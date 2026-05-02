import { getAllContent } from '@/lib/content'
import Navbar from '@/components/ava/Navbar'
import Hero from '@/components/ava/Hero'
import BentoGrid from '@/components/ava/BentoGrid'
import LiveFlow from '@/components/ava/LiveFlow'
import Testimonials from '@/components/ava/Testimonials'
import Pricing from '@/components/ava/Pricing'
import FAQ from '@/components/ava/FAQ'
import Footer from '@/components/ava/Footer'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const content = await getAllContent()

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
