const GOLD = '#c9a84c'

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 36 }}>Last updated: June 2026</p>

        {[
          {
            title: '1. Information We Collect',
            body: `When you create a SalonPing account, we collect your email address and salon details (name, phone number) that you provide. When your clients book appointments through your booking page, we collect their name, phone number, email address, and appointment details. We also collect basic usage data such as pages visited and features used to improve the product.`
          },
          {
            title: '2. How We Use Your Information',
            body: `We use your information to provide and operate the SalonPing service — including sending appointment reminders to your clients via SMS, WhatsApp, or email. We use salon owner contact details to send booking notifications. We do not sell your personal information or your clients\' information to third parties.`
          },
          {
            title: '3. SMS & WhatsApp Reminders',
            body: `SalonPing sends automated SMS and WhatsApp messages to your clients on your behalf. By using SalonPing, you confirm that you have obtained appropriate consent from your clients to receive these messages. Clients can opt out of reminders at any time by replying STOP.`
          },
          {
            title: '4. Data Storage',
            body: `Your data is stored securely using Supabase (hosted on AWS). Appointment data, client information, and salon details are stored in encrypted databases. We retain your data for as long as your account is active. You can request deletion of your account and all associated data at any time from Settings → Danger Zone.`
          },
          {
            title: '5. Payment Information',
            body: `SalonPing uses Stripe to process payments and deposits. We do not store your credit card or banking information — this is handled entirely by Stripe. Client deposits go directly to your connected Stripe account. SalonPing charges a 1% platform fee on deposits processed through the platform.`
          },
          {
            title: '6. Cookies',
            body: `We use essential cookies to keep you logged in to your SalonPing account. We do not use advertising cookies or tracking pixels. Your booking page clients may have a session cookie set for a smooth booking experience.`
          },
          {
            title: '7. Your Rights',
            body: `You have the right to access, correct, or delete your personal data at any time. Salon owners can delete their account and all data from Settings. To request a copy of your data or for any privacy questions, contact us at privacy@salonping.com.`
          },
          {
            title: '8. Contact',
            body: `For privacy-related questions, email us at privacy@salonping.com or contact us through the Contact page.`
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
          <a href="/privacy" style={{ fontSize: 13, color: GOLD, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms of Service</a>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 12 }}>© 2026 SalonPing. Built for salon owners who value their time.</p>
      </footer>
    </div>
  )
}
