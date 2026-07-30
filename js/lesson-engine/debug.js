window.__EngineInternal = window.__EngineInternal || {};
(function(I) {

  var _debug = false;
  var _debugPanel = null;
  var _debugEvents = [];

  I.isDebug = function() {
    return _debug;
  };

  I.debugLog = function() {
    if (!_debug) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[LessonEngine]');
    console.log.apply(console, args);
  };

  I.initDebug = function() {
    if (I.state.lesson && I.state.lesson.debug) {
      _debug = true;
    } else if (typeof window !== 'undefined' && window.location) {
      _debug = window.location.search.indexOf('debug=1') > -1;
    }
    if (_debug) {
      I.debugLog('Debug mode enabled');
      I.debugLog('Engine version:', I.ENGINE_VERSION);
      I.debugLog('Lesson:', I.state.lessonId);
    }
  };

  function _renderEventsList() {
    return _debugEvents.slice(-10).map(function(e) {
      return '<div style="color:#94a3b8;border-bottom:1px solid #334155;padding:2px 0">' +
        '<span style="color:#60a5fa">' + e.time + '</span> ' +
        '<span style="color:#f472b6">' + e.event + '</span></div>';
    }).join('');
  }

  function _renderHeader(block) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<span style="font-weight:bold;color:#38bdf8">LESSON ENGINE v' + I.ENGINE_VERSION + '</span>' +
      '<span style="color:#64748b;font-size:10px">' + (I.state.lessonId || '\u2014') + '</span>' +
      '</div>';
  }

  function _renderStatsGrid(block) {
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;background:#0f172a;padding:6px;border-radius:6px">' +
      '<div>Block: <b style="color:#a78bfa">' + I.state.currentIndex + '/' + I.state.blocks.length + '</b></div>' +
      '<div>Type: <b style="color:#34d399">' + (block ? block.type : '\u2014') + '</b></div>' +
      '<div>Score: <b style="color:#fbbf24">' + I.state.score + '</b></div>' +
      '<div>Mistakes: <b style="color:#f87171">' + I.state.mistakes + '</b></div>' +
      '<div>Time: <b>' + I.state.timeSpent + 's</b></div>' +
      '<div>Finished: <b>' + I.state.finished + '</b></div>' +
      '</div>';
  }

  function _renderBlockJson(block) {
    var json = block ? JSON.stringify(block, null, 1).substring(0, 300) : 'null';
    return '<details style="margin-bottom:8px">' +
      '<summary style="cursor:pointer;color:#94a3b8;font-size:11px">Block JSON</summary>' +
      '<pre style="background:#0f172a;padding:6px;border-radius:4px;margin-top:4px;overflow-x:auto;white-space:pre-wrap;font-size:10px;color:#cbd5e1;max-height:120px;overflow-y:auto">' + json + '</pre>' +
      '</details>';
  }

  function _renderEventsSection(eventsHtml) {
    if (!eventsHtml) return '';
    return '<div style="border-top:1px solid #334155;padding-top:4px">' +
      '<div style="color:#64748b;font-size:10px;margin-bottom:4px">RECENT EVENTS</div>' +
      eventsHtml + '</div>';
  }

  I.renderDebugPanel = function() {
    if (!_debug) return;
    if (!_debugPanel) {
      _debugPanel = document.createElement('div');
      _debugPanel.id = 'lesson-debug-panel';
      _debugPanel.style.cssText = 'position:fixed;bottom:0;right:0;width:380px;max-height:50vh;overflow-y:auto;background:#1e293b;color:#e2e8f0;font-family:monospace;font-size:12px;z-index:99999;border-top-left-radius:12px;box-shadow:0 -4px 24px rgba(0,0,0,0.3);padding:12px;';
      document.body.appendChild(_debugPanel);
    }
    I.updateDebugPanel();
  };

  I.updateDebugPanel = function() {
    if (!_debug || !_debugPanel) return;
    var block = I.getCurrentBlock();
    var eventsHtml = _renderEventsList();
    _debugPanel.innerHTML =
      _renderHeader(block) +
      _renderStatsGrid(block) +
      _renderBlockJson(block) +
      _renderEventsSection(eventsHtml);
  };

  I.debugEvent = function(eventName, detail) {
    if (!_debug) return;
    var t = new Date();
    var ts = t.getHours().toString().padStart(2, '0') + ':' +
      t.getMinutes().toString().padStart(2, '0') + ':' +
      t.getSeconds().toString().padStart(2, '0');
    _debugEvents.push({ time: ts, event: eventName, detail: detail });
    I.updateDebugPanel();
  };

})(window.__EngineInternal);
