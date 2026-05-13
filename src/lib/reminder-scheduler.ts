import { createServiceClient } from '@/lib/supabase-server'
import { sendSMS } from '@/lib/twilio'
import { get48hMessage, get24hMessage, get2hMessage } from '@/lib/sms-templates'
import { format } from 'date-fns'

export async function processReminders() {
  const supabase = createServiceClient()

  const now = new Date()
  const windowEnd = new Date(now.getTime() + 60 * 60 * 1000)

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select(`
      *,
      appointments (
        client_name,
        client_phone,
        service,
        scheduled_at,
        salon_id,
        salons (
          name,
          plan,
          reminders_sent_this_month
        )
      )
    `)
    .eq('status', 'pending')
    .gte('scheduled_for', now.toISOString())
    .lte('scheduled_for', windowEnd.toISOString())

  if (error || !reminders) {
    console.error('Error fetching reminders:', error)
    return { sent: 0, errors: [] }
  }

  const results = { sent: 0, errors: [] as string[] }

  for (const reminder of reminders) {
    const apt = reminder.appointments as any
    const salon = apt.salons

    if (salon.plan === 'free' && salon.reminders_sent_this_month >= 20) {
      console.log('Free plan limit reached for salon')
      continue
    }

    const apptDate = new Date(apt.scheduled_at)
    let message = ''

    if (reminder.reminder_type === '48h') {
      message = get48hMessage(
        apt.client_name,
        apt.service,
        format(apptDate, 'EEEE MMM d'),
        format(apptDate, 'h:mm a'),
        salon.name
      )
    } else if (reminder.reminder_type === '24h') {
      message = get24hMessage(
        apt.client_name,
        apt.service,
        format(apptDate, 'h:mm a'),
        salon.name
      )
    } else {
      message = get2hMessage(
        apt.client_name,
        apt.service,
        format(apptDate, 'h:mm a'),
        salon.name
      )
    }

    try {
      const { sid } = await sendSMS(apt.client_phone, message)

      await supabase
        .from('reminders')
        .update({
          status: 'sent',
          sent_at: now.toISOString(),
          twilio_sid: sid,
        })
        .eq('id', reminder.id)

      await supabase
        .from('salons')
        .update({
          reminders_sent_this_month: salon.reminders_sent_this_month + 1,
        })
        .eq('id', apt.salon_id)

      results.sent++
    } catch (e: any) {
      console.error('SMS send error:', e)
      await supabase
        .from('reminders')
        .update({ status: 'failed' })
        .eq('id', reminder.id)
      results.errors.push(e.message)
    }
  }

  return results
}