window.__EngineInternal = window.__EngineInternal || {};
(function(I) {

  I.ENGINE_VERSION = '2.1.0';
  I.MIN_SCHEMA_VERSION = '1.0.0';
  I.STORAGE_PREFIX = 'lesson.v2.';

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
    startTime: null,
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
      I.state.timeSpent = Math.round((Date.now() - I.state.startTime) / 1000);
    }
  };

  I.getState = function() {
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
      hasNext: I.hasNext(),
      hasPrev: I.hasPrev(),
    };
  };

})(window.__EngineInternal);
