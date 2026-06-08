'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/calendar|Calendar','/clients|Clients','/analytics|Analytics','/services|Services','/staff|Staff','/hours|Hours','/blocked|Block-out','/customise|Customise','/settings|Settings']
const COLORS = ['#c9a84c','#3b82f6','#8b5cf6','#ec4899','#10b981','#f97316','#ef4444','#06b6d4','#84cc16','#f59e0b']

type StaffMember = { id: string; name: string; role: string; phone: string; email: string; color: string; active: boolean }

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [stats, setStats] = useState<Record<string, { count: number; revenue: number }>>({})
  const [form, setForm] = useState({ name: '', role: 'Stylist', phone: '', email: '', color: COLORS[0] })

  useEffect(() => { loadStaff() }, [])

  async function loadStaff() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
    if (!salon) { setLoading(false); return }

    const [{ data: staffData }, { data: apts }, { data: services }] = await Promise.all([
      supabase.from('staff_members').select('*').eq('salon_id', salon.id).order('name'),
      supabase.from('appointments').select('staff_id,service,status').eq('salon_id', salon.id).eq('status', 'confirmed'),
      supabase.from('services').select('name,price').eq('salon_id', salon.id),
    ])

    const priceMap: Record<string, number> = {}
    for (const s of services || []) priceMap[s.name] = s.price

    const statsMap: Record<string, { count: number; revenue: number }> = {}
    for (const a of apts || []) {
      if (a.staff_id) {
        if (!statsMap[a.staff_id]) statsMap[a.staff_id] = { count: 0, revenue: 0 }
        statsMap[a.staff_id].count++
        statsMap[a.staff_id].revenue += priceMap[a.service] || 0
      }
    }

    setStaff(staffData || [])
    setStats(statsMap)
    setLoading(false)
  }

  async function handleSave() {
    if (!form.name) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()
    if (editingId) {
      await supabase.from('staff_members').update(form).eq('id', editingId)
    } else {
      await supabase.from('staff_members').insert({ ...form, salon_id: salon?.id })
    }
    setForm({ name: '', role: 'Stylist', phone: '', email: '', color: COLORS[0] })
    setShowForm(false); setEditingId(null)
    await loadStaff()
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    const supabase = createClient()
    await supabase.from('staff_members').update({ active: !active }).eq('id', id)
    setStaff(staff.map(s => s.id === id ? { ...s, active: !active } : s))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this staff member?')) return
    const supabase = createClient()
    await supabase.from('staff_members').delete().eq('id', id)
    setStaff(staff.filter(s => s.id !== id))
  }

  function startEdit(s: StaffMember) {
    setForm({ name: s.name, role: s.role, phone: s.phone || '', email: s.email || '', color: s.color })
    setEditingId(s.id); setShowForm(true)
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: 'rgba(255,255,255,0.5)', display: 'block' as const, marginBottom: 5 }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(201,168,76,0.15)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✄</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>SalonPing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {NAV.map(l => { const [href, label] = l.split('|'); return <a key={href} href={href} style={{ color: href === '/staff' ? GOLD : 'rgba(255,255,255,0.5)', fontSize: 12, padding: '5px 10px', borderRadius: 8, textDecoration: 'none', fontWeight: href === '/staff' ? 700 : 400 }}>{label}</a> })}
            <a href="/appointments/new" style={{ marginLeft: 6, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 700, fontSize: 12, padding: '7px 14px', borderRadius: 8, textDecoration: 'none' }}>+ New</a>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Staff</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{staff.filter(s => s.active).length} active staff members</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', role: 'Stylist', phone: '', email: '', color: COLORS[0] }) }}
            style={{ background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 700, fontSize: 13, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
            + Add Staff
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>{editingId ? 'Edit Staff Member' : 'New Staff Member'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Sharma" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Stylist, Colourist, Nail Tech" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone (optional)</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 226 555 0123" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email (optional)</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="priya@salon.com" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Calendar Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer', transition: 'border 0.1s' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 10, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, border: 'none', color: '#0a0a0a', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editingId ? '✓ Save Changes' : '✓ Add Staff Member'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : staff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👩‍💼</div>
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontWeight: 700 }}>No staff members yet</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Add your team members to assign appointments and track performance.</p>
          </div>
        ) : (
          <div>
            {staff.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', marginBottom: 10, opacity: s.active ? 1 : 0.5, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {s.role}{s.phone ? ` · ${s.phone}` : ''}{!s.active ? ' · Inactive' : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {stats[s.id] && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{stats[s.id].count} appts</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>${stats[s.id].revenue.toLocaleString()} revenue</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(s)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                    <button onClick={() => toggleActive(s.id, s.active)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                      {s.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(s.id)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
