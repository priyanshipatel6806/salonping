import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  // Must be the salon owner
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { data: salon } = await authClient.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ ok: false, error: 'Salon not found' }, { status: 404 })

  const body = await request.json()
  const { client_name, client_phone, client_email, service, scheduled_at, reminder_channel } = body

  if (!client_name || !client_phone || !service || !scheduled_at) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
  }

  const cleanPhone = client_phone.replace(/[\s\-\(\)]/g, '')
  const e164Phone = cleanPhone.startsWith('+') ? cleanPhone : '+1' + cleanPhone

  const supabase = createServiceClient()

  // Check for double-booking
  const { data: existing } = await supabase.from('appointments').select('id')
    .eq('salon_id', salon.id).eq('scheduled_at', scheduled_at).eq('status', 'confirmed').single()
  if (existing) return NextResponse.json({ ok: false, error: 'That time slot is already booked.' }, { status: 409 })

  const { data: apt, error } = await supabase.from('appointments').insert({
    salon_id: salon.id, client_name, client_phone: e164Phone,
    client_email: client_email || null, service, scheduled_at,
    reminder_channel: reminder_channel || 'sms',
    status: 'confirmed', booked_online: false,
  }).select().single()

  if (error || !apt) return NextResponse.json({ ok: false, error: error?.message }, { status: 400 })

  // Schedule reminders
  const scheduledAt = new Date(scheduled_at)
  const reminders = [
    { appointment_id: apt.id, reminder_type: '48h', scheduled_for: new Date(scheduledAt.getTime() - 48*60*60*1000).toISOString(), status: 'pending' },
    { appointment_id: apt.id, reminder_type: '24h', scheduled_for: new Date(scheduledAt.getTime() - 24*60*60*1000).toISOString(), status: 'pending' },
    { appointment_id: apt.id, reminder_type: '2h',  scheduled_for: new Date(scheduledAt.getTime() -  2*60*60*1000).toISOString(), status: 'pending' },
  ].filter(r => new Date(r.scheduled_for) > new Date())
  if (reminders.length) await supabase.from('reminders').insert(reminders)

  // Notify owner server-side
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  fetch(appUrl + '/api/notify-owner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
    body: JSON.stringify({ salon_id: salon.id, client_name, client_phone: e164Phone, service, scheduled_at, appointment_id: apt.id }),
  }).catch(e => console.error('notify-owner failed:', e))

  return NextResponse.json({ ok: true, appointment: apt })
}
