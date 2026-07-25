export interface ContactEmailData {
  name: string
  email: string
  rating?: number | string | null
  query_type?: string
  message: string
}

export async function sendContactEmail(data: ContactEmailData) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || ''
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || ''
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || ''

  const templateParams = {
    name: data.name.trim(),
    email: data.email.trim(),
    rating: data.rating ?? 'Not rated',
    query_type: data.query_type || 'General',
    message: data.message.trim(),
    time: new Date().toLocaleString(),
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: templateParams,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`EmailJS error (${response.status}): ${errorText}`)
  }

  return response
}
