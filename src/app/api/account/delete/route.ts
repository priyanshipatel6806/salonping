import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function DELETE() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sc = createServiceClient()

  // Get salon
  const { data: salon } = await sc.from('salons').select('id').eq('owner_id', user.id).single()

  if (salon) {
    // Delete all related data
    await sc.from('appointments').delete().eq('salon_id', salon.id)
    await sc.from('services').delete().eq('salon_id', salon.id)
    await sc.from('working_hours').delete().eq('salon_id', salon.id)
    await sc.from('booking_settings').delete().eq('salon_id', salon.id)
    await sc.from('blocked_times').delete().eq('salon_id', salon.id)
    await sc.from('waitlist').delete().eq('salon_id', salon.id)
    await sc.from('loyalty_points').delete().eq('salon_id', salon.id)
    await sc.from('client_profiles').delete().eq('salon_id', salon.id)
    await sc.from('staff').delete().eq('salon_id', salon.id)
    await sc.from('intake_questions').delete().eq('salon_id', salon.id)
    await sc.from('salons').delete().eq('id', salon.id)
  }

  // Sign out then delete auth user
  await supabase.auth.signOut()
  await sc.auth.admin.deleteUser(user.id)

  return NextResponse.json({ ok: true })
}
