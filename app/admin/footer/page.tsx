'use client'

import { useState, useEffect } from 'react'
import { getSection, DEFAULT_CONTENT } from '@/lib/content'
import type { FooterContent } from '@/lib/content'
import { AdminField, SectionHeader, ListEditor, useSaveSection } from '@/components/admin/AdminEditor'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

export default function AdminFooter() {
  const [data, setData] = useState<FooterContent>(DEFAULT_CONTENT.footer)
  const { saving, handleSave, handleReset } = useSaveSection('footer', data, DEFAULT_CONTENT.footer, setData)

  useEffect(() => { getSection('footer').then(setData) }, [])

  function updateLinkGroup(gi: number, li: number, key: 'label' | 'href', value: string) {
    const linkGroups = data.linkGroups.map((g, gIdx) => {
      if (gIdx !== gi) return g
      const links = g.links.map((l, lIdx) => lIdx === li ? { ...l, [key]: value } : l)
      return { ...g, links }
    })
    setData({ ...data, linkGroups })
  }

  function addLink(gi: number) {
    const linkGroups = data.linkGroups.map((g, gIdx) =>
      gIdx === gi ? { ...g, links: [...g.links, { label: '', href: '#' }] } : g,
    )
    setData({ ...data, linkGroups })
  }

  function removeLink(gi: number, li: number) {
    const linkGroups = data.linkGroups.map((g, gIdx) =>
      gIdx === gi ? { ...g, links: g.links.filter((_, lIdx) => lIdx !== li) } : g,
    )
    setData({ ...data, linkGroups })
  }

  return (
    <div className="p-8 max-w-2xl">
      <SectionHeader
        title="Footer"
        description="CTA band, contact info, social URLs, link groups, and copyright."
        onSave={handleSave}
        onReset={handleReset}
        saving={saving}
      />
      <div className="flex flex-col gap-8">

        {/* CTA Band */}
        <section className="flex flex-col gap-4">
          <p className="text-white text-sm font-semibold border-b border-[#6C5CE7]/15 pb-2">CTA Band</p>
          <AdminField label="CTA Headline" value={data.ctaHeadline} onChange={(v) => setData({ ...data, ctaHeadline: v })} />
          <AdminField label="CTA Headline Accent (gradient)" value={data.ctaHeadlineAccent} onChange={(v) => setData({ ...data, ctaHeadlineAccent: v })} />
          <AdminField label="CTA Subheadline" value={data.ctaSubheadline} onChange={(v) => setData({ ...data, ctaSubheadline: v })} textarea />
          <AdminField label="CTA Button Text" value={data.ctaButton} onChange={(v) => setData({ ...data, ctaButton: v })} />
          <ListEditor
            label="Stats Row"
            items={data.stats}
            fields={[
              { key: 'value', label: 'Value' },
              { key: 'label', label: 'Label' },
            ]}
            onChange={(stats) => setData({ ...data, stats })}
            newItem={{ value: '', label: '' }}
          />
        </section>

        {/* Brand */}
        <section className="flex flex-col gap-4">
          <p className="text-white text-sm font-semibold border-b border-[#6C5CE7]/15 pb-2">Brand</p>
          <AdminField label="Brand Tagline" value={data.brandTagline} onChange={(v) => setData({ ...data, brandTagline: v })} textarea />
          <AdminField label="Copyright" value={data.copyright} onChange={(v) => setData({ ...data, copyright: v })} />
          <AdminField label="Powered By Text" value={data.poweredBy} onChange={(v) => setData({ ...data, poweredBy: v })} />
        </section>

        {/* Contact Info */}
        <section className="flex flex-col gap-4">
          <p className="text-white text-sm font-semibold border-b border-[#6C5CE7]/15 pb-2">Contact Info</p>
          <AdminField label="Email" value={data.contact.email} onChange={(v) => setData({ ...data, contact: { ...data.contact, email: v } })} />
          <AdminField label="Phone" value={data.contact.phone} onChange={(v) => setData({ ...data, contact: { ...data.contact, phone: v } })} />
          <AdminField label="Address" value={data.contact.address} onChange={(v) => setData({ ...data, contact: { ...data.contact, address: v } })} />
        </section>

        {/* Social Links */}
        <section className="flex flex-col gap-4">
          <p className="text-white text-sm font-semibold border-b border-[#6C5CE7]/15 pb-2">Social Links</p>
          <AdminField label="Twitter / X URL" value={data.socialLinks.twitter} onChange={(v) => setData({ ...data, socialLinks: { ...data.socialLinks, twitter: v } })} />
          <AdminField label="Instagram URL" value={data.socialLinks.instagram} onChange={(v) => setData({ ...data, socialLinks: { ...data.socialLinks, instagram: v } })} />
          <AdminField label="LinkedIn URL" value={data.socialLinks.linkedin} onChange={(v) => setData({ ...data, socialLinks: { ...data.socialLinks, linkedin: v } })} />
        </section>

        {/* Link Groups */}
        <section className="flex flex-col gap-4">
          <p className="text-white text-sm font-semibold border-b border-[#6C5CE7]/15 pb-2">Footer Link Columns</p>
          {data.linkGroups.map((group, gi) => (
            <div key={gi} className="bg-[#1a2235] border border-[#6C5CE7]/15 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-[#8892a4] text-xs font-medium uppercase">{group.group}</p>
              {group.links.map((link, li) => (
                <div key={li} className="flex items-center gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) => updateLinkGroup(gi, li, 'label', e.target.value)}
                    placeholder="Label"
                    className="bg-[#0d1120] border-[#6C5CE7]/20 text-white h-8 text-sm flex-1"
                  />
                  <Input
                    value={link.href}
                    onChange={(e) => updateLinkGroup(gi, li, 'href', e.target.value)}
                    placeholder="URL"
                    className="bg-[#0d1120] border-[#6C5CE7]/20 text-white h-8 text-sm flex-1"
                  />
                  <button onClick={() => removeLink(gi, li)} className="text-[#8892a4] hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => addLink(gi)} className="flex items-center gap-1.5 text-xs text-[#8892a4] hover:text-white transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Link
              </button>
            </div>
          ))}
        </section>

      </div>
    </div>
  )
}
