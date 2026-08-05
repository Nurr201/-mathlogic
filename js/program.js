(function() {
  'use strict';
  var activeSubject = 'algebra';
  function lang() { return ML.getLang(); }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }
  function local(record, key) { return I18N.localize(record, key, lang()); }
  function registryLessons(subject) { return Object.keys(Learning.getRegistry()).map(function(id) { return Learning.getLesson(id); }).filter(function(item) { return item && item.subjectKey === subject; }).sort(function(a, b) { return Learning.getRegistryEntry(a.id).order - Learning.getRegistryEntry(b.id).order; }); }
  function subjectName(subject) { var names = { algebra: ['Алгебра', 'Алгебра'], geometry: ['Геометрия', 'Геометрия'], logic: ['Логика', 'Логика'], numbers: ['Числа', 'Сандар'] }; return copy.apply(null, names[subject] || [subject, subject]); }
  function groupName(id) {
    if (id.indexOf('.expressions.') > -1) return copy('Алгебраические выражения', 'Алгебралық өрнектер');
    if (id.indexOf('.exponents.') > -1) return copy('Степени', 'Дәрежелер');
    if (id.indexOf('.linear-equations.') > -1) return copy('Линейные уравнения', 'Сызықтық теңдеулер');
    if (id.indexOf('.vieta.') > -1) return copy('Квадратные уравнения', 'Квадрат теңдеулер');
    return subjectName(activeSubject);
  }
  function status(item) { if (item.status === 'completed') return [copy('Завершён', 'Аяқталды'), 'is-completed']; if (item.status === 'current') return [copy('В процессе', 'Орындалуда'), 'is-current']; return [copy('Не начат', 'Басталмаған'), '']; }
  function renderTabs() {
    var subjects = ['algebra', 'geometry', 'logic', 'numbers'];
    document.getElementById('program-subjects').innerHTML = subjects.map(function(key) { return '<button class="ml-subject-tab ' + (key === activeSubject ? 'is-active' : '') + '" data-subject="' + key + '">' + subjectName(key) + '</button>'; }).join('');
    document.querySelectorAll('[data-subject]').forEach(function(button) { button.addEventListener('click', function() { activeSubject = button.dataset.subject; renderTabs(); renderContent(); }); });
  }
  function renderContent() {
    var lessons = registryLessons(activeSubject);
    var root = document.getElementById('program-content');
    if (!lessons.length) {
      root.innerHTML = '<section class="ml-section"><div class="ml-section-heading"><h2>' + subjectName(activeSubject) + '</h2><p>' + copy('Материалы этого предмета ещё не опубликованы. Мы не показываем пустые уроки как доступные.', 'Бұл пәннің материалдары әлі жарияланбаған. Бос сабақтар қолжетімді ретінде көрсетілмейді.') + '</p></div><span class="ml-status is-planned">' + copy('Запланировано', 'Жоспарланған') + '</span></section>';
      return;
    }
    var groups = [];
    lessons.forEach(function(item) { var name = groupName(item.id); var group = groups.find(function(entry) { return entry.name === name; }); if (!group) { group = { name: name, lessons: [] }; groups.push(group); } group.lessons.push(item); });
    root.innerHTML = groups.map(function(group, groupIndex) {
      return '<section class="ml-section"><div class="ml-section-heading"><div><p class="ml-kicker">' + copy('Раздел ', 'Бөлім ') + '0' + (groupIndex + 1) + '</p><h2>' + group.name + '</h2></div><p>' + copy('Уроки идут от основной идеи к самостоятельному применению.', 'Сабақтар негізгі идеядан өздігінен қолдануға қарай жүреді.') + '</p></div><div class="ml-list">' + group.lessons.map(function(item) {
        var state = status(item); return '<article class="ml-row"><div><h3>' + local(item, 'title') + '</h3><p>' + local(item, 'description') + '</p><div class="ml-row-meta"><span>' + item.duration + ' ' + copy('мин', 'мин') + '</span><span class="ml-status ' + state[1] + '">' + state[0] + '</span></div></div><div class="ml-actions"><a class="ml-button-secondary" href="' + item.route + '">' + (item.status === 'current' ? copy('Продолжить', 'Жалғастыру') : item.status === 'completed' ? copy('Открыть снова', 'Қайта ашу') : copy('Открыть урок', 'Сабақты ашу')) + '</a></div></article>';
      }).join('') + '</div></section>';
    }).join('');
  }
  function init() { ML.applySettings(); MathLogicSite.applyCopy(); MathLogicSite.markNavigation(); document.querySelector('[data-language-toggle]').textContent = lang() === 'kk' ? 'ҚАЗ' : 'RU'; document.querySelector('[data-language-toggle]').onclick = function() { ML.setLang(lang() === 'kk' ? 'ru' : 'kk'); location.reload(); }; document.querySelector('[data-theme-toggle]').onclick = function() { ML.setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); ML.applySettings(); }; renderTabs(); renderContent(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
