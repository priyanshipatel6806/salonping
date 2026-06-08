import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salon_id, client_name, client_phone, client_email, service, scheduled_at, reminder_channel, intake_answers } = body

    if (!salon_id || !client_name || !client_phone || !service || !scheduled_at) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    const cleanPhone = client_phone.replace(/[\s\-\(\)]/g, '')
    const phoneRegex = /^\+?[1-9]\d{7,14}$/
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json({ ok: false, error: 'Invalid phone number format. Please include country code e.g. +12265033362' }, { status: 400 })
    }

    if (client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)) {
      return NextResponse.json({ ok: false, error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('salon_id', salon_id)
      .eq('scheduled_at', scheduled_at)
      .eq('status', 'confirmed')
      .single()

    if (existing) {
      return NextResponse.json({ ok: false, error: 'This time slot is already booked. Please choose a different time.' }, { status: 409 })
    }

    const cancel_token = randomUUID()

    const { data: newApt, error } = await supabase
      .from('appointments')
      .insert({
        salon_id,
        client_name,
        client_phone: cleanPhone,
        client_email,
        service,
        scheduled_at,
        reminder_channel,
        booked_online: true,
        cancel_token,
      })
      .select()
      .single()

    if (error) {
      console.error('Booking error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    // Save intake answers
    if (intake_answers?.length && newApt?.id) {
      const answerRows = intake_answers
        .filter((a: any) => a.answer?.trim())
        .map((a: any) => ({ appointment_id: newApt.id, question: a.question, answer: a.answer }))
      if (answerRows.length) {
        try { await supabase.from('intake_answers').insert(answerRows) } catch (e) { console.error('intake save error:', e) }
      }
    }

    // Award loyalty points if program is enabled
    try {
      const { data: bkSettings } = await supabase
        .from('booking_settings')
        .select('loyalty_enabled, loyalty_points_per_visit')
        .eq('salon_id', salon_id).single()

      if (bkSettings?.loyalty_enabled && bkSettings.loyalty_points_per_visit > 0) {
        const pts = bkSettings.loyalty_points_per_visit
        const { data: existing } = await supabase
          .from('loyalty_points').select('id, points, total_earned')
          .eq('salon_id', salon_id).eq('client_phone', cleanPhone).single()

        if (existing) {
          await supabase.from('loyalty_points').update({
            points: existing.points + pts,
            total_earned: existing.total_earned + pts,
            updated_at: new Date().toISOString(),
          }).eq('id', existing.id)
        } else {
          await supabase.from('loyalty_points').insert({
            salon_id, client_phone: cleanPhone, client_name,
            points: pts, total_earned: pts, total_redeemed: 0,
          })
        }
        await supabase.from('loyalty_transactions').insert({
          salon_id, client_phone: cleanPhone,
          appointment_id: newApt.id, type: 'earn', points: pts,
          note: `Booking: ${service}`,
        })
      }
    } catch (le) { console.error('loyalty award error:', le) }

    // Notify salon owner server-side — never call this from the client
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    fetch(appUrl + '/api/notify-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
      body: JSON.stringify({ salon_id, client_name, client_phone: cleanPhone, service, scheduled_at, appointment_id: newApt.id }),
    }).catch(e => console.error('notify-owner failed:', e))

    return NextResponse.json({ ok: true, appointment: newApt })

  } catch (e: any) {
    console.error('Book API error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
