'use client'
import { createClient } from '@/lib/supabase'
import { useState, useEffect, useMemo } from 'react'
import NavBar from '@/components/NavBar'

const GOLD = '#c9a84c'

type Apt = { id: string; client_name: string; client_phone: string; client_email: string; service: string; scheduled_at: string; status: string; notes?: string; tip_amount?: number; payment_status?: string; payment_method?: string }


const statusStyle: Record<string, { bg: string; color: string; border: string; label: string }> = {
upcoming: { bg: 'rgba(201,168,76,0.12)', color: GOLD, border: 'rgba(201,168,76,0.3)', label: 'upcoming' },
attended:  { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.3)', label: 'attended' },
cancelled: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)', label: 'cancelled' },
no_show:   { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.3)', label: 'no-show' },
}

type AptRowProps = {
apt: Apt; now: Date; showPaid: string | null; setShowPaid: (id: string | null) => void
payMethod: string; setPayMethod: (m: string) => void
tipInput: string; setTipInput: (v: string) => void
handleCancel: (id: string) => void; handleNoShow: (id: string) => void; handleMarkPaid: (id: string) => void
}

function AptRow({ apt, now, showPaid, setShowPaid, payMethod, setPayMethod, tipInput, setTipInput, handleCancel, handleNoShow, handleMarkPaid }: AptRowProps) {
  const d = new Date(apt.scheduled_at)
  const isPastConfirmed = d < now && apt.status === 'confirmed'
  const isUpcoming = d >= now && apt.status === 'confirmed'
  const styleKey = isUpcoming ? 'upcoming' : isPastConfirmed ? 'attended' : apt.status
  const style = statusStyle[styleKey] || statusStyle.cancelled
  const isPaid = apt.payment_status === 'paid'

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#0a0a0a', flexShrink: 0 }}>
            {apt.client_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{apt.client_name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {apt.service} · {apt.client_phone}
              {apt.notes && <span style={{ marginLeft: 6, color: GOLD }}>📝</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{`${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2,'0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>{style.label}</span>
          {isPaid
            ? <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>✓ paid{apt.tip_amount ? ` +$${apt.tip_amount} tip` : ''}</span>
            : (isPastConfirmed || apt.status === 'no_show' ? null : null)
          }
          {isUpcoming && (
            <>
              <a href={`/appointments/reschedule/${apt.id}`} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.25)`, color: GOLD, fontWeight: 600, textDecoration: 'none' }}>Reschedule</a>
              <button onClick={() => handleCancel(apt.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            </>
          )}
          {isPastConfirmed && (
            <>
              {!isPaid && <button onClick={() => setShowPaid(showPaid === apt.id ? null : apt.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', cursor: 'pointer', fontWeight: 600 }}>Mark paid</button>}
              {!isPaid && <button onClick={() => handleNoShow(apt.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}>No-show</button>}
            </>
          )}
        </div>
      </div>
      {/* Notes preview */}
      {apt.notes && (
        <div style={{ padding: '0 20px 12px', marginLeft: 62 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '6px 10px', borderLeft: `2px solid rgba(201,168,76,0.3)` }}>
            📝 {apt.notes}
          </div>
        </div>
      )}
      {/* Pay popup */}
      {showPaid === apt.id && (
        <div style={{ padding: '0 20px 14px', marginLeft: 62 }}>
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#fff', outline: 'none' }}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="stripe">Stripe</option>
              <option value="other">Other</option>
            </select>
            <input type="number" value={tipInput} onChange={e => setTipInput(e.target.value)} placeholder="Tip $" min="0" style={{ width: 80, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#fff', outline: 'none' }} />
            <button onClick={() => handleMarkPaid(apt.id)} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#4ade80', fontSize: 12, fontWeight: 700, padding: '6px 14px', cursor: 'pointer' }}>✓ Confirm paid</button>
            <button onClick={() => setShowPaid(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Apt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showPaid, setShowPaid] = useState<string | null>(null)
  const [tipInput, setTipInput] = useState('')
  const [payMethod, setPayMethod] = useState('cash')

  useEffect(() => { document.title = 'Appointments | SalonPing'; loadApts() }, [])

  async function loadApts() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
    const { data } = await supabase.from('appointments').select('*').eq('salon_id', salon?.id).order('scheduled_at', { ascending: false })
    setAppointments(data || [])
    setLoading(false)
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this appointment?')) return
    await fetch(`/api/appointments/${id}/cancel`, { method: 'POST' })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
  }

  async function handleNoShow(id: string) {
    if (!confirm('Mark as no-show?')) return
    await fetch(`/api/appointments/${id}/no-show`, { method: 'POST' })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'no_show' } : a))
  }

  async function handleMarkPaid(id: string) {
    const supabase = createClient()
    await supabase.from('appointments').update({ payment_status: 'paid', payment_method: payMethod, tip_amount: parseInt(tipInput || '0') }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, payment_status: 'paid', payment_method: payMethod, tip_amount: parseInt(tipInput || '0') } : a))
    setShowPaid(null); setTipInput(''); setPayMethod('cash')
  }

  function exportCSV() {
    const rows = [['Client','Phone','Email','Service','Date','Time','Status','Payment','Tip','Notes']]
    for (const a of filtered) {
      const d = new Date(a.scheduled_at)
      rows.push([a.client_name, a.client_phone, a.client_email || '', a.service,
        d.toLocaleDateString('en-CA'), d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }),
        a.status, a.payment_status || 'unpaid', String(a.tip_amount || 0), a.notes || ''])
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'appointments.csv'; a.click()
  }

  const now = new Date()

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const matchSearch = !search || a.client_name.toLowerCase().includes(search.toLowerCase()) || a.client_phone.includes(search) || a.service.toLowerCase().includes(search.toLowerCase())
      const d = new Date(a.scheduled_at)
      const isUpcoming = d >= now && a.status === 'confirmed'
      const effectiveStatus = isUpcoming ? 'upcoming' : d < now && a.status === 'confirmed' ? 'attended' : a.status
      const matchStatus = filterStatus === 'all' || effectiveStatus === filterStatus
      return matchSearch && matchStatus
    })
  }, [appointments, search, filterStatus])

  const upcoming = filtered.filter(a => new Date(a.scheduled_at) >= now && a.status === 'confirmed')
  const past = filtered.filter(a => new Date(a.scheduled_at) < now || a.status !== 'confirmed')




  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <NavBar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Appointments</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{upcoming.length} upcoming · {past.length} past</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, padding: '9px 16px', cursor: 'pointer' }}>↓ Export CSV</button>
            <a href="/appointments/new" style={{ background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 10, textDecoration: 'none' }}>+ Add</a>
          </div>
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search by client, phone, or service…"
            style={{ flex: 1, minWidth: 220, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'upcoming', 'attended', 'cancelled', 'no_show'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: filterStatus === s ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                  color: filterStatus === s ? GOLD : 'rgba(255,255,255,0.4)',
                  outline: filterStatus === s ? `1px solid rgba(201,168,76,0.4)` : '1px solid rgba(255,255,255,0.08)' }}>
                {s === 'all' ? 'All' : s === 'no_show' ? 'No-show' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontWeight: 700 }}>No appointments found</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{search ? 'Try a different search term.' : 'Add your first appointment or share your booking link.'}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: GOLD, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Upcoming ({upcoming.length})</h2>
                </div>
                {upcoming.map(apt => <AptRow key={apt.id} apt={apt} now={now} showPaid={showPaid} setShowPaid={setShowPaid} payMethod={payMethod} setPayMethod={setPayMethod} tipInput={tipInput} setTipInput={setTipInput} handleCancel={handleCancel} handleNoShow={handleNoShow} handleMarkPaid={handleMarkPaid} />)}
              </div>
            )}
            {past.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Past ({past.length})</h2>
                </div>
                {past.map(apt => <AptRow key={apt.id} apt={apt} now={now} showPaid={showPaid} setShowPaid={setShowPaid} payMethod={payMethod} setPayMethod={setPayMethod} tipInput={tipInput} setTipInput={setTipInput} handleCancel={handleCancel} handleNoShow={handleNoShow} handleMarkPaid={handleMarkPaid} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
