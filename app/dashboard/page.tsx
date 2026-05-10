'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getOrders, getConversations, getProducts } from '@/lib/firestore'
import type { Order, Conversation } from '@/lib/types'
import { MessageSquare, ShoppingCart, Package, TrendingUp, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  bg: string
}

function StatCard({ icon: Icon, label, value, color, bg }: StatCardProps) {
  return (
    <div className="bg-[#111827] border border-[#25D366]/15 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-[#8892a4] text-sm">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [productCount, setProductCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        // Pass businessId (which is user.uid) to all these functions
        const [o, c, p] = await Promise.all([
          getOrders(user.uid),
          getConversations(user.uid),
          getProducts(user.uid),
        ])
        setOrders(o)
        setConversations(c)
        setProductCount(p.length)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed').length
  const recentActivity = [
    ...orders.slice(0, 3).map((o) => ({
      id: o.id,
      type: 'order' as const,
      label: `New order for ${o.productName}`,
      sub: `from ${o.userId}`,
      time: o.createdAt,
    })),
    ...conversations.slice(0, 3).map((c) => ({
      id: c.id,
      type: 'conversation' as const,
      label: `Conversation with ${c.userId}`,
      sub: `state: ${c.state}`,
      time: c.lastActiveAt,
    })),
  ]
    .sort((a, b) => b.time - a.time)
    .slice(0, 6)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-[#8892a4] text-sm mt-1">Your AVA sales agent at a glance</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#111827] border border-[#25D366]/15 rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={MessageSquare}
            label="Total Conversations"
            value={conversations.length}
            color="text-[#25D366]"
            bg="bg-[#25D366]/10"
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Orders"
            value={orders.length}
            color="text-[#00D1B2]"
            bg="bg-[#00D1B2]/10"
          />
          <StatCard
            icon={Clock}
            label="Pending Orders"
            value={pendingOrders}
            color="text-yellow-400"
            bg="bg-yellow-400/10"
          />
          <StatCard
            icon={Package}
            label="Products Listed"
            value={productCount}
            color="text-[#00a884]"
            bg="bg-[#00a884]/10"
          />
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-8 bg-[#111827] border border-[#25D366]/15 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#25D366]/15">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#25D366]" />
            Recent Activity
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#1a2235] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-[#8892a4] mx-auto mb-3 opacity-40" />
            <p className="text-[#8892a4] text-sm">No activity yet. Connect WhatsApp to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#25D366]/10">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#1a2235]/50 transition-colors">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === 'order' ? 'bg-[#00D1B2]/10' : 'bg-[#25D366]/10'
                  }`}
                >
                  {item.type === 'order' ? (
                    <ShoppingCart className="w-4 h-4 text-[#00D1B2]" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#f0f4ff] text-sm font-medium truncate">{item.label}</p>
                  <p className="text-[#8892a4] text-xs mt-0.5">{item.sub}</p>
                </div>
                <p className="text-[#8892a4] text-xs shrink-0">
                  {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
