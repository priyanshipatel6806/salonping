import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salon_id, client_name, client_phone, client_email, service, scheduled_at, reminder_channel } = body

    // Validate required fields
    if (!salon_id || !client_name || !client_phone || !service || !scheduled_at) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Validate phone number format
    const cleanPhone = client_phone.replace(/[\s\-\(\)]/g, '')
    const phoneRegex = /^\+?[1-9]\d{7,14}$/
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json({ ok: false, error: 'Invalid phone number format. Please include country code e.g. +12265033362' }, { status: 400 })
    }

    // Validate email if provided
    if (client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)) {
      return NextResponse.json({ ok: false, error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check for double booking — same salon, same time slot
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

    return NextResponse.json({ ok: true, appointment: newApt })

  } catch (e: any) {
    console.error('Book API error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}