import { createServiceClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

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