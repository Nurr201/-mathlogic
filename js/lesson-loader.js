/* Loads only the config and block primitives required by the requested lesson. */
(function() {
  'use strict';

  var manifest = window.MATHLOGIC_LESSON_ASSETS || { lessons: {} };
  var baseRuntime = [
    'js/lesson-engine/state.js',
    'js/lesson-engine/hooks.js',
    'js/lesson-engine/storage.js',
    'js/lesson-engine/serializer.js',
    'js/lesson-engine/core.js',
    'js/lesson-engine.js',
    'js/lesson-blocks/helpers.js',
    'js/lesson-blocks/registry.js',
    'js/lesson-blocks/renderers.js',
    'js/lesson-blocks.js',
  ];
  var loaded = {};

  function requestedLessonId() {
    var id = new URLSearchParams(window.location.search).get('id');
    if (id) return Learning.resolveLessonId(id);
    var next = Learning.getNextLesson();
    return next ? next.id : 'algebra.exponents.basics';
  }

  function debugEnabled() {
    return window.DEV === true || new URLSearchParams(window.location.search).get('debug') === '1';
  }

  function loadScript(src) {
    if (!src) return Promise.resolve();
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = function() { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(script);
    });
    return loaded[src];
  }

  function loadOrderedBatch(scripts) {
    /* Dynamic classic scripts with async=false execute in insertion order while
       their downloads may proceed together. This avoids a request waterfall. */
    return Promise.all((scripts || []).map(loadScript));
  }

  function planFor(id) {
    var entry = manifest.lessons[id] || null;
    if (!entry) return { id: id, entry: null, scripts: ['js/lesson.js'] };
    var runtime = baseRuntime.slice();
    if (debugEnabled()) runtime.splice(3, 0, 'js/lesson-engine/debug.js');
    var parallelAssets = [];
    if (entry.mathLive) parallelAssets.push('vendor/mathlive/mathlive.min.js');
    if (entry.configScript) parallelAssets.push(entry.configScript);
    var scripts = runtime.concat([manifest.schemaScript])
      .concat(entry.primitiveScripts || [])
      .concat(parallelAssets);
    scripts.push('js/lesson.js');
    if (debugEnabled()) scripts.push('js/dev.js');
    return { id: id, entry: entry, runtime: runtime, parallelAssets: parallelAssets, scripts: scripts };
  }

  function showBootError(error) {
    console.error('[LessonLoader]', error);
    var loading = document.getElementById('lesson-loading');
    var active = document.getElementById('lesson-active');
    var progress = document.getElementById('lesson-progress-rail');
    var panel = document.getElementById('lesson-error');
    if (loading) loading.hidden = true;
    if (active) active.hidden = true;
    if (progress) progress.hidden = true;
    if (panel) panel.hidden = false;
    var title = document.getElementById('lesson-error-title');
    var message = document.getElementById('lesson-error-text');
    if (title) title.textContent = ML.getLang() === 'kk' ? 'Сабақты жүктеу мүмкін болмады' : 'Не удалось загрузить урок';
    if (message) message.textContent = ML.getLang() === 'kk' ? 'Бетті жаңартып көріңіз.' : 'Обновите страницу и попробуйте снова.';
  }

  function boot() {
    var id = requestedLessonId();
    var plan = planFor(id);
    /* Unknown and unavailable routes need only the controller's safe error UI. */
    var lesson = Learning.getLesson(id);
    if (!plan.entry || !lesson || !lesson.hasContent || lesson.status === 'comingSoon' || lesson.status === 'locked') {
      return loadScript('js/lesson.js').catch(showBootError);
    }
    return loadOrderedBatch(plan.runtime.concat([manifest.schemaScript]))
      .then(function() { return loadOrderedBatch(plan.entry.primitiveScripts || []); })
      .then(function() { return Promise.all(plan.parallelAssets.map(loadScript)); })
      .then(function() { return loadScript('js/lesson.js'); })
      .then(function() { return debugEnabled() ? loadScript('js/dev.js') : null; })
      .catch(showBootError);
  }

  window.MathLogicLessonLoader = {
    requestedLessonId: requestedLessonId,
    planFor: planFor,
    boot: boot,
  };

  boot();
})();
