'use client'

import { useState, useEffect } from 'react'
import { getSection, saveSection, resetSection, DEFAULTS } from '@/lib/content'
import type { TestimonialsContent } from '@/lib/content'
import {
  SectionShell,
  Field,
  TextInput,
  TextareaInput,
  CardSection,
  Divider,
} from '@/components/admin/AdminUI'
import { Plus, Trash2 } from 'lucide-react'

const EMPTY_ITEM = { name: '', role: '', avatar: '', quote: '', metric: '' }

export default function TestimonialsEditor() {
  const [data, setData] = useState<TestimonialsContent>(DEFAULTS.testimonials)

  useEffect(() => {
    getSection('testimonials').then(setData)
  }, [])

  const set = <K extends keyof TestimonialsContent>(key: K, val: TestimonialsContent[K]) =>
    setData((d) => ({ ...d, [key]: val }))

  const updateItem = (
    i: number,
    field: keyof TestimonialsContent['items'][0],
    val: string
  ) =>
    setData((d) => {
      const items = [...d.items]
      items[i] = { ...items[i], [field]: val }
      return { ...d, items }
    })

  const addItem = () => setData((d) => ({ ...d, items: [...d.items, { ...EMPTY_ITEM }] }))
  const removeItem = (i: number) =>
    setData((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }))

  return (
    <SectionShell
      title="Testimonials"
      description="Edit the section header and each customer testimonial card."
      onSave={() => saveSection('testimonials', data)}
      onReset={() => resetSection('testimonials').then(setData)}
    >
      <CardSection title="Section Header">
        <div className="space-y-3">
          <Field label="Eyebrow Badge Text">
            <TextInput value={data.eyebrow} onChange={(v) => set('eyebrow', v)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Headline">
              <TextInput value={data.headline} onChange={(v) => set('headline', v)} />
            </Field>
            <Field label="Headline Gradient Part">
              <TextInput value={data.headlineGradient} onChange={(v) => set('headlineGradient', v)} />
            </Field>
          </div>
        </div>
      </CardSection>

      <Divider />

      <CardSection title="Testimonial Cards">
        <div className="space-y-5">
          {data.items.map((item, i) => (
            <div key={i} className="bg-[#080b12] border border-[rgba(108,92,231,0.12)] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#8b7cf0] uppercase tracking-widest">
                  Testimonial {i + 1}
                </p>
                <button
                  onClick={() => removeItem(i)}
                  className="p-1.5 text-[#8892a4] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <TextInput value={item.name} onChange={(v) => updateItem(i, 'name', v)} placeholder="John Doe" />
                </Field>
                <Field label="Role / Company">
                  <TextInput value={item.role} onChange={(v) => updateItem(i, 'role', v)} placeholder="CEO, Acme Inc." />
                </Field>
                <Field label="Avatar Initials">
                  <TextInput value={item.avatar} onChange={(v) => updateItem(i, 'avatar', v)} placeholder="JD" />
                </Field>
                <Field label="Metric Badge">
                  <TextInput value={item.metric} onChange={(v) => updateItem(i, 'metric', v)} placeholder="+$18,400 first month" />
                </Field>
              </div>
              <Field label="Quote">
                <TextareaInput value={item.quote} onChange={(v) => updateItem(i, 'quote', v)} rows={3} placeholder="The quote text..." />
              </Field>
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
          className="flex items-center gap-1.5 text-xs text-[#6C5CE7] hover:text-[#8b7cf0] transition-colors mt-2"
        >
          <Plus size={13} />
          Add testimonial
        </button>
      </CardSection>
    </SectionShell>
  )
}
