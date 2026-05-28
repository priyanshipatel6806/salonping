import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, systemPrompt } = await request.json()

    const filteredMessages = messages.filter((m: any, i: number) => {
      if (i === 0 && m.role === 'assistant') return false
      return true
    })

    if (filteredMessages.length === 0) {
      return NextResponse.json({ message: 'How can I help you today?' })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 300,
        messages: [
          { role: 'system', content: systemPrompt },
          ...filteredMessages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    })

    const data = await response.json()
    console.log('Groq status:', response.status)
    console.log('Groq data:', JSON.stringify(data))

    if (data.error) {
      console.error('Groq error:', data.error)
      return NextResponse.json({ message: 'Sorry I am having trouble right now. Please contact the salon directly!' })
    }

    const message = data.choices?.[0]?.message?.content || 'How can I help you?'
    return NextResponse.json({ message })

  } catch (e: any) {
    console.error('Chat API error:', e)
    return NextResponse.json({ message: 'Sorry I am having trouble right now!' })
  }
}