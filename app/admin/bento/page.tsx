'use client'

import { useState, useEffect } from 'react'
import { getSection, saveSection, resetSection, DEFAULTS } from '@/lib/content'
import type { BentoContent } from '@/lib/content'
import {
  SectionShell,
  Field,
  TextInput,
  TextareaInput,
  CardSection,
  Divider,
} from '@/components/admin/AdminUI'

export default function BentoEditor() {
  const [data, setData] = useState<BentoContent>(DEFAULTS.bento)

  useEffect(() => {
    getSection('bento').then(setData)
  }, [])

  const set = <K extends keyof BentoContent>(key: K, val: BentoContent[K]) =>
    setData((d) => ({ ...d, [key]: val }))

  const updateCard = (i: number, field: 'title' | 'description', val: string) =>
    setData((d) => {
      const cards = [...d.cards]
      cards[i] = { ...cards[i], [field]: val }
      return { ...d, cards }
    })

  return (
    <SectionShell
      title="Features (Bento Grid)"
      description="Edit the section header and each of the 8 feature card titles and descriptions."
      onSave={() => saveSection('bento', data)}
      onReset={() => resetSection('bento').then(setData)}
    >
      <CardSection title="Section Header">
        <div className="space-y-3">
          <Field label="Eyebrow Badge Text">
            <TextInput value={data.eyebrow} onChange={(v) => set('eyebrow', v)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Headline (before gradient)">
              <TextInput value={data.headline} onChange={(v) => set('headline', v)} />
            </Field>
            <Field label="Headline Gradient Part">
              <TextInput value={data.headlineGradient} onChange={(v) => set('headlineGradient', v)} />
            </Field>
          </div>
          <Field label="Subtext">
            <TextareaInput value={data.subtext} onChange={(v) => set('subtext', v)} rows={2} />
          </Field>
        </div>
      </CardSection>

      <Divider />

      <CardSection title="Feature Cards">
        <div className="space-y-6">
          {data.cards.map((card, i) => (
            <div key={i} className="bg-[#080b12] border border-[rgba(108,92,231,0.12)] rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-[#8b7cf0] uppercase tracking-widest">Card {i + 1}</p>
              <Field label="Title">
                <TextInput
                  value={card.title}
                  onChange={(v) => updateCard(i, 'title', v)}
                  placeholder="Feature title"
                />
              </Field>
              <Field label="Description">
                <TextareaInput
                  value={card.description}
                  onChange={(v) => updateCard(i, 'description', v)}
                  rows={2}
                  placeholder="Feature description"
                />
              </Field>
            </div>
          ))}
        </div>
      </CardSection>
    </SectionShell>
  )
}
