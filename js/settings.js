(function() {
  'use strict';

  var toastTimer = null;
  function lang() { return ML.getLang(); }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }

  function showToast(message) {
    var toast = document.getElementById('settings-toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { toast.classList.remove('is-visible'); }, 2400);
  }

  function applyTheme() {
    ML.applySettings();
    var selected = ML.getSetting('theme', 'light');
    document.querySelectorAll('#theme-options [data-theme]').forEach(function(button) {
      var active = button.dataset.theme === selected;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(function(button) {
      button.textContent = document.documentElement.dataset.theme === 'dark' ? '◑' : '◐';
    });
  }

  function renderLanguage() {
    document.querySelectorAll('[data-language-choice]').forEach(function(button) {
      button.setAttribute('aria-pressed', String(button.dataset.languageChoice === lang()));
    });
    document.querySelectorAll('#language-options [data-language]').forEach(function(button) {
      var active = button.dataset.language === lang();
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function renderProfile() {
    var user = ML.getUser() || {};
    var name = user.name || copy('Пользователь', 'Пайдаланушы');
    document.getElementById('settings-name').value = user.name || '';
    document.getElementById('settings-username').value = user.username || '';
    document.getElementById('settings-avatar').textContent = name.charAt(0).toUpperCase();
    var navAvatar = document.getElementById('settings-avatar-nav');
    if (navAvatar) navAvatar.textContent = name.charAt(0).toUpperCase();
  }

  function renderProgressSummary() {
    var total = Object.keys(Learning.getRegistry()).length;
    var completed = Object.keys(ML.getCompletedLessons()).length;
    var sessions = ML.get('lesson.sessions', {}) || {};
    var active = Object.keys(sessions).filter(function(id) {
      var session = sessions[id];
      return session && Array.isArray(session.completedBlocks) && session.completedBlocks.length > 0;
    }).length;
    document.getElementById('progress-summary').textContent = completed + ' / ' + total + ' ' + copy('уроков завершено', 'сабақ аяқталды') + ' · ' + active + ' ' + copy('в процессе', 'жалғасуда');
  }

  function render() {
    MathLogicSite.applyCopy();
    applyTheme();
    renderLanguage();
    renderProfile();
    renderProgressSummary();
  }

  function setLanguage(nextLang) {
    ML.setLang(nextLang);
    render();
    showToast(copy('Язык изменён', 'Тіл өзгертілді'));
  }

  function saveProfile(event) {
    event.preventDefault();
    var name = document.getElementById('settings-name').value.trim();
    var username = document.getElementById('settings-username').value.trim();
    if (!name) {
      document.getElementById('settings-name').focus();
      showToast(copy('Введите имя', 'Атыңызды енгізіңіз'));
      return;
    }
    ML.setUser({ name:name, username:username });
    renderProfile();
    showToast(copy('Профиль сохранён', 'Профиль сақталды'));
  }

  function exportData() {
    var blob = new Blob([JSON.stringify(ML.exportAll(), null, 2)], { type:'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'mathlogic-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 0);
    showToast(copy('Данные экспортированы', 'Деректер экспортталды'));
  }

  function openResetModal() {
    var modal = document.getElementById('reset-modal');
    modal.hidden = false;
    document.getElementById('cancel-reset').focus();
  }

  function closeResetModal() { document.getElementById('reset-modal').hidden = true; }

  function resetProgress() {
    ML.resetLearning();
    closeResetModal();
    renderProgressSummary();
    showToast(copy('Учебный прогресс сброшен', 'Оқу барысы өшірілді'));
  }

  function initNavigation() {
    document.querySelectorAll('[data-settings-link]').forEach(function(link) {
      link.addEventListener('click', function() {
        document.querySelectorAll('[data-settings-link]').forEach(function(item) { item.classList.remove('active'); });
        link.classList.add('active');
      });
    });
  }

  function init() {
    document.querySelectorAll('[data-language-choice]').forEach(function(button) {
      button.addEventListener('click', function() { setLanguage(button.dataset.languageChoice); });
    });
    document.querySelectorAll('#language-options [data-language]').forEach(function(button) {
      button.addEventListener('click', function() { setLanguage(button.dataset.language); });
    });
    document.querySelectorAll('#theme-options [data-theme]').forEach(function(button) {
      button.addEventListener('click', function() {
        ML.setSetting('theme', button.dataset.theme);
        applyTheme();
        showToast(copy('Тема изменена', 'Тақырып өзгертілді'));
      });
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(function(button) {
      button.addEventListener('click', function() {
        ML.setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
        applyTheme();
      });
    });
    document.getElementById('profile-form').addEventListener('submit', saveProfile);
    document.getElementById('export-data').addEventListener('click', exportData);
    document.getElementById('reset-progress').addEventListener('click', openResetModal);
    document.getElementById('cancel-reset').addEventListener('click', closeResetModal);
    document.getElementById('confirm-reset').addEventListener('click', resetProgress);
    document.getElementById('reset-modal').addEventListener('click', function(event) { if (event.target === this) closeResetModal(); });
    document.addEventListener('keydown', function(event) { if (event.key === 'Escape') closeResetModal(); });
    document.getElementById('settings-name').addEventListener('input', function() {
      var value = this.value.trim();
      document.getElementById('settings-avatar').textContent = (value || copy('П', 'П')).charAt(0).toUpperCase();
      var navAvatar = document.getElementById('settings-avatar-nav');
      if (navAvatar) navAvatar.textContent = (value || copy('П', 'П')).charAt(0).toUpperCase();
    });
    initNavigation();
    render();
    if (typeof ANIME !== 'undefined' && ANIME.initPageTransitions) ANIME.initPageTransitions();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
