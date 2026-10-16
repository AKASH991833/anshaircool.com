import { getStore } from '@netlify/blobs'
import { guard, json } from './_guard.mjs'

export default async (req) => {
  const denied = await guard(req); if (denied) return denied
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  const store = getStore('ansh-bookings')
  const { blobs } = await store.list()
  const keys = blobs.map(x => x.key).sort().reverse().slice(0, 100)
  const rows = await Promise.all(keys.map(k => store.get(k, { type: 'json' })))
  return json({ bookings: rows.filter(Boolean) })
}
