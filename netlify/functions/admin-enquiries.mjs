import { guard, json } from './_guard.mjs'

// This endpoint never returns the Netlify API token to the browser.
export default async (req) => {
  const denied = await guard(req); if (denied) return denied
  if (req.method !== 'GET') return json({ error:'Method not allowed' },405)
  if (!process.env.ANSH_NETLIFY_TOKEN) return json({error:'Enquiry API is not configured'},503)
  const formId = '6aba04887fc55e00076e6164'
  const res = await fetch(`https://api.netlify.com/api/v1/forms/${formId}/submissions?per_page=100`, {
    headers: {Authorization:`Bearer ${process.env.ANSH_NETLIFY_TOKEN}`,Accept:'application/json'}
  })
  if (!res.ok) return json({error:'Could not load enquiries'},502)
  const rows = await res.json()
  if (!Array.isArray(rows)) return json({ error: 'Unexpected enquiry response' }, 502)
  return json({enquiries: rows.map(x => ({id:x.id,created_at:x.created_at,data:{name:x.data?.name || '',phone:x.data?.phone || '',email:x.data?.email || '',interestType:x.data?.interestType || '',serviceType:x.data?.serviceType || '',message:x.data?.message || ''}})),note:'Showing up to 100 latest verified enquiries. Netlify Forms remains the source of truth.'})
}
