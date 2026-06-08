import Link from 'next/link'

const GOLD = '#c9a84c'

const FREE_FEATURES = [
  '1 booking page (your unique link)',
  'Unlimited online bookings',
  'Up to 20 SMS/WhatsApp reminders/month',
  'AI chat assistant on booking page',
  'Client database',
  'Google review requests',
  'Basic dashboard & stats',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited SMS + WhatsApp + Email reminders',
  'Stripe deposit collection',
  'Client self-cancel links in reminders',
  'Rebooking nudges ("we miss you" texts)',
  'No-show tracking per client',
  'Analytics dashboard',
  'Priority support',
]

const PREMIUM_FEATURES = [
  'Everything in Pro',
  'AI voice assistant (phone booking bot)',
  'Up to 5 staff profiles',
  '3 booking pages (multi-location)',
  'Waitlist for fully-booked slots',
  'Loyalty points system',
  'WhatsApp booking bot',
  'Remove SalonPing branding',
  'Custom domain support',
  'Dedicated support',
]

const faqs = [
  { q: 'Do I need a credit card to start?', a: 'No. The Free plan requires no payment details at all.' },
  { q: 'What happens when I hit 20 reminders on the Free plan?', a: "Reminders stop for the rest of that calendar month. Bookings still work — clients just won't get automated reminders until the next month or until you upgrade." },
  { q: 'How does the AI chat widget work?', a: 'Every booking page has an AI chat bubble powered by LLaMA 3.1. Clients can ask about services, prices, and availability — the AI answers using your real salon data. It\'s active on all plans, no setup needed.' },
  { q: 'How does the AI voice assistant work?', a: 'On the Premium plan, you connect your phone number to our Vapi.ai integration. When a client calls, the AI answers, asks what they want to book, checks availability, and creates the appointment — all automatically. No human needed.' },
  { q: 'Can I collect deposits on the Free plan?', a: 'No — Stripe deposit collection is a Pro and Premium feature.' },
  { q: 'Is the price per location or per stylist?', a: 'Per account. Free and Pro cover 1 booking page. Premium covers up to 3 booking pages (locations) and 5 staff profiles.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from Settings — no contracts, no lock-in.' },
]

export default function PricingPage() {
  return (
    <div style={{ background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✄</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.5px' }}>SalonPing</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link href="/#features" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textDecoration: 'none' }}>Features</Link>
            <Link href="/pricing" style={{ color: GOLD, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>Pricing</Link>
            <Link href="/login" style={{ background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 10, textDecoration: 'none' }}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 16, lineHeight: 1.1 }}>
            Simple, honest pricing
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Start free. Upgrade when you grow. No hidden fees.
          </p>
        </div>
      </section>

      {/* PLANS */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, alignItems: 'start' }}>

          {/* FREE */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Free</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>$0</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>/month</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>Perfect for getting started. No card needed.</p>
            </div>
            <Link href="/login" style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 15, textDecoration: 'none', marginBottom: 28 }}>
              Get started free
            </Link>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>What&apos;s included</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {FREE_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                    <span style={{ color: GOLD, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* PRO */}
          <div style={{ background: 'rgba(201,168,76,0.05)', border: `2px solid ${GOLD}`, borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, background: `radial-gradient(ellipse,${GOLD}15 0%,transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pro</div>
                <div style={{ background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 100 }}>MOST POPULAR</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>$49</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>/month</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 24px' }}>For serious salon owners who want zero no-shows.</p>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 12, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 800, fontSize: 15, textDecoration: 'none', marginBottom: 28 }}>
                Start free, then upgrade
              </Link>
              <div style={{ borderTop: `1px solid rgba(201,168,76,0.2)`, paddingTop: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(201,168,76,0.6)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Everything in Free, plus</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PRO_FEATURES.filter(f => f !== 'Everything in Free').map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                      <span style={{ color: GOLD, flexShrink: 0, marginTop: 1 }}>✦</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* PREMIUM */}
          <div style={{ background: 'rgba(139,92,246,0.05)', border: '2px solid rgba(139,92,246,0.5)', borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, background: 'radial-gradient(ellipse,rgba(139,92,246,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Premium</div>
                <div style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 100 }}>🎙️ AI VOICE</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>$99</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>/month</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 24px' }}>For growing salons that want full automation — including AI phone booking.</p>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(109,40,217,0.8),rgba(139,92,246,0.9))', color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none', marginBottom: 28 }}>
                Get Premium
              </Link>
              <div style={{ borderTop: '1px solid rgba(139,92,246,0.2)', paddingTop: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(167,139,250,0.7)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Everything in Pro, plus</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PREMIUM_FEATURES.filter(f => f !== 'Everything in Pro').map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                      <span style={{ color: '#a78bfa', flexShrink: 0, marginTop: 1 }}>✦</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 28 }}>
          Cancel any time · No contracts · Billed monthly
        </p>
      </section>

      {/* COMPARISON TABLE */}
      <section style={{ padding: '0 24px 80px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', textAlign: 'center', margin: '48px 0 32px' }}>Full comparison</h2>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Feature</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textAlign: 'center' }}>Free</span>
              <span style={{ fontSize: 12, color: GOLD, fontWeight: 700, textAlign: 'center' }}>Pro</span>
              <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, textAlign: 'center' }}>Premium</span>
            </div>
            {[
              { feature: 'Online booking page', free: '1', pro: '1', premium: '3' },
              { feature: 'Unlimited online bookings', free: '✓', pro: '✓', premium: '✓' },
              { feature: 'SMS reminders', free: '20/mo', pro: 'Unlimited', premium: 'Unlimited' },
              { feature: 'WhatsApp reminders', free: '20/mo', pro: 'Unlimited', premium: 'Unlimited' },
              { feature: 'Email reminders', free: '—', pro: '✓', premium: '✓' },
              { feature: 'AI chat assistant', free: '✓', pro: '✓', premium: '✓' },
              { feature: 'AI voice assistant (phone)', free: '—', pro: '—', premium: '✓' },
              { feature: 'Client database', free: '✓', pro: '✓', premium: '✓' },
              { feature: 'Google review requests', free: '✓', pro: '✓', premium: '✓' },
              { feature: 'Stripe deposit collection', free: '—', pro: '✓', premium: '✓' },
              { feature: 'Client cancel links', free: '—', pro: '✓', premium: '✓' },
              { feature: 'Rebooking nudges', free: '—', pro: '✓', premium: '✓' },
              { feature: 'No-show tracking', free: '—', pro: '✓', premium: '✓' },
              { feature: 'Staff profiles', free: '—', pro: '—', premium: '5' },
              { feature: 'Loyalty points', free: '—', pro: '—', premium: '✓' },
              { feature: 'Waitlist', free: '—', pro: '—', premium: '✓' },
              { feature: 'Remove SalonPing branding', free: '—', pro: '—', premium: '✓' },
            ].map((row, i) => (
              <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px', padding: '12px 24px', borderBottom: i < 16 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{row.feature}</span>
                <span style={{ fontSize: 13, color: row.free === '—' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)', textAlign: 'center', fontWeight: row.free === '✓' ? 600 : 400 }}>{row.free}</span>
                <span style={{ fontSize: 13, color: row.pro === '—' ? 'rgba(255,255,255,0.2)' : GOLD, textAlign: 'center', fontWeight: row.pro !== '—' ? 700 : 400 }}>{row.pro}</span>
                <span style={{ fontSize: 13, color: row.premium === '—' ? 'rgba(255,255,255,0.2)' : '#a78bfa', textAlign: 'center', fontWeight: row.premium !== '—' ? 700 : 400 }}>{row.premium}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '0 24px 100px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', textAlign: 'center', margin: '48px 0 32px' }}>Frequently asked questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {faqs.map(faq => (
              <div key={faq.q} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{faq.q}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 24px 80px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 300, borderRadius: '50%', background: `radial-gradient(ellipse,${GOLD}12 0%,transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 16 }}>Ready to stop the no-shows?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>Free to start. No card needed. Set up in 5 minutes.</p>
          <Link href="/login" style={{ background: `linear-gradient(135deg,#2a1f08,${GOLD})`, color: '#0a0a0a', fontWeight: 800, fontSize: 17, padding: '16px 44px', borderRadius: 14, textDecoration: 'none', display: 'inline-block' }}>
            Get started — it&apos;s free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✄</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>SalonPing</span>
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Home</Link>
          <a href="mailto:support@salonping.com" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Contact</a>
          <a href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms of Service</a>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
          &copy; {new Date().getFullYear()} SalonPing. Built for salon owners who value their time.
        </p>
      </footer>
    </div>
  )
}
