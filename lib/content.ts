// ─── Type Definitions ────────────────────────────────────────────────────────

export interface NavLink { label: string; href: string }
export interface NavbarContent {
  brandName: string
  links: NavLink[]
  ctaSignIn: string
  ctaSignUp: string
}

export interface StatItem { value: string; label: string }
export interface HeroContent {
  badge: string
  headline: string
  headlineAccent: string
  subheadline: string
  ctaPrimary: string
  ctaSecondary: string
  stats: StatItem[]
  socialProofText: string
}

export interface BentoCard {
  title: string
  desc: string
}
export interface BentoContent {
  sectionLabel: string
  headline: string
  headlineAccent: string
  subheadline: string
  cards: BentoCard[]
}

export interface LiveFlowStep {
  n: string
  title: string
  desc: string
}
export interface LiveFlowContent {
  sectionLabel: string
  headline: string
  headlineAccent: string
  subheadline: string
  steps: LiveFlowStep[]
}

export interface Testimonial {
  name: string
  role: string
  text: string
  metric: string
}
export interface TestimonialsContent {
  sectionLabel: string
  headline: string
  headlineAccent: string
  testimonials: Testimonial[]
}

export interface PricingFeature { text: string }
export interface PricingPlan {
  name: string
  monthlyPrice: number
  annualPrice: number
  desc: string
  features: string[]
  cta: string
  popular: boolean
}
export interface PricingContent {
  sectionLabel: string
  headline: string
  headlineAccent: string
  subheadline: string
  plans: PricingPlan[]
}

export interface FAQItem { q: string; a: string }
export interface FAQContent {
  sectionLabel: string
  headline: string
  headlineAccent: string
  items: FAQItem[]
}

export interface FooterLinkItem { label: string; href: string }
export interface FooterLinkGroup { group: string; links: FooterLinkItem[] }
export interface FooterStat { value: string; label: string }
export interface FooterContent {
  ctaHeadline: string
  ctaHeadlineAccent: string
  ctaSubheadline: string
  ctaButton: string
  stats: FooterStat[]
  brandTagline: string
  linkGroups: FooterLinkGroup[]
  contact: { email: string; phone: string; address: string }
  socialLinks: { twitter: string; instagram: string; linkedin: string }
  copyright: string
  poweredBy: string
}

export interface SiteContent {
  navbar: NavbarContent
  hero: HeroContent
  bento: BentoContent
  liveflow: LiveFlowContent
  testimonials: TestimonialsContent
  pricing: PricingContent
  faq: FAQContent
  footer: FooterContent
}

// ─── Hardcoded Defaults (mirrors every component's current values) ─────────────

export const DEFAULT_CONTENT: SiteContent = {
  navbar: {
    brandName: 'AroMsg',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    ctaSignIn: 'Sign In',
    ctaSignUp: 'Get Started Free',
  },

  hero: {
    badge: 'AI Sales Agent for WhatsApp',
    headline: 'Close Deals',
    headlineAccent: 'While You Sleep',
    subheadline:
      'Arobi handles every WhatsApp customer — answering questions, negotiating prices, and confirming orders automatically. You wake up to revenue, not messages.',
    ctaPrimary: 'Start for Free',
    ctaSecondary: 'See How It Works',
    socialProofText: 'Loved by 200+ business owners',
    stats: [
      { value: '24/7', label: 'Always Online' },
      { value: '<1s', label: 'Response Time' },
      { value: '3×', label: 'More Conversions' },
      { value: '0', label: 'Messages Missed' },
    ],
  },

  bento: {
    sectionLabel: 'Features',
    headline: 'Everything you need to',
    headlineAccent: 'automate sales',
    subheadline: 'One platform. Your AI agent, your products, your orders — all in one place.',
    cards: [
      { title: 'Human-Like Conversations', desc: "Arobi chats like a real salesperson — handles objections, builds rapport, and closes deals naturally." },
      { title: 'Product Catalogue', desc: "Add products once. Arobi knows them all and never recommends items you don't sell." },
      { title: 'Auto Order Creation', desc: "Orders appear in your dashboard automatically the moment a customer commits." },
      { title: 'Price Negotiation Control', desc: "Set floor prices per product. Arobi negotiates within your limits so you never sell at a loss." },
      { title: 'Instant Responses', desc: "Responds to every message in under a second — 24 hours a day, 7 days a week." },
      { title: 'Customisable Personality', desc: "Define how Arobi speaks. Formal, casual, aggressive closer, or soft advisor — your brand, your voice." },
      { title: 'Revenue Analytics', desc: "Track conversations, conversion rates, and revenue from a single dashboard." },
      { title: '0 Messages Missed', desc: "Every customer gets a reply — even at 3am. Never lose a sale to slow response times again." },
    ],
  },

  liveflow: {
    sectionLabel: 'How It Works',
    headline: 'Up and running in',
    headlineAccent: '3 steps',
    subheadline: 'No developers needed. No complex setup. Just plug in and let Arobi work.',
    steps: [
      {
        n: '01',
        title: 'Connect WhatsApp',
        desc: 'Scan the QR code to link your WhatsApp number. Takes under 2 minutes — no code required.',
      },
      {
        n: '02',
        title: 'Add Your Products',
        desc: 'Create your product catalogue with names, prices, and negotiation floor prices. Arobi learns everything instantly.',
      },
      {
        n: '03',
        title: 'Arobi Takes Over',
        desc: 'Every incoming WhatsApp message is handled by Arobi — automatically, intelligently, around the clock.',
      },
    ],
  },

  testimonials: {
    sectionLabel: 'Testimonials',
    headline: 'Businesses already',
    headlineAccent: 'closing more',
    testimonials: [
      { name: 'Amara Diallo', role: 'Sneaker Reseller, Lagos', text: "Arobi made $4,200 in sales while I was sleeping. I woke up to 17 confirmed orders. It handles the negotiating better than I do honestly.", metric: '$4,200 overnight' },
      { name: 'Thabo Nkosi', role: 'Clothing Brand Owner, Johannesburg', text: "I was spending 6 hours a day on WhatsApp. Now I spend 20 minutes reviewing orders Arobi already closed. Complete game changer.", metric: '6hrs → 20min/day' },
      { name: 'Fatima Al-Hassan', role: 'Beauty Store, Dubai', text: "My customers can't tell it's AI. The conversations are so natural. I had one customer say Arobi was the most helpful sales rep she'd ever talked to.", metric: '100% retention' },
      { name: 'Kwame Mensah', role: 'Electronics Retailer, Accra', text: "The price negotiation feature is brilliant. I set floor prices and Arobi handles everything. My margins are actually up 12% since I started.", metric: '+12% margins' },
      { name: 'Priya Sharma', role: 'Fashion Boutique, Mumbai', text: "Setup took 8 minutes. Literally 8 minutes. And by the end of the day Arobi had already handled 43 customer conversations. Mind-blowing.", metric: '43 convos day 1' },
      { name: 'Carlos Mendez', role: 'Tech Store, Mexico City', text: "I was sceptical about AI handling my customers but the trial convinced me in one day. It upsells better than my staff does. Wild.", metric: 'Revenue up 34%' },
    ],
  },

  pricing: {
    sectionLabel: 'Pricing',
    headline: 'Simple,',
    headlineAccent: 'transparent',
    subheadline: 'Start free. Scale as you grow. No hidden fees.',
    plans: [
      {
        name: 'Starter',
        monthlyPrice: 29,
        annualPrice: 23,
        desc: 'Perfect for solo sellers getting started with AI sales.',
        features: ['1 WhatsApp number', 'Up to 500 conversations/mo', '50 products', 'Basic analytics', 'Email support'],
        cta: 'Start Free Trial',
        popular: false,
      },
      {
        name: 'Pro',
        monthlyPrice: 79,
        annualPrice: 63,
        desc: 'For growing businesses that need serious automation.',
        features: ['3 WhatsApp numbers', 'Unlimited conversations', 'Unlimited products', 'Advanced analytics', 'Price negotiation AI', 'Custom AI personality', 'Priority support'],
        cta: 'Start Free Trial',
        popular: true,
      },
      {
        name: 'Enterprise',
        monthlyPrice: 199,
        annualPrice: 159,
        desc: 'For large teams and high-volume operations.',
        features: ['Unlimited WhatsApp numbers', 'Unlimited everything', 'Multi-agent setup', 'Custom AI training', 'API access', 'Dedicated account manager', 'SLA guarantee'],
        cta: 'Contact Sales',
        popular: false,
      },
    ],
  },

  faq: {
    sectionLabel: 'FAQ',
    headline: 'Questions',
    headlineAccent: 'answered',
    items: [
      { q: 'Does Arobi really sound human?', a: "Yes. Arobi is powered by the latest large language models. Customers consistently report that conversations feel completely natural. You can also customise the tone, style, and personality to match your brand." },
      { q: "What happens if Arobi can't answer a question?", a: "If a customer asks something outside Arobi's knowledge base (your products and configured responses), Arobi will politely let them know and can optionally escalate or flag the conversation for you to review." },
      { q: 'How does price negotiation work?', a: "For each product you set a \"floor price\" — the minimum you're willing to accept. Arobi will negotiate naturally within that range, starting from your listed price and moving down strategically, never going below your floor." },
      { q: 'Do I need technical knowledge to set up AroMsg?', a: "No. Setup involves scanning a QR code and filling in your product details. It takes under 10 minutes. No code, no servers, no developers needed." },
      { q: 'What WhatsApp providers does AroMsg support?', a: "AroMsg uses a direct WhatsApp connection via QR code linking — completely direct, no third-party API required. Just scan and go." },
      { q: 'Is there a free trial?', a: "Yes — every plan starts with a 14-day free trial. No credit card required to get started. You can upgrade, downgrade, or cancel anytime." },
    ],
  },

  footer: {
    ctaHeadline: 'Start closing deals',
    ctaHeadlineAccent: 'tonight',
    ctaSubheadline: 'Join hundreds of business owners who let Arobi handle their WhatsApp sales. Set up in under 10 minutes. No credit card required.',
    ctaButton: 'Get Started Free',
    stats: [
      { value: '200+', label: 'Businesses' },
      { value: '$2M+', label: 'Sales Automated' },
      { value: '14-day', label: 'Free Trial' },
    ],
    brandTagline: 'AI-powered sales automation for WhatsApp. Close more deals, reply instantly, and grow your business while you sleep.',
    linkGroups: [
      {
        group: 'Product',
        links: [
          { label: 'Features', href: '#features' },
          { label: 'How It Works', href: '#how-it-works' },
          { label: 'Pricing', href: '#pricing' },
          { label: 'FAQ', href: '#faq' },
        ],
      },
      {
        group: 'Company',
        links: [
          { label: 'About', href: '#' },
          { label: 'Blog', href: '#' },
          { label: 'Careers', href: '#' },
          { label: 'Contact', href: '#' },
        ],
      },
      {
        group: 'Legal',
        links: [
          { label: 'Privacy Policy', href: '#' },
          { label: 'Terms of Service', href: '#' },
          { label: 'Cookie Policy', href: '#' },
        ],
      },
    ],
    contact: {
      email: 'hello@aromsg.ai',
      phone: '+1 (555) 000-0000',
      address: '123 Main St, San Francisco, CA 94105',
    },
    socialLinks: {
      twitter: '#',
      instagram: '#',
      linkedin: '#',
    },
    copyright: `© ${new Date().getFullYear()} AroMsg. All rights reserved.`,
    poweredBy: 'Built with AI. Powered by AroMsg.',
  },
}

// ─── Firestore helpers (via Admin SDK API) ────────────────────────────────────

const COLLECTION = 'landingContent'

/** Fetch one section via API. Falls back to DEFAULT_CONTENT silently if API is unreachable. */
export async function getSection<K extends keyof SiteContent>(
  section: K,
): Promise<SiteContent[K]> {
  try {
    const response = await fetch(`/api/admin/landing/${section}`, { method: 'GET' })
    if (response.ok) {
      const data = await response.json()
      return data.content as SiteContent[K]
    }
    console.warn('[v0] Failed to fetch landing content:', section, response.status)
    return DEFAULT_CONTENT[section]
  } catch (err) {
    console.error('[v0] Error fetching landing content:', err)
    return DEFAULT_CONTENT[section]
  }
}

/** Overwrite one section via API (Admin SDK server-side). */
export async function saveSection<K extends keyof SiteContent>(
  section: K,
  data: SiteContent[K],
): Promise<void> {
  try {
    console.log('[v0] Saving landing content section:', section)
    const response = await fetch(`/api/admin/landing/${section}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || `HTTP ${response.status}`)
    }
    console.log('[v0] Landing content saved successfully:', section)
  } catch (err) {
    console.error('[v0] Error saving landing content:', err)
    throw err
  }
}

/** Fetch all 8 sections in parallel, initialising any that don't exist. */
export async function getAllContent(): Promise<SiteContent> {
  const sections = Object.keys(DEFAULT_CONTENT) as (keyof SiteContent)[]
  const results = await Promise.all(sections.map((s) => getSection(s)))
  return Object.fromEntries(
    sections.map((s, i) => [s, results[i]]),
  ) as SiteContent
}

