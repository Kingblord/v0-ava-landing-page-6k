'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { signUp } from '@/lib/firebase-auth'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard')
    }
  }, [user, authLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password, businessName)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed.'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*?\)\.?/, '').trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--aro-green)]/8 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--aro-teal)]/6 blur-[120px]" />
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
        className="fixed top-4 right-4 p-2.5 rounded-xl bg-card border border-[var(--aro-border)] text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <Image src="/aromsg-logo.png" alt="AroMsg" width={72} height={72} className="object-contain" />
          <span className="font-bold text-2xl">
            <span className="text-[var(--aro-green)]">Aro</span>
            <span className="text-foreground">Msg</span>
          </span>
        </div>

        <div className="bg-card border border-[var(--aro-border)] rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-foreground mb-1 text-center">Create your account</h1>
          <p className="text-muted-foreground text-sm text-center mb-6">Start automating your sales with Arobi</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business" className="text-foreground text-sm">Business Name</Label>
              <Input
                id="business"
                type="text"
                placeholder="Acme Store"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="bg-[var(--aro-surface-2)] border-[var(--aro-border)] text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)] focus:ring-[var(--aro-green)]/30 h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[var(--aro-surface-2)] border-[var(--aro-border)] text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)] focus:ring-[var(--aro-green)]/30 h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[var(--aro-surface-2)] border-[var(--aro-border)] text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)] focus:ring-[var(--aro-green)]/30 h-11"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] font-semibold rounded-xl mt-1 transition-all duration-200 glow-green"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[var(--aro-green)] hover:text-[var(--aro-green-light)] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
