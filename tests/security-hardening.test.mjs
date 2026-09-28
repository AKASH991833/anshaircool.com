import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,existsSync} from 'node:fs'
const read=p=>readFileSync(p,'utf8')
test('published site excludes legacy backend and contacts fixture',()=>{
 assert(!existsSync('public/backend/app.py'))
 assert(!existsSync('public/frontend/admin/index.html'))
 assert(!existsSync('public/transparentdb/contacts.json'))
})
test('public scripts avoid inline handler and scripts under CSP',()=>{
 for(const file of ['public/index.html','public/gallery.html']){
  const text=read(file)
  assert(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(text))
  assert(!/\sonclick\s*=/i.test(text))
 }
 assert.match(read('netlify.toml'),/form-action 'self'/)
 assert.match(read('netlify.toml'),/frame-ancestors 'none'/)
})
test('upload checks structural image properties, not only initial magic bytes',()=>{
 const s=read('netlify/functions/admin-upload.mjs')
 assert.match(s,/validImage\(bytes, file.type\)/)
 assert.match(s,/IEND/)
 assert.match(s,/bytes\.readUInt32LE\(4\) === bytes\.length - 8/)
})
