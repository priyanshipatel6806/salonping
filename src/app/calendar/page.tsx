'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/calendar|Calendar','/clients|Clients','/analytics|Analytics','/services|Services','/hours|Hours','/customise|Customise','/settings|Settings']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8am–8pm
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

type Apt = {
  id: string; client_name: string; service: string; scheduled_at: string;
  status: string; notes?: string; staff_id?: string
}
type StaffMember = { id: string; name: string; color: string }

function getWeekDates(anchor: Date) {
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - anchor.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function timeToMinutes(isoString: string) {
  const d = new Date(isoString)
  return d.getHours() * 60 + d.getMinutes()
}

function fmtTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Toronto' })
}

function isSameDay(isoString: string, day: Date) {
  const d = new Date(isoString)
  return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate()
}

export default function CalendarPage() {
  const [anchor, setAnchor] = useState(new Date())
  const [view, setView] = useState<'week' | 'day'>('week')
  const [appointments, setAppointments] = useState<Apt[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApt, setSelectedApt] = useState<Apt | null>(null)

  const weekDates = getWeekDates(anchor)
  const viewDays = view === 'week' ? weekDates : [anchor]
  const SLOT_HEIGHT = 56 // pixels per hour

  useEffect(() => { loadData() }, [anchor])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
    if (!salon) { setLoading(false); return }

    const weekStart = getWeekDates(anchor)[0]
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)

    const { data: apts } = await supabase.from('appointments').select('*')
      .eq('salon_id', salon.id)
      .gte('scheduled_at', weekStart.toISOString())
      .lt('scheduled_at', weekEnd.toISOString())
      .neq('status', 'cancelled')
      .order('scheduled_at')

    const { data: staffData } = await supabase.from('staff_members').select('id,name,color').eq('salon_id', salon.id).eq('active', true)

    setAppointments(apts || [])
    setStaff(staffData || [])
    setLoading(false)
  }

  function prevWeek() {
    const d = new Date(anchor)
    d.setDate(d.getDate() - (view === 'week' ? 7 : 1))
    setAnchor(d)
  }
  function nextWeek() {
    const d = new Date(anchor)
    d.setDate(d.getDate() + (view === 'week' ? 7 : 1))
    setAnchor(d)
  }
  function goToday() { setAnchor(new Date()) }

  const staffColorMap: Record<string, string> = {}
  for (const s of staff) staffColorMap[s.id] = s.color

  const today = new Date()

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      {/* Nav */}
      <nav style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(201,168,76,0.15)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✄</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>SalonPing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {NAV.map(l => { const [href, label] = l.split('|'); return <a key={href} href={href} style={{ color: href === '/calendar' ? GOLD : 'rgba(255,255,255,0.5)', fontSize: 12, padding: '5px 10px', borderRadius: 8, textDecoration: 'none', fontWeight: href === '/calendar' ? 700 : 400 }}>{label}</a> })}
            <a href="/appointments/new" style={{ marginLeft: 6, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 700, fontSize: 12, padding: '7px 14px', borderRadius: 8, textDecoration: 'none' }}>+ New</a>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 16px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={prevWeek} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', padding: '7px 12px', cursor: 'pointer', fontSize: 14 }}>‹</button>
            <button onClick={nextWeek} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', padding: '7px 12px', cursor: 'pointer', fontSize: 14 }}>›</button>
            <button onClick={goToday} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Today</button>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginLeft: 8 }}>
              {view === 'week'
                ? `${weekDates[0].toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : anchor.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
              }
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['week', 'day'] as const).map(v => (
              <button key={v} onClick={() => { setView(v); if (v === 'day' && view === 'week') setAnchor(new Date()) }}
                style={{ background: view === v ? `rgba(201,168,76,0.15)` : 'rgba(255,255,255,0.04)', border: `1px solid ${view === v ? `rgba(201,168,76,0.4)` : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: view === v ? GOLD : 'rgba(255,255,255,0.5)', padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: view === v ? 700 : 400 }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading schedule…</div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(${viewDays.length}, 1fr)`, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div />
              {viewDays.map(day => {
                const isToday = day.toDateString() === today.toDateString()
                return (
                  <div key={day.toISOString()} onClick={() => { if (view === 'week') { setAnchor(new Date(day)); setView('day') } }}
                    style={{ padding: '12px 8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', cursor: view === 'week' ? 'pointer' : 'default' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{DAYS_SHORT[day.getDay()]}</div>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, background: isToday ? GOLD : 'transparent', color: isToday ? '#0a0a0a' : 'rgba(255,255,255,0.8)' }}>
                      {day.getDate()}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                      {appointments.filter(a => isSameDay(a.scheduled_at, day)).length || ''}{appointments.filter(a => isSameDay(a.scheduled_at, day)).length ? ' appts' : ''}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(${viewDays.length}, 1fr)`, overflowY: 'auto', maxHeight: '70vh' }}>
              {/* Time column */}
              <div>
                {HOURS.map(h => (
                  <div key={h} style={{ height: SLOT_HEIGHT, borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-start', paddingTop: 4, justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {viewDays.map(day => {
                const dayApts = appointments.filter(a => isSameDay(a.scheduled_at, day) && a.status !== 'cancelled')
                return (
                  <div key={day.toISOString()} style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                    {HOURS.map(h => (
                      <div key={h} style={{ height: SLOT_HEIGHT, borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
                    ))}
                    {dayApts.map(apt => {
                      const mins = timeToMinutes(apt.scheduled_at)
                      const startHour = 8
                      const topPx = ((mins - startHour * 60) / 60) * SLOT_HEIGHT
                      if (topPx < 0 || topPx > HOURS.length * SLOT_HEIGHT) return null
                      const color = apt.staff_id && staffColorMap[apt.staff_id] ? staffColorMap[apt.staff_id] : GOLD
                      const isNoShow = apt.status === 'no_show'
                      return (
                        <div key={apt.id} onClick={() => setSelectedApt(apt === selectedApt ? null : apt)}
                          style={{ position: 'absolute', left: 3, right: 3, top: topPx + 1, minHeight: 28, borderRadius: 6, padding: '4px 6px', cursor: 'pointer', zIndex: 2, overflow: 'hidden',
                            background: isNoShow ? 'rgba(239,68,68,0.15)' : `${color}22`,
                            border: `1px solid ${isNoShow ? 'rgba(239,68,68,0.3)' : `${color}55`}`,
                            opacity: isNoShow ? 0.6 : 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isNoShow ? '#f87171' : color, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apt.client_name}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtTime(apt.scheduled_at)} · {apt.service}</div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Appointment detail popup */}
        {selectedApt && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1a1a', border: `1px solid ${GOLD}44`, borderRadius: 16, padding: 20, width: 300, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{selectedApt.client_name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{selectedApt.service}</div>
              </div>
              <button onClick={() => setSelectedApt(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>🕐 {fmtTime(selectedApt.scheduled_at)}</div>
            {selectedApt.notes && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>📝 {selectedApt.notes}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <a href="/appointments" style={{ flex: 1, fontSize: 12, textAlign: 'center', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>View all</a>
              <a href={`/appointments/reschedule/${selectedApt.id}`} style={{ flex: 1, fontSize: 12, textAlign: 'center', padding: '8px', borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 700, textDecoration: 'none' }}>Reschedule</a>
            </div>
          </div>
        )}

        {/* Legend */}
        {staff.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Staff:</span>
            {staff.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.name}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: GOLD }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Unassigned</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
