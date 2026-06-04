'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const GOLD = '#c9a84c'
const NAV_LINKS = ['/dashboard|Dashboard','/appointments|Appointments','/services|Services','/hours|Hours','/customise|Customise','/settings|Settings']

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', email:'' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: salon } = await supabase.from('salons').select('*').eq('owner_id', user?.id).single()
      if (salon) setForm({ name: salon.name || '', phone: salon.phone || '', email: salon.owner_email || '' })
    }
    load()
  }, [])

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

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#fff'}}>
      <nav style={{background:'#0a0a0a', borderBottom:'1px solid rgba(201,168,76,0.15)', position:'sticky', top:0, zIndex:50}}>
        <div style={{maxWidth:1100, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#2a1f08,#c9a84c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16}}>&#9986;</div>
            <span style={{fontWeight:800, fontSize:17, color:'#fff'}}>SalonPing</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:2}}>
            {NAV_LINKS.map(l => { const [href,label] = l.split('|'); return <a key={href} href={href} style={{color:'rgba(255,255,255,0.5)', fontSize:13, padding:'6px 12px', borderRadius:8, textDecoration:'none'}}>{label}</a> })}
            <a href="/appointments/new" style={{marginLeft:8, background:'linear-gradient(135deg,#2a1f08,#c9a84c)', color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'8px 16px', borderRadius:8, textDecoration:'none'}}>+ New</a>
          </div>
        </div>
      </nav>

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
            style={{width:'100%', background:'linear-gradient(135deg,#2a1f08,#c9a84c)', color:'#0a0a0a', fontWeight:700, fontSize:14, padding:'13px', borderRadius:12, border:'none', cursor:'pointer', opacity: loading ? 0.7 : 1}}>
            {loading ? 'Saving...' : saved ? '&#10003; Saved!' : 'Save Settings'}
          </button>
        </form>

        {/* AI Voice Assistant Setup */}
        <div style={{marginTop:24, padding:24, background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:16}}>
          <h2 style={{fontSize:15, fontWeight:700, color:GOLD, margin:'0 0 4px'}}>🎙️ AI Voice Assistant</h2>
          <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:16}}>
            Premium plan feature. Clients call your salon number — AI answers and books appointments automatically.
          </p>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[
              { n:'1', text:'Sign up at dashboard.vapi.ai (free to start)' },
              { n:'2', text:'Create a new Assistant → set the system prompt to: "You are a booking assistant for [Salon Name]. Help clients book appointments."' },
              { n:'3', text:'Add 3 tools: get_services, check_availability, create_booking — all pointing to: https://salonping-app.vercel.app/api/vapi' },
              { n:'4', text:'In each tool, add parameter: salon_id (string) = your salon ID from Supabase' },
              { n:'5', text:'Connect your Twilio phone number to this Vapi assistant in the Vapi dashboard' },
              { n:'6', text:'Test by calling your Twilio number — the AI will answer and book!' },
            ].map(step => (
              <div key={step.n} style={{display:'flex', gap:12, alignItems:'flex-start'}}>
                <div style={{width:22, height:22, borderRadius:'50%', background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:GOLD, flexShrink:0}}>{step.n}</div>
                <p style={{fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.6, margin:0}}>{step.text}</p>
              </div>
            ))}
          </div>
          <div style={{marginTop:14, padding:'10px 14px', background:'rgba(0,0,0,0.3)', borderRadius:8, fontFamily:'monospace', fontSize:11, color:'rgba(255,255,255,0.5)'}}>
            Webhook URL: {process.env.NEXT_PUBLIC_APP_URL}/api/vapi
          </div>
          <a href="https://dashboard.vapi.ai" target="_blank"
            style={{display:'inline-block', marginTop:14, padding:'9px 18px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:9, color:GOLD, fontSize:13, fontWeight:600, textDecoration:'none'}}>
            Open Vapi Dashboard →
          </a>
        </div>

        {/* AI Chat Widget Info */}
        <div style={{marginTop:16, padding:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14}}>
          <h2 style={{fontSize:14, fontWeight:700, color:'#fff', margin:'0 0 6px'}}>🤖 AI Chat Widget</h2>
          <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.6}}>
            Already active on your booking page. Clients can ask questions about services, pricing, and availability — the AI answers automatically using your real salon data.
            Powered by Groq (LLaMA 3.1) — free up to 500K tokens/day.
          </p>
          <div style={{marginTop:10, padding:'8px 12px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, fontSize:12, color:'#4ade80', fontWeight:600}}>
            ✓ Active on all plans — no setup needed
          </div>
        </div>

        <div style={{marginTop:24, padding:20, background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:14}}>
          <h3 style={{fontSize:14, fontWeight:700, color:'#f87171', margin:'0 0 8px'}}>Sign out</h3>
          <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:14}}>Sign out of your SalonPing account</p>
          <button onClick={handleSignOut}
            style={{padding:'9px 20px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:9, color:'#f87171', fontSize:13, fontWeight:600, cursor:'pointer'}}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
