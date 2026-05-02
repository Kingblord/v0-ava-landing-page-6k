'use client'

import { useState, useEffect } from 'react'
import { getSection, saveSection, resetSection, DEFAULTS } from '@/lib/content'
import type { FAQContent } from '@/lib/content'
import {
  SectionShell,
  Field,
  TextInput,
  TextareaInput,
  CardSection,
  Divider,
} from '@/components/admin/AdminUI'
import { Plus, Trash2 } from 'lucide-react'

const EMPTY_ITEM = { q: '', a: '' }

export default function FAQEditor() {
  const [data, setData] = useState<FAQContent>(DEFAULTS.faq)

  useEffect(() => {
    getSection('faq').then(setData)
  }, [])

  const set = <K extends keyof FAQContent>(key: K, val: FAQContent[K]) =>
    setData((d) => ({ ...d, [key]: val }))

  const updateItem = (i: number, field: 'q' | 'a', val: string) =>
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
      title="FAQ"
      description="Edit the accordion questions and answers. Add or remove items as needed."
      onSave={() => saveSection('faq', data)}
      onReset={() => resetSection('faq').then(setData)}
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

      <CardSection title="FAQ Items">
        <div className="space-y-4">
          {data.items.map((item, i) => (
            <div key={i} className="bg-[#080b12] border border-[rgba(108,92,231,0.12)] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#8b7cf0] uppercase tracking-widest">
                  Question {i + 1}
                </p>
                <button
                  onClick={() => removeItem(i)}
                  className="p-1.5 text-[#8892a4] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <Field label="Question">
                <TextInput value={item.q} onChange={(v) => updateItem(i, 'q', v)} placeholder="Question text..." />
              </Field>
              <Field label="Answer">
                <TextareaInput value={item.a} onChange={(v) => updateItem(i, 'a', v)} rows={4} placeholder="Answer text..." />
              </Field>
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
          className="flex items-center gap-1.5 text-xs text-[#6C5CE7] hover:text-[#8b7cf0] transition-colors mt-2"
        >
          <Plus size={13} />
          Add question
        </button>
      </CardSection>
    </SectionShell>
  )
}
