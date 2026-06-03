import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

const GOLD = '#c9a84c'

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: string }) {
  return (
    <div style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'20px 24px'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
        <span style={{fontSize:13, color:'rgba(255,255,255,0.45)', fontWeight:500}}>{label}</span>
        <span style={{fontSize:20}}>{icon}</span>
      </div>
      <div style={{fontSize:32, fontWeight:900, color:GOLD, letterSpacing:'-1px', lineHeight:1}}>{value}</div>
      <div style={{fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:6}}>{sub}</div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: salon } = await supabase.from('salons').select('*').eq('owner_id', user.id).single()
  if (!salon) {
    const { data: newSalon } = await supabase.from('salons').insert({ owner_id: user.id, name: 'My Salon' }).select().single()
    salon = newSalon
    if (newSalon) {
      const slug = 'my-salon-' + newSalon.id.substring(0, 6)
      await supabase.from('booking_settings').insert({ salon_id: newSalon.id, slug, headline: 'Book Your Appointment' })
      await supabase.from('working_hours').insert([0,1,2,3,4,5,6].map(day => ({ salon_id: newSalon.id, day_of_week: day, start_time: '09:00', end_time: '18:00', is_open: day !== 0 })))
    }
  }

  const serviceClient = createServiceClient()
  const { data: bookingSettings } = await serviceClient.from('booking_settings').select('slug').eq('salon_id', salon?.id).single()

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: todayAppointments } = await supabase.from('appointments').select('*')
    .eq('salon_id', salon?.id).gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', tomorrow.toISOString()).eq('status', 'confirmed').order('scheduled_at')

  const { data: reminders } = await supabase.from('reminders').select('id').eq('status', 'sent')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#fff'}}>
      <nav style={{background:'#0a0a0a', borderBottom:'1px solid rgba(201,168,76,0.15)', position:'sticky', top:0, zIndex:50}}>
        <div style={{maxWidth:1100, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,#2a1f08,${GOLD})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16}}>&#9986;</div>
            <span style={{fontWeight:800, fontSize:17, color:'#fff', letterSpacing:'-0.3px'}}>SalonPing</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:2}}>
            {([{h:'/dashboard',l:'Dashboard'},{h:'/appointments',l:'Appointments'},{h:'/services',l:'Services'},{h:'/hours',l:'Hours'},{h:'/customise',l:'Customise'},{h:'/settings',l:'Settings'}]).map(n => (
              <a key={n.h} href={n.h} style={{color:'rgba(255,255,255,0.5)', fontSize:13, fontWeight:500, padding:'6px 12px', borderRadius:8, textDecoration:'none'}}>{n.l}</a>
            ))}
            <a href="/appointments/new" style={{marginLeft:8, background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'8px 16px', borderRadius:8, textDecoration:'none'}}>+ New</a>
          </div>
        </div>
      </nav>

      <div style={{maxWidth:1100, margin:'0 auto', padding:'40px 24px'}}>
        <div style={{marginBottom:32}}>
          <h1 style={{fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-0.5px', margin:0}}>
            {greeting}, <span style={{color:GOLD}}>{salon?.name}</span>
          </h1>
          <p style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:6}}>
            {new Date().toLocaleDateString('en-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24}}>
          <StatCard label="Today's Appointments" value={todayAppointments?.length || 0} sub="scheduled for today" icon="&#128197;" />
          <StatCard label="Reminders This Month" value={salon?.reminders_sent_this_month || 0} sub="reminders sent" icon="&#128172;" />
          <StatCard label="Total Reminders" value={reminders?.length || 0} sub="all time" icon="&#128202;" />
        </div>

        {bookingSettings && (
          <div style={{background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:16, padding:'20px 24px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16}}>
            <div>
              <div style={{fontSize:14, fontWeight:700, color:GOLD, marginBottom:4}}>&#10022; Your Client Booking Page</div>
              <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:8}}>Share this link — clients can book appointments 24/7</p>
              <code style={{fontSize:12, background:'rgba(0,0,0,0.3)', padding:'6px 12px', borderRadius:8, border:'1px solid rgba(201,168,76,0.2)', color:'#c9a84c', fontFamily:'monospace'}}>
                {appUrl}/book/{bookingSettings.slug}
              </code>
            </div>
            <a href={`${appUrl}/book/${bookingSettings.slug}`} target="_blank"
              style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'10px 20px', borderRadius:10, textDecoration:'none'}}>
              View page
            </a>
          </div>
        )}

        <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, overflow:'hidden'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div>
              <h2 style={{fontSize:16, fontWeight:700, color:'#fff', margin:0}}>{"Today's Appointments"}</h2>
              <p style={{fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:4}}>{todayAppointments?.length || 0} scheduled</p>
            </div>
            <a href="/appointments/new"
              style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'8px 16px', borderRadius:10, textDecoration:'none'}}>
              + Add appointment
            </a>
          </div>

          {todayAppointments && todayAppointments.length > 0 ? (
            <div>
              {todayAppointments.map((apt: any) => (
                <div key={apt.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:14}}>
                    <div style={{width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg,#2a1f08,${GOLD})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#0a0a0a', flexShrink:0}}>
                      {apt.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:600, color:'#fff', fontSize:14}}>{apt.client_name}</div>
                      <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2}}>{apt.service}</div>
                    </div>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:12}}>
                    <span style={{fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.8)'}}>
                      {new Date(apt.scheduled_at).toLocaleTimeString('en-CA', { hour:'2-digit', minute:'2-digit', timeZone:'America/Toronto' })}
                    </span>
                    <span style={{fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:100, background:'rgba(201,168,76,0.12)', color:GOLD, border:'1px solid rgba(201,168,76,0.3)'}}>
                      confirmed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{textAlign:'center', padding:'60px 24px'}}>
              <div style={{fontSize:40, marginBottom:16}}>&#128197;</div>
              <h3 style={{fontSize:16, fontWeight:700, color:'#fff', margin:'0 0 8px'}}>No appointments today</h3>
              <p style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:20}}>Add your first appointment or share your booking link</p>
              <a href="/appointments/new"
                style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'10px 22px', borderRadius:10, textDecoration:'none', display:'inline-block'}}>
                + Add appointment
              </a>
            </div>
          )}
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:24}}>
          {[
            {href:'/services', icon:'✄', title:'Services', desc:'Manage your service menu and pricing'},
            {href:'/hours', icon:'⏰', title:'Hours', desc:'Set your working hours and availability'},
            {href:'/customise', icon:'✎', title:'Customise', desc:'Personalise your booking page'},
          ].map(card => (
            <a key={card.href} href={card.href} style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px', textDecoration:'none', transition:'all .15s', display:'block'}}>
              <div style={{fontSize:24, marginBottom:10}}>{card.icon}</div>
              <div style={{fontSize:14, fontWeight:700, color:'#fff', marginBottom:4}}>{card.title}</div>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.5}}>{card.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
