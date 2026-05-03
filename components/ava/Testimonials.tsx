'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Amara Diallo',
    handle: '@amarashoesng',
    role: 'Sneaker Reseller, Lagos',
    text: "AVA made $4,200 in sales while I was sleeping. I woke up to 17 confirmed orders. It handles the negotiating better than I do honestly.",
    metric: '$4,200 overnight',
    color: '#6C5CE7',
  },
  {
    name: 'Thabo Nkosi',
    handle: '@thabofashion',
    role: 'Clothing Brand Owner, Johannesburg',
    text: "I was spending 6 hours a day on WhatsApp. Now I spend 20 minutes reviewing orders AVA already closed. Complete game changer.",
    metric: '6hrs → 20min/day',
    color: '#00D1B2',
  },
  {
    name: 'Fatima Al-Hassan',
    handle: '@fatima_cosmetics',
    role: 'Beauty Store, Dubai',
    text: "My customers can't tell it's AI. The conversations are so natural. I had one customer say AVA was the most helpful sales rep she'd ever talked to.",
    metric: '100% retention',
    color: '#e040fb',
  },
  {
    name: 'Kwame Mensah',
    handle: '@kwamegadgets',
    role: 'Electronics Retailer, Accra',
    text: "The price negotiation feature is brilliant. I set floor prices and AVA handles everything. My margins are actually up 12% since I started.",
    metric: '+12% margins',
    color: '#6C5CE7',
  },
  {
    name: 'Priya Sharma',
    handle: '@priyaboutique',
    role: 'Fashion Boutique, Mumbai',
    text: "Setup took 8 minutes. Literally 8 minutes. And by the end of the day AVA had already handled 43 customer conversations. Mind-blowing.",
    metric: '43 convos day 1',
    color: '#00D1B2',
  },
  {
    name: 'Carlos Mendez',
    handle: '@carloselectronics',
    role: 'Tech Store, Mexico City',
    text: "I was sceptical about AI handling my customers but the trial convinced me in one day. It upsells better than my staff does. Wild.",
    metric: 'Revenue up 34%',
    color: '#e040fb',
  },
]

export function Testimonials() {
  const half = Math.ceil(TESTIMONIALS.length / 2)
  const col1 = TESTIMONIALS.slice(0, half)
  const col2 = TESTIMONIALS.slice(half)

  return (
    <section className="px-6 py-24 max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[var(--ava-purple-light)] text-sm font-medium uppercase tracking-widest mb-4">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Businesses already{' '}
            <span className="text-gradient">closing more</span>
          </h2>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[col1, col2].map((col, ci) => (
          <div key={ci} className="flex flex-col gap-4">
            {col.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (ci * half + i) * 0.07 }}
                className="bg-[var(--ava-surface)] border border-[var(--ava-border)] rounded-2xl p-5 hover:border-opacity-40 transition-all duration-300"
                style={{ '--hover-color': t.color } as React.CSSProperties}
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: t.color }} />
                  ))}
                </div>
                <p className="text-[var(--ava-text)] text-sm leading-relaxed mb-4">{'"'}{t.text}{'"'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: `${t.color}30`, border: `1px solid ${t.color}40` }}
                    >
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">{t.name}</p>
                      <p className="text-[var(--ava-text-muted)] text-xs">{t.role}</p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: `${t.color}15`, color: t.color }}
                  >
                    {t.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
