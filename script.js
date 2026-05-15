const API_BASE = '';

document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
  document.dispatchEvent(new Event('appReady'));
});

async function initApp() {
  await loadData();
  initNavbar();
  initMobileMenu();
  initCounterAnimation();
  initFormSubmission();
  initSmoothScroll();
  initCartButtons();
  initWhatsAppButton();
  initWishlistButtons();
  initPurchaseToggle();
  initHeroParallax();
  initScrollReveal();
  initTiltEffect();
  initCursorGlow();
  initBackToTop();
  initServiceCards();
  initProductCards();
  initTestimonialCarousel();
  initCountdown();
  initHackerEffects();
  initProgressIndicator();
  initModal();
  initFaqAccordion();
  initFormValidation();
  initParticleTrail();
  initSkillBars();
  initNotificationToast();
  initMobileBottomBar();
  initRippleEffect();
  initServiceBookings();
}

async function loadData() {
  try {
    const res = await fetch(`${API_BASE}/api/website-data`);
    if (!res.ok) throw new Error('API not available');
    const data = await res.json();
    if (data.hero) renderHero(data.hero);
    if (data.services) renderServices(data.services);
    if (data.features) renderFeatures(data.features);
    if (data.products) renderProducts(data.products);
    if (data.testimonials) renderTestimonials(data.testimonials);
    if (data.settings) updateFooter(data.settings);
    return;
  } catch (e) {
  }

  if (typeof TransparentDB === 'undefined') {
    return;
  }

  const [services, products, heroData, featuresData, testimonialsData, settingsData, galleryData] = await Promise.all([
    TransparentDB.services(),
    TransparentDB.products(),
    TransparentDB.hero(),
    TransparentDB.features(),
    TransparentDB.testimonials(),
    TransparentDB.settings(),
    TransparentDB.gallery()
  ]);

  if (heroData) renderHero(heroData);
  if (services) renderServices(services);
  if (featuresData) renderFeatures(featuresData);
  if (products) renderProducts(products);
  if (testimonialsData) renderTestimonials(testimonialsData);
  if (settingsData) updateFooter(settingsData);
  if (galleryData) renderGallery(galleryData);
}

function renderHero(data) {
  const badge = document.querySelector('.hero-badge');
  if (badge) badge.innerHTML = `<span class="badge-dot pulse"></span>${data.trustBadge || "India's #1 Trusted AC Brand"}`;

  const lines = document.querySelectorAll('.hero-line');
  if (lines[0]) lines[0].textContent = data.titleLine1 || 'Experience';
  if (lines[1]) lines[1].innerHTML = `<span class="gradient-text">${data.titleLine2 || 'Ultimate Cooling'}</span>`;
  if (lines[2]) lines[2].textContent = data.titleLine3 || 'Like Never Before';

  const desc = document.querySelector('.hero-desc');
  if (desc) desc.innerHTML = data.subtitle || '';

  const features = document.querySelector('.hero-features');
  if (features && data.quickFeatures) {
    features.innerHTML = data.quickFeatures.map(f =>
      `<span><i class="fas ${f.icon}"></i> ${f.text}</span>`
    ).join('');
  }

  const stats = document.querySelector('.hero-stats');
  if (stats && data.stats) {
    stats.innerHTML = data.stats.map((s, i) => `
      <div class="hero-stat">
        <span class="hero-stat-num" data-count="${s.count}">0</span>
        <span class="hero-stat-plus">${s.suffix}</span>
        <span class="hero-stat-label">${s.label}</span>
      </div>
      ${i < data.stats.length - 1 ? '<div class="hero-stat-divider"></div>' : ''}
    `).join('');
  }

  const priceValue = document.querySelector('.price-value');
  const priceOld = document.querySelector('.price-old');
  if (priceValue && data.startingPrice) priceValue.textContent = `₹${Number(data.startingPrice).toLocaleString()}`;
  if (priceOld && data.oldPrice) priceOld.textContent = `₹${Number(data.oldPrice).toLocaleString()}`;
}

function renderServices(services) {
  const grid = document.querySelector('.services-grid');
  if (!grid) return;

  const cards = services.slice(0, 3).map(s => `
    <div class="service-card" data-aos="fade-up">
      <div class="service-image-wrapper">
        <div class="service-glow"></div>
        <div class="service-image">
          <img src="${s.image}" alt="${s.title}" loading="lazy">
        </div>
      </div>
      <div class="service-info">
        <h3 class="service-title">${s.title}</h3>
        <p class="service-description">${s.description}</p>
        <ul class="service-features">
          ${(s.features || []).map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
        </ul>
          <button class="service-cta-btn" data-service-id="${s.id}" data-service-title="${s.title}">
            <span>Book Now</span>
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
  grid.innerHTML = cards;

  const hiddenGrid = document.querySelector('#hiddenServices .services-grid');
  if (hiddenGrid) {
    hiddenGrid.innerHTML = services.slice(3).map(s => `
      <div class="service-card">
        <div class="service-image-wrapper">
          <div class="service-glow"></div>
          <div class="service-image">
            <img src="${s.image}" alt="${s.title}" loading="lazy">
          </div>
        </div>
        <div class="service-info">
          <h3 class="service-title">${s.title}</h3>
          <p class="service-description">${s.description}</p>
          <ul class="service-features">
            ${(s.features || []).map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
          </ul>
           <button class="service-cta-btn" data-service-id="${s.id}" data-service-title="${s.title}">
            <span>Book Now</span>
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `).join('');
  }
}

function renderFeatures(features) {
  const grid = document.querySelector('.features-grid');
  if (!grid) return;
  grid.innerHTML = features.map((f, i) => `
    <div class="feature-card" data-aos="fade-up" data-aos-delay="${(i + 1) * 100}">
      <div class="feature-icon">
        <i class="fas ${f.icon}"></i>
      </div>
      <h3 class="feature-title">${f.title}</h3>
      <p class="feature-description">${f.description}</p>
    </div>
  `).join('');
}

function renderProducts(products) {
  const grid = document.querySelector('.products-grid');
  if (!grid) return;
  grid.innerHTML = products.map((p, i) => {
    const stars = Math.floor(p.rating);
    const hasHalf = p.rating % 1 !== 0;
    const starIcons = [];
    for (let j = 0; j < 5; j++) {
      if (j < stars) starIcons.push('<i class="fas fa-star"></i>');
      else if (j === stars && hasHalf) starIcons.push('<i class="fas fa-star-half-alt"></i>');
      else starIcons.push('<i class="far fa-star"></i>');
    }

    const badgeHtml = p.badge ? `
      <span class="product-badge ${p.badge.type}">
        <i class="fas fa-fire"></i> ${p.badge.text}
      </span>` : '';

    return `
    <div class="product-card card-gradient-border" data-mode="buy" data-aos="fade-up" data-aos-delay="${i * 150}">
      <div class="card-shine"></div>
      <div class="card-glow"></div>
      <div class="badge-container">
        ${badgeHtml}
      </div>
      <button class="wishlist-btn" aria-label="Add to Wishlist">
        <i class="far fa-heart"></i>
      </button>
      <div class="product-image-wrapper">
        <div class="product-glow"></div>
        <div class="product-image">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </div>
        <div class="product-reflection">
          <img src="${p.image}" alt="" loading="lazy">
        </div>
      </div>
      <div class="product-overlay">
        <button class="quick-view-btn"><i class="fas fa-eye"></i><span>Quick View</span></button>
      </div>
      <div class="product-info">
        <div class="product-header">
          <span class="product-category">${p.category}</span>
          <div class="product-rating">
            <div class="stars">${starIcons.join('')}</div>
            <span class="rating-count">(${(p.ratingCount || 0).toLocaleString()})</span>
          </div>
        </div>
        <h3 class="product-name">${p.name}</h3>
        <div class="buy-content">
          <div class="product-price-row">
            <div class="price-container">
              <span class="price-current">₹${(p.buyPrice || 0).toLocaleString()}</span>
              <span class="price-old">₹${(p.oldPrice || 0).toLocaleString()}</span>
            </div>
            <span class="savings-badge">Save ₹${((p.oldPrice || 0) - (p.buyPrice || 0)).toLocaleString()}</span>
          </div>
          <p class="product-description">${p.descriptionBuy || ''}</p>
        </div>
        <div class="rent-content" style="display: none;">
          <div class="product-price-row">
            <div class="price-container">
              <span class="price-current">₹${(p.rentPrice || 0).toLocaleString()}</span>
              <span class="rent-period">/month</span>
            </div>
            <span class="savings-badge" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">Min. 6 Months</span>
          </div>
          <p class="product-description">${p.descriptionRent || ''}</p>
        </div>
        <div class="feature-chips">
          ${(p.features || []).map(f => `<span class="feature-chip"><i class="fas fa-bolt"></i><span>${f}</span></span>`).join('')}
        </div>
        <button class="add-to-cart-btn">
          <span class="btn-content">
            <i class="fas fa-shopping-bag"></i>
            <span>Add to Cart</span>
          </span>
          <div class="btn-glow"></div>
        </button>
      </div>
    </div>`;
  }).join('');
}

function renderTestimonials(testimonials) {
  const grid = document.querySelector('.testimonials-grid');
  if (!grid) return;
  grid.innerHTML = testimonials.map(t => {
    const stars = Math.floor(t.rating);
    const hasHalf = t.rating % 1 !== 0;
    const starIcons = [];
    for (let j = 0; j < 5; j++) {
      if (j < stars) starIcons.push('<i class="fas fa-star"></i>');
      else if (j === stars && hasHalf) starIcons.push('<i class="fas fa-star-half-alt"></i>');
      else starIcons.push('<i class="far fa-star"></i>');
    }
    return `
    <div class="testimonial-card" data-aos="fade-up">
      <div class="testimonial-quote"><i class="fas fa-quote-left"></i></div>
      <p class="testimonial-text">${t.text}</p>
      <div class="testimonial-author">
        <div class="author-avatar"><img src="${t.avatar}" alt="${t.name}"></div>
        <div class="author-info">
          <h4>${t.name}</h4>
          <p>${t.location}</p>
          <div class="author-rating">${starIcons.join('')}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function updateWhatsApp(settings) {
  const wa = document.getElementById('whatsappChat');
  if (!wa || !settings) return;
  const num = settings.whatsappNumber || '919876543210';
  const msg = settings.whatsappMessage || "Hi, I'm interested in your AC products";
  wa.href = 'https://wa.me/' + num.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(msg);
}

function updateSocialLinks(settings) {
  document.querySelectorAll('.social-link').forEach(link => {
    const aria = link.getAttribute('aria-label')?.toLowerCase();
    if (!aria || !settings) return;
    const urls = { facebook: settings.facebook, instagram: settings.instagram, twitter: settings.twitter, youtube: settings.youtube };
    if (urls[aria]) link.href = urls[aria];
  });
}

function updateContactInfo(settings) {
  const waLink = document.getElementById('contactWhatsAppLink');
  if (waLink && settings.whatsappNumber) {
    const clean = settings.whatsappNumber.replace(/[^0-9]/g, '');
    waLink.href = 'https://wa.me/' + clean;
    waLink.textContent = settings.phone || settings.whatsappNumber;
  }
}

function updateFooter(settings) {
  const logo = document.querySelector('.footer .logo-text');
  if (logo) {
    const parts = (settings.siteName || 'ANSH AIR COOL').split(' ');
    if (parts.length >= 2) {
      logo.innerHTML = `${parts.slice(0, -1).join(' ')} <span class="logo-ac">${parts[parts.length - 1]}</span>`;
    } else {
      logo.innerHTML = `${parts[0]} <span class="logo-ac"></span>`;
    }
  }
  const about = document.querySelector('.footer-about');
  if (about) about.textContent = settings.description || settings.tagline || '';
  updateWhatsApp(settings);
  updateSocialLinks(settings);
  updateContactInfo(settings);
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.classList.add('aos-animate');
        entry.target.style.opacity = '';
        entry.target.style.transform = '';
        const delay = parseInt(entry.target.dataset.aosDelay) || 0;
        entry.target.style.transitionDelay = delay + 'ms';
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
  document.querySelectorAll('.section-transition').forEach(el => observer.observe(el));
}

function initTiltEffect() {
  document.querySelectorAll('.product-card, .service-card, .testimonial-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1,1,1)';
    });
  });
}

function initCursorGlow() {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });

  document.querySelectorAll('a, button, .service-card, .product-card, .testimonial-card').forEach(el => {
    el.addEventListener('mouseenter', () => glow.classList.add('active'));
    el.addEventListener('mouseleave', () => glow.classList.remove('active'));
  });
}

function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.pageYOffset > 500);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initServiceCards() {
  document.querySelectorAll('.service-card').forEach(card => {
    const img = card.querySelector('.service-image img');
    if (!img) return;
    const originalSrc = img.src;
    const overlay = document.createElement('div');
    overlay.className = 'service-icon-badge';
    overlay.innerHTML = '<i class="fas fa-wrench"></i>';
    card.querySelector('.service-image-wrapper')?.appendChild(overlay);
  });
}

function initProductCards() {}

function initTestimonialCarousel() {
  const grid = document.querySelector('.testimonials-grid');
  if (!grid) return;
  let isDown = false, startX, scrollLeft;

  grid.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - grid.offsetLeft;
    scrollLeft = grid.scrollLeft;
  });

  grid.addEventListener('mouseleave', () => isDown = false);
  grid.addEventListener('mouseup', () => isDown = false);

  grid.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - grid.offsetLeft;
    const walk = (x - startX) * 2;
    grid.scrollLeft = scrollLeft - walk;
  });
}

function initHeroParallax() {
  const heroBg = document.querySelector('.hero-bg-image');
  if (!heroBg) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        heroBg.style.transform = `translateY(${scrolled * 0.4}px) scale(${1 + scrolled * 0.0002})`;
        ticking = false;
      });
      ticking = true;
    }
  });
}

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.pageYOffset > 50);
  });

  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      if (window.pageYOffset >= section.offsetTop - 200) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  });
}

function initMobileMenu() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!navToggle || !navLinks) return;

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

function initCounterAnimation() {
  let animated = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        document.querySelectorAll('.stat-number, .hero-stat-num').forEach(counter => {
          const target = parseInt(counter.getAttribute('data-count'));
          const duration = 2000;
          const step = target / (duration / 16);
          let current = 0;
          function update() {
            current += step;
            if (current < target) {
              counter.textContent = Math.floor(current);
              requestAnimationFrame(update);
            } else {
              counter.textContent = target;
            }
          }
          update();
        });
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) observer.observe(heroStats);
}

function initFormSubmission() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  // Populate service dropdown from localStorage
  (function loadServiceDropdown() {
    const sel = document.getElementById('serviceType');
    if (!sel) return;
    let svc = [];
    try { svc = JSON.parse(localStorage.getItem('transparentdb_services')) || []; } catch(e) {}
    sel.innerHTML = '<option value="">Select service...</option>' + svc.map(s => '<option value="' + s.title + '">' + s.title + '</option>').join('');
  })();

  // Toggle service dropdown based on interest
  const interestSel = document.getElementById('interestType');
  const serviceGroup = document.getElementById('serviceGroup');
  if (interestSel && serviceGroup) {
    interestSel.addEventListener('change', function() {
      serviceGroup.style.display = this.value === 'service' ? 'block' : 'none';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    const name = form.querySelector('#name')?.value?.trim();
    const phone = form.querySelector('#phone')?.value?.trim();
    const email = form.querySelector('#email')?.value?.trim();
    const message = form.querySelector('#message')?.value?.trim();
    const interestType = form.querySelector('#interestType')?.value || '';
    const serviceType = form.querySelector('#serviceType')?.value || '';

    if (!name || !phone || !message) {
      if (typeof window.showToast === 'function') {
        window.showToast('Please fill all required fields (Name, Phone, Message)', 'error');
      }
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (typeof window.showToast === 'function') {
        window.showToast('Please enter a valid email or leave it empty', 'error');
      }
      return;
    }

    let fullMessage = message;
    if (interestType) fullMessage = 'Interest: ' + interestType + (serviceType ? ' (' + serviceType + ')' : '') + '\n' + message;
    if (interestType === 'buy') fullMessage = 'Want to Buy AC\n' + message;
    if (interestType === 'rent') fullMessage = 'Want to Rent AC\n' + message;
    if (interestType === 'service') fullMessage = 'Service Needed: ' + (serviceType || 'General') + '\n' + message;

    const formData = new URLSearchParams({
      name,
      phone,
      email: email || '',
      message: fullMessage
    });

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/contact/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      if (!res.ok) throw new Error('Server returned ' + res.status);
    } catch (e) {
      console.warn('Server unavailable, saving locally');
      if (typeof TransparentDB !== 'undefined') {
        await TransparentDB.submitContact({name, email, phone, message: fullMessage});
      }
    }

    setTimeout(() => {
      submitBtn.innerHTML = '<i class="fas fa-check"></i> Sent!';
      submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      if (typeof window.showToast === 'function') {
        window.showToast('Message sent successfully!');
      }
      document.querySelectorAll('.contact-form .form-group').forEach(g => g.classList.remove('success'));
      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        submitBtn.disabled = false;
        form.reset();
        document.getElementById('serviceGroup').style.display = 'none';
      }, 2000);
    }, 1500);
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
}

function initCartButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;
    const card = btn.closest('.product-card');
    if (!card) return;
    const name = card.querySelector('.product-name')?.textContent || 'Product';
    const price = card.querySelector('.price-current')?.textContent || '';
    const mode = card.getAttribute('data-mode') || 'buy';
    const orders = JSON.parse(localStorage.getItem('transparentdb_orders') || '[]');
    orders.unshift({id: Date.now(), type: 'product', item: name, price, mode, date: new Date().toISOString(), status: 'pending'});
    localStorage.setItem('transparentdb_orders', JSON.stringify(orders));
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Added!';
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    setTimeout(() => { btn.innerHTML = originalText; btn.style.background = ''; }, 2000);
  });
}

function initWhatsAppButton() {
  const whatsappBtn = document.getElementById('whatsappChat');
  if (!whatsappBtn) return;
  window.addEventListener('scroll', () => {
    whatsappBtn.classList.toggle('visible', window.pageYOffset > 500);
  });
}

function initWishlistButtons() {
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      this.classList.toggle('active');
      const icon = this.querySelector('i');
      if (this.classList.contains('active')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        this.style.transform = 'scale(1.3)';
        setTimeout(() => this.style.transform = 'scale(1)', 200);
      } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
      }
    });
  });
}

function initPurchaseToggle() {
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      switchMode(this.getAttribute('data-mode'));
    });
  });
}

function switchMode(mode) {
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
  });

  document.querySelectorAll('.product-card').forEach(card => {
    card.setAttribute('data-mode', mode);
    const buyContent = card.querySelector('.buy-content');
    const rentContent = card.querySelector('.rent-content');
    if (buyContent) buyContent.style.display = mode === 'rent' ? 'none' : 'block';
    if (rentContent) rentContent.style.display = mode === 'rent' ? 'block' : 'none';

    const btnContent = card.querySelector('.add-to-cart-btn .btn-content');
    if (btnContent) {
      const icon = btnContent.querySelector('i');
      const span = btnContent.querySelector('span:last-child');
      if (mode === 'rent') {
        if (span) span.textContent = 'Rent Now';
        if (icon) icon.className = 'fas fa-key';
      } else {
        if (span) span.textContent = 'Add to Cart';
        if (icon) icon.className = 'fas fa-shopping-bag';
      }
    }
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'cardFadeIn 0.5s ease';
  });
}

function initCountdown() {
  const saleEndDate = new Date();
  saleEndDate.setDate(saleEndDate.getDate() + 7);

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = saleEndDate.getTime() - now;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val.toString().padStart(2, '0');
    };
    set('days', days);
    set('hours', hours);
    set('minutes', minutes);
    set('seconds', seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function initProgressIndicator() {
  const bar = document.getElementById('progressIndicator');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = pct + '%';
  });
}

function initModal() {
  const overlay = document.getElementById('productModal');
  const close = document.getElementById('modalClose');
  if (!overlay || !close) return;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-view-btn');
    if (!btn) return;
    const card = btn.closest('.product-card');
    if (!card) return;
    const img = card.querySelector('.product-image img');
    const name = card.querySelector('.product-name');
    const price = card.querySelector('.price-current');
    if (img) document.getElementById('modalImage').src = img.src;
    if (name) document.getElementById('modalTitle').textContent = name.textContent;
    if (price) document.getElementById('modalPrice').textContent = price.textContent;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  const closeModal = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  close.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

function initFaqAccordion() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

function initFormValidation() {
  document.querySelectorAll('.contact-form input, .contact-form textarea').forEach(input => {
    const group = input.closest('.form-group');
    if (!group) return;

    input.addEventListener('blur', () => {
      if (input.hasAttribute('required') && !input.value.trim()) {
        group.classList.add('error');
        group.classList.remove('success');
      } else if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        group.classList.add('error');
        group.classList.remove('success');
      } else if (input.value.trim()) {
        group.classList.remove('error');
        group.classList.add('success');
      } else {
        group.classList.remove('error', 'success');
      }
    });

    input.addEventListener('focus', () => {
      group.classList.remove('error');
    });
  });
}

function initParticleTrail() {
  let timeout;
  const container = document.createElement('div');
  container.className = 'particle-trail';
  document.body.appendChild(container);

  document.addEventListener('mousemove', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const dot = document.createElement('div');
      dot.className = 'particle-dot';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      container.appendChild(dot);
      setTimeout(() => dot.remove(), 1000);
    }, 30);
  });
}

function initSkillBars() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target.querySelector('.skill-bar-fill');
        const pct = entry.target.dataset.percent;
        if (fill && pct) fill.style.width = pct + '%';
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.skill-bar').forEach(bar => observer.observe(bar));
}

function initNotificationToast() {
  const existing = document.querySelector('.notification-toast');
  if (existing) return;
  const toast = document.createElement('div');
  toast.className = 'notification-toast';
  document.body.appendChild(toast);

  window.showToast = (msg, type) => {
    toast.textContent = msg;
    toast.className = 'notification-toast' + (type === 'error' ? ' error' : '');
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
  };
}

function initHackerEffects() {
  const firstLine = document.querySelector('.hero-title .title-line:first-child');
  if (firstLine) {
    firstLine.style.setProperty('--char-count', firstLine.textContent.length);
  }

  const cmd = document.querySelector('.hacker-command');
  if (cmd) {
    const texts = [
      '> initializing_cooling_protocol.exe',
      '> loading_premium_services.dll',
      '> connecting_to_customers.db',
      '> system_ready.ac'
    ];
    let idx = 0;
    const span = cmd.querySelector('span:nth-child(2)');
    if (span) {
      setInterval(() => {
        idx = (idx + 1) % texts.length;
        span.textContent = texts[idx];
      }, 4000);
    }
  }
}

function toggleServices() {
  const hidden = document.getElementById('hiddenServices');
  const btn = document.getElementById('showMoreBtn');
  if (!hidden || !btn) return;
  hidden.classList.toggle('show');
  const text = btn.querySelector('.btn-text');
  if (text) text.textContent = hidden.classList.contains('show') ? 'Show Less' : 'Show More Services';
  btn.classList.toggle('active');
}

function initMobileBottomBar() {
  const bar = document.getElementById('mobileBottomBar');
  if (!bar) return;
  const links = bar.querySelectorAll('a');
  const sections = {};
  links.forEach(link => {
    const section = link.dataset.section;
    const el = document.getElementById(section);
    if (el) sections[section] = el;
  });
  function updateActive() {
    let current = 'home';
    const scrollPos = window.scrollY + 120;
    Object.entries(sections).forEach(([key, el]) => {
      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) current = key;
    });
    links.forEach(link => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }
  updateActive();
  window.addEventListener('scroll', updateActive, { passive: true });
}

function initRippleEffect() {
  document.querySelectorAll('.btn, .service-card, .product-card, .feature-card, .faq-question').forEach(el => {
    el.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

function initServiceBookings() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.service-cta-btn');
    if (!btn) return;
    const id = btn.getAttribute('data-service-id');
    const title = btn.getAttribute('data-service-title') || 'Service';
    const orders = JSON.parse(localStorage.getItem('transparentdb_orders') || '[]');
    orders.unshift({id: Date.now(), type: 'service', item: title, serviceId: id, date: new Date().toISOString(), status: 'pending'});
    localStorage.setItem('transparentdb_orders', JSON.stringify(orders));
    const span = btn.querySelector('span');
    if (span) { const t = span.textContent; span.textContent = 'Booked!'; setTimeout(() => span.textContent = t, 2000); }
    window.location.href = '#contact';
  });
}

function renderGallery(items) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  if (!items || items.length === 0) {
    const section = document.querySelector('.gallery');
    if (section) section.style.display = 'none';
    return;
  }
  const section = document.querySelector('.gallery');
  if (section) section.style.display = '';
  const showAll = window.location.pathname.includes('gallery.html');
  const visible = showAll ? items : items.slice(0, 3);
  grid.innerHTML = visible.map(item => `
    <div class="gallery-item" onclick="openGalleryLightbox('${item.image}','${item.caption.replace(/'/g, "\\'")}')">
      <img src="${item.image}" alt="${item.caption}" loading="lazy">
      <div class="gallery-caption">${item.caption}</div>
    </div>
  `).join('');
  const viewAll = document.getElementById('galleryViewAll');
  if (viewAll) {
    viewAll.style.display = (!showAll && items.length > 3) ? 'block' : 'none';
  }
}

window.openGalleryLightbox = function(src, caption) {
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;
  document.getElementById('lightboxImage').src = src;
  document.getElementById('lightboxCaption').textContent = caption || '';
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}

window.closeGalleryLightbox = function() {
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;
  lb.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
  if (e.target.closest('.gallery-lightbox') && !e.target.closest('.lightbox-close') && !e.target.closest('#lightboxImage')) {
    closeGalleryLightbox();
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGalleryLightbox(); });

const style = document.createElement('style');
style.textContent = `
  @keyframes cardFadeIn {
    0% { opacity: 0; transform: scale(0.95) translateY(10px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
`;
document.head.appendChild(style);
