'use client'

import { useState, useEffect } from 'react'
import { getSection, saveSection, resetSection, DEFAULTS } from '@/lib/content'
import type { HeroContent } from '@/lib/content'
import {
  SectionShell,
  Field,
  TextInput,
  TextareaInput,
  CardSection,
  Divider,
  StringListEditor,
} from '@/components/admin/AdminUI'

export default function HeroEditor() {
  const [data, setData] = useState<HeroContent>(DEFAULTS.hero)

  useEffect(() => {
    getSection('hero').then(setData)
  }, [])

  const set = <K extends keyof HeroContent>(key: K, val: HeroContent[K]) =>
    setData((d) => ({ ...d, [key]: val }))

  return (
    <SectionShell
      title="Hero Section"
      description="Edit the main headline, subtext, CTAs, trust badges, and social proof numbers."
      onSave={() => saveSection('hero', data)}
      onReset={() => resetSection('hero').then(setData)}
    >
      <CardSection title="Eyebrow Badge">
        <Field label="Eyebrow Text">
          <TextInput value={data.eyebrow} onChange={(v) => set('eyebrow', v)} placeholder="AI-Powered Sales Automation" />
        </Field>
      </CardSection>

      <Divider />

      <CardSection title="Headline (4 lines)">
        <div className="space-y-3">
          <Field label="Line 1">
            <TextInput value={data.headlineLine1} onChange={(v) => set('headlineLine1', v)} />
          </Field>
          <Field label="Line 2">
            <TextInput value={data.headlineLine2} onChange={(v) => set('headlineLine2', v)} />
          </Field>
          <Field label="Line 3 (gradient text)">
            <TextInput value={data.headlineGradient} onChange={(v) => set('headlineGradient', v)} />
          </Field>
          <Field label="Line 4">
            <TextInput value={data.headlineLine4} onChange={(v) => set('headlineLine4', v)} />
          </Field>
        </div>
      </CardSection>

      <Divider />

      <CardSection title="Subtext Paragraph">
        <Field label="Subtext">
          <TextareaInput value={data.subtext} onChange={(v) => set('subtext', v)} rows={4} />
        </Field>
      </CardSection>

      <Divider />

      <CardSection title="Social Proof">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Count / Number">
            <TextInput value={data.socialProofCount} onChange={(v) => set('socialProofCount', v)} placeholder="2,400+" />
          </Field>
          <Field label="Label">
            <TextInput value={data.socialProofLabel} onChange={(v) => set('socialProofLabel', v)} placeholder="businesses scaling with AVA" />
          </Field>
        </div>
      </CardSection>

      <Divider />

      <CardSection title="CTA Buttons">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary Button Label">
            <TextInput value={data.primaryCtaLabel} onChange={(v) => set('primaryCtaLabel', v)} />
          </Field>
          <Field label="Primary Button Href">
            <TextInput value={data.primaryCtaHref} onChange={(v) => set('primaryCtaHref', v)} />
          </Field>
          <Field label="Secondary Button Label">
            <TextInput value={data.secondaryCtaLabel} onChange={(v) => set('secondaryCtaLabel', v)} />
          </Field>
        </div>
      </CardSection>

      <Divider />

      <CardSection title="Trust Strip Items">
        <StringListEditor
          label="Trust items (shown below the CTAs)"
          items={data.trustItems.map((t) => t.label)}
          onChange={(items) => set('trustItems', items.map((label) => ({ label })))}
          placeholder="e.g. No Credit Card Required"
        />
      </CardSection>
    </SectionShell>
  )
}
