import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Verify the user is logged in
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.redirect(appUrl + '/login')

  const supabase = createServiceClient()

  const { data: salon } = await supabase
    .from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return NextResponse.redirect(appUrl + '/settings?stripe_error=salon_not_found')

  const { data: settings } = await supabase
    .from('booking_settings').select('stripe_account_id').eq('salon_id', salon.id).single()

  let accountId = settings?.stripe_account_id

  // Create a new Express account if they don't have one yet
  if (!accountId) {
    const account = await stripe.accounts.create({
      controller: {
        stripe_dashboard: { type: 'express' },
        fees: { payer: 'application' },
        losses: { payments: 'application' },
      },
    })
    accountId = account.id

    await supabase.from('booking_settings')
      .update({ stripe_account_id: accountId })
      .eq('salon_id', salon.id)
  }

  // Create the onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: appUrl + '/api/stripe/connect',
    return_url: appUrl + '/api/stripe/connect/callback?salon_id=' + salon.id + '&account_id=' + accountId,
    type: 'account_onboarding',
  })

  return NextResponse.redirect(accountLink.url)
}
