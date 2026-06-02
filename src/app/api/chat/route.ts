import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
    || request.headers.get('x-real-ip') || 'unknown'
  const { allowed } = checkRateLimit(ip, 30)
  if (!allowed) {
    return NextResponse.json({ message: 'Too many messages. Please try again later.' }, { status: 429 })
  }
  try {
    const { messages, slug } = await request.json()
    if (!slug || !Array.isArray(messages)) {
      return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
    }
    if (messages.length > 20) {
      return NextResponse.json({ message: 'Conversation too long. Please refresh.' }, { status: 400 })
    }
    const supabase = createServiceClient()
    const { data: settings } = await supabase
      .from('booking_settings').select('*, salons(*)')
      .eq('slug', slug).single()
    if (!settings) {
      return NextResponse.json({ message: 'Salon not found.' }, { status: 404 })
    }
    const { data: services } = await supabase
      .from('services').select('name,price,duration_minutes,description')
      .eq('salon_id', settings.salon_id).eq('active', true)
    const { data: hours } = await supabase
      .from('working_hours').select('*')
      .eq('salon_id', settings.salon_id).order('day_of_week')
    const salonName = settings.salons?.name || 'this salon'
    const servicesText = (services || [])
      .map((s: any) => `${s.name}: $${s.price} CAD, ${s.duration_minutes} min${s.description ? ' - ' + s.description : ''}`)
      .join('\n')
    const hoursText = (hours || [])
      .map((h: any) => h.is_open ? `${DAYS[h.day_of_week]}: ${h.start_time}-${h.end_time}` : `${DAYS[h.day_of_week]}: Closed`)
      .join('\n')
    const systemPrompt = `You are a friendly virtual assistant for ${salonName}, a hair salon.\nHelp clients with questions about services, pricing, availability, and booking.\n\nServices:\n${servicesText || 'Contact the salon.'}\n\nHours:\n${hoursText || 'Contact the salon.'}\n\nRules:\n- Be warm and concise (2-3 sentences max)\n- Only answer questions about this salon\n- Encourage booking via the form\n- Never make up information`
    const safeMessages = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .filter((_: any, i: number) => i > 0)
      .slice(-10)
    if (safeMessages.length === 0) {
      return NextResponse.json({ message: 'How can I help you today?' })
    }
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 200,
        messages: [
          { role: 'system', content: systemPrompt },
          ...safeMessages.map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 500) })),
        ],
      }),
    })
    const data = await response.json()
    if (data.error) {
      return NextResponse.json({ message: "Sorry, I'm having trouble right now. Please contact the salon directly!" })
    }
    const message = data.choices?.[0]?.message?.content || 'How can I help you?'
    return NextResponse.json({ message })
  } catch (e: any) {
    return NextResponse.json({ message: "Sorry, I'm having trouble right now!" })
  }
}
