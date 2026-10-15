(function(){
var r=document.documentElement,b=document.getElementById('theme');
function ic(){b.firstElementChild.className='fa-solid '+(r.dataset.theme==='dark'?'fa-sun':'fa-moon')}ic();
b.onclick=function(){r.dataset.theme=r.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('theme',r.dataset.theme)}catch(e){}ic()};
document.getElementById('y').textContent=new Date().getFullYear();
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1});
document.querySelectorAll('.rv').forEach(function(e){if(/shot/.test(location.search))e.classList.add('in');else io.observe(e)});
document.querySelectorAll('[data-svc]').forEach(function(a){a.addEventListener('click',function(){var s=document.getElementById('serviceType');if(s){var v=a.dataset.svc,f=0;for(var i=0;i<s.options.length;i++)if(s.options[i].text===v){s.selectedIndex=i;f=1}if(!f){document.getElementById('message').value='Enquiry about '+v}}})});
var f=document.querySelector('form[name=service-enquiry]');
f.addEventListener('submit',function(e){e.preventDefault();var m=f.querySelector('.msg'),btn=f.querySelector('button');btn.disabled=true;m.textContent='Sending...';
fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(f)).toString()}).then(function(x){if(!x.ok)throw 0;location.href='/thank-you.html'}).catch(function(){btn.disabled=false;m.textContent='Could not send. Please call us instead.'})});
})();
