'use client'

import { useState, useEffect } from 'react'
import { getSection, DEFAULT_CONTENT } from '@/lib/content'
import type { LiveFlowContent } from '@/lib/content'
import { AdminField, SectionHeader, ListEditor, useSaveSection } from '@/components/admin/AdminEditor'

export default function AdminLiveFlow() {
  const [data, setData] = useState<LiveFlowContent>(DEFAULT_CONTENT.liveflow)
  const { saving, handleSave, handleReset } = useSaveSection('liveflow', data, DEFAULT_CONTENT.liveflow, setData)

  useEffect(() => { getSection('liveflow').then(setData) }, [])

  return (
    <div className="p-8 max-w-2xl">
      <SectionHeader
        title="How It Works"
        description="Section label, headline, and the 3 step cards."
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
          label="Steps"
          items={data.steps}
          fields={[
            { key: 'n', label: 'Step Number (e.g. 01)' },
            { key: 'title', label: 'Step Title' },
            { key: 'desc', label: 'Step Description', textarea: true },
          ]}
          onChange={(steps) => setData({ ...data, steps })}
          newItem={{ n: '04', title: '', desc: '' }}
        />
      </div>
    </div>
  )
}
