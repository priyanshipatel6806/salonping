'use client'
import ChatWidget from './chat-widget'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Clock, DollarSign, Check } from 'lucide-react'

type Service = { id: string; name: string; duration_minutes: number; price: number; description: string }
type Slot = { time: string; label: string }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

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
  const [form, setForm] = useState({ name: '', phone: '', email: '', reminder_channel: 'sms' })
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug)
      loadSalon(p.slug)
    })
  }, [])

  async function loadSalon(slugVal: string) {
    const supabase = createClient()
    const { data: settings } = await supabase
      .from('booking_settings')
      .select('*, salons(*)')
      .eq('slug', slugVal)
      .single()
    if (!settings) { setLoading(false); return }
    setSalon(settings)
    const { data: svcs } = await supabase
      .from('services').select('*')
      .eq('salon_id', settings.salon_id)
      .eq('active', true)
      .order('name')
    setServices(svcs || [])
    const { data: wh } = await supabase
      .from('working_hours').select('*')
      .eq('salon_id', settings.salon_id)
      .order('day_of_week')
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
      const h = Math.floor(current / 60)
      const m = current % 60
      const label = `${h > 12 ? h - 12 : h}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
      slots.push({ time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`, label })
      current += 30
    }
    setAvailableSlots(slots)
  }

  function isDateAvailable(date: Date) {
    const dayOfWeek = date.getDay()
    const dayHours = workingHours.find(h => h.day_of_week === dayOfWeek)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dayHours?.is_open && date >= today
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  function selectDate(date: Date) {
    setSelectedDate(date)
    setSelectedSlot(null)
    if (selectedService) generateSlots(date, selectedService)
  }

  async function confirmBooking() {
    if (!salon || !selectedService || !selectedDate || !selectedSlot) return
    setBooking(true)
    const supabase = createClient()
    const scheduled_at = new Date(
      `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}T${selectedSlot.time}:00`
    ).toISOString()
    await supabase.from('appointments').insert({
      salon_id: salon.salon_id,
      client_name: form.name,
      client_phone: form.phone,
      client_email: form.email,
      service: selectedService.name,
      scheduled_at,
      reminder_channel: form.reminder_channel,
      booked_online: true,
    })
    setBooking(false)
    setBooked(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )

  if (!salon) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-gray-900">Salon not found</h1>
        <p className="text-gray-500 text-sm mt-2">This booking link may be incorrect</p>
      </div>
    </div>
  )

  if (booked) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your {selectedService?.name} appointment at <strong>{salon.salons?.name}</strong> is confirmed for{' '}
          <strong>{selectedDate?.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}</strong> at{' '}
          <strong>{selectedSlot?.label}</strong>.
        </p>
        <div className="bg-blue-50 rounded-xl p-4 text-left">
          <p className="text-xs font-semibold text-blue-800 mb-1">📱 Reminders coming your way</p>
          <p className="text-xs text-blue-600">You will receive reminders 48 hours, 24 hours, and 2 hours before your appointment via {form.reminder_channel.toUpperCase()}.</p>
        </div>
      </div>
    </div>
  )

  const primaryColor = salon.primary_color || '#1e3a5f'
  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-6 py-5" style={{background:`linear-gradient(135deg,#0f172a,${primaryColor})`}}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-white font-bold text-xl">{salon.salons?.name}</h1>
          <p className="text-blue-200 text-sm mt-1">{salon.headline}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {[{n:1,l:'Service'},{n:2,l:'Date & Time'},{n:3,l:'Your Details'}].map((s,i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= s.n ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                style={step >= s.n ? {background:`linear-gradient(135deg,#0f172a,${primaryColor})`} : {}}>
                {step > s.n ? <Check size={12} /> : s.n}
              </div>
              <span className={`text-xs font-medium ${step >= s.n ? 'text-gray-900' : 'text-gray-400'}`}>{s.l}</span>
              {i < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Step 1 — Select Service */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Select a Service</h2>
            <div className="space-y-3">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep(2) }}
                  className={`w-full text-left bg-white rounded-2xl border p-5 transition-all hover:shadow-sm ${selectedService?.id === service.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">{service.name}</div>
                      {service.description && <div className="text-sm text-gray-500 mt-0.5">{service.description}</div>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} />{service.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 flex items-center gap-0.5"><DollarSign size={14} />{service.price}</div>
                      <div className="text-xs text-gray-400">CAD</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Select Date & Time */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
              <ChevronLeft size={16} /> Back
            </button>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({length: firstDay}).map((_,i) => <div key={i} />)}
                {Array.from({length: daysInMonth}).map((_,i) => {
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i+1)
                  const available = isDateAvailable(date)
                  const isSelected = selectedDate?.toDateString() === date.toDateString()
                  return (
                    <button key={i}
                      onClick={() => available && selectDate(date)}
                      disabled={!available}
                      className={`h-9 rounded-xl text-sm font-medium transition-all ${isSelected ? 'text-white' : available ? 'hover:bg-blue-50 text-gray-900' : 'text-gray-300 cursor-not-allowed'}`}
                      style={isSelected ? {background:`linear-gradient(135deg,#0f172a,${primaryColor})`} : {}}
                    >
                      {i+1}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Available times for {selectedDate.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-xl text-sm font-medium transition-all border ${selectedSlot?.time === slot.time ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'}`}
                        style={selectedSlot?.time === slot.time ? {background:`linear-gradient(135deg,#0f172a,${primaryColor})`} : {}}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No available slots for this day.</p>
                )}
                {selectedSlot && (
                  <button
                    onClick={() => setStep(3)}
                    className="w-full mt-4 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
                    style={{background:`linear-gradient(135deg,#0f172a,${primaryColor})`}}
                  >
                    Continue →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Client Details */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
              <ChevronLeft size={16} /> Back
            </button>

            {/* Booking summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{selectedService?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{selectedDate?.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{selectedSlot?.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-medium">{selectedService?.duration_minutes} min</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2"><span className="font-semibold text-gray-900">Total</span><span className="font-bold text-gray-900">${selectedService?.price} CAD</span></div>
              </div>
            </div>

            {/* Client form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    required placeholder="Jane Smith"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    required placeholder="+1 226 555 0123"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="jane@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">How would you like your reminders?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'sms', label: '📱 SMS', desc: 'Text message' },
                      { value: 'email', label: '📧 Email', desc: 'Email reminder' },
                      { value: 'whatsapp', label: '💬 WhatsApp', desc: 'WhatsApp message' },
                    ].map(opt => (
                      <button key={opt.value}
                        onClick={() => setForm({...form, reminder_channel: opt.value})}
                        className={`p-3 rounded-xl border text-center transition-all ${form.reminder_channel === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                      >
                        <div className="text-lg">{opt.label.split(' ')[0]}</div>
                        <div className="text-xs font-semibold text-gray-900 mt-0.5">{opt.label.split(' ')[1]}</div>
                        <div className="text-xs text-gray-400">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={confirmBooking}
                  disabled={!form.name || !form.phone || booking}
                  className="w-full text-white py-3.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                  style={{background:`linear-gradient(135deg,#0f172a,${primaryColor})`}}
                >
                  {booking ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    <ChatWidget
        salonName={salon.salons?.name || ''}
        services={services}
        workingHours={workingHours}
        primaryColor={primaryColor}
      />
    </div>
  )
}