import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const adminHtml=fs.readFileSync('admin/index.html','utf8')
const guard=fs.readFileSync('netlify/functions/_guard.mjs','utf8')
const upload=fs.readFileSync('netlify/functions/admin-upload.mjs','utf8')
const content=fs.readFileSync('netlify/functions/admin-content.mjs','utf8')
const forms=fs.readFileSync('netlify/functions/admin-enquiries.mjs','utf8')
test('no legacy password or localStorage authentication in public build',()=>{
  assert(!adminHtml.includes('admin123'))
  assert(!adminHtml.includes('localStorage'))
  assert(!fs.existsSync('public/frontend/admin/index.html'))
})
test('all private endpoints gate before token-backed calls',()=>{
  assert.match(guard,/await getUser\(\)/)
  assert.match(guard,/user\.email\?\.toLowerCase\(\) !== OWNER_EMAIL/)
  assert.match(guard,/\.netlify\/identity\/user/)
  assert.match(guard,/verifyRequestOrigin\(req\)/)
  for(const code of [upload,content,forms])assert.match(code,/const denied = await guard\(req[^\n]*; if \(denied\) return denied/)
})
test('tokens only in server files',()=>{
  for(const f of ['admin/admin.src.js','admin/index.html','public/admin/admin.js','script.js']) {
    const source=fs.readFileSync(f,'utf8')
    assert(!source.includes('ANS H_GITHUB_TOKEN'.replace(' ','')))
    assert(!source.includes('ANSH_NETLIFY_TOKEN'))
    assert(!source.includes('github_pat_'))
  }
})
test('server parsers constrain gallery upload and field shapes',()=>{
  assert.match(upload,/file\.size > 3_000_000/)
  assert.match(upload,/File content does not match its image type/)
  assert.match(content,/new Set\(payload\.map\(x => x\.id\)\)\.size/)
  assert.match(content,/body\.sha !== entry\.sha/)
})
