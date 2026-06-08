'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/calendar|Calendar','/clients|Clients','/analytics|Analytics','/services|Services','/staff|Staff','/hours|Hours','/blocked|Block-out','/waitlist|Waitlist','/loyalty|Loyalty','/customise|Customise','/settings|Settings']

type WaitlistEntry = { id: string; client_name: string; client_phone: string; client_email: string; service: string; preferred_date: string | null; reminder_channel: string; notified: boolean; created_at: string }

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notifying, setNotifying] = useState<string | null>(null)

  useEffect(() => { loadEntries() }, [])

  async function loadEntries() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
    const { data } = await supabase.from('waitlist').select('*').eq('salon_id', salon?.id).order('created_at')
    setEntries(data || [])
    setLoading(false)
  }

  async function handleNotify(entry: WaitlistEntry) {
    setNotifying(entry.id)
    // Send SMS/WhatsApp notification that a slot is available
    try {
      await fetch('/api/notify-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entry.id, phone: entry.client_phone, name: entry.client_name, service: entry.service, channel: entry.reminder_channel }),
      })
      const supabase = createClient()
      await supabase.from('waitlist').update({ notified: true }).eq('id', entry.id)
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, notified: true } : e))
    } catch (e) { console.error(e) }
    setNotifying(null)
  }

  async function handleBook(entry: WaitlistEntry) {
    window.location.href = `/appointments/new?client_name=${encodeURIComponent(entry.client_name)}&client_phone=${encodeURIComponent(entry.client_phone)}&client_email=${encodeURIComponent(entry.client_email || '')}&service=${encodeURIComponent(entry.service)}`
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove from waitlist?')) return
    const supabase = createClient()
    await supabase.from('waitlist').delete().eq('id', id)
    setEntries(entries.filter(e => e.id !== id))
  }

  const waiting = entries.filter(e => !e.notified)
  const notified = entries.filter(e => e.notified)

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(201,168,76,0.15)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✄</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>SalonPing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {NAV.map(l => { const [href, label] = l.split('|'); return <a key={href} href={href} style={{ color: href === '/waitlist' ? GOLD : 'rgba(255,255,255,0.5)', fontSize: 11, padding: '4px 8px', borderRadius: 8, textDecoration: 'none', fontWeight: href === '/waitlist' ? 700 : 400 }}>{label}</a> })}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Waitlist</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{waiting.length} people waiting for a slot to open up</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Waiting', val: waiting.length, color: GOLD },
            { label: 'Notified', val: notified.length, color: '#4ade80' },
            { label: 'Total', val: entries.length, color: 'rgba(255,255,255,0.6)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontWeight: 700 }}>Waitlist is empty</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>When your booking page is fully booked, clients can join the waitlist. You'll see them here.</p>
          </div>
        ) : (
          <>
            {waiting.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Waiting ({waiting.length})</h2>
                {waiting.map(e => <WaitlistCard key={e.id} entry={e} onNotify={handleNotify} onBook={handleBook} onRemove={handleRemove} notifying={notifying === e.id} />)}
              </div>
            )}
            {notified.length > 0 && (
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Notified</h2>
                {notified.map(e => <WaitlistCard key={e.id} entry={e} onNotify={handleNotify} onBook={handleBook} onRemove={handleRemove} notifying={notifying === e.id} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function WaitlistCard({ entry, onNotify, onBook, onRemove, notifying }: { entry: WaitlistEntry; onNotify: (e: WaitlistEntry) => void; onBook: (e: WaitlistEntry) => void; onRemove: (id: string) => void; notifying: boolean }) {
  const joinedDate = new Date(entry.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  const preferredDate = entry.preferred_date ? new Date(entry.preferred_date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: `1px solid ${entry.notified ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '14px 18px', marginBottom: 8, flexWrap: 'wrap', gap: 10, opacity: entry.notified ? 0.7 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#0a0a0a', flexShrink: 0 }}>
          {entry.client_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{entry.client_name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {entry.service} · {entry.client_phone}
            {preferredDate ? ` · Prefers ${preferredDate}` : ''}
            {' · joined '}{joinedDate}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {entry.notified
          ? <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 100, background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', fontWeight: 600 }}>✓ Notified</span>
          : <button onClick={() => onNotify(entry)} disabled={notifying} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.25)`, color: GOLD, cursor: 'pointer', fontWeight: 600, opacity: notifying ? 0.6 : 1 }}>
              {notifying ? 'Sending…' : '📣 Notify'}
            </button>
        }
        <button onClick={() => onBook(entry)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, border: 'none', color: '#0a0a0a', cursor: 'pointer', fontWeight: 700 }}>Book</button>
        <button onClick={() => onRemove(entry.id)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>Remove</button>
      </div>
    </div>
  )
}
