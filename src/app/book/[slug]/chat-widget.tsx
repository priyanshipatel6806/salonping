'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }
type Props = {
  salonName: string
  slug: string
  services: { name: string; price: number; duration_minutes: number; description: string }[]
  workingHours: { day_of_week: number; start_time: string; end_time: string; is_open: boolean }[]
  primaryColor: string
}

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const GOLD = '#c9a84c'

export default function ChatWidget({ salonName, slug, services, workingHours }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hi! ✦ I'm the virtual assistant for **${salonName}**. Ask me about our services, pricing, or availability.`,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages); setInput(''); setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, slug }),
      })
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.message }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I'm having trouble right now. Please contact the salon directly.' }])
    }
    setLoading(false)
  }

  function fmt(s: string) { return s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-black shadow-lg flex items-center justify-center hover:opacity-90 transition-all z-50 animate-pulse-gold"
        style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`}}
      >
        {open ? <X size={20} color="#0a0a0a" /> : <MessageCircle size={20} color="#0a0a0a" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 rounded-2xl z-50 overflow-hidden animate-fade-in-up"
          style={{height:420, background:'#0f0f0f', border:'1px solid rgba(201,168,76,0.3)', boxShadow:'0 25px 60px rgba(0,0,0,0.8)'}}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3" style={{background:'linear-gradient(135deg,#0a0a0a,#1a1205)', borderBottom:'1px solid rgba(201,168,76,0.15)'}}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a'}}>✦</div>
            <div>
              <div className="text-white font-semibold text-sm">{salonName}</div>
              <div className="text-xs" style={{color:`rgba(201,168,76,0.7)`}}>Virtual Assistant • Online</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{height:'calc(100% - 120px)'}}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={msg.role === 'user'
                    ? {background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:500, borderBottomRightRadius:4}
                    : {background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.85)', borderBottomLeftRadius:4}}
                  dangerouslySetInnerHTML={{ __html: fmt(msg.content) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl rounded-bl-sm" style={{background:'rgba(255,255,255,0.07)'}}>
                  <Loader2 size={15} className="animate-spin" style={{color:GOLD}} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="flex gap-2">
              <input
                type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything…"
                className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)'}}
              />
              <button onClick={sendMessage} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
                style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`}}>
                <Send size={14} color="#0a0a0a" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
