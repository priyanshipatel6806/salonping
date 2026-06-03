'use client'
import ChatWidget from './chat-widget'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, Check, Sparkles } from 'lucide-react'

type Service = { id: string; name: string; duration_minutes: number; price: number; description: string }
type Slot = { time: string; label: string }

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const GOLD = '#c9a84c'
const DARK = '#0a0a0a'

function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{background:'linear-gradient(to right,transparent,rgba(201,168,76,0.4))'}} />
      <Sparkles size={12} style={{color:GOLD}} />
      <div className="flex-1 h-px" style={{background:'linear-gradient(to left,transparent,rgba(201,168,76,0.4))'}} />
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({length:16}).map((_,i) => ({
    left:`${i*6.25}%`, delay:`${(i*0.07).toFixed(2)}s`,
    color: i%3===0 ? GOLD : i%3===1 ? '#f5e18a' : '#fff', size: i%2===0 ? 6 : 8,
  }))
  return (
    <div className="absolute inset-x-0 top-0 overflow-hidden pointer-events-none" style={{height:'100px'}}>
      {pieces.map((p,i) => (
        <div key={i} style={{position:'absolute', left:p.left, top:0, width:p.size, height:p.size,
          borderRadius:i%3===0?'50%':'2px', background:p.color, opacity:0.9,
          animation:`confettiFall 1.2s ease ${p.delay} both`}} />
      ))}
    </div>
  )
}

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState('')
  const [salon, setSalon] = useState<any>(null)
  const [services, setServices] = useState<Service[]>([])
  const [workingHours, setWorkingHours] = useState<any[]>([])
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([])
  const [form, setForm] = useState({ name:'', phone:'', email:'', reminder_channel:'sms' })
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bookingError, setBookingError] = useState('')
  const [depositAmount, setDepositAmount] = useState(0)
  const searchParams = useSearchParams()

  useEffect(() => {
    params.then(p => { setSlug(p.slug); loadSalon(p.slug) })
  }, [])

  async function loadSalon(slugVal: string) {
    const supabase = createClient()
    const { data: settings } = await supabase
      .from('booking_settings').select('*, salons(*)')
      .eq('slug', slugVal).single()
    if (!settings) { setLoading(false); return }
    setSalon(settings)
    setDepositAmount(settings.stripe_deposit_amount || 0)
    const { data: svcs } = await supabase.from('services').select('*')
      .eq('salon_id', settings.salon_id).eq('active', true).order('name')
    setServices(svcs || [])
    const { data: wh } = await supabase.from('working_hours').select('*')
      .eq('salon_id', settings.salon_id).order('day_of_week')
    setWorkingHours(wh || [])
    setLoading(false)
  }

  function generateSlots(date: Date, service: Service) {
    const dayOfWeek = date.getDay()
    const dayHours = workingHours.find(h => h.day_of_week === dayOfWeek)
    if (!dayHours || !dayHours.is_open) { setAvailableSlots([]); return }
    const slots: Slot[] = []
    const [startH, startM] = dayHours.start_time.split(':').map(Number)
    const [endH, endM] = dayHours.end_time.split(':').map(Number)
    let current = startH * 60 + startM
    const end = endH * 60 + endM - service.duration_minutes
    while (current <= end) {
      const h = Math.floor(current / 60), m = current % 60
      const label = `${h > 12 ? h-12 : h===0 ? 12 : h}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
      slots.push({ time:`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`, label })
      current += 30
    }
    setAvailableSlots(slots)
  }

  function isDateAvailable(date: Date) {
    const dayOfWeek = date.getDay()
    const dayHours = workingHours.find(h => h.day_of_week === dayOfWeek)
    const today = new Date(); today.setHours(0,0,0,0)
    return dayHours?.is_open && date >= today
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear(), month = date.getMonth()
    return { firstDay: new Date(year,month,1).getDay(), daysInMonth: new Date(year,month+1,0).getDate() }
  }

  function selectDate(date: Date) {
    setSelectedDate(date); setSelectedSlot(null)
    if (selectedService) generateSlots(date, selectedService)
  }

  async function confirmBooking() {
    if (!salon || !selectedService || !selectedDate || !selectedSlot) return
    setBooking(true); setBookingError('')
    const scheduled_at = new Date(
      `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}T${selectedSlot.time}:00`
    ).toISOString()

    // --- Deposit flow: redirect to Stripe ---
    if (depositAmount > 0) {
      try {
        // Save booking details so we can restore them after Stripe redirect
        sessionStorage.setItem('salonping_booking', JSON.stringify({
          service: { ...selectedService },
          date: selectedDate.toISOString(),
          slot: selectedSlot,
        }))
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salon_id: salon.salon_id, client_name: form.name, client_phone: form.phone,
            client_email: form.email, service: selectedService.name, scheduled_at,
            reminder_channel: form.reminder_channel, slug }),
        })
        const data = await res.json()
        if (data.url) { window.location.href = data.url; return }
        setBookingError(data.error || 'Could not start payment. Please try again.')
      } catch { setBookingError('Something went wrong. Please try again.') }
      setBooking(false)
      return
    }

    // --- No deposit: book directly ---
    try {
      const bookResponse = await fetch('/api/book', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ salon_id:salon.salon_id, client_name:form.name, client_phone:form.phone,
          client_email:form.email, service:selectedService.name, scheduled_at, reminder_channel:form.reminder_channel }),
      })
      const bookData = await bookResponse.json()
      if (bookData.ok) {
        await fetch('/api/notify-owner', {
          method:'POST',
          headers:{'Content-Type':'application/json','x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || ''},
          body: JSON.stringify({ salon_id:salon.salon_id, client_name:form.name, client_phone:form.phone,
            service:selectedService.name, scheduled_at, appointment_id:bookData.appointment.id }),
        })
        setBooked(true)
      } else {
        setBookingError(bookData.error || 'Something went wrong. Please try again.')
      }
    } catch { setBookingError('Something went wrong. Please try again.') }
    setBooking(false)
  }

  // Handle return from Stripe after successful payment
  useEffect(() => {
    const paid = searchParams.get('paid')
    const sessionId = searchParams.get('session_id')
    if (paid === 'true' && sessionId) {
      // Fetch booking details from Stripe session metadata
      fetch(`/api/stripe/session?session_id=${sessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            const scheduledAt = new Date(data.scheduled_at)
            // Build a minimal service object for the confirmation screen
            const svc = services.find((s: any) => s.name === data.service) || { name: data.service, duration_minutes: 0, price: 0 }
            setSelectedService(svc as any)
            setSelectedDate(scheduledAt)
            // Build slot label from scheduled_at
            const h = scheduledAt.getHours(), m = scheduledAt.getMinutes()
            const label = `${h > 12 ? h-12 : h === 0 ? 12 : h}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
            setSelectedSlot({ time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, label })
          }
        })
        .catch(() => {})
      setBooked(true)
    }
    if (searchParams.get('cancelled') === 'true') setBookingError('Payment was cancelled. Please try again.')
  }, [searchParams, services])

  const accentColor = salon?.primary_color || GOLD
  const { firstDay, daysInMonth } = salon ? getDaysInMonth(currentMonth) : { firstDay:0, daysInMonth:0 }
  const salonName: string = salon?.salons?.name || ''
  const initials = salonName.split(' ').map((w:string) => w[0]).slice(0,2).join('').toUpperCase()
  const logoUrl: string | null = salon?.logo_url || null
  const coverUrl: string | null = salon?.cover_photo_url || null

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:DARK}}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto mb-3 animate-spin"
          style={{borderColor:`${GOLD} transparent ${GOLD} ${GOLD}`}} />
        <p className="text-sm" style={{color:'rgba(255,255,255,0.4)'}}>Loading your experience...</p>
      </div>
    </div>
  )

  if (!salon) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:DARK}}>
      <div className="text-center">
        <div className="text-5xl mb-4">&#10022;</div>
        <h1 className="text-xl font-bold text-white">Salon not found</h1>
        <p className="text-sm mt-2" style={{color:'rgba(255,255,255,0.4)'}}>This booking link may be incorrect.</p>
      </div>
    </div>
  )

  if (booked) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:DARK}}>
      <div className="relative w-full max-w-md">
        <Confetti />
        <div className="glass-card rounded-3xl p-10 text-center animate-fade-in-up"
          style={{border:'1px solid rgba(201,168,76,0.3)'}}>
          <div className="mx-auto mb-6 animate-scale-in" style={{width:80,height:80}}>
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" stroke={GOLD} strokeWidth="2" />
              <circle cx="40" cy="40" r="38" fill="rgba(201,168,76,0.08)" />
              <polyline points="22,42 34,54 58,28" stroke={GOLD} strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round" className="animate-check-draw" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 animate-fade-in-up" style={{animationDelay:'0.2s'}}>Confirmed!</h1>
          <p className="shimmer-text font-semibold text-lg mb-6 animate-fade-in-up" style={{animationDelay:'0.3s'}}>
            {selectedService?.name}
          </p>
          <div className="glass-card rounded-2xl p-5 mb-6 text-left space-y-3 animate-fade-in-up" style={{animationDelay:'0.4s'}}>
            {[
              {label:'Salon', value:salonName},
              {label:'Date', value:selectedDate?.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric'})},
              {label:'Time', value:selectedSlot?.label},
              {label:'Duration', value:`${selectedService?.duration_minutes} min`},
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span style={{color:'rgba(255,255,255,0.45)'}}>{row.label}</span>
                <span className="text-white font-medium">{row.value}</span>
              </div>
            ))}
            <div className="pt-2 border-t" style={{borderColor:'rgba(201,168,76,0.2)'}}>
              {depositAmount > 0 ? (
                <>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{color:'rgba(255,255,255,0.45)'}}>Deposit paid</span>
                    <span style={{color:GOLD, fontWeight:700}}>${depositAmount} CAD</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span style={{color:GOLD}}>Remaining at salon</span>
                    <span className="text-white">${(selectedService?.price || 0) - depositAmount} CAD</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm font-bold">
                  <span style={{color:GOLD}}>Total</span>
                  <span className="text-white">${selectedService?.price} CAD</span>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl px-5 py-4 animate-fade-in-up" style={{animationDelay:'0.5s',
            background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)'}}>
            <p className="text-xs font-semibold mb-1" style={{color:GOLD}}>&#10022; Reminders on their way</p>
            <p className="text-xs" style={{color:'rgba(255,255,255,0.5)'}}>
              You will receive reminders 48h, 24h, and 2h before via {form.reminder_channel.toUpperCase()}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{background:DARK}}>

      {/* HEADER */}
      <div className="relative overflow-hidden" style={{minHeight:200}}>
        {coverUrl
          ? <img src={coverUrl} alt="Salon cover" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0" style={{background:`linear-gradient(135deg,#0a0a0a 0%,#1a1205 40%,${accentColor}22 100%)`}} />
        }
        <div className="absolute inset-0" style={{background:'linear-gradient(to bottom,rgba(0,0,0,0.3) 0%,rgba(10,10,10,0.85) 100%)'}} />
        <div className="absolute top-0 inset-x-0 h-px" style={{background:`linear-gradient(to right,transparent,${GOLD},transparent)`}} />
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-8 flex items-end gap-5" style={{minHeight:200}}>
          <div className="animate-pulse-gold rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden"
            style={{width:64,height:64,background:`linear-gradient(135deg,${DARK},#2a1f08)`,border:`2px solid ${GOLD}`,color:GOLD}}>
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span>{initials || '&#10022;'}</span>}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">{salonName}</h1>
            {salon.headline && <p className="text-sm mt-1" style={{color:'rgba(255,255,255,0.55)'}}>{salon.headline}</p>}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Book your appointment online · 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP INDICATOR */}
      <div className="sticky top-0 z-20 px-6 py-3" style={{background:'rgba(10,10,10,0.9)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(201,168,76,0.1)'}}>
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {[{n:1,l:'Service'},{n:2,l:'Date & Time'},{n:3,l:'Details'}].map((s,i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={step >= s.n
                  ? {background:`linear-gradient(135deg,#2a1f08,${GOLD})`,color:'#0a0a0a'}
                  : {background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.3)'}}>
                {step > s.n ? <Check size={11} /> : s.n}
              </div>
              <span className="text-xs font-medium transition-colors" style={{color:step >= s.n ? GOLD : 'rgba(255,255,255,0.3)'}}>{s.l}</span>
              {i < 2 && <div className="w-6 h-px mx-1" style={{background:`rgba(201,168,76,${step > s.n ? '0.5' : '0.15'})`}} />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h2 className="text-lg font-bold text-white mb-2">Choose Your Service</h2>
            <p className="text-sm mb-6" style={{color:'rgba(255,255,255,0.4)'}}>Select the service you would like to book</p>
            <div className="space-y-3">
              {services.map((service) => (
                <button key={service.id} onClick={() => { setSelectedService(service); setStep(2) }}
                  className="w-full text-left rounded-2xl p-5 transition-all"
                  style={{border: selectedService?.id === service.id ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)',
                    background: selectedService?.id === service.id ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)'}}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      <div className="font-semibold text-white text-base">{service.name}</div>
                      {service.description && <div className="text-sm mt-1" style={{color:'rgba(255,255,255,0.45)'}}>{service.description}</div>}
                      <div className="flex items-center gap-1.5 mt-3">
                        <Clock size={11} style={{color:GOLD}} />
                        <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>{service.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold" style={{color:GOLD}}>${service.price}</div>
                      <div className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>CAD</div>
                    </div>
                  </div>
                  <div className="h-px mt-4 rounded transition-all"
                    style={{background:`linear-gradient(to right,${GOLD},transparent)`, opacity: selectedService?.id === service.id ? 1 : 0}} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm mb-6" style={{color:'rgba(255,255,255,0.4)'}}>
              <ChevronLeft size={16} /> Back
            </button>
            <div className="flex items-center justify-between rounded-2xl px-5 py-3 mb-6"
              style={{background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.25)'}}>
              <span className="font-semibold text-white">{selectedService?.name}</span>
              <div className="flex items-center gap-3 text-sm">
                <span style={{color:'rgba(255,255,255,0.4)'}}>{selectedService?.duration_minutes} min</span>
                <span className="font-bold" style={{color:GOLD}}>${selectedService?.price} CAD</span>
              </div>
            </div>
            <div className="rounded-2xl p-6 mb-4" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(),currentMonth.getMonth()-1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                    style={{background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.6)'}}>
                    <ChevronLeft size={15} />
                  </button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                    style={{background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.6)'}}>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-3">
                {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold py-1" style={{color:'rgba(255,255,255,0.3)'}}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({length:firstDay}).map((_,i) => <div key={i} />)}
                {Array.from({length:daysInMonth}).map((_,i) => {
                  const date = new Date(currentMonth.getFullYear(),currentMonth.getMonth(),i+1)
                  const available = isDateAvailable(date)
                  const isSelected = selectedDate?.toDateString() === date.toDateString()
                  return (
                    <button key={i} onClick={() => available && selectDate(date)} disabled={!available}
                      className="h-9 rounded-xl text-sm font-medium transition-all"
                      style={isSelected
                        ? {background:`linear-gradient(135deg,#2a1f08,${GOLD})`,color:'#0a0a0a',fontWeight:700}
                        : available ? {color:'rgba(255,255,255,0.85)'} : {color:'rgba(255,255,255,0.15)',cursor:'not-allowed'}}>
                      {i+1}
                    </button>
                  )
                })}
              </div>
            </div>
            {selectedDate && (
              <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <h3 className="font-semibold text-white mb-4">
                  Available times — {selectedDate.toLocaleDateString('en-CA',{weekday:'long',month:'short',day:'numeric'})}
                </h3>
                {availableSlots.length > 0 ? (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map(slot => (
                        <button key={slot.time} onClick={() => setSelectedSlot(slot)}
                          className="py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={selectedSlot?.time === slot.time
                            ? {background:`linear-gradient(135deg,#2a1f08,${GOLD})`,color:'#0a0a0a',fontWeight:700}
                            : {border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.75)'}}>
                          {slot.label}
                        </button>
                      ))}
                    </div>
                    {selectedSlot && (
                      <button onClick={() => setStep(3)} className="w-full mt-5 py-3.5 rounded-xl font-semibold transition-all hover:opacity-90"
                        style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`,color:'#0a0a0a'}}>
                        Continue
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm" style={{color:'rgba(255,255,255,0.35)'}}>No available slots for this day.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm mb-6" style={{color:'rgba(255,255,255,0.4)'}}>
              <ChevronLeft size={16} /> Back
            </button>
            <div className="rounded-2xl p-5 mb-6" style={{background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.25)'}}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles size={14} style={{color:GOLD}} /> Booking Summary
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  {label:'Service', value:selectedService?.name},
                  {label:'Date', value:selectedDate?.toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric'})},
                  {label:'Time', value:selectedSlot?.label},
                  {label:'Duration', value:`${selectedService?.duration_minutes} min`},
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span style={{color:'rgba(255,255,255,0.4)'}}>{row.label}</span>
                    <span className="text-white font-medium">{row.value}</span>
                  </div>
                ))}
                <GoldDivider />
                <div className="flex justify-between font-bold text-base">
                  <span style={{color:GOLD}}>Total</span>
                  <span className="text-white">${selectedService?.price} CAD</span>
                </div>
                {depositAmount > 0 && (
                  <div className="flex justify-between text-sm mt-2">
                    <span style={{color:'rgba(255,255,255,0.4)'}}>Deposit due now</span>
                    <span style={{color:GOLD, fontWeight:700}}>${depositAmount} CAD</span>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <h3 className="font-semibold text-white mb-5">Your Details</h3>
              <div className="space-y-4">
                {[
                  {key:'name', label:'Full Name', type:'text', ph:'Jane Smith'},
                  {key:'phone', label:'Phone Number', type:'tel', ph:'+1 226 555 0123', hint:'Include country code e.g. +1 226 555 0123'},
                  {key:'email', label:'Email Address', type:'email', ph:'jane@example.com'},
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-semibold mb-1.5" style={{color:'rgba(255,255,255,0.7)'}}>{f.label}</label>
                    <input type={f.type} value={(form as any)[f.key]}
                      onChange={e => setForm({...form, [f.key]: e.target.value})}
                      placeholder={f.ph}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                      style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}} />
                    {f.hint && <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.3)'}}>{f.hint}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color:'rgba(255,255,255,0.7)'}}>Reminder preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{value:'sms',emoji:'SMS'},{value:'email',emoji:'Email'},{value:'whatsapp',emoji:'WhatsApp'}].map(opt => (
                      <button key={opt.value} onClick={() => setForm({...form, reminder_channel:opt.value})}
                        className="p-3 rounded-xl text-center transition-all"
                        style={form.reminder_channel === opt.value
                          ? {background:'rgba(201,168,76,0.1)',border:`1px solid ${GOLD}`,color:GOLD}
                          : {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.5)'}}>
                        <div className="text-xs font-semibold">{opt.emoji}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {bookingError && (
                  <div className="rounded-xl px-4 py-3 text-sm" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5'}}>
                    {bookingError}
                  </div>
                )}
                <button onClick={confirmBooking} disabled={!form.name || !form.phone || booking}
                  className="w-full py-4 rounded-xl font-bold text-base transition-all hover:opacity-90 disabled:opacity-40"
                  style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`,color:'#0a0a0a'}}>
                  {booking
                    ? (depositAmount > 0 ? 'Redirecting to payment...' : 'Confirming your booking...')
                    : depositAmount > 0
                      ? `Pay $${depositAmount} Deposit & Confirm`
                      : 'Confirm Booking'
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ChatWidget salonName={salonName} slug={slug} services={services} workingHours={workingHours} primaryColor={GOLD} />
    </div>
  )
}
