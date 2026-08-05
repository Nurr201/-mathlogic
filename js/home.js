(function() {
  'use strict';
  function lang() { return ML.getLang(); }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }
  function init() {
    ML.applySettings(); MathLogicSite.applyCopy();
    document.querySelector('[data-language-toggle]').textContent = lang() === 'kk' ? 'ҚАЗ' : 'RU';
    document.querySelector('[data-language-toggle]').onclick = function() { ML.setLang(lang() === 'kk' ? 'ru' : 'kk'); location.reload(); };
    document.querySelector('[data-theme-toggle]').onclick = function() { ML.setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); ML.applySettings(); };
    if (ML.isLoggedIn()) { var primary = document.getElementById('home-primary'); primary.href = 'dashboard.html'; primary.textContent = copy('Продолжить обучение', 'Оқуды жалғастыру'); }
    document.querySelectorAll('#home-demo button').forEach(function(button) { button.onclick = function() { document.querySelectorAll('#home-demo button').forEach(function(item) { item.classList.remove('is-active'); }); button.classList.add('is-active'); var feedback = document.getElementById('home-demo-feedback'); feedback.hidden = false; feedback.textContent = button.dataset.correct ? copy('Верно. Из обеих частей вычли 3, поэтому равенство сохранилось.', 'Дұрыс. Екі жағынан да 3-ті азайттық, сондықтан теңдік сақталды.') : copy('Пока нет. Проверьте, какое действие выполнено с обеими частями.', 'Әзірге дұрыс емес. Екі жаққа қандай әрекет жасалғанын тексеріңіз.'); }; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
