export function get48hMessage(
  clientName: string,
  service: string,
  date: string,
  time: string,
  salonName: string
) {
  return `Hi ${clientName}! Friendly reminder: your ${service} appointment at ${salonName} is in 2 days — ${date} at ${time}. Reply STOP to unsubscribe.`
}

export function get24hMessage(
  clientName: string,
  service: string,
  time: string,
  salonName: string
) {
  return `Hi ${clientName}! Your ${service} is TOMORROW at ${time} with ${salonName}. We've reserved your spot — see you then! Reply STOP to unsubscribe.`
}

export function get2hMessage(
  clientName: string,
  service: string,
  time: string,
  salonName: string
) {
  return `See you in 2 hours ${clientName}! Your ${service} is at ${time} with ${salonName}. Reply STOP to unsubscribe.`
}