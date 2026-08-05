/* Isolated renderer for the algebra-expressions pedagogical experiment. */
window.DecisionExperiment = (function() {
  'use strict';

  var STORAGE_PREFIX = 'mathlogic_experiment_';
  var STORE_VERSION = 1;

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function storageKey(experimentId) {
    return STORAGE_PREFIX + String(experimentId || 'decision').replace(/[^a-z0-9_-]/gi, '_');
  }

  function readStore(experimentId) {
    try {
      var raw = localStorage.getItem(storageKey(experimentId));
      var parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || parsed.version !== STORE_VERSION || !parsed.runs) {
        return { version: STORE_VERSION, experimentId: experimentId, runs: {}, latestRunId: null };
      }
      return parsed;
    } catch (error) {
      return { version: STORE_VERSION, experimentId: experimentId, runs: {}, latestRunId: null };
    }
  }

  function writeStore(experimentId, store) {
    try {
      localStorage.setItem(storageKey(experimentId), JSON.stringify(store));
      return true;
    } catch (error) {
      return false;
    }
  }

  function engineState() {
    return window.__EngineInternal && window.__EngineInternal.state;
  }

  function runId() {
    var state = engineState();
    return String(state && state.startedAt ? state.startedAt : Date.now());
  }

  function ensureRun(experimentId) {
    var store = readStore(experimentId);
    var id = runId();
    if (!store.runs[id]) {
      var state = engineState();
      store.runs[id] = {
        id: id,
        lessonId: state ? state.lessonId : null,
        repeatMode: !!(state && state.repeatMode),
        startedAt: Number(id) || Date.now(),
        blocks: {},
        updatedAt: Date.now(),
      };
      var ids = Object.keys(store.runs).sort(function(a, b) {
        return Number(store.runs[b].updatedAt) - Number(store.runs[a].updatedAt);
      });
      ids.slice(4).forEach(function(oldId) { delete store.runs[oldId]; });
    }
    store.latestRunId = id;
    store.runs[id].updatedAt = Date.now();
    writeStore(experimentId, store);
    return { store: store, run: store.runs[id] };
  }

  function saveRun(experimentId, store, run) {
    run.updatedAt = Date.now();
    store.runs[run.id] = run;
    store.latestRunId = run.id;
    writeStore(experimentId, store);
  }

  function findOption(options, id) {
    return (options || []).find(function(option) { return option.id === id; }) || null;
  }

  function normaliseAnswer(value) {
    return String(value === undefined || value === null ? '' : value)
      .toLowerCase()
      .replace(/[−–—]/g, '-')
      .replace(/[·×*]/g, '')
      .replace(/\s+/g, '');
  }

  function unique(values) {
    return values.filter(function(value, index) { return value && values.indexOf(value) === index; });
  }

  function answerEvaluation(block, answer) {
    var normalised = normaliseAnswer(answer);
    var accepted = (block.acceptedAnswers || []).map(normaliseAnswer);
    if (accepted.indexOf(normalised) > -1) return { correct: true, misconceptionCode: null, feedback: '' };
    var match = (block.answerMisconceptions || []).find(function(item) {
      return (item.patterns || []).map(normaliseAnswer).indexOf(normalised) > -1;
    });
    return {
      correct: false,
      misconceptionCode: match ? match.misconceptionCode : block.fallbackMisconceptionCode,
      feedback: match ? match.feedback : block.fallbackFeedback,
    };
  }

  function evaluate(block, selection) {
    selection = selection || {};
    var step = findOption(block.stepOptions, selection.stepId);
    var reason = findOption(block.reasonOptions, selection.reasonId);
    var answer = answerEvaluation(block, selection.answer);
    var missing = [];
    if (!step) missing.push('step');
    if (!reason) missing.push('reason');
    if (!normaliseAnswer(selection.answer)) missing.push('answer');
    if (missing.length) return { complete: false, missing: missing, correct: false, misconceptionCodes: [] };

    var issues = [];
    if (!step.correct) issues.push({ code: step.misconceptionCode, feedback: step.feedback });
    if (!reason.correct) issues.push({ code: reason.misconceptionCode, feedback: reason.feedback });
    if (!answer.correct) issues.push({ code: answer.misconceptionCode, feedback: answer.feedback });
    return {
      complete: true,
      missing: [],
      correct: issues.length === 0,
      misconceptionCodes: unique(issues.map(function(issue) { return issue.code; })),
      feedback: issues.length ? issues[0].feedback : block.successFeedback,
      stepCorrect: !!step.correct,
      reasonCorrect: !!reason.correct,
      answerCorrect: answer.correct,
    };
  }

  function copy(key) {
    var kk = typeof ML !== 'undefined' && ML.getLang && ML.getLang() === 'kk';
    var values = {
      badge: ['Решение с обоснованием', 'Негізделген шешім'],
      hint: ['Подсказка уровня 1', '1-деңгейлі нұсқау'],
      nextHint: ['Показать следующую подсказку', 'Келесі нұсқауды көрсету'],
      check: ['Проверить связку', 'Байланысты тексеру'],
      continue: ['Продолжить', 'Жалғастыру'],
      chooseAll: ['Выбери первый шаг и причину, затем введи ответ', 'Алғашқы қадам мен себепті таңдап, содан кейін жауапты жаз'],
      attempts: ['Попыток', 'Әрекет саны'],
      hints: ['Подсказок', 'Нұсқау саны'],
    };
    return values[key] ? values[key][kk ? 1 : 0] : key;
  }

  function selectedValue(name) {
    var input = document.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : '';
  }

  function currentBlock(index) {
    var state = engineState();
    return state && state.blocks ? state.blocks[index] : null;
  }

  function recordFor(block, savedResult) {
    var bundle = ensureRun(block.experimentId);
    var record = bundle.run.blocks[block.id];
    if (!record && savedResult && savedResult.evidence) {
      record = JSON.parse(JSON.stringify(savedResult.evidence));
      bundle.run.blocks[block.id] = record;
      saveRun(block.experimentId, bundle.store, bundle.run);
    }
    return { bundle: bundle, record: record || null };
  }

  function optionList(options, name, selected, disabled) {
    return (options || []).map(function(option) {
      var checked = option.id === selected;
      return '<label class="lesson-option flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-blue-300' +
        (checked ? ' is-selected border-blue-600 bg-blue-50' : '') + '">' +
        '<input type="radio" name="' + escapeHtml(name) + '" value="' + escapeHtml(option.id) + '" onchange="DecisionExperiment.select(this)" class="mt-1 h-5 w-5 accent-blue-600"' +
        (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
        '<span class="text-base font-bold leading-snug text-slate-700">' + option.text + '</span>' +
        '</label>';
    }).join('');
  }

  function select(input) {
    if (!input || !input.name) return;
    document.querySelectorAll('input[name="' + input.name + '"]').forEach(function(option) {
      var label = option.closest('label');
      if (!label) return;
      label.classList.toggle('is-selected', option.checked);
      label.classList.toggle('border-blue-600', option.checked);
      label.classList.toggle('bg-blue-50', option.checked);
    });
  }

  function feedbackHtml(record, block) {
    if (!record) return '';
    if (record.completed) {
      return '<div class="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800" role="status">' +
        '<strong class="block mb-1">✓</strong><span>' + escapeHtml(block.successFeedback || '') + '</span></div>';
    }
    if (!record.lastFeedback) return '';
    return '<div class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900" role="alert">' +
      '<strong class="mb-1 block font-extrabold">↻</strong><span>' + escapeHtml(record.lastFeedback) + '</span></div>';
  }

  function render(block, ctx) {
    var H = window.__BlockHelpers;
    var data = recordFor(block, ctx.savedResult);
    var record = data.record;
    var selection = record && record.lastSelection ? record.lastSelection : {};
    var disabled = !!(record && record.completed);
    var stepName = 'decision_step_' + ctx.index;
    var reasonName = 'decision_reason_' + ctx.index;
    var hintCount = record ? record.hintCount || 0 : 0;
    var hintsList = block.hints || (block.hint ? [block.hint] : []);
    var attempts = record ? record.attemptCount || 0 : 0;
    var hints = record ? record.hintCount || 0 : 0;
    var action = disabled
      ? '<button type="button" onclick="DecisionExperiment.complete(' + ctx.index + ')" class="lesson-continue-button rounded-2xl bg-slate-900 px-10 py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-slate-800">' + copy('continue') + '</button>'
      : '<button type="button" onclick="DecisionExperiment.submit(' + ctx.index + ')" class="rounded-2xl bg-slate-900 px-10 py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-slate-800">' + copy('check') + '</button>';

    return H.wrap(
      '<div class="py-8">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge(copy('badge')) +
        '<h2 class="mb-2 text-2xl font-extrabold text-slate-900">' + block.title + '</h2>' +
        '<p class="mb-6 text-lg leading-relaxed text-slate-600">' + block.prompt + '</p>' +
        (block.visual || '') +
        H.formulaBlock(block.expression) +
        '<div class="mb-8 grid gap-7">' +
          '<fieldset><legend class="mb-3 text-base font-extrabold text-slate-900">1 · ' + block.stepQuestion + '</legend>' +
            '<div class="grid gap-3">' + optionList(block.stepOptions, stepName, selection.stepId, disabled) + '</div></fieldset>' +
          '<fieldset><legend class="mb-3 text-base font-extrabold text-slate-900">2 · ' + block.reasonQuestion + '</legend>' +
            '<div class="grid gap-3">' + optionList(block.reasonOptions, reasonName, selection.reasonId, disabled) + '</div></fieldset>' +
          '<label class="block"><span class="mb-3 block text-base font-extrabold text-slate-900">3 · ' + block.answerQuestion + '</span>' +
            '<input id="decision-answer-' + ctx.index + '" type="text" inputmode="text" autocomplete="off" value="' + escapeHtml(selection.answer || '') + '"' +
            (disabled ? ' disabled' : '') + ' required aria-required="true" class="h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 font-mono text-xl font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" placeholder="…"></label>' +
        '</div>' +
        '<div class="mb-5 flex flex-wrap items-center justify-between gap-3">' +
          (hintCount
            ? '<ol class="max-w-xl border-y border-slate-200 text-sm font-medium text-slate-700" role="status">' + hintsList.slice(0, hintCount).map(function(hint, hintIndex) {
                return '<li class="border-t border-slate-200 py-3 first:border-t-0"><span class="mr-2 font-mono text-xs text-slate-500">H' + (hintIndex + 1) + '</span>' + hint + '</li>';
              }).join('') + '</ol>'
            : '') +
          (!disabled && hintCount < hintsList.length
            ? '<button type="button" onclick="DecisionExperiment.showHint(' + ctx.index + ')" class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100">' + (hintCount ? copy('nextHint') : copy('hint')) + '</button>'
            : '') +
          '<span class="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">' + copy('attempts') + ': ' + attempts + ' · ' + copy('hints') + ': ' + hints + '</span>' +
        '</div>' +
        '<div id="decision-feedback-' + ctx.index + '">' + feedbackHtml(record, block) + '</div>' +
        '<div class="flex justify-end">' + action + '</div>' +
      '</div>'
    );
  }

  function showToast(message) {
    if (typeof UI !== 'undefined' && UI.showToast) UI.showToast(message, 'warning');
    else if (typeof alert === 'function') alert(message);
  }

  function showHint(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'decision') return;
    var data = recordFor(block, null);
    var record = data.record || {
      blockId: block.id,
      role: block.role,
      attemptCount: 0,
      hintCount: 0,
      attempts: [],
      misconceptionCodes: [],
      completed: false,
    };
    var hints = block.hints || (block.hint ? [block.hint] : []);
    record.hintCount = Math.min(hints.length || 1, (record.hintCount || 0) + 1);
    data.bundle.run.blocks[block.id] = record;
    saveRun(block.experimentId, data.bundle.store, data.bundle.run);
    LessonEngine.render();
  }

  function submit(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'decision') return;
    var stepId = selectedValue('decision_step_' + index);
    var reasonId = selectedValue('decision_reason_' + index);
    var input = document.getElementById('decision-answer-' + index);
    var answer = input ? input.value : '';
    var selection = { stepId: stepId, reasonId: reasonId, answer: answer };
    var result = evaluate(block, selection);
    if (!result.complete) {
      showToast(copy('chooseAll'));
      return;
    }

    var data = recordFor(block, null);
    var record = data.record || {
      blockId: block.id,
      role: block.role,
      attemptCount: 0,
      hintCount: 0,
      attempts: [],
      misconceptionCodes: [],
      completed: false,
    };
    record.attemptCount += 1;
    var attempt = {
      number: record.attemptCount,
      stepId: stepId,
      reasonId: reasonId,
      answer: answer,
      correct: result.correct,
      independent: record.attemptCount === 1 && record.hintCount === 0,
      misconceptionCodes: result.misconceptionCodes.slice(),
      at: Date.now(),
    };
    record.attempts.push(attempt);
    if (!record.firstAttempt) record.firstAttempt = attempt;
    if (attempt.independent && !record.firstIndependentAttempt) record.firstIndependentAttempt = attempt;
    record.lastSelection = selection;
    record.lastFeedback = result.feedback || '';
    record.misconceptionCodes = unique(record.misconceptionCodes.concat(result.misconceptionCodes));

    if (result.correct) {
      var independentSuccess = !!(record.firstIndependentAttempt && record.firstIndependentAttempt.correct);
      var completionCounts = block.hintsDoNotPenalize === true;
      record.completed = true;
      record.completedAt = Date.now();
      record.repairedAfterFeedback = record.attemptCount > 1 && record.firstAttempt && record.firstAttempt.correct === false;
      record.transferSucceeded = block.role === 'transfer';
      record.transferFirstTry = block.role === 'transfer' && independentSuccess;
      record.pendingResult = {
        correct: completionCounts ? true : independentSuccess,
        correctAnswers: completionCounts || independentSuccess ? 1 : 0,
        totalQuestions: 1,
        attempts: record.attemptCount,
        answers: { stepId: stepId, reasonId: reasonId, answer: answer },
        points: completionCounts || independentSuccess ? (block.points || 10) : 0,
        firstTry: independentSuccess,
        repairedAfterFeedback: record.repairedAfterFeedback,
        hintsUsed: record.hintCount,
        role: block.role || '',
        evidence: JSON.parse(JSON.stringify(record)),
      };
    }

    data.bundle.run.blocks[block.id] = record;
    saveRun(block.experimentId, data.bundle.store, data.bundle.run);
    LessonEngine.render();
  }

  function complete(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'decision') return;
    var data = recordFor(block, null);
    var record = data.record;
    if (!record || !record.completed || !record.pendingResult) return;
    var result = JSON.parse(JSON.stringify(record.pendingResult));
    delete result.evidence.pendingResult;
    LessonEngine.next(result);
  }

  function labelFor(options, id) {
    var option = findOption(options, id);
    return option ? option.text : '';
  }

  function renderSummary(experimentId, labels) {
    var data = ensureRun(experimentId);
    var state = engineState();
    var blocks = state && state.blocks ? state.blocks.filter(function(block) {
      return block.type === 'decision' && block.experimentId === experimentId;
    }) : [];
    labels = labels || {};
    var rows = blocks.map(function(block, index) {
      var record = data.run.blocks[block.id];
      var first = record && (record.firstAttempt || record.firstIndependentAttempt);
      return '<tr class="border-t border-slate-200 align-top">' +
        '<td class="py-3 pr-4 font-mono text-xs font-bold text-slate-500">0' + (index + 1) + '</td>' +
        '<td class="py-3 pr-4 text-sm font-semibold text-slate-800">' + escapeHtml(first ? labelFor(block.stepOptions, first.stepId) : labels.unavailable) + '</td>' +
        '<td class="py-3 text-sm text-slate-600">' + escapeHtml(first ? labelFor(block.reasonOptions, first.reasonId) : labels.unavailable) + '</td>' +
        '</tr>';
    }).join('');
    var records = blocks.map(function(block) { return data.run.blocks[block.id]; }).filter(Boolean);
    var repaired = unique([].concat.apply([], records.filter(function(record) {
      return record.repairedAfterFeedback;
    }).map(function(record) { return record.misconceptionCodes || []; })));
    var hintCount = records.reduce(function(sum, record) { return sum + (record.hintCount || 0); }, 0);
    var transfer = records.find(function(record) { return record.role === 'transfer'; });
    var transferText = labels.notCompleted;
    if (transfer && transfer.transferSucceeded) {
      transferText = transfer.transferFirstTry ? labels.firstTry : labels.afterFeedback;
    }

    return '<section class="mx-auto mb-8 max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm">' +
      '<h3 class="mb-4 text-xl font-extrabold text-slate-900">' + escapeHtml(labels.heading || '') + '</h3>' +
      '<div class="overflow-x-auto"><table class="w-full min-w-[520px]">' +
        '<thead><tr class="text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">' +
          '<th class="pb-2 pr-4">' + escapeHtml(labels.task || '') + '</th>' +
          '<th class="pb-2 pr-4">' + escapeHtml(labels.firstStep || '') + '</th>' +
          '<th class="pb-2">' + escapeHtml(labels.reason || '') + '</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<dl class="mt-5 grid gap-3 sm:grid-cols-3">' +
        '<div class="rounded-2xl bg-slate-50 p-4"><dt class="text-xs font-bold uppercase tracking-wider text-slate-500">' + escapeHtml(labels.repaired || '') + '</dt><dd class="mt-2 break-words font-mono text-sm font-bold text-slate-800">' + escapeHtml(repaired.length ? repaired.join(', ') : labels.none) + '</dd></div>' +
        '<div class="rounded-2xl bg-slate-50 p-4"><dt class="text-xs font-bold uppercase tracking-wider text-slate-500">' + escapeHtml(labels.hints || '') + '</dt><dd class="mt-2 font-mono text-lg font-bold text-slate-800">' + hintCount + '</dd></div>' +
        '<div class="rounded-2xl bg-slate-50 p-4"><dt class="text-xs font-bold uppercase tracking-wider text-slate-500">' + escapeHtml(labels.transfer || '') + '</dt><dd class="mt-2 text-sm font-bold text-slate-800">' + escapeHtml(transferText || '') + '</dd></div>' +
      '</dl></section>';
  }

  function currentEvidence(experimentId) {
    return JSON.parse(JSON.stringify(ensureRun(experimentId).run));
  }

  if (typeof LessonBlocks !== 'undefined' && LessonBlocks.register) {
    LessonBlocks.register('decision', render);
  }

  return {
    render: render,
    submit: submit,
    complete: complete,
    showHint: showHint,
    select: select,
    renderSummary: renderSummary,
    currentEvidence: currentEvidence,
    evaluate: evaluate,
    _normaliseAnswer: normaliseAnswer,
    _readStore: readStore,
  };
})();
