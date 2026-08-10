/* Reusable, explicitly validated equation transformation workspace. */
window.EquationStepBlock = (function() {
  'use strict';

  var H = window.__BlockHelpers;
  var draftTimers = {};
  var lifecycleBound = false;

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function text(key, ru, kk) {
    if (typeof ML !== 'undefined' && ML.getLang && ML.getLang() === 'kk') return kk;
    return ru;
  }

  function currentBlock(index) {
    var state = window.__EngineInternal && window.__EngineInternal.state;
    return state && state.blocks ? state.blocks[index] : null;
  }

  function emptyStep() {
    return {
      selectedOperation: null,
      operationAccepted: false,
      draftLatex: '',
      lastAnswer: '',
      lastNormalized: '',
      lastStatus: '',
      lastFeedback: '',
      attemptCount: 0,
      hintCount: 0,
      syntaxIssueCount: 0,
      attempts: [],
      inputIssues: [],
      misconceptionCodes: [],
      completed: false,
    };
  }

  function emptyRecord(block) {
    return {
      blockId: block.id,
      role: block.role || '',
      currentStep: 0,
      steps: (block.steps || []).map(emptyStep),
      history: [],
      completed: false,
      lastCompletedStep: -1,
    };
  }

  function ensureRecord(block, record) {
    record = record || emptyRecord(block);
    record.steps = Array.isArray(record.steps) ? record.steps : [];
    while (record.steps.length < (block.steps || []).length) record.steps.push(emptyStep());
    record.history = Array.isArray(record.history) ? record.history : [];
    record.currentStep = Math.max(0, Number(record.currentStep) || 0);
    return record;
  }

  function recordFor(block, ctx) {
    return ensureRecord(block, ctx.interactionState || (ctx.savedResult && ctx.savedResult.evidence));
  }

  function fieldId(index, stepIndex) { return 'equation-step-field-' + index + '-' + stepIndex; }
  function feedbackId(index) { return 'equation-step-feedback-' + index; }
  function operationName(index, stepIndex) { return 'equation-operation-' + index + '-' + stepIndex; }

  function totalEvidence(record) {
    var result = { attempts: 0, hints: 0, syntax: 0, misconceptions: [] };
    record.steps.forEach(function(step) {
      result.attempts += Number(step.attemptCount) || 0;
      result.hints += Number(step.hintCount) || 0;
      result.syntax += Number(step.syntaxIssueCount) || 0;
      (step.misconceptionCodes || []).forEach(function(code) {
        if (result.misconceptions.indexOf(code) === -1) result.misconceptions.push(code);
      });
    });
    return result;
  }

  function balanceHtml(model) {
    if (!model) return '';
    return '<div class="equation-balance-model" role="img" aria-label="' + escapeHtml(model.ariaLabel || '') + '">' +
      '<div class="equation-balance-row"><span>' + model.left + '</span><b aria-hidden="true">=</b><span>' + model.right + '</span></div>' +
      '<div class="equation-balance-actions" aria-hidden="true"><span>' + model.action + '</span><span>' + model.action + '</span></div>' +
      '<p>' + model.caption + '</p></div>';
  }

  function historyHtml(block, record) {
    var rows = '<li class="equation-history-state"><span class="sr-only">' +
      escapeHtml(text('initial', 'Исходное уравнение: ', 'Бастапқы теңдеу: ')) + '</span><span role="math">' + block.initial + '</span></li>';
    record.history.forEach(function(item, historyIndex) {
      var isNew = historyIndex === record.lastCompletedStep ? ' is-new' : '';
      rows += '<li class="equation-history-transition' + isNew + '">' +
        '<span class="equation-history-arrow" aria-hidden="true">↓</span>' +
        '<span class="equation-history-operation">' + item.operation + '</span></li>' +
        '<li class="equation-history-state' + isNew + '"><span role="math">' + item.equation + '</span></li>';
    });
    return '<ol class="equation-history" aria-label="' + escapeHtml(block.historyLabel || text('history', 'Цепочка решения', 'Шешу тізбегі')) + '">' + rows + '</ol>';
  }

  function operationOptionsHtml(step, stepRecord, index, stepIndex) {
    if (!Array.isArray(step.operationOptions) || !step.operationOptions.length || stepRecord.operationAccepted) return '';
    var name = operationName(index, stepIndex);
    var options = step.operationOptions.map(function(option, optionIndex) {
      var selected = stepRecord.selectedOperation !== null && Number(stepRecord.selectedOperation) === optionIndex;
      var resultClass = selected && stepRecord.lastStatus === 'incorrect' ? ' is-incorrect' : '';
      return '<label class="lesson-option equation-operation-option' + (selected ? ' is-selected' : '') + resultClass + '">' +
        '<input type="radio" name="' + name + '" value="' + optionIndex + '"' + (selected ? ' checked aria-checked="true"' : ' aria-checked="false"') +
        ' onchange="EquationStepBlock.selectOperation(this,' + index + ',' + stepIndex + ')" onkeydown="EquationStepBlock.keySelectOperation(event,this,' + index + ',' + stepIndex + ')">' +
        '<span class="lesson-option-dot" aria-hidden="true"></span><span>' + option.text + '</span></label>';
    }).join('');
    return '<fieldset class="equation-operation-picker"><legend>' + step.operationQuestion + '</legend>' +
      '<div class="equation-operation-options">' + options + '</div>' +
      '<button type="button" class="guided-submit-button" onclick="EquationStepBlock.checkOperation(' + index + ',' + stepIndex + ')">' +
      escapeHtml(text('checkAction', 'Проверить действие', 'Әрекетті тексеру')) + '</button></fieldset>';
  }

  function inputHtml(step, stepRecord, index, stepIndex) {
    if (Array.isArray(step.operationOptions) && step.operationOptions.length && !stepRecord.operationAccepted) return '';
    var statusClass = stepRecord.lastStatus ? ' is-' + stepRecord.lastStatus : '';
    if (stepRecord.draftLatex || stepRecord.lastAnswer) statusClass += ' is-filled';
    return '<div class="equation-next-state">' +
      '<label for="' + fieldId(index, stepIndex) + '">' + (step.inputLabel || text('nextLine', 'Запишите следующую строку', 'Келесі жолды жазыңыз')) + '</label>' +
      '<div class="math-response-equation is-compact' + statusClass + '">' +
        '<math-field id="' + fieldId(index, stepIndex) + '" class="math-response-field equation-step-field" smart-fence math-virtual-keyboard-policy="auto" aria-describedby="' + feedbackId(index) + '">' +
        escapeHtml(stepRecord.draftLatex || stepRecord.lastAnswer || '') + '</math-field></div>' +
      '<div class="equation-step-input-actions"><button type="button" class="math-response-clear" onclick="EquationStepBlock.clear(' + index + ',' + stepIndex + ')">' +
        escapeHtml(text('clear', 'Очистить', 'Тазарту')) + '</button>' +
        '<button type="button" class="guided-submit-button" onclick="EquationStepBlock.submit(' + index + ',' + stepIndex + ')">' +
        escapeHtml(stepRecord.lastStatus === 'incorrect' ? text('retry', 'Проверить снова', 'Қайта тексеру') : text('check', 'Проверить строку', 'Жолды тексеру')) + '</button></div></div>';
  }

  function hintsHtml(step, stepRecord, index, stepIndex) {
    var hints = step.hints || [];
    if (!hints.length || stepRecord.completed) return '';
    var shown = hints.slice(0, stepRecord.hintCount).map(function(hint, hintIndex) {
      return '<li><span>H' + (hintIndex + 1) + '</span><p>' + hint + '</p></li>';
    }).join('');
    var button = stepRecord.hintCount < hints.length
      ? '<button type="button" class="guided-hint-button" onclick="EquationStepBlock.showHint(' + index + ',' + stepIndex + ')">' +
        escapeHtml(stepRecord.hintCount ? text('nextHint', 'Следующая подсказка', 'Келесі нұсқау') : text('hint', 'Показать подсказку', 'Нұсқауды көрсету')) + '</button>' : '';
    return '<div class="guided-hints">' + (shown ? '<ol>' + shown + '</ol>' : '') + button + '</div>';
  }

  function feedbackHtml(stepRecord, index) {
    if (!stepRecord || !stepRecord.lastStatus || !stepRecord.lastFeedback) return '<div id="' + feedbackId(index) + '" class="math-response-feedback-slot" aria-live="polite"></div>';
    var title = stepRecord.lastStatus === 'correct'
      ? text('correct', 'Шаг сохраняет равенство', 'Қадам теңдікті сақтайды')
      : stepRecord.lastStatus === 'incorrect'
        ? text('reasoning', 'Проверьте преобразование', 'Түрлендіруді тексеріңіз')
        : text('notation', 'Проверьте запись', 'Жазбаны тексеріңіз');
    return '<div id="' + feedbackId(index) + '" class="math-response-feedback is-' + stepRecord.lastStatus + '" role="' +
      (stepRecord.lastStatus === 'incorrect' ? 'alert' : 'status') + '" aria-live="polite" tabindex="-1"><strong>' +
      title + '</strong><p>' + stepRecord.lastFeedback + '</p></div>';
  }

  function render(block, ctx) {
    var record = recordFor(block, ctx);
    var stepIndex = Math.min(record.currentStep, Math.max(0, block.steps.length - 1));
    var step = block.steps[stepIndex];
    var stepRecord = record.steps[stepIndex];
    var completed = record.completed === true;
    var action = completed
      ? '<button type="button" class="lesson-continue-button" onclick="EquationStepBlock.complete(' + ctx.index + ')">' + escapeHtml(text('continue', 'Продолжить', 'Жалғастыру')) + '</button>'
      : '';
    return H.wrap(
      '<div class="equation-step-block">' + H.progress(ctx.index, ctx.total) + H.blockBadge(block.badgeLabel || text('badge', 'Пошаговое решение', 'Қадамдап шешу')) +
        '<h2>' + block.title + '</h2>' + (block.intro ? '<p class="equation-step-intro">' + block.intro + '</p>' : '') +
        balanceHtml(block.balanceModel) + historyHtml(block, record) +
        (completed ? '<div class="equation-workspace-complete" role="status"><strong>' + (block.successTitle || text('done', 'Цепочка обоснована', 'Тізбек негізделді')) + '</strong><p>' + (block.successFeedback || '') + '</p></div>' :
          '<section class="equation-current-step" aria-labelledby="equation-step-question-' + ctx.index + '">' +
            '<p class="equation-step-count">' + escapeHtml(text('step', 'Шаг ', 'Қадам ')) + (stepIndex + 1) + ' / ' + block.steps.length + '</p>' +
            '<h3 id="equation-step-question-' + ctx.index + '">' + step.prompt + '</h3>' +
            operationOptionsHtml(step, stepRecord, ctx.index, stepIndex) + inputHtml(step, stepRecord, ctx.index, stepIndex) +
            hintsHtml(step, stepRecord, ctx.index, stepIndex) + feedbackHtml(stepRecord, ctx.index) + '</section>') +
        '<div class="guided-actions">' + action + '</div></div>', { className: 'equation-workspace-wrap' }
    );
  }

  function getField(index, stepIndex) { return document.getElementById(fieldId(index, stepIndex)); }

  function save(index, record) {
    LessonEngine.setInteractionState(index, record);
    return record;
  }

  function selectOperation(input, index, stepIndex) {
    var block = currentBlock(index);
    if (!block || block.type !== 'equation-step') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    var name = input.name;
    Array.prototype.forEach.call(document.querySelectorAll('input[name="' + name + '"]'), function(radio) {
      var selected = radio === input;
      radio.checked = selected;
      radio.setAttribute('aria-checked', selected ? 'true' : 'false');
      var label = radio.closest && radio.closest('label');
      if (label) {
        label.classList.toggle('is-selected', selected);
        label.classList.remove('is-correct', 'is-incorrect');
      }
    });
    record.steps[stepIndex].selectedOperation = Number(input.value);
    record.steps[stepIndex].lastStatus = '';
    record.steps[stepIndex].lastFeedback = '';
    save(index, record);
  }

  function keySelectOperation(event, input, index, stepIndex) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectOperation(input, index, stepIndex);
  }

  function focusFeedback(index) {
    setTimeout(function() {
      var feedback = document.getElementById(feedbackId(index));
      if (feedback && typeof feedback.focus === 'function') feedback.focus();
    }, 0);
  }

  function checkOperation(index, stepIndex) {
    var block = currentBlock(index);
    if (!block || block.type !== 'equation-step') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    var step = block.steps[stepIndex];
    var stepRecord = record.steps[stepIndex];
    if (stepRecord.selectedOperation === null || stepRecord.selectedOperation === undefined) {
      stepRecord.lastStatus = 'empty';
      stepRecord.lastFeedback = text('choose', 'Сначала выберите действие над обеими частями.', 'Алдымен теңдеудің екі жағына жасалатын әрекетті таңдаңыз.');
      save(index, record); LessonEngine.render(); focusFeedback(index); return;
    }
    var option = step.operationOptions[Number(stepRecord.selectedOperation)];
    var correct = option && (option.correct === true || Number(step.operationAnswer) === Number(stepRecord.selectedOperation));
    if (!correct) {
      stepRecord.attemptCount += 1;
      stepRecord.lastStatus = 'incorrect';
      stepRecord.lastFeedback = option && option.feedback ? option.feedback : step.feedback;
      stepRecord.attempts.push({ phase: 'operation', value: Number(stepRecord.selectedOperation), correct: false, misconception: option && option.code || '', at: Date.now() });
      if (option && option.code && stepRecord.misconceptionCodes.indexOf(option.code) === -1) stepRecord.misconceptionCodes.push(option.code);
      save(index, record); LessonEngine.render(); focusFeedback(index); return;
    }
    stepRecord.operationAccepted = true;
    stepRecord.lastStatus = '';
    stepRecord.lastFeedback = '';
    save(index, record); LessonEngine.render();
  }

  function saveDraft(index, stepIndex) {
    var block = currentBlock(index);
    if (!block || block.type !== 'equation-step') return null;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    if (record.completed || record.steps[stepIndex].completed) return record;
    record.steps[stepIndex].draftLatex = MathInput.fieldValue(getField(index, stepIndex));
    record.steps[stepIndex].draftUpdatedAt = Date.now();
    return save(index, record);
  }

  function bindGeometry() {
    if (window.__mathlogicMathGeometryBound || !window.mathVirtualKeyboard || !window.mathVirtualKeyboard.addEventListener) return;
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
    function persistCurrentDraft() {
      var state = window.__EngineInternal && window.__EngineInternal.state;
      var index = state ? state.currentIndex : null;
      var block = index !== null ? currentBlock(index) : null;
      if (!block || block.type !== 'equation-step') return;
      var record = ensureRecord(block, LessonEngine.getInteractionState(index));
      if (!record.completed) saveDraft(index, record.currentStep);
    }
    window.addEventListener('pagehide', persistCurrentDraft);
    if (document.addEventListener) document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') persistCurrentDraft();
    });
  }

  function initialize(index, block) {
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    if (record.completed) return;
    var stepIndex = record.currentStep;
    var field = getField(index, stepIndex);
    if (!field || field.dataset.mathlogicReady === 'true') return;
    field.dataset.mathlogicReady = 'true';
    MathInput.configureMathLive();
    MathInput.configureField(field, block.steps[stepIndex].keyboard || block.keyboard);
    field.addEventListener('input', function() {
      if (draftTimers[index]) clearTimeout(draftTimers[index]);
      draftTimers[index] = setTimeout(function() { saveDraft(index, stepIndex); }, 250);
    });
    field.addEventListener('change', function() { saveDraft(index, stepIndex); });
    field.addEventListener('focusout', function() { saveDraft(index, stepIndex); });
    field.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(index, stepIndex); }
      else if (event.key === 'Escape' && window.mathVirtualKeyboard) window.mathVirtualKeyboard.hide();
    });
    bindGeometry();
    bindLifecycle();
  }

  function syntaxFeedback(status) {
    if (status === 'empty') return text('emptyInput', 'Запишите следующую строку перед проверкой.', 'Тексерер алдында келесі жолды жазыңыз.');
    if (status === 'incomplete') return text('incomplete', 'Запись не закончена. Проверьте знак равенства, скобки и пустые места.', 'Жазба аяқталмаған. Теңдік белгісін, жақшаларды және бос орындарды тексеріңіз.');
    return text('invalid', 'Эту запись пока нельзя прочитать. Проверьте знаки действий и равенства.', 'Бұл жазбаны әзірше оқу мүмкін емес. Амалдар мен теңдік белгілерін тексеріңіз.');
  }

  function misconceptionFor(step, answer) {
    return (step.misconceptions || []).find(function(item) { return MathInput.matches(answer, item.accepted || []); }) || null;
  }

  function submit(index, stepIndex) {
    var block = currentBlock(index);
    if (!block || block.type !== 'equation-step') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    var step = block.steps[stepIndex];
    var stepRecord = record.steps[stepIndex];
    var answer = MathInput.fieldValue(getField(index, stepIndex));
    var validation = MathInput.validate(answer, step.answer);
    stepRecord.draftLatex = answer;
    stepRecord.lastAnswer = answer;
    stepRecord.lastNormalized = validation.normalized || '';
    stepRecord.lastStatus = validation.status;
    if (['empty', 'incomplete', 'invalid'].indexOf(validation.status) > -1) {
      stepRecord.lastFeedback = syntaxFeedback(validation.status);
      if (validation.status !== 'empty') {
        stepRecord.syntaxIssueCount += 1;
        stepRecord.inputIssues.push({ status: validation.status, code: validation.code || '', answer: answer, at: Date.now() });
      }
      save(index, record); LessonEngine.render(); focusFeedback(index); return;
    }
    var correct = validation.status === 'correct';
    var misconception = correct ? null : misconceptionFor(step, answer);
    stepRecord.attemptCount += 1;
    stepRecord.lastStatus = correct ? 'correct' : 'incorrect';
    stepRecord.lastFeedback = correct ? (step.successFeedback || '') : (misconception ? misconception.feedback : step.feedback);
    stepRecord.attempts.push({ phase: 'state', answer: answer, normalized: validation.normalized, correct: correct, misconception: misconception ? misconception.code : '', at: Date.now() });
    if (misconception && stepRecord.misconceptionCodes.indexOf(misconception.code) === -1) stepRecord.misconceptionCodes.push(misconception.code);
    if (!correct) { save(index, record); LessonEngine.render(); focusFeedback(index); return; }

    stepRecord.completed = true;
    stepRecord.completedAt = Date.now();
    record.history.push({ operation: step.operationLabel, equation: step.result || step.answer.expected });
    record.lastCompletedStep = stepIndex;
    record.currentStep = stepIndex + 1;
    if (record.currentStep >= block.steps.length) {
      var evidence = totalEvidence(record);
      var independent = evidence.attempts === block.steps.length && evidence.hints === 0;
      record.completed = true;
      record.completedAt = Date.now();
      var evidenceRecord = JSON.parse(JSON.stringify(record));
      record.pendingResult = {
        correct: true,
        correctAnswers: block.steps.length,
        totalQuestions: block.steps.length,
        attempts: evidence.attempts,
        answers: { history: record.history.slice() },
        points: Number(block.points) || 10,
        firstTry: independent,
        independent: independent,
        repairedAfterFeedback: evidence.attempts > block.steps.length,
        inputRepaired: evidence.syntax > 0,
        hintsUsed: evidence.hints,
        role: block.role || '',
        misconceptionCodes: evidence.misconceptions,
        evidence: evidenceRecord,
      };
    }
    save(index, record); LessonEngine.render();
  }

  function showHint(index, stepIndex) {
    var block = currentBlock(index);
    if (!block || block.type !== 'equation-step') return;
    saveDraft(index, stepIndex);
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    var hints = block.steps[stepIndex].hints || [];
    record.steps[stepIndex].hintCount = Math.min(hints.length, record.steps[stepIndex].hintCount + 1);
    save(index, record); LessonEngine.render();
  }

  function clear(index, stepIndex) {
    var block = currentBlock(index);
    if (!block || block.type !== 'equation-step') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    var step = record.steps[stepIndex];
    step.draftLatex = ''; step.lastAnswer = ''; step.lastNormalized = ''; step.lastStatus = ''; step.lastFeedback = '';
    save(index, record); LessonEngine.render();
  }

  function complete(index) {
    var record = LessonEngine.getInteractionState(index);
    if (record && record.completed && record.pendingResult) LessonEngine.next(record.pendingResult);
  }

  LessonBlocks.register('equation-step', render);
  if (LessonEngine && LessonEngine.on) {
    LessonEngine.on('afterRender', function(data) {
      if (data.block && data.block.type === 'equation-step') initialize(data.blockIndex, data.block);
    });
  }

  return {
    render: render,
    initialize: initialize,
    selectOperation: selectOperation,
    keySelectOperation: keySelectOperation,
    checkOperation: checkOperation,
    saveDraft: saveDraft,
    submit: submit,
    showHint: showHint,
    clear: clear,
    complete: complete,
  };
})();
