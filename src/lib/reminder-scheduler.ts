import { createServiceClient } from '@/lib/supabase-server'
import { sendSMS } from '@/lib/twilio'
import { sendEmail, get48hEmailHtml, get24hEmailHtml, get2hEmailHtml } from '@/lib/resend'
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
        client_email,
        service,
        scheduled_at,
        salon_id,
        reminder_channel,
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
      console.log('Free plan limit reached')
      continue
    }

    const apptDate = new Date(apt.scheduled_at)
    const channel = apt.reminder_channel || 'sms'

    try {
      if (channel === 'sms') {
        let message = ''
        if (reminder.reminder_type === '48h') {
          message = get48hMessage(
            apt.client_name, apt.service,
            format(apptDate, 'EEEE MMM d'),
            format(apptDate, 'h:mm a'),
            salon.name
          )
        } else if (reminder.reminder_type === '24h') {
          message = get24hMessage(
            apt.client_name, apt.service,
            format(apptDate, 'h:mm a'),
            salon.name
          )
        } else {
          message = get2hMessage(
            apt.client_name, apt.service,
            format(apptDate, 'h:mm a'),
            salon.name
          )
        }
        const { sid } = await sendSMS(apt.client_phone, message)
        await supabase.from('reminders').update({
          status: 'sent',
          sent_at: now.toISOString(),
          twilio_sid: sid,
        }).eq('id', reminder.id)

      } else if (channel === 'email') {
        if (!apt.client_email) {
          console.log('No email for client — skipping')
          continue
        }
        let subject = ''
        let html = ''
        if (reminder.reminder_type === '48h') {
          subject = `Reminder: Your ${apt.service} appointment in 2 days`
          html = get48hEmailHtml(
            apt.client_name, apt.service,
            format(apptDate, 'EEEE MMM d'),
            format(apptDate, 'h:mm a'),
            salon.name
          )
        } else if (reminder.reminder_type === '24h') {
          subject = `Tomorrow: Your ${apt.service} appointment`
          html = get24hEmailHtml(
            apt.client_name, apt.service,
            format(apptDate, 'h:mm a'),
            salon.name
          )
        } else {
          subject = `See you in 2 hours! Your ${apt.service} appointment`
          html = get2hEmailHtml(
            apt.client_name, apt.service,
            format(apptDate, 'h:mm a'),
            salon.name
          )
        }
        await sendEmail(apt.client_email, subject, html)
        await supabase.from('reminders').update({
          status: 'sent',
          sent_at: now.toISOString(),
        }).eq('id', reminder.id)

      } else if (channel === 'whatsapp') {
        // WhatsApp coming soon — fall back to SMS for now
        let message = ''
        if (reminder.reminder_type === '48h') {
          message = get48hMessage(
            apt.client_name, apt.service,
            format(apptDate, 'EEEE MMM d'),
            format(apptDate, 'h:mm a'),
            salon.name
          )
        } else if (reminder.reminder_type === '24h') {
          message = get24hMessage(
            apt.client_name, apt.service,
            format(apptDate, 'h:mm a'),
            salon.name
          )
        } else {
          message = get2hMessage(
            apt.client_name, apt.service,
            format(apptDate, 'h:mm a'),
            salon.name
          )
        }
        const { sid } = await sendSMS(apt.client_phone, message)
        await supabase.from('reminders').update({
          status: 'sent',
          sent_at: now.toISOString(),
          twilio_sid: sid,
        }).eq('id', reminder.id)
      }

      await supabase.from('salons').update({
        reminders_sent_this_month: salon.reminders_sent_this_month + 1,
      }).eq('id', apt.salon_id)

      results.sent++

    } catch (e: any) {
      console.error('Reminder send error:', e)
      await supabase.from('reminders')
        .update({ status: 'failed' })
        .eq('id', reminder.id)
      results.errors.push(e.message)
    }
  }

  return results
}