'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/firestore'
import type { Product } from '@/lib/types'
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  minPrice: '',
  negotiationEnabled: false,
}

type FormState = typeof EMPTY_FORM

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  async function reload() {
    if (!user) return
    const p = await getProducts(user.uid)
    setProducts(p)
  }

  useEffect(() => {
    if (!user) return
    reload().finally(() => setLoading(false))
  }, [user])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      minPrice: String(p.minPrice),
      negotiationEnabled: p.negotiationEnabled,
    })
    setEditingId(p.id)
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        minPrice: parseFloat(form.minPrice),
        negotiationEnabled: form.negotiationEnabled,
      }
      if (editingId) {
        await updateProduct(user.uid, editingId, payload)
        toast.success('Product updated.')
      } else {
        await createProduct(user.uid, payload)
        toast.success('Product added.')
      }
      await reload()
      setModalOpen(false)
    } catch {
      toast.error('Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!user || !confirm('Delete this product?')) return
    try {
      await deleteProduct(user.uid, id)
      toast.success('Product deleted.')
      await reload()
    } catch {
      toast.error('Failed to delete product.')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-[#8892a4] text-sm mt-1">Manage your product catalogue</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl">
          <Package className="w-12 h-12 text-[#8892a4] mx-auto mb-3 opacity-40" />
          <p className="text-[#f0f4ff] font-medium">No products yet</p>
          <p className="text-[#8892a4] text-sm mt-1">Add your first product so AVA can sell it.</p>
          <Button onClick={openCreate} className="mt-4 bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-5 flex flex-col gap-3 hover:border-[#6C5CE7]/35 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-white font-semibold text-base leading-snug">{p.name}</h3>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(p)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8892a4] hover:text-[#6C5CE7] hover:bg-[#6C5CE7]/10 transition-colors"
                    aria-label="Edit product"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8892a4] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Delete product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-[#8892a4] text-sm leading-relaxed line-clamp-2">{p.description}</p>

              <div className="flex items-center gap-3 mt-auto pt-2 border-t border-[#6C5CE7]/10">
                <div className="flex items-center gap-1.5 text-[#00D1B2]">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">{p.price.toFixed(2)}</span>
                </div>
                {p.negotiationEnabled && (
                  <span className="text-xs text-[#8892a4]">
                    min: ${p.minPrice.toFixed(2)}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  {p.negotiationEnabled ? (
                    <ToggleRight className="w-4 h-4 text-[#00D1B2]" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-[#8892a4]" />
                  )}
                  <span className="text-xs text-[#8892a4]">
                    {p.negotiationEnabled ? 'Negotiable' : 'Fixed price'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-[#111827] border border-[#6C5CE7]/25 rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#6C5CE7]/15">
              <h2 className="text-white font-semibold">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#8892a4] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[#f0f4ff] text-sm">Product Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Premium Sneakers"
                  required
                  className="bg-[#1a2235] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] h-10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[#f0f4ff] text-sm">Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the product..."
                  required
                  rows={3}
                  className="bg-[#1a2235] border border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 focus:border-[#6C5CE7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#f0f4ff] text-sm">Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    required
                    className="bg-[#1a2235] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] h-10"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#f0f4ff] text-sm">Min Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.minPrice}
                    onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                    placeholder="0.00"
                    required
                    className="bg-[#1a2235] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] h-10"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm({ ...form, negotiationEnabled: !form.negotiationEnabled })}
                  className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 ${
                    form.negotiationEnabled ? 'bg-[#6C5CE7]' : 'bg-[#1a2235] border border-[#6C5CE7]/25'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      form.negotiationEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-[#f0f4ff] text-sm">Enable price negotiation</span>
              </label>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border-[#6C5CE7]/25 text-[#8892a4] hover:text-white hover:bg-[#1a2235] rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
