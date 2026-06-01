'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Save, ExternalLink, Upload, Image as ImageIcon } from 'lucide-react'

const TEMPLATES = [
  { id: 'modern', name: 'Modern', desc: 'Clean and professional', emoji: '✨' },
  { id: 'minimal', name: 'Minimal', desc: 'Simple and elegant', emoji: '🤍' },
  { id: 'bold', name: 'Bold', desc: 'Vibrant and eye-catching', emoji: '🎨' },
]

const COLORS = [
  '#1e3a5f', '#2563eb', '#7c3aed', '#db2777',
  '#dc2626', '#ea580c', '#16a34a', '#0891b2',
  '#374151', '#000000',
]

export default function CustomisePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [slug, setSlug] = useState('')
  const [salonId, setSalonId] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    headline: '',
    description: '',
    primary_color: '#1e3a5f',
    template: 'modern',
    google_review_link: '',
    logo_url: '',
    cover_photo_url: '',
  })

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase
      .from('salons').select('id').eq('owner_id', user?.id).single()
    setSalonId(salon?.id || '')
    const { data: settings } = await supabase
      .from('booking_settings').select('*')
      .eq('salon_id', salon?.id).single()
    if (settings) {
      setSlug(settings.slug)
      setForm({
        headline: settings.headline || '',
        description: settings.description || '',
        primary_color: settings.primary_color || '#1e3a5f',
        template: settings.template || 'modern',
        google_review_link: settings.google_review_link || '',
        logo_url: settings.logo_url || '',
        cover_photo_url: settings.cover_photo_url || '',
      })
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase
      .from('salons').select('id').eq('owner_id', user?.id).single()
    await supabase.from('booking_settings')
      .update(form)
      .eq('salon_id', salon?.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function uploadPhoto(file: File, type: 'logo' | 'cover') {
    const setter = type === 'logo' ? setUploadingLogo : setUploadingCover
    setter(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${salonId}/${type}.${ext}`
      const { error } = await supabase.storage.from('salon-photos').upload(path, file, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from('salon-photos').getPublicUrl(path)
        const url = urlData.publicUrl + `?t=${Date.now()}`
        setForm(f => ({ ...f, [type === 'logo' ? 'logo_url' : 'cover_photo_url']: url }))
      }
    } catch {}
    setter(false)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

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
            <a href="/customise" className="text-blue-200 hover:text-white text-sm transition-colors">Customise</a>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customise Booking Page</h1>
            <p className="text-gray-500 text-sm mt-1">Personalise how your clients see your booking page</p>
          </div>
          <div className="flex gap-3">
            {slug && (
              <a
                href={`${appUrl}/book/${slug}`}
                target="_blank"
                className="flex items-center gap-2 text-blue-600 text-sm px-4 py-2.5 rounded-xl font-medium bg-blue-50 hover:bg-blue-100 transition-all"
              >
                <ExternalLink size={15} />
                Preview
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
              style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
            >
              <Save size={15} />
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-6">

            {/* Salon Photos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-1">Salon Photos</h2>
              <p className="text-xs text-gray-400 mb-5">Shown on your booking page header. Requires the <code className="bg-gray-100 px-1 rounded">salon-photos</code> storage bucket in Supabase.</p>
              <div className="grid grid-cols-2 gap-4">

                {/* Logo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Salon Logo</label>
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="relative rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition-all overflow-hidden flex items-center justify-center"
                    style={{height:100}}>
                    {form.logo_url
                      ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      : <div className="text-center text-gray-400">
                          <ImageIcon size={20} className="mx-auto mb-1" />
                          <p className="text-xs">Upload logo</p>
                        </div>}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0], 'logo')} />
                  {form.logo_url && (
                    <button onClick={() => setForm({...form, logo_url:''})}
                      className="text-xs text-red-400 hover:text-red-600 mt-1">Remove</button>
                  )}
                </div>

                {/* Cover photo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Photo</label>
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="relative rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition-all overflow-hidden flex items-center justify-center"
                    style={{height:100}}>
                    {form.cover_photo_url
                      ? <img src={form.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
                      : <div className="text-center text-gray-400">
                          <Upload size={20} className="mx-auto mb-1" />
                          <p className="text-xs">Upload cover</p>
                        </div>}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0], 'cover')} />
                  {form.cover_photo_url && (
                    <button onClick={() => setForm({...form, cover_photo_url:''})}
                      className="text-xs text-red-400 hover:text-red-600 mt-1">Remove</button>
                  )}
                </div>
              </div>
            </div>

            {/* Template */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Choose Template</h2>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setForm({...form, template: t.id})}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${form.template === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="text-2xl mb-2">{t.emoji}</div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand colour */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Brand Colour</h2>
              <div className="flex flex-wrap gap-3 mb-4">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setForm({...form, primary_color: color})}
                    className={`w-10 h-10 rounded-xl transition-all ${form.primary_color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                    style={{background: color}}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Custom colour:</label>
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => setForm({...form, primary_color: e.target.value})}
                  className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <span className="text-sm text-gray-500 font-mono">{form.primary_color}</span>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Page Content</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Headline</label>
                  <input
                    type="text"
                    value={form.headline}
                    onChange={e => setForm({...form, headline: e.target.value})}
                    placeholder="Book Your Appointment"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown at the top of your booking page</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Welcome to our salon! We offer premium hair services in a relaxing environment."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google Review Link</label>
                  <input
                    type="url"
                    value={form.google_review_link}
                    onChange={e => setForm({...form, google_review_link: e.target.value})}
                    placeholder="https://g.page/r/your-salon/review"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  />
                  <p className="text-xs text-gray-400 mt-1">Clients will be asked to leave a review after their appointment</p>
                </div>
              </div>
            </div>

            {/* Live preview link */}
            {slug && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Your Booking Page</h3>
                    <code className="text-xs text-blue-700 font-mono">{appUrl}/book/{slug}</code>
                  </div>
                  <a
                    href={`${appUrl}/book/${slug}`}
                    target="_blank"
                    className="text-white text-sm px-4 py-2 rounded-xl font-medium hover:opacity-90"
                    style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
                  >
                    Open →
                  </a>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}