window.__EngineInternal = window.__EngineInternal || {};
(function(I) {

  I.LIFECYCLE_HOOKS = {
    beforeRender: [],
    afterRender: [],
    beforeComplete: [],
    afterComplete: [],
    beforeLesson: [],
    afterLesson: [],
    beforeFinish: [],
    afterFinish: [],
  };

  I.ANALYTIC_EVENTS = {
    onBlockStart: [],
    onBlockFinish: [],
    onLessonFinish: [],
    onAnswer: [],
  };

  function _addListener(registry, key, callback) {
    if (!registry[key]) registry[key] = [];
    registry[key].push(callback);
    return function() {
      var idx = registry[key].indexOf(callback);
      if (idx > -1) registry[key].splice(idx, 1);
    };
  }

  function _removeListener(registry, key, callback) {
    if (!registry[key]) return;
    var idx = registry[key].indexOf(callback);
    if (idx > -1) registry[key].splice(idx, 1);
  }

  function _fireListeners(registry, key, data) {
    var list = registry[key];
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      try { list[i](data); } catch (e) {
        console.error('[LessonEngine] Listener error (' + key + '):', e);
      }
    }
  }

  I.on = function(hook, callback) {
    return _addListener(I.LIFECYCLE_HOOKS, hook, callback);
  };

  I.off = function(hook, callback) {
    _removeListener(I.LIFECYCLE_HOOKS, hook, callback);
  };

  I.trigger = function(hook, data) {
    _fireListeners(I.LIFECYCLE_HOOKS, hook, data);
  };

  I.analyticsOn = function(event, callback) {
    return _addListener(I.ANALYTIC_EVENTS, event, callback);
  };

  I.analyticsOff = function(event, callback) {
    _removeListener(I.ANALYTIC_EVENTS, event, callback);
  };

  I.triggerAnalytics = function(event, data) {
    _fireListeners(I.ANALYTIC_EVENTS, event, data);
  };

})(window.__EngineInternal);
