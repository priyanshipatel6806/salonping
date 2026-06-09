const GOLD = '#c9a84c'

export default function ContactPage() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✄</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>SalonPing</span>
        </a>
        <a href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Back to home</a>
      </nav>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Get in touch</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 40 }}>
          We're a small team and we actually read every email. Whether you have a question, a bug report, or just want to say hi — we'd love to hear from you.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { icon: '💬', label: 'General support', email: 'support@salonping.com', desc: 'Questions, help getting set up, feature requests' },
            { icon: '🐛', label: 'Report a bug', email: 'bugs@salonping.com', desc: 'Found something broken? Tell us exactly what happened' },
            { icon: '🤝', label: 'Partnerships', email: 'hello@salonping.com', desc: 'Affiliate programs, integrations, business inquiries' },
            { icon: '⚖️', label: 'Privacy & Legal', email: 'legal@salonping.com', desc: 'Privacy policy questions, data requests, legal matters' },
          ].map(c => (
            <a key={c.email} href={`mailto:${c.email}`} style={{ display: 'block', padding: '18px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, textDecoration: 'none', textAlign: 'left', transition: 'border-color 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{c.label}</span>
              </div>
              <div style={{ fontSize: 13, color: GOLD, marginBottom: 4, marginLeft: 30 }}>{c.email}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 30 }}>{c.desc}</div>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 36, padding: '16px 20px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12 }}>
          <div style={{ fontSize: 13, color: GOLD, fontWeight: 600, marginBottom: 4 }}>⚡ Response time</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>We typically respond within 24 hours on weekdays.</div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <a href="/contact" style={{ fontSize: 13, color: GOLD, textDecoration: 'none' }}>Contact</a>
          <a href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms of Service</a>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 12 }}>© 2026 SalonPing. Built for salon owners who value their time.</p>
      </footer>
    </div>
  )
}
