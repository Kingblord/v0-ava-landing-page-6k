'use client'

import { useState, useEffect } from 'react'
import { getSection, DEFAULT_CONTENT } from '@/lib/content'
import type { HeroContent } from '@/lib/content'
import { AdminField, SectionHeader, ListEditor, useSaveSection } from '@/components/admin/AdminEditor'

export default function AdminHero() {
  const [data, setData] = useState<HeroContent>(DEFAULT_CONTENT.hero)
  const { saving, handleSave, handleReset } = useSaveSection('hero', data, DEFAULT_CONTENT.hero, setData)

  useEffect(() => { getSection('hero').then(setData) }, [])

  return (
    <div className="p-8 max-w-2xl">
      <SectionHeader
        title="Hero Section"
        description="Top-of-page headline, subheadline, badge, CTAs, and stats bar."
        onSave={handleSave}
        onReset={handleReset}
        saving={saving}
      />
      <div className="flex flex-col gap-6">
        <AdminField label="Badge Text" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
        <AdminField label="Headline (main)" value={data.headline} onChange={(v) => setData({ ...data, headline: v })} />
        <AdminField label="Headline Accent (gradient)" value={data.headlineAccent} onChange={(v) => setData({ ...data, headlineAccent: v })} />
        <AdminField label="Subheadline" value={data.subheadline} onChange={(v) => setData({ ...data, subheadline: v })} textarea />
        <AdminField label="Primary CTA Button" value={data.ctaPrimary} onChange={(v) => setData({ ...data, ctaPrimary: v })} />
        <AdminField label="Secondary CTA Button" value={data.ctaSecondary} onChange={(v) => setData({ ...data, ctaSecondary: v })} />
        <AdminField label="Social Proof Text" value={data.socialProofText} onChange={(v) => setData({ ...data, socialProofText: v })} />
        <ListEditor
          label="Stats Bar"
          items={data.stats}
          fields={[
            { key: 'value', label: 'Value (e.g. 24/7)' },
            { key: 'label', label: 'Label (e.g. Always Online)' },
          ]}
          onChange={(stats) => setData({ ...data, stats })}
          newItem={{ value: '', label: '' }}
        />
      </div>
    </div>
  )
}
