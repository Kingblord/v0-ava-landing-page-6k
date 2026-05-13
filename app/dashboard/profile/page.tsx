'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { updateBusiness } from '@/lib/firebase-auth'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User, Edit2, Check, X, ArrowLeft, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

type EditMode = 'view' | 'editing'

export default function ProfilePage() {
  const { user, business } = useAuth()

  const [mode, setMode] = useState<EditMode>('view')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!business) return
    setName(business.name ?? '')
    setAvatar(business.avatarUrl ?? '')
    setEmail(business.email ?? user?.email ?? '')
  }, [business, user])

  async function handleSave() {
    if (!user) return
    if (!name.trim()) {
      toast.error('Business name cannot be empty.')
      return
    }
    if (!email.trim()) {
      toast.error('Email cannot be empty.')
      return
    }

    setSaving(true)
    try {
      console.log('[v0] Saving profile changes:', { name, email, avatar })
      await updateBusiness(user.uid, {
        name: name.trim(),
        email: email.trim(),
        avatarUrl: avatar,
      })
      console.log('[v0] Profile saved successfully')
      toast.success('Profile updated.')
      setMode('view')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[v0] Error saving profile:', errorMsg)
      toast.error(`Failed to save: ${errorMsg}`)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (!business) return
    setName(business.name ?? '')
    setAvatar(business.avatarUrl ?? '')
    setEmail(business.email ?? user?.email ?? '')
    setMode('view')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage your business profile</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4 lg:p-8">
        {mode === 'view' ? (
          // View Mode
          <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-2xl bg-secondary border border-border overflow-hidden mb-4">
                  {avatar ? (
                    <Image src={avatar} alt="Avatar" fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-foreground text-center">{name}</h2>
                <p className="text-xs text-muted-foreground mt-1">Business Name</p>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="p-4 bg-secondary border border-border rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Email
                  </p>
                  <p className="text-sm text-foreground font-mono">{business?.email ?? user?.email}</p>
                </div>

                <div className="p-4 bg-secondary border border-border rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Account ID
                  </p>
                  <p className="text-sm text-foreground font-mono">{user?.uid}</p>
                </div>

                <div className="p-4 bg-secondary border border-border rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Member Since
                  </p>
                  <p className="text-sm text-foreground">
                    {business?.createdAt ? new Date(business.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setMode('editing')}
                  className="flex-1 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-white rounded-xl font-semibold gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
              className="space-y-6"
            >
              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-2xl bg-secondary border border-border overflow-hidden mb-4">
                  {avatar ? (
                    <Image src={avatar} alt="Avatar" fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>

                <ImageUpload
                  value={avatar}
                  onChange={setAvatar}
                  folder="avatars"
                  variant="square"
                  label="Change Avatar"
                />
                <p className="text-xs text-muted-foreground mt-2">Square image, min 256x256px</p>
              </div>

              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Business Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your business name"
                  required
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="business@example.com"
                  required
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 bg-secondary border border-border text-foreground hover:bg-secondary/80 rounded-xl font-semibold gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-white rounded-xl font-semibold gap-2"
                >
                  {saving ? 'Saving...' : <><Check className="w-4 h-4" /> Save Changes</>}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
