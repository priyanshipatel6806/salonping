import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                request.headers.get('x-real-ip') || 
                'unknown'
    
    const { allowed, remaining } = checkRateLimit(ip)
    
    if (!allowed) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Too many booking attempts. Please try again in an hour.' 
      }, { status: 429 })
    }

    const body = await request.json()
    const { salon_id, client_name, client_phone, client_email, service, scheduled_at, reminder_channel } = body

    // Validate required fields
    if (!salon_id || !client_name || !client_phone || !service || !scheduled_at) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Validate phone number
    const cleanPhone = client_phone.replace(/[\s\-\(\)]/g, '')
    const phoneRegex = /^\+?[1-9]\d{7,14}$/
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid phone number. Please include country code e.g. +12265033362' 
      }, { status: 400 })
    }

    // Validate email if provided
    if (client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)) {
      return NextResponse.json({ ok: false, error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check for double booking
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('salon_id', salon_id)
      .eq('scheduled_at', scheduled_at)
      .eq('status', 'confirmed')
      .single()

    if (existing) {
      return NextResponse.json({ 
        ok: false, 
        error: 'This time slot is already booked. Please choose a different time.' 
      }, { status: 409 })
    }

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