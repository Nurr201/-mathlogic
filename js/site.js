/* Shared GEOMAT shell: protected navigation, language, theme and profile menu. */
(function() {
  'use strict';

  function lang() { return typeof ML !== 'undefined' && ML.getLang ? ML.getLang() : 'ru'; }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }
  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function applyCopy(root) {
    root = root || document;
    var currentLang = lang();
    document.documentElement.lang = currentLang;
    root.querySelectorAll('[data-copy-ru]').forEach(function(element) {
      element.textContent = currentLang === 'kk' ? (element.dataset.copyKk || element.dataset.copyRu) : element.dataset.copyRu;
    });
  }

  function pageKey(header) {
    if (header && header.dataset.activePage) return header.dataset.activePage;
    var page = window.location.pathname.split('/').pop() || 'index.html';
    if (page === 'dashboard.html') return 'dashboard';
    if (page === 'program.html') return 'program';
    if (page === 'profile.html') return 'profile';
    if (page === 'settings.html') return 'settings';
    return '';
  }

  function navLink(href, key, current, ru, kk) {
    return '<a href="' + href + '"' + (key === current ? ' aria-current="page"' : '') + '>' + escapeHtml(copy(ru, kk)) + '</a>';
  }

  function closeMenus(except) {
    document.querySelectorAll('[data-shell-menu]').forEach(function(menu) {
      if (menu === except) return;
      menu.hidden = true;
      var trigger = document.querySelector('[aria-controls="' + menu.id + '"]');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function focusMenuItem(menu, edge) {
    var items = Array.prototype.slice.call(menu.querySelectorAll('a,button')).filter(function(item) { return !item.disabled; });
    if (!items.length) return;
    items[edge === 'last' ? items.length - 1 : 0].focus();
  }

  function bindPopover(trigger, menu) {
    function setOpen(open, focusFirst) {
      closeMenus(open ? menu : null);
      menu.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (open && focusFirst) focusMenuItem(menu, 'first');
    }
    trigger.addEventListener('click', function(event) {
      event.stopPropagation();
      setOpen(menu.hidden, false);
    });
    trigger.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setOpen(true, true);
      }
    });
    menu.addEventListener('keydown', function(event) {
      var items = Array.prototype.slice.call(menu.querySelectorAll('a,button')).filter(function(item) { return !item.disabled; });
      var index = items.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false, false);
        trigger.focus();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        var direction = event.key === 'ArrowDown' ? 1 : -1;
        items[(index + direction + items.length) % items.length].focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        focusMenuItem(menu, event.key === 'End' ? 'last' : 'first');
      }
    });
  }

  function setLanguage(next) {
    if (typeof ML === 'undefined' || !ML.setLang) return;
    ML.setLang(next);
    window.location.reload();
  }

  function toggleTheme() {
    if (typeof ML === 'undefined' || !ML.setSetting) return;
    var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    ML.setSetting('theme', next);
    ML.applySettings();
    updateThemeButtons();
  }

  function updateThemeButtons() {
    var dark = document.documentElement.dataset.theme === 'dark';
    document.querySelectorAll('[data-shell-theme]').forEach(function(button) {
      button.textContent = dark ? '◑' : '◐';
      button.setAttribute('aria-label', dark ? copy('Включить светлую тему', 'Ашық тақырыпты қосу') : copy('Включить тёмную тему', 'Қараңғы тақырыпты қосу'));
    });
  }

  function renderMobileNavigation(current) {
    var old = document.querySelector('.v7-mobile-nav');
    if (old) old.remove();
    var nav = document.createElement('nav');
    nav.className = 'v7-mobile-nav';
    nav.setAttribute('aria-label', copy('Мобильная навигация', 'Мобильді навигация'));
    nav.innerHTML = navLink('dashboard.html', 'dashboard', current, 'Сегодня', 'Бүгін') +
      navLink('program.html', 'program', current, 'Программа', 'Бағдарлама') +
      navLink('profile.html', 'profile', current, 'Журнал', 'Журнал');
    document.body.appendChild(nav);
  }

  function renderAppShell() {
    var header = document.querySelector('[data-app-shell]');
    if (!header || typeof ML === 'undefined') return;
    var current = pageKey(header);
    var user = ML.getUser ? (ML.getUser() || {}) : {};
    var name = String(user.name || copy('Пользователь', 'Пайдаланушы'));
    var shortName = name.trim().split(/\s+/)[0] || copy('Профиль', 'Профиль');
    var username = String(user.username || '');
    var initial = (name || username || 'G').charAt(0).toUpperCase();
    var languageCode = lang() === 'kk' ? 'ҚАЗ' : 'RU';

    header.classList.add('v7-shell');
    header.innerHTML = '<div class="v7-nav-inner">' +
      '<a class="v7-brand" href="dashboard.html" aria-label="GEOMAT"><span class="v7-mark" aria-hidden="true"></span><span>GEOMAT</span></a>' +
      '<nav class="v7-links ml-nav" aria-label="' + escapeHtml(copy('Основная навигация', 'Негізгі навигация')) + '">' +
        navLink('dashboard.html', 'dashboard', current, 'Сегодня', 'Бүгін') +
        navLink('program.html', 'program', current, 'Программа', 'Бағдарлама') +
        navLink('profile.html', 'profile', current, 'Журнал', 'Журнал') +
      '</nav>' +
      '<div class="v7-nav-actions">' +
        '<div class="v7-shell-control v7-shell-language">' +
          '<button class="v7-shell-icon v7-shell-language-trigger" type="button" aria-expanded="false" aria-controls="shell-language-menu">' + escapeHtml(languageCode) + '</button>' +
          '<div class="v7-shell-popover v7-shell-language-menu" id="shell-language-menu" data-shell-menu role="menu" hidden>' +
            '<button type="button" role="menuitemradio" aria-checked="' + (lang() === 'ru') + '" data-shell-set-lang="ru">Русский</button>' +
            '<button type="button" role="menuitemradio" aria-checked="' + (lang() === 'kk') + '" data-shell-set-lang="kk">Қазақша</button>' +
          '</div>' +
        '</div>' +
        '<button class="v7-shell-icon" type="button" data-shell-theme></button>' +
        '<div class="v7-shell-control v7-shell-profile">' +
          '<button class="v7-profile-trigger" type="button" aria-expanded="false" aria-controls="shell-profile-menu">' +
            '<span class="v7-shell-avatar" aria-hidden="true">' + escapeHtml(initial) + '</span><span class="v7-profile-name">' + escapeHtml(shortName) + '</span><span class="v7-profile-caret" aria-hidden="true">⌄</span>' +
          '</button>' +
          '<div class="v7-shell-popover v7-shell-profile-menu" id="shell-profile-menu" data-shell-menu role="menu" hidden>' +
            '<div class="v7-profile-summary"><strong>' + escapeHtml(name) + '</strong>' + (username ? '<span>' + escapeHtml(username) + '</span>' : '') + '</div>' +
            '<div class="v7-shell-menu-group"><a href="profile.html" role="menuitem">' + escapeHtml(copy('Профиль / Журнал', 'Профиль / Журнал')) + '</a><a href="settings.html" role="menuitem">' + escapeHtml(copy('Настройки', 'Баптаулар')) + '</a></div>' +
            '<div class="v7-shell-mobile-tools">' +
              '<div><span>' + escapeHtml(copy('Язык', 'Тіл')) + '</span><div><button type="button" data-shell-set-lang="ru" aria-pressed="' + (lang() === 'ru') + '">RU</button><button type="button" data-shell-set-lang="kk" aria-pressed="' + (lang() === 'kk') + '">ҚАЗ</button></div></div>' +
              '<div><span>' + escapeHtml(copy('Тема', 'Тақырып')) + '</span><button type="button" data-shell-theme></button></div>' +
            '</div>' +
            '<div class="v7-shell-menu-group"><button class="v7-shell-logout" type="button" data-shell-logout role="menuitem">' + escapeHtml(copy('Выйти', 'Шығу')) + '</button></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    renderMobileNavigation(current);
    updateThemeButtons();
    bindPopover(header.querySelector('.v7-shell-language-trigger'), header.querySelector('.v7-shell-language-menu'));
    bindPopover(header.querySelector('.v7-profile-trigger'), header.querySelector('.v7-shell-profile-menu'));
    header.querySelectorAll('[data-shell-set-lang]').forEach(function(button) {
      button.addEventListener('click', function() { setLanguage(button.dataset.shellSetLang); });
    });
    header.querySelectorAll('[data-shell-theme]').forEach(function(button) { button.addEventListener('click', toggleTheme); });
    header.querySelector('[data-shell-logout]').addEventListener('click', function() {
      ML.clearUser();
      window.location.href = 'login.html';
    });
  }

  function markNavigation() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.ml-nav a').forEach(function(link) {
      var href = (link.getAttribute('href') || '').split('?')[0];
      if (href === page) link.setAttribute('aria-current', 'page');
    });
  }

  function protectAppRoute() {
    if (typeof ML === 'undefined' || !ML.isLoggedIn || ML.isLoggedIn()) return true;
    var protectedPage = protectedClasses.some(function(name) { return document.body.classList.contains(name); });
    if (!protectedPage) return true;
    window.location.href = 'login.html';
    return false;
  }

  function init() {
    if (!protectAppRoute()) return;
    if (typeof ML !== 'undefined' && ML.applySettings) ML.applySettings();
    applyCopy();
    renderAppShell();
    markNavigation();
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.v7-shell-control')) closeMenus();
    });
    document.addEventListener('keydown', function(event) {
      if (event.key !== 'Escape') return;
      var openTrigger = document.querySelector('[aria-expanded="true"]');
      closeMenus();
      if (openTrigger) openTrigger.focus();
    });
  }

  window.MathLogicSite = { applyCopy: applyCopy, markNavigation: markNavigation, protectAppRoute: protectAppRoute, renderAppShell: renderAppShell };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
