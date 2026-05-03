'use client'

import { useState, useEffect } from 'react'
import { getSection, DEFAULT_CONTENT } from '@/lib/content'
import type { FAQContent } from '@/lib/content'
import { AdminField, SectionHeader, ListEditor, useSaveSection } from '@/components/admin/AdminEditor'

export default function AdminFAQ() {
  const [data, setData] = useState<FAQContent>(DEFAULT_CONTENT.faq)
  const { saving, handleSave, handleReset } = useSaveSection('faq', data, DEFAULT_CONTENT.faq, setData)

  useEffect(() => { getSection('faq').then(setData) }, [])

  return (
    <div className="p-8 max-w-2xl">
      <SectionHeader
        title="FAQ"
        description="Section headline and all questions/answers."
        onSave={handleSave}
        onReset={handleReset}
        saving={saving}
      />
      <div className="flex flex-col gap-6">
        <AdminField label="Section Label" value={data.sectionLabel} onChange={(v) => setData({ ...data, sectionLabel: v })} />
        <AdminField label="Headline" value={data.headline} onChange={(v) => setData({ ...data, headline: v })} />
        <AdminField label="Headline Accent (gradient)" value={data.headlineAccent} onChange={(v) => setData({ ...data, headlineAccent: v })} />
        <ListEditor
          label="FAQ Items"
          items={data.items}
          fields={[
            { key: 'q', label: 'Question' },
            { key: 'a', label: 'Answer', textarea: true },
          ]}
          onChange={(items) => setData({ ...data, items })}
          newItem={{ q: '', a: '' }}
        />
      </div>
    </div>
  )
}
