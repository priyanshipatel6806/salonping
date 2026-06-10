import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Client Profile | SalonPing' }

const GOLD = '#c9a84c'

export default async function ClientProfilePage({ params }: { params: Promise<{ phone: string }> }) {
  const { phone: rawPhone } = await params
  const phone = decodeURIComponent(rawPhone)

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) redirect('/dashboard')

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('salon_id', salon.id)
    .eq('client_phone', phone)
    .order('scheduled_at', { ascending: false })

  if (!appointments || appointments.length === 0) notFound()

  const { data: services } = await supabase.from('services').select('name,price').eq('salon_id', salon.id)
  const priceMap: Record<string, number> = {}
  for (const s of services || []) priceMap[s.name] = s.price

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('salon_id', salon.id)
    .eq('phone', phone)
    .single()

  const client = appointments[0]
  const confirmedApts = appointments.filter(a => a.status === 'confirmed')
  const noShows = appointments.filter(a => a.status === 'no_show').length
  const totalSpend = confirmedApts.reduce((s, a) => s + (priceMap[a.service] || 0), 0)
  const serviceSet = [...new Set(confirmedApts.map(a => a.service))]

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    confirmed:  { bg: 'rgba(34,197,94,0.1)',  color: '#4ade80', label: 'Attended' },
    cancelled:  { bg: 'rgba(239,68,68,0.1)',  color: '#f87171', label: 'Cancelled' },
    no_show:    { bg: 'rgba(251,146,60,0.1)', color: '#fb923c', label: 'No-show' },
    pending:    { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', label: 'Upcoming' },
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <NavBar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        {/* Back link */}
        <Link href="/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', marginBottom: 24 }}>
          ← Back to Clients
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 26, color: '#0a0a0a', flexShrink: 0 }}>
            {client.client_name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>{client.client_name}</h1>
              {confirmedApts.length >= 5 && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: 'rgba(201,168,76,0.15)', color: GOLD }}>VIP</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{phone}</span>
              {client.client_email && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{client.client_email}</span>}
            </div>
            {profile?.birthday && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                🎂 Birthday: {new Date(profile.birthday + 'T12:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })}
              </div>
            )}
          </div>
          <a href={`/appointments/new?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(client.client_name)}`}
            style={{ background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 700, fontSize: 13, padding: '10px 18px', borderRadius: 10, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
            + Book Appointment
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Visits', value: confirmedApts.length, color: GOLD },
            { label: 'Total Spend', value: `$${totalSpend}`, color: GOLD },
            { label: 'No-shows', value: noShows, color: noShows > 0 ? '#f87171' : 'rgba(255,255,255,0.4)' },
            { label: 'Reminder Channel', value: client.reminder_channel?.toUpperCase() || 'SMS', color: 'rgba(255,255,255,0.7)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Services used */}
        {serviceSet.length > 0 && (
          <div style={{ marginBottom: 24, padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 10 }}>Services Booked</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {serviceSet.map(s => (
                <span key={s} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 100, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {profile?.notes && (
          <div style={{ marginBottom: 24, padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: `3px solid ${GOLD}`, borderRadius: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 8 }}>Notes</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.7 }}>{profile.notes}</p>
          </div>
        )}

        {/* Appointment History */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.3px' }}>Appointment History</h2>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            {appointments.map((apt, i) => {
              const sc = statusColors[apt.status] || statusColors.pending
              const date = new Date(apt.scheduled_at)
              return (
                <div key={apt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < appointments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{apt.service}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {date.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {priceMap[apt.service] > 0 && (
                      <span style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>${priceMap[apt.service]}</span>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
