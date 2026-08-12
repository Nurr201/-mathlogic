(function() {
  'use strict';
  function copy(ru, kk) { return ML.getLang() === 'kk' ? kk : ru; }
  function init() {
    ML.applySettings();
    MathLogicSite.applyCopy();
    var account = document.getElementById('home-account');
    var primary = document.getElementById('home-primary');
    if (ML.isLoggedIn()) {
      account.href = 'profile.html';
      account.textContent = copy('Журнал', 'Журнал');
      primary.href = 'dashboard.html';
      primary.textContent = copy('Продолжить обучение', 'Оқуды жалғастыру');
    }
    if (typeof ANIME !== 'undefined' && ANIME.initPageTransitions) ANIME.initPageTransitions();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
