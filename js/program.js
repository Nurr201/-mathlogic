(function() {
  'use strict';

  var params = new URLSearchParams(location.search);
  var presentation = window.MATHLOGIC_PROGRAM_PRESENTATION || { subjects: [] };
  var subjectIds = presentation.subjects.map(function(subject) { return subject.id; });
  var requestedSubject = params.get('subject');
  var activeSubject = subjectIds.indexOf(requestedSubject) > -1 ? requestedSubject : 'algebra';

  function lang() { return ML.getLang(); }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }
  function local(record, key) { return I18N.localize(record, key, lang()); }
  function esc(value) { return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function subjectName(key) { var subject = Learning.getSubject(key); return I18N.t('subjects.' + key, lang()) || (subject ? local(subject,'name') : key); }
  function presentationSubject(id) { return presentation.subjects.find(function(subject) { return subject.id === id; }) || null; }
  function curriculumTopic(id) { return MATHLOGIC_CURRICULUM.getTopic(id); }
  function lessonsForTopic(topic) {
    return Learning.getLessons(activeSubject).filter(function(lesson) { return lesson.topicId === topic.id; })
      .sort(function(a, b) { return Number(a.order || 0) - Number(b.order || 0); });
  }
  function status(lesson) {
    if (lesson.status === 'completed') return [copy('Завершён','Аяқталды'), 'done'];
    if (lesson.status === 'current') return [copy('Продолжить','Жалғастыру'), 'current'];
    if (lesson.status === 'available') return [copy('Доступен','Қолжетімді'), 'available'];
    if (!lesson.hasContent) return [copy('Готовится','Дайындалуда'), 'planned'];
    if (lesson.status === 'locked') return [copy('Сначала нужна предыдущая тема','Алдымен алдыңғы тақырып қажет'), 'locked'];
    return [copy('Готовится','Дайындалуда'), 'planned'];
  }
  function actionLabel(lesson) {
    if (lesson.status === 'current') return copy('Продолжить','Жалғастыру');
    if (lesson.status === 'completed') return copy('Повторить','Қайталау');
    return copy('Открыть','Ашу');
  }
  function prerequisite(lesson) {
    if (lesson.status !== 'locked' || !lesson.prerequisites || !lesson.prerequisites.length) return '';
    var previous = Learning.getLesson(lesson.prerequisites[0]);
    if (!previous) return '';
    var label = copy('Сначала: ','Алдымен: ') + local(previous, 'title');
    return previous.hasContent && previous.route
      ? '<a class="v7-program-prerequisite" href="' + esc(previous.route) + '">' + esc(label) + '</a>'
      : '<span class="v7-program-prerequisite">' + esc(label) + '</span>';
  }
  function lessonRow(lesson) {
    var state = status(lesson);
    var hasRoute = lesson.hasContent && lesson.route;
    var canContinue = ['available','current','completed'].indexOf(lesson.status) > -1 && hasRoute;
    var duration = lesson.duration && hasRoute ? ' · ' + lesson.duration + ' ' + copy('мин','мин') : '';
    var action = canContinue ? '<a class="v7-program-lesson-action" href="' + esc(lesson.route) + '">' + esc(actionLabel(lesson)) + '</a>' : '';
    var title = hasRoute
      ? '<a class="v7-program-lesson-title" href="' + esc(lesson.route) + '">' + esc(local(lesson, 'title')) + '</a>'
      : '<span class="v7-program-lesson-title">' + esc(local(lesson, 'title')) + '</span>';
    return '<article class="v7-program-lesson is-' + state[1] + '" data-lesson-id="' + esc(lesson.id) + '"><div class="v7-program-lesson-copy"><div class="v7-program-lesson-top"><strong>' + title + '</strong><span>' + esc(state[0]) + esc(duration) + '</span></div>' + prerequisite(lesson) + '</div>' + action + '</article>';
  }
  function topicCount(count) {
    var ruWord = count % 10 === 1 && count % 100 !== 11 ? 'урок' : (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'урока' : 'уроков');
    return copy(count + ' ' + ruWord, count + ' сабақ');
  }
  function topicProgress(lessons) {
    var published = lessons.filter(function(lesson) { return lesson.hasContent; });
    var completed = published.filter(function(lesson) { return lesson.status === 'completed'; }).length;
    if (!published.length) return topicCount(lessons.length);
    return completed + ' / ' + published.length + ' ' + copy('пройдено', 'аяқталды');
  }
  function topicLabel(index) {
    return copy('ТЕМА ', 'ТАҚЫРЫП ') + String(index + 1).padStart(2, '0');
  }
  function topicView(topic, index) {
    var lessons = lessonsForTopic(topic);
    var rows = lessons.map(lessonRow).join('');
    return '<section class="v7-program-topic" data-topic-id="' + esc(topic.id) + '"><header><div><span class="v7-program-topic-eyebrow">' + esc(topicLabel(index)) + '</span><h3>' + esc(local(topic, 'title')) + '</h3><p>' + esc(local(topic, 'description')) + '</p></div><small>' + esc(topicProgress(lessons)) + '</small></header><div class="v7-program-lesson-list">' + rows + '</div></section>';
  }
  function topicsFor(module) {
    return module.topicIds.map(curriculumTopic).filter(Boolean);
  }
  function moduleProgress(topics) {
    var lessons = topics.reduce(function(result, topic) { return result.concat(lessonsForTopic(topic)); }, []);
    var published = lessons.filter(function(lesson) { return lesson.hasContent; });
    var completed = published.filter(function(lesson) { return lesson.status === 'completed'; }).length;
    if (!published.length) return copy('Уроки готовятся','Сабақтар дайындалуда');
    return completed ? completed + ' / ' + published.length + ' ' + copy('пройдено','аяқталды') : published.length + ' ' + copy('доступно сейчас','қазір қолжетімді');
  }
  function moduleView(module) {
    var topics = topicsFor(module);
    return '<section class="v7-program-large-module"><header><div><h2>' + esc(local(module, 'title')) + '</h2><p>' + esc(local(module, 'description')) + '</p></div><small>' + esc(moduleProgress(topics)) + '</small></header><div class="v7-program-topics">' + topics.map(topicView).join('') + '</div></section>';
  }
  function currentLesson() {
    var lessons = Learning.getLessons(activeSubject);
    var current = lessons.find(function(lesson) { return lesson.status === 'current'; });
    if (current) return current;
    var recommended = Learning.getNextLesson();
    if (recommended && recommended.subjectKey === activeSubject) return recommended;
    return lessons.find(function(lesson) { return lesson.status === 'available'; }) || null;
  }
  function renderNow() {
    var root = document.getElementById('program-now');
    var lesson = currentLesson();
    if (!lesson) { root.hidden = true; root.innerHTML = ''; return; }
    var continuing = lesson.status === 'current';
    root.hidden = false;
    root.innerHTML = '<span class="v7-eyebrow">' + esc(continuing ? copy('Продолжить','Жалғастыру') : copy('Следующий урок','Келесі сабақ')) + '</span><div><div><strong><a class="v7-program-lesson-title" href="' + esc(lesson.route) + '">' + esc(local(lesson, 'title')) + '</a></strong><p>' + esc(local(lesson, 'description')) + '</p></div><a class="v7-button primary" href="' + esc(lesson.route) + '">' + esc(continuing ? copy('Продолжить','Жалғастыру') : copy('Открыть урок','Сабақты ашу')) + '</a></div>';
  }
  function renderTabs() {
    document.getElementById('program-subjects').innerHTML = subjectIds.map(function(id) {
      return '<button type="button" role="tab" aria-selected="' + (id === activeSubject) + '" class="' + (id === activeSubject ? 'is-active' : '') + '" data-subject="' + esc(id) + '">' + esc(subjectName(id)) + '</button>';
    }).join('');
    document.querySelectorAll('[data-subject]').forEach(function(button) {
      button.addEventListener('click', function() { selectSubject(button.dataset.subject); });
    });
  }
  function renderContent() {
    var subject = presentationSubject(activeSubject);
    document.getElementById('program-content').innerHTML = subject
      ? subject.largeModules.map(moduleView).join('')
      : '<div class="v7-empty">' + esc(copy('Материалы этого направления пока не добавлены.','Бұл бағыттың материалдары әлі қосылмаған.')) + '</div>';
  }
  function selectSubject(id) {
    if (subjectIds.indexOf(id) < 0) return;
    activeSubject = id;
    history.replaceState(null, '', 'program.html?subject=' + encodeURIComponent(activeSubject));
    renderTabs(); renderNow(); renderContent();
  }
  function init() {
    ML.applySettings(); MathLogicSite.applyCopy();
    document.documentElement.lang = lang();
    document.querySelector('[data-language-toggle]').textContent = lang() === 'kk' ? 'ҚАЗ' : 'RU';
    document.querySelector('[data-language-toggle]').onclick = function() { ML.setLang(lang() === 'kk' ? 'ru' : 'kk'); location.reload(); };
    document.querySelector('[data-theme-toggle]').onclick = function() { ML.setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); ML.applySettings(); };
    var user = ML.getUser() || {}; document.getElementById('program-avatar').textContent = (user.name || user.username || 'М').charAt(0).toUpperCase();
    renderTabs(); renderNow(); renderContent();
  }

  window.MathLogicProgram = { selectSubject: selectSubject, getState: function() { return { subject: activeSubject }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
