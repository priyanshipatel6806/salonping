/**
 * Vapi.ai Tool Call Webhook
 *
 * Vapi calls this endpoint when the AI voice assistant needs to:
 * - get_services: list available services + prices
 * - check_availability: see if a date/time is available
 * - create_booking: actually book the appointment
 *
 * Setup in Vapi dashboard:
 * 1. Create assistant at dashboard.vapi.ai
 * 2. Add these 3 tools pointing to: https://salonping-app.vercel.app/api/vapi
 * 3. Connect your Twilio phone number to this assistant
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Vapi sends: { message: { type: 'tool-calls', toolCallList: [...] } }
    const toolCalls = body?.message?.toolCallList || []
    if (!toolCalls.length) {
      return NextResponse.json({ results: [] })
    }

    const supabase = createServiceClient()
    const results = []

    for (const call of toolCalls) {
      const { id, function: fn } = call
      const args = fn?.arguments || {}
      let result = ''

      // ── get_services ──────────────────────────────────────────────────
      if (fn?.name === 'get_services') {
        const { salon_id } = args
        const { data: services } = await supabase
          .from('services')
          .select('name, price, duration_minutes')
          .eq('salon_id', salon_id)
          .eq('active', true)
          .order('name')

        if (!services?.length) {
          result = 'No services found. Please contact the salon directly.'
        } else {
          result = services.map(s =>
            `${s.name}: $${s.price} CAD, ${s.duration_minutes} minutes`
          ).join('. ')
        }
      }

      // ── check_availability ────────────────────────────────────────────
      else if (fn?.name === 'check_availability') {
        const { salon_id, date, time } = args
        // Build ISO datetime
        const scheduled_at = new Date(`${date}T${time}:00`).toISOString()

        const { data: existing } = await supabase
          .from('appointments')
          .select('id')
          .eq('salon_id', salon_id)
          .eq('scheduled_at', scheduled_at)
          .eq('status', 'confirmed')
          .single()

        // Also check working hours
        const dayOfWeek = new Date(`${date}T${time}:00`).getDay()
        const { data: hours } = await supabase
          .from('working_hours')
          .select('is_open, start_time, end_time')
          .eq('salon_id', salon_id)
          .eq('day_of_week', dayOfWeek)
          .single()

        if (!hours?.is_open) {
          result = `Sorry, the salon is closed on ${format(new Date(`${date}T${time}:00`), 'EEEE')}s. Please choose a different day.`
        } else if (existing) {
          result = `That time slot at ${time} on ${date} is already booked. Please choose a different time.`
        } else {
          result = `Yes, ${time} on ${date} is available! Shall I go ahead and book that for you?`
        }
      }

      // ── create_booking ────────────────────────────────────────────────
      else if (fn?.name === 'create_booking') {
        const { salon_id, client_name, client_phone, service, date, time } = args

        if (!salon_id || !client_name || !client_phone || !service || !date || !time) {
          result = 'I need a few more details. Can you confirm your name, phone number, and the service you want?'
        } else {
          const scheduled_at = new Date(`${date}T${time}:00`).toISOString()
          const cancel_token = randomUUID()
          const cleanPhone = client_phone.replace(/[\s\-\(\)]/g, '')
          const e164Phone = cleanPhone.startsWith('+') ? cleanPhone : `+1${cleanPhone}`

          // Check for double booking first
          const { data: existing } = await supabase
            .from('appointments')
            .select('id')
            .eq('salon_id', salon_id)
            .eq('scheduled_at', scheduled_at)
            .eq('status', 'confirmed')
            .single()

          if (existing) {
            result = `Sorry, that slot just got taken. Would you like to try a different time?`
          } else {
            const { data: apt, error } = await supabase
              .from('appointments')
              .insert({
                salon_id,
                client_name,
                client_phone: e164Phone,
                service,
                scheduled_at,
                reminder_channel: 'sms',
                status: 'confirmed',
                cancel_token,
                booked_online: true,
              })
              .select()
              .single()

            if (error || !apt) {
              result = `I had trouble creating that booking. Please call back or book online.`
            } else {
              // Schedule reminders
              const scheduledAt = new Date(scheduled_at)
              const reminders = [
                { appointment_id: apt.id, reminder_type: '48h', scheduled_for: new Date(scheduledAt.getTime() - 48*60*60*1000).toISOString(), status: 'pending' },
                { appointment_id: apt.id, reminder_type: '24h', scheduled_for: new Date(scheduledAt.getTime() - 24*60*60*1000).toISOString(), status: 'pending' },
                { appointment_id: apt.id, reminder_type: '2h',  scheduled_for: new Date(scheduledAt.getTime() -  2*60*60*1000).toISOString(), status: 'pending' },
              ].filter(r => new Date(r.scheduled_for) > new Date())

              if (reminders.length) await supabase.from('reminders').insert(reminders)

              const appUrl = process.env.NEXT_PUBLIC_APP_URL
              result = `Perfect! I've booked your ${service} for ${format(scheduledAt, 'EEEE, MMMM d')} at ${format(scheduledAt, 'h:mm a')}. You'll receive an SMS reminder before your appointment. To cancel, visit: ${appUrl}/cancel/${cancel_token}. See you soon, ${client_name}!`
            }
          }
        }
      }

      else {
        result = `I'm not sure how to handle that. Can you please call back or book online?`
      }

      results.push({ toolCallId: id, result })
    }

    return NextResponse.json({ results })
  } catch (e: any) {
    console.error('Vapi webhook error:', e)
    return NextResponse.json({ results: [{ toolCallId: 'error', result: 'Something went wrong. Please try again.' }] })
  }
}
