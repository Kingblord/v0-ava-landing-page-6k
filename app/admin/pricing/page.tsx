'use client'

import { useState, useEffect } from 'react'
import { getSection, saveSection, resetSection, DEFAULTS } from '@/lib/content'
import type { PricingContent } from '@/lib/content'
import {
  SectionShell,
  Field,
  TextInput,
  TextareaInput,
  NumberInput,
  Toggle,
  StringListEditor,
  CardSection,
  Divider,
} from '@/components/admin/AdminUI'

export default function PricingEditor() {
  const [data, setData] = useState<PricingContent>(DEFAULTS.pricing)

  useEffect(() => {
    getSection('pricing').then(setData)
  }, [])

  const set = <K extends keyof PricingContent>(key: K, val: PricingContent[K]) =>
    setData((d) => ({ ...d, [key]: val }))

  const updatePlan = <K extends keyof PricingContent['plans'][0]>(
    i: number,
    field: K,
    val: PricingContent['plans'][0][K]
  ) =>
    setData((d) => {
      const plans = [...d.plans]
      plans[i] = { ...plans[i], [field]: val }
      return { ...d, plans }
    })

  return (
    <SectionShell
      title="Pricing"
      description="Edit section copy, the annual save label, and each pricing plan's details."
      onSave={() => saveSection('pricing', data)}
      onReset={() => resetSection('pricing').then(setData)}
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
          <Field label="Subtext">
            <TextareaInput value={data.subtext} onChange={(v) => set('subtext', v)} rows={2} />
          </Field>
          <Field label="Annual Toggle Save Label (e.g. Save 30%)">
            <TextInput value={data.annualSaveLabel} onChange={(v) => set('annualSaveLabel', v)} />
          </Field>
          <Field label="Footer Note (below cards)">
            <TextInput value={data.footerNote} onChange={(v) => set('footerNote', v)} />
          </Field>
        </div>
      </CardSection>

      <Divider />

      <CardSection title="Pricing Plans">
        <div className="space-y-6">
          {data.plans.map((plan, i) => (
            <div key={i} className="bg-[#080b12] border border-[rgba(108,92,231,0.12)] rounded-2xl p-5 space-y-4">
              <p className="text-xs font-bold text-[#8b7cf0] uppercase tracking-widest">Plan {i + 1}</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Plan Name">
                  <TextInput value={plan.name} onChange={(v) => updatePlan(i, 'name', v)} placeholder="Starter" />
                </Field>
                <Field label="Tagline">
                  <TextInput value={plan.tagline} onChange={(v) => updatePlan(i, 'tagline', v)} placeholder="Perfect for solo sellers" />
                </Field>
                <Field label="CTA Button Text">
                  <TextInput value={plan.cta} onChange={(v) => updatePlan(i, 'cta', v)} placeholder="Start Free Trial" />
                </Field>
              </div>

              <div className="flex items-center gap-6">
                <NumberInput
                  label="Monthly Price ($)"
                  value={plan.monthlyPrice}
                  onChange={(v) => updatePlan(i, 'monthlyPrice', v)}
                />
                <NumberInput
                  label="Annual Price ($)"
                  value={plan.annualPrice}
                  onChange={(v) => updatePlan(i, 'annualPrice', v)}
                />
              </div>

              <Toggle
                value={plan.popular}
                onChange={(v) => updatePlan(i, 'popular', v)}
                label="Mark as Most Popular"
              />

              <StringListEditor
                label="Features List"
                items={plan.features}
                onChange={(features) => updatePlan(i, 'features', features)}
                placeholder="Feature description..."
              />
            </div>
          ))}
        </div>
      </CardSection>
    </SectionShell>
  )
}
