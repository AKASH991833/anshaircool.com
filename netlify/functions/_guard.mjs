import { getUser, verifyRequestOrigin } from '@netlify/identity'

const OWNER_EMAIL = 'akashvishwakarma1262@gmail.com'
export const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
export async function guard(req, write = false) {
  if (write) {
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return json({ error: 'Method not allowed' }, 405)
    try { verifyRequestOrigin(req) } catch { return json({ error: 'Bad origin' }, 403) }
  }
  const user = await getUser()
  if (!user || user.email?.toLowerCase() !== OWNER_EMAIL) return json({ error: 'Unauthorized' }, 401)
  // Verify the actual JWT with Netlify Identity. Do not trust only decoded browser claims.
  const cookie=req.headers.get('cookie') || ''
  const token=/(?:^|;\s*)nf_jwt=([^;]+)/.exec(cookie)?.[1]
  if (!token) return json({ error: 'Unauthorized' }, 401)
  const verify=await fetch(new URL('/.netlify/identity/user',req.url),{headers:{Authorization:`Bearer ${decodeURIComponent(token)}`}}).catch(()=>null)
  if (!verify?.ok) return json({ error: 'Unauthorized' }, 401)
  const verified=await verify.json().catch(()=>null)
  if (verified?.email?.toLowerCase() !== OWNER_EMAIL || verified.id !== user.id) return json({ error: 'Unauthorized' }, 401)
  return null
}
