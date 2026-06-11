'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

const GOLD = '#c9a84c'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [useOtp, setUseOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [linkError, setLinkError] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const err = searchParams.get('error')
    if (err) setLinkError(err)
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    })
    setSent(true)
    setLoading(false)
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault()
    setVerifying(true)
    setOtpError('')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) {
      setOtpError('Incorrect code. Please check your email and try again.')
      setVerifying(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 20, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>📧</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{useOtp ? 'Enter your code' : 'Check your email'}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 20px' }}>
            {useOtp ? 'Enter the 6-digit code we sent to' : 'We sent a secure sign-in link to'}<br />
            <span style={{ color: GOLD, fontWeight: 600 }}>{email}</span>
          </p>
          {useOtp ? (
            // OTP code entry
            <form onSubmit={handleOtpVerify} style={{ marginTop: 20, textAlign: 'left' }}>
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                Open the email we sent to <strong style={{ color: '#c9a84c' }}>{email}</strong> and look for a <strong style={{ color: '#fff' }}>6-digit number</strong> (e.g. 482916). Enter it below.
                <br /><span style={{ color: 'rgba(255,255,255,0.35)' }}>The code expires in 60 minutes. Check your spam folder if you don&#39;t see it.</span>
              </div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>6-digit code from your email</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="login-input"
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 16px', fontSize: 22, color: '#fff', outline: 'none', textAlign: 'center', letterSpacing: 8, boxSizing: 'border-box' as const }}
              />
              {otpError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{otpError}</p>}
              <button type="submit" disabled={otp.length !== 6 || verifying}
                style={{ marginTop: 12, width: '100%', background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 800, fontSize: 14, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', opacity: otp.length !== 6 || verifying ? 0.5 : 1 }}>
                {verifying ? 'Verifying…' : 'Sign in →'}
              </button>
            </form>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 12, lineHeight: 1.7 }}>
              Click the link in the email to sign in. The link expires in <strong style={{ color: 'rgba(255,255,255,0.6)' }}>60 minutes</strong>.
              <br />The email comes from <strong style={{ color: GOLD }}>no-reply@mail.app.supabase.io</strong> — this is safe and expected.
            </p>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!useOtp && (
              <button onClick={() => setUseOtp(true)} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, color: GOLD, fontSize: 12, fontWeight: 600, padding: '7px 14px', cursor: 'pointer' }}>
                Enter 6-digit code instead →
              </button>
            )}
            {useOtp && (
              <button onClick={() => { setUseOtp(false); setOtp(''); setOtpError('') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '7px 14px', cursor: 'pointer' }}>
                Use magic link instead
              </button>
            )}
            <button onClick={() => { setSent(false); setUseOtp(false); setOtp('') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.35)', fontSize: 12, padding: '7px 14px', cursor: 'pointer' }}>← Different email</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <style>{`
        @media(min-width:900px){ .login-left{ display:flex !important; } .login-mobile-logo{ display:none !important; } }
        .login-input:focus { border-color: rgba(201,168,76,0.5) !important; }
      `}</style>

      {/* Left panel — branding */}
      <div className="login-left" style={{ flex: 1, display: 'none', background: 'linear-gradient(160deg,#0a0a0a 0%,#1a1200 100%)', borderRight: '1px solid rgba(201,168,76,0.15)', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✄</div>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#fff' }}>SalonPing</span>
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1.2, margin: '0 0 16px', letterSpacing: '-1px' }}>
          Stop losing money<br />to <span style={{ color: GOLD }}>no-shows</span>
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 36px' }}>
          Automatic SMS & WhatsApp reminders 48h, 24h, and 2h before every appointment. Set up in 5 minutes.
        </p>
        {['Automatic reminders to every client', 'Deposit collection to reduce ghosting', 'Online booking page — 24/7', 'Built-in client database & analytics'].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>✓</span>
            </div>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="login-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✄</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>SalonPing</span>
          </div>

          {linkError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>
              ⚠ {linkError}
            </div>
          )}
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Welcome 👋</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px' }}>
            Sign in or create your free account — no password needed.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="login-input"
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '13px 16px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 800, fontSize: 14, padding: '13px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending magic link…' : 'Send magic link →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 20, lineHeight: 1.6 }}>
            No password needed — we email you a secure sign-in link.<br />
            New here? Just enter your email and your account is created automatically.
          </p>

          <div style={{ marginTop: 28, padding: 16, background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, marginBottom: 8 }}>✦ Free plan includes:</div>
            {['Booking page & calendar', 'Automatic SMS reminders', 'Client database', 'Analytics & reports'].map(f => (
              <div key={f} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>· {f}</div>
            ))}
            <a href="/pricing" style={{ fontSize: 12, color: GOLD, display: 'block', marginTop: 8, textDecoration: 'none' }}>View all plans →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
