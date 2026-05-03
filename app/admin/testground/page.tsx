'use client'

import { useState, useEffect, useRef } from 'react'
import { runAI } from '@/lib/ai'
import type { Product, Message, ConversationState } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Send, Plus, Trash2, Settings2 } from 'lucide-react'

const DEFAULT_BUSINESS = {
  name: 'Test Store',
  aiPersonality: 'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision. Be concise, warm, and human.',
}

interface TestMessage extends Message {
  role: 'user' | 'assistant'
}

interface TestProduct extends Omit<Product, 'businessId' | 'createdAt'> {
  id: string
}

export default function TestgroundPage() {
  const [products, setProducts] = useState<TestProduct[]>([
    {
      id: '1',
      name: 'Premium Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 199,
      minPrice: 150,
      negotiationEnabled: true,
      imageUrl: undefined,
    },
  ])

  const [business, setBusiness] = useState(DEFAULT_BUSINESS)
  const [conversationHistory, setConversationHistory] = useState<TestMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [aiProcessing, setAiProcessing] = useState(false)
  const [conversationState, setConversationState] = useState<ConversationState>('browsing')
  const [showProductForm, setShowProductForm] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<TestProduct>>({
    name: '',
    description: '',
    price: 0,
    minPrice: 0,
    negotiationEnabled: false,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversationHistory])

  async function handleSendMessage() {
    if (!messageInput.trim()) return

    const userMessage = messageInput.trim()
    setMessageInput('')

    // Add user message to history
    const updatedHistory: TestMessage[] = [
      ...conversationHistory,
      { role: 'user', text: userMessage, timestamp: Date.now() },
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
      })

      // Add assistant message
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', text: aiOutput.reply, timestamp: Date.now() },
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

  function addTestProduct() {
    if (!newProduct.name || !newProduct.description || newProduct.price === undefined) {
      toast.error('Fill in all fields')
      return
    }
    const product: TestProduct = {
      id: Math.random().toString(36).substr(2, 9),
      ...newProduct,
      price: newProduct.price ?? 0,
      minPrice: newProduct.minPrice ?? newProduct.price ?? 0,
    }
    setProducts([...products, product])
    setNewProduct({ name: '', description: '', price: 0, minPrice: 0, negotiationEnabled: false })
    setShowProductForm(false)
    toast.success('Test product added')
  }

  function deleteProduct(id: string) {
    setProducts(products.filter((p) => p.id !== id))
    toast.success('Product removed')
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
                  {msg.text}
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
