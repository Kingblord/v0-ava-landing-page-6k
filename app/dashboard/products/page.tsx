'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import type { Product } from '@/lib/types'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  ToggleLeft,
  ToggleRight,
  X,
  ImageIcon,
} from 'lucide-react'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  minPrice: '',
  negotiationEnabled: true,
  imageUrl: '',
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Real-time listener
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'products'),
      where('businessId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [user])

  function openNew() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      minPrice: String(p.minPrice),
      negotiationEnabled: p.negotiationEnabled,
      imageUrl: p.imageUrl ?? '',
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user) return
      const price = parseFloat(form.price)
      const minPrice = parseFloat(form.minPrice)
      if (!form.name.trim()) { toast.error('Product name is required.'); return }
      if (isNaN(price) || price <= 0) { toast.error('Enter a valid selling price.'); return }
      if (isNaN(minPrice) || minPrice < 0) { toast.error('Enter a valid floor price.'); return }
      if (minPrice > price) { toast.error('Floor price cannot exceed selling price.'); return }

      setSaving(true)
      try {
        const payload = {
          name: form.name.trim(),
          description: form.description.trim(),
          price,
          minPrice,
          negotiationEnabled: form.negotiationEnabled,
          imageUrl: form.imageUrl || '',
          businessId: user.uid,
        }
        if (editingId) {
          await updateDoc(doc(db, 'products', editingId), payload)
          toast.success('Product updated.')
        } else {
          await addDoc(collection(db, 'products'), {
            ...payload,
            createdAt: serverTimestamp(),
          })
          toast.success('Product added.')
        }
        closeForm()
      } catch {
        toast.error('Failed to save product.')
      } finally {
        setSaving(false)
      }
    },
    [user, form, editingId],
  )

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'products', id))
      toast.success('Product deleted.')
    } catch {
      toast.error('Failed to delete product.')
    } finally {
      setDeleting(null)
    }
  }

  async function toggleNegotiation(p: Product) {
    try {
      await updateDoc(doc(db, 'products', p.id), {
        negotiationEnabled: !p.negotiationEnabled,
      })
    } catch {
      toast.error('Failed to update product.')
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-[#8892a4] text-sm mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} — AVA sells these via WhatsApp
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#1a2235] animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[#111827] border border-[#25D366]/15 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#1a2235] flex items-center justify-center">
            <Package className="w-8 h-8 text-[#25D366]" />
          </div>
          <p className="text-white font-semibold">No products yet</p>
          <p className="text-[#8892a4] text-sm text-center max-w-xs">
            Add your first product so AVA knows what to sell on WhatsApp.
          </p>
          <Button
            onClick={openNew}
            className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl gap-2 mt-2"
          >
            <Plus className="w-4 h-4" /> Add First Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-[#111827] border border-[#25D366]/15 rounded-2xl overflow-hidden flex flex-col hover:border-[#25D366]/40 transition-colors group"
            >
              {/* Product image */}
              <div className="relative aspect-video bg-[#1a2235] flex-shrink-0">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-[#25D366]/25" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-2 p-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white font-semibold text-sm leading-snug line-clamp-2">
                    {p.name}
                  </p>
                  <button
                    onClick={() => toggleNegotiation(p)}
                    className="shrink-0 mt-0.5"
                    aria-label="Toggle negotiation"
                  >
                    {p.negotiationEnabled
                      ? <ToggleRight className="w-5 h-5 text-[#00D1B2]" />
                      : <ToggleLeft className="w-5 h-5 text-[#8892a4]" />}
                  </button>
                </div>
                {p.description && (
                  <p className="text-[#8892a4] text-xs line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center gap-3 mt-auto pt-2 border-t border-[#25D366]/10">
                  <span className="text-white font-bold text-sm">${p.price.toFixed(2)}</span>
                  <span className="text-[#8892a4] text-xs">floor ${p.minPrice.toFixed(2)}</span>
                  {p.negotiationEnabled && (
                    <span className="ml-auto text-[10px] font-medium bg-[#00D1B2]/10 text-[#00D1B2] border border-[#00D1B2]/20 rounded-full px-2 py-0.5">
                      Negotiable
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t border-[#25D366]/10">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-[#8892a4] hover:text-white hover:bg-[#1a2235] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <div className="w-px bg-[#25D366]/10" />
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-[#8892a4] hover:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting === p.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-in panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={closeForm}
          />
          <div className="w-full max-w-md bg-[#111827] border-l border-[#25D366]/20 h-full overflow-y-auto flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#25D366]/15 sticky top-0 bg-[#111827] z-10">
              <h2 className="text-white font-semibold text-base">
                {editingId ? 'Edit Product' : 'New Product'}
              </h2>
              <button
                onClick={closeForm}
                className="text-[#8892a4] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-6 p-6 flex-1">
              {/* Image upload */}
              <div className="flex flex-col gap-2">
                <Label className="text-[#8892a4] text-xs font-medium uppercase tracking-wider">
                  Product Image
                </Label>
                <ImageUpload
                  value={form.imageUrl}
                  onChange={(url) => setForm({ ...form, imageUrl: url })}
                  folder="products"
                  variant="rect"
                  label="Click to upload product image"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="prod-name" className="text-[#8892a4] text-xs font-medium uppercase tracking-wider">
                  Product Name *
                </Label>
                <Input
                  id="prod-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Nike Air Max 90"
                  className="bg-[#0d1120] border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60"
                  required
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="prod-desc" className="text-[#8892a4] text-xs font-medium uppercase tracking-wider">
                  Description
                </Label>
                <textarea
                  id="prod-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the product for AVA to reference in conversations..."
                  rows={3}
                  className="bg-[#0d1120] border border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60 rounded-lg px-3 py-2 text-sm resize-none outline-none transition-colors"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prod-price" className="text-[#8892a4] text-xs font-medium uppercase tracking-wider">
                    Selling Price *
                  </Label>
                  <Input
                    id="prod-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    className="bg-[#0d1120] border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prod-floor" className="text-[#8892a4] text-xs font-medium uppercase tracking-wider">
                    Floor Price *
                  </Label>
                  <Input
                    id="prod-floor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minPrice}
                    onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                    placeholder="0.00"
                    className="bg-[#0d1120] border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60"
                    required
                  />
                </div>
              </div>

              {/* Negotiation toggle */}
              <div className="flex items-center justify-between bg-[#0d1120] border border-[#25D366]/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">Allow Negotiation</p>
                  <p className="text-[#8892a4] text-xs mt-0.5">
                    AVA will negotiate between floor and selling price
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, negotiationEnabled: !form.negotiationEnabled })}
                >
                  {form.negotiationEnabled
                    ? <ToggleRight className="w-8 h-8 text-[#00D1B2]" />
                    : <ToggleLeft className="w-8 h-8 text-[#8892a4]" />}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  className="flex-1 border-[#25D366]/20 text-[#8892a4] hover:text-white hover:bg-[#1a2235] rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
