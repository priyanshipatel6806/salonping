import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendSMS } from '@/lib/twilio'
import { sendGmail } from '@/lib/gmail'
import { formatInTimeZone } from 'date-fns-tz'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { salon_id, client_name, client_phone, service, scheduled_at, appointment_id } = await request.json()
    const supabase = createServiceClient()
    const { data: appointment } = await supabase
      .from('appointments').select('id, salon_id')
      .eq('id', appointment_id).eq('salon_id', salon_id).single()
    if (!appointment) {
      return NextResponse.json({ ok: false, error: 'Appointment not found' }, { status: 404 })
    }
    const { data: salon } = await supabase
      .from('salons').select('*').eq('id', salon_id).single()
    if (!salon) return NextResponse.json({ ok: false, error: 'Salon not found' })
    const apptDate = new Date(scheduled_at)
    const dateStr = formatInTimeZone(apptDate, 'America/Toronto', 'EEEE MMM d')
    const timeStr = formatInTimeZone(apptDate, 'America/Toronto', 'h:mm a')
    const message = `New booking at ${salon.name}!\n${client_name} booked ${service} on ${dateStr} at ${timeStr}.\nPhone: ${client_phone}`
    if (salon.phone) {
      await sendSMS(salon.phone, message)
    }
    if (salon.owner_email) {
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL + '/dashboard'
      await sendGmail(
        salon.owner_email,
        'New Booking: ' + client_name + ' - ' + service,
        '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">' +
        '<h1 style="color:white;margin:0;font-size:24px">New Booking!</h1></div>' +
        '<h2 style="color:#1e3a5f">You have a new appointment</h2>' +
        '<div style="background:#f0f4ff;border-radius:12px;padding:16px;margin:20px 0">' +
        '<p style="margin:4px 0"><strong>Client:</strong> ' + client_name + '</p>' +
        '<p style="margin:4px 0"><strong>Phone:</strong> ' + client_phone + '</p>' +
        '<p style="margin:4px 0"><strong>Service:</strong> ' + service + '</p>' +
        '<p style="margin:4px 0"><strong>Date:</strong> ' + dateStr + '</p>' +
        '<p style="margin:4px 0"><strong>Time:</strong> ' + timeStr + '</p></div>' +
        '<a href="' + dashboardUrl + '" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;padding:10px 20px;border-radius:8px;text-decoration:none">View Dashboard</a>' +
        '</div>'
      )
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Notify owner error:', e.message)
    return NextResponse.json({ ok: false, error: e.message })
  }
}
