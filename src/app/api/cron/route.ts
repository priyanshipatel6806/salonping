import { NextRequest, NextResponse } from 'next/server'
import { processReminders, processGoogleReviewRequests, processRebookingNudges } from '@/lib/reminder-scheduler'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const results = await processReminders()
    const reviews = await processGoogleReviewRequests()
    let nudges = { sent: 0 }
    const hour = new Date().getUTCHours()
    if (hour === 10) {
      nudges = await processRebookingNudges()
    }
    return NextResponse.json({
      ok: true,
      reminders_sent: results.sent,
      errors: results.errors,
      review_requests_sent: reviews.sent,
      rebooking_nudges_sent: nudges.sent,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
