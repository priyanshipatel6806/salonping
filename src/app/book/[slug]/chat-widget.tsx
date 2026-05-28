'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Props = {
  salonName: string
  services: { name: string; price: number; duration_minutes: number; description: string }[]
  workingHours: { day_of_week: number; start_time: string; end_time: string; is_open: boolean }[]
  primaryColor: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function ChatWidget({ salonName, services, workingHours, primaryColor }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! 👋 I'm the virtual assistant for **${salonName}**. I can help you with information about our services, pricing, and availability. What would you like to know?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const hoursText = workingHours
    .map(h => h.is_open
      ? `${DAYS[h.day_of_week]}: ${h.start_time} - ${h.end_time}`
      : `${DAYS[h.day_of_week]}: Closed`
    ).join('\n')

  const servicesText = services
    .map(s => `${s.name}: $${s.price} CAD, ${s.duration_minutes} minutes${s.description ? ` — ${s.description}` : ''}`)
    .join('\n')

  const systemPrompt = `You are a friendly virtual assistant for ${salonName}, a hair salon.
Your job is to help clients with questions about services, pricing, availability, and booking.

Our services:
${servicesText}

Our working hours:
${hoursText}

Important rules:
- Be friendly, warm and concise
- Answer questions about services, prices and hours accurately
- Encourage clients to use the booking form on this page to book
- If asked about something you don't know, say to contact the salon directly
- Keep responses short — 2-3 sentences max
- Use emojis occasionally to be friendly
- Never make up information not provided above`

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMessage = { role: 'user' as const, content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, systemPrompt }),
      })
      const data = await response.json()
      setMessages([...newMessages, { role: 'assistant', content: data.message }])
    } catch (e) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I am having trouble responding right now. Please contact the salon directly!'
      }])
    }
    setLoading(false)
  }

  function formatMessage(content: string) {
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-all z-50"
        style={{background:`linear-gradient(135deg,#0f172a,${primaryColor})`}}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden" style={{height:'420px'}}>
          <div className="px-4 py-3 flex items-center gap-3" style={{background:`linear-gradient(135deg,#0f172a,${primaryColor})`}}>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm">💇</div>
            <div>
              <div className="text-white font-semibold text-sm">{salonName}</div>
              <div className="text-blue-200 text-xs">Virtual Assistant</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                  style={msg.role === 'user' ? {background:`linear-gradient(135deg,#0f172a,${primaryColor})`} : {}}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
                style={{background:`linear-gradient(135deg,#0f172a,${primaryColor})`}}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}