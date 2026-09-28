import { getStore } from '@netlify/blobs'

// One record per browser per day; no IP address, email or user-agent stored.
export default async (req) => {
  if (req.method !== 'POST') return new Response(null,{status:405})
  const origin = req.headers.get('origin')
  if (origin !== new URL(req.url).origin) return new Response(null,{status:403})
  const cookie = req.headers.get('cookie') || ''
  const today = new Date().toISOString().slice(0,10)
  const existing = /(?:^|;\s*)ansh_visit=([0-9]{4}-[0-9]{2}-[0-9]{2})/.exec(cookie)?.[1]
  if (existing === today) return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})
  const store = getStore('ansh-visitor-events')
  await store.set(`${today}/${crypto.randomUUID()}`,'1')
  return new Response(null,{status:204,headers:{'Set-Cookie':`ansh_visit=${today}; Path=/; Max-Age=86400; SameSite=Lax; Secure`,'Cache-Control':'no-store'}})
}
