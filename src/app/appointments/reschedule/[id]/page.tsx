'use client'
import { createClient } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/calendar|Calendar','/clients|Clients','/analytics|Analytics','/services|Services','/hours|Hours','/customise|Customise','/settings|Settings']

type Apt = { id: string; client_name: string; client_phone: string; client_email: string; service: string; scheduled_at: string; reminder_channel: string; notes: string }
type Service = { id: string; name: string; price: number; duration_minutes: number }

export default function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [apt, setApt] = useState<Apt | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ service: '', date: '', time: '', notes: '' })

  useEffect(() => {
    params.then(async p => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
      const [{ data: appointment }, { data: svcs }] = await Promise.all([
        supabase.from('appointments').select('*').eq('id', p.id).eq('salon_id', salon?.id).single(),
        supabase.from('services').select('id,name,price,duration_minutes').eq('salon_id', salon?.id).eq('active', true).order('name'),
      ])
      if (appointment) {
        setApt(appointment)
        const d = new Date(appointment.scheduled_at)
        setForm({
          service: appointment.service,
          date: d.toLocaleDateString('en-CA'),
          time: d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }),
          notes: appointment.notes || '',
        })
      }
      setServices(svcs || [])
      setLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!form.service || !form.date || !form.time) { setError('Please fill all fields.'); return }
    setSaving(true)
    const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString()
    const supabase = createClient()
    const { error: err } = await supabase.from('appointments').update({ service: form.service, scheduled_at, notes: form.notes }).eq('id', apt?.id)
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/appointments?rescheduled=1')
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
  if (!apt) return <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>Appointment not found.</div>

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(201,168,76,0.15)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✄</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>SalonPing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {NAV.map(l => { const [href, label] = l.split('|'); return <a key={href} href={href} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, padding: '5px 10px', borderRadius: 8, textDecoration: 'none' }}>{label}</a> })}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Reschedule Appointment</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            {apt.client_name} · {apt.client_phone}
          </p>
        </div>

        {/* Original slot */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>📅</span>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Current appointment</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {apt.service} · {new Date(apt.scheduled_at).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(apt.scheduled_at).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>New Date & Time</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>New Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>New Time *</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Service</label>
              <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {services.map(s => <option key={s.id} value={s.name}>{s.name} — ${s.price} · {s.duration_minutes} min</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>Notes</h2>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Color formula, special requests, reason for reschedule…"
              rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#f87171' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/appointments" style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center', display: 'block' }}>Cancel</a>
            <button type="submit" disabled={saving} style={{ flex: 2, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 800, fontSize: 14, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : '✓ Reschedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
