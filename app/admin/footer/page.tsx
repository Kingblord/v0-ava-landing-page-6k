'use client'

import { useState, useEffect } from 'react'
import { getSection, saveSection, resetSection, DEFAULTS } from '@/lib/content'
import type { FooterContent } from '@/lib/content'
import {
  SectionShell,
  Field,
  TextInput,
  TextareaInput,
  CardSection,
  Divider,
} from '@/components/admin/AdminUI'
import { Plus, Trash2 } from 'lucide-react'

const INPUT_BASE =
  'w-full bg-[#080b12] border border-[rgba(108,92,231,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f0f4ff] placeholder-[#8892a4] focus:outline-none focus:border-[rgba(108,92,231,0.5)] transition-all'

export default function FooterEditor() {
  const [data, setData] = useState<FooterContent>(DEFAULTS.footer)

  useEffect(() => {
    getSection('footer').then(setData)
  }, [])

  const set = <K extends keyof FooterContent>(key: K, val: FooterContent[K]) =>
    setData((d) => ({ ...d, [key]: val }))

  const setContact = (field: keyof FooterContent['contact'], val: string) =>
    setData((d) => ({ ...d, contact: { ...d.contact, [field]: val } }))

  const setSocial = (field: keyof FooterContent['socials'], val: string) =>
    setData((d) => ({ ...d, socials: { ...d.socials, [field]: val } }))

  const updateStat = (i: number, field: 'value' | 'label', val: string) =>
    setData((d) => {
      const stats = [...d.stats]
      stats[i] = { ...stats[i], [field]: val }
      return { ...d, stats }
    })

  const updateLinkItem = (
    colIdx: number,
    itemIdx: number,
    field: 'label' | 'href',
    val: string
  ) =>
    setData((d) => {
      const links = d.links.map((col, ci) => {
        if (ci !== colIdx) return col
        const items = col.items.map((item, ii) =>
          ii === itemIdx ? { ...item, [field]: val } : item
        )
        return { ...col, items }
      })
      return { ...d, links }
    })

  const addLinkItem = (colIdx: number) =>
    setData((d) => {
      const links = d.links.map((col, ci) =>
        ci === colIdx ? { ...col, items: [...col.items, { label: '', href: '#' }] } : col
      )
      return { ...d, links }
    })

  const removeLinkItem = (colIdx: number, itemIdx: number) =>
    setData((d) => {
      const links = d.links.map((col, ci) =>
        ci === colIdx
          ? { ...col, items: col.items.filter((_, ii) => ii !== itemIdx) }
          : col
      )
      return { ...d, links }
    })

  const updateColCategory = (colIdx: number, val: string) =>
    setData((d) => {
      const links = d.links.map((col, ci) =>
        ci === colIdx ? { ...col, category: val } : col
      )
      return { ...d, links }
    })

  return (
    <SectionShell
      title="Footer"
      description="Edit the CTA section, stats, contact info, social URLs, link columns, and copyright."
      onSave={() => saveSection('footer', data)}
      onReset={() => resetSection('footer').then(setData)}
    >
      {/* Brand tagline */}
      <CardSection title="Brand Tagline">
        <Field label="Tagline (shown below logo)">
          <TextareaInput value={data.tagline} onChange={(v) => set('tagline', v)} rows={2} />
        </Field>
        <Field label="Copyright Text">
          <TextInput value={data.copyright} onChange={(v) => set('copyright', v)} placeholder="AVA AI, Inc. All rights reserved." />
        </Field>
      </CardSection>

      <Divider />

      {/* CTA section */}
      <CardSection title="Final CTA Section">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Headline Line 1">
              <TextInput value={data.ctaHeadlineLine1} onChange={(v) => set('ctaHeadlineLine1', v)} />
            </Field>
            <Field label="Headline Gradient Line">
              <TextInput value={data.ctaHeadlineGradient} onChange={(v) => set('ctaHeadlineGradient', v)} />
            </Field>
          </div>
          <Field label="Subtext">
            <TextareaInput value={data.ctaSubtext} onChange={(v) => set('ctaSubtext', v)} rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Button Label">
              <TextInput value={data.ctaButtonLabel} onChange={(v) => set('ctaButtonLabel', v)} />
            </Field>
            <Field label="Button Href">
              <TextInput value={data.ctaButtonHref} onChange={(v) => set('ctaButtonHref', v)} />
            </Field>
          </div>
          <Field label="Small Note (below button)">
            <TextInput value={data.ctaSmallNote} onChange={(v) => set('ctaSmallNote', v)} />
          </Field>
        </div>
      </CardSection>

      <Divider />

      {/* Stats */}
      <CardSection title="Stats Row">
        <div className="grid grid-cols-2 gap-4">
          {data.stats.map((stat, i) => (
            <div key={i} className="bg-[#080b12] border border-[rgba(108,92,231,0.12)] rounded-xl p-4 space-y-2">
              <Field label="Value">
                <TextInput value={stat.value} onChange={(v) => updateStat(i, 'value', v)} placeholder="2,400+" />
              </Field>
              <Field label="Label">
                <TextInput value={stat.label} onChange={(v) => updateStat(i, 'label', v)} placeholder="Businesses" />
              </Field>
            </div>
          ))}
        </div>
      </CardSection>

      <Divider />

      {/* Contact info */}
      <CardSection title="Contact Information">
        <p className="text-xs text-[#8892a4] -mt-2">Leave blank to hide that contact item on the page.</p>
        <div className="space-y-3">
          <Field label="Email Address">
            <TextInput
              value={data.contact.email}
              onChange={(v) => setContact('email', v)}
              placeholder="hello@ava.ai"
            />
          </Field>
          <Field label="Phone Number">
            <TextInput
              value={data.contact.phone}
              onChange={(v) => setContact('phone', v)}
              placeholder="+1 (555) 000-0000"
            />
          </Field>
          <Field label="Physical Address">
            <TextareaInput
              value={data.contact.address}
              onChange={(v) => setContact('address', v)}
              rows={2}
              placeholder="123 Main Street, City, Country"
            />
          </Field>
        </div>
      </CardSection>

      <Divider />

      {/* Social links */}
      <CardSection title="Social Media URLs">
        <div className="grid grid-cols-2 gap-4">
          {(['twitter', 'linkedin', 'github', 'discord'] as const).map((platform) => (
            <Field key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
              <TextInput
                value={data.socials[platform]}
                onChange={(v) => setSocial(platform, v)}
                placeholder={`https://${platform}.com/yourhandle`}
              />
            </Field>
          ))}
        </div>
      </CardSection>

      <Divider />

      {/* Footer link columns */}
      <CardSection title="Footer Link Columns">
        <div className="space-y-6">
          {data.links.map((col, colIdx) => (
            <div key={colIdx} className="bg-[#080b12] border border-[rgba(108,92,231,0.12)] rounded-2xl p-5 space-y-4">
              <Field label="Column Heading">
                <TextInput
                  value={col.category}
                  onChange={(v) => updateColCategory(colIdx, v)}
                  placeholder="Product"
                />
              </Field>
              <div className="space-y-2">
                {col.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateLinkItem(colIdx, itemIdx, 'label', e.target.value)}
                      placeholder="Link label"
                      className={`${INPUT_BASE} flex-1`}
                    />
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => updateLinkItem(colIdx, itemIdx, 'href', e.target.value)}
                      placeholder="href"
                      className={`${INPUT_BASE} flex-1`}
                    />
                    <button
                      onClick={() => removeLinkItem(colIdx, itemIdx)}
                      className="p-2 text-[#8892a4] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addLinkItem(colIdx)}
                className="flex items-center gap-1.5 text-xs text-[#6C5CE7] hover:text-[#8b7cf0] transition-colors"
              >
                <Plus size={13} />
                Add link
              </button>
            </div>
          ))}
        </div>
      </CardSection>
    </SectionShell>
  )
}
