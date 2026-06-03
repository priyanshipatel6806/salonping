import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    console.error('Webhook signature error:', e.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata!

    // Guard: skip if already booked (idempotency)
    const supabase = createServiceClient()
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('stripe_session_id', session.id)
      .single()

    if (existing) return NextResponse.json({ ok: true })

    // Create the appointment
    const { data: apt, error } = await supabase
      .from('appointments')
      .insert({
        salon_id: meta.salon_id,
        client_name: meta.client_name,
        client_phone: meta.client_phone,
        client_email: meta.client_email || null,
        service: meta.service,
        scheduled_at: meta.scheduled_at,
        reminder_channel: meta.reminder_channel || 'sms',
        status: 'confirmed',
        stripe_session_id: session.id,
        deposit_paid: true,
      })
      .select()
      .single()

    if (error || !apt) {
      console.error('Failed to create appointment from webhook:', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // Schedule reminders
    const scheduledAt = new Date(meta.scheduled_at)
    const reminders = [
      { type: '48h', offset: 48 * 60 * 60 * 1000 },
      { type: '24h', offset: 24 * 60 * 60 * 1000 },
      { type: '2h',  offset:  2 * 60 * 60 * 1000 },
    ]
      .map(r => ({ appointment_id: apt.id, reminder_type: r.type, scheduled_for: new Date(scheduledAt.getTime() - r.offset).toISOString(), status: 'pending' }))
      .filter(r => new Date(r.scheduled_for) > new Date())

    if (reminders.length > 0) await supabase.from('reminders').insert(reminders)

    // Notify owner
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    await fetch(`${appUrl}/api/notify-owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
      body: JSON.stringify({
        salon_id: meta.salon_id, client_name: meta.client_name, client_phone: meta.client_phone,
        service: meta.service, scheduled_at: meta.scheduled_at, appointment_id: apt.id,
      }),
    })
  }

  return NextResponse.json({ ok: true })
}
