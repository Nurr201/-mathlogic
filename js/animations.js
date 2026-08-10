/* ========================================
   ANIMATIONS ENGINE — math·logic
   Vanilla JS: IntersectionObserver, ripple,
   counters, skeleton, page transitions
   ======================================== */

const ANIME = (function() {

  /* ======================
     INTERSECTION OBSERVER
     ====================== */
  function initReveal() {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (!els.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => obs.observe(el));
  }

  /* ======================
     RIPPLE EFFECT
     ====================== */
  function initRipple() {
    document.querySelectorAll('.ripple').forEach(el => {
      el.addEventListener('mousedown', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          border-radius: 50%;
          background: rgba(255,255,255,0.35);
          transform: scale(0);
          animation: ripple-effect 0.6s ease-out forwards;
          pointer-events: none;
        `;
        this.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  }

  /* ======================
     ANIMATED COUNTERS
     ====================== */
  function initCounters() {
    document.querySelectorAll('.count-up').forEach(el => {
      const target = parseInt(el.dataset.target) || parseInt(el.textContent.replace(/[^0-9]/g, '')) || 0;
      const suffix = el.dataset.suffix || '';
      const duration = parseInt(el.dataset.duration) || 1000;
      const start = 0;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);
        el.textContent = current + suffix;
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target + suffix;
        }
      }

      const checkVisible = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            requestAnimationFrame(update);
            checkVisible.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      checkVisible.observe(el);
    });
  }

  /* ======================
     SKELETON LOADER
     ====================== */
  function showSkeleton(container, items, type) {
    if (!container) return;
    type = type || 'card';
    let html = '';
    for (let i = 0; i < items; i++) {
      if (type === 'card') {
        html += `<div class="skeleton skeleton-card"></div>`;
      } else if (type === 'list') {
        html += `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <div class="skeleton skeleton-avatar"></div>
            <div style="flex:1;">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-text" style="width:80%;"></div>
            </div>
          </div>`;
      } else if (type === 'text') {
        html += `<div class="skeleton skeleton-text"></div>`;
      } else if (type === 'stat') {
        html += `
          <div class="skeleton" style="height:100px;border-radius:20px;padding:1.25rem;">
            <div class="skeleton skeleton-avatar" style="width:32px;height:32px;margin-bottom:12px;"></div>
            <div class="skeleton skeleton-title" style="width:50%;height:1.8rem;"></div>
            <div class="skeleton skeleton-text" style="width:70%;"></div>
          </div>`;
      }
    }
    container.innerHTML = html;
  }

  function hideSkeleton(container) {
    if (!container) return;
    container.querySelectorAll('.skeleton').forEach(el => el.remove());
  }

  /* ======================
     SCROLL PROGRESS BAR
     ====================== */
  let scrollBar = null;

  function initScrollProgress() {
    scrollBar = document.createElement('div');
    scrollBar.className = 'scroll-progress';
    document.body.prepend(scrollBar);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          scrollBar.style.width = progress + '%';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ======================
     PAGE TRANSITIONS
     ====================== */
  function initPageTransitions() {
    if (document.body.dataset.mlPageTransitions) return;
    document.body.dataset.mlPageTransitions = '1';
    document.body.classList.add('page-enter');

    window.addEventListener('pageshow', () => {
      document.body.classList.remove('page-leave');
      document.body.classList.add('page-enter');
    });
  }

  /* ======================
     STAGGER ANIMATION
     ====================== */
  function initStagger(containerSelector, itemSelector, delay = 50) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const items = container.querySelectorAll(itemSelector);
    items.forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(16px)';
      item.style.transition = `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * delay}ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * delay}ms`;
      requestAnimationFrame(() => {
        item.style.opacity = '1';
        item.style.transform = 'none';
      });
    });
  }

  /* ======================
     ANIMATE PROGRESS BARS
     ====================== */
  function animateBars(container) {
    container = container || document;
    container.querySelectorAll('[data-progress]').forEach(el => {
      const target = parseInt(el.dataset.progress);
      if (isNaN(target)) return;
      el.style.width = '0%';
      requestAnimationFrame(() => {
        el.style.width = target + '%';
      });
    });
  }

  /* ======================
     TABS ANIMATION
     ====================== */
  function switchTabAnimated(container, activeTab, callback) {
    const content = container.querySelector('.tab-content');
    if (!content) { if (callback) callback(); return; }
    content.classList.add('tab-content-leave');
    setTimeout(() => {
      content.classList.remove('tab-content-leave');
      if (callback) callback();
      content.classList.add('tab-content-enter');
      setTimeout(() => content.classList.remove('tab-content-enter'), 350);
    }, 200);
  }

  /* ======================
     MODAL OPEN/CLOSE
     ====================== */
  function openModal(overlay, card) {
    if (!overlay) return;
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('modal-overlay-enter');
    if (card) {
      card.classList.remove('scale-95');
      card.classList.add('modal-card-enter');
    }
  }

  function closeModal(overlay, card) {
    if (!overlay) return;
    if (card) {
      card.classList.remove('modal-card-enter', 'scale-100');
      card.classList.add('scale-95');
    }
    overlay.classList.remove('modal-overlay-enter');
    overlay.classList.add('opacity-0', 'pointer-events-none');
  }

  /* ======================
     SMOOTH SCROLL TO
     ====================== */
  function scrollTo(el, offset = 0) {
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /* ======================
     INIT ALL
     ====================== */
  function init() {
    initReveal();
    initRipple();
    initCounters();
    initScrollProgress();

    if (!document.querySelector('script[src*="animations.js"]')) return;

    const style = document.createElement('style');
    style.textContent = `
      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.35);
        transform: scale(0);
        animation: ripple-effect 0.6s ease-out forwards;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  return {
    init,
    initReveal,
    initRipple,
    initCounters,
    showSkeleton,
    hideSkeleton,
    initScrollProgress,
    initPageTransitions,
    initStagger,
    animateBars,
    switchTabAnimated,
    openModal,
    closeModal,
    scrollTo,
  };
})();

document.addEventListener('DOMContentLoaded', ANIME.init);
