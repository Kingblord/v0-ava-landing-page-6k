'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { saveSection } from '@/lib/content'
import type { SiteContent } from '@/lib/content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, RotateCcw, Loader2, Plus, Trash2 } from 'lucide-react'

// ─── Field primitives ─────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
  placeholder?: string
}

export function AdminField({ label, value, onChange, textarea, placeholder }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[#f0f4ff] text-xs font-medium uppercase tracking-wide">{label}</Label>
      {textarea ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-[#1a2235] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] focus:border-[#6C5CE7] min-h-[80px] resize-y text-sm"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-[#1a2235] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] focus:border-[#6C5CE7] h-10 text-sm"
        />
      )}
    </div>
  )
}

// ─── Section header + save/reset bar ─────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  description?: string
  onSave: () => Promise<void>
  onReset: () => void
  saving: boolean
}

export function SectionHeader({ title, description, onSave, onReset, saving }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8 pb-6 border-b border-[#6C5CE7]/15">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {description && <p className="text-[#8892a4] text-sm mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={saving}
          className="border-[#6C5CE7]/25 text-[#8892a4] hover:text-white hover:bg-[#6C5CE7]/10 gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="bg-[#6C5CE7] hover:bg-[#5548c7] text-white gap-1.5 min-w-[90px]"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

// ─── Generic list editor (array of objects) ───────────────────────────────────

interface ListEditorProps<T extends Record<string, string>> {
  label: string
  items: T[]
  fields: { key: keyof T; label: string; textarea?: boolean }[]
  onChange: (items: T[]) => void
  newItem: T
}

export function ListEditor<T extends Record<string, string>>({
  label, items, fields, onChange, newItem,
}: ListEditorProps<T>) {
  function updateItem(index: number, key: keyof T, value: string) {
    const next = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item,
    )
    onChange(next)
  }

  function addItem() {
    onChange([...items, { ...newItem }])
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-[#f0f4ff] text-xs font-medium uppercase tracking-wide">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="bg-[#1a2235] border border-[#6C5CE7]/15 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[#8892a4] text-xs font-medium">Item {i + 1}</span>
            <button
              onClick={() => removeItem(i)}
              className="text-[#8892a4] hover:text-red-400 transition-colors"
              aria-label="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {fields.map((f) => (
            <AdminField
              key={String(f.key)}
              label={String(f.key)}
              value={String(item[f.key] ?? '')}
              onChange={(v) => updateItem(i, f.key, v)}
              textarea={f.textarea}
              placeholder={f.label}
            />
          ))}
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#6C5CE7]/25 rounded-xl text-[#8892a4] hover:text-white hover:border-[#6C5CE7]/50 transition-all text-sm"
      >
        <Plus className="w-4 h-4" />
        Add Item
      </button>
    </div>
  )
}

// ─── Reusable save hook ────────────────────────────────────────────────────────

export function useSaveSection<K extends keyof SiteContent>(
  section: K,
  data: SiteContent[K],
  defaultData: SiteContent[K],
  setData: (d: SiteContent[K]) => void,
) {
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await saveSection(section, data)
      toast.success('Saved successfully')
    } catch {
      toast.error('Failed to save. Check your Firebase connection.')
    } finally {
      setSaving(false)
    }
  }, [section, data])

  const handleReset = useCallback(() => {
    setData(defaultData)
    toast.info('Reset to defaults — click Save to apply.')
  }, [defaultData, setData])

  return { saving, handleSave, handleReset }
}
