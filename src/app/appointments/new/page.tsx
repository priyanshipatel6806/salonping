'use client'
import { createClient } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

const GOLD = '#c9a84c'
type Service = { id: string; name: string; price: number; duration_minutes: number; category: string }

export default function NewAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    client_name: '', client_phone: '', client_email: '', birthday: '',
    service: '', date: '', time: '', reminder_channel: 'sms',
    notes: '', staff_id: '',
    recurrence: 'none' as 'none' | 'weekly' | 'biweekly' | 'every4weeks' | 'every6weeks',
    recurrence_count: 6,
  })

  useEffect(() => { document.title = 'New Appointment | SalonPing' }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
      if (!salon) return
      const [{ data: svcs }, { data: staffData }] = await Promise.all([
        supabase.from('services').select('id,name,price,duration_minutes,category').eq('salon_id', salon.id).eq('active', true).order('category').order('name'),
        supabase.from('staff_members').select('id,name').eq('salon_id', salon.id).eq('active', true).order('name'),
      ])
      setServices(svcs || [])
      setStaff(staffData || [])
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!form.client_name || !form.client_phone || !form.service || !form.date || !form.time) { setError('Please fill in all required fields.'); return }
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()

    // Save client notes/birthday
    if (form.birthday || form.notes) {
      await supabase.from('client_profiles').upsert({ salon_id: salon?.id, phone: form.client_phone, notes: form.notes || null, birthday: form.birthday || null }, { onConflict: 'salon_id,phone' })
    }

    // Build appointment dates
    const baseDt = new Date(`${form.date}T${form.time}:00`)
    const recurrenceMap: Record<string, number> = { none: 0, weekly: 7, biweekly: 14, every4weeks: 28, every6weeks: 42 }
    const intervalDays = recurrenceMap[form.recurrence]
    const dates = [baseDt]
    if (intervalDays > 0) {
      for (let i = 1; i < form.recurrence_count; i++) {
        const d = new Date(baseDt); d.setDate(baseDt.getDate() + i * intervalDays); dates.push(d)
      }
    }

    const recurrenceId = intervalDays > 0 ? crypto.randomUUID() : null

    for (const dt of dates) {
      const res = await fetch('/api/appointments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: form.client_name, client_phone: form.client_phone,
          client_email: form.client_email, service: form.service,
          scheduled_at: dt.toISOString(), reminder_channel: form.reminder_channel,
          notes: form.notes, staff_id: form.staff_id || null,
          recurrence_id: recurrenceId,
          recurrence_rule: intervalDays > 0 ? form.recurrence : null,
        }),
      })
      const data = await res.json()
      if (!data.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
    }

    router.push('/appointments')
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }

  // Group services by category
  const categories = Array.from(new Set(services.map(s => s.category)))

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <NavBar />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>New Appointment</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Manually add a client — reminders scheduled automatically</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Client */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>Client Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Jane Smith" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input type="tel" value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} placeholder="+1 226 555 0123" required style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Email (optional)</label>
                <input type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} placeholder="jane@example.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Birthday (optional)</label>
                <input type="date" value={form.birthday} onChange={e => setForm({ ...form, birthday: e.target.value })} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Service */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>Service</h2>
            <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Choose a service…</option>
              {categories.map(cat => (
                <optgroup key={cat} label={cat}>
                  {services.filter(s => s.category === cat).map(s => (
                    <option key={s.id} value={s.name}>{s.name} — ${s.price} · {s.duration_minutes} min</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {staff.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Assign to staff (optional)</label>
                <select value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Unassigned</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>Date & Time</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Time *</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Recurring */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>Recurring (optional)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
              {[
                { value: 'none', label: 'One-time' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Every 2 weeks' },
                { value: 'every4weeks', label: 'Every 4 weeks' },
                { value: 'every6weeks', label: 'Every 6 weeks' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm({ ...form, recurrence: opt.value as any })}
                  style={{ padding: '9px 4px', borderRadius: 9, cursor: 'pointer', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, textAlign: 'center',
                    background: form.recurrence === opt.value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                    outline: form.recurrence === opt.value ? `2px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {form.recurrence !== 'none' && (
              <div>
                <label style={labelStyle}>Number of appointments in series</label>
                <input type="number" min={2} max={52} value={form.recurrence_count} onChange={e => setForm({ ...form, recurrence_count: parseInt(e.target.value) })} style={{ ...inputStyle, width: 100 }} />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Will create {form.recurrence_count} appointments total</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>Notes & Formula</h2>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Color formula, allergies, special requests, preferences..."
              rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>

          {/* Reminder channel */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 4px' }}>Reminder Channel</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Sent at 48h, 24h, and 2h before</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[{ value: 'sms', label: 'SMS' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: 'Email' }].map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm({ ...form, reminder_channel: opt.value })}
                  style={{ padding: '11px', borderRadius: 10, cursor: 'pointer', border: 'none', color: '#fff',
                    background: form.reminder_channel === opt.value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                    outline: form.reminder_channel === opt.value ? '2px solid #c9a84c' : '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#f87171' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/appointments" style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center', display: 'block' }}>Cancel</a>
            <button type="submit" disabled={loading} style={{ flex: 2, background: 'linear-gradient(135deg,#2a1f08,#c9a84c)', color: '#0a0a0a', fontWeight: 800, fontSize: 14, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : form.recurrence !== 'none' ? 'Create ' + form.recurrence_count + ' Appointments' : '+ Save Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
