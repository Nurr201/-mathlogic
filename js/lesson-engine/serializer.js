window.__EngineInternal = window.__EngineInternal || {};
(function(I) {

  I.exportState = function() {
    return JSON.stringify({
      version: I.ENGINE_VERSION,
      exportedAt: Date.now(),
      lessonId: I.state.lessonId,
      currentIndex: I.state.currentIndex,
      score: I.state.score,
      mistakes: I.state.mistakes,
      timeSpent: I.state.timeSpent,
      startedAt: I.state.startedAt,
      completedBlocks: I.state.completedBlocks,
      answers: I.state.answers,
      blockResults: I.state.blockResults,
      finished: I.state.finished,
    });
  };

  I.importState = function(json) {
    try {
      var data = JSON.parse(json);
      if (!data.lessonId || !data.completedBlocks) {
        console.error('[LessonEngine] Invalid state data');
        return false;
      }
      I.state.currentIndex = data.currentIndex || 0;
      I.state.score = data.score || 0;
      I.state.mistakes = data.mistakes || 0;
      I.state.timeSpent = data.timeSpent || 0;
      I.state.elapsedBeforeSession = I.state.timeSpent;
      I.state.startedAt = Number(data.startedAt) || Date.now();
      I.state.completedBlocks = data.completedBlocks || [];
      I.state.answers = data.answers || {};
      I.state.blockResults = data.blockResults || {};
      I.state.finished = data.finished || false;
      I.state.repeatMode = false;
      I.state.startTime = Date.now();
      I.state.blockStartTime = null;
      I.debugLog('State imported, resuming at block:', I.state.currentIndex);
      I.render();
      I.renderDebugPanel();
      return true;
    } catch (e) {
      console.error('[LessonEngine] Import failed:', e);
      return false;
    }
  };

})(window.__EngineInternal);
