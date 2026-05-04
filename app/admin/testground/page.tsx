'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getTestgroundProducts, createTestgroundProduct, deleteTestgroundProduct, saveTestgroundConfig } from '@/lib/firestore'
import { getMainWebhookUrl, getTestgroundWebhookUrl } from '@/lib/webhook-utils'
import type { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Plus, Trash2, Copy, Check } from 'lucide-react'

const DEFAULT_BUSINESS = {
  name: 'Test Store',
  aiPersonality: 'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision. Be concise, warm, and human.',
}

const AI_MODELS = [
  { id: 'openrouter/free', label: 'OpenRouter Free' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
  { id: 'anthropic/claude-opus-4.6', label: 'Claude Opus 4.6' },
]

export default function TestgroundPage() {
  const { user, loading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [business, setBusiness] = useState(DEFAULT_BUSINESS)
  const [selectedModel, setSelectedModel] = useState('openrouter/free')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showWebhookUrls, setShowWebhookUrls] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<'main' | 'testground' | null>(null)
  const [loadingAddProduct, setLoadingAddProduct] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    minPrice: 0,
    negotiationEnabled: false,
  })

  // Load testground products from Firestore on mount
  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const prods = await getTestgroundProducts(user.uid)
        setProducts(prods)
      } catch (err) {
        console.error('[testground] Failed to load products:', err)
        toast.error('Failed to load test products')
      } finally {
        setLoadingProducts(false)
      }
    }
    load()
  }, [user])

  // Auto-save testground config to Firestore whenever it changes
  useEffect(() => {
    if (!user || !products.length) return
    async function saveConfig() {
      try {
        await saveTestgroundConfig(user.uid, {
          products,
          businessName: business.name,
          aiPersonality: business.aiPersonality,
          selectedModel,
        })
      } catch (err) {
        console.error('[testground] Config save error:', err)
      }
    }
    saveConfig()
  }, [user, products, business.name, business.aiPersonality, selectedModel])

  async function copyWebhookUrl(type: 'main' | 'testground') {
    const url = type === 'main' ? getMainWebhookUrl() : getTestgroundWebhookUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(type)
      toast.success(`${type === 'main' ? 'Main' : 'Testground'} webhook URL copied!`)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  async function addTestProduct() {
    if (!user) return
    
    if (!newProduct.name?.trim()) {
      toast.error('Product name is required')
      return
    }
    if (!newProduct.description?.trim()) {
      toast.error('Product description is required')
      return
    }
    if (newProduct.price === undefined || newProduct.price <= 0) {
      toast.error('Product price must be greater than 0')
      return
    }
    if (newProduct.minPrice === undefined || newProduct.minPrice <= 0) {
      toast.error('Minimum price must be greater than 0')
      return
    }
    if (newProduct.minPrice > newProduct.price) {
      toast.error('Minimum price cannot be greater than price')
      return
    }

    setLoadingAddProduct(true)
    try {
      console.log('[testground] Adding product:', { name: newProduct.name, price: newProduct.price })
      
      // Create a timeout promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out - Firebase may not be configured')), 10000)
      )
      
      const productPromise = createTestgroundProduct(user.uid, {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: newProduct.price,
        minPrice: newProduct.minPrice,
        negotiationEnabled: newProduct.negotiationEnabled ?? false,
      })
      
      const created = await Promise.race([productPromise, timeoutPromise])
      console.log('[testground] Product created successfully:', created)
      setProducts(prev => [...prev, created as typeof created])
      setNewProduct({ name: '', description: '', price: 0, minPrice: 0, negotiationEnabled: false })
      setShowProductForm(false)
      toast.success('Test product added successfully!')
    } catch (err) {
      console.error('[testground] Failed to add product:', err)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to add product: ${errorMsg}`)
    } finally {
      setLoadingAddProduct(false)
    }
  }

  async function deleteProduct(id: string) {
    if (!user) return
    setDeletingProductId(id)
    try {
      await deleteTestgroundProduct(user.uid, id)
      setProducts(products.filter((p) => p.id !== id))
      toast.success('Product removed')
    } catch (err) {
      console.error('[testground] Failed to delete product:', err)
      toast.error('Failed to delete product')
    } finally {
      setDeletingProductId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="w-6 h-6" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-white mb-4">Please sign in to access testground</p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <main className="flex-1 overflow-auto">
        <div className="flex gap-6 p-6">
          {/* Left Panel — Configuration */}
          <div className="w-96 space-y-4">
            <h1 className="text-2xl font-bold text-white mb-6">Testground Configuration</h1>

            {/* AI Configuration */}
            <Card className="bg-[#111827] border-[#6C5CE7]/15 p-4">
              <h2 className="text-sm font-semibold text-white mb-3">AI Configuration</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[#8892a4] text-xs font-medium">Business Name</label>
                  <Input
                    value={business.name}
                    onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                    placeholder="Test Store"
                    className="mt-1 bg-[#0d1120] border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60"
                  />
                </div>

                <div>
                  <label className="text-[#8892a4] text-xs font-medium">AI Personality</label>
                  <textarea
                    value={business.aiPersonality}
                    onChange={(e) => setBusiness({ ...business, aiPersonality: e.target.value })}
                    placeholder="Describe how the AI should behave..."
                    className="mt-1 w-full h-24 bg-[#0d1120] border border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60 p-2 rounded text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="text-[#8892a4] text-xs font-medium">AI Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="mt-1 w-full bg-[#0d1120] border border-[#6C5CE7]/20 text-white text-xs p-2 rounded-lg focus:border-[#6C5CE7]/60 focus:outline-none"
                  >
                    {AI_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Webhook URLs */}
            <Card className="bg-[#111827] border-[#6C5CE7]/15 p-4">
              <button
                onClick={() => setShowWebhookUrls(!showWebhookUrls)}
                className="w-full flex items-center justify-between text-sm font-semibold text-white hover:text-[#6C5CE7] transition-colors"
              >
                <span>Webhook URLs</span>
                <span className="text-xs text-[#8892a4]">{showWebhookUrls ? '▼' : '▶'}</span>
              </button>

              {showWebhookUrls && (
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[#8892a4] text-xs font-medium mb-2">Main Platform Webhook</p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-[#0d1120] border border-[#6C5CE7]/20 p-2 rounded text-[#6C5CE7] text-xs overflow-x-auto break-all">
                        {getMainWebhookUrl()}
                      </code>
                      <button
                        onClick={() => copyWebhookUrl('main')}
                        className="flex items-center justify-center w-8 h-8 bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white rounded transition-colors"
                      >
                        {copiedUrl === 'main' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[#8892a4] text-xs font-medium mb-2">Testground Webhook</p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-[#0d1120] border border-[#6C5CE7]/20 p-2 rounded text-[#6C5CE7] text-xs overflow-x-auto break-all">
                        {getTestgroundWebhookUrl()}
                      </code>
                      <button
                        onClick={() => copyWebhookUrl('testground')}
                        className="flex items-center justify-center w-8 h-8 bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white rounded transition-colors"
                      >
                        {copiedUrl === 'testground' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Panel — Test Products */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Test Products</h2>
              <Button
                onClick={() => setShowProductForm(!showProductForm)}
                size="sm"
                className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </div>

            {/* Product Form */}
            {showProductForm && (
              <Card className="bg-[#111827] border-[#6C5CE7]/15 p-4 space-y-3">
                <Input
                  value={newProduct.name || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Product name"
                  className="bg-[#0d1120] border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60 text-sm"
                />
                <textarea
                  value={newProduct.description || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Product description"
                  className="w-full h-16 bg-[#0d1120] border border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60 p-2 rounded text-sm resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={newProduct.price || 0}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                    placeholder="Price"
                    className="bg-[#0d1120] border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60 text-sm"
                  />
                  <Input
                    type="number"
                    value={newProduct.minPrice || 0}
                    onChange={(e) => setNewProduct({ ...newProduct, minPrice: parseFloat(e.target.value) })}
                    placeholder="Min price"
                    className="bg-[#0d1120] border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.negotiationEnabled ?? false}
                    onChange={(e) => setNewProduct({ ...newProduct, negotiationEnabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Negotiation Enabled
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={addTestProduct}
                    disabled={loadingAddProduct}
                    className="flex-1 bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white text-xs flex items-center justify-center gap-2"
                  >
                    {loadingAddProduct ? (
                      <>
                        <Spinner className="w-3 h-3" />
                        Adding...
                      </>
                    ) : (
                      'Add Product'
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowProductForm(false)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* Products List */}
            {loadingProducts ? (
              <div className="flex items-center justify-center h-32 text-[#8892a4]">
                <Spinner className="w-5 h-5 mr-2" />
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <Card className="bg-[#111827] border-[#6C5CE7]/15 p-6 text-center text-[#8892a4] text-sm">
                No test products yet. Add one to get started.
              </Card>
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <Card
                    key={p.id}
                    className="bg-[#111827] border-[#6C5CE7]/15 p-3 flex items-start justify-between hover:border-[#6C5CE7]/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{p.name}</p>
                      <p className="text-xs text-[#8892a4] line-clamp-1">{p.description}</p>
                      <div className="flex gap-2 mt-1 text-xs text-[#6C5CE7]">
                        <span>${p.price}</span>
                        {p.negotiationEnabled && <span className="text-[#8892a4]">(min: ${p.minPrice})</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      disabled={deletingProductId === p.id}
                      className="text-[#8892a4] hover:text-red-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                    >
                      {deletingProductId === p.id ? (
                        <Spinner className="w-3 h-3" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </Card>
                ))}
              </div>
            )}

            <Card className="bg-[#111827] border-[#6C5CE7]/15 p-4">
              <p className="text-xs text-[#8892a4]">
                <strong>How to test:</strong> Copy the testground webhook URL and add it to Twilio. Send messages from WhatsApp to your Twilio sandbox number. The AI will respond using your configured products and personality.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
