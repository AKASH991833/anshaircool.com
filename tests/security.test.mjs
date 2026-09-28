import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const src=readFileSync('admin/admin.src.js','utf8')
test('invite token is redirected to admin route before callback',()=>{
 assert.match(src,/location\.hash\.startsWith\('#invite_token='\)/)
 assert.match(src,/history\.replaceState\(null,'','\/admin\/'\+location\.hash\)/)
})
test('dashboard is shown only after server-side admin-auth',()=>{
 assert(src.indexOf("await api('admin-auth')") < src.indexOf("$('#dashboard').hidden=false"))
})
test('auth endpoint is gated',()=>{
 assert.match(readFileSync('netlify/functions/admin-auth.mjs','utf8'),/const denied = await guard\(req\)/)
})
