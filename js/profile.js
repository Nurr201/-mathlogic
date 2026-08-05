/* Учебный журнал: только фактические данные ML и Learning. */
'use strict';

var activeTopicFilter = 'all';
var activePeriod = 30;
var chartInstances = {};

function profileLang() { return ML.getLang && ML.getLang() === 'kk' ? 'kk' : 'ru'; }
function profileCopy(ru, kk) { return profileLang() === 'kk' ? kk : ru; }
function localize(record, key) { return I18N.localize(record, key, profileLang()); }
function escapeHtml(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function clamp(value) { return Math.max(0, Math.min(100, Number(value) || 0)); }

function allLessons() {
  return Object.keys(Learning.getRegistry()).map(function(id) { return Learning.getLesson(id); }).filter(Boolean);
}

function allTopics() {
  var result = [];
  Learning.getSubjects().forEach(function(subject) {
    Learning.getTopics(subject.key).forEach(function(topic) {
      var hasCurrent = topic.lessons.some(function(lesson) { return lesson.status === 'current'; });
      var completed = topic.totalLessons > 0 && topic.completedLessons === topic.totalLessons;
      result.push({
        id: topic.id,
        title: localize(topic, 'title'),
        subject: localize(subject, 'name') || subject.name,
        status: completed ? 'completed' : hasCurrent ? 'current' : 'planned',
        completedLessons: topic.completedLessons,
        totalLessons: topic.totalLessons,
        progress: topic.progress,
        color: subject.mainColor,
      });
    });
  });
  return result;
}

function activityDates() {
  var activity = ML.get('activity', { dates: [] }) || {};
  return Array.isArray(activity.dates) ? activity.dates.slice().sort() : [];
}

function completedRecords() {
  var records = ML.getCompletedLessons();
  return Object.keys(records).map(function(id) {
    return { id: id, record: records[id], lesson: Learning.getLesson(id) };
  }).filter(function(item) { return item.lesson && item.record; }).sort(function(a, b) {
    return (Number(b.record.completedAt) || 0) - (Number(a.record.completedAt) || 0);
  });
}

function formatDate(value, short) {
  if (!value) return '—';
  var date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + 'T12:00:00') : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(profileLang() === 'kk' ? 'kk-KZ' : 'ru-RU', short
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function timeAgo(timestamp) {
  var diff = Math.max(0, Date.now() - Number(timestamp || 0));
  var minutes = Math.floor(diff / 60000);
  if (minutes < 60) return profileCopy(minutes + ' мин назад', minutes + ' мин бұрын');
  var hours = Math.floor(minutes / 60);
  if (hours < 24) return profileCopy(hours + ' ч назад', hours + ' сағ бұрын');
  var days = Math.floor(hours / 24);
  return profileCopy(days === 1 ? 'Вчера' : days + ' дн. назад', days === 1 ? 'Кеше' : days + ' күн бұрын');
}

function studySummary() {
  var lessons = allLessons();
  var topics = allTopics();
  var dates = activityDates();
  var completed = lessons.filter(function(lesson) { return lesson.status === 'completed'; }).length;
  var active = lessons.filter(function(lesson) { return lesson.status === 'current'; }).length;
  var available = lessons.filter(function(lesson) { return lesson.status === 'available' || lesson.status === 'current'; }).length;
  return {
    lessons: lessons,
    topics: topics,
    completed: completed,
    active: active,
    available: available,
    total: lessons.length,
    completedTopics: topics.filter(function(topic) { return topic.status === 'completed'; }).length,
    dates: dates,
    overall: Learning.getOverallProgress(),
  };
}

function renderHeaderAndProgress() {
  var user = ML.getUser() || {};
  var summary = studySummary();
  var next = Learning.getNextLesson();
  var last = completedRecords()[0];
  var name = user.name || profileCopy('Пользователь', 'Пайдаланушы');
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-username').textContent = user.username || '@user';
  document.getElementById('profile-journal').textContent = profileCopy('Учебный журнал', 'Оқу журналы');
  document.getElementById('profile-completed').textContent = summary.completed + ' ' + profileCopy('уроков пройдено', 'сабақ аяқталды');
  document.getElementById('profile-active').textContent = summary.active + ' ' + profileCopy('в процессе', 'жалғасуда');
  document.getElementById('profile-last-active').textContent = last ? formatDate(last.record.completedAt, true) : '—';
  document.getElementById('profile-course-bar-text').textContent = summary.completed + ' / ' + summary.total + ' ' + profileCopy('уроков', 'сабақ');
  document.getElementById('profile-course-next').textContent = next ? profileCopy('Следующий урок', 'Келесі сабақ') : profileCopy('Курс завершён', 'Курс аяқталды');
  document.getElementById('profile-course-bar-fill').style.width = clamp(summary.overall) + '%';

  ['progress-pct-display', 'overall-progress-pct-val', 'main-bar-label'].forEach(function(id) {
    var element = document.getElementById(id);
    if (!element) return;
    element.textContent = summary.overall + '%';
    element.dataset.target = summary.overall;
  });
  var mainFill = document.getElementById('main-progress-fill');
  mainFill.style.width = summary.overall + '%';
  mainFill.dataset.progress = summary.overall;
  var remaining = Math.max(0, summary.total - summary.completed);
  document.getElementById('remaining-lessons-val').textContent = remaining;
  document.getElementById('remaining-lessons-val').dataset.target = remaining;
  document.getElementById('available-lessons-val').textContent = summary.available;
  document.getElementById('available-lessons-val').dataset.target = summary.available;
  document.getElementById('next-goal').textContent = next ? localize(next, 'title') : profileCopy('Доступные уроки завершены', 'Қолжетімді сабақтар аяқталды');
  var comparison = document.getElementById('comparison-pct');
  if (comparison) comparison.textContent = '—';
}

function renderStats() {
  var summary = studySummary();
  var stats = ML.get('stats', {}) || {};
  var cards = [
    { icon: '▣', label: profileCopy('Завершено уроков', 'Аяқталған сабақ'), value: summary.completed, color: 'bg-blue-50', iconBg: 'bg-blue-100', valueColor: 'text-blue-700', border: 'border-blue-200/60' },
    { icon: '◇', label: profileCopy('Уроков в процессе', 'Жалғасып жатқан сабақ'), value: summary.active, color: 'bg-emerald-50', iconBg: 'bg-emerald-100', valueColor: 'text-emerald-700', border: 'border-emerald-200/60' },
    { icon: '○', label: profileCopy('Доступно уроков', 'Қолжетімді сабақ'), value: summary.available, color: 'bg-amber-50', iconBg: 'bg-amber-100', valueColor: 'text-amber-700', border: 'border-amber-200/60' },
    { icon: '◷', label: profileCopy('Время обучения (мин)', 'Оқу уақыты (мин)'), value: Math.round((Number(stats.study_time) || 0) / 60), color: 'bg-purple-50', iconBg: 'bg-purple-100', valueColor: 'text-purple-700', border: 'border-purple-200/60' },
    { icon: '∑', label: profileCopy('Решено задач', 'Шешілген есеп'), value: Number(stats.problems_solved) || 0, color: 'bg-cyan-50', iconBg: 'bg-cyan-100', valueColor: 'text-cyan-700', border: 'border-cyan-200/60' },
    { icon: '▤', label: profileCopy('Учебных дней', 'Оқу күні'), value: summary.dates.length, color: 'bg-green-50', iconBg: 'bg-green-100', valueColor: 'text-green-700', border: 'border-green-200/60' },
    { icon: '✓', label: profileCopy('Изучено тем', 'Меңгерілген тақырып'), value: summary.completedTopics, color: 'bg-orange-50', iconBg: 'bg-orange-100', valueColor: 'text-orange-700', border: 'border-orange-200/60' },
    { icon: '≡', label: profileCopy('Тем в программе', 'Бағдарламадағы тақырып'), value: summary.topics.length, color: 'bg-rose-50', iconBg: 'bg-rose-100', valueColor: 'text-rose-700', border: 'border-rose-200/60' },
  ];
  document.getElementById('stats-grid').innerHTML = cards.map(function(card, index) {
    return '<div class="stat-card animate-count stagger-' + (index + 1) + ' ' + card.color + ' border ' + card.border + ' shadow-sm hover:shadow-md">' +
      '<div class="stat-card-shine"></div><div class="flex items-start gap-3.5 mb-3"><div class="stat-icon-wrap ' + card.iconBg + ' ' + card.valueColor + '">' + card.icon + '</div></div>' +
      '<div class="' + card.valueColor + ' stat-value">' + card.value + '</div><div class="' + card.valueColor + ' stat-label mt-1">' + card.label + '</div></div>';
  }).join('');
}

function renderSubjectMiniStats() {
  var subjects = Learning.getSubjects();
  document.getElementById('subject-mini-stats').innerHTML = subjects.map(function(subject) {
    var name = localize(subject, 'name') || subject.name;
    return '<div class="bg-white/60 rounded-2xl p-5 border border-slate-200/60 hover:bg-white/80 transition-all">' +
      '<div class="flex items-center justify-between gap-3 mb-3"><span class="font-head font-bold text-sm text-slate-800">' + escapeHtml(name) + '</span><b class="font-mono text-sm" style="color:' + escapeHtml(subject.mainColor) + '">' + subject.progress + '%</b></div>' +
      '<div class="main-progress-track"><div class="main-progress-fill" style="width:' + clamp(subject.progress) + '%;background:' + escapeHtml(subject.mainColor) + '"></div></div>' +
      '<div class="text-[11px] font-bold text-slate-400 mt-2">' + subject.completedLessons + ' / ' + subject.totalLessons + ' ' + profileCopy('уроков', 'сабақ') + '</div></div>';
  }).join('');
}

function renderCalendar() {
  var dates = activityDates();
  var lookup = {};
  dates.forEach(function(date) { lookup[date] = true; });
  document.getElementById('study-days-total').textContent = dates.length;
  document.getElementById('study-days-total').dataset.target = dates.length;
  document.getElementById('study-first-date').textContent = dates.length ? formatDate(dates[0], true) : '—';
  document.getElementById('study-last-date').textContent = dates.length ? formatDate(dates[dates.length - 1], true) : '—';
  document.getElementById('last-study-note').textContent = dates.length
    ? profileCopy('Занятие отмечено ' + formatDate(dates[dates.length - 1]), 'Соңғы сабақ: ' + formatDate(dates[dates.length - 1]))
    : profileCopy('Занятий пока не было', 'Әзірге сабақ болған жоқ');
  var cells = [];
  for (var offset = 29; offset >= 0; offset--) {
    var date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    var key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    cells.push('<div class="cal-day level-' + (lookup[key] ? '2' : '0') + '" title="' + key + '"></div>');
  }
  document.getElementById('cal-grid').innerHTML = cells.join('');
}

function renderTimeline() {
  var container = document.getElementById('timeline-container');
  var items = completedRecords();
  document.getElementById('timeline-count').textContent = items.length + ' ' + profileCopy('записей', 'жазба');
  container.innerHTML = '<div class="timeline-line"></div>';
  if (!items.length) {
    container.innerHTML += '<div class="text-sm font-bold text-slate-400 py-8 text-center">' + profileCopy('Завершённых уроков пока нет', 'Әзірге аяқталған сабақ жоқ') + '</div>';
    return;
  }
  items.slice(0, 7).forEach(function(item, index) {
    var element = document.createElement('div');
    element.className = 'timeline-item animate-slide-up';
    element.style.animationDelay = (index * 0.08) + 's';
    element.innerHTML = '<div class="timeline-dot bg-blue-500 text-white shadow-md">✓</div>' +
      '<div class="bg-white/70 border border-slate-200/60 rounded-2xl p-4 hover:bg-white/90 hover:border-slate-300/80 transition-all shadow-sm">' +
      '<div class="font-head font-bold text-sm text-slate-900">' + escapeHtml(localize(item.lesson, 'title')) + '</div>' +
      '<div class="text-xs font-semibold text-slate-400 mt-1">' + (Number(item.record.correctAnswers) || 0) + ' / ' + (Number(item.record.totalQuestions) || 0) + ' ' + profileCopy('задач', 'тапсырма') + '</div>' +
      '<div class="text-[11px] font-bold text-slate-300 mt-1.5">' + timeAgo(item.record.completedAt) + '</div></div>';
    container.appendChild(element);
  });
}

function filterTopics(filter) {
  activeTopicFilter = filter;
  document.querySelectorAll('#topic-filters .achv-filter-btn').forEach(function(button) {
    button.classList.toggle('active', button.dataset.filter === filter);
  });
  renderTopics();
}

function renderTopics() {
  var topics = allTopics();
  var counts = {
    completed: topics.filter(function(topic) { return topic.status === 'completed'; }).length,
    current: topics.filter(function(topic) { return topic.status === 'current'; }).length,
    planned: topics.filter(function(topic) { return topic.status === 'planned'; }).length,
  };
  document.getElementById('topic-total-label').textContent = topics.length + ' ' + profileCopy('тем', 'тақырып');
  document.getElementById('topic-stats').innerHTML = [
    { label: profileCopy('Всего', 'Барлығы'), value: topics.length, bg: 'bg-slate-100' },
    { label: profileCopy('Изучено', 'Меңгерілді'), value: counts.completed, bg: 'bg-emerald-50' },
    { label: profileCopy('В процессе', 'Жалғасуда'), value: counts.current, bg: 'bg-blue-50' },
    { label: profileCopy('Планируется', 'Жоспарда'), value: counts.planned, bg: 'bg-amber-50' },
  ].map(function(card) {
    return '<div class="' + card.bg + ' rounded-2xl p-4 border border-slate-200/60 text-center"><div class="font-head font-extrabold text-2xl sm:text-3xl text-slate-900">' + card.value + '</div><div class="text-xs font-bold text-slate-400 mt-0.5">' + card.label + '</div></div>';
  }).join('');
  var filtered = activeTopicFilter === 'all' ? topics : topics.filter(function(topic) { return topic.status === activeTopicFilter; });
  var statusLabels = { completed: profileCopy('Изучено', 'Меңгерілді'), current: profileCopy('В процессе', 'Жалғасуда'), planned: profileCopy('Планируется', 'Жоспарда') };
  var statusStyles = { completed: 'bg-emerald-200 text-emerald-700', current: 'bg-blue-200 text-blue-700', planned: 'bg-amber-100 text-amber-700' };
  document.getElementById('topic-history-grid').innerHTML = filtered.map(function(topic, index) {
    return '<div class="achv-card bg-white/70 border border-slate-200 shadow-sm animate-count stagger-' + ((index % 8) + 1) + '">' +
      '<div class="flex items-start gap-3.5 mb-3"><div class="achv-badge-icon bg-slate-100 text-slate-600">' + String(index + 1).padStart(2, '0') + '</div><div class="flex-1 min-w-0">' +
      '<div class="font-head font-bold text-sm text-slate-900 leading-tight">' + escapeHtml(topic.title) + '</div><div class="mt-1"><span class="achv-rarity ' + statusStyles[topic.status] + '">' + statusLabels[topic.status] + '</span></div></div></div>' +
      '<div class="text-xs font-semibold text-slate-500 leading-relaxed">' + escapeHtml(topic.subject) + '</div>' +
      '<div class="mt-3"><div class="flex items-center gap-2.5"><div class="achv-progress-track"><div class="achv-progress-fill bg-blue-500" style="width:' + clamp(topic.progress) + '%"></div></div><span class="text-xs font-bold font-mono text-slate-500">' + topic.progress + '%</span></div>' +
      '<div class="text-[11px] font-bold text-slate-400 mt-1">' + topic.completedLessons + ' / ' + topic.totalLessons + ' ' + profileCopy('уроков', 'сабақ') + '</div></div></div>';
  }).join('') || '<div class="col-span-full text-center py-12 text-slate-400 font-bold">' + profileCopy('В этой категории пока нет тем', 'Бұл санатта әзірге тақырып жоқ') + '</div>';
}

function renderLearningCards() {
  var summary = studySummary();
  var next = Learning.getNextLesson();
  var nextAfter = next ? Learning.getLesson(Learning.getNextLessonId(next.id)) : null;
  var topics = summary.topics;
  var currentTopic = topics.find(function(topic) { return topic.status === 'current'; }) || topics.find(function(topic) { return topic.status !== 'completed'; }) || topics[0];
  var currentIndex = currentTopic ? topics.indexOf(currentTopic) : -1;
  var nextTopic = currentIndex > -1 ? topics[currentIndex + 1] : null;
  document.getElementById('current-topic-mark').textContent = currentIndex > -1 ? String(currentIndex + 1).padStart(2, '0') : '—';
  document.getElementById('current-topic-label').textContent = currentTopic ? currentTopic.title : '—';
  document.getElementById('next-topic-mark').textContent = nextTopic ? String(currentIndex + 2).padStart(2, '0') : '—';
  document.getElementById('next-topic-label').textContent = nextTopic ? nextTopic.title : profileCopy('Нет следующей темы', 'Келесі тақырып жоқ');
  document.getElementById('route-progress-label').textContent = summary.completed + ' / ' + summary.total + ' ' + profileCopy('уроков', 'сабақ');
  document.getElementById('route-progress-pct').textContent = summary.overall + '%';
  document.getElementById('route-progress-bar').style.width = summary.overall + '%';
  document.getElementById('route-remaining-text').textContent = next
    ? profileCopy('Следующий урок: ', 'Келесі сабақ: ') + localize(next, 'title')
    : profileCopy('Доступные уроки завершены', 'Қолжетімді сабақтар аяқталды');

  document.getElementById('goals-container').innerHTML = topics.filter(function(topic) { return topic.status !== 'completed'; }).slice(0, 3).map(function(topic) {
    return '<div class="goal-card bg-white/60 border border-slate-200/60 hover:bg-white/80 hover:border-slate-300/80 shadow-sm"><div class="flex items-start gap-3.5">' +
      '<div class="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-sm shrink-0">' + (topic.status === 'current' ? '◆' : '◇') + '</div><div class="flex-1 min-w-0">' +
      '<div class="font-head font-bold text-sm text-slate-900">' + escapeHtml(topic.title) + '</div><div class="flex items-center gap-2.5 mt-2.5"><div class="achv-progress-track"><div class="achv-progress-fill bg-blue-500" style="width:' + topic.progress + '%"></div></div><span class="text-xs font-bold font-mono text-slate-500 shrink-0">' + topic.progress + '%</span></div>' +
      '<div class="text-[11px] font-bold text-slate-400 mt-1.5">' + topic.completedLessons + ' / ' + topic.totalLessons + ' ' + profileCopy('уроков', 'сабақ') + '</div></div></div></div>';
  }).join('') || '<div class="text-sm font-bold text-slate-400 py-4 text-center">' + profileCopy('Доступные темы завершены', 'Қолжетімді тақырыптар аяқталды') + '</div>';

  var continueButton = document.querySelector('.continue-btn');
  if (next) {
    document.getElementById('continue-lesson-title').textContent = localize(next, 'title');
    document.getElementById('continue-lesson-meta').textContent = localize(next, 'sectionTitle') || next.subjectKey;
    document.getElementById('continue-time').textContent = next.duration || '—';
    var topic = Learning.getTopic(next.subjectKey, next.topicId);
    var topicProgress = topic ? topic.progress : 0;
    document.getElementById('continue-progress-label').textContent = topicProgress + '%';
    document.getElementById('continue-progress-fill').style.width = topicProgress + '%';
    continueButton.disabled = false;
    continueButton.onclick = function() { window.location.href = next.route; };
  } else {
    document.getElementById('continue-lesson-title').textContent = profileCopy('Нет доступного урока', 'Қолжетімді сабақ жоқ');
    document.getElementById('continue-lesson-meta').textContent = '—';
    document.getElementById('continue-time').textContent = '—';
    document.getElementById('continue-progress-label').textContent = '100%';
    document.getElementById('continue-progress-fill').style.width = '100%';
    continueButton.disabled = true;
    continueButton.onclick = null;
  }
  document.getElementById('next-lesson-title').textContent = nextAfter ? localize(nextAfter, 'title') : profileCopy('Планируется', 'Жоспарда');
  document.getElementById('next-lesson-desc').textContent = nextAfter ? localize(nextAfter, 'description') : profileCopy('Следующие материалы появятся позже', 'Келесі материалдар кейінірек шығады');
  document.querySelector('.difficulty-badge').textContent = nextAfter && nextAfter.duration ? nextAfter.duration + ' ' + profileCopy('мин', 'мин') : profileCopy('Планируется', 'Жоспарда');

  document.getElementById('today-progress-label').textContent = currentTopic ? currentTopic.progress + '%' : '0%';
  document.getElementById('today-progress-bar').style.width = currentTopic ? currentTopic.progress + '%' : '0%';
  document.getElementById('today-tasks').innerHTML = next
    ? '<div class="today-task"><div class="today-check"></div><span class="text-sm font-bold text-slate-700 flex-1">' + escapeHtml(localize(next, 'title')) + '</span><span class="text-[11px] font-bold text-slate-400">' + escapeHtml(next.status === 'current' ? profileCopy('Продолжить', 'Жалғастыру') : profileCopy('Начать', 'Бастау')) + '</span></div>'
    : '<div class="text-sm font-bold text-slate-400 py-4 text-center">' + profileCopy('Нет незавершённых уроков', 'Аяқталмаған сабақ жоқ') + '</div>';
  document.getElementById('motivation-text').textContent = next
    ? profileCopy('Откройте текущий урок — сохранённые ответы и шаг будут восстановлены автоматически.', 'Ағымдағы сабақты ашыңыз — сақталған жауаптар мен қадам автоматты түрде қалпына келеді.')
    : profileCopy('Все доступные уроки завершены. Можно повторить любой пройденный материал.', 'Барлық қолжетімді сабақ аяқталды. Өткен материалды қайталауға болады.');
  document.getElementById('available-preview').innerHTML = summary.lessons.filter(function(lesson) {
    return lesson.status === 'available' || lesson.status === 'current';
  }).slice(0, 3).map(function(lesson) {
    return '<a href="' + escapeHtml(lesson.route) + '" class="reward-preview-item"><span class="text-blue-600">◇</span><span class="text-sm font-bold text-slate-700">' + escapeHtml(localize(lesson, 'title')) + '</span></a>';
  }).join('') || '<div class="text-sm font-bold text-slate-400 py-4 text-center">' + profileCopy('Нет новых доступных уроков', 'Жаңа қолжетімді сабақ жоқ') + '</div>';
}

function completionSeries(days) {
  var records = completedRecords();
  var countByDate = {};
  records.forEach(function(item) {
    var date = new Date(Number(item.record.completedAt) || 0);
    if (Number.isNaN(date.getTime())) return;
    var key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    countByDate[key] = (countByDate[key] || 0) + 1;
  });
  var length = Math.max(1, Number(days) || 120);
  var data = [];
  for (var offset = length - 1; offset >= 0; offset--) {
    var date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    var key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    data.push({ date: key, count: countByDate[key] || 0 });
  }
  return data;
}

function filterPeriod(period) {
  activePeriod = period === 'all' ? 120 : Number(period);
  document.querySelectorAll('#period-filters .period-btn').forEach(function(button) {
    button.classList.toggle('active', button.dataset.period === String(period));
  });
  renderAnalytics();
}

function renderAnalytics() {
  if (typeof Chart === 'undefined') return;
  var series = completionSeries(activePeriod);
  var subjects = Learning.getSubjects();
  var completionCanvas = document.getElementById('completionChart');
  if (chartInstances.completion) chartInstances.completion.destroy();
  chartInstances.completion = new Chart(completionCanvas, {
    type: 'line',
    data: { labels: series.map(function(item) { return item.date.slice(5); }), datasets: [{ label: profileCopy('Уроки', 'Сабақтар'), data: series.map(function(item) { return item.count; }), borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.08)', fill: true, tension: .35, pointRadius: 2, pointBackgroundColor: '#4F46E5', borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#94A3B8', maxTicksLimit: 8 } }, y: { beginAtZero: true, ticks: { precision: 0, color: '#94A3B8' }, grid: { color: 'rgba(0,0,0,.04)' } } } },
  });
  var subjectsCanvas = document.getElementById('subjectsChart');
  if (chartInstances.subjects) chartInstances.subjects.destroy();
  chartInstances.subjects = new Chart(subjectsCanvas, {
    type: 'doughnut',
    data: { labels: subjects.map(function(subject) { return localize(subject, 'name') || subject.name; }), datasets: [{ data: subjects.map(function(subject) { return subject.completedLessons; }), backgroundColor: subjects.map(function(subject) { return subject.mainColor; }), borderWidth: 3, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 8, color: '#64748B', font: { size: 10, weight: 'bold' } } } } },
  });
  var summary = studySummary();
  var next = Learning.getNextLesson();
  document.getElementById('insights-grid').innerHTML = [
    { icon: '▤', label: profileCopy('Учебных дней', 'Оқу күні'), value: summary.dates.length },
    { icon: '✓', label: profileCopy('Пройдено уроков', 'Аяқталған сабақ'), value: summary.completed },
    { icon: '→', label: profileCopy('Следующий урок', 'Келесі сабақ'), value: next ? localize(next, 'title') : '—' },
  ].map(function(item) { return '<div class="insight-card text-center"><div class="text-xl mb-1">' + item.icon + '</div><div class="font-head font-extrabold text-base text-slate-900">' + escapeHtml(item.value) + '</div><div class="text-[11px] font-bold text-slate-400 mt-0.5">' + item.label + '</div></div>'; }).join('');
}

document.addEventListener('progress:update', function() {
  renderHeaderAndProgress();
  renderStats();
  renderSubjectMiniStats();
  renderCalendar();
  renderTimeline();
  renderTopics();
  renderLearningCards();
  renderAnalytics();
});

document.addEventListener('DOMContentLoaded', function() {
  ML.applySettings();
  renderHeaderAndProgress();
  renderStats();
  renderSubjectMiniStats();
  renderCalendar();
  renderTimeline();
  renderTopics();
  renderLearningCards();
  setTimeout(renderAnalytics, 100);
  ANIME.initPageTransitions();
  setTimeout(function() {
    var percentage = Learning.getOverallProgress();
    var ring = document.getElementById('progress-ring');
    var glow = document.getElementById('progress-glow');
    if (ring && glow) {
      var offset = 439.8 * (100 - percentage) / 100;
      ring.style.setProperty('--offset', offset + 'px');
      glow.style.setProperty('--offset', offset + 'px');
      ring.classList.add('animated');
      glow.classList.add('animated');
    }
  }, 200);
});
