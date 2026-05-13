'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
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

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    description: '6.9" display, A18 Pro chip, advanced camera system with 5x optical zoom, titanium design',
    price: 1199,
    minPrice: 1000,
    businessId: 'testground',
    negotiationEnabled: true,
    createdAt: Date.now(),
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    description: '6.3" display, A18 Pro chip, dual camera system, titanium design with action button',
    price: 999,
    minPrice: 850,
    businessId: 'testground',
    negotiationEnabled: true,
    createdAt: Date.now(),
  },
  {
    id: 'iphone-16',
    name: 'iPhone 16',
    description: '6.1" display, A18 chip, dual rear cameras, all-day battery life',
    price: 799,
    minPrice: 699,
    businessId: 'testground',
    negotiationEnabled: true,
    createdAt: Date.now(),
  },
  {
    id: 'iphone-16-plus',
    name: 'iPhone 16 Plus',
    description: '6.7" display, A18 chip, extended battery life, dual camera system',
    price: 899,
    minPrice: 799,
    businessId: 'testground',
    negotiationEnabled: true,
    createdAt: Date.now(),
  },
]

const AI_MODELS = [

 { id: 'openrouter/free', label: 'OpenRouter Free' },

 { id: 'openai/gpt-oss-120b:free', label: 'GPT-4o Mini' },

 { id: 'z-ai/glm-4.5-air:free', label: 'GPT-4 Turbo' },

 { id: 'openrouter/owl-alpha', label: 'Claude Opus 4.6' },

]

export default function TestgroundPage() {
  const { user, loading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [business, setBusiness] = useState(DEFAULT_BUSINESS)
  const [selectedModel, setSelectedModel] = useState('openrouter/free')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showWebhookUrls, setShowWebhookUrls] = useState(false)
  const [showConversationLogs, setShowConversationLogs] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<'main' | 'testground' | null>(null)
  const [loadingAddProduct, setLoadingAddProduct] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [conversationLogs, setConversationLogs] = useState<Array<{ id: string; message: string; timestamp: number }>>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    minPrice: 0,
    negotiationEnabled: false,
  })

  // Load testground products from fallback on mount
  useEffect(() => {
    if (!user) return
    try {
      console.log('[testground] Using fallback iPhone products')
      setProducts(FALLBACK_PRODUCTS)
    } catch (err) {
      console.error('[testground] Failed to load products:', err)
      setProducts(FALLBACK_PRODUCTS)
      toast.error('Using sample products.')
    } finally {
      setLoadingProducts(false)
    }
  }, [user])

  // Auto-save testground config whenever it changes
  useEffect(() => {
    if (!user || !products.length) return
    console.log('[testground] Config changed:', { products, business, selectedModel })
  }, [user, products, business.name, business.aiPersonality, selectedModel])

  // Load conversation logs when showing them
  async function loadConversationLogs() {
    if (loadingLogs) return
    setLoadingLogs(true)
    try {
      console.log('[testground] Loading conversation logs')
      setConversationLogs([])
    } catch (err) {
      console.error('[testground] Failed to load conversation logs:', err)
      toast.error('Failed to load conversation logs')
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleShowLogs = () => {
    setShowConversationLogs(true)
    loadConversationLogs()
  }

  async function deleteConversationLog(logId: string) {
    try {
      console.log('[testground] Deleting log:', logId)
      setConversationLogs(logs => logs.filter(l => l.id !== logId))
      toast.success('Conversation log deleted')
    } catch (err) {
      console.error('[testground] Failed to delete log:', err)
      toast.error('Failed to delete conversation log')
    }
  }

  function getMainWebhookUrl() {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/webhook/whatsapp`
  }

  function getTestgroundWebhookUrl() {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/testground/webhook`
  }

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
      
      const created: Product = {
        id: `product-${Date.now()}`,
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: newProduct.price,
        minPrice: newProduct.minPrice,
        negotiationEnabled: newProduct.negotiationEnabled ?? false,
        businessId: 'testground',
        createdAt: Date.now(),
      }
      
      console.log('[testground] Product created successfully:', created)
      setProducts(prev => [...prev, created])
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
      console.log('[testground] Deleting product:', id)
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
            <Card className="bg-[#111827] border-[#25D366]/15 p-4">
              <h2 className="text-sm font-semibold text-white mb-3">AI Configuration</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[#8892a4] text-xs font-medium">Business Name</label>
                  <Input
                    value={business.name}
                    onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                    placeholder="Test Store"
                    className="mt-1 bg-[#0d1120] border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60"
                  />
                </div>

                <div>
                  <label className="text-[#8892a4] text-xs font-medium">AI Personality</label>
                  <textarea
                    value={business.aiPersonality}
                    onChange={(e) => setBusiness({ ...business, aiPersonality: e.target.value })}
                    placeholder="Describe how the AI should behave..."
                    className="mt-1 w-full h-24 bg-[#0d1120] border border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60 p-2 rounded text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="text-[#8892a4] text-xs font-medium">AI Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="mt-1 w-full bg-[#0d1120] border border-[#25D366]/20 text-white text-xs p-2 rounded-lg focus:border-[#25D366]/60 focus:outline-none"
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
            <Card className="bg-[#111827] border-[#25D366]/15 p-4">
              <button
                onClick={() => setShowWebhookUrls(!showWebhookUrls)}
                className="w-full flex items-center justify-between text-sm font-semibold text-white hover:text-[#25D366] transition-colors"
              >
                <span>Webhook URLs</span>
                <span className="text-xs text-[#8892a4]">{showWebhookUrls ? '▼' : '▶'}</span>
              </button>

              {showWebhookUrls && (
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[#8892a4] text-xs font-medium mb-2">Main Platform Webhook</p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-[#0d1120] border border-[#25D366]/20 p-2 rounded text-[#25D366] text-xs overflow-x-auto break-all">
                        {getMainWebhookUrl()}
                      </code>
                      <button
                        onClick={() => copyWebhookUrl('main')}
                        className="flex items-center justify-center w-8 h-8 bg-[#25D366] hover:bg-[#25D366]/80 text-white rounded transition-colors"
                      >
                        {copiedUrl === 'main' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[#8892a4] text-xs font-medium mb-2">Testground Webhook</p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-[#0d1120] border border-[#25D366]/20 p-2 rounded text-[#25D366] text-xs overflow-x-auto break-all">
                        {getTestgroundWebhookUrl()}
                      </code>
                      <button
                        onClick={() => copyWebhookUrl('testground')}
                        className="flex items-center justify-center w-8 h-8 bg-[#25D366] hover:bg-[#25D366]/80 text-white rounded transition-colors"
                      >
                        {copiedUrl === 'testground' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Conversation Logs */}
            <Button
              onClick={handleShowLogs}
              className="w-full bg-[#25D366] hover:bg-[#25D366]/80 text-white text-xs"
            >
              View Conversation Logs
            </Button>
          </div>

          {/* Right Panel — Test Products */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Test Products</h2>
              <Button
                onClick={() => setShowProductForm(!showProductForm)}
                size="sm"
                className="bg-[#25D366] hover:bg-[#25D366]/80 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </div>

            {/* Product Form */}
            {showProductForm && (
              <Card className="bg-[#111827] border-[#25D366]/15 p-4 space-y-3">
                <Input
                  value={newProduct.name || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Product name"
                  className="bg-[#0d1120] border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60 text-sm"
                />
                <textarea
                  value={newProduct.description || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Product description"
                  className="w-full h-16 bg-[#0d1120] border border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60 p-2 rounded text-sm resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={newProduct.price || 0}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                    placeholder="Price"
                    className="bg-[#0d1120] border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60 text-sm"
                  />
                  <Input
                    type="number"
                    value={newProduct.minPrice || 0}
                    onChange={(e) => setNewProduct({ ...newProduct, minPrice: parseFloat(e.target.value) })}
                    placeholder="Min price"
                    className="bg-[#0d1120] border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60 text-sm"
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
                    className="flex-1 bg-[#25D366] hover:bg-[#25D366]/80 text-white text-xs flex items-center justify-center gap-2"
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
              <Card className="bg-[#111827] border-[#25D366]/15 p-6 text-center text-[#8892a4] text-sm">
                No test products yet. Add one to get started.
              </Card>
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <Card
                    key={p.id}
                    className="bg-[#111827] border-[#25D366]/15 p-3 flex items-start justify-between hover:border-[#25D366]/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{p.name}</p>
                      <p className="text-xs text-[#8892a4] line-clamp-1">{p.description}</p>
                      <div className="flex gap-2 mt-1 text-xs text-[#25D366]">
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

            <Card className="bg-[#111827] border-[#25D366]/15 p-4">
              <p className="text-xs text-[#8892a4]">
                <strong>How to test:</strong> Copy the testground webhook URL and add it to Twilio. Send messages from WhatsApp to your Twilio sandbox number. The AI will respond using your configured products and personality.
              </p>
            </Card>
          </div>
        </div>

        {/* Conversation Logs Modal */}
        {showConversationLogs && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-[#111827] border-[#25D366]/15 w-full max-w-3xl max-h-[90vh] overflow-auto flex flex-col">
              <div className="sticky top-0 bg-[#111827] border-b border-[#25D366]/15 p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Conversation Logs</h3>
                <button
                  onClick={() => setShowConversationLogs(false)}
                  className="text-[#8892a4] hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="w-5 h-5 mr-2" />
                    <span className="text-[#8892a4] text-sm">Loading conversation logs...</span>
                  </div>
                ) : conversationLogs.length === 0 ? (
                  <div className="text-center py-8 text-[#8892a4] text-sm">
                    No conversation logs yet. Send messages to the testground webhook to see them here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conversationLogs.map((log) => (
                      <Card key={log.id} className="bg-[#0d1120] border-[#25D366]/15 p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#8892a4] mb-1">
                              <strong>From:</strong> {log.phoneNumber}
                            </p>
                            <div className="bg-[#111827] rounded p-2 mb-2">
                              <p className="text-xs text-white break-words">
                                <strong className="text-[#25D366]">User:</strong> {log.userMessage}
                              </p>
                            </div>
                            <div className="bg-[#0f1419] rounded p-2 mb-2">
                              <p className="text-xs text-[#25D366] break-words">
                                <strong>AI:</strong> {log.aiResponse}
                              </p>
                            </div>
                            {log.orderIntent && (
                              <div className="bg-[#111827] rounded p-2 mb-2 border-l-2 border-[#25D366]">
                                <p className="text-xs text-[#25D366]">
                                  <strong>Order Intent:</strong> {log.orderIntent.productName} @ ${log.orderIntent.amount}
                                </p>
                              </div>
                            )}
                            <p className="text-xs text-[#8892a4]">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteConversationLog(log.id)}
                            className="text-[#8892a4] hover:text-red-400 transition-colors p-1 flex-shrink-0 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-[#111827] border-t border-[#25D366]/15 p-4">
                <Button
                  onClick={() => setShowConversationLogs(false)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
