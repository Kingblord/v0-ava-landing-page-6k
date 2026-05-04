'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { runAI } from '@/lib/ai'
import { getTestgroundProducts, createTestgroundProduct, deleteTestgroundProduct, saveTestgroundConfig } from '@/lib/firestore'
import { getMainWebhookUrl, getTestgroundWebhookUrl } from '@/lib/webhook-utils'
import type { Product, Message, ConversationState } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Send, Plus, Trash2, Settings2, Copy, Check } from 'lucide-react'

const DEFAULT_BUSINESS = {
  name: 'Test Store',
  aiPersonality: 'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision. Be concise, warm, and human.',
}

const AI_MODELS = [
  { id: 'openrouter/free', label: 'GPT-4o Mini (Fast)' },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'GPT-4 Turbo (Powerful)' },
  { id: 'openai/gpt-oss-120b:free', label: 'Claude Opus 4.6' },
]

interface TestProduct extends Omit<Product, 'businessId' | 'createdAt'> {
  id: string
}

export default function TestgroundPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [business, setBusiness] = useState(DEFAULT_BUSINESS)
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [aiProcessing, setAiProcessing] = useState(false)
  const [conversationState, setConversationState] = useState<ConversationState>('browsing')
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showWebhookUrls, setShowWebhookUrls] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<'main' | 'testground' | null>(null)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    minPrice: 0,
    negotiationEnabled: false,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
  // This ensures the webhook can load the latest products and AI settings
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  useEffect(() => {
    scrollToBottom()
  }, [conversationHistory])

  async function handleSendMessage() {
    if (!messageInput.trim()) return

    const userMessage = messageInput.trim()
    setMessageInput('')

    // Add user message to history
    const updatedHistory: Message[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage, timestamp: Date.now() },
    ]
    setConversationHistory(updatedHistory)

    // Process through AI
    setAiProcessing(true)
    try {
      const aiOutput = await runAI({
        message: userMessage,
        products,
        conversationHistory: updatedHistory.slice(0, -1),
        conversationState,
        businessConfig: business,
        model: selectedModel,
      })

      // Add assistant message
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: aiOutput.reply, timestamp: Date.now() },
      ])

      // Update state
      setConversationState(aiOutput.newState)

      // Show order intent if detected
      if (aiOutput.orderIntent) {
        toast.success(
          `Order detected: ${aiOutput.orderIntent.productName} for $${aiOutput.orderIntent.amount}`,
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process message'
      toast.error(msg)
    } finally {
      setAiProcessing(false)
    }
  }

  async function addTestProduct() {
    if (!user) return
    if (!newProduct.name || !newProduct.description || newProduct.price === undefined) {
      toast.error('Fill in all fields')
      return
    }
    try {
      const created = await createTestgroundProduct(user.uid, {
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        minPrice: newProduct.minPrice ?? newProduct.price,
        negotiationEnabled: newProduct.negotiationEnabled ?? false,
      })
      setProducts([...products, created])
      setNewProduct({ name: '', description: '', price: 0, minPrice: 0, negotiationEnabled: false })
      setShowProductForm(false)
      toast.success('Test product added')
    } catch (err) {
      console.error('[testground] Failed to add product:', err)
      toast.error('Failed to add product')
    }
  }

  async function deleteProduct(id: string) {
    if (!user) return
    try {
      await deleteTestgroundProduct(user.uid, id)
      setProducts(products.filter((p) => p.id !== id))
      toast.success('Product removed')
    } catch (err) {
      console.error('[testground] Failed to delete product:', err)
      toast.error('Failed to delete product')
    }
  }

  function resetConversation() {
    setConversationHistory([])
    setConversationState('browsing')
    toast.success('Conversation reset')
  }

  return (
    <div className="flex gap-6 p-8 max-w-7xl mx-auto">
      {/* Left: Config Panel */}
      <div className="w-80 flex flex-col gap-6">
        {/* Business Settings */}
        <Card className="bg-[#111827] border-[#6C5CE7]/15 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-[#6C5CE7]" />
            <h3 className="text-white font-semibold text-sm">AI Configuration</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[#8892a4] text-xs font-medium">Business Name</label>
              <Input
                value={business.name}
                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                className="mt-1 bg-[#0d1120] border-[#6C5CE7]/20 text-white text-sm"
              />
            </div>

            <div>
              <label className="text-[#8892a4] text-xs font-medium">AI Personality</label>
              <textarea
                value={business.aiPersonality}
                onChange={(e) => setBusiness({ ...business, aiPersonality: e.target.value })}
                className="mt-1 w-full h-24 bg-[#0d1120] border border-[#6C5CE7]/20 text-white text-xs p-2 rounded-lg focus:border-[#6C5CE7]/60 focus:outline-none resize-none"
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

            <div>
              <label className="text-[#8892a4] text-xs font-medium">Conversation State</label>
              <select
                value={conversationState}
                onChange={(e) => setConversationState(e.target.value as ConversationState)}
                className="mt-1 w-full bg-[#0d1120] border border-[#6C5CE7]/20 text-white text-xs p-2 rounded-lg focus:border-[#6C5CE7]/60 focus:outline-none"
              >
                <option value="browsing">browsing</option>
                <option value="interested">interested</option>
                <option value="ordering">ordering</option>
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
                    {copiedUrl === 'main' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
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
                    {copiedUrl === 'testground' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Test Products */}
        <Card className="bg-[#111827] border-[#6C5CE7]/15 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Test Products ({products.length})</h3>
            <Button
              onClick={() => setShowProductForm(!showProductForm)}
              size="sm"
              className="h-7 px-2 bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {showProductForm && (
            <div className="space-y-2 mb-3 pb-3 border-b border-[#6C5CE7]/10">
              <Input
                placeholder="Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="h-7 text-xs bg-[#0d1120] border-[#6C5CE7]/20"
              />
              <Input
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="h-7 text-xs bg-[#0d1120] border-[#6C5CE7]/20"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                  className="h-7 text-xs bg-[#0d1120] border-[#6C5CE7]/20 flex-1"
                />
                <Input
                  type="number"
                  placeholder="Min Price"
                  value={newProduct.minPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, minPrice: parseFloat(e.target.value) })}
                  className="h-7 text-xs bg-[#0d1120] border-[#6C5CE7]/20 flex-1"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-[#8892a4]">
                <input
                  type="checkbox"
                  checked={newProduct.negotiationEnabled}
                  onChange={(e) => setNewProduct({ ...newProduct, negotiationEnabled: e.target.checked })}
                />
                Negotiable
              </label>
              <Button onClick={addTestProduct} size="sm" className="w-full h-7 text-xs">
                Add Product
              </Button>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {products.map((p) => (
              <div key={p.id} className="bg-[#0d1120] border border-[#6C5CE7]/15 p-2 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white text-xs font-medium">{p.name}</p>
                    <p className="text-[#8892a4] text-xs">${p.price}</p>
                    {p.negotiationEnabled && (
                      <p className="text-[#6C5CE7] text-xs">min: ${p.minPrice}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="text-[#8892a4] hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Button
          onClick={resetConversation}
          variant="outline"
          className="w-full border-[#6C5CE7]/30 text-[#6C5CE7] hover:bg-[#6C5CE7]/10"
        >
          Reset Conversation
        </Button>
      </div>

      {/* Right: Chat Interface */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Chat Messages */}
        <Card className="flex-1 bg-[#111827] border-[#6C5CE7]/15 p-4 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {conversationHistory.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <p className="text-[#8892a4] text-center">
                  Send a message to start testing the AI. It will respond based on your configured
                  products and AI personality.
                </p>
              </div>
            )}
            {conversationHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#6C5CE7] text-white'
                      : 'bg-[#0d1120] text-[#f0f4ff] border border-[#6C5CE7]/15'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {aiProcessing && (
              <div className="flex justify-start">
                <div className="bg-[#0d1120] border border-[#6C5CE7]/15 rounded-2xl px-4 py-2 flex items-center gap-2">
                  <Spinner className="w-3 h-3 text-[#6C5CE7]" />
                  <span className="text-[#8892a4] text-sm">AI thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !aiProcessing) {
                  handleSendMessage()
                }
              }}
              placeholder="Message the AI..."
              className="flex-1 bg-[#0d1120] border-[#6C5CE7]/20 text-white"
              disabled={aiProcessing}
            />
            <Button
              onClick={handleSendMessage}
              disabled={aiProcessing || !messageInput.trim()}
              className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Info */}
        <div className="bg-[#111827] border border-[#6C5CE7]/15 p-3 rounded-xl text-xs text-[#8892a4]">
          <p>
            <strong>State:</strong> {conversationState} • <strong>Messages:</strong>{' '}
            {conversationHistory.length} • <strong>Products:</strong> {products.length}
          </p>
        </div>
      </div>
    </div>
  )
}
