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
      <body className="font-sans antialiased bg-[#0B0F1A] text-[#f0f4ff] overflow-x-hidden ava-loading">
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
