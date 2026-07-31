/* ========================================
   UI — math·logic
   Уведомления, модальные окна, анимации
   ======================================== */

const UI = (function() {

  // --- Toast ---
  function showToast(message, type) {
    type = type || 'info';
    if (document.body && document.body.classList.contains('axis-app')) {
      var axisToast = document.querySelector('.axis-toast');
      if (axisToast) {
        axisToast.textContent = String(message);
        axisToast.classList.add('is-visible');
        clearTimeout(axisToast._timer);
        axisToast._timer = setTimeout(function() { axisToast.classList.remove('is-visible'); }, 3000);
        return;
      }
    }
    const colors = {
      info: 'bg-blue-600',
      success: 'bg-emerald-600',
      error: 'bg-red-600',
      warning: 'bg-amber-600'
    };
    const bg = colors[type] || colors.info;

    const existing = document.querySelector('.ml-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ml-toast fixed top-5 left-1/2 -translate-x-1/2 z-[100] ' + bg +
      ' text-white px-6 py-3.5 rounded-2xl shadow-2xl font-head font-bold text-sm animate-scale-in flex items-center gap-3';
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- Confirm dialog ---
  function showConfirm(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade';

    const box = document.createElement('div');
    box.className = 'bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 animate-scale-in';

    box.innerHTML =
      '<div class="text-center">' +
      '<div class="text-3xl mb-3">⚠️</div>' +
      '<div class="font-head font-bold text-lg text-slate-900 mb-6">' + message + '</div>' +
      '<div class="flex gap-3">' +
      '<button id="ml-confirm-cancel" class="flex-1 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-head font-bold text-sm transition-all">Отмена</button>' +
      '<button id="ml-confirm-ok" class="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-head font-bold text-sm transition-all shadow-md shadow-red-600/20">Да</button>' +
      '</div>' +
      '</div>';

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('ml-confirm-cancel').onclick = function() {
      overlay.remove();
      if (onCancel) onCancel();
    };
    document.getElementById('ml-confirm-ok').onclick = function() {
      overlay.remove();
      if (onConfirm) onConfirm();
    };
    overlay.onclick = function(e) {
      if (e.target === overlay) {
        overlay.remove();
        if (onCancel) onCancel();
      }
    };
  }

  // --- Animate progress elements ---
  function animateProgress(containerSelector) {
    const targets = document.querySelectorAll(containerSelector + ' .animated');
    targets.forEach(el => {
      const w = el.dataset.targetWidth || el.style.getPropertyValue('--target-width');
      if (w) {
        requestAnimationFrame(() => {
          el.style.setProperty('--target-width', w);
        });
      }
    });
  }

  function initAnimations() {
    setTimeout(function() {
      // Animate all progress fills by resetting width briefly
      document.querySelectorAll('.xp-bar-fill, .main-progress-fill, .subj-progress-fill, .achv-progress-fill, .level-progress-fill').forEach(function(el) {
        var w = el.style.width;
        if (w && w !== '0%' && w !== '') {
          el.style.transition = 'none';
          el.style.width = '0%';
          el.offsetHeight; // force reflow
          el.style.transition = '';
          el.style.width = w;
        }
      });

      // Animate circular progress
      document.querySelectorAll('.progress-circle, .glow-circle').forEach(function(el) {
        var offset = el.style.getPropertyValue('--offset') || el.getAttribute('data-offset');
        if (offset) {
          el.classList.add('animated');
        }
      });
    }, 200);
  }

  return {
    showToast,
    showConfirm,
    animateProgress,
    initAnimations
  };
})();
