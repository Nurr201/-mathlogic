window.LessonEngine = (function() {
  var I = window.__EngineInternal;

  return {
    load: I.load,
    next: I.next,
    finish: I.finish,
    prev: I.prev,
    goTo: I.goTo,
    render: I.render,
    on: I.on,
    off: I.off,
    analytics: {
      on: I.analyticsOn,
      off: I.analyticsOff,
    },
    exportState: I.exportState,
    importState: I.importState,
    version: I.ENGINE_VERSION,

    getState: I.getState,

    getBlockResult: function(index) {
      return I.state.blockResults[index !== undefined ? index : I.state.currentIndex] || null;
    },

    clearProgress: function() {
      I.clearProgressInternal();
    },
  };

})();
