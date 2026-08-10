/* Reusable evidence-aware learning blocks: factor models, worked examples,
   guided retry with progressive hints, and a calm lesson summary. */
window.GuidedLessonBlocks = (function() {
  'use strict';

  var H = window.__BlockHelpers;

  function copy(ru, kk) {
    return typeof ML !== 'undefined' && ML.getLang && ML.getLang() === 'kk' ? kk : ru;
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normalise(value) {
    return String(value === undefined || value === null ? '' : value)
      .trim().toLowerCase().replace(/[−–—]/g, '-').replace(/\s+/g, '').replace(',', '.');
  }

  function currentBlock(index) {
    var state = window.__EngineInternal && window.__EngineInternal.state;
    return state && state.blocks ? state.blocks[index] : null;
  }

  function focusFeedback(index) {
    setTimeout(function() {
      var feedback = document.getElementById('guided-feedback-' + index);
      if (feedback && typeof feedback.focus === 'function') feedback.focus();
    }, 0);
  }

  function tokenList(base, count, className, cancelledCount) {
    var html = '';
    for (var index = 0; index < count; index++) {
      var cancelled = index < (cancelledCount || 0);
      html += '<span class="factor-token ' + className + (cancelled ? ' is-cancelled' : '') + '" style="--factor-index:' + index + '"' +
        (cancelled ? ' aria-label="' + copy('сокращённый множитель ', 'қысқартылған көбейткіш ') + escapeHtml(base) + '"' : '') + '>' +
        escapeHtml(base) + '</span>';
    }
    return html;
  }

  function renderFactorVisual(block) {
    var base = block.base || 'a';
    var left = Math.max(1, Number(block.leftCount) || 1);
    var right = Math.max(1, Number(block.rightCount) || 1);
    var mode = block.operation === 'divide' ? 'divide' : 'multiply';
    var resultCount = mode === 'divide' ? Math.max(0, left - right) : left + right;
    var aria = block.ariaLabel || (mode === 'multiply'
      ? left + copy(' множителя ', ' көбейткіш ') + base + ' + ' + right + copy(' множителя ', ' көбейткіш ') + base + ' = ' + resultCount
      : copy('Из ', '') + left + copy(' множителей ', ' көбейткіштен ') + base + copy(' сокращаем ', ' ') + right + copy(', остаётся ', ' қысқарып, ') + resultCount + copy('', ' қалады'));

    if (mode === 'multiply') {
      return '<div class="factor-model" role="img" aria-label="' + escapeHtml(aria) + '">' +
        '<div class="factor-source-row">' +
          '<div class="factor-group factor-group-a"><span class="factor-count">' + left + '</span><div>' + tokenList(base, left, 'from-a') + '</div></div>' +
          '<span class="factor-operation" aria-hidden="true">·</span>' +
          '<div class="factor-group factor-group-b"><span class="factor-count">' + right + '</span><div>' + tokenList(base, right, 'from-b') + '</div></div>' +
        '</div>' +
        '<div class="factor-arrow" aria-hidden="true">↓</div>' +
        '<div class="factor-result-row"><div>' + tokenList(base, resultCount, 'in-result') + '</div><strong>' + escapeHtml(block.result || (base + '^' + resultCount)) + '</strong></div>' +
        '<div class="factor-count-equation">' + left + ' + ' + right + ' = ' + resultCount + '</div>' +
      '</div>';
    }

    return '<div class="factor-model factor-model-division" role="img" aria-label="' + escapeHtml(aria) + '">' +
      '<div class="factor-fraction">' +
        '<div class="factor-numerator">' + tokenList(base, left, 'from-numerator', right) + '</div>' +
        '<div class="factor-fraction-line" aria-hidden="true"></div>' +
        '<div class="factor-denominator">' + tokenList(base, right, 'from-denominator', right) + '</div>' +
      '</div>' +
      '<div class="factor-arrow" aria-hidden="true">↓</div>' +
      '<div class="factor-result-row"><div>' + tokenList(base, resultCount, 'in-result') + '</div><strong>' + escapeHtml(block.result || (base + '^' + resultCount)) + '</strong></div>' +
      '<div class="factor-count-equation">' + left + ' − ' + right + ' = ' + resultCount + '</div>' +
    '</div>';
  }

  function renderFactorModel(block, ctx) {
    return H.wrap(
      '<div class="py-6">' + H.progress(ctx.index, ctx.total) +
        H.blockBadge(block.badgeLabel || copy('Модель множителей', 'Көбейткіштер моделі')) +
        '<h2 class="mb-3 text-3xl font-extrabold text-slate-900">' + block.title + '</h2>' +
        (block.intro ? '<p class="mb-7 text-lg leading-relaxed text-slate-600">' + block.intro + '</p>' : '') +
        renderFactorVisual(block) +
        (block.explanation ? '<div class="factor-explanation">' + block.explanation + '</div>' : '') +
        '<div class="mt-9 flex justify-end">' + H.btnPrimary(copy('Продолжить', 'Жалғастыру'), 'LessonEngine.next()') + '</div>' +
      '</div>'
    );
  }

  function renderWorkedExample(block, ctx) {
    var steps = (block.steps || []).map(function(step, index) {
      return '<li><span class="worked-step-number">' + (index + 1) + '</span><div>' +
        (step.label ? '<strong>' + step.label + '</strong>' : '') +
        '<span>' + step.text + '</span></div></li>';
    }).join('');
    var conditions = (block.conditions || []).map(function(condition) {
      return '<li>' + condition + '</li>';
    }).join('');
    return H.wrap(
      '<div class="py-6">' + H.progress(ctx.index, ctx.total) +
        H.blockBadge(block.badgeLabel || copy('Разобранный пример', 'Талданған мысал')) +
        '<h2 class="mb-3 text-3xl font-extrabold text-slate-900">' + block.title + '</h2>' +
        (block.intro ? '<p class="mb-6 text-lg leading-relaxed text-slate-600">' + block.intro + '</p>' : '') +
        '<section class="lesson-worked-example" aria-label="' + escapeHtml(block.title) + '">' +
          (block.expression ? '<div class="worked-expression">' + block.expression + '</div>' : '') +
          '<ol class="worked-steps">' + steps + '</ol>' +
          (block.result ? '<div class="worked-result"><span>' + copy('Результат', 'Нәтиже') + '</span><strong>' + block.result + '</strong></div>' : '') +
        '</section>' +
        (block.formula ? '<div class="lesson-rule-box"><span>' + (block.formulaLabel || copy('Правило', 'Ереже')) + '</span><strong>' + block.formula + '</strong></div>' : '') +
        (conditions ? '<div class="lesson-conditions"><strong>' + copy('Когда правило применимо', 'Ереже қашан қолданылады') + '</strong><ul>' + conditions + '</ul></div>' : '') +
        (block.takeaway ? '<p class="worked-takeaway">' + block.takeaway + '</p>' : '') +
        '<div class="mt-9 flex justify-end">' + H.btnPrimary(copy('Продолжить', 'Жалғастыру'), 'LessonEngine.next()') + '</div>' +
      '</div>'
    );
  }

  function optionData(option) {
    return typeof option === 'string' ? { text: option } : (option || {});
  }

  function guidedRecord(block, ctx) {
    var saved = ctx.interactionState || (ctx.savedResult && ctx.savedResult.evidence) || null;
    return saved || {
      blockId: block.id,
      attemptCount: 0,
      hintCount: 0,
      attempts: [],
      misconceptionCodes: [],
      completed: false,
      selectedAnswer: null,
      lastAnswer: null,
      lastFeedback: '',
    };
  }

  function renderGuidedOptions(block, ctx, record) {
    var name = 'guided_' + ctx.index;
    return '<fieldset class="guided-fieldset"' + (record.lastFeedback ? ' aria-describedby="guided-feedback-' + ctx.index + '"' : '') + '>' +
      '<legend class="sr-only">' + escapeHtml(block.question || '') + '</legend>' +
      (block.options || []).map(function(raw, index) {
        var option = optionData(raw);
        var selectedValue = record.selectedAnswer !== null && record.selectedAnswer !== undefined ? record.selectedAnswer : record.lastAnswer;
        var selected = selectedValue !== null && selectedValue !== undefined && Number(selectedValue) === index;
        var checkedResult = record.lastAnswer !== null && record.lastAnswer !== undefined && Number(record.lastAnswer) === index && !!record.lastFeedback;
        var resultClass = checkedResult ? (record.completed ? ' is-correct' : ' is-incorrect') : '';
        return '<label class="lesson-option guided-option' + (selected ? ' is-selected' : '') + resultClass + '">' +
          '<input type="radio" name="' + name + '" value="' + index + '" onchange="GuidedLessonBlocks.select(this,' + ctx.index + ')" onkeydown="GuidedLessonBlocks.keySelect(event,this,' + ctx.index + ')" aria-checked="' + (selected ? 'true' : 'false') + '"' + (selected ? ' checked' : '') + (record.completed ? ' disabled' : '') + '>' +
          '<span>' + option.text + '</span></label>';
      }).join('') + '</fieldset>';
  }

  function select(input, index) {
    var block = currentBlock(index);
    if (!input || !block || block.type !== 'guided-practice' || input.disabled) return;
    document.querySelectorAll('input[name="' + input.name + '"]').forEach(function(option) {
      var chosen = option === input;
      option.checked = chosen;
      option.setAttribute('aria-checked', chosen ? 'true' : 'false');
      var label = option.closest('label');
      if (!label) return;
      label.classList.toggle('is-selected', chosen);
      label.classList.remove('is-correct', 'is-incorrect', 'border-blue-600', 'bg-blue-50');
    });
    var record = LessonEngine.getInteractionState(index) || guidedRecord(block, { interactionState: null, savedResult: null });
    record.selectedAnswer = Number(input.value);
    if (!record.completed && (record.lastAnswer === null || Number(record.lastAnswer) !== Number(input.value))) record.lastFeedback = '';
    LessonEngine.setInteractionState(index, record);
    var feedback = document.getElementById('guided-feedback-' + index);
    if (feedback && !record.lastFeedback) feedback.innerHTML = '';
  }

  function keySelect(event, input, index) {
    if (!event || event.key !== 'Enter' || !input || input.disabled) return;
    event.preventDefault();
    input.checked = true;
    select(input, index);
  }

  function renderGuidedInput(block, ctx, record) {
    return '<label class="guided-input-label" for="guided-input-' + ctx.index + '">' +
      (block.inputLabel ? '<span>' + block.inputLabel + '</span>' : '<span class="sr-only">' + escapeHtml(block.question || '') + '</span>') +
      '<input id="guided-input-' + ctx.index + '" type="text" inputmode="text" autocomplete="off" value="' + escapeHtml(record.lastAnswer || '') + '"' +
        (record.completed ? ' disabled' : '') + (record.lastFeedback ? ' aria-describedby="guided-feedback-' + ctx.index + '"' : '') +
        ' placeholder="' + escapeHtml(block.placeholder || '?') + '"></label>';
  }

  function renderHints(block, record) {
    var hints = block.hints || [];
    if (!hints.length) return '';
    var shown = hints.slice(0, record.hintCount || 0).map(function(hint, index) {
      return '<li><span>H' + (index + 1) + '</span><p>' + hint + '</p></li>';
    }).join('');
    var button = !record.completed && record.hintCount < hints.length
      ? '<button type="button" class="guided-hint-button" onclick="GuidedLessonBlocks.showHint(' + window.__EngineInternal.state.currentIndex + ')">' +
        (record.hintCount ? copy('Следующая подсказка', 'Келесі нұсқау') : copy('Показать подсказку', 'Нұсқауды көрсету')) + '</button>'
      : '';
    return '<div class="guided-hints">' + (shown ? '<ol aria-label="' + copy('Использованные подсказки', 'Қолданылған нұсқаулар') + '">' + shown + '</ol>' : '') + button + '</div>';
  }

  function renderGuidedFeedback(record, index) {
    if (!record.lastFeedback) return '<div id="guided-feedback-' + index + '" class="guided-feedback-slot" aria-live="polite"></div>';
    var correct = record.completed === true;
    return '<div id="guided-feedback-' + index + '" class="guided-feedback ' + (correct ? 'is-correct' : 'is-incorrect') + '" role="' + (correct ? 'status' : 'alert') + '" aria-live="polite" tabindex="-1">' +
      '<strong>' + (correct ? copy('Верно', 'Дұрыс') : copy('Проверьте рассуждение', 'Ойыңызды тексеріңіз')) + '</strong>' +
      '<p>' + record.lastFeedback + '</p></div>';
  }

  function renderGuidedPractice(block, ctx) {
    var record = guidedRecord(block, ctx);
    var response = block.responseType === 'input'
      ? renderGuidedInput(block, ctx, record)
      : renderGuidedOptions(block, ctx, record);
    var action = record.completed
      ? '<button type="button" class="lesson-continue-button" onclick="GuidedLessonBlocks.complete(' + ctx.index + ')">' + copy('Продолжить', 'Жалғастыру') + '</button>'
      : '<button type="button" class="guided-submit-button" onclick="GuidedLessonBlocks.submit(' + ctx.index + ')">' + copy('Проверить', 'Тексеру') + '</button>';
    return H.wrap(
      '<div class="py-6 guided-practice">' + H.progress(ctx.index, ctx.total) +
        H.blockBadge(block.badgeLabel || copy('Проверка понимания', 'Түсінуді тексеру')) +
        (block.title ? '<h2 class="mb-3 text-3xl font-extrabold text-slate-900">' + block.title + '</h2>' : '') +
        (block.prompt ? '<p class="mb-4 text-lg leading-relaxed text-slate-600">' + block.prompt + '</p>' : '') +
        (block.expression ? '<div class="guided-expression">' + block.expression + '</div>' : '') +
        '<h3 class="guided-question">' + block.question + '</h3>' +
        response + renderHints(block, record) + renderGuidedFeedback(record, ctx.index) +
        '<div class="guided-actions">' + (record.attemptCount ? '<span class="guided-attempts">' + copy('Попыток', 'Әрекет') + ': ' + record.attemptCount + '</span>' : '') + action + '</div>' +
      '</div>'
    );
  }

  function selectedAnswer(block, index) {
    if (block.responseType === 'input') {
      var input = document.getElementById('guided-input-' + index);
      return input ? input.value : '';
    }
    var option = document.querySelector('input[name="guided_' + index + '"]:checked');
    return option ? Number(option.value) : null;
  }

  function evaluate(block, answer) {
    if (block.responseType === 'input') {
      var accepted = block.acceptedAnswers || (block.answer !== undefined ? [block.answer] : []);
      return accepted.some(function(value) { return normalise(value) === normalise(answer); });
    }
    return Number(answer) === Number(block.answer);
  }

  function feedbackFor(block, answer, correct) {
    if (correct) return block.successFeedback || copy('Ответ обоснован верно.', 'Жауап дұрыс негізделді.');
    if (block.responseType !== 'input') {
      var option = optionData((block.options || [])[Number(answer)]);
      if (option.feedback) return option.feedback;
    }
    var matches = (block.answerFeedback || []).filter(function(item) {
      return (item.answers || []).some(function(value) { return normalise(value) === normalise(answer); });
    });
    return matches.length ? matches[0].feedback : (block.feedback || copy('Вернитесь к смыслу записи и попробуйте ещё раз.', 'Жазбаның мағынасына оралып, қайта көріңіз.'));
  }

  function misconceptionFor(block, answer) {
    if (block.responseType !== 'input') {
      return optionData((block.options || [])[Number(answer)]).misconception || '';
    }
    var match = (block.answerFeedback || []).find(function(item) {
      return (item.answers || []).some(function(value) { return normalise(value) === normalise(answer); });
    });
    return match ? (match.misconception || '') : '';
  }

  function submit(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'guided-practice') return;
    var answer = selectedAnswer(block, index);
    if (answer === null || normalise(answer) === '') {
      if (typeof UI !== 'undefined' && UI.showToast) UI.showToast(copy('Сначала выберите или введите ответ', 'Алдымен жауапты таңдаңыз немесе енгізіңіз'), 'warning');
      return;
    }
    var record = LessonEngine.getInteractionState(index) || guidedRecord(block, { interactionState: null, savedResult: null });
    var correct = evaluate(block, answer);
    var misconception = correct ? '' : misconceptionFor(block, answer);
    record.attemptCount += 1;
    record.selectedAnswer = answer;
    record.lastAnswer = answer;
    record.lastFeedback = feedbackFor(block, answer, correct);
    record.attempts.push({ answer: answer, correct: correct, misconception: misconception, at: Date.now() });
    if (misconception && record.misconceptionCodes.indexOf(misconception) === -1) record.misconceptionCodes.push(misconception);
    if (correct) {
      var independent = record.attemptCount === 1 && record.hintCount === 0;
      record.completed = true;
      record.completedAt = Date.now();
      record.pendingResult = {
        correct: true,
        correctAnswers: 1,
        totalQuestions: 1,
        attempts: record.attemptCount,
        answers: answer,
        points: Number(block.points) || 10,
        firstTry: independent,
        independent: independent,
        repairedAfterFeedback: record.attemptCount > 1,
        hintsUsed: record.hintCount,
        role: block.role || '',
        misconceptionCodes: record.misconceptionCodes.slice(),
        evidence: {
          blockId: record.blockId,
          attemptCount: record.attemptCount,
          hintCount: record.hintCount,
          attempts: record.attempts.slice(),
          misconceptionCodes: record.misconceptionCodes.slice(),
          completed: true,
          completedAt: record.completedAt,
          lastAnswer: answer,
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
    if (!block || block.type !== 'guided-practice') return;
    var record = LessonEngine.getInteractionState(index) || guidedRecord(block, { interactionState: null, savedResult: null });
    record.hintCount = Math.min((block.hints || []).length, record.hintCount + 1);
    LessonEngine.setInteractionState(index, record);
    LessonEngine.render();
  }

  function complete(index) {
    var record = LessonEngine.getInteractionState(index);
    if (!record || !record.completed || !record.pendingResult) return;
    LessonEngine.next(record.pendingResult);
  }

  function formatTime(seconds) {
    seconds = Math.max(0, Number(seconds) || 0);
    if (seconds < 60) return seconds + copy(' с', ' с');
    return Math.floor(seconds / 60) + copy(' мин ', ' мин ') + (seconds % 60) + copy(' с', ' с');
  }

  function renderLessonSummary(block, ctx) {
    var evidence = ctx.evidence || {};
    var capabilities = (block.capabilities || []).map(function(item) { return '<li>' + item + '</li>'; }).join('');
    var metrics = '';
    if (evidence.assessed > 0) {
      metrics = '<dl class="lesson-evidence-grid">' +
        '<div><dt>' + copy('Самостоятельно', 'Өздігінен') + '</dt><dd>' + evidence.independentlySolved + ' / ' + evidence.assessed + '</dd></div>' +
        '<div><dt>' + copy('Подсказки', 'Нұсқаулар') + '</dt><dd>' + evidence.hintsUsed + '</dd></div>' +
        '<div><dt>' + copy('Исправлено после feedback', 'Кері байланыстан кейін түзетілді') + '</dt><dd>' + evidence.repairedAfterFeedback + '</dd></div>' +
        '<div><dt>' + copy('Время работы', 'Жұмыс уақыты') + '</dt><dd>' + formatTime(ctx.timeSpent) + '</dd></div>' +
      '</dl>';
    }
    return H.wrap(
      '<div class="py-6 lesson-summary">' + H.progress(ctx.index, ctx.total) +
        H.blockBadge(copy('Итог урока', 'Сабақ қорытындысы')) +
        '<h2>' + block.title + '</h2>' +
        (block.description ? '<p class="lesson-summary-description">' + block.description + '</p>' : '') +
        '<section class="lesson-summary-capabilities"><h3>' + copy('Теперь вы можете', 'Енді сіз') + '</h3><ul>' + capabilities + '</ul></section>' +
        metrics +
        '<div class="lesson-summary-actions"><a class="axis-button axis-button-ink" href="dashboard.html">' + copy('К маршруту', 'Маршрутқа оралу') + '</a></div>' +
      '</div>'
    );
  }

  LessonBlocks.register('factor-model', renderFactorModel);
  LessonBlocks.register('worked-example', renderWorkedExample);
  LessonBlocks.register('guided-practice', renderGuidedPractice);
  LessonBlocks.register('lesson-summary', renderLessonSummary);

  return {
    renderFactorModel: renderFactorModel,
    renderWorkedExample: renderWorkedExample,
    renderGuidedPractice: renderGuidedPractice,
    renderLessonSummary: renderLessonSummary,
    submit: submit,
    select: select,
    keySelect: keySelect,
    showHint: showHint,
    complete: complete,
  };
})();
