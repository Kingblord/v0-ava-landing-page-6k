'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import type { Order, Product } from '@/lib/types'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import {
  MessageSquare,
  ShoppingCart,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Zap,
  ChevronRight,
  DollarSign,
} from 'lucide-react'
import { formatDistanceToNow, format, subDays, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildDayBuckets(items: { createdAt: number }[], days = 7) {
  const buckets: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const key = format(subDays(new Date(), i), 'MMM d')
    buckets[key] = 0
  }
  items.forEach((item) => {
    const key = format(startOfDay(new Date(item.createdAt)), 'MMM d')
    if (key in buckets) buckets[key]++
  })
  return Object.entries(buckets).map(([date, count]) => ({ date, count }))
}

function buildRevenueBuckets(orders: Order[], days = 7) {
  const buckets: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const key = format(subDays(new Date(), i), 'MMM d')
    buckets[key] = 0
  }
  orders.forEach((o) => {
    const key = format(startOfDay(new Date(o.createdAt)), 'MMM d')
    if (key in buckets) buckets[key] += o.amount
  })
  return Object.entries(buckets).map(([date, revenue]) => ({ date, revenue }))
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  trend?: number
  iconColor: string
  iconBg: string
  href?: string
}

function KpiCard({ label, value, sub, icon: Icon, trend, iconColor, iconBg, href }: KpiCardProps) {
  const inner = (
    <div className="relative bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-[var(--aro-green)]/30 transition-all duration-200 group overflow-hidden">
      {/* subtle glow accent */}
      <div className={cn('absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20', iconBg)} />
      <div className="flex items-start justify-between relative">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
              trend >= 0
                ? 'bg-[var(--aro-green)]/10 text-[var(--aro-green)]'
                : 'bg-destructive/10 text-destructive',
            )}
          >
            <ArrowUpRight className={cn('w-3 h-3', trend < 0 && 'rotate-180')} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="relative">
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        <p className="text-xs text-muted-foreground mt-2 font-medium">{label}</p>
      </div>
      {href && (
        <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      )}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

interface MiniChartProps {
  data: { date: string; count: number }[]
  color: string
}

function MiniAreaChart({ data, color }: MiniChartProps) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-foreground font-bold mt-0.5">{payload[0].value}</p>
    </div>
  )
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-foreground font-bold mt-0.5">${payload[0].value.toFixed(2)}</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { user, business } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        console.log('[v0] Loading dashboard data for:', user.uid)
        const [ordersRes, productsRes] = await Promise.all([
          fetch(`/api/orders?userId=${user.uid}`),
          fetch(`/api/products?userId=${user.uid}`),
        ])
        
        if (ordersRes.ok) {
          const oData = await ordersRes.json()
          setOrders(oData.orders || [])
        }
        if (productsRes.ok) {
          const pData = await productsRes.json()
          setProducts(pData.products || [])
        }
      } catch (err) {
        console.error('[v0] Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status === 'confirmed').reduce((s, o) => s + o.amount, 0),
    [orders],
  )
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length
  const conversionRate =
    orders.length > 0 ? Math.round((confirmedCount / orders.length) * 100) : 0

  const orderBuckets = useMemo(() => buildDayBuckets(orders), [orders])
  const revenueBuckets = useMemo(() => buildRevenueBuckets(orders.filter((o) => o.status === 'confirmed')), [orders])

  const statusBreakdown = [
    { name: 'Confirmed', value: confirmedCount, color: 'var(--aro-green)' },
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    { name: 'Cancelled', value: orders.filter((o) => o.status === 'cancelled').length, color: '#ef4444' },
  ]

  const recentActivity = orders.slice(0, 6).map((o) => ({
    id: o.id,
    type: 'order' as const,
    label: `New order — ${o.productName}`,
    sub: o.userId,
    time: o.createdAt,
    amount: o.amount,
    status: o.status,
  }))
    .sort((a, b) => b.time - a.time)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const businessName = business?.name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-full bg-background">
      {/* ── Hero header ── */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{greeting},</p>
            <h1 className="text-xl font-bold text-foreground mt-0.5">{businessName || 'Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-[var(--aro-green)]/10 border border-[var(--aro-green)]/20 rounded-xl px-3 py-1.5 shrink-0">
            <Zap className="w-3 h-3 text-[var(--aro-green)]" />
            <span className="text-[var(--aro-green)] text-xs font-semibold">Arobi Active</span>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 space-y-6 pb-6">

        {/* ── KPI grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Revenue (confirmed)"
              value={`$${totalRevenue.toFixed(0)}`}
              sub={`${confirmedCount} orders confirmed`}
              icon={DollarSign}
              iconColor="text-[var(--aro-green)]"
              iconBg="bg-[var(--aro-green)]/10"
              href="/dashboard/orders"
            />
            <KpiCard
              label="Total Products"
              value={products.length}
              sub="Available for sale"
              icon={Package}
              iconColor="text-[var(--aro-teal)]"
              iconBg="bg-[var(--aro-teal)]/10"
              href="/dashboard/products"
            />
            <KpiCard
              label="Pending Orders"
              value={pendingCount}
              sub="Awaiting action"
              icon={Clock}
              iconColor="text-amber-500"
              iconBg="bg-amber-500/10"
              href="/dashboard/orders"
            />
            <KpiCard
              label="Conversion Rate"
              value={`${conversionRate}%`}
              sub={`${products.length} products listed`}
              icon={TrendingUp}
              iconColor="text-[var(--aro-green-light)]"
              iconBg="bg-[var(--aro-green-light)]/10"
            />
          </div>
        )}

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Revenue area chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Revenue (7d)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Confirmed orders only</p>
              </div>
              <span className="text-xs font-semibold text-[var(--aro-green)] bg-[var(--aro-green)]/10 px-2.5 py-1 rounded-lg">
                ${totalRevenue.toFixed(0)}
              </span>
            </div>
            {loading ? (
              <div className="h-32 bg-secondary rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={revenueBuckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--aro-green)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--aro-green)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--aro-green)"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--aro-green)', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Order status breakdown bar chart */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-foreground">Order Status</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{orders.length} total orders</p>
            </div>
            {loading ? (
              <div className="h-32 bg-secondary rounded-xl animate-pulse" />
            ) : orders.length === 0 ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={90}>
                  <BarChart data={statusBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={24}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {statusBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-3 mt-3">
                  {statusBreakdown.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-[10px] text-muted-foreground truncate">{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Sparkline row ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">Orders / 7d</span>
              <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">{orders.length}</p>
            {loading ? <div className="h-14 bg-secondary rounded-lg animate-pulse mt-2" /> : <MiniAreaChart data={orderBuckets} color="var(--aro-teal)" />}
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">Products Listed</span>
              <Package className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">{products.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Ready for sale</p>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/whatsapp', label: 'Connect WhatsApp', icon: MessageSquare, color: 'text-[var(--aro-green)]', bg: 'bg-[var(--aro-green)]/10' },
            { href: '/dashboard/products', label: 'Add Product', icon: Package, color: 'text-[var(--aro-teal)]', bg: 'bg-[var(--aro-teal)]/10' },
            { href: '/dashboard/orders', label: 'View Orders', icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { href: '/dashboard/settings', label: 'Settings', icon: Zap, color: 'text-[var(--aro-green-light)]', bg: 'bg-[var(--aro-green-light)]/10' },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-2.5 p-4 bg-card border border-border rounded-2xl hover:border-[var(--aro-green)]/30 transition-all duration-150 group"
            >
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', a.bg)}>
                <a.icon className={cn('w-4 h-4', a.color)} />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-snug">
                {a.label}
              </span>
            </Link>
          ))}
        </div>

        {/* ── Recent activity ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--aro-green)]" />
              Recent Activity
            </h2>
            <Link
              href="/dashboard/orders"
              className="text-xs text-muted-foreground hover:text-[var(--aro-green)] transition-colors flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                <Zap className="w-5 h-5 text-muted-foreground/40" />
              </div>
              <p className="text-foreground text-sm font-medium">No activity yet</p>
              <p className="text-muted-foreground text-xs mt-1">
                Connect WhatsApp to start receiving messages
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentActivity.map((item) => {
                const statusMap: Record<string, { icon: React.ElementType; cls: string }> = {
                  pending: { icon: Clock, cls: 'text-amber-500' },
                  confirmed: { icon: CheckCircle, cls: 'text-[var(--aro-green)]' },
                  cancelled: { icon: XCircle, cls: 'text-destructive' },
                }
                const statusInfo = statusMap[item.status as string]
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[var(--aro-teal)]/10">
                      <ShoppingCart className="w-3.5 h-3.5 text-[var(--aro-teal)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">{item.label}</p>
                      <p className="text-muted-foreground text-xs truncate font-mono">{item.sub}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {item.amount !== undefined && (
                        <span className="text-xs font-semibold text-[var(--aro-green)]">
                          ${item.amount.toFixed(2)}
                        </span>
                      )}
                      {statusInfo && (
                        <statusInfo.icon className={cn('w-3.5 h-3.5', statusInfo.cls)} />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}
