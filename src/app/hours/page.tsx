'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Save } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type WorkingHour = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_open: boolean
}

export default function HoursPage() {
  const [hours, setHours] = useState<WorkingHour[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadHours() }, [])

  async function loadHours() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase
      .from('salons').select('id').eq('owner_id', user?.id).single()
    const { data } = await supabase
      .from('working_hours').select('*')
      .eq('salon_id', salon?.id)
      .order('day_of_week')
    setHours(data || [])
    setLoading(false)
  }

  function updateHour(id: string, field: string, value: any) {
    setHours(hours.map(h => h.id === id ? { ...h, [field]: value } : h))
  }

  async function saveHours() {
    setSaving(true)
    const supabase = createClient()
    for (const hour of hours) {
      await supabase.from('working_hours')
        .update({
          start_time: hour.start_time,
          end_time: hour.end_time,
          is_open: hour.is_open
        })
        .eq('id', hour.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
            <a href="/customise" className="text-blue-200 hover:text-white text-sm transition-colors">Customise</a>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Working Hours</h1>
            <p className="text-gray-500 text-sm mt-1">Set when clients can book appointments</p>
          </div>
          <button
            onClick={saveHours}
            disabled={saving}
            className="flex items-center gap-2 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
            style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
          >
            <Save size={15} />
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Hours'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {hours.map((hour) => (
                <div key={hour.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-28 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900">{DAYS[hour.day_of_week]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateHour(hour.id, 'is_open', !hour.is_open)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${hour.is_open ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hour.is_open ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="text-xs text-gray-500 w-12">{hour.is_open ? 'Open' : 'Closed'}</span>
                  </div>
                  {hour.is_open ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={hour.start_time}
                        onChange={(e) => updateHour(hour.id, 'start_time', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500"
                      />
                      <span className="text-gray-400 text-sm">to</span>
                      <input
                        type="time"
                        value={hour.end_time}
                        onChange={(e) => updateHour(hour.id, 'end_time', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <span className="text-sm text-gray-400">Closed all day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}