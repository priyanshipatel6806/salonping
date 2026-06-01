import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salon_id, client_name, client_phone, client_email, service, scheduled_at, reminder_channel } = body

    const supabase = createServiceClient()

    const { data: newApt, error } = await supabase
      .from('appointments')
      .insert({ salon_id, client_name, client_phone, client_email, service, scheduled_at, reminder_channel, booked_online: true })
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