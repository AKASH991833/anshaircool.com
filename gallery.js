function safeImagePath(value) { return typeof value === 'string' && /^images\/[a-z0-9-]+\.(?:webp|png|jpe?g)$/.test(value) ? value : ''; }
        document.addEventListener('DOMContentLoaded', async () => {
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
            }, 500);
            const galleryData = await TransparentDB.gallery();
            const grid = document.getElementById('galleryGridFull');
            if (!galleryData || !galleryData.some(item => !item.category || item.category === 'work')) {
                grid.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>No photos in gallery yet.</p></div>';
                return;
            }
            grid.replaceChildren(); galleryData.filter(item => !item.category || item.category === 'work').forEach(item => { const tile=document.createElement('div'); tile.className='gallery-item'; const image=document.createElement('img'); image.src=safeImagePath(item.image); image.alt=item.caption; image.loading='lazy'; const caption=document.createElement('div'); caption.className='gallery-caption'; caption.textContent=item.caption; tile.append(image,caption); tile.addEventListener('click',()=>openLightbox(safeImagePath(item.image),item.caption)); grid.append(tile); });
        });

        function openLightbox(src, caption) {
            document.getElementById('lightboxImage').src = safeImagePath(src);
            document.getElementById('lightboxCaption').textContent = caption || '';
            document.getElementById('galleryLightbox').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            document.getElementById('galleryLightbox').classList.remove('active');
            document.body.style.overflow = '';
        }

        document.addEventListener('click', (e) => {
            if (e.target.closest('.gallery-lightbox') && !e.target.closest('.lightbox-close') && !e.target.closest('#lightboxImage')) closeLightbox();
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

        // Progress indicator
        window.addEventListener('scroll', () => {
            const winScroll = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            document.getElementById('progressFill').style.width = (winScroll / height) * 100 + '%';
        });

        // WhatsApp button visibility
        const whatsappBtn = document.getElementById('whatsappChat');
        if (whatsappBtn) {
            window.addEventListener('scroll', () => {
                whatsappBtn.classList.toggle('visible', window.pageYOffset > 500);
            });
        }

        // Back to top
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            window.addEventListener('scroll', () => {
                backToTop.classList.toggle('visible', window.pageYOffset > 500);
            });
            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Load settings for WhatsApp number
        (async function loadGallerySettings() {
            try {
                const data = await TransparentDB.settings();
                if (data && data.whatsappNumber) {
                    const msg = data.whatsappMessage || "Hi, I'm interested in your AC products";
                    const wa = document.getElementById('whatsappChat');
                    if (wa) wa.href = 'https://wa.me/' + data.whatsappNumber.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(msg);
                }
            } catch(e) {}
        })();

document.querySelector('#galleryLightbox .lightbox-close')?.addEventListener('click', closeLightbox);
