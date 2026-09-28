import { guard, json } from './_guard.mjs'

const types = new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp']])
const validImage = (bytes, type) => {
  if (type === 'image/png') return bytes.length >= 45 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16) === 'IHDR' && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0 && bytes.toString('ascii',bytes.length-8,bytes.length-4) === 'IEND'
  if (type === 'image/jpeg') return bytes.length >= 40 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length-2] === 255 && bytes[bytes.length-1] === 217
  if (type === 'image/webp') return bytes.length >= 40 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.readUInt32LE(4) === bytes.length - 8 && bytes.toString('ascii',8,12) === 'WEBP' && ['VP8 ','VP8L','VP8X'].includes(bytes.toString('ascii',12,16))
  return false
}
export default async (req) => {
  const denied = await guard(req, true); if (denied) return denied
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!process.env.ANSH_GITHUB_TOKEN) return json({ error:'Publishing not configured' },503)
  if (Number(req.headers.get('content-length') || 0) > 3_000_000) return json({error:'Image is too large (3 MB max)'},413)
  let form; try { form = await req.formData() } catch { return json({error:'Invalid upload'},400) }
  const file = form.get('image')
  if (!file || typeof file.arrayBuffer !== 'function' || !types.has(file.type) || file.size > 3_000_000 || file.size < 40) return json({error:'Choose a JPEG, PNG or WebP under 3 MB'},400)
  const bytes = Buffer.from(await file.arrayBuffer())
  if (!validImage(bytes, file.type)) return json({error:'File content does not match its image type'},400)
  const path = `images/gallery-${crypto.randomUUID()}.${types.get(file.type)}`
  const res = await fetch(`https://api.github.com/repos/AKASH991833/anshaircool.com/contents/${path}`, {
    method:'PUT',
    headers:{'Authorization':`Bearer ${process.env.ANSH_GITHUB_TOKEN}`,'Accept':'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},
    body:JSON.stringify({message:'Upload gallery photo from secure admin', content:bytes.toString('base64'), branch:'main'})
  })
  if (!res.ok) return json({error:'Gallery upload failed'},502)
  const result = await res.json()
  return json({path,commit:result.commit?.sha,note:'Photo committed. Add it to the gallery list and save; Netlify still needs to deploy.'})
}
