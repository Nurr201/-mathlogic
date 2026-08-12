/* Dashboard — a focused, editorial view of the learner's next step. */

(function() {
  'use strict';

  const state = {
    lang: ML.getLang(),
    currentSubject: 'algebra'
  };

  function t(key) { return I18N.t('dashboard.' + key, state.lang); }
  function copy(ru, kk) { return state.lang === 'kk' ? kk : ru; }
  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function subjectName(subject) { return I18N.t('subjects.' + subject.key, state.lang) || subject.name; }
  function localized(record, key) { return I18N.localize(record, key, state.lang); }
  function lessonTitle(lesson) { return localized(lesson, 'title'); }
  function lessonDescription(lesson) { return localized(lesson, 'description'); }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function formatToday() {
    const now = new Date();
    if (state.lang !== 'kk') {
      return new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
    }
    const weekdays = ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі'];
    const months = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
    return weekdays[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()];
  }

  function applyCopy() {
    document.documentElement.lang = state.lang;
    if (window.MathLogicSite) MathLogicSite.applyCopy();
    document.querySelectorAll('[data-copy]').forEach(function(node) {
      node.textContent = t(node.dataset.copy);
    });
    document.querySelectorAll('[data-lang]').forEach(function(button) {
      button.setAttribute('aria-pressed', String(button.dataset.lang === state.lang));
    });
  }

  function renderTop() {
    const user = ML.getUser() || {};
    const name = user.name || user.username || '';
    setText('dashboard-greeting', copy('Добрый день', 'Қайырлы күн') + (name ? ', ' + name.split(' ')[0] : ''));
    const date = formatToday();
    setText('dashboard-date', date.charAt(0).toUpperCase() + date.slice(1));
    setText('dashboard-avatar', (name || t('profile')).charAt(0).toUpperCase());
  }

  function renderStats() {
    const registry = Learning.getRegistry();
    const lessons = Object.keys(registry).map(function(id) { return Learning.getLesson(id); }).filter(Boolean);
    const activity = ML.getActivityRange();
    setText('dashboard-completed', Learning.getTotalCompletedLessons());
    setText('dashboard-active', lessons.filter(function(lesson) { return lesson.status === 'current'; }).length);
    setText('dashboard-days', activity.filter(function(day) { return day.active; }).length);
    setText('dashboard-available', lessons.filter(function(lesson) { return lesson.status === 'available' || lesson.status === 'current'; }).length);
  }

  function subjectMath(key) {
    if (key === 'geometry') return '<svg viewBox="0 0 180 96" aria-hidden="true"><path d="M18 78 78 16l70 62H18Z"/><path d="M42 78a25 25 0 0 1 8-18M120 78a25 25 0 0 0-8-18"/><circle cx="78" cy="16" r="3"/></svg>';
    if (key === 'algebra') return '<svg viewBox="0 0 180 96" aria-hidden="true"><path d="M18 73h145M58 84V10M24 65l124-42"/><circle cx="58" cy="55" r="4"/><text x="72" y="48">y = kx + b</text></svg>';
    return '<div class="v8-subject-symbol" aria-hidden="true">Σ α</div>';
  }

  function topicState(topic) {
    const published = topic.lessons.filter(function(lesson) { return lesson.hasContent; });
    const action = published.find(function(lesson) { return lesson.status === 'current'; }) ||
      published.find(function(lesson) { return lesson.status === 'available'; }) ||
      published.find(function(lesson) { return lesson.status === 'completed'; });
    if (topic.totalLessons > 0 && topic.completedLessons === topic.totalLessons) return { key: 'completed', label: copy('Завершено', 'Аяқталды'), action: action };
    if (topic.progress > 0) return { key: 'active', label: copy('В процессе', 'Жалғасуда'), action: action };
    if (action) return { key: 'available', label: copy('Доступно', 'Қолжетімді'), action: action };
    return { key: 'locked', label: copy('Нет опубликованных уроков', 'Жарияланған сабақ жоқ'), action: null };
  }

  function renderSubjects() {
    const subjectRoot = document.getElementById('dashboard-subject-grid');
    const topicRoot = document.getElementById('dashboard-topic-grid');
    const subjects = Learning.getSubjects();
    if (!subjects.length) {
      subjectRoot.innerHTML = '';
      topicRoot.innerHTML = '<p class="v8-topics-empty">' + esc(copy('Предметы пока не опубликованы.', 'Пәндер әлі жарияланған жоқ.')) + '</p>';
      return;
    }
    if (!subjects.some(function(subject) { return subject.key === state.currentSubject; })) state.currentSubject = subjects[0].key;
    subjectRoot.innerHTML = subjects.map(function(subject, index) {
      const selected = subject.key === state.currentSubject;
      return '<button class="v8-subject is-' + esc(subject.key) + '" type="button" role="tab" aria-selected="' + selected + '" aria-controls="dashboard-topic-grid" data-dashboard-subject="' + esc(subject.key) + '">' +
        '<span class="v8-subject-index">0' + (index + 1) + '</span>' + subjectMath(subject.key) +
        '<strong>' + esc(subjectName(subject)) + '</strong><small>' + subject.completedLessons + ' / ' + subject.totalLessons + ' ' + esc(copy('уроков', 'сабақ')) + '</small>' +
        '<span class="v8-thin-progress"><i style="width:' + subject.progress + '%"></i></span></button>';
    }).join('');
    const priority = { active: 0, available: 1, completed: 2, locked: 3 };
    const topics = Learning.getTopics(state.currentSubject).filter(function(topic) {
      return topic.totalLessons > 0;
    }).map(function(topic, index) {
      return { topic: topic, status: topicState(topic), index: index };
    }).sort(function(a, b) {
      return priority[a.status.key] - priority[b.status.key] || a.index - b.index;
    }).slice(0, 6);
    topicRoot.innerHTML = topics.map(function(item) {
      const topic = item.topic;
      const status = item.status;
      const title = esc(localized(topic, 'title'));
      const body = '<span class="v8-topic-state">' + esc(status.label) + '</span><strong>' + title + '</strong><small>' + topic.completedLessons + ' / ' + topic.totalLessons + ' ' + esc(copy('уроков', 'сабақ')) + '</small><span class="v8-thin-progress"><i style="width:' + topic.progress + '%"></i></span>';
      return status.action
        ? '<a class="v8-topic-item is-' + status.key + '" href="' + esc(status.action.route) + '">' + body + '<span aria-hidden="true">↗</span></a>'
        : '<article class="v8-topic-item is-' + status.key + '">' + body + '<span aria-hidden="true">—</span></article>';
    }).join('');
    document.getElementById('dashboard-subject-program').href = 'program.html?subject=' + encodeURIComponent(state.currentSubject);
  }

  function progressText(count) {
    if (state.lang === 'kk') return count + ' қадам сақталды';
    const last = count % 10;
    const lastTwo = count % 100;
    const word = last === 1 && lastTwo !== 11 ? 'шаг сохранён' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'шага сохранено' : 'шагов сохранено';
    return count + ' ' + word;
  }

  function renderHero(model) {
    const next = model.action;
    const hero = document.getElementById('dashboard-hero');
    const empty = document.getElementById('dashboard-empty');
    if (!next) {
      hero.hidden = true;
      empty.hidden = false;
      empty.innerHTML = '<span class="v7-eyebrow">' + esc(copy('Обучение', 'Оқу')) + '</span><h2>' + esc(copy('На сегодня всё', 'Бүгінге осы жеткілікті')) + '</h2><p>' + esc(copy('Все доступные уроки завершены. Выберите тему в программе, чтобы продолжить.', 'Барлық қолжетімді сабақ аяқталды. Жалғастыру үшін бағдарламадан тақырып таңдаңыз.')) + '</p><a class="v7-dashboard-text-link" href="program.html">' + esc(copy('Открыть программу', 'Бағдарламаны ашу')) + ' →</a>';
      return;
    }
    hero.hidden = false;
    empty.hidden = true;
    const subject = Learning.getSubject(next.subjectKey);
    const topic = model.topic;
    state.currentSubject = next.subjectKey;
    setText('hero-label', model.resume ? copy('Продолжить', 'Жалғастыру') : copy('Следующий урок', 'Келесі сабақ'));
    setText('hero-path', (subject ? subjectName(subject) : '') + (topic ? ' · ' + topic.title : ''));
    setText('hero-title', lessonTitle(next));
    const completedBlocks = next.session && Array.isArray(next.session.completedBlocks) ? next.session.completedBlocks.length : 0;
    const runtimeTopic = Learning.getTopic(next.subjectKey, next.topicId);
    const topicProgress = runtimeTopic ? Math.max(0, Math.min(100, Number(runtimeTopic.progress) || 0)) : 0;
    setText('hero-description', model.resume
      ? copy('Сохранённый прогресс ждёт вас в уроке.', 'Сақталған оқу барысы сабақта күтіп тұр.')
      : (lessonDescription(next) || copy('Интерактивный урок в вашей программе.', 'Бағдарламаңыздағы интерактивті сабақ.')));
    const primary = document.getElementById('hero-primary');
    primary.href = next.route;
    setText('hero-primary-label', model.resume ? copy('Продолжить', 'Жалғастыру') : copy('Начать', 'Бастау'));
    const progressWrap = document.getElementById('hero-progress-wrap');
    progressWrap.hidden = !completedBlocks && !topicProgress;
    if (!progressWrap.hidden) {
      setText('hero-progress-label', completedBlocks
        ? progressText(completedBlocks)
        : topicProgress + '% ' + copy('темы пройдено', 'тақырып аяқталды'));
      document.getElementById('hero-progress-fill').style.width = topicProgress + '%';
    }
  }

  function topicStatus(lesson, focus) {
    if (lesson.status === 'completed') return { marker: '✓', state: 'completed', label: copy('Завершён', 'Аяқталды') };
    if (focus && lesson.id === focus.id) return { marker: '●', state: 'current', label: copy('Сейчас', 'Қазір') };
    return { marker: '○', state: 'unstarted', label: copy('Не начат', 'Басталмаған') };
  }

  function renderCurrentTopic(model) {
    const root = document.getElementById('current-topic-points');
    const section = document.getElementById('current-topic');
    const topic = model.topic;
    if (!topic) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    setText('current-topic-title', topic.title);
    const subject = Learning.getSubject(topic.subjectKey);
    setText('current-topic-subject', subject ? subjectName(subject) : '');
    document.getElementById('current-topic-link').href = 'program.html?subject=' + encodeURIComponent(topic.subjectKey);
    root.innerHTML = topic.lessons.map(function(lesson) {
      const status = topicStatus(lesson, model.focus);
      const title = esc(lessonTitle(lesson));
      const body = (lesson.status === 'available' || lesson.status === 'current' || lesson.status === 'completed')
        ? '<a href="' + esc(lesson.route) + '">' + title + '</a>' : '<span>' + title + '</span>';
      return '<li class="v7-current-topic-item is-' + status.state + '"><span class="v7-current-topic-marker" aria-hidden="true">' + status.marker + '</span><div>' + body + '<small>' + esc(status.label) + '</small></div></li>';
    }).join('');
  }

  function activityDate(timestamp) {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = 24 * 60 * 60 * 1000;
    const difference = Math.floor((start - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / day);
    if (difference === 0) return copy('Сегодня', 'Бүгін');
    if (difference === 1) return copy('Вчера', 'Кеше');
    return new Intl.DateTimeFormat(state.lang === 'kk' ? 'kk-KZ' : 'ru-RU', { day: 'numeric', month: 'long' }).format(date);
  }

  function activityMeta(item) {
    const date = activityDate(item.timestamp);
    const stateLabel = item.type === 'LESSON_COMPLETED'
      ? copy('завершено', 'аяқталды')
      : item.completedBlocks ? progressText(item.completedBlocks) : copy('начат', 'басталды');
    return date ? date + ' · ' + stateLabel : stateLabel;
  }

  function renderRecent(model) {
    const root = document.getElementById('recent-points');
    if (!model.recent.length) {
      root.innerHTML = '<li class="v7-recent-empty">' + esc(copy('После первого занятия здесь появятся последние действия.', 'Алғашқы сабақтан кейін мұнда соңғы әрекеттер көрінеді.')) + '</li>';
      return;
    }
    root.innerHTML = model.recent.map(function(item) {
      const completed = item.type === 'LESSON_COMPLETED';
      const title = esc(item.title);
      const body = item.route ? '<a href="' + esc(item.route) + '">' + title + '</a>' : '<span>' + title + '</span>';
      return '<li class="v7-recent-item is-' + (completed ? 'completed' : 'active') + '"><span class="v7-recent-marker" aria-hidden="true">' + (completed ? '✓' : '↗') + '</span><div>' + body + '<small>' + esc(activityMeta(item)) + '</small></div></li>';
    }).join('');
  }

  function applyTheme() {
    const theme = ML.getSetting('theme', 'light');
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.body.classList.toggle('dark', dark);
    document.querySelectorAll('[data-theme-choice]').forEach(function(button) {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === (dark ? 'dark' : 'light')));
    });
  }

  function render() {
    applyCopy();
    applyTheme();
    renderTop();
    renderStats();
    const model = DashboardData.getModel(state.lang);
    renderHero(model);
    renderCurrentTopic(model);
    renderRecent(model);
    renderSubjects();
  }

  function renderSafely() {
    try {
      render();
      document.getElementById('dashboard-error').hidden = true;
      document.getElementById('dashboard-loading').hidden = true;
      document.getElementById('dashboard-content').hidden = false;
      return true;
    } catch (error) {
      console.error('[Dashboard] render failed', error);
      document.getElementById('dashboard-loading').hidden = true;
      document.getElementById('dashboard-content').hidden = true;
      document.getElementById('dashboard-error').hidden = false;
      setText('dashboard-error-title', t('error'));
      setText('dashboard-error-text', error && error.message ? error.message : String(error));
      setText('dashboard-retry', t('retry'));
      return false;
    }
  }

  document.querySelectorAll('[data-lang]').forEach(function(button) {
    button.addEventListener('click', function() {
      state.lang = ML.normalizeLang(button.dataset.lang);
      ML.setLang(state.lang);
      renderSafely();
    });
  });
  document.querySelectorAll('[data-theme-choice]').forEach(function(button) {
    button.addEventListener('click', function() {
      ML.setSetting('theme', button.dataset.themeChoice === 'dark' ? 'dark' : 'light');
      renderSafely();
    });
  });
  document.getElementById('dashboard-subject-grid').addEventListener('click', function(event) {
    const button = event.target.closest('[data-dashboard-subject]');
    if (!button) return;
    state.currentSubject = button.dataset.dashboardSubject;
    renderSubjects();
  });
  document.querySelectorAll('[data-app-logout]').forEach(function(button) {
    button.addEventListener('click', function() {
      ML.clearUser();
      window.location.href = 'login.html';
    });
  });
  document.addEventListener('progress:update', renderSafely);
  window.addEventListener('storage', function(event) { if (event.key === 'mathlogic_data') renderSafely(); });
  document.getElementById('dashboard-retry').addEventListener('click', renderSafely);

  try { ML.updateLastVisit(); } catch (error) { console.warn('[Dashboard] last visit was not saved', error); }
  renderSafely();
})();
