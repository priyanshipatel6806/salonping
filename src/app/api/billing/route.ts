import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { data: salon } = await authClient.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ ok: false, error: 'Salon not found' }, { status: 404 })

  const body = await request.json()
  const { appointment_id, client_name, client_phone, services, deposit_paid, notes } = body

  if (!client_name || !client_phone || !services || services.length === 0) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
  }

  const subtotal = services.reduce((sum: number, s: any) => sum + (s.price * (s.quantity || 1)), 0)
  const total_due = Math.max(0, subtotal - (deposit_paid || 0))

  const supabase = createServiceClient()
  const { data: bill, error } = await supabase.from('bills').insert({
    salon_id: salon.id,
    appointment_id: appointment_id || null,
    client_name,
    client_phone,
    services,
    subtotal,
    deposit_paid: deposit_paid || 0,
    total_due,
    notes: notes || null,
    status: total_due === 0 ? 'paid' : 'unpaid',
  }).select().single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, bill })
}

export async function GET(request: NextRequest) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { data: salon } = await authClient.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ ok: false, error: 'Salon not found' }, { status: 404 })

  const supabase = createServiceClient()
  const { data: bills } = await supabase.from('bills')
    .select('*').eq('salon_id', salon.id)
    .order('created_at', { ascending: false }).limit(100)

  return NextResponse.json({ ok: true, bills: bills || [] })
}
