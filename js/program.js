(function() {
  'use strict';
  var requested = new URLSearchParams(location.search).get('subject');
  var activeSubject = ['algebra','geometry','logic','numbers'].indexOf(requested) > -1 ? requested : 'algebra';
  function lang() { return ML.getLang(); }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }
  function local(record, key) { return I18N.localize(record, key, lang()); }
  function esc(value) { return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function subjectName(key) { var subject = Learning.getSubject(key); return I18N.t('subjects.' + key, lang()) || (subject ? local(subject,'name') : key); }
  function status(lesson) {
    if (lesson.status === 'completed') return [copy('завершено','аяқталды'),'done'];
    if (lesson.status === 'current') return [copy('в процессе','жалғасуда'),'current'];
    if (lesson.status === 'available') return [copy('доступно сейчас','қазір қолжетімді'),'available'];
    if (lesson.status === 'locked') return [copy('требуются предыдущие темы','алдыңғы тақырыптар қажет'),'planned'];
    return [copy('планируется','жоспарланған'),'planned'];
  }
  function renderTabs() {
    var subjects = ['algebra','geometry','logic','numbers'];
    document.getElementById('program-subjects').innerHTML = subjects.map(function(key) { return '<button type="button" role="tab" aria-selected="' + (key === activeSubject) + '" class="' + (key === activeSubject ? 'is-active' : '') + '" data-subject="' + key + '">' + esc(subjectName(key)) + '</button>'; }).join('');
    document.querySelectorAll('[data-subject]').forEach(function(button) { button.addEventListener('click', function() { activeSubject = button.dataset.subject; history.replaceState(null,'','program.html?subject=' + activeSubject); renderTabs(); renderContent(); }); });
  }
  function lessonCard(lesson) {
    var state = status(lesson);
    var canOpen = ['available','current','completed'].indexOf(lesson.status) > -1 && lesson.route;
    var tag = canOpen ? 'a href="' + esc(lesson.route) + '"' : 'div';
    var close = canOpen ? 'a' : 'div';
    return '<' + tag + ' class="v7-topic ' + state[1] + '"><strong>' + esc(local(lesson,'title')) + '</strong><span>' + esc(state[0]) + (lesson.duration && canOpen ? ' · ' + lesson.duration + ' ' + copy('мин','мин') : '') + '</span></' + close + '>';
  }
  function renderContent() {
    var topics = Learning.getTopics(activeSubject);
    var root = document.getElementById('program-content');
    if (!topics.length) { root.innerHTML = '<div class="v7-empty">' + esc(copy('Материалы этого направления пока не добавлены.','Бұл бағыттың материалдары әлі қосылмаған.')) + '</div>'; return; }
    root.innerHTML = topics.map(function(topic) {
      var lessons = topic.lessons || [];
      var cards = lessons.length ? lessons.map(lessonCard).join('') : '<div class="v7-topic planned"><strong>' + esc(copy('Материалы готовятся','Материалдар дайындалуда')) + '</strong><span>' + esc(copy('планируется','жоспарланған')) + '</span></div>';
      return '<section class="v7-cluster"><small>' + esc(subjectName(activeSubject)) + '</small><h2>' + esc(local(topic,'title')) + '</h2>' + cards + '</section>';
    }).join('');
  }
  function init() {
    ML.applySettings(); MathLogicSite.applyCopy();
    document.documentElement.lang = lang();
    document.querySelector('[data-language-toggle]').textContent = lang() === 'kk' ? 'ҚАЗ' : 'RU';
    document.querySelector('[data-language-toggle]').onclick = function() { ML.setLang(lang() === 'kk' ? 'ru' : 'kk'); location.reload(); };
    document.querySelector('[data-theme-toggle]').onclick = function() { ML.setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); ML.applySettings(); };
    var user = ML.getUser() || {}; document.getElementById('program-avatar').textContent = (user.name || user.username || 'М').charAt(0).toUpperCase();
    renderTabs(); renderContent();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
