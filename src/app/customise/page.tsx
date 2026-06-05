'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/clients|Clients','/analytics|Analytics','/services|Services','/hours|Hours','/customise|Customise','/settings|Settings']

const COLORS = ['#c9a84c','#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#16a34a','#0891b2','#374151','#000000']

export default function CustomisePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [slug, setSlug] = useState('')
  const [salonId, setSalonId] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [slugError, setSlugError] = useState('')
  const logoRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    headline: '', description: '', primary_color: GOLD,
    google_review_link: '', logo_url: '', cover_photo_url: '', custom_slug: '',
    stripe_deposit_amount: 0,
  })

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()
    setSalonId(salon?.id || '')
    const { data: settings } = await supabase.from('booking_settings').select('*').eq('salon_id', salon?.id).single()
    if (settings) {
      setSlug(settings.slug)
      setForm({
        headline: settings.headline || '',
        description: settings.description || '',
        primary_color: settings.primary_color || GOLD,
        google_review_link: settings.google_review_link || '',
        logo_url: settings.logo_url || '',
        cover_photo_url: settings.cover_photo_url || '',
        custom_slug: settings.custom_slug || '',
        stripe_deposit_amount: settings.stripe_deposit_amount || 0,
      })
    }
    setLoading(false)
  }

  async function handleSave() {
    setSlugError('')
    if (form.custom_slug && !/^[a-z0-9-]+$/.test(form.custom_slug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()
    // Build update payload explicitly
    const updateData: any = {
      headline: form.headline,
      description: form.description,
      primary_color: form.primary_color,
      google_review_link: form.google_review_link,
      logo_url: form.logo_url,
      cover_photo_url: form.cover_photo_url,
      stripe_deposit_amount: Number(form.stripe_deposit_amount) || 0,
    }
    if (form.custom_slug && form.custom_slug !== slug) {
      const { data: existing } = await supabase.from('booking_settings').select('id').eq('slug', form.custom_slug).single()
      if (existing) { setSlugError('This URL is already taken. Try a different one.'); setSaving(false); return }
      updateData.slug = form.custom_slug
      setSlug(form.custom_slug)
    }
    const { error: saveError } = await supabase.from('booking_settings').update(updateData).eq('salon_id', salon?.id)
    if (saveError) console.error('Save error:', saveError)
    setSaving(false); setSaved(true)
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
        setForm(f => ({ ...f, [type === 'logo' ? 'logo_url' : 'cover_photo_url']: urlData.publicUrl + '?t=' + Date.now() }))
      }
    } catch {}
    setter(false)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const inputStyle = { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'11px 14px', fontSize:14, color:'#fff', outline:'none', boxSizing:'border-box' as const }
  const cardStyle = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24, marginBottom:16 }

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#fff'}}>
      <nav style={{background:'#0a0a0a', borderBottom:'1px solid rgba(201,168,76,0.15)', position:'sticky', top:0, zIndex:50}}>
        <div style={{maxWidth:1100, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,#2a1f08,${GOLD})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16}}>✄</div>
            <span style={{fontWeight:800, fontSize:17, color:'#fff'}}>SalonPing</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:2}}>
            {NAV.map(l => { const [href,label] = l.split('|'); return <a key={href} href={href} style={{color: href==='/customise' ? GOLD : 'rgba(255,255,255,0.5)', fontSize:13, padding:'6px 12px', borderRadius:8, textDecoration:'none', fontWeight: href==='/customise' ? 700 : 400}}>{label}</a> })}
            <a href="/appointments/new" style={{marginLeft:8, background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'8px 16px', borderRadius:8, textDecoration:'none'}}>+ New</a>
          </div>
        </div>
      </nav>

      <div style={{maxWidth:760, margin:'0 auto', padding:'40px 24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28}}>
          <div>
            <h1 style={{fontSize:26, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.5px'}}>Customise Booking Page</h1>
            <p style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:4}}>Personalise how clients see your booking page</p>
          </div>
          <div style={{display:'flex', gap:10}}>
            {slug && (
              <a href={`${appUrl}/book/${slug}`} target="_blank"
                style={{background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:GOLD, fontWeight:600, fontSize:13, padding:'9px 16px', borderRadius:10, textDecoration:'none'}}>
                Preview →
              </a>
            )}
            <button onClick={handleSave} disabled={saving}
              style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700, fontSize:13, padding:'9px 20px', borderRadius:10, border:'none', cursor:'pointer', opacity: saving ? 0.7 : 1}}>
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {loading ? <div style={{textAlign:'center', padding:60, color:'rgba(255,255,255,0.3)'}}>Loading...</div> : (
          <>
            {/* Custom URL */}
            <div style={{...cardStyle, border:'1px solid rgba(201,168,76,0.2)', background:'rgba(201,168,76,0.04)'}}>
              <h2 style={{fontSize:15, fontWeight:700, color:GOLD, margin:'0 0 4px'}}>✦ Your Booking URL</h2>
              <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:16}}>Customise the link you share with clients. Current: <code style={{color:GOLD}}>{slug}</code></p>
              <div style={{display:'flex', alignItems:'center', gap:0, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, overflow:'hidden'}}>
                <span style={{padding:'11px 12px', fontSize:13, color:'rgba(255,255,255,0.3)', borderRight:'1px solid rgba(255,255,255,0.1)', whiteSpace:'nowrap', flexShrink:0}}>
                  {appUrl}/book/
                </span>
                <input value={form.custom_slug} onChange={e => setForm({...form, custom_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})}
                  placeholder={slug} style={{...inputStyle, border:'none', borderRadius:0, background:'transparent', flex:1}} />
              </div>
              {slugError && <p style={{fontSize:12, color:'#f87171', marginTop:6}}>{slugError}</p>}
              <p style={{fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:6}}>Lowercase letters, numbers, and hyphens only. e.g. priya-hair-studio</p>
            </div>

            {/* Salon Photos */}
            <div style={cardStyle}>
              <h2 style={{fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 4px'}}>Salon Photos</h2>
              <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:16}}>Logo and cover photo shown on your booking page. Requires a <code style={{color:GOLD}}>salon-photos</code> public bucket in Supabase Storage.</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                {[
                  {type:'logo' as const, label:'Salon Logo', ref:logoRef, uploading:uploadingLogo, url:form.logo_url},
                  {type:'cover' as const, label:'Cover Photo', ref:coverRef, uploading:uploadingCover, url:form.cover_photo_url},
                ].map(item => (
                  <div key={item.type}>
                    <label style={{fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:8}}>{item.label}</label>
                    <div onClick={() => item.ref.current?.click()} style={{height:90, border:'2px dashed rgba(255,255,255,0.15)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative'}}>
                      {item.url ? <img src={item.url} alt={item.label} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                        : <div style={{textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12}}>
                            <div style={{fontSize:20, marginBottom:4}}>+</div>
                            <div>Upload {item.label.toLowerCase()}</div>
                          </div>}
                      {item.uploading && <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <div style={{width:20, height:20, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:GOLD, borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
                      </div>}
                    </div>
                    <input ref={item.ref} type="file" accept="image/*" style={{display:'none'}}
                      onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0], item.type)} />
                    {item.url && <button onClick={() => setForm({...form, [item.type === 'logo' ? 'logo_url' : 'cover_photo_url']:''})}
                      style={{fontSize:11, color:'#f87171', background:'none', border:'none', cursor:'pointer', marginTop:4, padding:0}}>Remove</button>}
                  </div>
                ))}
              </div>
            </div>

            {/* Brand colour */}
            <div style={cardStyle}>
              <h2 style={{fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 16px'}}>Brand Colour</h2>
              <div style={{display:'flex', flexWrap:'wrap', gap:10, marginBottom:14}}>
                {COLORS.map(color => (
                  <button key={color} onClick={() => setForm({...form, primary_color: color})}
                    style={{width:36, height:36, borderRadius:8, background:color, border: form.primary_color === color ? `3px solid ${GOLD}` : '3px solid transparent', cursor:'pointer', outline:'none'}}>
                  </button>
                ))}
              </div>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <label style={{fontSize:12, color:'rgba(255,255,255,0.5)'}}>Custom:</label>
                <input type="color" value={form.primary_color} onChange={e => setForm({...form, primary_color: e.target.value})}
                  style={{width:44, height:36, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', background:'none'}} />
                <code style={{fontSize:12, color:GOLD}}>{form.primary_color}</code>
              </div>
            </div>

            {/* Page content */}
            <div style={cardStyle}>
              <h2 style={{fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 16px'}}>Page Content</h2>
              <div style={{display:'flex', flexDirection:'column', gap:14}}>
                <div>
                  <label style={{fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6}}>Headline</label>
                  <input value={form.headline} onChange={e => setForm({...form, headline: e.target.value})}
                    placeholder="Book Your Appointment" style={inputStyle} />
                  <p style={{fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4}}>Shown at the top of your booking page</p>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6}}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Welcome! We offer premium hair services in a relaxing environment."
                    rows={3} style={{...inputStyle, resize:'vertical'}} />
                </div>
              </div>
            </div>

            {/* Google review */}
            <div style={{...cardStyle, border:'1px solid rgba(255,255,255,0.1)'}}>
              <h2 style={{fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 4px'}}>⭐ Auto Google Review Requests</h2>
              <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:14}}>After each appointment, SalonPing automatically texts your client asking them to leave a Google review. Paste your Google review link below to activate this.</p>
              <input value={form.google_review_link} onChange={e => setForm({...form, google_review_link: e.target.value})}
                placeholder="https://g.page/r/your-salon/review" style={inputStyle} type="url" />
              <p style={{fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:6}}>
                Find your link: Google Maps → your salon → Get more reviews → copy the link
              </p>
              {form.google_review_link && (
                <div style={{marginTop:12, padding:'10px 14px', background:'rgba(201,168,76,0.08)', borderRadius:8, border:'1px solid rgba(201,168,76,0.2)', fontSize:12, color:GOLD}}>
                  ✦ Review requests are active — clients will be texted 2 hours after their appointment
                </div>
              )}
            </div>

            {/* Stripe Deposit */}
            <div style={{...cardStyle, border:'1px solid rgba(255,255,255,0.1)'}}>
              <h2 style={{fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 4px'}}>💳 Booking Deposit</h2>
              <p style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:14}}>
                Require clients to pay a deposit when booking. This dramatically reduces no-shows.
                Set to 0 to disable. Requires <code style={{color:GOLD}}>STRIPE_SEC