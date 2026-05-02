'use client'

import { useState, useEffect } from 'react'
import { getSection, saveSection, resetSection, DEFAULTS } from '@/lib/content'
import type { NavbarContent } from '@/lib/content'
import {
  SectionShell,
  Field,
  TextInput,
  CardSection,
  Divider,
  StringListEditor,
} from '@/components/admin/AdminUI'
import { Plus, Trash2 } from 'lucide-react'

const INPUT_BASE =
  'w-full bg-[#080b12] border border-[rgba(108,92,231,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f0f4ff] placeholder-[#8892a4] focus:outline-none focus:border-[rgba(108,92,231,0.5)] transition-all'

export default function NavbarEditor() {
  const [data, setData] = useState<NavbarContent>(DEFAULTS.navbar)

  useEffect(() => {
    getSection('navbar').then(setData)
  }, [])

  const set = <K extends keyof NavbarContent>(key: K, val: NavbarContent[K]) =>
    setData((d) => ({ ...d, [key]: val }))

  const updateLink = (i: number, field: 'label' | 'href', val: string) =>
    setData((d) => {
      const links = [...d.links]
      links[i] = { ...links[i], [field]: val }
      return { ...d, links }
    })

  const addLink = () =>
    setData((d) => ({ ...d, links: [...d.links, { label: '', href: '#' }] }))

  const removeLink = (i: number) =>
    setData((d) => ({ ...d, links: d.links.filter((_, idx) => idx !== i) }))

  return (
    <SectionShell
      title="Navbar"
      description="Edit navigation links, CTA button labels, and href destinations."
      onSave={() => saveSection('navbar', data)}
      onReset={() => resetSection('navbar').then(setData)}
    >
      <CardSection title="Navigation Links">
        <div className="space-y-3">
          {data.links.map((link, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
                placeholder="Label"
                className={`${INPUT_BASE} flex-1`}
              />
              <input
                type="text"
                value={link.href}
                onChange={(e) => updateLink(i, 'href', e.target.value)}
                placeholder="href (e.g. #features)"
                className={`${INPUT_BASE} flex-1`}
              />
              <button
                onClick={() => removeLink(i)}
                className="p-2 text-[#8892a4] hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addLink}
          className="flex items-center gap-1.5 text-xs text-[#6C5CE7] hover:text-[#8b7cf0] transition-colors mt-2"
        >
          <Plus size={13} />
          Add link
        </button>
      </CardSection>

      <Divider />

      <CardSection title="Primary CTA Button">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Button Label">
            <TextInput value={data.ctaLabel} onChange={(v) => set('ctaLabel', v)} placeholder="Get Started Free" />
          </Field>
          <Field label="Button Href">
            <TextInput value={data.ctaHref} onChange={(v) => set('ctaHref', v)} placeholder="#pricing" />
          </Field>
        </div>
      </CardSection>

      <Divider />

      <CardSection title="Sign In Link">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sign In Label">
            <TextInput value={data.signInLabel} onChange={(v) => set('signInLabel', v)} placeholder="Sign In" />
          </Field>
          <Field label="Sign In Href">
            <TextInput value={data.signInHref} onChange={(v) => set('signInHref', v)} placeholder="#pricing" />
          </Field>
        </div>
      </CardSection>
    </SectionShell>
  )
}
