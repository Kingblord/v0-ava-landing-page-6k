'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { updateBusiness } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Check, ChevronRight, Copy, QrCode } from 'lucide-react'
import { toast } from 'sonner'

type Step = 1 | 2 | 3

export default function OnboardingModal() {
  const router = useRouter()
  const { user, refreshBusiness } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [businessName, setBusinessName] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessCategory, setBusinessCategory] = useState('')
  const [products, setProducts] = useState<{ name: string; price: string }[]>([])
  const [newProduct, setNewProduct] = useState({ name: '', price: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleStep1Submit() {
    if (!businessName.trim()) {
      toast.error('Business name is required')
      return
    }
    setSaving(true)
    try {
      if (user) {
        await updateBusiness(user.uid, {
          businessName: businessName.trim(),
          businessPhone: businessPhone.trim() || undefined,
          businessEmail: businessEmail.trim() || undefined,
          businessCategory: businessCategory.trim() || undefined,
        })
        await refreshBusiness()
      }
      setStep(2)
      toast.success('Business info saved')
    } catch (err) {
      toast.error('Failed to save business info')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function handleAddProduct() {
    if (!newProduct.name.trim() || !newProduct.price.trim()) {
      toast.error('Enter product name and price')
      return
    }
    setProducts([...products, newProduct])
    setNewProduct({ name: '', price: '' })
  }

  function handleRemoveProduct(index: number) {
    setProducts(products.filter((_, i) => i !== index))
  }

  async function handleStep2Submit() {
    setSaving(true)
    try {
      if (user && products.length > 0) {
        // Format products for storage
        const formattedProducts = products.map((p) => ({
          name: p.name.trim(),
          price: parseFloat(p.price),
          negotiationEnabled: false,
        }))
        await updateBusiness(user.uid, {
          products: formattedProducts,
        })
        await refreshBusiness()
        toast.success('Products saved')
      }
      setStep(3)
    } catch (err) {
      toast.error('Failed to save products')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function handleStep2Skip() {
    setStep(3)
  }

  async function handleFinish() {
    router.push('/dashboard')
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to AroMsg</h1>
            <p className="text-sm text-muted-foreground">Step {step} of 3</p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-2 h-2 rounded-full transition-colors ${step >= s ? 'bg-[var(--aro-green)]' : 'bg-border'}`} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Tell us about your business</h2>
                <p className="text-sm text-muted-foreground mb-6">This information helps customers find and understand your business.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-foreground mb-2 block">Business Name*</Label>
                  <Input
                    type="text"
                    placeholder="Acme Store"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="bg-secondary border-border text-foreground h-11"
                  />
                </div>

                <div>
                  <Label className="text-foreground mb-2 block">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+234 801 234 5678"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="bg-secondary border-border text-foreground h-11"
                  />
                </div>

                <div>
                  <Label className="text-foreground mb-2 block">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="business@acme.com"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="bg-secondary border-border text-foreground h-11"
                  />
                </div>

                <div>
                  <Label className="text-foreground mb-2 block">Business Category</Label>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="w-full bg-secondary border border-border text-foreground rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--aro-green)]"
                  >
                    <option value="">Select a category</option>
                    <option value="retail">Retail</option>
                    <option value="fashion">Fashion & Apparel</option>
                    <option value="food">Food & Beverage</option>
                    <option value="electronics">Electronics</option>
                    <option value="services">Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="flex-1 h-11"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleStep1Submit}
                  disabled={saving}
                  className="flex-1 h-11 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)]"
                >
                  {saving ? 'Saving...' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Add Products */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Add your products</h2>
                <p className="text-sm text-muted-foreground">Add at least 3 products to your catalog. You can always add more later.</p>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {products.map((product, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">₦{parseFloat(product.price).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveProduct(idx)}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-4 bg-secondary rounded-lg border border-border">
                <div>
                  <Label className="text-foreground mb-2 block text-sm">Product Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g., iPhone 15"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="bg-background border-border text-foreground h-10"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block text-sm">Price (₦)</Label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="bg-background border-border text-foreground h-10"
                  />
                </div>
                <Button
                  onClick={handleAddProduct}
                  className="w-full bg-[var(--aro-green)]/10 hover:bg-[var(--aro-green)]/20 text-[var(--aro-green)] border border-[var(--aro-green)]/20 h-10"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Product
                </Button>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleStep2Skip}
                  variant="outline"
                  className="flex-1 h-11"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleStep2Submit}
                  disabled={saving || products.length === 0}
                  className="flex-1 h-11 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)]"
                >
                  {saving ? 'Saving...' : `Continue (${products.length})`}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: QR Connection */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Connect your WhatsApp</h2>
                <p className="text-sm text-muted-foreground">Scan the QR code to link your WhatsApp Business account and start receiving orders.</p>
              </div>

              <div className="flex flex-col items-center gap-6 py-8">
                <div className="p-4 bg-secondary rounded-xl border-2 border-dashed border-border">
                  <QrCode className="w-48 h-48 text-muted-foreground" />
                </div>

                <div className="w-full space-y-3 text-sm">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600">
                    <p className="font-semibold mb-1">How to connect:</p>
                    <ol className="space-y-1 text-xs">
                      <li>1. Open WhatsApp on your phone</li>
                      <li>2. Go to Settings → Linked Devices</li>
                      <li>3. Tap "Link a Device" and scan the QR above</li>
                      <li>4. Keep your phone with internet for continuous sync</li>
                    </ol>
                  </div>

                  {user && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Your connection key:</p>
                      <div className="flex items-center gap-2 bg-background p-2 rounded border border-border">
                        <code className="text-xs font-mono text-foreground flex-1 truncate">{user.uid}</code>
                        <button
                          onClick={() => copyToClipboard(user.uid)}
                          className="p-1.5 hover:bg-secondary rounded transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleFinish}
                  className="flex-1 h-11 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
