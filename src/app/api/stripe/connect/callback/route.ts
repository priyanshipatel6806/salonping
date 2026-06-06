import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

export async function GET(request: NextRequest) {
  const salonId = request.nextUrl.searchParams.get('salon_id')
  const accountId = request.nextUrl.searchParams.get('account_id')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!salonId || !accountId) {
    return NextResponse.redirect(appUrl + '/settings?stripe_error=missing_params')
  }

  try {
    // Check whether onboarding was completed
    const account = await stripe.accounts.retrieve(accountId)
    const isConnected = account.details_submitted === true

    const supabase = createServiceClient()
    await supabase.from('booking_settings')
      .update({ stripe_account_id: accountId, stripe_connected: isConnected })
      .eq('salon_id', salonId)

    if (isConnected) {
      return NextResponse.redirect(appUrl + '/settings?stripe_connected=true')
    } else {
      // Onboarding started but not finished — send them back to complete it
      return NextResponse.redirect(appUrl + '/api/stripe/connect')
    }
  } catch (e: any) {
    console.error('Stripe connect callback error:', e.message)
    return NextResponse.redirect(appUrl + '/settings?stripe_error=server_error')
  }
}
