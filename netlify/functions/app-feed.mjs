import { getStore } from '@netlify/blobs'
import { createHash } from 'node:crypto'

// Read-only feed for the owner's Bill App (Website section).
// Guarded by a shared key in the private app. Only its hash is published here.
const json = (body, status = 200) => Response.json(body, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'x-app-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }
})

async function dayCounts(store, days) {
  const labels = []
  for (let i = days - 1; i >= 0; i--) labels.push(new Date(Date.now() + 19800000 - i * 86400000).toISOString().slice(0, 10))
  let total = 0
  const counts = []
  for (const day of labels) {
    let n = 0
    for await (const page of store.list({ prefix: `${day}/`, paginate: true })) n += page.blobs.length
    total += n; counts.push({ day, count: n })
  }
  return { total, days: counts }
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'x-app-key', 'Access-Control-Allow-Methods': 'GET, OPTIONS' } })
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  // Only the SHA-256 of the app key lives here (public repo). The key itself
  // is only inside the private Bill App APK; brute-forcing a 192-bit key is infeasible.
  const KEY_SHA256 = 'da169a893ca263da60f710b49dbc909a980fdc1c9923a797de314719da362d03'
  const given = createHash('sha256').update(String(req.headers.get('x-app-key') || '')).digest('hex')
  if (given !== KEY_SHA256) return json({ error: 'Unauthorized' }, 401)

  const visits30 = await dayCounts(getStore('ansh-visitor-events'), 30)
  const wa30 = await dayCounts(getStore('ansh-wa-clicks'), 30)
  const sum7 = (c) => c.days.slice(-7).reduce((s, d) => s + d.count, 0)

  let enquiries = []
  if (!process.env.ANSH_NETLIFY_TOKEN) return json({ error: 'Enquiry source not configured' }, 503)
  {
    try {
      const formId = '6aba04887fc55e00076e6164'
      const res = await fetch(`https://api.netlify.com/api/v1/forms/${formId}/submissions?per_page=100`, {
        headers: { Authorization: `Bearer ${process.env.ANSH_NETLIFY_TOKEN}`, Accept: 'application/json' }
      })
      if (!res.ok) return json({ error: 'Enquiry source unavailable' }, 502)
      {
        const rows = await res.json()
        if (Array.isArray(rows)) enquiries = rows.map(x => ({
          id: x.id, created_at: x.created_at,
          name: x.data?.name || '', phone: x.data?.phone || '', email: x.data?.email || '',
          interestType: x.data?.interestType || '', serviceType: x.data?.serviceType || '', message: x.data?.message || ''
        }))
      }
    } catch { return json({ error: 'Enquiry source unavailable' }, 502) }
  }

  const bookings = []
  try {
    const store = getStore('ansh-bookings')
    for await (const page of store.list({ paginate: true })) {
      for (const blob of page.blobs) {
        const b = await store.get(blob.key, { type: 'json' }).catch(() => null)
        if (b) bookings.push(b)
      }
    }
    bookings.sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)))
  } catch { /* no bookings yet */ }

  return json({
    generated_at: new Date().toISOString(),
    visits: { today: visits30.days.at(-1).count, last7: sum7(visits30), last30: visits30.total, days: visits30.days },
    whatsapp_clicks: { today: wa30.days.at(-1).count, last7: sum7(wa30), last30: wa30.total, days: wa30.days },
    enquiries,
    bookings: bookings.slice(0, 100),
    note: 'Visits are approximate (one count per browser per day). WhatsApp clicks count taps on site buttons.'
  })
}
