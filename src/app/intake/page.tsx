'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const GOLD = '#c9a84c'
const NAV = ['/dashboard|Dashboard','/appointments|Appointments','/calendar|Calendar','/clients|Clients','/services|Services','/staff|Staff','/hours|Hours','/blocked|Block-out','/intake|Intake Forms','/customise|Customise','/settings|Settings']

type IntakeQuestion = { id: string; question: string; required: boolean; sort_order: number; active: boolean }

export default function IntakePage() {
  const [questions, setQuestions] = useState<IntakeQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newRequired, setNewRequired] = useState(false)

  useEffect(() => { loadQuestions() }, [])

  async function loadQuestions() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
    const { data } = await supabase.from('intake_questions').select('*').eq('salon_id', salon?.id).order('sort_order')
    setQuestions(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!newQuestion.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user?.id).single()
    const maxOrder = questions.reduce((max, q) => Math.max(max, q.sort_order), 0)
    await supabase.from('intake_questions').insert({ salon_id: salon?.id, question: newQuestion, required: newRequired, sort_order: maxOrder + 1 })
    setNewQuestion(''); setNewRequired(false); setShowForm(false)
    await loadQuestions()
    setSaving(false)
  }

  async function toggleActive(q: IntakeQuestion) {
    const supabase = createClient()
    await supabase.from('intake_questions').update({ active: !q.active }).eq('id', q.id)
    setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, active: !item.active } : item))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question?')) return
    const supabase = createClient()
    await supabase.from('intake_questions').delete().eq('id', id)
    setQuestions(questions.filter(q => q.id !== id))
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(201,168,76,0.15)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✄</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>SalonPing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {NAV.map(l => { const [href, label] = l.split('|'); return <a key={href} href={href} style={{ color: href === '/intake' ? GOLD : 'rgba(255,255,255,0.5)', fontSize: 11, padding: '4px 8px', borderRadius: 8, textDecoration: 'none', fontWeight: href === '/intake' ? 700 : 400 }}>{label}</a> })}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Intake Forms</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Questions clients answer when booking online</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 700, fontSize: 13, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
            + Add Question
          </button>
        </div>

        <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            ✦ These questions appear on your booking page after clients select a service. Their answers are saved to each appointment for your reference.
          </p>
        </div>

        {showForm && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: '0 0 14px' }}>New Intake Question</h2>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>Question *</label>
              <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="e.g. Do you have any allergies or sensitivities?" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <input type="checkbox" id="req" checked={newRequired} onChange={e => setNewRequired(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="req" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Required — client must answer before booking</label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving || !newQuestion.trim()} style={{ flex: 2, padding: '10px', borderRadius: 10, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, border: 'none', color: '#0a0a0a', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : '+ Add Question'}
              </button>
            </div>
          </div>
        )}

        {/* Default questions suggestion */}
        {!loading && questions.length === 0 && !showForm && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Popular intake questions for salons:</p>
            {[
              'Do you have any allergies or sensitivities to hair products?',
              'Have you had a chemical service (colour, perm, relaxer) in the last 6 months?',
              'Are you currently pregnant or breastfeeding?',
              'What is your hair history? (Previous colour, treatments)',
            ].map(q => (
              <button key={q} onClick={() => { setNewQuestion(q); setShowForm(true) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
                + {q}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : (
          <div>
            {questions.map((q, i) => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 8, opacity: q.active ? 1 : 0.5 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: GOLD, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{q.question}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                    {q.required ? '* Required' : 'Optional'} · {q.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleActive(q)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                    {q.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(q.id)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
