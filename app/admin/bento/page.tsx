'use client'

import { useState, useEffect } from 'react'
import { getSection, DEFAULT_CONTENT } from '@/lib/content'
import type { BentoContent } from '@/lib/content'
import { AdminField, SectionHeader, ListEditor, useSaveSection } from '@/components/admin/AdminEditor'

export default function AdminBento() {
  const [data, setData] = useState<BentoContent>(DEFAULT_CONTENT.bento)
  const { saving, handleSave, handleReset } = useSaveSection('bento', data, DEFAULT_CONTENT.bento, setData)

  useEffect(() => { getSection('bento').then(setData) }, [])

  return (
    <div className="p-8 max-w-2xl">
      <SectionHeader
        title="Features (Bento Grid)"
        description="Section label, headline, and all 8 feature cards."
        onSave={handleSave}
        onReset={handleReset}
        saving={saving}
      />
      <div className="flex flex-col gap-6">
        <AdminField label="Section Label" value={data.sectionLabel} onChange={(v) => setData({ ...data, sectionLabel: v })} />
        <AdminField label="Headline" value={data.headline} onChange={(v) => setData({ ...data, headline: v })} />
        <AdminField label="Headline Accent (gradient)" value={data.headlineAccent} onChange={(v) => setData({ ...data, headlineAccent: v })} />
        <AdminField label="Subheadline" value={data.subheadline} onChange={(v) => setData({ ...data, subheadline: v })} textarea />
        <ListEditor
          label="Feature Cards"
          items={data.cards}
          fields={[
            { key: 'title', label: 'Card Title' },
            { key: 'desc', label: 'Card Description', textarea: true },
          ]}
          onChange={(cards) => setData({ ...data, cards })}
          newItem={{ title: '', desc: '' }}
        />
      </div>
    </div>
  )
}
