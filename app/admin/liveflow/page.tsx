'use client'

import { useState, useEffect } from 'react'
import { getSection, saveSection, resetSection, DEFAULTS } from '@/lib/content'
import type { LiveFlowContent } from '@/lib/content'
import {
  SectionShell,
  Field,
  TextInput,
  TextareaInput,
  CardSection,
  Divider,
} from '@/components/admin/AdminUI'

export default function LiveFlowEditor() {
  const [data, setData] = useState<LiveFlowContent>(DEFAULTS.liveFlow)

  useEffect(() => {
    getSection('liveFlow').then(setData)
  }, [])

  const set = <K extends keyof LiveFlowContent>(key: K, val: LiveFlowContent[K]) =>
    setData((d) => ({ ...d, [key]: val }))

  const updateStep = (i: number, field: keyof LiveFlowContent['steps'][0], val: string) =>
    setData((d) => {
      const steps = [...d.steps]
      steps[i] = { ...steps[i], [field]: val }
      return { ...d, steps }
    })

  return (
    <SectionShell
      title="How It Works"
      description="Edit the section header and each of the 3 steps in the flow diagram."
      onSave={() => saveSection('liveFlow', data)}
      onReset={() => resetSection('liveFlow').then(setData)}
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
        </div>
      </CardSection>

      <Divider />

      <CardSection title="Steps">
        <div className="space-y-5">
          {data.steps.map((step, i) => (
            <div key={i} className="bg-[#080b12] border border-[rgba(108,92,231,0.12)] rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-[#8b7cf0] uppercase tracking-widest">Step {i + 1}</p>
              <Field label="Step Label (shown on phone mockup)">
                <TextInput
                  value={step.label}
                  onChange={(v) => updateStep(i, 'label', v)}
                  placeholder="Connect"
                />
              </Field>
              <Field label="Step Title">
                <TextInput
                  value={step.title}
                  onChange={(v) => updateStep(i, 'title', v)}
                  placeholder="Connect Your Channels"
                />
              </Field>
              <Field label="Step Description">
                <TextareaInput
                  value={step.description}
                  onChange={(v) => updateStep(i, 'description', v)}
                  rows={3}
                />
              </Field>
            </div>
          ))}
        </div>
      </CardSection>
    </SectionShell>
  )
}
