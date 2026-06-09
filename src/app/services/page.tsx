'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

const GOLD = '#c9a84c'

type Service = { id: string; name: string; duration_minutes: number; price: number; description: string; active: boolean; category: string }


export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name:'', duration_minutes:60, price:0, description:'', category:'General' })

  useEffect(() => { document.title = 'Services | SalonPing'; loadServices() }, [])

  async function loadServices() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()
    const { data } = await supabase.from('services').select('*').eq('salon_id', salon?.id).order('name')
    setServices(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.name) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()
    if (editingId) {
      await supabase.from('services').update({ ...form, active: true }).eq('id', editingId)
    } else {
      await supabase.from('services').insert({ ...form, salon_id: salon?.id, active: true })
    }
    setForm({ name:'', duration_minutes:60, price:0, description:'', category:'General' })
    setShowForm(false); setEditingId(null)
    await loadServices()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('services').delete().eq('id', id)
    setServices(services.filter(s => s.id !== id))
  }

  function startEdit(s: Service) {
    setForm({ name: s.name, duration_minutes: s.duration_minutes, price: s.price, description: s.description, category: s.category || 'General' })
    setEditingId(s.id); setShowForm(true)
  }

  const inputStyle = { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:14, color:'#fff', outline:'none', boxSizing:'border-box' as const }

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#fff'}}>
      <NavBar />

      <div style={{maxWidth:900, margin:'0 auto', padding:'40px 24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28}}>
          <div>
            <h1 style={{fontSize:26, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.5px'}}>Services</h1>
            <p style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:4}}>{services.length} services in your menu</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name:'', duration_minutes:60, price:0, description:'', category:'General' }) }}
            style={{background:'linear-gradient(135deg,#2a1f08,#c9a84c)', color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'10px 20px', borderRadius:10, border:'none', cursor:'pointer'}}>
            + Add Service
          </button>
        </div>

        {showForm && (
          <div style={{background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:16, padding:24, marginBottom:24}}>
            <h3 style={{fontSize:15, fontWeight:700, color:GOLD, margin:'0 0 18px'}}>{editingId ? 'Edit Service' : 'New Service'}</h3>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14}}>
              <div>
                <label style={{fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6}}>Service Name</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Haircut & Style" />
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6}}>Duration (minutes)</label>
                <input style={inputStyle} type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: parseInt(e.target.value)})} />
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6}}>Price (CAD)</label>
                <input style={inputStyle} type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6}}>Description (optional)</label>
                <input style={inputStyle} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Short description..." />
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6}}>Category</label>
                <input style={inputStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Hair, Nails, Lashes, Waxing" />
              </div>
            </div>
            <div style={{display:'flex', gap:10}}>
              <button onClick={handleSave} disabled={!form.name || saving}
                style={{background:'linear-gradient(135deg,#2a1f08,#c9a84c)', color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'10px 22px', borderRadius:10, border:'none', cursor:'pointer', opacity: saving ? 0.6 : 1}}>
                {saving ? 'Saving...' : editingId ? 'Update Service' : 'Add Service'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                style={{background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)', fontSize:13, padding:'10px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{textAlign:'center', padding:60, color:'rgba(255,255,255,0.3)'}}>Loading...</div>
        ) : services.length === 0 ? (
          <div style={{textAlign:'center', padding:80, background:'rgba(255,255,255,0.02)', borderRadius:16, border:'1px dashed rgba(255,255,255,0.1)'}}>
            <div style={{fontSize:40, marginBottom:16}}>✅</div>
            <h3 style={{color:'#fff', margin:'0 0 8px', fontWeight:700}}>No services yet</h3>
            <p style={{color:'rgba(255,255,255,0.4)', fontSize:13}}>Add your first service to start accepting bookings</p>
          </div>
        ) : (
          <div>
            {Array.from(new Set(services.map(s => s.category || 'General'))).map(cat => (
              <div key={cat} style={{marginBottom:24}}>
                <div style={{fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, paddingBottom:6, borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{cat}</div>
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  {services.filter(s => (s.category || 'General') === cat).map(s => (
                    <div key={s.id} style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700, color:'#fff', fontSize:15, marginBottom:4}}>{s.name}</div>
                        {s.description && <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:6}}>{s.description}</div>}
                        <div style={{display:'flex', gap:16}}>
                          <span style={{fontSize:12, color:'rgba(255,255,255,0.4)'}}>⏱ {s.duration_minutes} min</span>
                          <span style={{fontSize:12, fontWeight:700, color:GOLD}}>${s.price} CAD</span>
                        </div>
                      </div>
                      <div style={{display:'flex', gap:8, marginLeft:20}}>
                        <button onClick={() => startEdit(s)} style={{padding:'7px 14px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:8, color:GOLD, fontSize:12, fontWeight:600, cursor:'pointer'}}>Edit</button>
                        <button onClick={() => handleDelete(s.id)} style={{padding:'7px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#f87171', fontSize:12, fontWeight:600, cursor:'pointer'}}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
