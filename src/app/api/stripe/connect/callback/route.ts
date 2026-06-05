import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const salonId = request.nextUrl.searchParams.get('state')
  const error = request.nextUrl.searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (error || !code || !salonId) {
    return NextResponse.redirect(`${appUrl}/settings?stripe_error=${error || 'missing_params'}`)
  }

  try {
    // Exchange code for access token
    const response = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_secret: process.env.STRIPE_SECRET_KEY!,
        code,
        grant_type: 'authorization_code',
      }).toString(),
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.redirect(`${appUrl}/settings?stripe_error=${data.error}`)
    }

    const stripeAccountId = data.stripe_user_id

    // Save to booking_settings
    const supabase = createServiceClient()
    await supabase.from('booking_settings')
      .update({ stripe_account_id: stripeAccountId, stripe_connected: true })
      .eq('salon_id', salonId)

    return NextResponse.redirect(`${appUrl}/settings?stripe_connected=true`)
  } catch (e: any) {
    return NextResponse.redirect(`${appUrl}/settings?stripe_error=server_error`)
  }
}
