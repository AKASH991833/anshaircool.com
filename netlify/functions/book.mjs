import { getStore } from '@netlify/blobs'

// Public booking endpoint. Saves the booking in Netlify Blobs (read by the admin panel)
// and sends a free email notification through FormSubmit. No API key or card needed.
const NOTIFY_EMAIL = 'anshaircool@gmail.com'
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max)
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const origin = req.headers.get('origin')
  if (!origin || new URL(origin).host !== new URL(req.url).host) return json({ error: 'Bad origin' }, 403)
  let b
  try { b = await req.json() } catch { return json({ error: 'Invalid request' }, 400) }
  if (clean(b.website, 50)) return json({ ok: true }) // honeypot: pretend success
  const d = {
    name: clean(b.name, 80), phone: clean(b.phone, 20), service: clean(b.service, 60),
    when: clean(b.when, 40), slot: clean(b.slot, 40), address: clean(b.address, 300), message: clean(b.message, 500)
  }
  if (!d.name || !d.address || d.phone.replace(/\D/g, '').length < 10) return json({ error: 'Name, phone and address are required' }, 400)
  const created_at = new Date().toISOString()
  await getStore('ansh-bookings').setJSON(`${created_at}-${crypto.randomUUID()}`, { ...d, created_at })
  try {
    await fetch(`https://formsubmit.co/ajax/${NOTIFY_EMAIL}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: `New AC booking: ${d.name} (${d.service})`, _template: 'table', _captcha: 'false', Name: d.name, Phone: d.phone, Service: d.service, 'Preferred time': `${d.when}, ${d.slot}`, Address: d.address, Problem: d.message || '-' })
    })
  } catch { /* booking is already saved; email is best effort */ }
  return json({ ok: true })
}
