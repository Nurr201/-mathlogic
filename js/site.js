/* Shared editorial shell: language copy and active navigation only. */
(function() {
  'use strict';
  function lang() { return typeof ML !== 'undefined' && ML.getLang ? ML.getLang() : 'ru'; }
  function applyCopy(root) {
    root = root || document;
    var currentLang = lang();
    document.documentElement.lang = currentLang;
    root.querySelectorAll('[data-copy-ru]').forEach(function(element) {
      element.textContent = currentLang === 'kk' ? (element.dataset.copyKk || element.dataset.copyRu) : element.dataset.copyRu;
    });
  }
  function markNavigation() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.ml-nav a').forEach(function(link) {
      var href = (link.getAttribute('href') || '').split('?')[0];
      if (href === page) link.setAttribute('aria-current', 'page');
    });
  }
  window.MathLogicSite = { applyCopy: applyCopy, markNavigation: markNavigation };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { applyCopy(); markNavigation(); });
  else { applyCopy(); markNavigation(); }
})();
