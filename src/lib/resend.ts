export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey || apiKey === 'placeholder') {
    console.log('Resend not configured — email skipped')
    return { id: 'not-configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SalonPing <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })

  const data = await response.json()
  return data
}

export function get48hEmailHtml(
  clientName: string,
  service: string,
  date: string,
  time: string,
  salonName: string
) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
        <h1 style="color:white;margin:0;font-size:24px">💇 ${salonName}</h1>
      </div>
      <h2 style="color:#1e3a5f">Appointment Reminder</h2>
      <p>Hi <strong>${clientName}</strong>!</p>
      <p>This is a friendly reminder that your <strong>${service}</strong> appointment is coming up in <strong>2 days</strong>.</p>
      <div style="background:#f0f4ff;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:4px 0">📅 <strong>Date:</strong> ${date}</p>
        <p style="margin:4px 0">⏰ <strong>Time:</strong> ${time}</p>
        <p style="margin:4px 0">✂️ <strong>Service:</strong> ${service}</p>
        <p style="margin:4px 0">🏪 <strong>Salon:</strong> ${salonName}</p>
      </div>
      <p style="color:#666;font-size:12px">If you need to cancel or reschedule please contact your salon directly.</p>
    </div>
  `
}

export function get24hEmailHtml(
  clientName: string,
  service: string,
  time: string,
  salonName: string
) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
        <h1 style="color:white;margin:0;font-size:24px">💇 ${salonName}</h1>
      </div>
      <h2 style="color:#1e3a5f">Your appointment is TOMORROW!</h2>
      <p>Hi <strong>${clientName}</strong>!</p>
      <p>Just a reminder that your <strong>${service}</strong> appointment is <strong>tomorrow</strong>.</p>
      <div style="background:#f0f4ff;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:4px 0">⏰ <strong>Time:</strong> ${time}</p>
        <p style="margin:4px 0">✂️ <strong>Service:</strong> ${service}</p>
        <p style="margin:4px 0">🏪 <strong>Salon:</strong> ${salonName}</p>
      </div>
      <p>We have reserved your spot — see you then! 😊</p>
      <p style="color:#666;font-size:12px">If you need to cancel or reschedule please contact your salon directly.</p>
    </div>
  `
}

export function get2hEmailHtml(
  clientName: string,
  service: string,
  time: string,
  salonName: string
) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
        <h1 style="color:white;margin:0;font-size:24px">💇 ${salonName}</h1>
      </div>
      <h2 style="color:#1e3a5f">See you in 2 hours!</h2>
      <p>Hi <strong>${clientName}</strong>!</p>
      <p>Your <strong>${service}</strong> appointment is in just <strong>2 hours</strong>!</p>
      <div style="background:#f0f4ff;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:4px 0">⏰ <strong>Time:</strong> ${time}</p>
        <p style="margin:4px 0">✂️ <strong>Service:</strong> ${service}</p>
        <p style="margin:4px 0">🏪 <strong>Salon:</strong> ${salonName}</p>
      </div>
      <p>We look forward to seeing you! 💇</p>
    </div>
  `
}