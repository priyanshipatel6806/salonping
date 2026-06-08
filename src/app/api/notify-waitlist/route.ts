import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { sendSMS, sendWhatsApp } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { data: salon } = await authClient.from('salons').select('id, name').eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ ok: false, error: 'Salon not found' }, { status: 404 })

  const body = await request.json()
  const { entryId, phone, name, service, channel } = body

  if (!entryId || !phone || !name) {
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
  }

  const salonName = (salon as any).name || 'Your salon'
  const message = `Hi ${name}! Great news — a slot has opened up at ${salonName} for ${service}. Book now: reply or visit our booking page to grab it before it's gone!`

  try {
    if (channel === 'whatsapp') {
      await sendWhatsApp(phone, message)
    } else {
      await sendSMS(phone, message)
    }

    // Mark as notified
    const supabase = createServiceClient()
    await supabase.from('waitlist').update({ notified: true }).eq('id', entryId)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('notify-waitlist error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
