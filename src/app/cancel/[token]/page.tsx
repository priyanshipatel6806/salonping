'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const GOLD = '#c9a84c'
const DARK = '#0a0a0a'

export default function CancelPage() {
  const params = useParams()
  const token = params.token as string

  const [apt, setApt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    fetch(`/api/appointments/cancel-by-token?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setApt(data.appointment)
        else setNotFound(true)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  async function handleCancel() {
    setCancelling(true)
    setError('')
    try {
      const res = await fetch('/api/appointments/cancel-by-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.ok) {
        setCancelled(true)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setCancelling(false)
  }

  const salonName = apt?.salons?.name || 'the salon'
  const scheduledAt = apt ? new Date(apt.scheduled_at) : null
  const formattedDate = scheduledAt?.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })
  const formattedTime = scheduledAt?.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <div style={{ background: DARK, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading your appointment...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ background: DARK, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Appointment not found</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
          This cancel link may have expired or already been used. Please contact the salon directly.
        </p>
      </div>
    </div>
  )

  if (cancelled) return (
    <div style={{ background: DARK, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>✓</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Appointment Cancelled</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          Your {apt.service} appointment at {salonName} has been cancelled. We hope to see you again soon!
        </p>
      </div>
    </div>
  )

  // Within 2 hours warning
  const tooClose = scheduledAt && scheduledAt < new Date(Date.now() + 2 * 60 * 60 * 1000)

  return (
    <div style={{ background: DARK, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 16px' }}>✄</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Cancel Appointment</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{salonName}</p>
        </div>

        {/* Appointment details */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Appointment Details</div>
          {[
            { label: 'Client', value: apt.client_name },
            { label: 'Service', value: apt.service },
            { label: 'Date', value: formattedDate },
            { label: 'Time', value: formattedTime },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {apt.status === 'cancelled' ? (
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontSize: 14, color: '#fca5a5' }}>
            This appointment has already been cancelled.
          </div>
        ) : tooClose ? (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 14, color: '#fca5a5', margin: 0, lineHeight: 1.6 }}>
              ⚠️ Appointments cannot be cancelled within 2 hours of the scheduled time. Please call {salonName} directly.
            </p>
          </div>
        ) : (
          <>
            <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
                Are you sure you want to cancel this appointment? This cannot be undone. You are welcome to rebook any time.
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: cancelling ? 0.6 : 1 }}
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel My Appointment'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
