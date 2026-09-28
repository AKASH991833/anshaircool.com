const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#navigation');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  nav.classList.toggle('open', open);
});
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
  nav.classList.remove('open');
}));
document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelectorAll('[data-service]').forEach(a => a.addEventListener('click', () => {
  document.querySelector('#serviceSelect').value = a.dataset.service;
}));
const form = document.querySelector('#contactForm');
form?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.querySelector('#formStatus');
  const previous = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Sending...';
  status.textContent = 'Submitting your enquiry...';
  try {
    const response = await fetch('/', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams(new FormData(form)).toString()});
    if (!response.ok) throw new Error(`Submission returned ${response.status}`);
    window.location.assign('/thank-you.html');
  } catch (error) {
    status.textContent = 'Your enquiry was not confirmed. Please try again later. Nothing has been saved in this browser.';
    status.classList.add('error');
    button.innerHTML = previous;
    button.disabled = false;
  }
});

// The editor changes versioned JSON on GitHub. Always read fresh content; never cache edits in a visitor's browser.
(async function loadPublishedContent() {
  try {
    const res = await fetch('/content/site.json', {cache:'no-store'});
    if (!res.ok) return;
    const data = await res.json();
    for (const [selector,value] of [['#heroDescription',data.heroDescription],['#aboutDescription',data.aboutDescription],['#contactNote',data.contactNote]]) {
      if (typeof value === 'string' && value.trim()) document.querySelector(selector).textContent = value;
    }
    if (typeof data.heroTitle === 'string' && data.heroTitle.trim()) {
      const h = document.querySelector('#heroTitle');
      const words = data.heroTitle.trim().split(/\s+/);
      const emphasis = words.length >= 4 ? words.splice(-2).join(' ') : '';
      h.textContent = words.join(' ') + (emphasis ? ' ' : '');
      if (emphasis) {const em = document.createElement('em');em.textContent = emphasis;h.append(em);}
    }
    if (Array.isArray(data.services)) {
      const grid = document.querySelector('#servicesGrid');
      grid.replaceChildren();
      data.services.slice(0,9).forEach((item,i) => {
        if (!item || !item.title) return;
        const card = document.createElement('article'); card.className='service';
        const icon = document.createElement('span');icon.className='service-icon';icon.textContent=['✳','◌','⌁'][i%3];
        const index = document.createElement('span');index.className='service-index';index.textContent=String(i+1).padStart(2,'0');
        const title = document.createElement('h3');title.textContent=item.title;
        const desc = document.createElement('p');desc.textContent=item.description || '';
        const link = document.createElement('a');link.href='#contact';link.textContent='Enquire about this service ↗';
        link.addEventListener('click',()=>{document.querySelector('#serviceSelect').value='Other enquiry';document.querySelector('[name="message"]').value='Enquiry about '+item.title+'\n';});
        card.append(icon,index,title,desc,link);grid.append(card);
      });
    }
  } catch (_) { /* Static HTML remains accessible if content is temporarily unavailable. */ }
})();
