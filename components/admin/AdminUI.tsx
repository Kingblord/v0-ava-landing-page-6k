'use client'

import { useState, useTransition, useCallback } from 'react'
import { Save, RotateCcw, Plus, Trash2, ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastState = { type: 'success' | 'error'; message: string } | null

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null)
  const show = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }, [])
  return { toast, show }
}

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium shadow-2xl border transition-all duration-300 ${
        toast.type === 'success'
          ? 'bg-[#0d2b20] border-[rgba(0,209,178,0.3)] text-[#00D1B2]'
          : 'bg-[#2b0d18] border-[rgba(239,68,68,0.3)] text-red-400'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 size={16} />
      ) : (
        <AlertCircle size={16} />
      )}
      {toast.message}
    </div>
  )
}

// ─── Section shell ─────────────────────────────────────────────────────────────

interface SectionShellProps {
  title: string
  description: string
  onSave: () => Promise<void>
  onReset: () => Promise<void>
  children: React.ReactNode
}

export function SectionShell({ title, description, onSave, onReset, children }: SectionShellProps) {
  const [saving, startSave] = useTransition()
  const [resetting, startReset] = useTransition()
  const { toast, show } = useToast()

  const handleSave = () => {
    startSave(async () => {
      try {
        await onSave()
        show('success', 'Saved successfully')
      } catch {
        show('error', 'Failed to save. Check Firestore connection.')
      }
    })
  }

  const handleReset = () => {
    if (!confirm('Reset this section to default values? This cannot be undone.')) return
    startReset(async () => {
      try {
        await onReset()
        show('success', 'Reset to defaults')
      } catch {
        show('error', 'Failed to reset.')
      }
    })
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f0f4ff] tracking-tight">{title}</h1>
        <p className="text-sm text-[#8892a4] mt-1">{description}</p>
      </div>

      {/* Card */}
      <div className="bg-[#0d1117] border border-[rgba(108,92,231,0.15)] rounded-3xl p-7 space-y-6">
        {children}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#6C5CE7] to-[#8b7cf0] hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-[rgba(108,92,231,0.25)]"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-[#8892a4] border border-[rgba(108,92,231,0.2)] hover:text-[#f0f4ff] hover:border-[rgba(108,92,231,0.4)] transition-all disabled:opacity-60"
        >
          {resetting ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
          Reset to Defaults
        </button>
      </div>

      <Toast toast={toast} />
    </div>
  )
}

// ─── Field components ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  hint?: string
  children: React.ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[#f0f4ff] uppercase tracking-wider">
        {label}
      </label>
      {hint && <p className="text-[11px] text-[#8892a4]">{hint}</p>}
      {children}
    </div>
  )
}

const INPUT_BASE =
  'w-full bg-[#080b12] border border-[rgba(108,92,231,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f0f4ff] placeholder-[#8892a4] focus:outline-none focus:border-[rgba(108,92,231,0.5)] focus:ring-1 focus:ring-[rgba(108,92,231,0.25)] transition-all'

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={INPUT_BASE}
    />
  )
}

export function TextareaInput({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${INPUT_BASE} resize-none`}
    />
  )
}

export function NumberInput({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label?: string
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-[#8892a4] w-20 shrink-0">{label}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${INPUT_BASE} w-32`}
      />
    </div>
  )
}

export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
          value ? 'bg-gradient-to-r from-[#6C5CE7] to-[#00D1B2]' : 'bg-[#1a2235]'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
            value ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </div>
      <span className="text-sm text-[#8892a4]">{label}</span>
    </label>
  )
}

// ─── List editor (add/remove/reorder string items) ────────────────────────────

export function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  const update = (i: number, v: string) => {
    const next = [...items]
    next[i] = v
    onChange(next)
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const add = () => onChange([...items, ''])
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold text-[#f0f4ff] uppercase tracking-wider">{label}</span>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} className="text-[#8892a4] hover:text-[#f0f4ff]">
                <ChevronUp size={12} />
              </button>
              <button onClick={() => move(i, 1)} className="text-[#8892a4] hover:text-[#f0f4ff]">
                <ChevronDown size={12} />
              </button>
            </div>
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className={`${INPUT_BASE} flex-1`}
            />
            <button
              onClick={() => remove(i)}
              className="p-2 text-[#8892a4] hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs text-[#6C5CE7] hover:text-[#8b7cf0] transition-colors"
      >
        <Plus size={13} />
        Add item
      </button>
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider() {
  return <div className="border-t border-[rgba(108,92,231,0.1)]" />
}

// ─── Section heading inside card ──────────────────────────────────────────────

export function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[#8b7cf0] uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  )
}
