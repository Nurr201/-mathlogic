/* ============================================
   AXIS DASHBOARD — только реальные данные ML
   ============================================ */

(function() {
  'use strict';

  const state = {
    lang: ML.getLang(),
    currentSubject: 'algebra'
  };

  function t(key) { return I18N.t('dashboard.' + key, state.lang); }
  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pct(value) { return Math.max(0, Math.min(100, Number(value) || 0)); }
  function subjectName(subject) { return I18N.t('subjects.' + subject.key, state.lang) || subject.name; }
  function localized(record, key) { return I18N.localize(record, key, state.lang); }
  function lessonTitle(lesson) { return localized(lesson, 'title'); }
  function lessonDescription(lesson) { return localized(lesson, 'description'); }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function applyCopy() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-copy]').forEach(function(node) {
      node.textContent = t(node.dataset.copy);
    });
    document.querySelectorAll('[data-lang]').forEach(function(button) {
      button.setAttribute('aria-pressed', String(button.dataset.lang === state.lang));
    });
  }

  function renderTop() {
    const user = ML.getUser() || {};
    const xp = XP.getLevelProgress();
    const subjects = Learning.getSubjects();
    const available = Object.keys(Learning.getRegistry()).map(function(id) { return Learning.getLesson(id); })
      .filter(function(lesson) { return lesson && (lesson.status === 'available' || lesson.status === 'current'); }).length;
    const name = user.name || user.username || '';
    setText('dashboard-greeting', t('greeting') + (name ? ', ' + name.split(' ')[0] : ''));
    const date = new Intl.DateTimeFormat(state.lang === 'ru' ? 'ru-RU' : 'kk-KZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    setText('dashboard-context', date.charAt(0).toUpperCase() + date.slice(1) + ' · ' + available + ' ' + t('availableCount'));
    setText('top-xp', xp.xp);
    setText('top-streak', user.streak || 0);
    setText('rail-streak', user.streak || 0);
    setText('dashboard-avatar', (name || t('profile')).charAt(0).toUpperCase());

    setText('stat-level', xp.level);
    setText('stat-level-copy', xp.remaining + ' XP ' + t('remaining'));
    document.getElementById('stat-level-fill').style.width = pct(xp.progress) + '%';
    setText('stat-xp', xp.xp);
    setText('stat-xp-copy', xp.levelXp + ' / ' + xp.levelSpan + ' XP');
    document.getElementById('stat-xp-fill').style.width = pct(xp.progress) + '%';
    setText('stat-streak', user.streak || 0);
    document.getElementById('stat-streak-fill').style.width = pct((user.streak || 0) / 7 * 100) + '%';
    const overall = Learning.getOverallProgress();
    const completed = subjects.reduce(function(sum, item) { return sum + item.completedLessons; }, 0);
    const total = subjects.reduce(function(sum, item) { return sum + item.totalLessons; }, 0);
    setText('stat-course', overall + '%');
    setText('stat-course-copy', completed + ' / ' + total + ' ' + t('lessons'));
    document.getElementById('stat-course-fill').style.width = pct(overall) + '%';
  }

  function renderSubjects() {
    const subjects = Learning.getSubjects();
    const rail = document.getElementById('rail-subjects');
    const strip = document.getElementById('subject-strip');
    rail.innerHTML = subjects.map(function(subject) {
      return '<button type="button" class="rail-subject' + (state.currentSubject === subject.key ? ' active' : '') + '" data-subject="' + esc(subject.key) + '" style="--subject-color:' + esc(subject.mainColor) + '">' +
        '<span class="rail-subject-icon" aria-hidden="true">' + subject.icon + '</span><span>' + esc(subjectName(subject)) + '</span><b class="mono">' + subject.progress + '%</b></button>';
    }).join('');
    strip.innerHTML = subjects.map(function(subject) {
      return '<button type="button" class="subject-segment' + (state.currentSubject === subject.key ? ' active' : '') + '" data-subject="' + esc(subject.key) + '" style="--subject-color:' + esc(subject.mainColor) + '">' +
        '<span class="subject-segment-icon" aria-hidden="true">' + subject.icon + '</span><span><strong>' + esc(subjectName(subject)) + '</strong><small>' + subject.completedLessons + '/' + subject.totalLessons + ' ' + t('passed') + '</small></span><b class="mono">' + subject.progress + '%</b></button>';
    }).join('');
    document.querySelectorAll('[data-subject]').forEach(function(button) {
      button.addEventListener('click', function() {
        state.currentSubject = button.dataset.subject;
        renderSubjects();
        renderRoute();
      });
    });
  }

  function renderHero() {
    const next = Learning.getNextLesson();
    const last = Learning.getLastCompletedLesson();
    const hero = document.getElementById('dashboard-hero');
    const empty = document.getElementById('dashboard-empty');
    if (!next) {
      hero.hidden = true;
      empty.hidden = false;
      if (last) {
        empty.innerHTML = '<h2>' + esc(t('allDone')) + '</h2><p>' + esc(t('allDoneText')) + '</p><a class="axis-button axis-button-ink" href="' + esc(last.route) + '">' + esc(t('repeatPrevious')) + ' →</a>';
      }
      return;
    }
    hero.hidden = false;
    empty.hidden = true;
    const subject = Learning.getSubject(next.subjectKey);
    setText('hero-path', (subject ? ' · ' + subjectName(subject) : '') + (localized(next, 'sectionTitle') ? ' / ' + localized(next, 'sectionTitle') : ''));
    setText('hero-title', lessonTitle(next));
    setText('hero-description', lessonDescription(next));
    setText('hero-duration', next.duration ? next.duration + ' ' + t('minutes') : t('interactive'));
    setText('hero-reward', '+' + (next.xp || 0) + ' XP');
    const completedBlocks = next.session && Array.isArray(next.session.completedBlocks) ? next.session.completedBlocks.length : 0;
    setText('hero-steps', completedBlocks ? completedBlocks + ' ' + t('saved') : t('interactive'));
    const primary = document.getElementById('hero-primary');
    primary.href = next.route;
    primary.querySelector('[data-copy]').dataset.copy = next.status === 'current' ? 'continue' : 'start';
    primary.querySelector('[data-copy]').textContent = next.status === 'current' ? t('continue') : t('start');
    const secondary = document.getElementById('hero-secondary');
    secondary.hidden = !last || last.id === next.id;
    if (!secondary.hidden) secondary.href = last.route;

    const registry = Learning.getRegistry();
    const real = Object.keys(registry).sort(function(a, b) { return (registry[a].order || 0) - (registry[b].order || 0); })
      .map(function(id) { return Learning.getLesson(id); }).filter(Boolean);
    const done = real.filter(function(item) { return item.status === 'completed'; }).length;
    document.getElementById('hero-axis-fill').style.width = (real.length > 1 ? pct(done / (real.length - 1) * 100) : pct(done * 100)) + '%';
    document.getElementById('hero-axis-nodes').innerHTML = real.map(function(item, index) {
      const className = item.status === 'completed' ? 'done' : item.id === next.id ? 'active' : '';
      return '<span class="hero-axis-node ' + className + '" title="' + esc(lessonTitle(item)) + '"><i>' + (item.status === 'completed' ? '✓' : index + 1) + '</i></span>';
    }).join('');
    setText('hero-axis-caption', done + ' / ' + real.length + ' ' + t('passed'));
  }

  function statusText(status) { return t(status) || status; }
  function lessonMeta(lesson) {
    if (lesson.status === 'completed') return (lesson.result && lesson.result.percentage !== undefined ? lesson.result.percentage + '%' : t('completed'));
    if (lesson.status === 'current') {
      const count = lesson.session && Array.isArray(lesson.session.completedBlocks) ? lesson.session.completedBlocks.length : 0;
      return count ? count + ' ' + t('saved') : t('current');
    }
    if (lesson.status === 'comingSoon' && lesson.releaseDate) {
      return new Intl.DateTimeFormat(state.lang === 'ru' ? 'ru-RU' : 'kk-KZ', { day: 'numeric', month: 'short' }).format(new Date(lesson.releaseDate));
    }
    if (lesson.status === 'locked') return localized(lesson, 'unlockReason') || t('noContent');
    return lesson.duration ? lesson.duration + ' ' + t('minutes') + ' · +' + lesson.xp + ' XP' : statusText(lesson.status);
  }

  function renderRoute() {
    const topics = Learning.getTopics(state.currentSubject);
    const subject = Learning.getSubject(state.currentSubject);
    setText('route-title', t('route') + (subject ? ' · ' + subjectName(subject) : ''));
    const total = topics.reduce(function(sum, topic) { return sum + topic.totalLessons; }, 0);
    const completed = topics.reduce(function(sum, topic) { return sum + topic.completedLessons; }, 0);
    setText('route-count', completed + ' / ' + total + ' ' + t('passed'));
    document.getElementById('route-modules').innerHTML = topics.map(function(topic, index) {
      const rows = topic.lessons.map(function(lesson) {
        const canOpen = lesson.status === 'available' || lesson.status === 'current' || lesson.status === 'completed';
        const action = lesson.status === 'completed' ? t('repeat') : lesson.status === 'current' ? t('continue') : t('open');
        const icon = lesson.status === 'completed' ? '✓' : lesson.status === 'current' ? '◆' : lesson.status === 'available' ? '○' : lesson.status === 'comingSoon' ? '◌' : '—';
        const description = lessonDescription(lesson);
        return '<li class="route-lesson status-' + esc(lesson.status) + '">' +
          '<span class="route-node mono" aria-hidden="true">' + icon + '</span><div class="route-lesson-copy"><strong>' + esc(lessonTitle(lesson)) + '</strong><span class="route-lesson-description">' + esc(description) + '</span><small class="route-lesson-meta">' + esc(lessonMeta(lesson)) + '</small></div>' +
          '<span class="route-status mono">' + esc(statusText(lesson.status)) + '</span>' +
          (canOpen ? '<a class="route-action" href="' + esc(lesson.route) + '" aria-label="' + esc(action + ': ' + lessonTitle(lesson)) + '">' + esc(action) + ' →</a>' : '<span class="route-action disabled" aria-hidden="true">—</span>') + '</li>';
      }).join('');
      return '<article class="route-module"><header><span class="route-module-number mono">' + String(index + 1).padStart(2, '0') + '</span><div><span class="axis-eyebrow">' + esc(localized(topic, 'level') || '') + '</span><h3>' + esc(localized(topic, 'title')) + '</h3></div><b class="mono">' + topic.progress + '%</b></header><ol>' + rows + '</ol></article>';
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
    renderSubjects();
    renderHero();
    renderRoute();
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
  document.addEventListener('xp:update', renderSafely);
  document.addEventListener('progress:update', renderSafely);
  window.addEventListener('storage', function(event) { if (event.key === 'mathlogic_data') renderSafely(); });
  document.getElementById('dashboard-retry').addEventListener('click', renderSafely);

  try { ML.updateLastVisit(); } catch (error) { console.warn('[Dashboard] last visit was not saved', error); }
  renderSafely();
})();
