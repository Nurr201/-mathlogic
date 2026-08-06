(function() {
  'use strict';

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
    setText('profile-completed', data.completed);
    setText('profile-active', data.active);
    setText('profile-last-date', formatDate(lastDate, true));
    setText('metric-completed', data.completed);
    setText('metric-completed-note', data.completed + ' / ' + data.all.length + ' ' + copy('зарегистрированных уроков', 'тіркелген сабақ'));
    setText('metric-active', data.active);
    setText('metric-active-note', data.active ? copy('есть сохранённый шаг', 'сақталған қадам бар') : copy('нет начатых уроков', 'басталған сабақ жоқ'));
    setText('metric-days', data.dates.length);
    setText('metric-days-note', data.dates.length ? copy('последнее: ', 'соңғысы: ') + formatDate(data.dates[data.dates.length - 1], true) : copy('занятий пока нет', 'әзірге сабақ жоқ'));
    setText('metric-available', data.available);
    setText('metric-available-note', copy('можно открыть сейчас', 'қазір ашуға болады'));
  }

  function renderHistory() {
    var root = document.getElementById('profile-history');
    var records = completedRecords();
    setText('history-count', records.length);
    if (!records.length) {
      root.innerHTML = '<div class="product-empty">' + escapeHtml(copy('Завершённых уроков пока нет. После первого завершения здесь появится запись.', 'Әзірге аяқталған сабақ жоқ. Бірінші сабақ аяқталғаннан кейін мұнда жазба пайда болады.')) + '</div>';
      return;
    }
    root.innerHTML = records.slice(0, 8).map(function(item) {
      var total = Number(item.record.totalQuestions) || 0;
      var correct = Number(item.record.correctAnswers) || 0;
      var result = total ? correct + ' / ' + total + ' ' + copy('задач', 'тапсырма') : copy('урок завершён', 'сабақ аяқталды');
      return '<article class="product-history-item"><span class="product-history-mark">✓</span><span><strong>' + escapeHtml(localize(item.lesson, 'title')) + '</strong><small>' + escapeHtml(result) + '</small></span><time>' + escapeHtml(formatDate(item.record.completedAt, true)) + '</time></article>';
    }).join('');
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
      return '<article class="product-topic-card" style="border-top:2px solid ' + escapeHtml(topic.color) + '"><span class="axis-eyebrow">' + escapeHtml(status) + '</span><strong>' + escapeHtml(topic.title) + '</strong><small>' + escapeHtml(topic.subject) + ' · ' + topic.completedLessons + ' / ' + topic.totalLessons + ' ' + escapeHtml(copy('уроков', 'сабақ')) + '</small><div class="axis-track" style="margin-top:16px"><span style="width:' + clamp(topic.progress) + '%;background:' + escapeHtml(topic.color) + '"></span></div></article>';
    }).join('');
  }

  function render() {
    MathLogicSite.applyCopy();
    applyTheme();
    document.querySelectorAll('[data-language-choice]').forEach(function(button) {
      button.setAttribute('aria-pressed', String(button.dataset.languageChoice === lang()));
    });
    renderHeaderAndMetrics();
    renderHistory();
    renderNext();
    renderTopics();
  }

  function init() {
    document.querySelectorAll('[data-language-choice]').forEach(function(button) {
      button.addEventListener('click', function() { ML.setLang(button.dataset.languageChoice); render(); });
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(function(button) {
      button.addEventListener('click', function() {
        ML.setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
        applyTheme();
      });
    });
    render();
    if (typeof ANIME !== 'undefined' && ANIME.initPageTransitions) ANIME.initPageTransitions();
  }

  document.addEventListener('progress:update', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
