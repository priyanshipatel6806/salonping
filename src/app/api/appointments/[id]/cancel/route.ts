import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()

  const { data: apt } = await supabase
    .from('appointments')
    .select('id, salon_id, salons!inner(owner_id)')
    .eq('id', id)
    .single()

  if (!apt || (apt.salons as any).owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id)

  await supabase
    .from('reminders')
    .update({ status: 'failed' })
    .eq('appointment_id', id)
    .eq('status', 'pending')

  return NextResponse.redirect(new URL('/appointments', request.url))
}
