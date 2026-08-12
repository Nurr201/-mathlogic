window.__EngineInternal = window.__EngineInternal || {};
(function(I) {

  var ENGINE_EVENTS = {
    BLOCK_START: 'lesson:blockStart',
    BLOCK_COMPLETE: 'lesson:blockComplete',
    LESSON_FINISHED: 'lesson:finished',
  };

  var DEFAULT_POINTS = 10;
  var JSON_TRUNCATE_LENGTH = 300;

  /* ------------------------------------------
     SCHEMA VERSION CHECK
     ------------------------------------------ */

  I.checkSchemaVersion = function(config) {
    var sv = config.schemaVersion || '1.0.0';
    var minParts = I.MIN_SCHEMA_VERSION.split('.').map(Number);
    var svParts = sv.split('.').map(Number);
    for (var i = 0; i < 3; i++) {
      if ((svParts[i] || 0) > (minParts[i] || 0)) return true;
      if ((svParts[i] || 0) < (minParts[i] || 0)) return false;
    }
    return true;
  };

  /* ------------------------------------------
     ERROR BLOCK RENDERER
     ------------------------------------------ */

  I.renderErrorBlock = function(error) {
    var errorMsg = error ? (error.message || String(error)) : '';
    return '<div class="max-w-3xl mx-auto p-8 sm:p-14 animate-fade">' +
      '<div class="bg-rose-50 border-2 border-rose-200 rounded-2xl p-8 text-center">' +
      '<div class="text-5xl mb-4">\u26A0\uFE0F</div>' +
      '<h2 class="text-2xl font-extrabold text-rose-800 mb-2">\u041E\u0448\u0438\u0431\u043A\u0430 \u0431\u043B\u043E\u043A\u0430</h2>' +
      '<p class="text-rose-600 font-medium mb-4">\u041F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u044D\u0442\u043E\u0433\u043E \u0431\u043B\u043E\u043A\u0430.</p>' +
      (errorMsg ? '<pre class="text-xs text-rose-500 bg-rose-100/50 p-3 rounded-xl max-w-md mx-auto overflow-x-auto font-mono">' + errorMsg + '</pre>' : '') +
      '<div class="mt-8">' +
      '<button onclick="LessonEngine.next()" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 px-10 rounded-2xl transition-all shadow-md">\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0431\u043B\u043E\u043A</button>' +
      '</div></div></div>';
  };

  /* ------------------------------------------
     EVENT EMITTER
     ------------------------------------------ */

  I.emit = function(eventName, detail) {
    detail = detail || {};
    detail.lessonId = I.state.lessonId;
    try {
      if (typeof EVENTS !== 'undefined' && EVENTS.emit) {
        EVENTS.emit(eventName, detail);
      } else {
        document.dispatchEvent(new CustomEvent(eventName, {
          bubbles: true,
          detail: detail,
        }));
      }
    } catch (e) { /* silent */ }
    I.debugEvent(eventName, detail);
  };

  /* ------------------------------------------
     CONTEXT BUILDER
     ------------------------------------------ */

  function _buildContext(block) {
    var isRepeat = I.state.repeatMode;
    var assessment = I.getAssessmentSummary();
    return {
      index: I.state.currentIndex,
      total: I.state.blocks.length,
      answers: I.state.answers,
      score: I.state.score,
      mistakes: I.state.mistakes,
      repeatMode: isRepeat,
      savedResult: I.state.blockResults[I.state.currentIndex] || null,
      interactionState: I.getInteractionState ? I.getInteractionState(I.state.currentIndex) : null,
      duration: I.blockDuration(),
      timeSpent: I.state.timeSpent,
      correctAnswers: assessment.correctAnswers,
      totalQuestions: assessment.totalQuestions,
      percentage: assessment.percentage,
      attempts: assessment.attempts,
      evidence: I.getLearningEvidenceSummary ? I.getLearningEvidenceSummary() : {},
    };
  }

  /* ------------------------------------------
     PLUGIN RENDER DISPATCH
     ------------------------------------------ */

  function _renderWithPlugins(block, context) {
    if (typeof LessonBlocks === 'undefined') return null;
    if (LessonBlocks.has(block.type)) {
      try {
        return LessonBlocks.render(block.type, block, context);
      } catch (e) {
        console.error('[LessonEngine] Renderer threw:', block.type, e);
        return null;
      }
    }
    if (LessonBlocks[block.type]) {
      try {
        return LessonBlocks[block.type](block, context);
      } catch (e) {
        console.error('[LessonEngine] Renderer threw:', block.type, e);
        return null;
      }
    }
    return null;
  }

  /* ------------------------------------------
     RENDER
     ------------------------------------------ */

  I.render = function() {
    if (!I.state.container) return;

    var block = I.getCurrentBlock();
    if (!block) {
      I.state.container.innerHTML = I.renderErrorBlock(new Error('\u0411\u043B\u043E\u043A \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D'));
      return;
    }

    var context = _buildContext(block);

    I.debugLog('Rendering block', I.state.currentIndex, block.type);

    I.trigger('beforeRender', {
      block: block,
      blockIndex: I.state.currentIndex,
      context: context,
    });

    var html = _renderWithPlugins(block, context);

    if (html) {
      I.state.container.innerHTML = html;
    } else {
      I.state.container.innerHTML = I.renderErrorBlock(
        new Error('\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0442\u0438\u043F \u0431\u043B\u043E\u043A\u0430: ' + block.type)
      );
    }

    I.state.container.scrollTop = 0;
    I.state.blockStartTime = Date.now();

    I.trigger('afterRender', {
      block: block,
      blockIndex: I.state.currentIndex,
      html: html,
    });

    var blockId = block.id || block.type + '_' + I.state.currentIndex;

    I.emit(ENGINE_EVENTS.BLOCK_START, {
      blockIndex: I.state.currentIndex,
      blockType: block.type,
      blockId: blockId,
    });

    I.triggerAnalytics('onBlockStart', {
      blockIndex: I.state.currentIndex,
      blockType: block.type,
      blockId: blockId,
    });

    I.renderDebugPanel();
  };

  /* ------------------------------------------
     PROCESS BLOCK RESULT
     ------------------------------------------ */

  function _processBlockResult(result) {
    I.state.blockResults[I.state.currentIndex] = result;
    if (result.answers) {
      I.state.answers[I.state.currentIndex] = result.answers;
    }

    /* Повторная отправка заменяет результат блока, а не прибавляет score. */
    I.state.score = 0;
    I.state.mistakes = 0;
    Object.keys(I.state.blockResults).forEach(function(key) {
      var saved = I.state.blockResults[key];
      if (!saved || saved.correct === undefined) return;
      if (saved.correct) I.state.score += saved.points || DEFAULT_POINTS;
      else I.state.mistakes++;
    });
  }

  /* ------------------------------------------
     MARK BLOCK COMPLETE
     ------------------------------------------ */

  function _markComplete() {
    var idx = I.state.currentIndex;
    if (I.state.completedBlocks.indexOf(idx) === -1) {
      I.state.completedBlocks.push(idx);
    }
  }

  function _isCompletionBlock(block) {
    return !!(block && (block.type === 'result' || block.type === 'lesson-summary' || block.completesLesson === true));
  }

  /* ------------------------------------------
     EMIT BLOCK COMPLETE
     ------------------------------------------ */

  function _emitBlockComplete(result) {
    I.saveProgress();

    I.emit(ENGINE_EVENTS.BLOCK_COMPLETE, {
      blockIndex: I.state.currentIndex,
      blockType: I.getCurrentBlock().type,
      result: result,
      score: I.state.score,
      mistakes: I.state.mistakes,
    });

    I.trigger('afterComplete', {
      block: I.getCurrentBlock(),
      blockIndex: I.state.currentIndex,
      result: result,
      score: I.state.score,
      mistakes: I.state.mistakes,
    });

    I.triggerAnalytics('onBlockFinish', {
      blockIndex: I.state.currentIndex,
      blockType: I.getCurrentBlock().type,
      result: result,
      score: I.state.score,
      mistakes: I.state.mistakes,
    });
  }

  /* ------------------------------------------
     NAVIGATION: NEXT
     ------------------------------------------ */

  I.next = function(blockResult) {
    if (I.state.finished) return;

    I.updateTime();

    if (blockResult) {
      _processBlockResult(blockResult);

      I.triggerAnalytics('onAnswer', {
        blockIndex: I.state.currentIndex,
        blockType: I.getCurrentBlock().type,
        correct: blockResult.correct,
        answers: blockResult.answers,
        points: blockResult.points,
      });
    }

    I.trigger('beforeComplete', {
      block: I.getCurrentBlock(),
      blockIndex: I.state.currentIndex,
      result: blockResult,
      score: I.state.score,
      mistakes: I.state.mistakes,
    });

    _markComplete();
    _emitBlockComplete(blockResult);

    if (!I.hasNext()) {
      I.finish();
      return;
    }

    I.state.currentIndex++;
    I.render();
    I.saveProgress();

    /* Result — подтверждённый финальный экран. Достижение фиксируется при
       входе на него, а не после ухода со страницы. */
    var nextBlock = I.getCurrentBlock();
    if (_isCompletionBlock(nextBlock)) I.finish();
  };

  /* ------------------------------------------
     NAVIGATION: PREV / GOTO
     ------------------------------------------ */

  I.prev = function() {
    if (!I.hasPrev()) return;
    I.state.currentIndex--;
    I.render();
    I.saveProgress();
  };

  I.goTo = function(index) {
    if (index < 0 || index >= I.state.blocks.length) return;
    if (index > I.state.currentIndex + 1) return;
    I.state.currentIndex = index;
    I.render();
    I.saveProgress();
  };

  /* ------------------------------------------
     FINISH
     ------------------------------------------ */

  I.finish = function() {
    if (I.state.finished) return false;
    I.state.finished = true;
    I.updateTime();

    var current = I.getCurrentBlock();
    if (_isCompletionBlock(current)) _markComplete();
    I.saveProgress();

    var assessment = I.getAssessmentSummary();

    I.trigger('beforeFinish', {
      lessonId: I.state.lessonId,
      score: I.state.score,
      mistakes: I.state.mistakes,
      timeSpent: I.state.timeSpent,
      assessment: assessment,
    });

    I.emit(ENGINE_EVENTS.LESSON_FINISHED, {
      score: I.state.score,
      mistakes: I.state.mistakes,
      timeSpent: I.state.timeSpent,
      totalBlocks: I.state.blocks.length,
      completedBlocks: I.state.completedBlocks.length,
      answers: I.state.answers,
      startedAt: I.state.startedAt,
      correctAnswers: assessment.correctAnswers,
      totalQuestions: assessment.totalQuestions,
      percentage: assessment.percentage,
      attempts: assessment.attempts,
    });

    I.triggerAnalytics('onLessonFinish', {
      lessonId: I.state.lessonId,
      score: I.state.score,
      mistakes: I.state.mistakes,
      timeSpent: I.state.timeSpent,
      totalBlocks: I.state.blocks.length,
      completedBlocks: I.state.completedBlocks.length,
      startedAt: I.state.startedAt,
      correctAnswers: assessment.correctAnswers,
      totalQuestions: assessment.totalQuestions,
      percentage: assessment.percentage,
      attempts: assessment.attempts,
    });

    I.trigger('afterFinish', {
      lessonId: I.state.lessonId,
      score: I.state.score,
      mistakes: I.state.mistakes,
      timeSpent: I.state.timeSpent,
      assessment: assessment,
    });

    I.renderDebugPanel();
    return true;
  };

  /* ------------------------------------------
     LOAD
     ------------------------------------------ */

  function _validateConfig(lessonConfig) {
    if (!lessonConfig || !lessonConfig.blocks || !Array.isArray(lessonConfig.blocks)) {
      console.error('[LessonEngine] Invalid lesson config');
      return false;
    }
    if (!I.checkSchemaVersion(lessonConfig)) {
      console.error('[LessonEngine] Incompatible schema version. Required: >=', I.MIN_SCHEMA_VERSION);
      return false;
    }
    return true;
  }

  function _initState(lessonConfig, containerEl) {
    I.state.lessonId = lessonConfig.id || 'lesson_' + Date.now();
    I.state.lesson = lessonConfig;
    I.state.blocks = lessonConfig.blocks;
    I.state.container = containerEl;
    I.state.currentIndex = 0;
    I.state.answers = {};
    I.state.score = 0;
    I.state.mistakes = 0;
    I.state.timeSpent = 0;
    I.state.completedBlocks = [];
    I.state.blockResults = {};
    I.state.interactionStates = {};
    I.state.completedSnapshot = false;
    I.state.finished = false;
    I.state.startedAt = Date.now();
    I.state.startTime = Date.now();
    I.state.elapsedBeforeSession = 0;
    I.state.blockStartTime = null;
    I.state.repeatMode = false;

    if (typeof Learning !== 'undefined' && Learning.getLessonState) {
      I.state.repeatMode = Learning.getLessonState(I.state.lessonId) === 'completed';
    }
  }

  function _tryRestoreProgress() {
    var restored = I.loadProgress();
    if (restored) {
      I.debugLog('Progress restored');
      if (I.state.currentIndex >= I.state.blocks.length) {
        I.state.currentIndex = I.state.blocks.length - 1;
      }
      I.state.finished = I.state.completedSnapshot === true;
      I.state.startTime = Date.now();
    }
    return restored;
  }

  I.load = function(lessonConfig, containerEl) {
    if (!_validateConfig(lessonConfig)) return;

    _initState(lessonConfig, containerEl);

    I.initDebug();
    I.debugLog('Loading lesson:', I.state.lessonId);
    I.debugLog('Blocks:', I.state.blocks.length);
    I.debugLog('Repeat mode:', I.state.repeatMode);

    I.trigger('beforeLesson', {
      config: lessonConfig,
      lessonId: I.state.lessonId,
    });

    _tryRestoreProgress();

    I.trigger('afterLesson', {
      config: lessonConfig,
      lessonId: I.state.lessonId,
      currentIndex: I.state.currentIndex,
    });

    I.render();
    I.renderDebugPanel();
  };

})(window.__EngineInternal);
