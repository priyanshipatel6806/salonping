import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendSMS } from '@/lib/twilio'
import { sendEmail } from '@/lib/resend'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const { salon_id, client_name, client_phone, service, scheduled_at } = await request.json()

    const supabase = createServiceClient()

    const { data: salon } = await supabase
      .from('salons')
      .select('*')
      .eq('id', salon_id)
      .single()

    if (!salon) return NextResponse.json({ ok: false, error: 'Salon not found' })

    const apptDate = new Date(scheduled_at)
    const { formatInTimeZone } = await import('date-fns-tz')
    const dateStr = formatInTimeZone(apptDate, 'America/Toronto', 'EEEE MMM d')
    const timeStr = formatInTimeZone(apptDate, 'America/Toronto', 'h:mm a')

    const message = `New booking at ${salon.name}! 🎉\n${client_name} booked ${service} on ${dateStr} at ${timeStr}.\nPhone: ${client_phone}`

    console.log('Salon phone:', salon.phone)
    console.log('Sending notification...')

    // Send SMS to owner if they have a phone number
    if (salon.phone) {
      const smsResult = await sendSMS(salon.phone, message)
      console.log('SMS result:', smsResult)
    } else {
      console.log('No phone number set for salon')
    }

    // Send email to owner using their stored email
    if (salon.owner_email) {
      await sendEmail(
        salon.owner_email,
        `New Booking: ${client_name} — ${service}`,
        `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
          <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
            <h1 style="color:white;margin:0;font-size:24px">💇 New Booking!</h1>
          </div>
          <h2 style="color:#1e3a5f">You have a new appointment 🎉</h2>
          <div style="background:#f0f4ff;border-radius:12px;padding:16px;margin:20px 0">
            <p style="margin:4px 0">👤 <strong>Client:</strong> ${client_name}</p>
            <p style="margin:4px 0">📱 <strong>Phone:</strong> ${client_phone}</p>
            <p style="margin:4px 0">✂️ <strong>Service:</strong> ${service}</p>
            <p style="margin:4px 0">📅 <strong>Date:</strong> ${dateStr}</p>
            <p style="margin:4px 0">⏰ <strong>Time:</strong> ${timeStr}</p>
          </div>
          <p>Log in to your dashboard to manage this appointment.</p>
        </div>
        `
      )
    }

    return NextResponse.json({ ok: true })

  } catch (e: any) {
    console.error('Notify owner error:', e.message)
    return NextResponse.json({ ok: false, error: e.message })
  }
}