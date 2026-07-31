window.__EngineInternal = window.__EngineInternal || {};
(function(I) {

  I.ENGINE_VERSION = '2.2.0';
  I.MIN_SCHEMA_VERSION = '1.0.0';

  I.state = {
    lessonId: null,
    lesson: null,
    currentIndex: 0,
    blocks: [],
    answers: {},
    score: 0,
    mistakes: 0,
    timeSpent: 0,
    completedBlocks: [],
    repeatMode: false,
    startedAt: null,
    startTime: null,
    elapsedBeforeSession: 0,
    blockStartTime: null,
    blockResults: {},
    container: null,
    finished: false,
  };

  I.getBlock = function(index) {
    return I.state.blocks[index] || null;
  };

  I.getCurrentBlock = function() {
    return I.getBlock(I.state.currentIndex);
  };

  I.hasNext = function() {
    return I.state.currentIndex < I.state.blocks.length - 1;
  };

  I.hasPrev = function() {
    return I.state.currentIndex > 0;
  };

  I.blockDuration = function() {
    if (!I.state.blockStartTime) return 0;
    return Math.round((Date.now() - I.state.blockStartTime) / 1000);
  };

  I.updateTime = function() {
    if (I.state.startTime) {
      I.state.timeSpent = I.state.elapsedBeforeSession + Math.round((Date.now() - I.state.startTime) / 1000);
    }
  };

  I.getAssessmentSummary = function() {
    var correct = 0;
    var total = 0;
    var attempts = 0;
    Object.keys(I.state.blockResults || {}).forEach(function(key) {
      var result = I.state.blockResults[key];
      if (!result || result.correct === undefined) return;
      var resultTotal = Number(result.totalQuestions) || 1;
      var resultCorrect = result.correctAnswers !== undefined
        ? Number(result.correctAnswers) || 0
        : (result.correct ? resultTotal : 0);
      total += resultTotal;
      correct += resultCorrect;
      attempts += Number(result.attempts) || resultTotal;
    });
    var percentage = total > 0 ? Math.round(correct / total * 100) : 0;
    return { correctAnswers: correct, totalQuestions: total, attempts: attempts, percentage: percentage };
  };

  I.getState = function() {
    var assessment = I.getAssessmentSummary();
    return {
      lessonId: I.state.lessonId,
      currentIndex: I.state.currentIndex,
      totalBlocks: I.state.blocks.length,
      currentBlock: I.getCurrentBlock(),
      score: I.state.score,
      mistakes: I.state.mistakes,
      timeSpent: I.state.timeSpent,
      completedBlocks: I.state.completedBlocks,
      repeatMode: I.state.repeatMode,
      finished: I.state.finished,
      startedAt: I.state.startedAt,
      correctAnswers: assessment.correctAnswers,
      totalQuestions: assessment.totalQuestions,
      percentage: assessment.percentage,
      attempts: assessment.attempts,
      hasNext: I.hasNext(),
      hasPrev: I.hasPrev(),
    };
  };

})(window.__EngineInternal);
