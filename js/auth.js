(function() {
  'use strict';
  function lang() { return ML.getLang(); }
  function init() {
    ML.applySettings(); MathLogicSite.applyCopy();
    document.querySelector('[data-language-toggle]').textContent = lang() === 'kk' ? 'ҚАЗ' : 'RU';
    document.querySelector('[data-language-toggle]').onclick = function() { ML.setLang(lang() === 'kk' ? 'ru' : 'kk'); location.reload(); };
    document.querySelector('[data-theme-toggle]').onclick = function() { ML.setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); ML.applySettings(); };
    if (document.body.dataset.authPage === 'login') {
      document.getElementById('auth-continue').onclick = function() { var user = ML.getUser(); ML.setUser({ loggedIn: true, name: user.name || '' }); location.href = user.name ? 'dashboard.html' : 'register.html'; };
      return;
    }
    document.getElementById('auth-form').onsubmit = function(event) { event.preventDefault(); var name = document.getElementById('auth-name').value.trim(); if (!name) return; ML.setUser({ name: name, email: document.getElementById('auth-email').value.trim(), loggedIn: true }); location.href = 'dashboard.html'; };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
