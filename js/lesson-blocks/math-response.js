/* Reusable free-form mathematical response block. */
window.MathResponseBlock = (function() {
  'use strict';

  var H = window.__BlockHelpers;
  var draftTimers = {};
  var geometryBound = false;
  var lifecycleBound = false;

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function text(key, fallback) {
    if (typeof I18N !== 'undefined' && I18N.t) {
      var translated = I18N.t('lesson.math.' + key);
      if (translated && translated !== 'lesson.math.' + key) return translated;
    }
    return fallback || key;
  }

  function currentBlock(index) {
    var state = window.__EngineInternal && window.__EngineInternal.state;
    return state && state.blocks ? state.blocks[index] : null;
  }

  function emptyRecord(block) {
    return {
      blockId: block.id,
      role: block.role || '',
      attemptCount: 0,
      hintCount: 0,
      syntaxIssueCount: 0,
      attempts: [],
      inputIssues: [],
      misconceptionCodes: [],
      completed: false,
      draftLatex: '',
      lastAnswer: '',
      lastNormalized: '',
      lastStatus: '',
      lastFeedback: '',
    };
  }

  function recordFor(block, ctx) {
    return ctx.interactionState || (ctx.savedResult && ctx.savedResult.evidence) || emptyRecord(block);
  }

  function fieldId(index) { return 'math-response-field-' + index; }

  function isNumericAngle(block) {
    return !!(block && block.answer && (block.answer.kind === 'numeric-angle' || block.answer.validation === 'numeric-angle'));
  }

  function isNumericAnswer(block) {
    return !!(block && block.inputMode === 'numeric');
  }

  function usesStandaloneAnswer(block, numericAngle) {
    if (!block || !block.expression || numericAngle) return false;
    var visibleExpression = String(block.expression).replace(/<[^>]*>/g, '').replace(/\s+/g, '');
    return visibleExpression.length > 18;
  }

  function mappingPairs(block) {
    if (!isNumericAnswer(block) || typeof block.expression !== 'string') return null;
    var pairs = block.expression.split(',').map(function(pair) { return pair.trim(); }).filter(Boolean);
    if (pairs.length < 2 || !pairs.slice(0, -1).every(function(pair) { return /^.+→.+$/.test(pair) && pair.indexOf('?') === -1; })) return null;
    var answerMatch = pairs[pairs.length - 1].match(/^(.+→)\s*\?$/);
    return answerMatch ? { pairs: pairs.slice(0, -1), prefix: answerMatch[1].trim() } : null;
  }

  function numericInputHtml(block, index, value, disabled) {
    var config = block.numericInput || {};
    var prefix = config.prefix || '';
    var suffix = config.suffix === undefined ? '°' : config.suffix;
    return '<div class="math-response-angle-entry">' +
      (prefix ? '<span class="math-response-angle-prefix" aria-hidden="true">' + escapeHtml(prefix) + '</span>' : '') +
      '<input id="' + fieldId(index) + '" class="math-response-angle-field" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"' +
        (disabled ? ' disabled' : '') + ' aria-describedby="math-response-feedback-' + index + '" aria-label="' + escapeHtml(block.inputLabel || text('answer', 'Answer')) + '" aria-required="true" value="' + escapeHtml(value) + '">' +
      (suffix ? '<span class="math-response-angle-suffix" aria-hidden="true">' + escapeHtml(suffix) + '</span>' : '') +
    '</div>';
  }

  function feedbackTitle(status) {
    if (status === 'correct') return text('correct', 'Correct');
    if (status === 'incorrect') return text('reasoning', 'Check the reasoning');
    if (status === 'incomplete') return text('incompleteTitle', 'Finish the expression');
    if (status === 'invalid') return text('invalidTitle', 'Check the notation');
    if (status === 'empty') return text('emptyTitle', 'Enter an answer');
    return '';
  }

  function feedbackHtml(block, record, index) {
    if (!record.lastStatus || !record.lastFeedback) {
      return '<div id="math-response-feedback-' + index + '" class="math-response-feedback-slot" aria-live="polite"></div>';
    }
    var status = record.lastStatus;
    var role = status === 'incorrect' ? 'alert' : 'status';
    var feedback = ['empty', 'incomplete', 'invalid'].indexOf(status) > -1
      ? syntaxFeedback(status, block)
      : record.lastFeedback;
    return '<div id="math-response-feedback-' + index + '" class="math-response-feedback is-' + status + '" role="' + role + '" aria-live="polite" tabindex="-1">' +
      '<strong>' + escapeHtml(feedbackTitle(status)) + '</strong><p>' + feedback + '</p></div>';
  }

  function hintsHtml(block, record, index) {
    var hints = block.hints || [];
    if (!hints.length) return '';
    var shown = hints.slice(0, record.hintCount || 0).map(function(hint, hintIndex) {
      return '<li><span>H' + (hintIndex + 1) + '</span><p>' + hint + '</p></li>';
    }).join('');
    var button = !record.completed && record.hintCount < hints.length
      ? '<button type="button" class="guided-hint-button" onclick="MathResponseBlock.showHint(' + index + ')">' +
        escapeHtml(record.hintCount ? text('nextHint', 'Next hint') : text('hint', 'Show hint')) + '</button>'
      : '';
    return '<div class="guided-hints">' +
      (shown ? '<ol aria-label="' + escapeHtml(text('usedHints', 'Used hints')) + '">' + shown + '</ol>' : '') + button + '</div>';
  }

  function render(block, ctx) {
    var record = recordFor(block, ctx);
    var value = record.draftLatex || record.lastAnswer || '';
    var disabled = record.completed === true;
    var statusClass = record.lastStatus ? ' is-' + record.lastStatus : '';
    if (value) statusClass += ' is-filled';
    var action = disabled
      ? '<button type="button" class="lesson-continue-button" onclick="MathResponseBlock.complete(' + ctx.index + ')">' + escapeHtml(text('continue', 'Continue')) + '</button>'
      : '<button type="button" class="guided-submit-button" onclick="MathResponseBlock.submit(' + ctx.index + ')">' + escapeHtml(record.lastStatus === 'incorrect' ? text('checkAgain', 'Check again') : text('check', 'Check')) + '</button>';
    var numericAngle = isNumericAngle(block);
    var standaloneAnswer = usesStandaloneAnswer(block, numericAngle);
    var mappedPairs = !standaloneAnswer && !numericAngle ? mappingPairs(block) : null;
    var renderedExpression = !standaloneAnswer && typeof block.expression === 'string'
      ? block.expression.replace(/\?\s*$/, '')
      : block.expression;
    var expressionHtml = renderedExpression
      ? '<span class="' + (standaloneAnswer ? 'math-response-problem-expression' : 'math-response-given') + '" role="math" aria-label="' + escapeHtml(renderedExpression) + '">' +
        (block.expressionMath ? H.mathMarkup(block.expressionMath, renderedExpression, true) : renderedExpression) + '</span>'
      : '';
    var answerHtml = numericAngle
      ? numericInputHtml(block, ctx.index, value, disabled)
      : '<math-field id="' + fieldId(ctx.index) + '" class="math-response-field" smart-fence math-virtual-keyboard-policy="auto"' +
        (disabled ? ' read-only disabled' : '') + ' aria-describedby="math-response-feedback-' + ctx.index + '">' + escapeHtml(value) + '</math-field>';
    var mappingPairsHtml = mappedPairs
      ? '<div class="math-response-mapping-pairs" role="math" aria-label="' + escapeHtml(block.expression.replace(/,/g, ';')) + '">' +
          mappedPairs.pairs.map(function(pair) { return '<span class="math-response-mapping-pair">' + escapeHtml(pair) + '</span>'; }).join('') +
          '<span class="math-response-mapping-pair is-answer"><span>' + escapeHtml(mappedPairs.prefix) + '</span>' + answerHtml + '</span></div>'
      : '';
    return H.wrap(
      '<div class="py-6 math-response-block' + (block.compact ? ' is-compact' : '') + '">' + H.progress(ctx.index, ctx.total) +
        H.blockBadge(block.badgeLabel || text('badge', 'Write the answer')) +
        (block.title ? '<h2 class="mb-3 text-3xl font-extrabold text-slate-900">' + block.title + '</h2>' : '') +
        (block.prompt ? '<p class="mb-4 text-lg leading-relaxed text-slate-600">' + block.prompt + '</p>' : '') +
        '<h3 class="guided-question">' + block.question + '</h3>' +
        (standaloneAnswer ? expressionHtml : '') +
        '<label class="math-response-label" for="' + fieldId(ctx.index) + '"><span>' + escapeHtml(block.inputLabel || text('answer', 'Answer')) + '</span></label>' +
        '<div class="math-response-equation ' + (standaloneAnswer ? 'is-standalone-answer' : 'is-inline-expression') + (mappedPairs ? ' is-mapping-pairs' : '') + (block.compact ? ' is-compact' : '') + (numericAngle ? ' is-numeric-angle' : '') + statusClass + '">' +
          (mappedPairs ? mappingPairsHtml : (!standaloneAnswer ? expressionHtml : '') + answerHtml) +
        '</div>' +
        (!disabled ? '<div class="math-response-tools"><button type="button" onclick="MathResponseBlock.clear(' + ctx.index + ')">' + escapeHtml(text('clear', 'Clear')) + '</button>' +
          (block.typingHelp === false ? '' : '<span>' + escapeHtml(text('typingHelp', 'Use ^ for a power and / for a fraction')) + '</span>') + '</div>' : '') +
        hintsHtml(block, record, ctx.index) + feedbackHtml(block, record, ctx.index) +
        '<div class="guided-actions">' + (record.attemptCount ? '<span class="guided-attempts">' + escapeHtml(text('attempts', 'Attempts')) + ': ' + record.attemptCount + '</span>' : '') + action + '</div>' +
      '</div>'
    );
  }

  function getField(index) { return document.getElementById(fieldId(index)); }

  function responseContainer(field) {
    if (!field) return null;
    if (typeof field.closest === 'function') return field.closest('.math-response-equation') || field.parentElement;
    return field.parentElement && field.parentElement.parentElement && field.parentElement.parentElement.classList
      ? field.parentElement.parentElement : field.parentElement;
  }

  function saveDraft(index, rerender) {
    var block = currentBlock(index);
    if (!block || block.type !== 'math-response') return null;
    var field = getField(index);
    var record = LessonEngine.getInteractionState(index) || emptyRecord(block);
    if (record.completed) return record;
    record.draftLatex = MathInput.fieldValue(field);
    record.draftUpdatedAt = Date.now();
    LessonEngine.setInteractionState(index, record);
    if (rerender) LessonEngine.render();
    return record;
  }

  function scheduleDraft(index) {
    if (draftTimers[index]) clearTimeout(draftTimers[index]);
    draftTimers[index] = setTimeout(function() {
      delete draftTimers[index];
      saveDraft(index, false);
    }, 250);
  }

  function bindGeometry() {
    if (geometryBound || window.__mathlogicMathGeometryBound || !window.mathVirtualKeyboard || !window.mathVirtualKeyboard.addEventListener) return;
    geometryBound = true;
    window.__mathlogicMathGeometryBound = true;
    window.mathVirtualKeyboard.addEventListener('geometrychange', function() {
      var height = window.mathVirtualKeyboard.visible && window.mathVirtualKeyboard.boundingRect
        ? Math.max(0, Math.round(window.mathVirtualKeyboard.boundingRect.height || 0)) : 0;
      document.documentElement.style.setProperty('--math-keyboard-height', height + 'px');
      if (document.body && document.body.classList) document.body.classList.toggle('math-keyboard-open', height > 0);
      var field = document.querySelector && document.querySelector('math-field:focus-within');
      if (field && typeof field.scrollIntoView === 'function') {
        var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        field.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }

  function bindLifecycle() {
    if (lifecycleBound || !window.addEventListener) return;
    lifecycleBound = true;
    window.addEventListener('pagehide', function() {
      var state = window.__EngineInternal && window.__EngineInternal.state;
      var index = state ? state.currentIndex : null;
      if (index !== null && currentBlock(index) && currentBlock(index).type === 'math-response') saveDraft(index, false);
    });
    if (document.addEventListener) {
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState !== 'hidden') return;
        var state = window.__EngineInternal && window.__EngineInternal.state;
        var index = state ? state.currentIndex : null;
        if (index !== null && currentBlock(index) && currentBlock(index).type === 'math-response') saveDraft(index, false);
      });
    }
  }

  function initialize(index, block) {
    var field = getField(index);
    if (!field || field.dataset.mathlogicReady === 'true') return;
    field.dataset.mathlogicReady = 'true';
    if (!isNumericAngle(block)) {
      MathInput.configureMathLive();
      MathInput.configureField(field, block.keyboard);
    }
    field.addEventListener('input', function() {
      var container = responseContainer(field);
      if (container && container.classList) container.classList.toggle('is-filled', !!MathInput.fieldValue(field));
      scheduleDraft(index);
    });
    field.addEventListener('change', function() { saveDraft(index, false); });
    field.addEventListener('focusout', function() { saveDraft(index, false); });
    field.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submit(index);
      } else if (event.key === 'Escape' && window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.hide();
      }
    });
    bindGeometry();
    bindLifecycle();
  }

  function focusFeedback(index) {
    setTimeout(function() {
      var feedback = document.getElementById('math-response-feedback-' + index);
      if (feedback && typeof feedback.focus === 'function') feedback.focus();
    }, 0);
  }

  function misconceptionFor(block, answer) {
    return (block.misconceptions || []).find(function(item) {
      return MathInput.matches(answer, item.accepted || [], block.answer);
    }) || null;
  }

  function syntaxFeedback(status, block) {
    if (isNumericAngle(block)) {
      if (status === 'empty') return text('angleEmptyFeedback', 'Enter the number of degrees before checking.');
      if (status === 'incomplete') return text('angleIncompleteFeedback', 'Finish writing the number of degrees.');
      return text('angleInvalidFeedback', 'Enter one number for the angle, for example 67.');
    }
    if (isNumericAnswer(block) && status !== 'empty') {
      return text('numberInvalidFeedback', 'Enter one number.');
    }
    if (status === 'empty') return text('emptyFeedback', 'Write an answer before checking it.');
    if (status === 'incomplete') return text('incompleteFeedback', 'The expression is not finished. Complete the exponent, fraction or parentheses.');
    return text('invalidFeedback', 'This notation cannot be read yet. Check the operators and parentheses.');
  }

  function submit(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'math-response') return;
    var field = getField(index);
    var answer = MathInput.fieldValue(field);
    var record = LessonEngine.getInteractionState(index) || emptyRecord(block);
    if (field) {
      field.setAttribute('aria-busy', 'true');
      var container = responseContainer(field);
      if (container && container.classList) container.classList.add('is-checking');
    }
    var validation = MathInput.validate(answer, block.answer);
    if (field) {
      field.setAttribute('aria-busy', 'false');
      var updatedContainer = responseContainer(field);
      if (updatedContainer && updatedContainer.classList) updatedContainer.classList.remove('is-checking');
    }
    record.draftLatex = answer;
    record.lastAnswer = answer;
    record.lastNormalized = validation.normalized || '';
    record.lastStatus = validation.status;

    if (validation.status === 'empty' || validation.status === 'incomplete' || validation.status === 'invalid') {
      record.lastFeedback = syntaxFeedback(validation.status, block);
      if (validation.status !== 'empty') {
        record.syntaxIssueCount += 1;
        record.inputIssues.push({ status: validation.status, code: validation.code, answer: answer, at: Date.now() });
      }
      LessonEngine.setInteractionState(index, record);
      LessonEngine.render();
      focusFeedback(index);
      return;
    }

    var correct = validation.status === 'correct';
    var misconception = correct ? null : misconceptionFor(block, answer);
    record.attemptCount += 1;
    record.lastStatus = correct ? 'correct' : 'incorrect';
    record.lastFeedback = correct
      ? (block.successFeedback || text('successFeedback', 'The expression is correct.'))
      : (misconception ? misconception.feedback : (block.feedback || text('wrongFeedback', 'Return to the mathematical structure and try again.')));
    record.attempts.push({
      answer: answer,
      normalized: validation.normalized,
      correct: correct,
      misconception: misconception ? misconception.code : '',
      at: Date.now(),
    });
    if (misconception && record.misconceptionCodes.indexOf(misconception.code) === -1) record.misconceptionCodes.push(misconception.code);

    if (correct) {
      /* Input notation issues are tracked separately and do not turn a
         mathematically first, hint-free solution into a wrong attempt. */
      var independent = record.attemptCount === 1 && record.hintCount === 0;
      record.completed = true;
      record.completedAt = Date.now();
      record.pendingResult = {
        correct: true,
        correctAnswers: 1,
        totalQuestions: 1,
        attempts: record.attemptCount,
        answers: { latex: answer, normalized: validation.normalized },
        points: Number(block.points) || 10,
        firstTry: independent,
        independent: independent,
        repairedAfterFeedback: record.attemptCount > 1,
        inputRepaired: record.syntaxIssueCount > 0,
        hintsUsed: record.hintCount,
        role: block.role || '',
        misconceptionCodes: record.misconceptionCodes.slice(),
        evidence: {
          blockId: record.blockId,
          role: record.role,
          attemptCount: record.attemptCount,
          hintCount: record.hintCount,
          syntaxIssueCount: record.syntaxIssueCount,
          attempts: record.attempts.slice(),
          inputIssues: record.inputIssues.slice(),
          misconceptionCodes: record.misconceptionCodes.slice(),
          completed: true,
          completedAt: record.completedAt,
          lastAnswer: answer,
          lastNormalized: validation.normalized,
          lastStatus: 'correct',
          lastFeedback: record.lastFeedback,
        },
      };
    }

    LessonEngine.setInteractionState(index, record);
    LessonEngine.render();
    focusFeedback(index);
  }

  function showHint(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'math-response') return;
    var record = saveDraft(index, false) || LessonEngine.getInteractionState(index) || emptyRecord(block);
    record.hintCount = Math.min((block.hints || []).length, record.hintCount + 1);
    LessonEngine.setInteractionState(index, record);
    LessonEngine.render();
  }

  function clear(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'math-response') return;
    var record = LessonEngine.getInteractionState(index) || emptyRecord(block);
    record.draftLatex = '';
    record.lastAnswer = '';
    record.lastNormalized = '';
    record.lastStatus = '';
    record.lastFeedback = '';
    LessonEngine.setInteractionState(index, record);
    LessonEngine.render();
    setTimeout(function() {
      var field = getField(index);
      if (field && typeof field.focus === 'function') field.focus();
    }, 0);
  }

  function complete(index) {
    var record = LessonEngine.getInteractionState(index);
    if (!record || !record.completed || !record.pendingResult) return;
    LessonEngine.next(record.pendingResult);
  }

  LessonBlocks.register('math-response', render);
  if (LessonEngine && LessonEngine.on) {
    LessonEngine.on('afterRender', function(data) {
      if (data.block && data.block.type === 'math-response') initialize(data.blockIndex, data.block);
    });
  }

  return {
    render: render,
    initialize: initialize,
    saveDraft: saveDraft,
    submit: submit,
    showHint: showHint,
    clear: clear,
    complete: complete,
  };
})();
