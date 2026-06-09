const GOLD = '#c9a84c'

export default function TermsPage() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,#2a1f08,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✄</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>SalonPing</span>
        </a>
        <a href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Back to home</a>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 36 }}>Last updated: June 2026</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: `By creating a SalonPing account or using the SalonPing platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use SalonPing.`
          },
          {
            title: '2. Description of Service',
            body: `SalonPing provides salon appointment booking software including online booking pages, automated SMS/WhatsApp/email reminders, client management, analytics, and payment deposit collection via Stripe. The service is provided on a subscription basis with a free tier available.`
          },
          {
            title: '3. Your Responsibilities',
            body: `You are responsible for maintaining the accuracy of your salon information and services. You are responsible for obtaining client consent before sending SMS or WhatsApp messages through SalonPing. You must not use SalonPing for unlawful purposes or to send spam communications.`
          },
          {
            title: '4. Payments & Fees',
            body: `The Free plan is provided at no cost. Pro and Premium plans are billed monthly. SalonPing charges a 1% platform fee on all client deposits collected through the platform. All plan fees are non-refundable unless required by law. SalonPing reserves the right to change pricing with 30 days notice.`
          },
          {
            title: '5. Stripe Integration',
            body: `Payment processing is handled by Stripe. By using deposit collection, you agree to Stripe\'s Terms of Service. SalonPing is not responsible for Stripe processing delays, failures, or disputes. Client deposits go directly to your connected Stripe account after SalonPing\'s 1% platform fee is deducted.`
          },
          {
            title: '6. Cancellation & Termination',
            body: `You may cancel your account at any time from Settings → Danger Zone. Upon cancellation, your data will be deleted. SalonPing reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or misuse the platform.`
          },
          {
            title: '7. Limitation of Liability',
            body: `SalonPing is provided "as is." We do not guarantee that the service will be uninterrupted or error-free. SalonPing is not liable for lost revenue due to no-shows, failed reminders, or service outages. Our total liability to you for any claim is limited to the amount you paid us in the last 3 months.`
          },
          {
            title: '8. Changes to Terms',
            body: `We may update these terms from time to time. We will notify you by email of significant changes. Continued use of SalonPing after changes constitutes acceptance of the new terms.`
          },
          {
            title: '9. Contact',
            body: `For questions about these terms, contact us at legal@salonping.com or through our Contact page.`
          },
        ].map(s => (
          <div key={s.title} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: GOLD, marginBottom: 8 }}>{s.title}</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <a href="/contact" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Contact</a>
          <a href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: 13, color: GOLD, textDecoration: 'none' }}>Terms of Service</a>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 12 }}>© 2026 SalonPing. Built for salon owners who value their time.</p>
      </footer>
    </div>
  )
}
