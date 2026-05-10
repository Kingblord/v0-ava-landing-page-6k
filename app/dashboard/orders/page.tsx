'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getOrders, updateOrderStatus } from '@/lib/firestore'
import type { Order } from '@/lib/types'
import { ShoppingCart, Phone, Package, DollarSign, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    class: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    class: 'bg-[#00D1B2]/10 text-[#00D1B2] border-[#00D1B2]/20',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    class: 'bg-red-500/10 text-red-400 border-red-400/20',
  },
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | Order['status']>('all')

  async function reload() {
    if (!user) return
    // Pass businessId (which is the user.uid) to getOrders
    const o = await getOrders(user.uid)
    setOrders(o)
  }

  useEffect(() => {
    if (!user) return
    reload().finally(() => setLoading(false))
  }, [user])

  async function handleStatusChange(orderId: string, status: Order['status']) {
    setUpdating(orderId)
    try {
      await updateOrderStatus(orderId, status)
      toast.success(`Order marked as ${status}.`)
      await reload()
    } catch {
      toast.error('Failed to update order.')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-[#8892a4] text-sm mt-1">Manage orders placed through AVA</p>
        </div>
        <button
          onClick={() => reload()}
          className="text-[#8892a4] hover:text-white transition-colors p-2 rounded-lg hover:bg-[#1a2235]"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border',
              filter === f
                ? 'bg-[#25D366] text-white border-[#25D366]'
                : 'text-[#8892a4] border-[#25D366]/15 hover:text-white hover:bg-[#1a2235]',
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 bg-white/10 text-xs px-1.5 py-0.5 rounded-full">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#111827] border border-[#25D366]/15 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] border border-[#25D366]/15 rounded-2xl">
          <ShoppingCart className="w-12 h-12 text-[#8892a4] mx-auto mb-3 opacity-40" />
          <p className="text-[#f0f4ff] font-medium">No orders yet</p>
          <p className="text-[#8892a4] text-sm mt-1">Orders will appear here once customers start buying through AVA.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status]
            const StatusIcon = cfg.icon
            return (
              <div
                key={order.id}
                className="bg-[#111827] border border-[#25D366]/15 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-[#25D366]/30 transition-colors"
              >
                {/* Info */}
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#8892a4] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[#8892a4] text-xs">Customer</p>
                      <p className="text-white text-sm font-medium truncate">{order.userId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-[#8892a4] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[#8892a4] text-xs">Product</p>
                      <p className="text-white text-sm font-medium truncate">{order.productName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-[#00D1B2] shrink-0" />
                    <div>
                      <p className="text-[#8892a4] text-xs">Amount</p>
                      <p className="text-[#00D1B2] text-sm font-semibold">${order.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[#8892a4] text-xs">Placed</p>
                    <p className="text-white text-sm">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border', cfg.class)}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>

                  {order.status === 'pending' && (
                    <div className="flex gap-1.5">
                      <button
                        disabled={updating === order.id}
                        onClick={() => handleStatusChange(order.id, 'confirmed')}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-[#00D1B2]/10 text-[#00D1B2] border border-[#00D1B2]/20 hover:bg-[#00D1B2]/20 transition-colors disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        disabled={updating === order.id}
                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-400/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
