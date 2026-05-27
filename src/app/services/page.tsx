'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Trash2, Plus, Clock, DollarSign } from 'lucide-react'

type Service = {
  id: string
  name: string
  duration_minutes: number
  price: number
  description: string
  active: boolean
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    duration_minutes: 60,
    price: 0,
    description: '',
  })

  useEffect(() => { loadServices() }, [])

  async function loadServices() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase
      .from('salons').select('id').eq('owner_id', user?.id).single()
    const { data } = await supabase
      .from('services').select('*')
      .eq('salon_id', salon?.id)
      .order('created_at')
    setServices(data || [])
    setLoading(false)
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase
      .from('salons').select('id').eq('owner_id', user?.id).single()
    await supabase.from('services').insert({
      salon_id: salon?.id,
      ...form,
    })
    setForm({ name: '', duration_minutes: 60, price: 0, description: '' })
    setShowForm(false)
    setSaving(false)
    loadServices()
  }

  async function deleteService(id: string) {
    const supabase = createClient()
    await supabase.from('services').delete().eq('id', id)
    loadServices()
  }

  async function toggleService(id: string, active: boolean) {
    const supabase = createClient()
    await supabase.from('services').update({ active }).eq('id', id)
    loadServices()
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
            <a href="/hours" className="text-blue-200 hover:text-white text-sm transition-colors">Hours</a>
            <a href="/settings" className="text-blue-200 hover:text-white text-sm transition-colors">Settings</a>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-500 text-sm mt-1">Manage the services clients can book</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-all"
            style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
          >
            <Plus size={16} />
            Add Service
          </button>
        </div>

        {/* Add service form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">New Service</h2>
            <form onSubmit={addService} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    required
                    placeholder="e.g. Haircut"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (CAD)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({...form, price: parseFloat(e.target.value)})}
                      required
                      min="0"
                      step="0.01"
                      placeholder="45.00"
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (minutes)</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-3.5 text-gray-400" />
                    <select
                      value={form.duration_minutes}
                      onChange={(e) => setForm({...form, duration_minutes: parseInt(e.target.value)})}
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                    >
                      {[15,30,45,60,75,90,105,120,150,180].map(m => (
                        <option key={m} value={m}>{m} minutes</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (optional)</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Brief description"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
                  style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
                >
                  {saving ? 'Saving...' : 'Save Service'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-600 text-sm px-5 py-2.5 rounded-xl font-medium bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
          ) : services.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm" style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>
                      {service.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{service.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1"><Clock size={10} />{service.duration_minutes} min</span>
                        <span>•</span>
                        <span>${service.price} CAD</span>
                        {service.description && <><span>•</span><span>{service.description}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleService(service.id, !service.active)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${service.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {service.active ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => deleteService(service.id)}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✂️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No services yet</h3>
              <p className="text-gray-400 text-sm mb-4">Add your first service to enable client self-booking</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:opacity-90"
                style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
              >
                <Plus size={16} />
                Add first service
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}