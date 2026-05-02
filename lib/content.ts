import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavbarContent {
  links: { label: string; href: string }[]
  ctaLabel: string
  ctaHref: string
  signInLabel: string
  signInHref: string
}

export interface HeroContent {
  eyebrow: string
  headlineLine1: string
  headlineLine2: string
  headlineGradient: string
  headlineLine4: string
  subtext: string
  socialProofCount: string
  socialProofLabel: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  trustItems: { label: string }[]
}

export interface BentoContent {
  eyebrow: string
  headline: string
  headlineGradient: string
  subtext: string
  cards: {
    title: string
    description: string
  }[]
}

export interface LiveFlowContent {
  eyebrow: string
  headline: string
  headlineGradient: string
  steps: {
    label: string
    title: string
    description: string
  }[]
}

export interface TestimonialsContent {
  eyebrow: string
  headline: string
  headlineGradient: string
  items: {
    name: string
    role: string
    avatar: string
    quote: string
    metric: string
  }[]
}

export interface PricingContent {
  eyebrow: string
  headline: string
  headlineGradient: string
  subtext: string
  annualSaveLabel: string
  plans: {
    name: string
    tagline: string
    monthlyPrice: number
    annualPrice: number
    features: string[]
    cta: string
    popular: boolean
  }[]
  footerNote: string
}

export interface FAQContent {
  eyebrow: string
  headline: string
  headlineGradient: string
  items: { q: string; a: string }[]
}

export interface FooterContent {
  tagline: string
  ctaHeadlineLine1: string
  ctaHeadlineGradient: string
  ctaSubtext: string
  ctaButtonLabel: string
  ctaButtonHref: string
  ctaSmallNote: string
  stats: { value: string; label: string }[]
  links: { category: string; items: { label: string; href: string }[] }[]
  contact: {
    email: string
    phone: string
    address: string
  }
  socials: {
    twitter: string
    linkedin: string
    github: string
    discord: string
  }
  copyright: string
}

export interface SiteContent {
  navbar: NavbarContent
  hero: HeroContent
  bento: BentoContent
  liveFlow: LiveFlowContent
  testimonials: TestimonialsContent
  pricing: PricingContent
  faq: FAQContent
  footer: FooterContent
}

// ─── Defaults (mirrors all hardcoded copy) ────────────────────────────────────

export const DEFAULTS: SiteContent = {
  navbar: {
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    ctaLabel: 'Get Started Free',
    ctaHref: '#pricing',
    signInLabel: 'Sign In',
    signInHref: '#pricing',
  },

  hero: {
    eyebrow: 'AI-Powered Sales Automation',
    headlineLine1: 'Your AI Sales',
    headlineLine2: 'Agent That',
    headlineGradient: 'Closes Deals',
    headlineLine4: 'While You Sleep',
    subtext:
      'AVA handles every customer conversation on WhatsApp & Telegram — answering questions, negotiating prices, and collecting payments automatically. Your business sells 24/7, even while you\'re offline.',
    socialProofCount: '2,400+',
    socialProofLabel: 'businesses scaling with AVA',
    primaryCtaLabel: 'Start Selling Free',
    primaryCtaHref: '#pricing',
    secondaryCtaLabel: 'Watch Demo',
    trustItems: [
      { label: '$4.2M+ Revenue Generated' },
      { label: 'No Credit Card Required' },
      { label: 'Setup in 5 Minutes' },
    ],
  },

  bento: {
    eyebrow: 'Everything You Need to Sell at Scale',
    headline: 'Built for businesses that demand',
    headlineGradient: 'results, not complexity',
    subtext:
      'AVA combines cutting-edge AI with battle-tested sales psychology to turn every conversation into a closed deal.',
    cards: [
      {
        title: 'Human-like Conversations',
        description:
          'AVA reads context, handles objections, and builds rapport exactly like your best salesperson — but available 24/7 across every conversation simultaneously.',
      },
      {
        title: 'Auto-Payments',
        description:
          'Send instant payment links, accept card payments, and confirm orders — all without leaving the chat.',
      },
      {
        title: 'Smart Negotiation',
        description:
          'AVA dynamically adjusts pricing within your defined rules, maximizing conversion while protecting your margins.',
      },
      {
        title: 'Multi-Platform Reach',
        description:
          'Deploy AVA on WhatsApp, Telegram, Instagram, and web chat from a single dashboard. One agent, infinite channels.',
      },
      {
        title: 'Real-Time Revenue Analytics',
        description:
          'Track every deal, conversation, and conversion in a live dashboard built for operators who care about outcomes.',
      },
      {
        title: 'Enterprise Security',
        description:
          'End-to-end encryption, SOC 2 compliance, and role-based access control protect your business data at every layer.',
      },
      {
        title: '5-Minute Setup',
        description:
          'Connect your WhatsApp Business account, add your products, and go live. No code, no developers required.',
      },
      {
        title: 'Self-Learning AI',
        description:
          'AVA learns from every conversation, continuously improving its close rate based on what actually works for your specific products and customers.',
      },
    ],
  },

  liveFlow: {
    eyebrow: 'How AVA Works',
    headline: 'From first message to',
    headlineGradient: 'paid customer',
    steps: [
      {
        label: 'Connect',
        title: 'Connect Your Channels',
        description:
          'Link AVA to your WhatsApp Business account or Telegram bot in under 5 minutes. No developers, no code — just connect and configure your product catalog.',
      },
      {
        label: 'Chat',
        title: 'AVA Engages Every Customer',
        description:
          'The moment a customer messages you, AVA responds instantly with intelligent, context-aware replies. It qualifies leads, handles objections, and drives intent to purchase.',
      },
      {
        label: 'Revenue',
        title: 'Close Deals & Collect Payments',
        description:
          'AVA sends payment links, processes transactions, and confirms orders — all within the conversation. Your customer pays without ever leaving their chat app.',
      },
    ],
  },

  testimonials: {
    eyebrow: 'Real Results from Real Businesses',
    headline: '2,400+ businesses are',
    headlineGradient: 'already closing more deals',
    items: [
      {
        name: 'Amara Osei',
        role: 'Founder, StyleHub Lagos',
        avatar: 'AO',
        quote:
          'AVA closed 47 orders in the first week without me lifting a finger. My WhatsApp used to be chaos. Now it prints money.',
        metric: '+$18,400 first month',
      },
      {
        name: 'Carlos Mendes',
        role: 'CEO, TechGear Brasil',
        avatar: 'CM',
        quote:
          'The negotiation feature blew my mind. AVA offered exactly the right discount at the right moment and our conversion rate tripled.',
        metric: '3x conversion rate',
      },
      {
        name: 'Priya Sharma',
        role: 'Head of Sales, EduPrime India',
        avatar: 'PS',
        quote:
          "We sell online courses across Telegram. AVA handles 300+ inquiries daily and sounds more human than half my team. It's incredible.",
        metric: '300+ daily conversations',
      },
      {
        name: 'James Adewale',
        role: 'Owner, AutoParts NG',
        avatar: 'JA',
        quote:
          'Setup took 4 minutes. I watched my first automated sale go through 20 minutes later. ROI on day one. Period.',
        metric: 'ROI on day 1',
      },
      {
        name: 'Sofia Petrov',
        role: 'Marketing Lead, ShopBalkan',
        avatar: 'SP',
        quote:
          'We connected AVA to our Telegram channel and revenue from that channel grew 280% in 6 weeks. The data speaks for itself.',
        metric: '+280% Telegram revenue',
      },
      {
        name: 'David Okonkwo',
        role: 'Co-founder, Lux Jewels',
        avatar: 'DO',
        quote:
          'High-ticket jewelry sales felt impossible to automate. AVA handles it with such finesse. Customers compliment "our customer service."',
        metric: 'Avg order value $1,200',
      },
    ],
  },

  pricing: {
    eyebrow: 'Simple, Transparent Pricing',
    headline: 'Start free. Scale as you',
    headlineGradient: 'close more deals',
    subtext:
      'No hidden fees. Cancel anytime. Every plan includes a 14-day free trial — no credit card required.',
    annualSaveLabel: 'Save 30%',
    plans: [
      {
        name: 'Starter',
        tagline: 'Perfect for solo sellers',
        monthlyPrice: 47,
        annualPrice: 33,
        popular: false,
        cta: 'Start Free Trial',
        features: [
          '1 WhatsApp number',
          'Up to 500 conversations/mo',
          'Product catalog (up to 50 items)',
          'Basic payment links',
          'Email support',
          'Analytics dashboard',
        ],
      },
      {
        name: 'Pro',
        tagline: 'For growing businesses',
        monthlyPrice: 97,
        annualPrice: 67,
        popular: true,
        cta: 'Start Free Trial',
        features: [
          'Up to 5 WhatsApp + Telegram numbers',
          'Unlimited conversations',
          'Unlimited product catalog',
          'Smart negotiation engine',
          'Auto-payment processing',
          'Priority support (24/7)',
          'Advanced analytics & exports',
          'Custom AI personality',
        ],
      },
      {
        name: 'Enterprise',
        tagline: 'For large-scale operations',
        monthlyPrice: 297,
        annualPrice: 207,
        popular: false,
        cta: 'Contact Sales',
        features: [
          'Unlimited channels & numbers',
          'White-label AVA',
          'Custom AI training on your data',
          'Dedicated account manager',
          'SLA guarantee (99.9%)',
          'SOC 2 / GDPR compliance',
          'API access & webhooks',
          'Onboarding & migration support',
        ],
      },
    ],
    footerNote: 'Have questions? Check our FAQ or talk to sales.',
  },

  faq: {
    eyebrow: 'Frequently Asked Questions',
    headline: 'Everything you need to',
    headlineGradient: 'know about AVA',
    items: [
      {
        q: 'How quickly can I get AVA running?',
        a: "You can go live in under 5 minutes. Connect your WhatsApp Business or Telegram account, upload your product catalog, set your pricing rules, and activate AVA. No code or developers required.",
      },
      {
        q: 'Does AVA really sound human?',
        a: "Yes. AVA is trained on millions of real sales conversations and uses advanced language models to respond naturally, handle objections, and match the tone of your brand. Most customers have no idea they're talking to an AI.",
      },
      {
        q: 'What payment methods does AVA support?',
        a: 'AVA integrates with Stripe, PayPal, Flutterwave, Paystack, and most major payment gateways. It generates secure, branded payment links that customers can complete directly within the chat.',
      },
      {
        q: 'Can I customize what AVA says and how it behaves?',
        a: "Absolutely. You can define AVA's personality, tone, negotiation limits, product knowledge, and response scripts. Think of it as training a new sales agent — you set the rules, AVA executes them perfectly.",
      },
      {
        q: "What happens if a customer asks something AVA doesn't know?",
        a: "AVA intelligently escalates complex or sensitive queries to a human agent when needed. You set the escalation triggers, and AVA hands off the conversation with full context so your team can pick up seamlessly.",
      },
      {
        q: 'Is my business data secure?',
        a: "Yes. All data is encrypted end-to-end, stored on SOC 2 certified infrastructure, and never used to train models for other customers. We're fully GDPR compliant and offer data residency options for enterprise clients.",
      },
      {
        q: 'Can I try AVA before paying?',
        a: 'Every plan includes a 14-day free trial with full access to all features. No credit card required to start. You only pay when you decide AVA is right for your business.',
      },
    ],
  },

  footer: {
    tagline:
      'The AI Sales Agent that closes deals on WhatsApp and Telegram while you sleep. Automate your DMs, grow your revenue.',
    ctaHeadlineLine1: 'Stop losing customers',
    ctaHeadlineGradient: 'in your DMs',
    ctaSubtext:
      'Every unanswered message is a lost sale. AVA responds instantly, 24/7, closing deals while you focus on what matters most.',
    ctaButtonLabel: 'Start Selling with AVA',
    ctaButtonHref: '#pricing',
    ctaSmallNote: 'No credit card required · Live in 5 minutes',
    stats: [
      { value: '2,400+', label: 'Businesses' },
      { value: '$4.2M+', label: 'Revenue Processed' },
      { value: '99.9%', label: 'Uptime SLA' },
      { value: '< 1s', label: 'Response Time' },
    ],
    links: [
      {
        category: 'Product',
        items: [
          { label: 'Features', href: '#features' },
          { label: 'Pricing', href: '#pricing' },
          { label: 'How It Works', href: '#how-it-works' },
          { label: 'Changelog', href: '#' },
          { label: 'Roadmap', href: '#' },
        ],
      },
      {
        category: 'Resources',
        items: [
          { label: 'Documentation', href: '#' },
          { label: 'API Reference', href: '#' },
          { label: 'Blog', href: '#' },
          { label: 'Case Studies', href: '#' },
          { label: 'Status', href: '#' },
        ],
      },
      {
        category: 'Company',
        items: [
          { label: 'About', href: '#' },
          { label: 'Careers', href: '#' },
          { label: 'Press', href: '#' },
          { label: 'Contact', href: '#' },
          { label: 'Partners', href: '#' },
        ],
      },
      {
        category: 'Legal',
        items: [
          { label: 'Privacy Policy', href: '#' },
          { label: 'Terms of Service', href: '#' },
          { label: 'Cookie Policy', href: '#' },
          { label: 'GDPR', href: '#' },
          { label: 'Security', href: '#' },
        ],
      },
    ],
    contact: {
      email: 'hello@ava.ai',
      phone: '',
      address: '',
    },
    socials: {
      twitter: '#',
      linkedin: '#',
      github: '#',
      discord: '#',
    },
    copyright: 'AVA AI, Inc. All rights reserved.',
  },
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

const COLLECTION = 'siteContent'

/**
 * Fetch a single section from Firestore.
 * If the doc doesn't exist, write the default and return it.
 */
export async function getSection<K extends keyof SiteContent>(
  section: K
): Promise<SiteContent[K]> {
  const ref = doc(db, COLLECTION, section)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return snap.data() as SiteContent[K]
  }
  // Auto-init with defaults
  await setDoc(ref, DEFAULTS[section] as object)
  return DEFAULTS[section]
}

/**
 * Persist a section to Firestore (full overwrite).
 */
export async function saveSection<K extends keyof SiteContent>(
  section: K,
  data: SiteContent[K]
): Promise<void> {
  const ref = doc(db, COLLECTION, section)
  await setDoc(ref, data as object)
}

/**
 * Reset a section to its hardcoded defaults.
 */
export async function resetSection<K extends keyof SiteContent>(
  section: K
): Promise<SiteContent[K]> {
  const ref = doc(db, COLLECTION, section)
  await setDoc(ref, DEFAULTS[section] as object)
  return DEFAULTS[section]
}

/**
 * Fetch ALL sections in parallel.
 */
export async function getAllContent(): Promise<SiteContent> {
  const keys = Object.keys(DEFAULTS) as (keyof SiteContent)[]
  const results = await Promise.all(keys.map((k) => getSection(k)))
  return Object.fromEntries(keys.map((k, i) => [k, results[i]])) as SiteContent
}
