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
  function copy(ru, kk) { return state.lang === 'kk' ? kk : ru; }
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

  function registryLessons(subjectKey) {
    const registry = Learning.getRegistry();
    return Object.keys(registry).sort(function(a, b) {
      return (registry[a].order || 0) - (registry[b].order || 0);
    }).map(function(id) {
      return Learning.getLesson(id);
    }).filter(function(lesson) {
      return lesson && (!subjectKey || lesson.subjectKey === subjectKey);
    });
  }

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

  function availableLabel(count) {
    if (state.lang === 'kk') return count + ' қолжетімді сабақ';
    const mod10 = count % 10;
    const mod100 = count % 100;
    const noun = mod10 === 1 && mod100 !== 11 ? 'доступный урок'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'доступных урока'
      : 'доступных уроков';
    return count + ' ' + noun;
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
    const lessons = Object.keys(Learning.getRegistry()).map(function(id) { return Learning.getLesson(id); }).filter(Boolean);
    const available = lessons.filter(function(lesson) { return lesson.status === 'available' || lesson.status === 'current'; }).length;
    const name = user.name || user.username || '';
    setText('dashboard-greeting', t('greeting') + (name ? ', ' + name.split(' ')[0] : ''));
    const date = formatToday();
    setText('dashboard-context', date.charAt(0).toUpperCase() + date.slice(1) + ' · ' + availableLabel(available));
    setText('dashboard-avatar', (name || t('profile')).charAt(0).toUpperCase());
  }

  function renderHero() {
    const next = Learning.getNextLesson();
    const last = Learning.getLastCompletedLesson();
    const hero = document.getElementById('dashboard-hero');
    const empty = document.getElementById('dashboard-empty');
    const quickReview = document.getElementById('quick-review');
    quickReview.hidden = !last;
    if (last) {
      quickReview.href = last.route;
      setText('quick-review-title', lessonTitle(last));
    }
    if (!next) {
      hero.hidden = true;
      empty.hidden = false;
      if (last) {
        empty.innerHTML = '<h2>' + esc(t('allDone')) + '</h2><p>' + esc(t('allDoneText')) + '</p><a class="axis-button axis-button-ink" href="' + esc(last.route) + '">' + esc(t('repeatPrevious')) + ' →</a>';
      } else {
        empty.innerHTML = '<h2>' + esc(copy('Следующий урок пока не определён', 'Келесі сабақ әзірге анықталған жоқ')) + '</h2><p>' + esc(copy('Откройте программу и выберите доступную тему.', 'Бағдарламаны ашып, қолжетімді тақырыпты таңдаңыз.')) + '</p><a class="v7-button ghost" href="program.html">' + esc(copy('Открыть программу', 'Бағдарламаны ашу')) + '</a>';
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
    setText('hero-status', statusText(next.status));
    const completedBlocks = next.session && Array.isArray(next.session.completedBlocks) ? next.session.completedBlocks.length : 0;
    setText('hero-steps', completedBlocks ? completedBlocks + ' ' + t('saved') : t('interactive'));
    const primary = document.getElementById('hero-primary');
    primary.href = next.route;
    primary.querySelector('[data-copy]').dataset.copy = next.status === 'current' ? 'continue' : 'start';
    primary.querySelector('[data-copy]').textContent = next.status === 'current' ? t('continue') : t('start');
    const real = registryLessons();
    const done = real.filter(function(item) { return item.status === 'completed'; }).length;
    document.getElementById('hero-axis-fill').style.width = (real.length > 1 ? pct(done / (real.length - 1) * 100) : pct(done * 100)) + '%';
    document.getElementById('hero-axis-nodes').innerHTML = real.map(function(item, index) {
      const className = item.status === 'completed' ? 'done' : item.id === next.id ? 'active' : '';
      return '<span class="hero-axis-node ' + className + '" title="' + esc(lessonTitle(item)) + '"><i>' + (item.status === 'completed' ? '✓' : index + 1) + '</i></span>';
    }).join('');
    setText('hero-axis-caption', done + ' / ' + real.length + ' ' + t('passed'));
  }

  function statusText(status) { return t(status) || status; }

  function currentPathStatus(lesson, focusId) {
    if (lesson.status === 'completed') return t('completed');
    if (lesson.id === focusId && lesson.status === 'current') return t('current');
    if (lesson.id === focusId) return copy('Следующий', 'Келесі');
    return statusText(lesson.status);
  }

  function renderCurrentPath() {
    const next = Learning.getNextLesson();
    const last = Learning.getLastCompletedLesson();
    const focus = next || last;
    if (focus && focus.subjectKey) state.currentSubject = focus.subjectKey;

    const subject = Learning.getSubject(state.currentSubject);
    const lessons = registryLessons(state.currentSubject);
    const focusId = focus ? focus.id : '';
    let anchor = lessons.findIndex(function(lesson) { return lesson.id === focusId; });
    if (anchor < 0) anchor = 0;
    const limit = 5;
    const start = Math.max(0, Math.min(anchor - 2, Math.max(0, lessons.length - limit)));
    const points = lessons.slice(start, start + limit);

    setText('current-path-title', copy('Ближайшие шаги', 'Жақын қадамдар'));
    setText('current-path-context', subject ? subjectName(subject) : copy('Текущий предмет', 'Ағымдағы пән'));
    const pathLink = document.getElementById('current-path-link');
    pathLink.href = 'program.html?subject=' + encodeURIComponent(state.currentSubject);

    const root = document.getElementById('current-path-points');
    if (!points.length) {
      root.innerHTML = '<li class="v7-current-path-empty">' + esc(copy('В этом направлении пока нет опубликованных уроков.', 'Бұл бағытта әзірге жарияланған сабақ жоқ.')) + '</li>';
      return;
    }
    root.innerHTML = points.map(function(lesson) {
      const isFocus = lesson.id === focusId && lesson.status !== 'completed';
      const className = lesson.status === 'completed' ? ' is-completed' : isFocus ? ' is-current' : ' is-next';
      const marker = lesson.status === 'completed' ? '✓' : isFocus ? '●' : '○';
      return '<li class="v7-current-path-item' + className + '"><span class="v7-current-path-node" aria-hidden="true">' + marker + '</span><strong>' + esc(lessonTitle(lesson)) + '</strong><small>' + esc(currentPathStatus(lesson, focusId)) + '</small></li>';
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
    renderHero();
    renderCurrentPath();
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
  document.addEventListener('progress:update', renderSafely);
  window.addEventListener('storage', function(event) { if (event.key === 'mathlogic_data') renderSafely(); });
  document.getElementById('dashboard-retry').addEventListener('click', renderSafely);

  try { ML.updateLastVisit(); } catch (error) { console.warn('[Dashboard] last visit was not saved', error); }
  renderSafely();
})();
