import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 400 })

    const supabase = createServiceClient()

    const { data: apt, error } = await supabase
      .from('appointments')
      .select('id, status, scheduled_at, client_name, service, salons(name)')
      .eq('cancel_token', token)
      .single()

    if (error || !apt) {
      return NextResponse.json({ ok: false, error: 'Appointment not found.' }, { status: 404 })
    }

    if (apt.status === 'cancelled') {
      return NextResponse.json({ ok: false, error: 'This appointment is already cancelled.' }, { status: 409 })
    }

    // Block cancellation if appointment is within 2 hours
    const scheduledAt = new Date(apt.scheduled_at)
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
    if (scheduledAt < twoHoursFromNow) {
      return NextResponse.json({ ok: false, error: 'Appointments cannot be cancelled within 2 hours of the scheduled time. Please call the salon directly.' }, { status: 400 })
    }

    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', apt.id)

    // Cancel any pending reminders for this appointment
    await supabase
      .from('reminders')
      .update({ status: 'cancelled' })
      .eq('appointment_id', apt.id)
      .eq('status', 'pending')

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: apt, error } = await supabase
    .from('appointments')
    .select('id, status, scheduled_at, client_name, service, salons(name)')
    .eq('cancel_token', token)
    .single()

  if (error || !apt) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true, appointment: apt })
}
