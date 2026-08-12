(function() {
  'use strict';

  var historyVisible = 10;
  var achievementsExpanded = false;

  function lang() { return ML.getLang(); }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }
  function localize(record, key) { return I18N.localize(record, key, lang()); }
  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clamp(value) { return Math.max(0, Math.min(100, Number(value) || 0)); }
  function setText(id, value) { var node = document.getElementById(id); if (node) node.textContent = value; }

  function lessons() {
    return Object.keys(Learning.getRegistry()).map(function(id) { return Learning.getLesson(id); }).filter(Boolean);
  }

  function hasSavedProgress(lessonId) {
    var session = ML.getLessonSession(lessonId);
    return Boolean(session && Array.isArray(session.completedBlocks) && session.completedBlocks.length);
  }

  function topics() {
    var items = [];
    Learning.getSubjects().forEach(function(subject) {
      Learning.getTopics(subject.key).forEach(function(topic) {
        var current = topic.lessons.some(function(lesson) { return hasSavedProgress(lesson.id); });
        var completed = topic.totalLessons > 0 && topic.completedLessons === topic.totalLessons;
        var realLesson = topic.lessons.find(function(lesson) {
          return lesson.hasContent && (lesson.status === 'completed' || hasSavedProgress(lesson.id));
        });
        items.push({
          id: topic.id,
          subjectKey: subject.key,
          title: realLesson ? localize(realLesson, 'title') : localize(topic, 'title'),
          subject: I18N.t('subjects.' + subject.key, lang()) || localize(subject, 'name') || subject.name,
          status: completed ? 'completed' : current ? 'current' : topic.completedLessons > 0 ? 'current' : 'planned',
          progress: topic.progress,
          completedLessons: topic.completedLessons,
          totalLessons: topic.totalLessons,
          color: subject.mainColor,
          lessons: topic.lessons,
        });
      });
    });
    return items;
  }

  function completedRecords() {
    var records = ML.getCompletedLessons();
    return Object.keys(records).map(function(id) {
      return { lesson: Learning.getLesson(id), record: records[id] };
    }).filter(function(item) { return item.lesson && item.record; }).sort(function(a, b) {
      return (Number(b.record.completedAt) || 0) - (Number(a.record.completedAt) || 0);
    });
  }

  function activityDates() {
    var activity = ML.get('activity', { dates: [] }) || {};
    return Array.isArray(activity.dates) ? activity.dates.slice().sort() : [];
  }

  function formatDate(value, short) {
    if (!value) return '—';
    var date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T12:00:00') : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(lang() === 'kk' ? 'kk-KZ' : 'ru-RU', short ? { day:'numeric', month:'short' } : { day:'numeric', month:'long', year:'numeric' }).format(date);
  }

  function parseLocalDate(key) {
    var parts = String(key || '').split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 12);
  }

  function activityDetail(entry) {
    if (!entry.active) return '';
    if (entry.seconds < 60) return copy('Учебная активность отмечена', 'Оқу белсенділігі тіркелді');
    var minutes = Math.max(1, Math.round(entry.seconds / 60));
    return minutes + ' ' + copy('мин учебной работы', 'мин оқу жұмысы');
  }

  function activityMonth(date, short) {
    var ru = short
      ? ['янв.', 'февр.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.']
      : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    var kk = short
      ? ['қаң.', 'ақп.', 'нау.', 'сәу.', 'мам.', 'мау.', 'шіл.', 'там.', 'қыр.', 'қаз.', 'қар.', 'жел.']
      : ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
    return (lang() === 'kk' ? kk : ru)[date.getMonth()];
  }

  function activityDate(entry) {
    var date = parseLocalDate(entry.date);
    if (lang() === 'kk') return date.getDate() + ' ' + activityMonth(date, false) + ' ' + date.getFullYear() + ' ж.';
    return date.getDate() + ' ' + activityMonth(date, false) + ' ' + date.getFullYear();
  }

  function activityDaysSummary(count) {
    if (lang() === 'kk') return count + ' соңғы жылдағы оқу күні';
    var mod10 = count % 10;
    var mod100 = count % 100;
    var noun = mod10 === 1 && mod100 !== 11 ? 'учебный день' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'учебных дня' : 'учебных дней';
    return count + ' ' + noun + ' за последний год';
  }

  function streakDays(count) {
    if (lang() === 'kk') return 'күн';
    var mod10 = count % 10;
    var mod100 = count % 100;
    return mod10 === 1 && mod100 !== 11 ? 'день'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'дня' : 'дней';
  }

  function activityLabel(entry) {
    return activityDate(entry) + (lang() === 'kk' ? ' ' : '. ') + activityDetail(entry);
  }

  function renderActivity() {
    var root = document.getElementById('activity-chart');
    var empty = document.getElementById('activity-empty');
    var scroll = document.getElementById('activity-scroll');
    if (!root || !empty || !scroll) return;

    var entries = ML.getActivityRange();
    var leading = entries.length ? (parseLocalDate(entries[0].date).getDay() + 6) % 7 : 0;
    var cells = Array(leading).fill(null).concat(entries);
    while (cells.length % 7) cells.push(null);
    var weeks = Math.max(1, cells.length / 7);
    var months = [];
    var seen = {};
    entries.forEach(function(entry, index) {
      var date = parseLocalDate(entry.date);
      var monthKey = date.getFullYear() + '-' + date.getMonth();
      if (seen[monthKey]) return;
      seen[monthKey] = true;
      months.push({
        week: Math.floor((leading + index) / 7) + 1,
        label: activityMonth(date, true),
      });
    });

    var monthHtml = months.map(function(month) {
      return '<span style="grid-column:' + month.week + '">' + escapeHtml(month.label) + '</span>';
    }).join('');
    var cellHtml = cells.map(function(entry) {
      if (!entry) return '<span class="v7-activity-cell is-outside" aria-hidden="true"></span>';
      if (!entry.active) return '<span class="v7-activity-cell" data-level="0" aria-hidden="true"></span>';
      var label = activityLabel(entry);
      return '<button class="v7-activity-cell" type="button" data-level="' + entry.intensity + '" data-activity-date="' + escapeHtml(entry.date) + '" data-activity-detail="' + escapeHtml(activityDetail(entry)) + '" aria-label="' + escapeHtml(label) + '"></button>';
    }).join('');
    root.style.setProperty('--activity-weeks', weeks);
    root.innerHTML = '<div class="v7-activity-months" aria-hidden="true">' + monthHtml + '</div>' +
      '<div class="v7-activity-weekdays" aria-hidden="true"><span>Пн</span><span>Ср</span><span>Пт</span></div>' +
      '<div class="v7-activity-grid">' + cellHtml + '</div>';

    var activeDays = entries.filter(function(entry) { return entry.active; }).length;
    setText('activity-summary', activityDaysSummary(activeDays));
    empty.hidden = activeDays !== 0;
    scroll.setAttribute('aria-label', copy('Учебная активность за последние 12 месяцев', 'Соңғы 12 айдағы оқу белсенділігі'));
    scroll.scrollLeft = scroll.scrollWidth;
  }

  function showActivityTooltip(cell) {
    var tooltip = document.getElementById('activity-tooltip');
    if (!tooltip || !cell || !cell.dataset.activityDate) return;
    tooltip.innerHTML = '<strong>' + escapeHtml(activityDate({ date: cell.dataset.activityDate })) + '</strong><span>' + escapeHtml(cell.dataset.activityDetail) + '</span>';
    tooltip.hidden = false;
    if (!cell.getBoundingClientRect || !tooltip.getBoundingClientRect) return;
    var cellRect = cell.getBoundingClientRect();
    var tipRect = tooltip.getBoundingClientRect();
    var left = Math.max(8, Math.min(window.innerWidth - tipRect.width - 8, cellRect.left + cellRect.width / 2 - tipRect.width / 2));
    var top = Math.max(8, cellRect.top - tipRect.height - 9);
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function hideActivityTooltip() {
    var tooltip = document.getElementById('activity-tooltip');
    if (tooltip) tooltip.hidden = true;
  }

  function summary() {
    var all = lessons();
    var dates = activityDates();
    return {
      all: all,
      completed: all.filter(function(item) { return item.status === 'completed'; }).length,
      active: all.filter(function(item) { return item.status === 'current'; }).length,
      available: all.filter(function(item) { return item.status === 'available' || item.status === 'current'; }).length,
      dates: dates,
    };
  }

  function applyTheme() {
    ML.applySettings();
    document.querySelectorAll('[data-theme-toggle]').forEach(function(button) {
      button.textContent = document.documentElement.dataset.theme === 'dark' ? '◑' : '◐';
    });
  }

  function renderHeaderAndMetrics() {
    var data = summary();
    var user = ML.getUser() || {};
    var records = completedRecords();
    var name = user.name || copy('Пользователь', 'Пайдаланушы');
    var lastDate = records.length ? records[0].record.completedAt : (data.dates.length ? data.dates[data.dates.length - 1] : null);
    setText('profile-name', name);
    setText('profile-avatar', name.charAt(0).toUpperCase());
    setText('profile-username', user.username || '@user');
    setText('profile-member-since', formatDate(user.createdAt, false));
    setText('profile-completed', data.completed);
    setText('profile-active', data.active);
    setText('profile-last-date', formatDate(lastDate, true));
    setText('metric-completed', data.completed);
    setText('metric-completed-note', data.completed + ' / ' + data.all.length + ' ' + copy('зарегистрированных уроков', 'тіркелген сабақ'));
    setText('metric-active', data.active);
    setText('metric-active-note', data.active ? copy('есть сохранённый шаг', 'сақталған қадам бар') : copy('нет начатых уроков', 'басталған сабақ жоқ'));
    setText('metric-days', data.dates.length);
    setText('metric-days-note', data.dates.length ? copy('последнее: ', 'соңғысы: ') + formatDate(data.dates[data.dates.length - 1], true) : copy('занятий пока нет', 'әзірге сабақ жоқ'));
    var streak = Math.max(0, Number(user.streak) || 0);
    setText('metric-streak', streak);
    setText('metric-streak-note', streakDays(streak));
  }

  function renderHistory() {
    var root = document.getElementById('profile-history');
    var countPill = document.getElementById('history-count-pill');
    var events = ML.getLearningHistory();
    setText('history-eyebrow', I18N.t('history.eyebrow', lang()));
    setText('history-title', I18N.t('history.title', lang()));
    setText('history-subtitle', I18N.t('history.subtitle', lang()));
    setText('history-count', events.length);
    setText('history-count-label', I18N.t('history.events', lang()));
    countPill.hidden = events.length === 0;
    if (!events.length) {
      root.innerHTML = '<div class="product-empty v7-history-empty"><p>' + escapeHtml(I18N.t('history.empty', lang())) + '</p><a href="program.html">' + escapeHtml(I18N.t('history.openProgram', lang())) + '</a></div>';
      return;
    }

    var visible = events.slice(0, historyVisible);
    var groups = [];
    visible.forEach(function(event) {
      var key = localDateKey(event.timestamp);
      var group = groups.find(function(item) { return item.key === key; });
      if (!group) {
        group = { key: key, events: [] };
        groups.push(group);
      }
      group.events.push(event);
    });
    root.innerHTML = groups.map(function(group) {
      return '<section class="v7-history-day" aria-labelledby="history-day-' + escapeHtml(group.key) + '">' +
        '<h3 id="history-day-' + escapeHtml(group.key) + '">' + escapeHtml(historyDayLabel(group.key)) + '</h3>' +
        '<ol>' + group.events.map(renderHistoryEvent).join('') + '</ol></section>';
    }).join('') + (events.length > historyVisible
      ? '<button class="v7-history-more" id="history-more" type="button">' + escapeHtml(I18N.t('history.showMore', lang())) + '</button>'
      : '');
    var more = document.getElementById('history-more');
    if (more) more.addEventListener('click', function() { historyVisible += 10; renderHistory(); });
  }

  function localDateKey(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function historyDayLabel(key) {
    var date = parseLocalDate(key);
    var today = new Date();
    var todayKey = localDateKey(today);
    var yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12);
    if (key === todayKey) return I18N.t('history.today', lang());
    if (key === localDateKey(yesterday)) return I18N.t('history.yesterday', lang());
    var result = date.getDate() + ' ' + activityMonth(date, false);
    if (date.getFullYear() !== today.getFullYear()) result += lang() === 'kk' ? ' ' + date.getFullYear() + ' ж.' : ' ' + date.getFullYear();
    return result;
  }

  function historyAction(type) {
    var keys = {
      LESSON_STARTED: 'history.lessonStarted',
      LESSON_CONTINUED: 'history.lessonContinued',
      LESSON_COMPLETED: 'history.lessonCompleted',
    };
    return I18N.t(keys[type] || 'history.lessonContinued', lang());
  }

  function historyLesson(event) {
    var lesson = Learning.getLesson(event.lessonId);
    if (lesson) return { title: localize(lesson, 'title'), route: lesson.route || lesson.link || '' };
    var savedTitle = event.metadata && event.metadata.lessonTitle;
    var title = savedTitle && typeof savedTitle === 'object'
      ? (lang() === 'kk' ? savedTitle.kk || savedTitle.ru : savedTitle.ru || savedTitle.kk)
      : '';
    return { title: title || I18N.t('history.unknownLesson', lang()), route: '' };
  }

  function historyMeta(event) {
    var metadata = event.metadata || {};
    var parts = [];
    if (event.type === 'LESSON_COMPLETED') {
      var total = Math.max(0, Number(metadata.totalQuestions) || 0);
      var correct = Math.max(0, Number(metadata.correctAnswers) || 0);
      if (total) parts.push(correct + ' / ' + total + ' ' + I18N.t('history.tasks', lang()));
      var minutes = Math.round(Math.max(0, Number(metadata.duration) || 0) / 60);
      if (minutes) parts.push(minutes + ' ' + I18N.t('history.minutes', lang()));
      var attempts = Math.max(0, Number(metadata.attempts) || 0);
      if (attempts > total && attempts > 0) parts.push(attempts + ' ' + I18N.t('history.attempts', lang()));
    }
    return parts;
  }

  function renderHistoryEvent(event) {
    var lesson = historyLesson(event);
    var date = new Date(event.timestamp);
    var time = new Intl.DateTimeFormat(lang() === 'kk' ? 'kk-KZ' : 'ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date);
    var title = lesson.route
      ? '<a href="' + escapeHtml(lesson.route) + '" aria-label="' + escapeHtml(lesson.title + '. ' + I18N.t('history.openLesson', lang())) + '">' + escapeHtml(lesson.title) + '</a>'
      : '<strong>' + escapeHtml(lesson.title) + '</strong>';
    var meta = historyMeta(event);
    return '<li class="v7-history-event is-' + escapeHtml(event.type.toLowerCase().replace('lesson_', '')) + '">' +
      '<span class="v7-history-marker" aria-hidden="true"></span><div class="v7-history-content">' +
      '<div class="v7-history-primary">' + title + '<time datetime="' + escapeHtml(date.toISOString()) + '">' + escapeHtml(time) + '</time></div>' +
      '<p>' + escapeHtml(historyAction(event.type)) + '</p>' +
      (meta.length ? '<small>' + meta.map(escapeHtml).join('<span aria-hidden="true"> · </span>') + '</small>' : '') +
      '</div></li>';
  }

  function renderNext() {
    var next = Learning.getNextLesson();
    var link = document.getElementById('next-link');
    if (!next) {
      setText('next-title', copy('Доступные уроки завершены', 'Қолжетімді сабақтар аяқталды'));
      setText('next-description', copy('Можно повторить пройденный материал через Dashboard.', 'Өткен материалды Dashboard арқылы қайталауға болады.'));
      setText('next-duration', '—');
      setText('next-state', copy('нет следующего урока', 'келесі сабақ жоқ'));
      document.getElementById('next-progress').style.width = '100%';
      link.href = 'dashboard.html';
      link.textContent = copy('Открыть Dashboard', 'Dashboard ашу');
      return;
    }
    var relatedTopic = topics().find(function(topic) {
      return topic.lessons.some(function(lesson) { return lesson.id === next.id; });
    });
    setText('next-title', localize(next, 'title'));
    setText('next-description', localize(next, 'description'));
    setText('next-duration', next.duration ? next.duration + ' ' + copy('мин', 'мин') : copy('интерактивный урок', 'интерактивті сабақ'));
    setText('next-state', next.status === 'current' ? copy('в процессе', 'жалғасуда') : copy('доступен', 'қолжетімді'));
    document.getElementById('next-progress').style.width = clamp(relatedTopic ? relatedTopic.progress : 0) + '%';
    link.href = next.route;
    link.textContent = next.status === 'current' ? copy('Продолжить урок', 'Сабақты жалғастыру') : copy('Открыть урок', 'Сабақты ашу');
  }

  function renderTopics() {
    var root = document.getElementById('profile-topics');
    var recent = topics().filter(function(topic) { return topic.status !== 'planned'; }).slice(0, 6);
    if (!recent.length) {
      root.innerHTML = '<div class="product-empty">' + escapeHtml(copy('Изученных или начатых тем пока нет. Выберите первый урок в Dashboard.', 'Әзірге оқылған немесе басталған тақырып жоқ. Dashboard ішінен бірінші сабақты таңдаңыз.')) + '</div>';
      return;
    }
    root.innerHTML = recent.map(function(topic) {
      var status = topic.status === 'completed' ? copy('изучено', 'меңгерілді') : copy('в процессе', 'жалғасуда');
      return '<article class="product-topic-card is-' + escapeHtml(topic.subjectKey) + '"><span class="axis-eyebrow">' + escapeHtml(status) + '</span><strong>' + escapeHtml(topic.title) + '</strong><small>' + escapeHtml(topic.subject) + ' · ' + topic.completedLessons + ' / ' + topic.totalLessons + ' ' + escapeHtml(copy('уроков', 'сабақ')) + '</small><div class="axis-track" style="margin-top:16px"><span style="width:' + clamp(topic.progress) + '%"></span></div></article>';
    }).join('');
  }

  function achievementTitle(item) {
    var id = typeof item === 'string' ? item : item && item.id || '';
    var stored = typeof item === 'object' && item
      ? (lang() === 'kk' ? item.titleKk || item.title : item.titleRu || item.title)
      : '';
    if (stored && !/[_-]/.test(stored)) return stored;
    var labels = {
      first_lesson: ['Первый урок', 'Бірінші сабақ'],
      five_lessons: ['5 уроков', '5 сабақ'],
      ten_lessons: ['10 уроков', '10 сабақ'],
      twenty_five_lessons: ['25 уроков', '25 сабақ'],
      fifty_lessons: ['50 уроков', '50 сабақ'],
      hundred_lessons: ['100 уроков', '100 сабақ'],
      perfect_score: ['Без ошибок', 'Қатесіз'],
      first_try: ['С первой попытки', 'Бірінші әрекеттен'],
      first_week: ['Первая учебная неделя', 'Бірінші оқу аптасы'],
      week_streak: ['Неделя занятий', 'Бір апта оқу'],
      month_streak: ['Месяц занятий', 'Бір ай оқу'],
      algebra_master: ['Алгебра освоена', 'Алгебра меңгерілді'],
      geometry_master: ['Геометрия освоена', 'Геометрия меңгерілді']
    };
    if (labels[id]) return labels[id][lang() === 'kk' ? 1 : 0];
    var readable = String(id || stored || '').replace(/[_-]+/g, ' ').trim();
    return readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : copy('Достижение', 'Жетістік');
  }

  function renderAchievements() {
    var section = document.getElementById('profile-achievements');
    var root = document.getElementById('profile-achievement-grid');
    var toggle = document.getElementById('profile-achievements-toggle');
    var achievements = ML.get('achievements', []);
    if (!Array.isArray(achievements) || !achievements.length) {
      section.hidden = true;
      root.innerHTML = '';
      toggle.hidden = true;
      return;
    }
    section.hidden = false;
    var marks = ['Σ', 'Δ', 'α', '∫'];
    var visible = achievementsExpanded ? achievements : achievements.slice(0, 8);
    root.innerHTML = visible.map(function(item, index) {
      var date = typeof item === 'object' ? item.unlockedAt || item.earnedAt || item.date : null;
      return '<article class="v8-achievement is-unlocked"><span aria-hidden="true">' + marks[index % marks.length] + '</span><div><strong>' + escapeHtml(achievementTitle(item)) + '</strong><small>' + escapeHtml(date ? formatDate(date, true) : copy('Получено', 'Алынды')) + '</small></div></article>';
    }).join('');
    toggle.hidden = achievements.length <= 8;
    toggle.textContent = achievementsExpanded
      ? copy('Свернуть', 'Жию')
      : copy('Все достижения', 'Барлық жетістіктер') + ' (' + achievements.length + ')';
  }

  function render() {
    MathLogicSite.applyCopy();
    applyTheme();
    document.querySelectorAll('[data-language-choice]').forEach(function(button) {
      button.setAttribute('aria-pressed', String(button.dataset.languageChoice === lang()));
    });
    renderHeaderAndMetrics();
    renderActivity();
    renderHistory();
    renderNext();
    renderTopics();
    renderAchievements();
  }

  function init() {
    var activity = document.getElementById('activity-chart');
    if (activity) {
      activity.addEventListener('mouseover', function(event) { showActivityTooltip(event.target.closest && event.target.closest('[data-activity-date]')); });
      activity.addEventListener('focusin', function(event) { showActivityTooltip(event.target); });
      activity.addEventListener('mouseout', hideActivityTooltip);
      activity.addEventListener('focusout', hideActivityTooltip);
    }
    document.querySelectorAll('[data-language-choice]').forEach(function(button) {
      button.addEventListener('click', function() { ML.setLang(button.dataset.languageChoice); render(); });
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(function(button) {
      button.addEventListener('click', function() {
        ML.setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
        applyTheme();
      });
    });
    document.querySelectorAll('[data-app-logout]').forEach(function(button) {
      button.addEventListener('click', function() {
        ML.clearUser();
        window.location.href = 'login.html';
      });
    });
    document.getElementById('profile-achievements-toggle').addEventListener('click', function() {
      achievementsExpanded = !achievementsExpanded;
      renderAchievements();
    });
    render();
    if (typeof ANIME !== 'undefined' && ANIME.initPageTransitions) ANIME.initPageTransitions();
  }

  document.addEventListener('progress:update', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
