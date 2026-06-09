import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/clients|Clients','/analytics|Analytics','/services|Services','/hours|Hours','/customise|Customise','/settings|Settings']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: salon } = await supabase.from('salons').select('id,name').eq('owner_id', user.id).single()
  if (!salon) redirect('/dashboard')

  const sc = createServiceClient()
  const { data: services } = await sc.from('services').select('name,price').eq('salon_id', salon.id)
  const priceMap: Record<string,number> = {}
  for (const s of services || []) priceMap[s.name] = s.price

  const { data: allApts } = await sc.from('appointments').select('*')
    .eq('salon_id', salon.id).order('scheduled_at', { ascending: true })

  const confirmed = (allApts || []).filter(a => a.status === 'confirmed' || a.status === 'completed')
  const noShows = (allApts || []).filter(a => a.status === 'no_show')
  const cancelled = (allApts || []).filter(a => a.status === 'cancelled')

  // Revenue by month (last 6 months)
  const now = new Date()
  const monthlyRevenue: { month: string; revenue: number; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthApts = confirmed.filter(a => {
      const ad = new Date(a.scheduled_at)
      return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth()
    })
    monthlyRevenue.push({
      month: `${MONTHS[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      revenue: monthApts.reduce((s, a) => s + (priceMap[a.service] || 0), 0),
      count: monthApts.length,
    })
  }

  // Busiest hours (0-23)
  const hourCounts = Array(24).fill(0)
  for (const a of confirmed) {
    const h = new Date(a.scheduled_at).getHours()
    hourCounts[h]++
  }

  // Busiest days
  const dayCounts = Array(7).fill(0)
  for (const a of confirmed) {
    const d = new Date(a.scheduled_at).getDay()
    dayCounts[d]++
  }

  // Service breakdown
  const svcMap: Record<string,{count:number;revenue:number}> = {}
  for (const a of confirmed) {
    if (!svcMap[a.service]) svcMap[a.service] = { count: 0, revenue: 0 }
    svcMap[a.service].count++
    svcMap[a.service].revenue += priceMap[a.service] || 0
  }
  const topServices = Object.entries(svcMap).sort((a,b) => b[1].count - a[1].count).slice(0, 5)

  // Key metrics
  const totalRevenue = confirmed.reduce((s, a) => s + (priceMap[a.service] || 0), 0)
  const uniqueClients = new Set(confirmed.map(a => a.client_phone)).size
  const noShowRate = allApts && allApts.length > 0 ? Math.round(noShows.length / allApts.length * 100) : 0
  const thisMonth = confirmed.filter(a => {
    const d = new Date(a.scheduled_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const thisMonthRevenue = thisMonth.reduce((s, a) => s + (priceMap[a.service] || 0), 0)

  // Chart max
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1)
  const maxHour = Math.max(...hourCounts, 1)
  const maxDay = Math.max(...dayCounts, 1)

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <NavBar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Analytics</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>All-time performance for {salon.name}</p>
        </div>

        {/* KEY METRICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Revenue', val: `$${totalRevenue.toLocaleString()}`, sub: 'all time', color: GOLD },
            { label: 'This Month', val: `$${thisMonthRevenue.toLocaleString()}`, sub: `${thisMonth.length} appointments`, color: GOLD },
            { label: 'Total Bookings', val: confirmed.length, sub: 'confirmed', color: '#fff' },
            { label: 'Unique Clients', val: uniqueClients, sub: 'all time', color: '#fff' },
            { label: 'No-show Rate', val: `${noShowRate}%`, sub: `${noShows.length} no-shows`, color: noShowRate > 20 ? '#f87171' : noShowRate > 10 ? GOLD : '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, letterSpacing: '-0.5px' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* REVENUE CHART */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 20px' }}>Revenue — Last 6 Months</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
              {monthlyRevenue.map((m, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>${m.revenue > 0 ? m.revenue : ''}</div>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    height: `${Math.max((m.revenue / maxRevenue) * 110, m.revenue > 0 ? 4 : 0)}px`,
                    background: i === 5 ? `linear-gradient(to top,#2a1f08,${GOLD})` : 'rgba(201,168,76,0.25)',
                    minHeight: m.revenue > 0 ? 4 : 0,
                  }} />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>{m.month}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP SERVICES */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 20px' }}>Top Services</h2>
            {topServices.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topServices.map(([name, data], i) => (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: i === 0 ? 700 : 400 }}>{name}</span>
                      <span style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>{data.count} bookings · ${data.revenue}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(to right,#2a1f08,${GOLD})`, width: `${(data.count / topServices[0][1].count) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No bookings yet</p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* BUSIEST HOURS */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 20px' }}>Busiest Hours</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
              {hourCounts.map((count, h) => {
                const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h-12}p`
                const isWorking = h >= 8 && h <= 20
                return (
                  <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%', borderRadius: '2px 2px 0 0',
                      height: `${Math.max((count / maxHour) * 60, count > 0 ? 3 : 1)}px`,
                      background: count === Math.max(...hourCounts) ? GOLD : isWorking ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)',
                    }} />
                    {h % 4 === 0 && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{label}</div>}
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
              Peak: {hourCounts.indexOf(Math.max(...hourCounts))}:00 — {hourCounts.indexOf(Math.max(...hourCounts)) < 12 ? 'AM' : 'PM'}
            </p>
          </div>

          {/* BUSIEST DAYS */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 20px' }}>Busiest Days</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
              {dayCounts.map((count, d) => (
                <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  {count > 0 && <div style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>{count}</div>}
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    height: `${Math.max((count / maxDay) * 70, count > 0 ? 4 : 2)}px`,
                    background: count === Math.max(...dayCounts) ? `linear-gradient(to top,#2a1f08,${GOLD})` : 'rgba(201,168,76,0.2)',
                  }} />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: count === Math.max(...dayCounts) ? 700 : 400 }}>{DAYS[d]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOOKING BREAKDOWN */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>Booking Breakdown</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              { label: 'Confirmed', val: confirmed.length, color: GOLD, bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.2)' },
              { label: 'No-shows', val: noShows.length, color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
              { label: 'Cancelled', val: cancelled.length, color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
              { label: 'Online bookings', val: (allApts || []).filter(a => a.booked_online).length, color: '#4ade80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
