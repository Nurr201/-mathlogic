/* Unified Lesson page controller — canonical route + Lesson Engine v2. */
(function() {
  'use strict';

  var activeLesson = null;
  var activeConfig = null;
  var completionHandled = false;

  function language() { return ML.getLang(); }
  function text(key) { return I18N.t('lesson.' + key, language()); }
  function localized(record, key) { return I18N.localize(record, key, language()); }

  function mergeLocalized(base, overlay) {
    if (!overlay || typeof overlay !== 'object' || Array.isArray(overlay)) return base;
    Object.keys(overlay).forEach(function(key) {
      if (base[key] && typeof base[key] === 'object' && !Array.isArray(base[key]) && typeof overlay[key] === 'object' && !Array.isArray(overlay[key])) {
        mergeLocalized(base[key], overlay[key]);
      } else {
        base[key] = overlay[key];
      }
    });
    return base;
  }

  function localizeContent(value) {
    if (Array.isArray(value)) return value.map(localizeContent);
    if (!value || typeof value !== 'object') return value;
    var lang = language();
    if ((value.kk !== undefined || value.kz !== undefined || value.ru !== undefined) &&
        Object.keys(value).every(function(key) { return ['kk', 'kz', 'ru'].indexOf(key) > -1; })) {
      var translated = lang === 'kk'
        ? (value.kk !== undefined ? value.kk : value.kz !== undefined ? value.kz : value.ru)
        : (value.ru !== undefined ? value.ru : value.kk !== undefined ? value.kk : value.kz);
      return localizeContent(translated);
    }
    var source = mergeLocalized({}, value);
    var translations = value.translations;
    if (translations && typeof translations === 'object') {
      var overlay = lang === 'kk' ? (translations.kk || translations.kz) : translations.ru;
      if (overlay && typeof overlay === 'object') source = mergeLocalized(source, overlay);
    }
    var result = {};
    Object.keys(source).forEach(function(key) {
      if (key === 'translations') return;
      result[key] = localizeContent(source[key]);
    });
    Object.keys(source).forEach(function(key) {
      if (/((Kk|KK|Kz|KZ|Kazakh|Ru|RU)|_(kk|kz|ru))$/.test(key)) return;
      var selected = I18N.localize(source, key, lang);
      if (selected !== undefined && selected !== null) result[key] = localizeContent(selected);
    });
    return result;
  }

  function setShellCopy() {
    document.documentElement.lang = language();
    var keys = {
      'lesson.back': 'back', 'lesson.route': 'route', 'lesson.progress': 'progress',
      'lesson.remaining': 'remaining', 'lesson.tip': 'tip', 'lesson.tipText': 'tipText'
    };
    Object.keys(keys).forEach(function(attr) {
      document.querySelectorAll('[data-i18n="' + attr + '"]').forEach(function(el) {
        el.textContent = text(keys[attr]);
      });
    });
  }

  function requestedLessonId() {
    var id = new URLSearchParams(window.location.search).get('id');
    if (id) return Learning.resolveLessonId(id);
    var next = Learning.getNextLesson();
    return next ? next.id : 'algebra.exponents.basics';
  }

  function showError(title, message) {
    document.getElementById('lesson-loading').hidden = true;
    document.getElementById('lesson-active').hidden = true;
    document.getElementById('lesson-progress-rail').hidden = true;
    var error = document.getElementById('lesson-error');
    error.hidden = false;
    document.getElementById('lesson-error-title').textContent = title;
    document.getElementById('lesson-error-text').textContent = message;
    error.querySelector('a').textContent = text('dashboard');
  }

  function resolveConfig(meta) {
    if (!meta || !meta.config) return null;
    var source = window[meta.config];
    if (!source) return null;
    var config = localizeContent(JSON.parse(JSON.stringify(source)));
    config.id = meta.id;
    config.title = localized(meta, 'title');
    config.description = localized(meta, 'description');
    config.xp = 0;
    var resultBlock = config.blocks && config.blocks.find(function(block) { return block.type === 'result'; });
    if (resultBlock) {
      resultBlock.xp = 0;
      var nextId = Learning.getNextLessonId(meta.id);
      var next = nextId ? Learning.getRegistryEntry(nextId) : null;
      resultBlock.nextLesson = next
        ? { title: localized(next, 'title'), link: next.route }
        : null;
    }
    return config;
  }

  function stageFor(block) {
    var type = block.type;
    if (['hero', 'goal', 'warmup'].indexOf(type) > -1) return 'start';
    if (['anchor', 'theory'].indexOf(type) > -1) return 'rule';
    if (['mistake', 'sandbox'].indexOf(type) > -1) return 'example';
    if (['quiz', 'input', 'challenge'].indexOf(type) > -1) return 'practice';
    return 'finish';
  }

  function stageLabel(stage) {
    var keys = { start: 'stageStart', rule: 'stageRule', example: 'stageExample', practice: 'stagePractice', finish: 'stageFinish' };
    return text(keys[stage]);
  }

  function stages() {
    var result = [];
    (activeConfig.blocks || []).forEach(function(block, index) {
      var key = stageFor(block);
      var stage = result.find(function(item) { return item.key === key; });
      if (!stage) {
        stage = { key: key, label: stageLabel(key), firstIndex: index, indices: [] };
        result.push(stage);
      }
      stage.indices.push(index);
    });
    return result;
  }

  function renderRoute(state) {
    var route = document.getElementById('lesson-route');
    route.innerHTML = stages().map(function(stage, index) {
      var completed = stage.indices.every(function(i) { return state.completedBlocks.indexOf(i) > -1; });
      var current = stage.indices.indexOf(state.currentIndex) > -1;
      var className = completed ? 'is-completed' : current ? 'is-current' : 'is-future';
      var disabled = stage.firstIndex > state.currentIndex + 1;
      return '<button type="button" class="lesson-route-step ' + className + '" data-index="' + stage.firstIndex + '"' +
        (disabled ? ' disabled' : '') + (current ? ' aria-current="step"' : '') + '>' +
        '<span class="lesson-route-node">' + (completed ? '✓' : current ? '◆' : '◇') + '</span>' +
        '<span class="mono">0' + (index + 1) + '</span><span>' + stage.label + '</span></button>';
    }).join('');
    route.querySelectorAll('button:not([disabled])').forEach(function(button) {
      button.addEventListener('click', function() { LessonEngine.goTo(Number(button.dataset.index)); });
    });
  }

  function renderProgress(state) {
    var total = Math.max(1, state.totalBlocks);
    var done = state.completedBlocks.length;
    var pct = Math.min(100, Math.round(done / total * 100));
    document.getElementById('lesson-progress-value').textContent = pct + '%';
    document.getElementById('lesson-progress-fill').style.width = pct + '%';
    document.getElementById('lesson-progress-copy').textContent = done + ' / ' + total + ' ' + text('steps');
    document.getElementById('lesson-step-meta').textContent = (state.currentIndex + 1) + ' / ' + total + ' ' + text('steps');

    var checklist = document.getElementById('lesson-checklist');
    checklist.innerHTML = stages().map(function(stage) {
      var completed = stage.indices.every(function(index) { return state.completedBlocks.indexOf(index) > -1; });
      var current = stage.indices.indexOf(state.currentIndex) > -1;
      return '<div class="lesson-check ' + (completed ? 'is-completed' : current ? 'is-current' : '') + '">' +
        '<span>' + (completed ? '✓' : current ? '◆' : '◇') + '</span><span>' + stage.label + '</span></div>';
    }).join('');
  }

  function updateEngineUI() {
    var state = LessonEngine.getState();
    renderRoute(state);
    renderProgress(state);
    var mode = '';
    if (state.repeatMode) mode = text('repeat');
    else if (state.completedBlocks.length) mode = text('resume');
    setMode(mode, state.repeatMode);
  }

  function setMode(mode, isRepeat) {
    var element = document.getElementById('lesson-mode');
    element.textContent = mode || '';
    element.hidden = !mode;
    element.classList.toggle('is-repeat', !!isRepeat);
  }

  function completeFromEngine(data) {
    if (completionHandled) return;
    completionHandled = true;
    var state = LessonEngine.getState();
    if (state.repeatMode) {
      LessonEngine.clearProgress();
      setMode(text('repeat'), true);
      return;
    }
    var result = Learning.completeLesson(activeLesson.id, {
      percentage: data.percentage,
      score: data.percentage,
      correctAnswers: data.correctAnswers,
      totalQuestions: data.totalQuestions,
      duration: data.timeSpent,
      startedAt: data.startedAt,
      completedAt: Date.now(),
      attempts: data.attempts,
      answers: data.answers || {},
      xpEarned: 0,
    });
    setMode(text('completed'), false);
  }

  function bindEngine() {
    LessonEngine.on('afterRender', function(data) {
      updateEngineUI();
      if (data.block && data.block.type === 'sandbox') {
        setTimeout(function() { LessonBlocks._updateSandbox(data.blockIndex); }, 0);
      }
    });
    LessonEngine.on('afterComplete', updateEngineUI);
    LessonEngine.analytics.on('onLessonFinish', completeFromEngine);
  }

  function fillHeading(meta) {
    var title = localized(meta, 'title');
    var description = localized(meta, 'description');
    var subjectTitle = I18N.t('subjects.' + meta.subjectId, language()) || meta.subjectId;
    document.title = title + ' — MathLogic';
    document.getElementById('lesson-title').textContent = title;
    document.getElementById('lesson-description').textContent = description;
    document.getElementById('lesson-duration').textContent = meta.duration + ' ' + text('minutes');
    document.getElementById('lesson-length').textContent = activeConfig.blocks.length + ' ' + text('steps');
    document.getElementById('lesson-breadcrumb').textContent = subjectTitle + ' / ' + (language() === 'kk' ? 'Сабақ' : 'Урок');
    document.getElementById('lesson-top-context').textContent = subjectTitle + ' / ' + title;
  }

  function bindTheme() {
    document.getElementById('lesson-theme').addEventListener('click', function() {
      var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      ML.setSetting('theme', next);
      ML.applySettings();
    });
  }

  function init() {
    ML.applySettings();
    ML.updateLastVisit();
    setShellCopy();
    bindTheme();

    var id = requestedLessonId();
    var meta = Learning.getRegistryEntry(id);
    if (!meta) {
      showError(text('notFound'), text('notFoundText'));
      return;
    }
    activeLesson = Learning.getLesson(id);
    if (!activeLesson || !activeLesson.hasContent || activeLesson.status === 'comingSoon' || activeLesson.status === 'locked') {
      showError(text('unavailable'), activeLesson && activeLesson.unlockReason ? activeLesson.unlockReason : text('notFoundText'));
      return;
    }
    activeConfig = resolveConfig(meta);
    if (!activeConfig) {
      showError(text('unavailable'), text('notFoundText'));
      return;
    }
    if (window.LessonValidator) {
      var validation = LessonValidator.validate(activeConfig);
      if (!validation.valid) {
        console.error('[Lesson] invalid config', validation.errors);
        showError(text('unavailable'), validation.errors.join('; '));
        return;
      }
    }

    fillHeading(meta);
    bindEngine();
    document.getElementById('lesson-loading').hidden = true;
    document.getElementById('lesson-active').hidden = false;
    LessonEngine.load(activeConfig, document.getElementById('main-content'));
    updateEngineUI();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
