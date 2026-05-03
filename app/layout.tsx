import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { AppShell } from '@/components/AppShell'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AVA — AI Sales Agent That Closes Deals While You Sleep',
  description:
    'AVA is an Artificial Virtual Agent that automates your sales on WhatsApp and Telegram with human-like conversations, auto-payments, and smart negotiation. Never lose a customer in your DMs again.',
  keywords: [
    'AI sales agent',
    'WhatsApp automation',
    'Telegram bot',
    'sales automation',
    'AVA AI',
    'conversational AI',
    'payment automation',
  ],
  authors: [{ name: 'AVA' }],
  creator: 'AVA',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'AVA — AI Sales Agent That Closes Deals While You Sleep',
    description:
      'Automate your sales on WhatsApp and Telegram with human-like AI conversations and built-in payments.',
    siteName: 'AVA',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'AVA — Artificial Virtual Agent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AVA — AI Sales Agent That Closes Deals While You Sleep',
    description:
      'Automate your sales on WhatsApp and Telegram with human-like AI conversations and built-in payments.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#0B0F1A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-[#0B0F1A]`}
      data-scroll-behavior="smooth"
    >
      <body className="font-sans antialiased bg-[#0B0F1A] text-[#f0f4ff] overflow-x-hidden">
        {/* Blocking inline loader — paints before any JS, removed by AppShell when ready */}
        <div
          id="html-loader"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#0B0F1A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.6s ease',
          }}
        >
          {/* Ambient blobs */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
            <div style={{ position:'absolute', top:'-20%', left:'-10%', width:700, height:700, borderRadius:'50%', background:'rgba(108,92,231,0.12)', filter:'blur(160px)' }} />
            <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:600, height:600, borderRadius:'50%', background:'rgba(224,64,251,0.08)', filter:'blur(150px)' }} />
            <div style={{ position:'absolute', top:'40%', left:'35%', width:400, height:400, borderRadius:'50%', background:'rgba(0,209,178,0.07)', filter:'blur(130px)' }} />
          </div>

          {/* Glow halo */}
          <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{
              position:'absolute', width:280, height:280, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(108,92,231,0.35) 0%, rgba(224,64,251,0.2) 50%, transparent 80%)',
              filter:'blur(40px)',
              animation:'ava-pulse 3s ease-in-out infinite',
            }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ava-helmet.png"
              alt="AVA"
              width={220}
              height="auto"
              style={{
                width: 220,
                height: 'auto',
                objectFit:'contain',
                position:'relative',
                zIndex:1,
                filter:'drop-shadow(0 0 48px rgba(108,92,231,0.55))',
                animation:'ava-float 3s ease-in-out infinite',
              }}
            />
          </div>

          {/* Label */}
          <p style={{ color:'#8892a4', fontSize:11, fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', marginTop:24 }}>
            Loading
          </p>

          {/* Progress bar */}
          <div style={{ width:160, height:2, background:'#1a2235', borderRadius:4, overflow:'hidden', marginTop:16 }}>
            <div style={{
              height:'100%',
              background:'linear-gradient(90deg, #6C5CE7, #e040fb, #00D1B2)',
              borderRadius:4,
              animation:'ava-shimmer 1.5s ease-in-out infinite',
            }} />
          </div>

          {/* Dots */}
          <div style={{ display:'flex', gap:6, marginTop:14 }}>
            {[0,1,2].map((i) => (
              <span
                key={i}
                style={{
                  width:6, height:6, borderRadius:'50%', background:'#6C5CE7',
                  display:'inline-block',
                  animation:`ava-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Keyframes injected once, synchronously */}
        <style>{`
          @keyframes ava-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes ava-pulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.2);opacity:1} }
          @keyframes ava-shimmer { 0%{transform:translateX(-110%)} 100%{transform:translateX(110%)} }
          @keyframes ava-dot { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        `}</style>

        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster position="bottom-right" theme="dark" />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
