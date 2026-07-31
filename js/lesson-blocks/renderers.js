window.__BlockRenderers = (function() {
  var H = window.__BlockHelpers;

  var _selected = {};
  var _pendingResult = null;

  /* ------------------------------------------
     RADIO OPTIONS RENDERER (shared)
     ------------------------------------------ */

  function _renderOptions(options, name, repeatMode, savedValue) {
    return options.map(function(opt, i) {
      var selected = '';
      if (repeatMode && savedValue !== null && parseInt(savedValue) === i) {
        selected = ' border-blue-600 bg-blue-50';
      }
      return '<label class="flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group' + selected + '">' +
        '<input type="radio" name="' + name + '" value="' + i + '" onchange="LessonBlocks._selectOption(this)"' +
        (repeatMode ? ' disabled' : '') +
        ' class="w-5 h-5 text-blue-600 accent-blue-600">' +
        '<span class="text-lg font-bold text-slate-700 group-hover:text-slate-900">' + opt + '</span>' +
        '</label>';
    }).join('');
  }

  /* ------------------------------------------
     HERO
     ------------------------------------------ */

  function renderHero(block, ctx) {
    var teaserHtml = block.teaser
      ? '<p class="text-lg text-blue-600 font-bold mt-6">' + block.teaser + '</p>'
      : '';

    return H.wrap(
      '<div class="text-center py-12">' +
        H.progress(ctx.index, ctx.total) +
        (block.icon ? '<div class="text-7xl mb-6 animate-float">' + block.icon + '</div>' : '') +
        (block.visual || '') +
        '<h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mt-6">' +
          block.title +
        '</h1>' +
        (block.subtitle ? '<p class="text-xl text-slate-500 mt-4 font-medium max-w-xl mx-auto">' + block.subtitle + '</p>' : '') +
        teaserHtml +
        '<div class="mt-10">' +
          H.btnPrimary('\u041D\u0430\u0447\u0430\u0442\u044C', 'LessonEngine.next()') +
        '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     GOAL
     ------------------------------------------ */

  function renderGoal(block, ctx) {
    return H.wrap(
      '<div class="py-8">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge('\u0426\u0435\u043B\u044C \u0443\u0440\u043E\u043A\u0430') +
        '<div class="flex items-start gap-5 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">' +
          '<div class="text-4xl shrink-0">' + (block.icon || '\uD83C\uDFAF') + '</div>' +
          '<div>' +
            '<h2 class="text-2xl font-extrabold text-slate-900 mb-2">' + block.title + '</h2>' +
            '<p class="text-lg text-slate-600 font-medium">' + block.text + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="mt-10 flex justify-end">' +
          H.btnPrimary('\u041F\u043E\u043D\u044F\u0442\u043D\u043E', 'LessonEngine.next()') +
        '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     WARMUP
     ------------------------------------------ */

  function renderWarmup(block, ctx) {
    var name = 'warmup_' + ctx.index;
    var optionsHtml = _renderOptions(block.options || [], name, false, null);

    return H.wrap(
      '<div class="py-8">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge('\u0420\u0430\u0437\u043C\u0438\u043D\u043A\u0430') +
        '<h2 class="text-2xl font-extrabold text-slate-900 mb-2">' + (block.title || '\u041F\u0440\u043E\u0431\u0443\u0435\u043C \u0440\u0430\u0437\u043E\u0433\u0440\u0435\u0442\u044C\u0441\u044F') + '</h2>' +
        (block.question ? '<p class="text-lg text-slate-600 mb-8">' + block.question + '</p>' : '') +
        '<div class="space-y-3 mb-8" id="warmup-options-' + ctx.index + '">' +
          optionsHtml +
        '</div>' +
        '<div id="warmup-feedback-' + ctx.index + '"></div>' +
        '<div class="flex justify-end">' +
          '<button onclick="LessonBlocks._submitWarmup(\'' + name + '\', ' + block.answer + ', 5)" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 px-10 rounded-2xl transition-all shadow-md">\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C</button>' +
        '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     ANCHOR
     ------------------------------------------ */

  function renderAnchor(block, ctx) {
    return H.wrap(
      '<div class="py-8">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge('\u041F\u043E\u0434\u0443\u043C\u0430\u0439\u0442\u0435') +
        (block.visual ? '<div class="mb-8 flex justify-center">' + block.visual + '</div>' : '') +
        '<h2 class="text-2xl font-extrabold text-slate-900 mb-4">' + block.title + '</h2>' +
        '<p class="text-lg text-slate-600 leading-relaxed mb-6">' + block.problem + '</p>' +
        (block.question ? '<p class="text-lg font-bold text-blue-700 bg-blue-50 p-4 rounded-2xl border border-blue-100">' + block.question + '</p>' : '') +
        '<div class="mt-10 flex justify-end">' +
          H.btnPrimary('\u0414\u0430\u043B\u0435\u0435', 'LessonEngine.next()') +
        '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     THEORY
     ------------------------------------------ */

  function _renderExamples(examples) {
    if (!examples || examples.length === 0) return '';
    var items = examples.map(function(ex, i) {
      var stepsHtml = (ex.steps || []).map(function(s) {
        return '<li class="text-slate-700"><span class="font-bold">' + s.label + '</span> ' + s.text + '</li>';
      }).join('');
      return '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">' +
        '<div class="flex items-center gap-3 mb-4"><span class="px-3 py-1.5 bg-slate-100 text-slate-600 font-mono font-bold text-sm rounded-lg border border-slate-200">' + (i + 1) + '-\u043C\u044B\u0441\u0430\u043B</span>' +
        '<span class="font-mono text-xl font-bold text-slate-900">' + (ex.equation || '') + '</span></div>' +
        '<ul class="space-y-2 pl-2">' + stepsHtml + '</ul>' +
        (ex.result ? '<div class="mt-3 font-mono font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">' + ex.result + '</div>' : '') +
        '</div>';
    }).join('');

    return '<h3 class="text-2xl font-extrabold text-slate-900 mt-10 mb-6">\u041F\u0440\u0438\u043C\u0435\u0440\u044B</h3><div class="space-y-4">' + items + '</div>';
  }

  function _renderFormulaBox(block) {
    if (!block.formula) return '';
    return '<div class="my-8 p-8 bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">' +
      '<div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-sky-400"></div>' +
      '<span class="text-blue-600 text-xs font-extrabold uppercase tracking-widest block mb-3">' + (block.formulaLabel || '\u0424\u043E\u0440\u043C\u0443\u043B\u0430') + '</span>' +
      '<div class="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">' + block.formula + '</div>' +
      '</div>';
  }

  function _renderTheoryContent(content) {
    if (!content) return '';
    return content.map(function(p) {
      if (typeof p === 'string') return '<p class="text-[1.15rem] text-slate-700 leading-relaxed">' + p + '</p>';
      if (p.type === 'highlight') return '<div class="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-amber-900 font-bold">' + p.text + '</div>';
      if (p.type === 'note') return '<div class="bg-blue-50 border border-blue-100 p-5 rounded-2xl text-blue-800 font-medium flex items-start gap-3"><span class="text-xl shrink-0">\uD83D\uDCCD</span><span>' + p.text + '</span></div>';
      return '';
    }).join('');
  }

  function renderTheory(block, ctx) {
    return H.wrap(
      '<div class="py-4">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge('\u0422\u0435\u043E\u0440\u0438\u044F') +
        '<h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">' + block.title + '</h2>' +
        _renderTheoryContent(block.content) +
        _renderFormulaBox(block) +
        _renderExamples(block.examples) +
        '<div class="mt-10 flex justify-end">' +
          H.btnPrimary('\u042F\u0441\u043D\u043E', 'LessonEngine.next()') +
        '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     QUIZ
     ------------------------------------------ */

  function _renderQuizFeedback(block, ctx) {
    if (ctx.repeatMode && ctx.savedResult) {
      return H.feedbackBlock(ctx.savedResult.correct, ctx.savedResult.explanation || block.explanation);
    }
    return '';
  }

  function _renderQuizButton(name, block, ctx) {
    if (ctx.repeatMode) {
      return H.btnPrimary('\u0414\u0430\u043B\u0435\u0435', 'LessonEngine.next()');
    }
    var escapedExplanation = (block.explanation || '').replace(/'/g, "\\'");
    return '<button onclick="LessonBlocks._submitQuiz(\'' + name + '\', ' + block.answer + ', \'' + escapedExplanation + '\', 10)" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 px-10 rounded-2xl transition-all shadow-md">\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C</button>';
  }

  function renderQuiz(block, ctx) {
    var name = 'quiz_' + ctx.index;
    var savedValue = ctx.repeatMode && ctx.savedResult ? ctx.savedResult.answers : null;
    var optionsHtml = _renderOptions(block.options || [], name, ctx.repeatMode, savedValue);

    return H.wrap(
      '<div class="py-8">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge('\u0412\u043E\u043F\u0440\u043E\u0441') +
        '<h2 class="text-2xl font-extrabold text-slate-900 mb-2">' + (block.question || '') + '</h2>' +
        (block.hint ? '<div class="lesson-hint mb-6"><button type="button" class="lesson-hint-toggle" onclick="this.nextElementSibling.hidden=false;this.hidden=true">Показать подсказку</button><p hidden class="text-sm text-slate-500 mt-2" role="status">' + block.hint + '</p></div>' : '') +
        (block.equation ? H.formulaBlock(block.equation) : '') +
        '<div class="space-y-3 mb-8">' + optionsHtml + '</div>' +
        '<div id="quiz-feedback-' + ctx.index + '">' + _renderQuizFeedback(block, ctx) + '</div>' +
        '<div class="flex justify-end">' + _renderQuizButton(name, block, ctx) + '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     INPUT
     ------------------------------------------ */

  function _renderInputFields(fields, name, repeatMode, savedResult) {
    return (fields || []).map(function(field, i) {
      var val = '';
      if (repeatMode && savedResult && savedResult.values) {
        val = savedResult.values[i] || '';
      }
      return '<div class="flex items-center gap-4">' +
        (field.label ? '<span class="text-xl font-mono font-bold text-slate-500">' + field.label + '</span>' : '') +
        '<input type="' + (field.type || 'number') + '" id="' + name + '_' + i + '" value="' + val + '" ' +
        (repeatMode && savedResult ? 'disabled' : '') +
        ' class="w-28 h-16 bg-white text-center text-2xl font-bold font-mono border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl outline-none shadow-sm transition-all text-slate-900" placeholder="' + (field.placeholder || '') + '">' +
        '</div>';
    }).join('');
  }

  function _renderInputButton(name, block, ctx) {
    if (ctx.repeatMode) {
      return H.btnPrimary('\u0414\u0430\u043B\u0435\u0435', 'LessonEngine.next()');
    }
    var escapedExplanation = (block.explanation || '').replace(/'/g, "\\'");
    return '<button onclick="LessonBlocks._checkInput(\'' + name + '\', ' + JSON.stringify(block.answer) + ', \'' + escapedExplanation + '\', ' + (block.unordered === true) + ')" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 px-10 rounded-2xl transition-all shadow-md">\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C</button>';
  }

  function renderInput(block, ctx) {
    var name = 'input_' + ctx.index;
    var fieldsHtml = _renderInputFields(block.fields, name, ctx.repeatMode, ctx.savedResult);

    return H.wrap(
      '<div class="py-8">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge('\u0417\u0430\u0434\u0430\u0447\u0430') +
        '<h2 class="text-2xl font-extrabold text-slate-900 mb-2">' + (block.question || '') + '</h2>' +
        (block.equation ? H.formulaBlock(block.equation) : '') +
        '<div class="flex justify-center items-center gap-6 mb-8 flex-wrap">' + fieldsHtml + '</div>' +
        '<div id="input-feedback-' + ctx.index + '">' + (ctx.repeatMode && ctx.savedResult ? H.feedbackBlock(ctx.savedResult.correct, ctx.savedResult.explanation) : '') + '</div>' +
        '<div class="flex justify-end">' + _renderInputButton(name, block, ctx) + '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     MISTAKE
     ------------------------------------------ */

  function renderMistake(block, ctx) {
    return H.wrap(
      '<div class="py-8">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge('\u0422\u0438\u043F\u0438\u0447\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430') +
        '<h2 class="text-2xl font-extrabold text-slate-900 mb-2">' + (block.title || '\u0413\u0434\u0435 \u043E\u0448\u0438\u0431\u043A\u0430?') + '</h2>' +
        (block.problem ? '<p class="text-lg text-slate-600 mb-6">' + block.problem + '</p>' : '') +
        '<div class="bg-rose-50 border-2 border-rose-200 p-6 rounded-2xl mb-6">' +
          '<div class="text-sm font-extrabold uppercase tracking-wider text-rose-600 mb-3">\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E</div>' +
          '<div class="font-mono text-2xl font-bold text-rose-800">' + block.wrongSolution + '</div>' +
        '</div>' +
        '<button onclick="this.nextElementSibling.classList.toggle(\'hidden\'); this.classList.add(\'hidden\')" class="mb-6 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 transition-all">\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u0435</button>' +
        '<div class="hidden bg-emerald-50 border-2 border-emerald-200 p-6 rounded-2xl mb-6">' +
          '<div class="text-sm font-extrabold uppercase tracking-wider text-emerald-600 mb-3">\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E</div>' +
          '<div class="font-mono text-2xl font-bold text-emerald-800">' + block.correctSolution + '</div>' +
          (block.explanation ? '<div class="mt-4 text-emerald-700 font-medium">' + block.explanation + '</div>' : '') +
        '</div>' +
        '<div class="mt-6 flex justify-end">' +
          H.btnPrimary('\u041F\u043E\u043D\u044F\u0442\u043D\u043E', 'LessonEngine.next()') +
        '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     SANDBOX
     ------------------------------------------ */

  function _renderSandboxParams(params, index) {
    return (params || []).map(function(param, i) {
      return '<div class="flex items-center gap-4">' +
        '<label class="text-sm font-bold text-slate-600 w-20">' + param.label + '</label>' +
        '<input type="range" min="' + (param.min || -10) + '" max="' + (param.max || 10) + '" value="' + (param.default || 0) + '" ' +
        'oninput="LessonBlocks._updateSandbox(\'' + index + '\')" ' +
        'id="sandbox-param-' + index + '-' + i + '" ' +
        'class="flex-1 accent-blue-600">' +
        '<span id="sandbox-val-' + index + '-' + i + '" class="text-sm font-mono font-bold text-slate-700 w-10 text-right">' + (param.default || 0) + '</span>' +
        '</div>';
    }).join('');
  }

  function renderSandbox(block, ctx) {
    var paramsHtml = _renderSandboxParams(block.params, ctx.index);

    return H.wrap(
      '<div class="py-8">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge('\u042D\u043A\u0441\u043F\u0435\u0440\u0438\u043C\u0435\u043D\u0442') +
        '<h2 class="text-2xl font-extrabold text-slate-900 mb-2">' + (block.title || '\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0441\u0430\u043C\u0438') + '</h2>' +
        (block.description ? '<p class="text-lg text-slate-600 mb-6">' + block.description + '</p>' : '') +
        (block.task ? '<p class="text-base font-bold text-blue-700 bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6">' + block.task + '</p>' : '') +
        '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 mb-6">' +
          paramsHtml +
        '</div>' +
        '<div id="sandbox-output-' + ctx.index + '" class="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center font-mono text-2xl font-bold text-slate-900 min-h-[60px]">' +
          (block.initialOutput || '') +
        '</div>' +
        '<div class="mt-8 flex justify-end">' +
          H.btnPrimary('\u0413\u043E\u0442\u043E\u0432\u043E', 'LessonEngine.next()') +
        '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     CHALLENGE
     ------------------------------------------ */

  function _renderChallengeQuizTask(task, i, ctx, index) {
    var name = 'challenge_q_' + index + '_' + i;
    var opts = (task.options || []).map(function(o, oi) {
      return '<label class="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all cursor-pointer">' +
        '<input type="radio" name="' + name + '" value="' + oi + '" data-task-index="' + i + '" class="w-4 h-4 accent-blue-600"' +
        (ctx.repeatMode ? ' disabled' : '') +
        '>' +
        '<span class="text-sm font-bold text-slate-700">' + o + '</span></label>';
    }).join('');
    return '<div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">' +
      '<div class="flex items-center justify-between mb-3">' +
      '<span class="text-xs font-extrabold text-slate-400 uppercase">\u0417\u0430\u0434\u0430\u043D\u0438\u0435 ' + (i + 1) + '</span>' +
      _renderTaskCheck(task, i, ctx) +
      '</div>' +
      '<p class="font-bold text-slate-900 mb-3">' + task.question + '</p>' +
      '<div class="space-y-2">' + opts + '</div>' +
      '</div>';
  }

  function _renderChallengeInputTask(task, i, ctx) {
    return '<div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">' +
      '<div class="flex items-center justify-between mb-3">' +
      '<span class="text-xs font-extrabold text-slate-400 uppercase">\u0417\u0430\u0434\u0430\u043D\u0438\u0435 ' + (i + 1) + '</span>' +
      _renderTaskCheck(task, i, ctx) +
      '</div>' +
      '<p class="font-bold text-slate-900 mb-3">' + task.question + '</p>' +
      '<input type="text" inputmode="decimal" data-challenge-input="' + i + '" class="w-28 h-12 bg-white text-center text-lg font-bold font-mono border-2 border-slate-300 focus:border-blue-500 rounded-xl outline-none"' +
      (ctx.repeatMode ? ' disabled' : '') +
      ' placeholder="' + (task.placeholder || '') + '">' +
      '</div>';
  }

  function _renderTaskCheck(task, i, ctx) {
    if (!ctx.repeatMode || !ctx.savedResult || !ctx.savedResult.taskResults) return '';
    var tr = ctx.savedResult.taskResults[i];
    if (!tr) return '';
    return tr.correct
      ? '<span class="text-emerald-600 font-bold text-sm">\u2705</span>'
      : '<span class="text-rose-600 font-bold text-sm">\u274C</span>';
  }

  function renderChallenge(block, ctx) {
    var tasksHtml = (block.tasks || []).map(function(task, i) {
      if (task.type === 'quiz') return _renderChallengeQuizTask(task, i, ctx, ctx.index);
      if (task.type === 'input') return _renderChallengeInputTask(task, i, ctx);
      return '';
    }).join('');

    var actionBtn = ctx.repeatMode
      ? H.btnPrimary('\u0414\u0430\u043B\u0435\u0435', 'LessonEngine.next()')
      : '<button onclick="LessonBlocks._submitChallenge(' + ctx.index + ')" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 px-10 rounded-2xl transition-all shadow-md">\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0432\u0441\u0451</button>';

    return H.wrap(
      '<div class="py-8">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge('\u0424\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0432\u044B\u0437\u043E\u0432') +
        '<h2 class="text-2xl font-extrabold text-slate-900 mb-6">' + (block.title || '\u0418\u0442\u043E\u0433\u043E\u0432\u043E\u0435 \u0437\u0430\u0434\u0430\u043D\u0438\u0435') + '</h2>' +
        '<div class="space-y-4 mb-8">' + tasksHtml + '</div>' +
        '<div class="flex justify-end">' + actionBtn + '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     REFLECTION
     ------------------------------------------ */

  function _renderChoiceQuestion(q, i, ctx) {
    var opts = (q.options || []).map(function(o, oi) {
      return '<label class="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all cursor-pointer">' +
        '<input type="radio" name="reflect_' + ctx.index + '_' + i + '" value="' + oi + '" class="w-4 h-4 accent-blue-600">' +
        '<span class="text-sm text-slate-700">' + o + '</span></label>';
    }).join('');
    return '<div class="mb-4"><p class="font-bold text-slate-900 mb-2">' + q.text + '</p><div class="space-y-1">' + opts + '</div></div>';
  }

  function _renderRateQuestion(q, i, ctx) {
    var buttons = [1, 2, 3, 4, 5].map(function(s) {
      return '<button type="button" data-reflect-rate="' + ctx.index + '_' + i + '" data-value="' + s + '" onclick="this.parentElement.querySelectorAll(\'button\').forEach(function(b){b.classList.remove(\'bg-blue-600\',\'text-white\')}); this.classList.add(\'bg-blue-600\',\'text-white\')" class="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-bold text-sm border border-slate-200 hover:bg-blue-100 transition-all">' + s + '</button>';
    }).join('');
    return '<div class="mb-4"><p class="font-bold text-slate-900 mb-2">' + q.text + '</p>' +
      '<div class="flex gap-2">' + buttons + '</div></div>';
  }

  function renderReflection(block, ctx) {
    var questionsHtml = (block.questions || []).map(function(q, i) {
      if (q.type === 'choice') return _renderChoiceQuestion(q, i, ctx);
      if (q.type === 'rate') return _renderRateQuestion(q, i, ctx);
      return '';
    }).join('');

    return H.wrap(
      '<div class="py-8">' +
        H.progress(ctx.index, ctx.total) +
        H.blockBadge('\u0420\u0435\u0444\u043B\u0435\u043A\u0441\u0438\u044F') +
        '<h2 class="text-2xl font-extrabold text-slate-900 mb-6">' + (block.title || '\u041E\u0441\u043C\u044B\u0441\u043B\u0438\u043C \u043F\u0440\u043E\u0439\u0434\u0435\u043D\u043D\u043E\u0435') + '</h2>' +
        '<div class="space-y-4 mb-8">' + questionsHtml + '</div>' +
        '<div class="flex justify-end">' +
          H.btnPrimary('\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C', 'LessonBlocks._submitReflection(' + ctx.index + ')') +
        '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     RESULT
     ------------------------------------------ */

  function _calcGrade(pct) {
    return pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
  }

  function _formatTime(seconds) {
    if (seconds >= 60) {
      return Math.floor(seconds / 60) + '\u00A0\u043C\u0438\u043D ' + (seconds % 60) + '\u00A0\u0441\u0435\u043A';
    }
    return seconds + '\u00A0\u0441\u0435\u043A';
  }

  function _renderNextLessonLink(nextLesson) {
    if (nextLesson) {
      return '<a href="' + (nextLesson.link || '#') + '" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all hover:-translate-y-0.5">' +
        '\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0443\u0440\u043E\u043A: ' + nextLesson.title +
        ' <svg class="w-5 h-5 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>' +
        '</a>';
    }
    return '<a href="dashboard.html" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all hover:-translate-y-0.5">\u0411\u0430\u049B\u044B\u043B\u0430\u0443 \u0442\u0430\u049B\u0442\u0430\u0441\u044B\u043D\u0430 \u049B\u0430\u0439\u0442\u0443 \u2192</a>';
  }

  function _renderStatsGrid(pct, xpEarned, timeStr, grade) {
    return '<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto mb-8">' +
      '<div class="bg-blue-50 rounded-2xl p-4 border border-blue-100"><div class="text-2xl font-black text-blue-700">' + pct + '%</div><div class="text-xs font-bold text-blue-500 mt-1">\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442</div></div>' +
      '<div class="bg-amber-50 rounded-2xl p-4 border border-amber-100"><div class="text-2xl font-black text-amber-700">+' + xpEarned + '</div><div class="text-xs font-bold text-amber-500 mt-1">XP</div></div>' +
      '<div class="bg-emerald-50 rounded-2xl p-4 border border-emerald-100"><div class="text-2xl font-black text-emerald-700">' + timeStr + '</div><div class="text-xs font-bold text-emerald-500 mt-1">\u0412\u0440\u0435\u043C\u044F</div></div>' +
      '<div class="bg-purple-50 rounded-2xl p-4 border border-purple-100"><div class="text-2xl font-black text-purple-700">' + grade + '</div><div class="text-xs font-bold text-purple-500 mt-1">\u041E\u0446\u0435\u043D\u043A\u0430</div></div>' +
      '</div>';
  }

  function _renderMistakesWarning(mistakes) {
    if (mistakes <= 0) return '';
    return '<div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 max-w-md mx-auto">' +
      '<p class="text-sm font-semibold text-amber-800">\u0411\u044B\u043B\u043E \u0434\u043E\u043F\u0443\u0449\u0435\u043D\u043E ' + mistakes + ' \u043E\u0448\u0438\u0431\u043E\u043A. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u0434\u043B\u044F \u043B\u0443\u0447\u0448\u0435\u0433\u043E \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430!</p></div>';
  }

  function renderResult(block, ctx) {
    var pct = ctx.percentage || 0;
    var grade = _calcGrade(pct);
    var state = window.__EngineInternal && window.__EngineInternal.state;
    var rewardKey = state && state.lessonId ? 'lesson:' + state.lessonId : '';
    var rewardExists = rewardKey && typeof ML !== 'undefined' && !!(ML.get('rewards', {})[rewardKey]);
    var xpEarned = ctx.repeatMode || rewardExists ? 0 : (block.xp || 50);
    var timeStr = _formatTime(ctx.timeSpent || 0);

    return H.wrap(
      '<div class="text-center py-8">' +
        '<div class="lesson-finish-mark" aria-hidden="true">◆</div>' +
        '<h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">\u0423\u0440\u043E\u043A \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D!</h2>' +
        '<p class="text-lg text-slate-500 mb-8">' + (block.description || '\u041E\u0442\u043B\u0438\u0447\u043D\u0430\u044F \u0440\u0430\u0431\u043E\u0442\u0430!') + '</p>' +
        _renderStatsGrid(pct, xpEarned, timeStr, grade) +
        _renderMistakesWarning(ctx.mistakes) +
        '<div class="flex justify-center">' + _renderNextLessonLink(block.nextLesson) + '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------
     INTERACTIVE FUNCTIONS
     ------------------------------------------ */

  function _submitPendingResult() {
    if (_pendingResult) {
      var r = _pendingResult;
      _pendingResult = null;
      LessonEngine.next(r);
    }
  }

  function _normaliseAnswer(value) {
    return String(value === undefined || value === null ? '' : value).trim().replace(/\s+/g, '').replace(',', '.');
  }

  function _submitChallenge(index) {
    var block = window.__EngineInternal && window.__EngineInternal.state.blocks[index];
    if (!block || !Array.isArray(block.tasks)) return;
    var results = [];
    var allAnswered = true;
    block.tasks.forEach(function(task, taskIndex) {
      var value = '';
      if (task.type === 'quiz') {
        var selected = document.querySelector('input[name="challenge_q_' + index + '_' + taskIndex + '"]:checked');
        if (!selected) allAnswered = false;
        value = selected ? Number(selected.value) : null;
        results.push({ correct: value === task.answer, answer: value });
      } else if (task.type === 'input') {
        var input = document.querySelector('[data-challenge-input="' + taskIndex + '"]');
        value = input ? _normaliseAnswer(input.value) : '';
        if (!value) allAnswered = false;
        var accepted = Array.isArray(task.answer) ? task.answer : [task.answer];
        var correct = accepted.some(function(answer) { return _normaliseAnswer(answer) === value; });
        results.push({ correct: correct, answer: value });
      }
    });
    if (!allAnswered) {
      _showToast('Ответьте на все задания');
      return;
    }
    var correctCount = results.filter(function(result) { return result.correct; }).length;
    LessonEngine.next({
      correct: correctCount === results.length,
      correctAnswers: correctCount,
      totalQuestions: results.length,
      attempts: results.length,
      taskResults: results,
      answers: results.map(function(result) { return result.answer; }),
      points: correctCount * 10,
    });
  }

  function _submitReflection(index) {
    var answers = {};
    document.querySelectorAll('input[name^="reflect_' + index + '_"]:checked').forEach(function(input) {
      answers[input.name] = input.value;
    });
    document.querySelectorAll('[data-reflect-rate^="' + index + '_"].bg-blue-600').forEach(function(button) {
      answers[button.dataset.reflectRate] = button.dataset.value;
    });
    LessonEngine.next({ answers: answers, reflection: true });
  }

  function _selectOption(el) {
    _selected[el.name] = el.value;
    var radios = document.querySelectorAll('input[name="' + el.name + '"]');
    radios.forEach(function(radio) {
      var label = radio.closest('label');
      if (label) {
        if (radio === el) {
          label.classList.add('border-blue-600', 'bg-blue-50');
        } else {
          label.classList.remove('border-blue-600', 'bg-blue-50');
        }
      }
    });
  }

  function _submitQuiz(name, correctAnswer, explanation, points) {
    var selected = _getSelected(name);
    if (selected === null) {
      _showToast('\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043E\u0442\u0432\u0435\u0442');
      return;
    }
    var index = parseInt(name.split('_')[1]);
    var correct = parseInt(selected) === correctAnswer;
    points = points || 10;

    _pendingResult = {
      correct: correct,
      answers: selected,
      explanation: explanation,
      points: points,
    };

    var feedbackEl = document.getElementById('quiz-feedback-' + index);
    if (feedbackEl) {
      feedbackEl.innerHTML = H.feedbackBlock(correct, explanation) +
        '<div class="mt-6 flex justify-end">' +
        H.btnPrimary('\u0414\u0430\u043B\u0435\u0435', 'LessonBlocks._submitPendingResult()') +
        '</div>';
    }

    var btn = document.querySelector('button[onclick*="LessonBlocks._submitQuiz(\'' + name + '\'');
    if (btn) {
      btn.style.display = 'none';
    }
  }

  function _submitWarmup(name, correctAnswer, points) {
    var selected = _getSelected(name);
    if (selected === null) {
      _showToast('\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043E\u0442\u0432\u0435\u0442');
      return;
    }
    var index = parseInt(name.split('_')[1]);
    var correct = parseInt(selected) === correctAnswer;
    points = points || 5;

    _pendingResult = {
      correct: correct,
      answers: selected,
      points: points,
    };

    var feedbackEl = document.getElementById('warmup-feedback-' + index);
    if (feedbackEl) {
      feedbackEl.innerHTML = H.feedbackBlock(correct, null) +
        '<div class="mt-6 flex justify-end">' +
        H.btnPrimary('\u0414\u0430\u043B\u0435\u0435', 'LessonBlocks._submitPendingResult()') +
        '</div>';
    }

    var btn = document.querySelector('button[onclick*="LessonBlocks._submitWarmup(\'' + name + '\'');
    if (btn) {
      btn.style.display = 'none';
    }
  }

  function _getSelected(name) {
    return _selected[name] || null;
  }

  function _getInputValues(name) {
    var fields = document.querySelectorAll('[id^="' + name + '_"]');
    var values = [];
    var allFilled = true;
    fields.forEach(function(el) {
      var val = el.value.trim();
      if (val === '') allFilled = false;
      values.push(val);
    });
    return { values: values, allFilled: allFilled };
  }

  function _compareAnswers(values, correctAnswers, unordered) {
    if (unordered) {
      values = values.map(Number).sort(function(a, b) { return a - b; });
      correctAnswers = correctAnswers.map(Number).sort(function(a, b) { return a - b; });
    }
    for (var i = 0; i < correctAnswers.length; i++) {
      if (parseInt(values[i]) !== correctAnswers[i]) return false;
    }
    return true;
  }

  function _showToast(message) {
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(message, 'warning');
    } else {
      alert(message);
    }
  }

  function _showInputFeedback(index, correct, explanation, name) {
    var feedback = document.getElementById('input-feedback-' + index);
    if (feedback) {
      feedback.innerHTML = H.feedbackBlock(correct, explanation);
    }
    var btn = document.querySelector('button[onclick*="LessonBlocks._checkInput(\'' + name + '\'');
    if (btn) {
      btn.style.display = 'none';
    }
  }

  function _submitInputResult(correct, values, explanation) {
    setTimeout(function() {
      LessonEngine.next({
        correct: correct,
        values: values,
        explanation: explanation,
        points: 15,
      });
    }, 800);
  }

  function _checkInput(name, correctAnswers, explanation, unordered) {
    var result = _getInputValues(name);
    if (!result.allFilled) {
      _showToast('\u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0432\u0441\u0435 \u043F\u043E\u043B\u044F');
      return;
    }

    var correct = _compareAnswers(result.values, correctAnswers, unordered === true);
    var idx = name.split('_')[1];
    _showInputFeedback(idx, correct, explanation, name);
    _submitInputResult(correct, result.values, explanation);
  }

  function _updateSandbox(index) {
    var params = document.querySelectorAll('[id^="sandbox-param-' + index + '-"]');
    var values = [];
    var labels = [];
    params.forEach(function(el) {
      var valId = el.id.replace('sandbox-param-', 'sandbox-val-');
      var valEl = document.getElementById(valId);
      if (valEl) valEl.textContent = el.value;
      values.push(Number(el.value));
      var label = el.parentElement && el.parentElement.querySelector('label');
      labels.push(label ? label.textContent.trim().toLowerCase() : '');
    });

    var outputEl = document.getElementById('sandbox-output-' + index);
    if (outputEl && values.length >= 2) {
      if (labels[0] === 'a' && labels[1] === 'n') {
        outputEl.textContent = values[0] + '^' + values[1] + ' = ' + Math.pow(values[0], values[1]);
      } else if (labels[0] === 'p' && labels[1] === 'q') {
        var discriminant = values[0] * values[0] - 4 * values[1];
        outputEl.textContent = discriminant >= 0
          ? 'D = ' + discriminant
          : 'D = ' + discriminant + ' · действительных корней нет';
      } else {
        outputEl.textContent = values.join(' · ');
      }
    }
  }

  /* ------------------------------------------
     PUBLIC API
     ------------------------------------------ */

  return {
    renderHero: renderHero,
    renderGoal: renderGoal,
    renderWarmup: renderWarmup,
    renderAnchor: renderAnchor,
    renderTheory: renderTheory,
    renderQuiz: renderQuiz,
    renderInput: renderInput,
    renderMistake: renderMistake,
    renderSandbox: renderSandbox,
    renderChallenge: renderChallenge,
    renderReflection: renderReflection,
    renderResult: renderResult,
    _selectOption: _selectOption,
    _getSelected: _getSelected,
    _checkInput: _checkInput,
    _updateSandbox: _updateSandbox,
    _renderOptions: _renderOptions,
    _submitQuiz: _submitQuiz,
    _submitWarmup: _submitWarmup,
    _submitPendingResult: _submitPendingResult,
    _submitChallenge: _submitChallenge,
    _submitReflection: _submitReflection,
  };

})();
