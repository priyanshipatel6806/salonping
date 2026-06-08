import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { sendSMS } from '@/lib/twilio'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { data: salon } = await authClient.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ ok: false, error: 'Salon not found' }, { status: 404 })

  const body = await request.json()
  const supabase = createServiceClient()

  const { data: bill } = await supabase.from('bills').select('salon_id').eq('id', id).single()
  if (!bill || bill.salon_id !== salon.id) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('bills').update({ status: body.status }).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Send SMS summary to client
  const { id } = await params
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { data: salon } = await authClient.from('salons').select('id, name').eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ ok: false, error: 'Salon not found' }, { status: 404 })

  const supabase = createServiceClient()
  const { data: bill } = await supabase.from('bills').select('*').eq('id', id).single()
  if (!bill || bill.salon_id !== salon.id) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  const itemsList = (bill.services as any[]).map((s: any) => `${s.name} x${s.quantity || 1} - $${s.price * (s.quantity || 1)}`).join('\n')
  const msg = `Receipt from ${salon.name}\n${itemsList}\nSubtotal: $${bill.subtotal}\nDeposit paid: -$${bill.deposit_paid}\nTotal due: $${bill.total_due}\nThank you!`

  await sendSMS(bill.client_phone, msg)
  return NextResponse.json({ ok: true })
}
