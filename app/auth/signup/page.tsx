'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signUp } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#6C5CE7]/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#00D1B2]/8 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="AVA" width={80} height={60} className="object-contain" />
        </div>

        <div className="bg-[#111827] border border-[#6C5CE7]/20 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1 text-center">Create your account</h1>
          <p className="text-[#8892a4] text-sm text-center mb-6">Start automating your sales with AVA</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business" className="text-[#f0f4ff] text-sm">Business Name</Label>
              <Input
                id="business"
                type="text"
                placeholder="Acme Store"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="bg-[#1a2235] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] focus:border-[#6C5CE7] focus:ring-[#6C5CE7]/30 h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[#f0f4ff] text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#1a2235] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] focus:border-[#6C5CE7] focus:ring-[#6C5CE7]/30 h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-[#f0f4ff] text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#1a2235] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] focus:border-[#6C5CE7] focus:ring-[#6C5CE7]/30 h-11"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 bg-[#6C5CE7] hover:bg-[#5548c7] text-white font-semibold rounded-xl mt-1 transition-all duration-200 glow-purple"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-[#8892a4] mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#6C5CE7] hover:text-[#8b7cf0] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
