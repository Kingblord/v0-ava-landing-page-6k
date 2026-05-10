'use client'

import { useState, useEffect } from 'react'
import { getSection, DEFAULT_CONTENT } from '@/lib/content'
import type { PricingContent } from '@/lib/content'
import { AdminField, SectionHeader, useSaveSection } from '@/components/admin/AdminEditor'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'

export default function AdminPricing() {
  const [data, setData] = useState<PricingContent>(DEFAULT_CONTENT.pricing)
  const { saving, handleSave, handleReset } = useSaveSection('pricing', data, DEFAULT_CONTENT.pricing, setData)

  useEffect(() => { getSection('pricing').then(setData) }, [])

  function updatePlan(i: number, key: string, value: string | number | boolean) {
    const plans = data.plans.map((p, idx) => idx === i ? { ...p, [key]: value } : p)
    setData({ ...data, plans })
  }

  function updateFeature(planIdx: number, featIdx: number, value: string) {
    const plans = data.plans.map((p, i) => {
      if (i !== planIdx) return p
      const features = p.features.map((f, fi) => fi === featIdx ? value : f)
      return { ...p, features }
    })
    setData({ ...data, plans })
  }

  function addFeature(planIdx: number) {
    const plans = data.plans.map((p, i) =>
      i === planIdx ? { ...p, features: [...p.features, ''] } : p,
    )
    setData({ ...data, plans })
  }

  function removeFeature(planIdx: number, featIdx: number) {
    const plans = data.plans.map((p, i) =>
      i === planIdx ? { ...p, features: p.features.filter((_, fi) => fi !== featIdx) } : p,
    )
    setData({ ...data, plans })
  }

  return (
    <div className="p-8 max-w-3xl">
      <SectionHeader
        title="Pricing"
        description="Section headline and all pricing plans with features."
        onSave={handleSave}
        onReset={handleReset}
        saving={saving}
      />
      <div className="flex flex-col gap-6">
        <AdminField label="Section Label" value={data.sectionLabel} onChange={(v) => setData({ ...data, sectionLabel: v })} />
        <AdminField label="Headline" value={data.headline} onChange={(v) => setData({ ...data, headline: v })} />
        <AdminField label="Headline Accent (gradient)" value={data.headlineAccent} onChange={(v) => setData({ ...data, headlineAccent: v })} />
        <AdminField label="Subheadline" value={data.subheadline} onChange={(v) => setData({ ...data, subheadline: v })} textarea />

        <div className="flex flex-col gap-4">
          <Label className="text-[#f0f4ff] text-xs font-medium uppercase tracking-wide">Pricing Plans</Label>
          {data.plans.map((plan, i) => (
            <div key={i} className="bg-[#1a2235] border border-[#25D366]/15 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-semibold">{plan.name || `Plan ${i + 1}`}</span>
                {plan.popular && (
                  <span className="text-xs bg-[#00D1B2]/15 text-[#00D1B2] px-2 py-0.5 rounded-full">Popular</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#8892a4] text-xs">Plan Name</Label>
                  <Input value={plan.name} onChange={(e) => updatePlan(i, 'name', e.target.value)} className="bg-[#0d1120] border-[#25D366]/20 text-white h-9 text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#8892a4] text-xs">CTA Button Text</Label>
                  <Input value={plan.cta} onChange={(e) => updatePlan(i, 'cta', e.target.value)} className="bg-[#0d1120] border-[#25D366]/20 text-white h-9 text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#8892a4] text-xs">Monthly Price ($)</Label>
                  <Input type="number" value={plan.monthlyPrice} onChange={(e) => updatePlan(i, 'monthlyPrice', Number(e.target.value))} className="bg-[#0d1120] border-[#25D366]/20 text-white h-9 text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#8892a4] text-xs">Annual Price ($)</Label>
                  <Input type="number" value={plan.annualPrice} onChange={(e) => updatePlan(i, 'annualPrice', Number(e.target.value))} className="bg-[#0d1120] border-[#25D366]/20 text-white h-9 text-sm" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[#8892a4] text-xs">Plan Description</Label>
                <Textarea value={plan.desc} onChange={(e) => updatePlan(i, 'desc', e.target.value)} className="bg-[#0d1120] border-[#25D366]/20 text-white text-sm min-h-[60px] resize-none" />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[#8892a4] text-xs">Features</Label>
                {plan.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2">
                    <Input value={f} onChange={(e) => updateFeature(i, fi, e.target.value)} className="bg-[#0d1120] border-[#25D366]/20 text-white h-8 text-sm flex-1" />
                    <button onClick={() => removeFeature(i, fi)} className="text-[#8892a4] hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addFeature(i)} className="flex items-center gap-1.5 text-xs text-[#8892a4] hover:text-white transition-colors mt-1">
                  <Plus className="w-3.5 h-3.5" /> Add Feature
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
