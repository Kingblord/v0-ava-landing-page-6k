'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { updateBusiness, logOut } from '@/lib/firebase-auth'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  User,
  Edit2,
  Check,
  X,
  Camera,
  Mail,
  Calendar,
  Hash,
  MessageSquare,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  BadgeCheck,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'

type EditMode = 'view' | 'editing'

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex-1 bg-secondary/60 border border-border rounded-2xl p-4 flex flex-col gap-1.5 min-w-0">
      <div className="w-7 h-7 rounded-lg bg-[var(--aro-green)]/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-[var(--aro-green)]" />
      </div>
      <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate">{value}</p>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, mono = false }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className={cn('text-sm text-foreground break-all', mono && 'font-mono text-xs')}>{value || '—'}</p>
      </div>
    </div>
  )
}

function QuickLinkRow({ icon: Icon, label, href, destructive = false, onClick }: {
  icon: React.ElementType
  label: string
  href?: string
  destructive?: boolean
  onClick?: () => void
}) {
  const cls = cn(
    'flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-border transition-all duration-150',
    destructive
      ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10'
      : 'bg-card hover:bg-secondary',
  )
  const inner = (
    <>
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', destructive ? 'bg-destructive/10' : 'bg-secondary')}>
        <Icon className={cn('w-4 h-4', destructive ? 'text-destructive' : 'text-muted-foreground')} />
      </div>
      <span className={cn('flex-1 text-sm font-medium', destructive ? 'text-destructive' : 'text-foreground')}>{label}</span>
      {!destructive && <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
    </>
  )
  if (href) return <Link href={href} className={cls}>{inner}</Link>
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>
}

export default function ProfilePage() {
  const { user, business, refreshBusiness } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<EditMode>('view')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    if (!business) return
    setName(business.name ?? '')
    setAvatar(business.avatarUrl ?? '')
  }, [business])

  async function handleSave() {
    if (!user) return
    if (!name.trim()) {
      toast.error('Business name cannot be empty.')
      return
    }
    setSaving(true)
    try {
      await updateBusiness(user.uid, { name: name.trim(), avatarUrl: avatar })
      await refreshBusiness()
      toast.success('Profile updated.')
      setMode('view')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setName(business?.name ?? '')
    setAvatar(business?.avatarUrl ?? '')
    setMode('view')
  }

  async function handleLogout() {
    await logOut()
    router.push('/auth/login')
  }

  const memberSince = business?.createdAt
    ? new Date(business.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'

  const shortId = user?.uid ? user.uid.slice(0, 12) + '...' : '—'

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your business identity and account details</p>
      </div>

      <div className="max-w-xl mx-auto px-4 pb-10 lg:px-8 space-y-4">

        {/* ── Hero Card ── */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-br from-[var(--aro-green)]/20 via-[var(--aro-green)]/8 to-transparent relative">
            <div className="absolute bottom-0 right-4 opacity-10">
              <Zap className="w-20 h-20 text-[var(--aro-green)]" />
            </div>
          </div>

          {/* Avatar + name */}
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative w-20 h-20 rounded-2xl bg-card border-4 border-card overflow-hidden shadow-lg">
                {avatar ? (
                  <Image src={avatar} alt={name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {mode === 'view' ? (
                <Button
                  onClick={() => setMode('editing')}
                  size="sm"
                  className="h-8 px-4 rounded-xl bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] font-semibold text-xs gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    size="sm"
                    className="h-8 px-3 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                    className="h-8 px-4 rounded-xl bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] font-semibold text-xs gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            {mode === 'view' ? (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{name || 'Your Business'}</h2>
                  <BadgeCheck className="w-4 h-4 text-[var(--aro-green)] shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{business?.email ?? user?.email ?? ''}</p>
              </div>
            ) : (
              /* Edit mode inline */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your business name"
                    required
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Logo</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl bg-secondary border border-border overflow-hidden shrink-0">
                      {avatar ? (
                        <Image src={avatar} alt="Avatar" fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <ImageUpload value={avatar} onChange={setAvatar} folder="avatars" variant="square" label="Upload logo" />
                  </div>
                  <p className="text-xs text-muted-foreground">Square image, min 256x256px</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="flex gap-3">
          <StatCard icon={MessageSquare} label="WhatsApp" value={business?.whatsappConnected ? 'Connected' : 'Not linked'} />
          <StatCard icon={Calendar} label="Member since" value={memberSince} />
        </div>

        {/* ── Account Info ── */}
        <div className="bg-card border border-border rounded-3xl px-5 py-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-4 pb-2">Account Details</p>
          <InfoRow icon={Mail} label="Email" value={business?.email ?? user?.email ?? ''} />
          <InfoRow icon={Hash} label="Account ID" value={shortId} mono />
          <InfoRow icon={Calendar} label="Joined" value={memberSince} />
          <InfoRow
            icon={MessageSquare}
            label="WhatsApp"
            value={business?.whatsappPhone ? `+${business.whatsappPhone.replace(/^\+/, '')}` : 'Not linked'}
          />
        </div>

        {/* ── Quick Links ── */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1 pb-1">Quick Actions</p>
          <QuickLinkRow icon={Settings} label="Settings" href="/dashboard/settings" />
        </div>

        {/* ── Logout (mobile only) ── */}
        <div className="lg:hidden pt-2">
          <QuickLinkRow icon={LogOut} label="Sign Out" destructive onClick={handleLogout} />
        </div>

      </div>
    </div>
  )
}
