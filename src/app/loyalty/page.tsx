'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/calendar|Calendar','/clients|Clients','/analytics|Analytics','/services|Services','/staff|Staff','/hours|Hours','/blocked|Block-out','/waitlist|Waitlist','/loyalty|Loyalty','/customise|Customise','/settings|Settings']

type LoyaltyRecord = { id: string; client_phone: string; client_name: string; points: number; total_earned: number; total_redeemed: number }
type Settings = { loyalty_enabled: boolean; loyalty_points_per_visit: number; loyalty_redeem_threshold: number; loyalty_redeem_discount: number }

export default function LoyaltyPage() {
  const [records, setRecords] = useState<LoyaltyRecord[]>([])
  const [settings, setSettings] = useState<Settings>({ loyalty_enabled: false, loyalty_points_per_visit: 10, loyalty_redeem_threshold: 100, loyalty_redeem_discount: 10 })
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savedSettings, setSavedSettings] = useState(false)
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustNote, setAdjustNote] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
    if (!salon) { setLoading(false); return }

    const [{ data: loyaltyData }, { data: bkSettings }] = await Promise.all([
      supabase.from('loyalty_points').select('*').eq('salon_id', salon.id).order('points', { ascending: false }),
      supabase.from('booking_settings').select('loyalty_enabled,loyalty_points_per_visit,loyalty_redeem_threshold,loyalty_redeem_discount').eq('salon_id', salon.id).single(),
    ])

    setRecords(loyaltyData || [])
    if (bkSettings) setSettings(bkSettings as Settings)
    setLoading(false)
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()
    await supabase.from('booking_settings').update(settings).eq('salon_id', salon?.id)
    setSavingSettings(false); setSavedSettings(true)
    setTimeout(() => setSavedSettings(false), 2000)
  }

  async function handleAwardPoints(record: LoyaltyRecord) {
    const pts = parseInt(adjustAmount)
    if (!pts || isNaN(pts)) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()

    const newPoints = record.points + pts
    const newEarned = pts > 0 ? record.total_earned + pts : record.total_earned
    const newRedeemed = pts < 0 ? record.total_redeemed + Math.abs(pts) : record.total_redeemed

    await supabase.from('loyalty_points').update({ points: newPoints, total_earned: newEarned, total_redeemed: newRedeemed, updated_at: new Date().toISOString() }).eq('id', record.id)
    await supabase.from('loyalty_transactions').insert({ salon_id: salon?.id, client_phone: record.client_phone, type: pts > 0 ? 'earn' : 'redeem', points: pts, note: adjustNote || null })

    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, points: newPoints, total_earned: newEarned, total_redeemed: newRedeemed } : r))
    setAdjusting(null); setAdjustAmount(''); setAdjustNote('')
  }

  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <NavBar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Loyalty Points</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{records.length} clients earning points</p>
        </div>

        {/* Settings */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: 0 }}>Program Settings</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Enable loyalty program</span>
              <button onClick={() => setSettings(s => ({ ...s, loyalty_enabled: !s.loyalty_enabled }))}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: settings.loyalty_enabled ? GOLD : 'rgba(255,255,255,0.15)', transition: 'background 0.2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: settings.loyalty_enabled ? 23 : 3, transition: 'left 0.2s' }} />
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
            {[
              { key: 'loyalty_points_per_visit', label: 'Points per visit', suffix: 'pts' },
              { key: 'loyalty_redeem_threshold', label: 'Points to redeem', suffix: 'pts' },
              { key: 'loyalty_redeem_discount', label: 'Discount on redeem', suffix: '$' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" min={1} value={(settings as any)[f.key]} onChange={e => setSettings(s => ({ ...s, [f.key]: parseInt(e.target.value) || 0 }))}
                    style={{ ...inputStyle, width: 80 }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{f.suffix}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSaveSettings} disabled={savingSettings} style={{ marginTop: 16, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 700, fontSize: 13, padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', opacity: savingSettings ? 0.7 : 1 }}>
            {savedSettings ? '✓ Saved' : savingSettings ? 'Saving…' : 'Save Settings'}
          </button>
        </div>

        {/* Points summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Active clients', val: records.length },
            { label: 'Total points outstanding', val: records.reduce((s, r) => s + r.points, 0).toLocaleString() },
            { label: 'Total redeemed (all time)', val: records.reduce((s, r) => s + r.total_redeemed, 0).toLocaleString() },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: GOLD }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Client list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontWeight: 700 }}>No loyalty records yet</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Enable the program and points will be awarded automatically after each visit.</p>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Client', 'Points', 'Earned', 'Redeemed', ''].map(h => <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>)}
            </div>
            {records.map(r => (
              <div key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px', padding: '14px 18px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{r.client_name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{r.client_phone}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: r.points >= (settings.loyalty_redeem_threshold || 100) ? '#4ade80' : GOLD }}>{r.points}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{r.total_earned}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{r.total_redeemed}</div>
                  <button onClick={() => setAdjusting(adjusting === r.id ? null : r.id)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600 }}>Adjust</button>
                </div>
                {adjusting === r.id && (
                  <div style={{ padding: '0 18px 14px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="e.g. +50 or -100" style={{ ...inputStyle, width: 120 }} />
                      <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Reason (optional)" style={{ ...inputStyle, flex: 1, minWidth: 140 }} />
                      <button onClick={() => handleAwardPoints(r)} style={{ background: `linear-gradient(135deg,#2a1f08,${GOLD})`, border: 'none', borderRadius: 8, color: '#0a0a0a', fontWeight: 700, fontSize: 12, padding: '8px 16px', cursor: 'pointer' }}>Apply</button>
                      <button onClick={() => setAdjusting(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
