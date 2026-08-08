(function() {
  var isDev = window.DEV === true ||
              new URLSearchParams(window.location.search).get('debug') === '1';
  if (!isDev) return;

  var btn = 'display:block;width:100%;padding:8px 12px;margin:4px 0;' +
    'border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;' +
    'color:#0f172a;font-size:13px;font-weight:600;cursor:pointer;' +
    'text-align:left;font-family:system-ui,sans-serif;';

  function init() {
    if (document.getElementById('ml-dev-panel')) return;

    var panel = document.createElement('div');
    panel.id = 'ml-dev-panel';
    panel.innerHTML =
      '<div id="ml-dev-header" style="cursor:pointer;padding:8px 12px;' +
      'background:#4f46e5;color:white;border-radius:8px;font-size:13px;' +
      'font-weight:700;font-family:system-ui,sans-serif;' +
      'display:flex;align-items:center;gap:6px;user-select:none;">' +
      '<span style="font-size:16px">\u2699</span> DEV' +
      '</div>' +
      '<div id="ml-dev-body" style="display:none;padding:8px;' +
      'background:white;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;' +
      'margin-top:2px;">' +
      '<button onclick="Learning.resetLesson(' +
      '(window.__EngineInternal&&window.__EngineInternal.state' +
      '?window.__EngineInternal.state.lessonId:null)' +
      ');location.reload()" style="' + btn + '">' +
      '\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u0443\u0440\u043E\u043A' +
      '</button>' +
      '<button onclick="Learning.resetAll();location.reload()" style="' + btn + '">' +
      '\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u0443\u0440\u043E\u043A\u0438' +
      '</button>' +
      '<button onclick="(function(){' +
      'var id=window.__EngineInternal&&window.__EngineInternal.state' +
      '?window.__EngineInternal.state.lessonId:null;' +
      'if(id){ML.setLessonSession(id,null);location.reload()}' +
      '})()" style="' + btn + '">' +
      '\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0442\u0432\u0435\u0442\u044B' +
      '</button>' +
      '<button onclick="(function(){' +
      'var s=window.__EngineInternal&&window.__EngineInternal.state;' +
      'if(s){s.repeatMode=!s.repeatMode;' +
      'if(typeof LessonEngine!==\'undefined\'&&LessonEngine.render)' +
      'LessonEngine.render()}' +
      '})()" style="' + btn + '">' +
      'Toggle repeat mode' +
      '</button>' +
      '</div>';

    panel.style.cssText = 'position:fixed;bottom:16px;right:16px;' +
      'z-index:9999;width:220px;';

    document.body.appendChild(panel);
    document.getElementById('ml-dev-header').onclick = function() {
      var body = document.getElementById('ml-dev-body');
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
