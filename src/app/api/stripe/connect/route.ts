import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ error: 'Salon not found' }, { status: 404 })

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/settings?stripe_error=not_configured`)
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'read_write',
    redirect_uri: `${appUrl}/api/stripe/connect/callback`,
    state: salon.id,
    'stripe_user[business_type]': 'individual',
    'stripe_user[country]': 'CA',
  })

  return NextResponse.redirect(`https://connect.stripe.com/oauth/authorize?${params.toString()}`)
}
