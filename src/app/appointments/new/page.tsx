'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    service: '',
    date: '',
    time: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase
      .from('salons').select('id').eq('owner_id', user?.id).single()
    const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString()
    const { error } = await supabase.from('appointments').insert({
      salon_id: salon?.id,
      client_name: form.client_name,
      client_phone: form.client_phone,
      service: form.service,
      scheduled_at,
    })
    if (!error) router.push('/appointments')
    else alert('Error: ' + error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav style={{background:'linear-gradient(135deg,#0f172a,#1e3a5f)'}} className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-base">💇</span>
            </div>
            <span className="text-white font-bold text-lg">SalonPing</span>
          </div>
          <div className="flex items-center gap-6">
  <a href="/dashboard" className="text-blue-200 hover:text-white text-sm transition-colors">Dashboard</a>
  <a href="/appointments" className="text-blue-200 hover:text-white text-sm transition-colors">Appointments</a>
  <a href="/services" className="text-blue-200 hover:text-white text-sm transition-colors">Services</a>
  <a href="/settings" className="text-blue-200 hover:text-white text-sm transition-colors">Settings</a>
</div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
          <p className="text-gray-500 text-sm mt-1">SMS reminders will be sent automatically</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client Name</label>
                <input
                  type="text"
                  name="client_name"
                  value={form.client_name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Smith"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  name="client_phone"
                  value={form.client_phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 226 555 0123"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service</label>
              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
              >
                <option value="">Select a service</option>
                <option>Haircut</option>
                <option>Hair Colour</option>
                <option>Balayage</option>
                <option>Highlights</option>
                <option>Blowout</option>
                <option>Keratin Treatment</option>
                <option>Nails</option>
                <option>Lash Extensions</option>
                <option>Brow Tint</option>
                <option>Full Face Wax</option>
                <option>Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time</label>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-700 font-medium mb-1">📱 Automatic SMS reminders</p>
              <p className="text-xs text-blue-600">Your client will receive reminders at 48 hours, 24 hours, and 2 hours before this appointment.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-xl px-4 py-3.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
            >
              {loading ? 'Saving...' : 'Save Appointment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}