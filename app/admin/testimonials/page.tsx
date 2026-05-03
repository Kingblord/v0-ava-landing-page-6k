'use client'

import { useState, useEffect } from 'react'
import { getSection, DEFAULT_CONTENT } from '@/lib/content'
import type { TestimonialsContent } from '@/lib/content'
import { AdminField, SectionHeader, ListEditor, useSaveSection } from '@/components/admin/AdminEditor'

export default function AdminTestimonials() {
  const [data, setData] = useState<TestimonialsContent>(DEFAULT_CONTENT.testimonials)
  const { saving, handleSave, handleReset } = useSaveSection('testimonials', data, DEFAULT_CONTENT.testimonials, setData)

  useEffect(() => { getSection('testimonials').then(setData) }, [])

  return (
    <div className="p-8 max-w-2xl">
      <SectionHeader
        title="Testimonials"
        description="Section label, headline, and all testimonial cards."
        onSave={handleSave}
        onReset={handleReset}
        saving={saving}
      />
      <div className="flex flex-col gap-6">
        <AdminField label="Section Label" value={data.sectionLabel} onChange={(v) => setData({ ...data, sectionLabel: v })} />
        <AdminField label="Headline" value={data.headline} onChange={(v) => setData({ ...data, headline: v })} />
        <AdminField label="Headline Accent (gradient)" value={data.headlineAccent} onChange={(v) => setData({ ...data, headlineAccent: v })} />
        <ListEditor
          label="Testimonials"
          items={data.testimonials}
          fields={[
            { key: 'name', label: 'Full Name' },
            { key: 'role', label: 'Role / Company' },
            { key: 'text', label: 'Testimonial Text', textarea: true },
            { key: 'metric', label: 'Metric Badge (e.g. +34% revenue)' },
          ]}
          onChange={(testimonials) => setData({ ...data, testimonials })}
          newItem={{ name: '', role: '', text: '', metric: '' }}
        />
      </div>
    </div>
  )
}
