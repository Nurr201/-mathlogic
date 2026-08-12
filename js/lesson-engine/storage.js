window.__EngineInternal = window.__EngineInternal || {};
(function(I) {

  I.loadProgress = function() {
    if (!I.state.lessonId) return null;
    var saved = ML.getLessonSession(I.state.lessonId);
    if (saved && saved.completedBlocks) {
      I.state.completedBlocks = saved.completedBlocks || [];
      I.state.score = saved.score || 0;
      I.state.mistakes = saved.mistakes || 0;
      I.state.answers = saved.answers || {};
      I.state.blockResults = saved.blockResults || {};
      I.state.interactionStates = saved.interactionStates || {};
      I.state.completedSnapshot = saved.completedSnapshot === true;
      I.state.currentIndex = Math.max(0, Number(saved.currentIndex) || 0);
      I.state.timeSpent = Math.max(0, Number(saved.timeSpent) || 0);
      I.state.elapsedBeforeSession = I.state.timeSpent;
      I.state.startedAt = Number(saved.startedAt) || Date.now();
      I.state.finished = saved.finished === true;
      return true;
    }
    return false;
  };

  I.saveProgress = function() {
    if (!I.state.lessonId) return;
    I.updateTime();
    var session = {
      completedBlocks: I.state.completedBlocks,
      currentIndex: I.state.currentIndex,
      score: I.state.score,
      mistakes: I.state.mistakes,
      answers: I.state.answers,
      blockResults: I.state.blockResults,
      interactionStates: I.state.interactionStates,
      completedSnapshot: I.state.completedSnapshot === true,
      timeSpent: I.state.timeSpent,
      startedAt: I.state.startedAt,
      finished: I.state.finished,
      updatedAt: Date.now(),
    };
    ML.setLessonSession(I.state.lessonId, session);
  };

  I.clearProgressInternal = function() {
    if (!I.state.lessonId) return;
    ML.setLessonSession(I.state.lessonId, null);
  };

  I.getInteractionState = function(index) {
    var key = index !== undefined ? index : I.state.currentIndex;
    return I.state.interactionStates[key] || null;
  };

  I.setInteractionState = function(index, value) {
    var key = index !== undefined ? index : I.state.currentIndex;
    if (value === null || value === undefined) delete I.state.interactionStates[key];
    else I.state.interactionStates[key] = value;
    I.saveProgress();
    return I.state.interactionStates[key] || null;
  };

})(window.__EngineInternal);
