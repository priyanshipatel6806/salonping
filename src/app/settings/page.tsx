'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

const GOLD = '#c9a84c'
const NAV_LINKS = ['/dashboard|Dashboard','/appointments|Appointments','/clients|Clients','/analytics|Analytics','/services|Services','/hours|Hours','/customise|Customise','/settings|Settings']

function SettingsInner() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', email:'' })
  const [stripeConnected, setStripeConnected] = useState(false)
  const [stripeAccountId, setStripeAccountId] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: salon } = await supabase.from('salons').select('*').eq('owner_id', user?.id).single()
      if (salon) setForm({ name: salon.name || '', phone: salon.phone || '', email: salon.owner_email || '' })
      const { data: settings } = await supabase.from('booking_settings').select('stripe_connected, stripe_account_id').eq('salon_id', salon?.id).single()
      if (settings) {
        setStripeConnected(settings.stripe_connected || false)
        setStripeAccountId(settings.stripe_account_id || '')
      }
    }
    load()
  }, [])

  const stripeStatus = searchParams.get('stripe_connected')
  const stripeError = searchParams.get('stripe_error')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('salons').update({ name: form.name, phone: form.phone, owner_email: form.email }).eq('owner_id', user?.id)
    setSaved(true); setLoading(false)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const inputStyle = { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 14px', fontSize:14, color:'#fff', outline:'none', boxSizing:'border-box' as const }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://salonping-app.vercel.app')

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#fff'}}>
      <NavBar />

      <div style={{maxWidth:600, margin:'0 auto', padding:'40px 24px'}}>
        <h1 style={{fontSize:26, fontWeight:900, color:'#fff', margin:'0 0 4px', letterSpacing:'-0.5px'}}>Settings</h1>
        <p style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:28}}>Manage your salon profile</p>

        <form onSubmit={handleSubmit}>
          <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24, marginBottom:16}}>
            <h2 style={{fontSize:15, fontWeight:700, color:GOLD, margin:'0 0 20px'}}>Salon Details</h2>
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              {[
                { key:'name', label:'Salon Name', type:'text', ph:"Priya's Hair Studio" },
                { key:'phone', label:'Your Phone Number', type:'tel', ph:'+1 226 555 0123', hint:'Used to receive booking notifications via SMS' },
                { key:'email', label:'Your Email Address', type:'email', ph:'you@example.com', hint:'Used to receive booking notifications via email' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6}}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    placeholder={f.ph} style={inputStyle} />
                  {f.hint && <p style={{fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4}}>{f.hint}</p>}
                </div>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            style={{width:'100%', background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:14, padding:'13px', borderRadius:12, border:'none', cursor:'pointer', opacity: loading ? 0.7 : 1}}>
            {loading ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </form>

        {/* Stripe Connect */}
        <div style={{marginTop:24, padding:24, background: stripeConnected || stripeStatus === 'true' ? 'rgba(34,197,94,0.04)' : 'rgba(99,102,241,0.04)', border: `1px solid ${stripeConnected || stripeStatus === 'true' ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.25)'}`, borderRadius:16}}>
          <h2 style={{fontSize:15, fontWeight:700, color: stripeConnected || stripeStatus === 'true' ? '#4ade80' : '#818cf8', margin:'0 0 4px'}}>
            💳 {stripeConnected || stripeStatus === 'true' ? '✓ Stripe Connected' : 'Connect Your Stripe Account'}
          </h2>
          <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:14, lineHeight:1.6}}>
            {stripeConnected || stripeStatus === 'true'
              ? 'Your Stripe account is connected. Client deposits go directly to your bank. SalonPing takes a 1% platform fee per deposit.'
              : "Required for deposit collection. Connect your Stripe account so client deposits land directly in your bank — not SalonPing's account."}
          </p>
          {stripeStatus === 'true' && (
            <div style={{padding:'10px 14px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, fontSize:12, color:'#4ade80', marginBottom:14}}>
              ✓ Successfully connected! Deposits will now go directly to your Stripe account.
            </div>
          )}
          {stripeError && (
            <div style={{padding:'10px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, fontSize:12, color:'#f87171', marginBottom:14}}>
              Connection failed: {stripeError}. Please try again.
            </div>
          )}
          {stripeConnected || stripeStatus === 'true' ? (
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.4)'}}>Account: <code style={{color:'#818cf8'}}>{stripeAccountId || 'Connected'}</code></div>
              <a href="/api/stripe/connect" style={{padding:'8px 16px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600, textDecoration:'none'}}>Reconnect</a>
            </div>
          ) : (
            <a href="/api/stripe/connect" style={{display:'inline-block', padding:'11px 22px', background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:13, borderRadius:10, textDecoration:'none'}}>
              🔗 Connect with Stripe →
            </a>
          )}
          {!stripeConnected && stripeStatus !== 'true' && (
            <p style={{marginTop:12, fontSize:11, color:'rgba(255,255,255,0.25)', lineHeight:1.6}}>
              Free to connect. You&apos;ll need a Stripe account — create one free at stripe.com. After connecting, set a deposit amount in the Customise page.
            </p>
          )}
        </div>

        {/* AI Voice Assistant Setup */}
        <div style={{marginTop:16, padding:24, background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:16}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:10}}>
            <h2 style={{fontSize:15, fontWeight:700, color:GOLD, margin:0}}>🎙️ AI Voice Assistant</h2>
            <span style={{fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.3)', color:'#a78bfa'}}>Premium Plan</span>
          </div>
          <p style={{fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.7, marginBottom:16}}>
            Clients can call your salon number and an AI assistant will answer, check your schedule, and book appointments automatically — 24/7, no effort from you.
          </p>
          <div style={{padding:'12px 16px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:10, marginBottom:16}}>
            <p style={{fontSize:12, color:'rgba(255,255,255,0.5)', margin:0, lineHeight:1.7}}>
              To activate, upgrade to the <strong style={{color:GOLD}}>Premium plan</strong> and email us at{' '}
              <a href="mailto:support@salonping.com" style={{color:GOLD, textDecoration:'none'}}>support@salonping.com</a> — we&apos;ll set up your AI phone number within 24 hours.
            </p>
          </div>
          <a href="/pricing" style={{display:'inline-block', padding:'9px 18px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:9, color:GOLD, fontSize:13, fontWeight:600, textDecoration:'none'}}>
            View Premium Plan →
          </a>
        </div>

        {/* AI Chat Widget */}
        <div style={{marginTop:16, padding:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14}}>
          <h2 style={{fontSize:14, fontWeight:700, color:'#fff', margin:'0 0 6px'}}>🤖 AI Chat Widget</h2>
          <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.6}}>
            Already active on your booking page. Clients can ask about services, pricing, and availability — the AI answers automatically. Powered by Groq (LLaMA 3.1) — free.
          </p>
          <div style={{marginTop:10, padding:'8px 12px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, fontSize:12, color:'#4ade80', fontWeight:600}}>
            ✓ Active on all plans — no setup needed
          </div>
        </div>

        {/* Sign out */}
        <div style={{marginTop:24, padding:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14}}>
          <h3 style={{fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.7)', margin:'0 0 8px'}}>Sign out</h3>
          <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:14}}>Sign out of your SalonPing account</p>
          <button onClick={handleSignOut}
            style={{padding:'9px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:9, color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:600, cursor:'pointer'}}>
            Sign out
          </button>
        </div>

        {/* Danger zone */}
        <div style={{marginTop:16, padding:20, background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:14}}>
          <h3 style={{fontSize:14, fontWeight:700, color:'#f87171', margin:'0 0 6px'}}>⚠️ Danger Zone</h3>
          <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:14, lineHeight:1.6}}>
            Permanently delete your account and all associated data — salons, services, clients, appointments. This cannot be undone.
          </p>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete your account? This will permanently erase all your data and cannot be undone.')) {
                if (confirm('Last chance — delete everything?')) {
                  fetch('/api/account/delete', { method: 'DELETE' })
                    .then(() => { window.location.href = '/' })
                    .catch(() => alert('Failed to delete account. Please contact support@salonping.com'))
                }
              }
            }}
            style={{padding:'9px 20px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:9, color:'#f87171', fontSize:13, fontWeight:600, cursor:'pointer'}}>
            Delete my account
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{background:'#0a0a0a', minHeight:'100vh'}} />}>
      <SettingsInner />
    </Suspense>
  )
}
