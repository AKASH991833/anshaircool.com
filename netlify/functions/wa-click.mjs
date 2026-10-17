import { getStore } from '@netlify/blobs'

// Counts taps on the site's WhatsApp buttons. One record per tap, day-prefixed.
// No IP, phone number or message content is stored - only the fact a tap happened.
export default async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 })
  const origin = req.headers.get('origin')
  if (origin && origin !== new URL(req.url).origin) return new Response(null, { status: 403 })
  const today = new Date().toISOString().slice(0, 10)
  const store = getStore('ansh-wa-clicks')
  await store.set(`${today}/${crypto.randomUUID()}`, '1')
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
