'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)'}}>
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            We sent a magic link to<br />
            <span className="font-semibold text-gray-900">{email}</span>
          </p>
          <p className="text-xs text-gray-400 mt-4">Click the link to sign in — no password needed</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)'}}>
      {/* Left side */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-xl">💇</span>
            </div>
            <span className="text-white text-2xl font-bold">SalonPing</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-6">
            Stop losing money to no-shows
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-8">
            Automatic SMS reminders sent 48h, 24h, and 2h before every appointment. Set up in 5 minutes.
          </p>
          <div className="space-y-4">
            {[
              { icon: '✓', text: 'Automatic SMS to every client' },
              { icon: '✓', text: 'Deposit collection to reduce ghosting' },
              { icon: '✓', text: 'One-tap reschedule for clients' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{item.icon}</span>
                </div>
                <span className="text-blue-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">💇</span>
            <span className="text-xl font-bold text-gray-900">SalonPing</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-xl px-4 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              style={{background: 'linear-gradient(135deg, #1e3a5f, #2563eb)'}}
            >
              {loading ? 'Sending...' : 'Send magic link →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            No password needed. We'll email you a secure sign-in link.
          </p>
        </div>
      </div>
    </div>
  )
}