'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

const GOLD = '#c9a84c'

type BlockedTime = { id: string; label: string; start_date: string; end_date: string; start_time: string | null; end_time: string | null; repeat_weekly: boolean }

export default function BlockedPage() {
  const [blocks, setBlocks] = useState<BlockedTime[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: '', start_date: '', end_date: '', start_time: '', end_time: '', repeat_weekly: false, type: 'fullday' as 'fullday' | 'timerange' })

  useEffect(() => { document.title = 'Block-out Times | SalonPing' }, [])

  useEffect(() => { loadBlocks() }, [])

  async function loadBlocks() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
    if (!salon) { setLoading(false); return }
    const { data } = await supabase.from('blocked_times').select('*').eq('salon_id', salon.id).order('start_date')
    setBlocks(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.label || !form.start_date) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()
    await supabase.from('blocked_times').insert({
      salon_id: salon?.id, label: form.label,
      start_date: form.start_date, end_date: form.end_date || form.start_date,
      start_time: form.type === 'timerange' ? form.start_time || null : null,
      end_time: form.type === 'timerange' ? form.end_time || null : null,
      repeat_weekly: form.repeat_weekly,
    })
    setForm({ label: '', start_date: '', end_date: '', start_time: '', end_time: '', repeat_weekly: false, type: 'fullday' })
    setShowForm(false)
    await loadBlocks()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('blocked_times').delete().eq('id', id)
    setBlocks(blocks.filter(b => b.id !== id))
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: 'rgba(255,255,255,0.5)', display: 'block' as const, marginBottom: 5 }

  const upcoming = blocks.filter(b => new Date(b.end_date) >= new Date() || b.repeat_weekly)
  const past = blocks.filter(b => new Date(b.end_date) < new Date() && !b.repeat_weekly)

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <NavBar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Block-out Times</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Block vacations, lunch breaks, or any time you're unavailable</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 700, fontSize: 13, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
            + Add Block
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>New Block-out Period</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={labelStyle}>Label *</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Vacation, Lunch break, Personal" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value, end_date: form.end_date || e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} min={form.start_date} style={inputStyle} />
                </div>
              </div>

              {/* Block type */}
              <div>
                <label style={labelStyle}>Block type</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ value: 'fullday', label: '☀️ Full day(s)' }, { value: 'timerange', label: '⏰ Specific hours' }].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setForm({ ...form, type: opt.value as any })}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
                        background: form.type === opt.value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                        outline: form.type === opt.value ? `2px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'timerange' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Start Time</label>
                    <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>End Time</label>
                    <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="repeat" checked={form.repeat_weekly} onChange={e => setForm({ ...form, repeat_weekly: e.target.checked })} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="repeat" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Repeat every week (e.g. lunch break every day)</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 10, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, border: 'none', color: '#0a0a0a', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : '✓ Save Block'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : blocks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗓️</div>
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontWeight: 700 }}>No blocks yet</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Clients can currently book any available slot. Add a block to mark time as unavailable.</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Active & Upcoming</h2>
                {upcoming.map(b => <BlockCard key={b.id} block={b} onDelete={handleDelete} />)}
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Past</h2>
                {past.map(b => <BlockCard key={b.id} block={b} onDelete={handleDelete} dim />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function BlockCard({ block, onDelete, dim }: { block: BlockedTime; onDelete: (id: string) => void; dim?: boolean }) {
  const isSingleDay = block.start_date === block.end_date
  const dateStr = isSingleDay
    ? new Date(block.start_date + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : `${new Date(block.start_date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} – ${new Date(block.end_date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`
  const timeStr = block.start_time && block.end_time ? ` · ${block.start_time} – ${block.end_time}` : ' · All day'

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', marginBottom: 8, opacity: dim ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚫</div>
        <div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{block.label}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {dateStr}{timeStr}{block.repeat_weekly ? ' · Repeats weekly' : ''}
          </div>
        </div>
      </div>
      <button onClick={() => onDelete(block.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, padding: '6px 12px', cursor: 'pointer' }}>Delete</button>
    </div>
  )
}
