import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const speechResult = formData.get('SpeechResult') as string
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  console.log('Client said:', speechResult)

  if (!speechResult) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I didn't catch that. Please call back and try again. Goodbye!</Say>
  <Hangup/>
</Response>`
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  }

  // Get AI response
  const aiResponse = await getAIResponse(speechResult)

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiResponse}</Say>
  <Gather input="speech" action="${appUrl}/api/voice/gather" method="POST" speechTimeout="3" language="en-US">
    <Say voice="Polly.Joanna">Is there anything else I can help you with?</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thank you for calling. Goodbye!</Say>
  <Hangup/>
</Response>`

  return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
}

async function getAIResponse(userMessage: string): Promise<string> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 150,
        messages: [
          {
            role: 'system',
            content: `You are a friendly phone receptionist for a hair salon called Priya's Hair Studio.
A client is calling to ask about services or book an appointment.
Keep responses SHORT — maximum 2 sentences — because this is a phone call.
Speak naturally as if talking on the phone.
Our services: Haircut $45 (60 min), Balayage $180 (180 min), Hair Colour $120 (120 min), Blowout $45 (45 min).
We are open Monday to Saturday 9am to 6pm.
If they want to book, tell them to visit our website to book online or we can take their name and call back.
Never use bullet points or markdown — just plain spoken sentences.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
      }),
    })

    const data = await response.json()
    const message = data.choices?.[0]?.message?.content || 'Thank you for calling. Please visit our website to book an appointment.'

    // Clean up for text-to-speech — remove special characters
    return message
      .replace(/[*_#]/g, '')
      .replace(/\n/g, ' ')
      .trim()

  } catch (e) {
    console.error('AI error:', e)
    return 'Thank you for calling. Please visit our website to book an appointment or call back later.'
  }
}