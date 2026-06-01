import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

export async function sendGmail(
  to: string,
  subject: string,
  html: string
) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log('Gmail not configured — email skipped')
    return
  }

  try {
    const result = await transporter.sendMail({
      from: `SalonPing <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    })
    console.log('Gmail sent:', result.messageId)
    return result
  } catch (e: any) {
    console.error('Gmail error:', e.message)
    throw e
  }
}