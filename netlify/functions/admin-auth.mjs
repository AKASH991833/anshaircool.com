import { guard, json } from './_guard.mjs'
export default async req => {
  const denied = await guard(req); if (denied) return denied
  return json({authenticated:true})
}
