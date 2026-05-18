'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Sun, Moon, Eye, EyeOff, ChevronRight, Info } from 'lucide-react'
import { signIn, signInWithGoogle, sendReset, firebaseErrorMessage } from '@/lib/firebase-auth'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type View = 'login' | 'reset' | 'google-guide'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()

  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard')
  }, [user, authLoading, router])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err) {
      toast.error(firebaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push('/dashboard')
    } catch (err) {
      toast.error(firebaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail.trim()) { toast.error('Enter your email address.'); return }
    setLoading(true)
    try {
      await sendReset(resetEmail.trim())
      setResetSent(true)
    } catch (err) {
      toast.error(firebaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--aro-green)]/8 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--aro-teal)]/6 blur-[120px]" />
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
        className="fixed top-4 right-4 p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <Image src="/aromsg-logo.png" alt="AroMsg" width={64} height={64} className="object-contain" />
          <span className="font-bold text-2xl">
            <span className="text-[var(--aro-green)]">Aro</span>
            <span className="text-foreground">Msg</span>
          </span>
        </div>

        {/* ── Login View ── */}
        {view === 'login' && (
          <div className="bg-card border border-border rounded-2xl p-7 shadow-2xl">
            <h1 className="text-xl font-bold text-foreground mb-1 text-center">Welcome back</h1>
            <p className="text-muted-foreground text-sm text-center mb-6">Sign in to your AroMsg dashboard</p>

            {/* Google sign-in */}
            <Button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              variant="outline"
              className="w-full h-11 rounded-xl border-border bg-secondary text-foreground font-semibold mb-4 flex items-center gap-3"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setView('google-guide') }}
                className="ml-auto p-0.5 rounded hover:bg-border/50 transition-colors"
                aria-label="Google sign-in setup guide"
              >
                
              </button>
            </Button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or continue with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-foreground text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-11 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground text-sm font-medium">Password</Label>
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); setView('reset') }}
                    className="text-xs text-[var(--aro-green)] hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-11 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] font-semibold rounded-xl mt-1"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              {"Don't have an account? "}
              <Link href="/auth/signup" className="text-[var(--aro-green)] hover:underline font-medium">
                Create one
              </Link>
            </p>
          </div>
        )}

        {/* ── Forgot Password View ── */}
        {view === 'reset' && (
          <div className="bg-card border border-border rounded-2xl p-7 shadow-2xl">
            <button
              onClick={() => { setView('login'); setResetSent(false) }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
            >
              <ChevronRight className="w-3 h-3 rotate-180" />
              Back to sign in
            </button>

            {resetSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[var(--aro-green)]/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-[var(--aro-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">Check your email</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A password reset link was sent to{' '}
                  <span className="font-medium text-foreground">{resetEmail}</span>.
                  Check your inbox and spam folder.
                </p>
                <button
                  onClick={() => { setView('login'); setResetSent(false) }}
                  className="mt-5 text-sm text-[var(--aro-green)] hover:underline font-medium"
                >
                  Return to sign in
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-foreground mb-1">Reset password</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Enter your account email and we&apos;ll send you a reset link.
                </p>
                <form onSubmit={handleReset} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reset-email" className="text-foreground text-sm font-medium">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@business.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-11 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] font-semibold rounded-xl"
                  >
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </Button>
                </form>
              </>
            )}
          </div>
        )}

        {/* ── Google Setup Guide ── */}
        {view === 'google-guide' && (
          <div className="bg-card border border-border rounded-2xl p-7 shadow-2xl">
            <button
              onClick={() => setView('login')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
            >
              <ChevronRight className="w-3 h-3 rotate-180" />
              Back
            </button>

            <h2 className="text-lg font-bold text-foreground mb-1">Enable Google Sign-In</h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Follow these steps in your Firebase Console to activate Google authentication.
            </p>

            <ol className="space-y-4">
              {[
                {
                  step: '1',
                  title: 'Open Firebase Console',
                  detail: 'Go to console.firebase.google.com and select your AroMsg project.',
                },
                {
                  step: '2',
                  title: 'Navigate to Authentication',
                  detail: 'In the left sidebar, click Build → Authentication → Sign-in method.',
                },
                {
                  step: '3',
                  title: 'Enable Google provider',
                  detail: 'Click Google in the provider list, toggle it on, enter your support email, then click Save.',
                },
                {
                  step: '4',
                  title: 'Add your domain',
                  detail: 'In Authentication → Settings → Authorized domains, add your Vercel deployment URL (e.g. yourapp.vercel.app).',
                },
                {
                  step: '5',
                  title: 'Done',
                  detail: 'Return here and click "Continue with Google". No code changes are needed.',
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--aro-green)]/10 text-[var(--aro-green)] text-xs font-bold flex items-center justify-center mt-0.5">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'mt-6 flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-semibold',
                'bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] transition-colors',
              )}
            >
              Open Firebase Console
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
