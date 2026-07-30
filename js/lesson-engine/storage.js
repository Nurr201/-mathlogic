window.__EngineInternal = window.__EngineInternal || {};
(function(I) {

  function _storageKey() {
    return I.STORAGE_PREFIX + I.state.lessonId;
  }

  I.loadProgress = function() {
    if (!I.state.lessonId) return null;
    var saved = ML.get(_storageKey(), null);
    if (saved && saved.completedBlocks) {
      I.state.completedBlocks = saved.completedBlocks || [];
      I.state.score = saved.score || 0;
      I.state.mistakes = saved.mistakes || 0;
      I.state.answers = saved.answers || {};
      I.state.blockResults = saved.blockResults || {};
      return true;
    }
    return false;
  };

  I.saveProgress = function() {
    if (!I.state.lessonId) return;
    ML.set(_storageKey(), {
      completedBlocks: I.state.completedBlocks,
      score: I.state.score,
      mistakes: I.state.mistakes,
      answers: I.state.answers,
      blockResults: I.state.blockResults,
      updatedAt: Date.now(),
    });
  };

  I.clearProgressInternal = function() {
    if (!I.state.lessonId) return;
    ML.set(_storageKey(), null);
  };

})(window.__EngineInternal);
