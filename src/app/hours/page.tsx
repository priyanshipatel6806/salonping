'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

const GOLD = '#c9a84c'
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

type DayHours = { day_of_week: number; is_open: boolean; start_time: string; end_time: string }

export default function HoursPage() {
  const [hours, setHours] = useState<DayHours[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { document.title = 'Working Hours | SalonPing' }, [])

  useEffect(() => { loadHours() }, [])

  async function loadHours() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()
    const { data } = await supabase.from('working_hours').select('*').eq('salon_id', salon?.id).order('day_of_week')
    setHours(data || [])
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()
    for (const h of hours) {
      await supabase.from('working_hours').update({ is_open: h.is_open, start_time: h.start_time, end_time: h.end_time })
        .eq('salon_id', salon?.id).eq('day_of_week', h.day_of_week)
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function updateHour(day: number, field: string, value: any) {
    setHours(hours.map(h => h.day_of_week === day ? {...h, [field]: value} : h))
  }

  const inputStyle = { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#fff', outline:'none' }

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#fff'}}>
      <NavBar />

      <div style={{maxWidth:700, margin:'0 auto', padding:'40px 24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28}}>
          <div>
            <h1 style={{fontSize:26, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.5px'}}>Working Hours</h1>
            <p style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:4}}>Set when you are open for bookings</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{background:'linear-gradient(135deg,#2a1f08,#c9a84c)', color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'10px 22px', borderRadius:10, border:'none', cursor:'pointer', opacity: saving ? 0.7 : 1}}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Hours'}
          </button>
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:60, color:'rgba(255,255,255,0.3)'}}>Loading...</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {hours.map(h => (
              <div key={h.day_of_week} style={{background: h.is_open ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)', border: h.is_open ? '1px solid rgba(201,168,76,0.2)' : '1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:16}}>
                <div style={{width:100, fontWeight:700, color: h.is_open ? '#fff' : 'rgba(255,255,255,0.4)', fontSize:14, flexShrink:0}}>
                  {DAYS[h.day_of_week]}
                </div>
                <button onClick={() => updateHour(h.day_of_week, 'is_open', !h.is_open)}
                  style={{width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', transition:'all .2s', flexShrink:0,
                    background: h.is_open ? GOLD : 'rgba(255,255,255,0.1)', position:'relative'}}>
                  <div style={{width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, transition:'all .2s',
                    left: h.is_open ? 23 : 3}} />
                </button>
                {h.is_open ? (
                  <div style={{display:'flex', alignItems:'center', gap:10, flex:1}}>
                    <input type="time" value={h.start_time} onChange={e => updateHour(h.day_of_week, 'start_time', e.target.value)} style={inputStyle} />
                    <span style={{color:'rgba(255,255,255,0.4)', fontSize:13}}>to</span>
                    <input type="time" value={h.end_time} onChange={e => updateHour(h.day_of_week, 'end_time', e.target.value)} style={inputStyle} />
                  </div>
                ) : (
                  <span style={{fontSize:13, color:'rgba(255,255,255,0.3)', flex:1}}>Closed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
