export function get48hMessage(
  clientName: string,
  service: string,
  date: string,
  time: string,
  salonName: string,
  cancelUrl?: string
) {
  const cancelLine = cancelUrl ? ` Need to cancel? ${cancelUrl}` : ''
  return `Hi ${clientName}! Reminder: your ${service} at ${salonName} is in 2 days — ${date} at ${time}.${cancelLine} Reply STOP to unsubscribe.`
}

export function get24hMessage(
  clientName: string,
  service: string,
  time: string,
  salonName: string,
  cancelUrl?: string
) {
  const cancelLine = cancelUrl ? ` Need to cancel? ${cancelUrl}` : ''
  return `Hi ${clientName}! Your ${service} is TOMORROW at ${time} with ${salonName}. We've reserved your spot — see you then!${cancelLine} Reply STOP to unsubscribe.`
}

export function get2hMessage(
  clientName: string,
  service: string,
  time: string,
  salonName: string
) {
  return `See you in 2 hours ${clientName}! Your ${service} is at ${time} with ${salonName}. Reply STOP to unsubscribe.`
}