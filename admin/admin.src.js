import { login,logout,getUser,handleAuthCallback,acceptInvite } from '@netlify/identity'
const $=s=>document.querySelector(s)
const owner='akashvishwakarma1262@gmail.com'
let heroSha,gallerySha,gallery=[]
let inviteToken
function status(message,auth=false){$(auth?'#loginStatus':'#status').textContent=message}
async function api(path,options={}) {
  const r=await fetch('/.netlify/functions/'+path,{...options,credentials:'same-origin',headers:{...options.headers}})
  const j=await r.json().catch(()=>({error:'Unexpected server reply'}))
  if(!r.ok)throw Error(j.error||'Request failed')
  return j
}
async function initialize(){
  try {
    if(location.hash.startsWith('#invite_token=')) history.replaceState(null,'','/admin/'+location.hash)
    const callback=await handleAuthCallback()
    if(callback?.type==='invite'){inviteToken=callback.token;$('#accept').hidden=false;status('Create your new password to activate your invite.',true)}
    else if(callback?.type==='recovery')status('Use your Netlify recovery link to set a new password.',true)
    else if(callback?.user) status('Signed in.',true)
  } catch(e){status(e.message,true)}
  const user=await getUser()
  if(user?.email?.toLowerCase()!==owner)return
  try{await api('admin-auth')}catch(e){status('Signed in, but admin access is not verified: '+e.message,true);return}
  $('#auth').hidden=true;$('#dashboard').hidden=false;$('#logout').hidden=false;$('#account').textContent=user.email
  try{const x=await api('admin-content?table=hero');heroSha=x.sha;for(const [key,value] of Object.entries(x.data))if($('#heroForm').elements.namedItem(key))$('#heroForm').elements.namedItem(key).value=value||'';status('Ready to edit.')}catch(e){status(e.message)}
}
$('#login').addEventListener('submit',async e=>{e.preventDefault();status('Signing in...',true);try{await login($('#email').value,$('#password').value);await initialize()}catch(err){status(err.message,true)}})
$('#logout').addEventListener('click',async()=>{try{await logout()}finally{location.reload()}})
$('#acceptInvite').addEventListener('click',async()=>{try{if($('#newPassword').value.length<12)throw Error('Use at least 12 characters.');await acceptInvite(inviteToken,$('#newPassword').value);inviteToken=undefined;await initialize()}catch(err){status(err.message,true)}})
$('#heroForm').addEventListener('submit',async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;status('Saving...');try{const data=Object.fromEntries(new FormData(e.currentTarget));const x=await api('admin-content?table=hero',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,sha:heroSha})});heroSha=x.sha;status('Saved to GitHub. Check the public site after Netlify finishes deploying.')}catch(err){status(err.message)}finally{btn.disabled=false}})
function renderGallery(){const area=$('#galleryItems');area.replaceChildren();gallery.forEach((x,i)=>{const row=document.createElement('div');row.className='gallery-row';const img=document.createElement('img');img.src='/'+x.image;img.alt='Gallery preview';const input=document.createElement('input');input.value=x.caption;input.maxLength=240;input.placeholder='Photo caption';input.addEventListener('input',()=>gallery[i].caption=input.value);const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.addEventListener('click',()=>{gallery.splice(i,1);renderGallery()});const category=document.createElement('select');category.setAttribute('aria-label','Photo destination');for(const [value,label] of [['work','Work gallery'],['rent','AC rental']]){const option=new Option(label,value);category.add(option)}category.value=x.category||'work';category.addEventListener('change',()=>gallery[i].category=category.value);row.append(img,input,category,remove);area.append(row)})}
async function loadGallery(){const x=await api('admin-content?table=gallery');gallery=x.data;gallerySha=x.sha;renderGallery()}
$('#upload').addEventListener('click',async()=>{const file=$('#galleryFile').files[0];if(!file)return status('Choose an image first.');if(file.size>3000000)return status('The image must be under 3 MB.');const button=$('#upload');button.disabled=true;status('Uploading photo...');try{const data=new FormData();data.append('image',file);const x=await api('admin-upload',{method:'POST',body:data});gallery.push({id:Math.max(0,...gallery.map(i=>i.id))+1,image:x.path,caption:'New '+($('#photoCategory').value==='rent'?'rental':'work')+' photo',category:$('#photoCategory').value});renderGallery();const saved=await api('admin-content?table=gallery',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:gallery,sha:gallerySha})});gallerySha=saved.sha;status('Photo saved. It will appear in '+($('#photoCategory').value==='rent'?'AC rental':'Work gallery')+' after Netlify deploys.')}catch(err){status(err.message)}finally{button.disabled=false}})
$('#saveGallery').addEventListener('click',async()=>{const button=$('#saveGallery');button.disabled=true;status('Saving gallery...');try{const x=await api('admin-content?table=gallery',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:gallery,sha:gallerySha})});gallerySha=x.sha;status('Gallery saved to GitHub. Check the public gallery after the Netlify deploy completes.')}catch(err){status(err.message)}finally{button.disabled=false}})
async function loadEnquiries(){const area=$('#enquiryItems');area.textContent='Loading...';try{const x=await api('admin-enquiries');area.replaceChildren();for(const row of x.enquiries){const el=document.createElement('article');el.className='enquiry';const h=document.createElement('h3');h.textContent=row.data.name||'No name';const p=document.createElement('p');p.textContent=`${new Date(row.created_at).toLocaleString()}\nPhone: ${row.data.phone}\nEmail: ${row.data.email}\n${row.data.message}`;el.append(h,p);area.append(el)}if(!x.enquiries.length)area.textContent='No verified enquiries yet.'}catch(err){area.textContent=err.message}}
async function loadVisits(){try{const x=await api('admin-visits');$('#visitTotal').textContent=String(x.total);const area=$('#visitItems');area.replaceChildren();x.days.slice(-7).reverse().forEach(row=>{const el=document.createElement('div');el.className='day';const d=document.createElement('span');d.textContent=row.day;const n=document.createElement('strong');n.textContent=String(row.count);el.append(d,n);area.append(el)})}catch(err){status(err.message)}}
$('#refreshEnquiries').addEventListener('click',loadEnquiries);$('#refreshVisits').addEventListener('click',loadVisits)
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',async()=>{for(const b of document.querySelectorAll('[data-tab]')){b.classList.toggle('active',b===button);$('#tab-'+b.dataset.tab).hidden=b!==button}status('');try{if(button.dataset.tab==='gallery')await loadGallery();if(button.dataset.tab==='enquiries')await loadEnquiries();if(button.dataset.tab==='visitors')await loadVisits()}catch(e){status(e.message)}}))
initialize()
