import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/calendar|Calendar','/clients|Clients','/analytics|Analytics','/services|Services','/staff|Staff','/hours|Hours','/blocked|Block-out','/waitlist|Waitlist','/loyalty|Loyalty','/customise|Customise','/settings|Settings']

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

  const sc = createServiceClient()
  const { data: bookingSettings } = await sc.from('booking_settings').select('slug').eq('salon_id', salon?.id).single()
  const { data: services } = await sc.from('services').select('name,price').eq('salon_id', salon?.id)

  const now = new Date()
  const today = new Date(now); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay())

  const { data: todayApts } = await supabase.from('appointments').select('*')
    .eq('salon_id', salon?.id).gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', tomorrow.toISOString()).eq('status', 'confirmed').order('scheduled_at')

  const { data: monthApts } = await supabase.from('appointments').select('service,status')
    .eq('salon_id', salon?.id).gte('scheduled_at', monthStart.toISOString()).eq('status', 'confirmed')

  const { data: upcomingWeek } = await supabase.from('appointments').select('id')
    .eq('salon_id', salon?.id).gte('scheduled_at', weekStart.toISOString())
    .lt('scheduled_at', new Date(weekStart.getTime()+7*24*60*60*1000).toISOString()).eq('status', 'confirmed')

  // Revenue calculation
  const priceMap: Record<string,number> = {}
  for (const s of services || []) priceMap[s.name] = s.price
  const monthRevenue = (monthApts || []).reduce((sum, a) => sum + (priceMap[a.service] || 0), 0)

  // Top service
  const svcCount: Record<string,number> = {}
  for (const a of monthApts || []) svcCount[a.service] = (svcCount[a.service] || 0) + 1
  const topService = Object.entries(svcCount).sort((a,b)=>b[1]-a[1])[0]

  const { data: allApts } = await supabase.from('appointments').select('client_phone')
    .eq('salon_id', salon?.id)
  const uniqueClients = new Set((allApts || []).map(a => a.client_phone)).size

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://salonping-app.vercel.app'

  // Onboarding checklist
  const hasServices = (services?.length || 0) > 0
  const hasHours = true // created on signup
  const hasStripe = !!(await (async () => {
    const { data } = await supabase.from('booking_settings').select('stripe_connected').eq('salon_id', salon?.id).single()
    return data?.stripe_connected
  })())
  const hasSlug = bookingSettings?.slug && !bookingSettings.slug.startsWith('my-salon-')
  const setupDone = hasServices && hasStripe && hasSlug
  const setupSteps = [
    { done: hasServices, label: 'Add your services', href: '/services' },
    { done: true,        label: 'Set working hours', href: '/hours' },
    { done: hasStripe,   label: 'Connect Stripe (for deposits)', href: '/settings' },
    { done: !!hasSlug,   label: 'Customise your booking URL', href: '/customise' },
  ]
  const doneCount = setupSteps.filter(s => s.done).length

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#fff'}}>
      <style>{`@media(max-width:768px){.dash-stats{grid-template-columns:repeat(2,1fr)!important}.dash-main{grid-template-columns:1fr!important}}`}</style>
      <NavBar />

      <div style={{maxWidth:1200, margin:'0 auto', padding:'24px 16px'}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.5px', margin:0}}>
            {greeting}, <span style={{color:GOLD}}>{salon?.name}</span>
          </h1>
          <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4}}>
            {now.toLocaleDateString('en-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>

        {/* Onboarding checklist — hide once all done */}
        {!setupDone && (
          <div style={{background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:16, padding:'18px 24px', marginBottom:20}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
              <div>
                <div style={{fontSize:14, fontWeight:700, color:GOLD}}>🚀 Finish setting up your salon</div>
                <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2}}>{doneCount} of {setupSteps.length} steps complete</div>
              </div>
              <div style={{fontSize:11, color:'rgba(255,255,255,0.3)'}}>Disappears when done</div>
            </div>
            <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
              {setupSteps.map(s => (
                <a key={s.href} href={s.href} style={{display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:10, textDecoration:'none',
                  background: s.done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.05)',
                  border: s.done ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.1)'}}>
                  <span style={{fontSize:13}}>{s.done ? '✅' : '⬜'}</span>
                  <span style={{fontSize:12, fontWeight:600, color: s.done ? '#4ade80' : 'rgba(255,255,255,0.65)', textDecoration: s.done ? 'line-through' : 'none'}}>{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="dash-stats" style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20}}>
          {[
            {label:"Today's Appointments", val: todayApts?.length || 0, sub:'confirmed', icon:'📅'},
            {label:'Revenue This Month', val:`$${monthRevenue.toLocaleString()}`, sub:'from bookings', icon:'💰'},
            {label:'Appointments This Month', val: monthApts?.length || 0, sub:'confirmed', icon:'📊'},
            {label:'This Week', val: upcomingWeek?.length || 0, sub:'bookings', icon:'📆'},
            {label:'Total Clients', val: uniqueClients, sub:'all time', icon:'👥'},
          ].map(s => (
            <div key={s.label} style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'18px 20px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10}}>
                <span style={{fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.4}}>{s.label}</span>
                <span style={{fontSize:18}}>{s.icon}</span>
              </div>
              <div style={{fontSize:26, fontWeight:900, color:GOLD, letterSpacing:'-0.5px'}}>{s.val}</div>
              <div style={{fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4}}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="dash-main" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16}}>
          {/* Today's appointments */}
          <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, overflow:'hidden', transform:'translateZ(0)', willChange:'transform'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div>
                <h2 style={{fontSize:15, fontWeight:700, color:'#fff', margin:0}}>{"Today's Schedule"}</h2>
                <p style={{fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:3}}>{todayApts?.length || 0} appointments</p>
              </div>
              <a href="/appointments/new"
                style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:12, padding:'7px 14px', borderRadius:8, textDecoration:'none'}}>
                + Add
              </a>
            </div>
            {todayApts && todayApts.length > 0 ? (
              <div>
                {todayApts.map((apt: any) => (
                  <div key={apt.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                      <div style={{width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,#2a1f08,${GOLD})`,
                        display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#0a0a0a'}}>
                        {apt.client_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:600, color:'#fff', fontSize:14}}>{apt.client_name}</div>
                        <div style={{fontSize:12, color:'rgba(255,255,255,0.4)'}}>{apt.service}</div>
                      </div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <span style={{fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)'}}>
                        {new Date(apt.scheduled_at).toLocaleTimeString('en-CA', { hour:'2-digit', minute:'2-digit', timeZone:'America/Toronto' })}
                      </span>
                      <form action={`/api/appointments/${apt.id}/cancel`} method="POST" style={{display:'inline'}}>
                        <button type="submit" style={{fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', cursor:'pointer', fontWeight:600}}>
                          Cancel
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center', padding:'40px 24px'}}>
                <div style={{fontSize:32, marginBottom:12}}>📅</div>
                <p style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:16}}>No appointments today</p>
                <a href="/appointments/new"
                  style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:12, padding:'8px 18px', borderRadius:8, textDecoration:'none', display:'inline-block'}}>
                  + Add appointment
                </a>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            {/* Booking link */}
            {bookingSettings && (
              <div style={{background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:14, padding:20}}>
                <div style={{fontSize:13, fontWeight:700, color:GOLD, marginBottom:6}}>✦ Your Booking Page</div>
                <code style={{fontSize:11, background:'rgba(0,0,0,0.3)', padding:'5px 10px', borderRadius:6, border:'1px solid rgba(201,168,76,0.2)', color:'rgba(255,255,255,0.7)', display:'block', marginBottom:12, fontFamily:'monospace', wordBreak:'break-all'}}>
                  {appUrl}/book/{bookingSettings.slug}
                </code>
                <a href={`${appUrl}/book/${bookingSettings.slug}`} target="_blank"
                  style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:12, padding:'8px 14px', borderRadius:8, textDecoration:'none', display:'inline-block'}}>
                  View page →
                </a>
              </div>
            )}

            {/* Top service */}
            {topService && (
              <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20}}>
                <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:8}}>🏆 Top Service This Month</div>
                <div style={{fontSize:18, fontWeight:700, color:'#fff', marginBottom:4}}>{topService[0]}</div>
                <div style={{fontSize:13, color:GOLD}}>{topService[1]} bookings</div>
              </div>
            )}

            {/* Quick links */}
            <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:16}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:12}}>Quick Actions</div>
              {[
                {href:'/clients', icon:'👥', label:'View all clients'},
                {href:'/calendar', icon:'📅', label:'Calendar view'},
                {href:'/staff', icon:'👩‍💼', label:'Manage staff'},
                {href:'/services', icon:'✄', label:'Manage services'},
                {href:'/customise', icon:'✎', label:'Edit booking page'},
                {href:'/hours', icon:'⏰', label:'Update hours'},
                {href:'/blocked', icon:'🚫', label:'Block-out time'},
                {href:'/waitlist', icon:'⏳', label:'Waitlist'},
                {href:'/loyalty', icon:'⭐', label:'Loyalty points'},
                {href:'/intake', icon:'📋', label:'Intake forms'},
              ].map(item => (
                <a key={item.href} href={item.href} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', textDecoration:'none', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{fontSize:16}}>{item.icon}</span>
                  <span style={{fontSize:13, color:'rgba(255,255,255,0.65)'}}>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}