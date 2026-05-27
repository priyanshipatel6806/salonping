export async function sendSMS(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !from) {
    console.log('Twilio not configured — SMS skipped')
    return { sid: 'not-configured', status: 'skipped' }
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    }
  )

  const data = await response.json()
  return { sid: data.sid, status: data.status }
}

export async function sendWhatsApp(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    console.log('Twilio not configured — WhatsApp skipped')
    return { sid: 'not-configured', status: 'skipped' }
  }

  // Clean phone number — remove spaces, dashes, brackets
  const cleanPhone = to.replace(/[\s\-\(\)]/g, '')
  
  // Make sure it starts with +
  const e164Phone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`

  const whatsappFrom = 'whatsapp:+14155238886'
  const whatsappTo = `whatsapp:${e164Phone}`

  console.log('Sending WhatsApp to:', whatsappTo)

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: whatsappTo,
        From: whatsappFrom,
        Body: body
      }).toString(),
    }
  )

  const data = await response.json()
  console.log('WhatsApp response:', data)
  return { sid: data.sid, status: data.status }
}