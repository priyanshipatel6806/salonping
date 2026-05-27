'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })

  useEffect(() => {
    async function loadSalon() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: salon } = await supabase
        .from('salons').select('*').eq('owner_id', user?.id).single()
      if (salon) setForm({ name: salon.name || '', phone: salon.phone || '' })
    }
    loadSalon()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('salons')
      .update({ name: form.name, phone: form.phone })
      .eq('owner_id', user?.id)
    setSaved(true)
    setLoading(false)
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
            <a href="/customise" className="text-blue-200 hover:text-white text-sm transition-colors">Customise</a>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your salon information and preferences</p>
        </div>

        {/* Salon info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>
              <span className="text-lg">🏪</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Salon Information</h2>
              <p className="text-xs text-gray-400">This appears in your SMS reminders</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Salon Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="My Beautiful Salon"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 226 555 0123"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
              />
              <p className="text-xs text-gray-400 mt-1.5">We'll send you alerts when clients reschedule</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
            >
              {loading ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* SMS preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>
              <span className="text-lg">💬</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">SMS Reminders</h2>
              <p className="text-xs text-gray-400">Sent automatically to your clients</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: '48h', color: 'bg-blue-50 text-blue-700 border-blue-100', msg: 'Hi [Name]! Friendly reminder: your [Service] appointment at [Salon] is in 2 days. Reply STOP to unsubscribe.' },
              { label: '24h', color: 'bg-green-50 text-green-700 border-green-100', msg: 'Hi [Name]! Your [Service] is TOMORROW. We\'ve reserved your spot — see you then! Reply STOP to unsubscribe.' },
              { label: '2h', color: 'bg-purple-50 text-purple-700 border-purple-100', msg: 'See you in 2 hours [Name]! Your [Service] is at [Time] with [Salon]. Reply STOP to unsubscribe.' },
            ].map((item) => (
              <div key={item.label} className={`flex gap-4 p-4 rounded-xl border ${item.color}`}>
                <span className="font-bold text-sm w-8 flex-shrink-0">{item.label}</span>
                <p className="text-sm leading-relaxed">{item.msg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Your Plan</h2>
              <p className="text-xs text-gray-400">Current subscription</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900">Free Plan</p>
              <p className="text-xs text-gray-500 mt-0.5">20 SMS reminders per month</p>
            </div>
            <button
              className="text-white text-sm px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all"
              style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
            >
              Upgrade — $12/mo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}