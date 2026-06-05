import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

const GOLD = '#c9a84c'
const NAV_LINKS = ['/dashboard|Dashboard','/appointments|Appointments','/clients|Clients','/analytics|Analytics','/services|Services','/hours|Hours','/customise|Customise','/settings|Settings']

export default async function AppointmentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
  const { data: appointments } = await supabase.from('appointments').select('*')
    .eq('salon_id', salon?.id).order('scheduled_at', { ascending: false })

  const now = new Date()
  const upcoming = appointments?.filter(a => new Date(a.scheduled_at) >= now && a.status === 'confirmed') || []
  const past = appointments?.filter(a => new Date(a.scheduled_at) < now || a.status !== 'confirmed') || []

  const statusStyle: Record<string, { bg: string; color: string; border: string; label: string }> = {
    upcoming: { bg: 'rgba(201,168,76,0.12)', color: GOLD, border: 'rgba(201,168,76,0.3)', label: 'upcoming' },
    attended:  { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.3)', label: 'attended' },
    cancelled: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)', label: 'cancelled' },
    no_show:   { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.3)', label: 'no-show' },
  }

  function AptRow({ apt }: { apt: any }) {
    const d = new Date(apt.scheduled_at)
    const isPastConfirmed = d < now && apt.status === 'confirmed'
    const isUpcoming = d >= now && apt.status === 'confirmed'
    const styleKey = isUpcoming ? 'upcoming' : isPastConfirmed ? 'attended' : apt.status
    const style = statusStyle[styleKey] || statusStyle.cancelled
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:40,height:40,borderRadius:'50%',background:`linear-gradient(135deg,#2a1f08,${GOLD})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#0a0a0a',flexShrink:0}}>
            {apt.client_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{fontWeight:600,color:'#fff',fontSize:14}}>{apt.client_name}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>{apt.service} &middot; {apt.client_phone}</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,textAlign:'right'}}>
          <div style={{marginRight:6}}>
            <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.85)'}}>
              {d.toLocaleDateString('en-CA',{month:'short',day:'numeric',timeZone:'America/Toronto'})}
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>
              {d.toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit',timeZone:'America/Toronto'})}
            </div>
          </div>
          <span style={{fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:100,background:style.bg,color:style.color,border:`1px solid ${style.border}`}}>
            {style.label}
          </span>
          {isPastConfirmed && (
            <form action={`/api/appointments/${apt.id}/no-show`} method="POST" style={{display:'inline'}}>
              <button type="submit" style={{fontSize:11,padding:'4px 10px',borderRadius:6,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',color:'#f87171',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>No-show</button>
            </form>
          )}
          {isUpcoming && (
            <form action={`/api/appointments/${apt.id}/cancel`} method="POST" style={{display:'inline'}}>
              <button type="submit" style={{fontSize:11,padding:'4px 10px',borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontWeight:600}}>Cancel</button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#fff'}}>
      <nav style={{background:'#0a0a0a',borderBottom:'1px solid rgba(201,168,76,0.15)',position:'sticky',top:0,zIndex:50}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,#2a1f08,${GOLD})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>✄</div>
            <span style={{fontWeight:800,fontSize:17,color:'#fff'}}>SalonPing</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:2}}>
            {NAV_LINKS.map(l => { const [href,label] = l.split('|'); return <a key={href} href={href} style={{color:href==='/appointments'?GOLD:'rgba(255,255,255,0.5)',fontSize:13,padding:'6px 12px',borderRadius:8,textDecoration:'none',fontWeight:href==='/appointments'?700:400}}>{label}</a> })}
            <a href="/appointments/new" style={{marginLeft:8,background:`linear-gradient(135deg,#2a1f08,${GOLD})`,color:'#0a0a0a',fontWeight:700,fontSize:13,padding:'8px 16px',borderRadius:8,textDecoration:'none'}}>+ New</a>
          </div>
        </div>
      </nav>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'40px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:900,color:'#fff',margin:0,letterSpacing:'-0.5px'}}>Appointments</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginTop:4}}>{upcoming.length} upcoming, {past.length} past</p>
          </div>
          <a href="/appointments/new" style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`,color:'#0a0a0a',fontWeight:700,fontSize:13,padding:'10px 20px',borderRadius:10,textDecoration:'none'}}>+ Add Appointment</a>
        </div>
        {upcoming.length > 0 && (
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,overflow:'hidden',marginBottom:20}}>
            <div style={{padding:'16px 24px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <h2 style={{fontSize:14,fontWeight:700,color:GOLD,margin:0}}>Upcoming</h2>
            </div>
            {upcoming.map((apt: any) => <AptRow key={apt.id} apt={apt} />)}
          </div>
        )}
        {past.length > 0 && (
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,overflow:'hidden'}}>
            <div style={{padding:'16px 24px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <h2 style={{fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.4)',margin:0}}>Past</h2>
            </div>
            {past.map((apt: any) => <AptRow key={apt.id} apt={apt} />)}
          </div>
        )}
        {!appointments?.length && (
          <div style={{textAlign:'center',padding:80,background:'rgba(255,255,255,0.02)',borderRadius:16,border:'1px dashed rgba(255,255,255,0.1)'}}>
            <div style={{fontSize:40,marginBottom:16}}>📅</div>
            <h3 style={{color:'#fff',margin:'0 0 8px',fontWeight:700}}>No appointments yet</h3>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:20}}>Add your first appointment or share your booking link</p>
            <a href="/appointments/new" style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`,color:'#0a0a0a',fontWeight:700,fontSize:13,padding:'10px 22px',borderRadius:10,textDecoration:'none',display:'inline-block'}}>+ Add Appointment</a>
          </div>
        )}
      </div>
    </div>
  )
}
