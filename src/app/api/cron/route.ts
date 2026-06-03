import { NextRequest, NextResponse } from 'next/server'
import { processReminders, processGoogleReviewRequests } from '@/lib/reminder-scheduler'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await processReminders()
    const reviews = await processGoogleReviewRequests()
    return NextResponse.json({
      ok: true,
      sent: results.sent,
      errors: results.errors,
      review_requests_sent: reviews.sent,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}