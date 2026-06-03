import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sc = createServiceClient()

  // Verify this appointment belongs to the owner's salon
  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ error: 'Salon not found' }, { status: 404 })

  const { data: apt } = await sc.from('appointments').select('id, salon_id, scheduled_at, status')
    .eq('id', id).single()

  if (!apt || apt.salon_id !== salon.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (apt.status !== 'confirmed') {
    return NextResponse.json({ error: 'Only confirmed appointments can be marked as no-show' }, { status: 400 })
  }

  await sc.from('appointments').update({ status: 'no_show' }).eq('id', id)

  // Cancel any pending reminders
  await sc.from('reminders').update({ status: 'cancelled' })
    .eq('appointment_id', id).eq('status', 'pending')

  // Redirect back to appointments
  return NextResponse.redirect(new URL('/appointments', request.url))
}
