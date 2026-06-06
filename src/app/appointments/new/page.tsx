'use client'
import { createClient } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/clients|Clients','/analytics|Analytics','/services|Services','/hours|Hours','/customise|Customise','/settings|Settings']
type Service = { id: string; name: string; price: number; duration_minutes: number }

export default function NewAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ client_name:'', client_phone:'', client_email:'', service:'', date:'', time:'', reminder_channel:'sms' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
      if (!salon) return
      const { data: svcs } = await supabase.from('services').select('id,name,price,duration_minutes').eq('salon_id', salon.id).eq('active', true).order('name')
      setServices(svcs || [])
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!form.client_name || !form.client_phone || !form.service || !form.date || !form.time) { setError('Please fill in all required fields.'); return }
    setLoading(true)
    const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString()
    const res = await fetch('/api/appointments/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: form.client_name, client_phone: form.client_phone,
        client_email: form.client_email, service: form.service,
        scheduled_at, reminder_channel: form.reminder_channel,
      }),
    })
    const data = await res.json()
    if (!data.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
    router.push('/appointments')
  }

  const inputStyle: React.CSSProperties = { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 14px', fontSize:14, color:'#fff', outline:'none', boxSizing:'border-box' }
  const labelStyle: React.CSSProperties = { fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6 }
  const selectedService = services.find(s => s.name === form.service)

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#fff'}}>
      <nav style={{background:'#0a0a0a', borderBottom:'1px solid rgba(201,168,76,0.15)', position:'sticky', top:0, zIndex:50}}>
        <div style={{maxWidth:1200, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,#2a1f08,${GOLD})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16}}>✄</div>
            <span style={{fontWeight:800, fontSize:17, color:'#fff'}}>SalonPing</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:2}}>
            {NAV.map(l => { const [href, label] = l.split('|'); return <a key={href} href={href} style={{color:'rgba(255,255,255,0.5)', fontSize:13, padding:'6px 12px', borderRadius:8, textDecoration:'none'}}>{label}</a> })}
            <a href="/appointments/new" style={{marginLeft:8, background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'8px 16px', borderRadius:8, textDecoration:'none'}}>+ New</a>
          </div>
        </div>
      </nav>
      <div style={{maxWidth:680, margin:'0 auto', padding:'40px 24px'}}>
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:26, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.5px'}}>New Appointment</h1>
          <p style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:4}}>Manually add a client — reminders scheduled automatically</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24, marginBottom:14}}>
            <h2 style={{fontSize:14, fontWeight:700, color:GOLD, margin:'0 0 18px'}}>Client Details</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14}}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input type="text" value={form.client_name} onChange={e => setForm({...form, client_name:e.target.value})} placeholder="Jane Smith" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone Number *</label>
                <input type="tel" value={form.client_phone} onChange={e => setForm({...form, client_phone:e.target.value})} placeholder="+1 226 555 0123" required style={inputStyle} />
                <p style={{fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4}}>Include country code e.g. +1</p>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email Address (optional)</label>
              <input type="email" value={form.client_email} onChange={e => setForm({...form, client_email:e.target.value})} placeholder="jane@example.com" style={inputStyle} />
            </div>
          </div>
          <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24, marginBottom:14}}>
            <h2 style={{fontSize:14, fontWeight:700, color:GOLD, margin:'0 0 18px'}}>Service</h2>
            <select value={form.service} onChange={e => setForm({...form, service:e.target.value})} required style={{...inputStyle, cursor:'pointer'}}>
              <option value="">Choose a service...</option>
              {services.length > 0 ? services.map(s => <option key={s.id} value={s.name}>{s.name} — ${s.price} · {s.duration_minutes} min</option>) : <option disabled>No active services — add services first</option>}
            </select>
            {services.length === 0 && <p style={{fontSize:12, color:'#f87171', marginTop:8}}>No services found. <a href="/services" style={{color:GOLD}}>Add your services first</a></p>}
            {selectedService && (
              <div style={{marginTop:10, display:'flex', gap:16, padding:'10px 14px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:10}}>
                <span style={{fontSize:13, color:'rgba(255,255,255,0.6)'}}>⏱ {selectedService.duration_minutes} min</span>
                <span style={{fontSize:13, color:GOLD, fontWeight:700}}>${selectedService.price} CAD</span>
              </div>
            )}
          </div>
          <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24, marginBottom:14}}>
            <h2 style={{fontSize:14, fontWeight:700, color:GOLD, margin:'0 0 18px'}}>Date & Time</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})} required min={new Date().toISOString().split('T')[0]} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Time *</label>
                <input type="time" value={form.time} onChange={e => setForm({...form, time:e.target.value})} required style={inputStyle} />
              </div>
            </div>
          </div>
          <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24, marginBottom:14}}>
            <h2 style={{fontSize:14, fontWeight:700, color:GOLD, margin:'0 0 4px'}}>Reminder Channel</h2>
            <p style={{fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:14}}>How should we remind this client? Sent at 48h, 24h, and 2h before.</p>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              {[{value:'sms',label:'📱 SMS',desc:'Text message'},{value:'whatsapp',label:'💬 WhatsApp',desc:'WhatsApp'},{value:'email',label:'📧 Email',desc:'Email reminder'}].map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm({...form, reminder_channel:opt.value})}
                  style={{padding:'12px', borderRadius:10, textAlign:'center', cursor:'pointer', border:'none', color:'#fff',
                    background: form.reminder_channel === opt.value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                    outline: form.reminder_channel === opt.value ? `2px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{fontSize:13, fontWeight:600, marginBottom:2}}>{opt.label}</div>
                  <div style={{fontSize:11, color:'rgba(255,255,255,0.35)'}}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {error && <div style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'12px 16px', marginBottom:14, fontSize:13, color:'#f87171'}}>{error}</div>}
          <div style={{display:'flex', gap:12}}>
            <a href="/appointments" style={{flex:1, padding:'13px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', fontSize:14, fontWeight:600, textDecoration:'none', textAlign:'center', display:'block'}}>Cancel</a>
            <button type="submit" disabled={loading} style={{flex:2, background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:800, fontSize:14, padding:'13px', borderRadius:12, border:'none', cursor:'pointer', opacity:loading?0.7:1}}>
              {loading ? 'Saving...' : '+ Save Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
