import { guard, json } from './_guard.mjs'

const owner = 'AKASH991833', repo = 'anshaircool.com'
const tables = new Set(['hero','gallery'])
const base = `https://api.github.com/repos/${owner}/${repo}/contents/`
function github(path, init = {}) {
  return fetch(base + path, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.ANSH_GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {})
    }
  })
}
function safeText(value, max = 400) {
  return typeof value === 'string' && value.length <= max && !/[<>]/.test(value)
}
function validate(table, payload) {
  if (table === 'hero') return payload && typeof payload === 'object' &&
    ['trustBadge','titleLine1','titleLine2','titleLine3','subtitle'].every(k => safeText(payload[k], k === 'subtitle' ? 400 : 80))
  return Array.isArray(payload) && payload.length <= 60 && payload.every(x =>
    Number.isSafeInteger(x.id) && x.id > 0 && safeText(x.caption, 240) &&
    typeof x.image === 'string' && /^images\/[a-z0-9-]+\.(?:webp|png|jpe?g)$/.test(x.image)) &&
    new Set(payload.map(x => x.id)).size === payload.length
}
export default async (req) => {
  const denied = await guard(req, req.method !== 'GET'); if (denied) return denied
  if (!['GET','PUT'].includes(req.method)) return json({ error: 'Method not allowed' }, 405)
  const table = new URL(req.url).searchParams.get('table')
  if (!tables.has(table)) return json({ error: 'Unknown content table' }, 400)
  if (!process.env.ANSH_GITHUB_TOKEN) return json({ error: 'Publishing not configured' }, 503)
  const path = `transparentdb/${table}.json`
  const current = await github(path, { headers: { 'Cache-Control': 'no-cache' } })
  if (!current.ok) return json({ error: 'Repository unavailable' }, 502)
  const entry = await current.json()
  const existing = JSON.parse(Buffer.from(entry.content.replace(/\s/g,''), 'base64').toString('utf8'))
  if (req.method === 'GET') return json({ data: existing, sha: entry.sha })
  if (Number(req.headers.get('content-length') || 0) > 30_000) return json({ error: 'Content is too large' }, 413)
  let body; try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (!body || body.sha !== entry.sha) return json({ error: 'Content changed since you opened it. Reload before saving.' }, 409)
  if (JSON.stringify(body.data).length > 30_000 || !validate(table, body.data)) return json({ error: 'Invalid content' }, 400)
  // Keep non-editable hero keys intact; only expose a small reviewed set.
  const updated = table === 'hero' ? { ...existing, ...Object.fromEntries(['trustBadge','titleLine1','titleLine2','titleLine3','subtitle'].map(k => [k, body.data[k]])) } : body.data
  const result = await github(path, { method:'PUT', headers: { 'Content-Type':'application/json' }, body:JSON.stringify({message:`Update ${table} from secure admin`, content:Buffer.from(JSON.stringify(updated,null,2)+'\n').toString('base64'), sha:entry.sha, branch:'main'}) })
  if (!result.ok) return json({ error: result.status === 409 ? 'Another update happened; reload and retry.' : 'Publishing failed' }, result.status === 409 ? 409 : 502)
  const saved = await result.json()
  return json({ saved:true, sha:saved.content?.sha, commit:saved.commit?.sha, note:'GitHub accepted the change; Netlify still needs to deploy it.' })
}
