function showToast(msg, type) {
  UI.showToast(msg, type || 'success');
}

const overlay = document.getElementById('modal-overlay');
const modalBox = document.getElementById('modal-box');
const modalContent = document.getElementById('modal-content');

function openModal(action) {
  var titles = {
    'clear-data': { icon: '⚠️', title: 'Очистить данные?', desc: 'Все настройки будут удалены. Прогресс обучения останется.', confirm: 'Очистить', danger: true },
    'reset-progress': { icon: '🔄', title: 'Сбросить прогресс?', desc: 'Весь прогресс обучения будет удалён. Настройки останутся.', confirm: 'Сбросить', danger: true },
    'logout': { icon: '🚪', title: 'Выйти из аккаунта?', desc: 'Вы будете перенаправлены на страницу входа.', confirm: 'Выйти', danger: true },
    'delete-account': { icon: '🗑️', title: 'Удалить аккаунт?', desc: 'Это действие необратимо. Все данные будут потеряны.', confirm: 'Удалить навсегда', danger: true }
  };
  var data = titles[action] || { icon: '⚠️', title: 'Вы уверены?', desc: '', confirm: 'Да', danger: false };
  modalContent.innerHTML =
    '<div class="text-4xl mb-4">' + data.icon + '</div>' +
    '<h3 class="font-head font-extrabold text-xl text-slate-900 mb-2">' + data.title + '</h3>' +
    '<p class="text-sm font-medium text-slate-500 mb-6">' + data.desc + '</p>' +
    '<div class="flex gap-3">' +
    '<button onclick="closeModal()" class="flex-1 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-head font-bold text-sm transition-all">Отмена</button>' +
    '<button id="modal-confirm-btn" class="flex-1 px-5 py-3 rounded-xl font-head font-bold text-sm transition-all shadow-md">' + data.confirm + '</button>' +
    '</div>';
  var confirmBtn = document.getElementById('modal-confirm-btn');
  if (data.danger) {
    confirmBtn.className = 'flex-1 px-5 py-3 rounded-xl font-head font-bold text-sm transition-all shadow-md bg-red-600 hover:bg-red-700 text-white shadow-red-600/20';
  } else {
    confirmBtn.className = 'flex-1 px-5 py-3 rounded-xl font-head font-bold text-sm transition-all shadow-md bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20';
  }
  confirmBtn.onclick = function() { handleModalAction(action); };
  overlay.classList.add('open');
}

function closeModal() {
  overlay.classList.remove('open');
}

overlay.addEventListener('click', function(e) {
  if (e.target === overlay) closeModal();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

function handleModalAction(action) {
  var d;
  if (action === 'clear-data') {
    d = ML.getData();
    d.settings = { theme: 'light', accent: '#4F46E5', font_size: 'medium', lang: 'kz', daily_goal: 3, reminders: true, autosave: true, solutions: 'after_answer', push: false, email_notif: true, sound: true, animations: true };
    ML.saveData(d);
    showToast('Данные очищены', 'success');
    loadAllSettings();
  } else if (action === 'reset-progress') {
    ML.resetLearning();
    showToast('Прогресс сброшен', 'success');
  } else if (action === 'logout') {
    ML.clearUser();
    window.location.href = 'login.html';
  } else if (action === 'delete-account') {
    ML.resetAll();
    showToast('Аккаунт удалён', 'info');
    setTimeout(function() { window.location.href = 'index.html'; }, 800);
  }
  closeModal();
}

const navItems = document.querySelectorAll('.settings-nav-item');
const sections = document.querySelectorAll('.settings-section');

function updateActiveNav() {
  var scrollY = window.scrollY + 120;
  var activeId = 'account';
  sections.forEach(function(sec) {
    var top = sec.offsetTop;
    var bottom = top + sec.offsetHeight;
    if (scrollY >= top && scrollY < bottom) {
      activeId = sec.id.replace('section-', '');
    }
  });
  navItems.forEach(function(item) {
    item.classList.toggle('active', item.dataset.section === activeId);
  });
}

let ticking = false;
window.addEventListener('scroll', function() {
  if (!ticking) {
    requestAnimationFrame(function() { updateActiveNav(); ticking = false; });
    ticking = true;
  }
}, { passive: true });

navItems.forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    var target = document.getElementById('section-' + this.dataset.section);
    if (target) {
      var top = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  });
});

function saveAccount() {
  var name = document.getElementById('settings-name').value.trim();
  var username = document.getElementById('settings-username').value.trim();
  var email = document.getElementById('settings-email').value.trim();
  if (!name) return showToast('Имя не может быть пустым', 'error');
  ML.setUser({ name: name, email: email, username: username });
  showToast('Профиль обновлён', 'success');
}

function setTheme(theme) {
  ML.setSetting('theme', theme);
  document.querySelectorAll('#theme-options .option-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#theme-options .option-btn[data-theme="' + theme + '"]').classList.add('active');
  applyTheme(theme);
  showToast('Тема изменена: ' + theme, 'success');
}

function applyTheme(theme) {
  var body = document.getElementById('app-body');
  if (theme === 'dark') {
    body.classList.add('dark');
  } else if (theme === 'light') {
    body.classList.remove('dark');
  } else if (theme === 'system') {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    body.classList.toggle('dark', prefersDark);
  }
}

function setAccent(color) {
  ML.setSetting('accent', color);
  document.querySelectorAll('#accent-options .color-swatch').forEach(function(s) { s.classList.remove('active'); });
  document.querySelector('#accent-options .color-swatch[data-color="' + color + '"]').classList.add('active');
  document.documentElement.style.setProperty('--primary', color);
  showToast('Акцентный цвет изменён', 'success');
}

function setFontSize(size) {
  ML.setSetting('font_size', size);
  document.querySelectorAll('#fontsize-options .option-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#fontsize-options .option-btn[data-size="' + size + '"]').classList.add('active');
  var sizes = { small: '14px', medium: '16px', large: '18px' };
  document.documentElement.style.fontSize = sizes[size] || '16px';
  showToast('Размер шрифта изменён', 'success');
}

function setLang(lang) {
  ML.setSetting('lang', lang);
  ML.setLang(lang === 'kz' ? 'kz' : 'ru');
  document.querySelectorAll('#lang-options .option-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#lang-options .option-btn[data-lang="' + lang + '"]').classList.add('active');
  showToast('Язык изменён на ' + lang, 'success');
}

function adjustGoal(delta) {
  var val = parseInt(ML.getSetting('daily_goal', 3));
  val = Math.max(1, Math.min(10, val + delta));
  ML.setSetting('daily_goal', val);
  document.getElementById('daily-goal-value').textContent = val;
  showToast('Ежедневная цель: ' + val + ' урок(а)', 'success');
}

function setSolutionsMode(mode) {
  ML.setSetting('solutions', mode);
  document.querySelectorAll('#solutions-options .option-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#solutions-options .option-btn[data-mode="' + mode + '"]').classList.add('active');
  showToast('Режим решений изменён', 'success');
}

function initToggle(id, key, defaultValue) {
  var el = document.getElementById(id);
  if (!el) return;
  var val = ML.getSetting(key, defaultValue);
  el.classList.toggle('active', val === true || val === 'true');
  el.setAttribute('aria-checked', el.classList.contains('active'));
  el.addEventListener('click', function() {
    this.classList.toggle('active');
    var isActive = this.classList.contains('active');
    this.setAttribute('aria-checked', isActive);
    ML.setSetting(key, isActive);
    var labels = {
      'toggle-reminders': 'Напоминания',
      'toggle-autosave': 'Автосохранение',
      'toggle-push': 'Push-уведомления',
      'toggle-email': 'Email-уведомления',
      'toggle-sound': 'Звуковые эффекты',
      'toggle-animations': 'Анимации'
    };
    var label = labels[id] || 'Настройка';
    showToast(label + ': ' + (isActive ? 'включено' : 'выключено'), 'info');
  });
  el.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.click();
    }
  });
}

function renderAboutStats() {
  var container = document.getElementById('about-stats');
  if (!container) return;
  var totalModules = 0, totalTopics = 0;
  try {
    if (typeof DATA !== 'undefined') {
      Object.keys(DATA).forEach(function(sk) {
        (DATA[sk] || []).forEach(function(sec) {
          (sec.modules || []).forEach(function(mod) {
            totalModules++;
            (mod.subtopics || []).forEach(function() { totalTopics++; });
          });
        });
      });
    }
  } catch(e) {}
  var versionEl = document.querySelector('meta[name="version"]');
  var version = versionEl ? versionEl.getAttribute('content') : '2.4';
  var stats = [
    { value: totalModules.toString(), label: 'Модулей', color: 'bg-blue-50', textColor: 'text-blue-700' },
    { value: Object.keys(typeof DATA !== 'undefined' ? DATA : {}).length.toString(), label: 'Раздела', color: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { value: totalTopics > 0 ? totalTopics + '+' : '60+', label: 'Тем', color: 'bg-purple-50', textColor: 'text-purple-700' },
    { value: version, label: 'Версия', color: 'bg-amber-50', textColor: 'text-amber-700' },
  ];
  container.innerHTML = stats.map(function(s) {
    return '<div class="' + s.color + ' rounded-2xl p-4 text-center border border-slate-200/40">' +
      '<div class="font-head font-extrabold text-2xl ' + s.textColor + '">' + s.value + '</div>' +
      '<div class="text-xs font-bold text-slate-400 mt-0.5">' + s.label + '</div></div>';
  }).join('');
}

function exportData() {
  var data = ML.exportAll();
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'mathlogic-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Данные экспортированы', 'success');
}

function loadAllSettings() {
  var u = ML.getUser() || {};
  document.getElementById('settings-name').value = u.name || '';
  document.getElementById('avatar-preview').textContent = (u.name || '?').charAt(0);

  document.getElementById('settings-username').value = u.username || '';

  document.getElementById('settings-email').value = u.email || '';

  var theme = ML.getSetting('theme', 'light');
  document.querySelectorAll('#theme-options .option-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.theme === theme);
  });
  applyTheme(theme);

  var accent = ML.getSetting('accent', '#4F46E5');
  document.querySelectorAll('#accent-options .color-swatch').forEach(function(s) {
    s.classList.toggle('active', s.dataset.color === accent);
  });

  document.documentElement.style.setProperty('--primary', accent);

  var fontSize = ML.getSetting('font_size', 'medium');
  document.querySelectorAll('#fontsize-options .option-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.size === fontSize);
  });
  var sizes = { small: '14px', medium: '16px', large: '18px' };
  document.documentElement.style.fontSize = sizes[fontSize] || '16px';

  var lang = ML.getSetting('lang', 'ru');
  document.querySelectorAll('#lang-options .option-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  var goal = ML.getSetting('daily_goal', 3);
  document.getElementById('daily-goal-value').textContent = goal;

  var solutionsMode = ML.getSetting('solutions', 'after_answer');
  document.querySelectorAll('#solutions-options .option-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.mode === solutionsMode);
  });

  initToggle('toggle-reminders', 'reminders', true);
  initToggle('toggle-autosave', 'autosave', true);
  initToggle('toggle-push', 'push', false);
  initToggle('toggle-email', 'email_notif', true);
  initToggle('toggle-sound', 'sound', true);
  initToggle('toggle-animations', 'animations', true);
}

document.addEventListener('DOMContentLoaded', function() {
  renderAboutStats();
  loadAllSettings();
  ANIME.initPageTransitions();
  updateActiveNav();
});
