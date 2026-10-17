(function(){
var r=document.documentElement,b=document.getElementById('theme');
function ic(){b.firstElementChild.className='fa-solid '+(r.dataset.theme==='dark'?'fa-sun':'fa-moon')}ic();
b.onclick=function(){r.dataset.theme=r.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('theme-v2',r.dataset.theme)}catch(e){}ic()};
document.getElementById('y').textContent=new Date().getFullYear();
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1});
document.querySelectorAll('.rv').forEach(function(e){if(/shot/.test(location.search))e.classList.add('in');else io.observe(e)});
document.querySelectorAll('[data-svc]').forEach(function(a){a.addEventListener('click',function(){var s=document.getElementById('serviceType');if(s){var v=a.dataset.svc,f=0;for(var i=0;i<s.options.length;i++)if(s.options[i].text===v){s.selectedIndex=i;f=1}if(!f){document.getElementById('message').value='Enquiry about '+v}}})});
var f=document.getElementById('book'),WAN='919819104977';
function val(){var m=f.querySelector('.msg');for(var k of['name','phone','address']){var e=f.elements[k];if(!e.value.trim()){m.textContent='Please fill your '+(k==='address'?'address':k)+'.';e.focus();return null}}
if(f.elements.phone.value.replace(/\D/g,'').length<10){m.textContent='Enter a 10 digit phone number.';f.elements.phone.focus();return null}
return{name:f.elements.name.value.trim(),phone:f.elements.phone.value.trim(),service:f.elements.serviceType.value,when:f.elements.when.value,slot:f.elements.slot.value,address:f.elements.address.value.trim(),message:f.elements.message.value.trim(),website:f.elements.website.value}}
function wam(d){return 'Hi Ansh Air Cool, I want to book a service.\nName: '+d.name+'\nPhone: '+d.phone+'\nService: '+d.service+'\nTime: '+d.when+', '+d.slot+'\nAddress: '+d.address+(d.message?'\nProblem: '+d.message:'')}
document.getElementById('bkwa').addEventListener('click',function(){var d=val();if(!d)return;f.querySelector('.msg').textContent='';window.open('https://wa.me/'+WAN+'?text='+encodeURIComponent(wam(d)),'_blank','noopener')});
f.addEventListener('submit',function(e){e.preventDefault();var d=val();if(!d)return;var m=f.querySelector('.msg'),btn=document.getElementById('bksend');btn.disabled=true;m.textContent='Sending...';
fetch('/.netlify/functions/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(function(x){if(!x.ok)throw 0;location.href='/thank-you.html'}).catch(function(){btn.disabled=false;m.innerHTML='Could not send. Please use the WhatsApp button or call us on 9819104977.'})});
})();
