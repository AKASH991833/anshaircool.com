import { getStore } from '@netlify/blobs'
import { guard, json } from './_guard.mjs'
export default async (req) => {
  const denied = await guard(req); if (denied) return denied
  if (req.method !== 'GET') return json({error:'Method not allowed'},405)
  const store = getStore('ansh-visitor-events')
  const days = 30, labels = []
  for (let i=days-1;i>=0;i--) labels.push(new Date(Date.now()-i*86400000).toISOString().slice(0,10))
  let total=0
  const counts=[]
  for (const day of labels) {
    let n=0
    for await (const page of store.list({prefix:`${day}/`,paginate:true})) n+=page.blobs.length
    total+=n;counts.push({day,count:n})
  }
  return json({total,days:counts,note:'Approximate visits (one per browser per day), not unique people. Counts start when tracking was enabled.'})
}
