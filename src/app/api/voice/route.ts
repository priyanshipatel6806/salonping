import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${appUrl}/api/voice/gather" method="POST" speechTimeout="3" language="en-US">
    <Say voice="Polly.Joanna">
      Hello! Thank you for calling. I'm the virtual assistant. 
      I can help you book an appointment.
      Please tell me your name and what service you would like to book.
    </Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Please call back and try again.</Say>
</Response>`

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  })
}