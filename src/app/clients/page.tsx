import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/calendar|Calendar','/clients|Clients','/analytics|Analytics','/services|Services','/staff|Staff','/hours|Hours','/blocked|Block-out','/waitlist|Waitlist','/loyalty|Loyalty','/customise|Customise','/settings|Settings']

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
  const { data: appointments } = await supabase.from('appointments').select('*')
    .eq('salon_id', salon?.id).order('scheduled_at', { ascending: false })
  const { data: services } = await supabase.from('services').select('name,price').eq('salon_id', salon?.id)
  const { data: profiles } = await supabase.from('client_profiles').select('phone,notes,birthday').eq('salon_id', salon?.id)
  const profileMap: Record<string, { notes?: string; birthday?: string }> = {}
  for (const p of profiles || []) profileMap[p.phone] = { notes: p.notes, birthday: p.birthday }

  const priceMap: Record<string, number> = {}
  for (const s of services || []) priceMap[s.name] = s.price

  const clientMap: Record<string, {
    name: string; phone: string; email: string;
    visits: number; lastVisit: string; services: string[]; totalSpend: number;
    upcoming: number; channel: string; noShows: number; notes?: string; birthday?: string;
  }> = {}

  for (const apt of appointments || []) {
    const key = apt.client_phone
    if (!clientMap[key]) {
      clientMap[key] = { name: apt.client_name, phone: apt.client_phone, email: apt.client_email || '',
        visits: 0, lastVisit: apt.scheduled_at, services: [], totalSpend: 0, upcoming: 0, channel: apt.reminder_channel || 'sms', noShows: 0,
        notes: profileMap[apt.client_phone]?.notes, birthday: profileMap[apt.client_phone]?.birthday }
    }
    const c = clientMap[key]
    if (apt.status === 'confirmed') {
      c.visits++
      c.totalSpend += priceMap[apt.service] || 0
      if (!c.services.includes(apt.service)) c.services.push(apt.service)
      if (new Date(apt.scheduled_at) >= new Date()) c.upcoming++
    }
    if (apt.status === 'no_show') c.noShows++
    if (new Date(apt.scheduled_at) > new Date(c.lastVisit)) c.lastVisit = apt.scheduled_at
  }

  const clients = Object.values(clientMap).sort((a, b) => b.visits - a.visits)
  const totalRevenue = clients.reduce((s, c) => s + c.totalSpend, 0)
  const repeatClients = clients.filter(c => c.visits > 1).length

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#fff'}}>
      <nav style={{background:'#0a0a0a', borderBottom:'1px solid rgba(201,168,76,0.15)', position:'sticky', top:0, zIndex:50}}>
        <div style={{maxWidth:1200, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,#2a1f08,${GOLD})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16}}>{'✄'}</div>
            <span style={{fontWeight:800, fontSize:17, color:'#fff'}}>SalonPing</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:2}}>
            {NAV.map(l => { const [href,label] = l.split('|'); return <a key={href} href={href} style={{color: href==='/clients' ? GOLD : 'rgba(255,255,255,0.5)', fontSize:13, padding:'6px 12px', borderRadius:8, textDecoration:'none', fontWeight: href==='/clients' ? 700 : 400}}>{label}</a> })}
            <a href="/appointments/new" style={{marginLeft:8, background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'8px 16px', borderRadius:8, textDecoration:'none'}}>{'+ New'}</a>
          </div>
        </div>
      </nav>

      <div style={{maxWidth:1200, margin:'0 auto', padding:'32px 16px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12}}>
          <div>
            <h1 style={{fontSize:24, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.5px'}}>Clients</h1>
            <p style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:4}}>{clients.length} unique clients in your database</p>
          </div>
          <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(['Name,Phone,Email,Visits,Total Spend,No-shows,Last Visit,Services',...clients.map(c=>[c.name,c.phone,c.email,c.visits,c.totalSpend,c.noShows,new Date(c.lastVisit).toLocaleDateString('en-CA'),c.services.join(';')].map(f=>`"${f}"`).join(','))].join('\n'))}`}
            download="clients.csv"
            style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:600, padding:'9px 16px', textDecoration:'none', display:'inline-block'}}>
            ↓ Export CSV
          </a>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:28}}>
          {[
            {label:'Total Clients', val:clients.length, sub:'all time'},
            {label:'Repeat Clients', val:repeatClients, sub:`${clients.length ? Math.round(repeatClients/clients.length*100) : 0}% retention`},
            {label:'Total Revenue', val:`$${totalRevenue.toLocaleString()}`, sub:'from bookings'},
            {label:'Avg. Visits', val: clients.length ? (clients.reduce((s,c)=>s+c.visits,0)/clients.length).toFixed(1) : '0', sub:'per client'},
            {label:'No-shows (total)', val: clients.reduce((s,c)=>s+c.noShows,0), sub:'all time'},
          ].map(s => (
            <div key={s.label} style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'18px 20px'}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:8}}>{s.label}</div>
              <div style={{fontSize:28, fontWeight:900, color:GOLD, letterSpacing:'-0.5px'}}>{s.val}</div>
              <div style={{fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4}}>{s.sub}</div>
            </div>
          ))}
        </div>
        {clients.length === 0 ? (
          <div style={{textAlign:'center', padding:'80px 24px', background:'rgba(255,255,255,0.02)', borderRadius:16, border:'1px dashed rgba(255,255,255,0.1)'}}>
            <div style={{fontSize:40, marginBottom:16}}>{'👥'}</div>
            <h3 style={{color:'#fff', margin:'0 0 8px', fontWeight:700}}>No clients yet</h3>
            <p style={{color:'rgba(255,255,255,0.4)', fontSize:13}}>Clients appear here once they book via your booking page or you add appointments manually.</p>
          </div>
        ) : (
          <div style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, overflow:'hidden'}}>
            <div style={{display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1fr 1fr 1fr', gap:0, padding:'12px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              {['Client','Contact','Visits','Total Spend','No-shows','Last Visit','Services'].map(h => (
                <div key={h} style={{fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.5px'}}>{h}</div>
              ))}
            </div>
            {clients.map((c, i) => (
              <div key={c.phone}>
              <div style={{display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1fr 1fr 1fr', gap:0, padding:'16px 24px', borderBottom: i < clients.length-1 && !c.notes && !c.birthday ? '1px solid rgba(255,255,255,0.04)' : 'none'}}>
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <div style={{width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,#2a1f08,${GOLD})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#0a0a0a', flexShrink:0}}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontWeight:600, color:'#fff', fontSize:14}}>{c.name}</div>
                    {c.upcoming > 0 && <span style={{fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:100, background:'rgba(201,168,76,0.15)', color:GOLD}}>{c.upcoming} upcoming</span>}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:13, color:'rgba(255,255,255,0.75)'}}>{c.phone}</div>
                  {c.email && <div style={{fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2}}>{c.email}</div>}
                </div>
                <div style={{display:'flex', alignItems:'center'}}>
                  <span style={{fontSize:16, fontWeight:700, color: c.visits >= 3 ? GOLD : '#fff'}}>{c.visits}</span>
                  {c.visits >= 5 && <span style={{marginLeft:6, fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:100, background:'rgba(201,168,76,0.15)', color:GOLD}}>VIP</span>}
                </div>
                <div style={{display:'flex', alignItems:'center'}}>
                  <span style={{fontSize:14, fontWeight:600, color: c.totalSpend > 0 ? GOLD : 'rgba(255,255,255,0.35)'}}>{c.totalSpend > 0 ? `$${c.totalSpend}` : '—'}</span>
                </div>
                <div style={{display:'flex', alignItems:'center'}}>
                  {c.noShows > 0
                    ? <span style={{fontSize:12, fontWeight:700, padding:'3px 8px', borderRadius:100, background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.25)'}}>{c.noShows} no-show{c.noShows > 1 ? 's' : ''}</span>
                    : <span style={{fontSize:12, color:'rgba(255,255,255,0.2)'}}>—</span>
                  }
                </div>
                <div style={{display:'flex', alignItems:'center', fontSize:13, color:'rgba(255,255,255,0.55)'}}>
                  {new Date(c.lastVisit).toLocaleDateString('en-CA', {month:'short', day:'numeric', year:'numeric'})}
                </div>
                <div style={{display:'flex', alignItems:'center', gap:4, flexWrap:'wrap'}}>
                  {c.services.slice(0,2).map(s => <span key={s} style={{fontSize:10, padding:'2px 7px', borderRadius:100, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.55)'}}>{s.length > 12 ? s.slice(0,12)+'...' : s}</span>)}
                  {c.services.length > 2 && <span style={{fontSize:10, color:'rgba(255,255,255,0.35)'}}>+{c.services.length-2}</span>}
                </div>
              </div>
              {(c.notes || c.birthday) && (
                <div style={{display:'flex', gap:12, padding:'4px 24px 12px 72px', flexWrap:'wrap', borderBottom: i < clients.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}}>
                  {c.notes && <div style={{fontSize:11, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'4px 10px', borderLeft:'2px solid rgba(201,168,76,0.4)'}}>Note: {c.notes.length > 80 ? c.notes.slice(0,80)+'...' : c.notes}</div>}
                  {c.birthday && <div style={{fontSize:11, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'4px 10px'}}>Birthday: {new Date(c.birthday + 'T12:00:00').toLocaleDateString('en-CA', {month:'long', day:'numeric'})}</div>}
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
