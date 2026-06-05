import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salon_id, client_name, client_phone, client_email, service, scheduled_at, reminder_channel, slug } = body

    if (!salon_id || !client_name || !client_phone || !service || !scheduled_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: settings } = await supabase
      .from('booking_settings')
      .select('stripe_deposit_amount, slug, stripe_account_id')
      .eq('salon_id', salon_id)
      .single()

    const depositAmount = settings?.stripe_deposit_amount || 0
    if (depositAmount <= 0) {
      return NextResponse.json({ error: 'No deposit configured' }, { status: 400 })
    }

    const { data: salon } = await supabase
      .from('salons').select('name').eq('id', salon_id).single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const bookingSlug = slug || settings?.slug
    const salonStripeAccountId = settings?.stripe_account_id

    // Platform fee: 1% of deposit (you keep this)
    const platformFeeAmount = salonStripeAccountId
      ? Math.max(Math.round(depositAmount * 100 * 0.01), 1)
      : 0

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Deposit – ${service}`,
            description: `Booking at ${salon?.name || 'salon'} · ${new Date(scheduled_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}`,
          },
          unit_amount: depositAmount * 100,
        },
        quantity: 1,
      }],
      customer_email: client_email || undefined,
      metadata: {
        salon_id, client_name, client_phone,
        client_email: client_email || '',
        service, scheduled_at,
        reminder_channel: reminder_channel || 'sms',
      },
      success_url: `${appUrl}/book/${bookingSlug}?paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/book/${bookingSlug}?cancelled=true`,
    }

    // If salon has connected Stripe → route deposit to their account
    if (salonStripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeAmount,
        transfer_data: { destination: salonStripeAccountId },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Stripe checkout error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
