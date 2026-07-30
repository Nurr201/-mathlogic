const steps = [
  { id: '1', title: 'Виет теоремасы', subtitle: 'Теория және 3 мысал', type: 'theory' },
  { id: '2', title: '1-Тест тапсырмасы', subtitle: 'Түбірлерді тап', type: 'test', eq: 'x² - 8x + 15 = 0', opts: ['2 және 6', '3 және 5', '-3 және -5'], ans: 1, hint: 'Көбейтіндісі 15, ал қосындысы +8 болуы керек.' },
  { id: '3', title: '2-Тест тапсырмасы', subtitle: 'Теріс таңба', type: 'test', eq: 'x² + 2x - 24 = 0', opts: ['4 және -6', '-4 және 6', '3 және -8'], ans: 0, hint: 'Көбейтіндісі -24, қосындысы -2. Демек: 4 + (-6) = -2.' },
  { id: '4', title: '3-Тест тапсырмасы', subtitle: 'Бекіту', type: 'test', eq: 'x² - 10x + 21 = 0', opts: ['1 және 21', '3 және 7', '-3 және -7'], ans: 1, hint: 'Көбейтіндісі 21, қосындысы +10.' },
  { id: '5', title: '4-Тест тапсырмасы', subtitle: 'Күрделірек', type: 'test', eq: 'x² + 6x + 8 = 0', opts: ['2 және 4', '-2 және -4', '1 және 8'], ans: 1, hint: 'Қосындысы -6 болуы керек! -2 + (-4) = -6.' },
  { id: '6', title: '1-Жазбаша есеп', subtitle: 'Өзің енгіз', type: 'input', eq: 'x² - 12x + 35 = 0', root1: 5, root2: 7 },
  { id: '7', title: '2-Жазбаша есеп', subtitle: 'Соңғы тапсырма', type: 'input', eq: 'x² - 5x - 14 = 0', root1: 7, root2: -2 }
];

const LESSON_RESULTS_KEY = 'progress.lessonSteps.algebra_3';
const isCompleted = Learning.getLessonState('algebra_3') === 'completed';
const repeatMode = isCompleted;
const savedResults = repeatMode ? (ML.get(LESSON_RESULTS_KEY) || []) : [];

let currentStepIndex = 0;
let selectedTestOption = null;
const lessonStartTime = Date.now();
let totalAttempts = 0;
let correctAnswers = 0;
let totalQuestions = 0;
let stepResults = [];

steps.forEach(function(s) { if (s.type !== 'theory') totalQuestions++; });

function restoreSavedResults() {
  if (!repeatMode || !savedResults || savedResults.length === 0) return;
  savedResults.forEach(function(sr) {
    if (sr.correct) correctAnswers++;
    sr._recorded = true;
  });
  stepResults = savedResults.map(function(sr) { return Object.assign({}, sr); });
  currentStepIndex = steps.length - 1;
}

function renderSidebar() {
  const container = document.getElementById('sidebar-steps');
  container.innerHTML = '';
  steps.forEach(function(step, index) {
    var stateClass = 'step-pending';
    if (index < currentStepIndex) stateClass = 'step-completed';
    else if (index === currentStepIndex) stateClass = 'step-active';

    var sr = stepResults[index];
    var isCorrect = sr && sr.correct;

    var icon;
    if (index < currentStepIndex || isCorrect) {
      icon = '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
    } else {
      icon = '<span class="text-sm font-extrabold font-mono">' + (index + 1) + '</span>';
    }

    container.innerHTML += '<div class="flex items-center gap-3.5 ' + stateClass + ' p-2 rounded-2xl transition-all cursor-pointer hover:bg-slate-100">' +
      '<div class="step-box w-10 h-10 rounded-xl flex items-center justify-center shrink-0">' + icon + '</div>' +
      '<div class="flex flex-col">' +
        '<span class="step-text text-[0.95rem] leading-tight font-semibold transition-colors">' + step.title + '</span>' +
        '<span class="text-xs opacity-80 mt-0.5">' + step.subtitle + '</span>' +
      '</div></div>';
  });
}

function nextStep() {
  if (currentStepIndex < steps.length - 1) {
    currentStepIndex++;
    selectedTestOption = null;
    renderSidebar();
    renderContent();
  } else {
    if (!repeatMode) {
      var lessonTime = Math.round((Date.now() - lessonStartTime) / 1000);
      var scorePct = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      var xpEarned = QuizEngine.calcXP(correctAnswers);
      var grade = QuizEngine.calcGrade(scorePct);

      QuizEngine.completeLesson('algebra_3', {
        score: scorePct,
        correct: correctAnswers,
        total: totalQuestions,
        attempts: totalAttempts,
        time: lessonTime,
        xpEarned: xpEarned,
        grade: grade,
      });

      try { ML.set(LESSON_RESULTS_KEY, stepResults); } catch(e) {}

      var timeStr = QuizEngine.formatTime(lessonTime);
      showCompletionScreen(scorePct, xpEarned, timeStr, grade);
    } else {
      showReviewCompleteScreen();
    }
  }
}

function showCompletionScreen(scorePct, xpEarned, timeStr, grade) {
  const content = document.getElementById('main-content');
  content.innerHTML = '<div class="min-h-full flex items-center justify-center p-6">' +
    '<div class="w-full max-w-lg bg-white p-10 sm:p-14 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 text-center animate-fade">' +
      '<div class="text-6xl mb-6">🎉</div>' +
      '<h2 class="text-3xl font-extrabold text-slate-900 mb-4">Құттықтаймыз!</h2>' +
      '<p class="text-slate-600 text-lg mb-6">Барлық тапсырманы сәтті аяқтадыңыз.</p>' +
      '<div class="grid grid-cols-2 gap-4 mb-8">' +
        '<div class="bg-blue-50 rounded-2xl p-4 border border-blue-100"><div class="text-2xl font-black text-blue-700">' + scorePct + '%</div><div class="text-xs font-bold text-blue-500 mt-1">Нәтиже</div></div>' +
        '<div class="bg-amber-50 rounded-2xl p-4 border border-amber-100"><div class="text-2xl font-black text-amber-700">+' + xpEarned + '</div><div class="text-xs font-bold text-amber-500 mt-1">XP</div></div>' +
        '<div class="bg-emerald-50 rounded-2xl p-4 border border-emerald-100"><div class="text-2xl font-black text-emerald-700">' + timeStr + '</div><div class="text-xs font-bold text-emerald-500 mt-1">Уақыт</div></div>' +
        '<div class="bg-purple-50 rounded-2xl p-4 border border-purple-100"><div class="text-2xl font-black text-purple-700">' + grade + '</div><div class="text-xs font-bold text-purple-500 mt-1">Баға</div></div>' +
      '</div>' +
      '<a href="dashboard.html" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all hover:-translate-y-0.5">Бақылау тақтасына қайту →</a>' +
    '</div></div>';
  document.getElementById('main-content').scrollTo({ top: 0, behavior: 'smooth' });
}

function showReviewCompleteScreen() {
  const content = document.getElementById('main-content');
  var correctCount = 0;
  stepResults.forEach(function(sr) { if (sr.correct) correctCount++; });
  content.innerHTML = '<div class="min-h-full flex items-center justify-center p-6">' +
    '<div class="w-full max-w-lg bg-white p-10 sm:p-14 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 text-center animate-fade">' +
      '<div class="text-6xl mb-6">📖</div>' +
      '<h2 class="text-3xl font-extrabold text-slate-900 mb-4">Повторение завершено</h2>' +
      '<p class="text-slate-600 text-lg mb-6">Вы повторили материал. Результаты: ' + correctCount + '/' + totalQuestions + ' правильных ответов.</p>' +
      '<div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">' +
        '<p class="text-sm font-semibold text-amber-800">Режим повторения. Прогресс не изменён.</p>' +
      '</div>' +
      '<a href="dashboard.html" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all hover:-translate-y-0.5">Бақылау тақтасына қайту →</a>' +
    '</div></div>';
  document.getElementById('main-content').scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    selectedTestOption = null;
    renderSidebar();
    renderContent();
  }
}

function renderContent() {
  const theoryBlock = document.getElementById('content-step-1');
  const tasksBlock = document.getElementById('tasks-container');
  const step = steps[currentStepIndex];

  if (step.type === 'theory') {
    theoryBlock.classList.remove('hidden');
    tasksBlock.classList.add('hidden');
  } else {
    theoryBlock.classList.add('hidden');
    tasksBlock.classList.remove('hidden');

    var savedResult = repeatMode ? (stepResults[currentStepIndex] || null) : null;

    if (step.type === 'test') {
      tasksBlock.innerHTML = buildTestContent(step, savedResult);
    } else if (step.type === 'input') {
      tasksBlock.innerHTML = buildInputContent(step, savedResult);
    }
  }

  document.getElementById('main-content').scrollTo({ top: 0, behavior: 'smooth' });
}

function buildTestContent(step, savedResult) {
  var headerButtons = '<button onclick="prevStep()" class="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">' +
    '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg> Артқа</button>';

  var stepBadge = '<div class="flex items-center gap-3">' +
    '<span class="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg uppercase tracking-wide">' + step.title + '</span>' +
    '<span class="text-xs font-bold text-slate-500 font-mono bg-slate-100 px-2.5 py-1.5 rounded-md">' + currentStepIndex + '/' + (steps.length - 1) + '</span></div>';

  var optionsHtml = '';
  for (var i = 0; i < step.opts.length; i++) {
    var opt = step.opts[i];
    var btnClass = 'test-opt-btn w-full text-left p-5 rounded-2xl bg-white border-2 text-xl font-bold transition-all flex justify-between items-center group';
    var selectedClass = '';
    var isSelected = false;

    if (repeatMode && savedResult) {
      var wasSelected = savedResult.userAnswer === i;
      if (wasSelected && savedResult.correct) {
        selectedClass = ' border-emerald-500 bg-emerald-50';
      } else if (wasSelected && !savedResult.correct) {
        selectedClass = ' border-rose-500 bg-rose-50';
      }
      btnClass += selectedClass;
    } else {
      btnClass += ' border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-slate-700';
    }

    var radioClass = 'radio-circle w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors';
    radioClass += ' border-slate-300 group-hover:border-blue-400';

    var dotClass = 'inner-dot w-3 h-3 rounded-full bg-blue-600 hidden';

    optionsHtml += '<button onclick="selectOption(' + i + ')" id="opt-btn-' + i + '" class="' + btnClass + '">' +
      '<span>' + opt + '</span>' +
      '<div class="' + radioClass + '"><div class="' + dotClass + '"></div></div></button>';
  }

  var feedbackHtml = '<div id="test-feedback" class="hidden mb-8 p-5 rounded-2xl text-lg font-bold"></div>';

  var actionsHtml = '<div class="flex gap-4">' +
    '<button id="submit-btn" onclick="checkTestAnswer(' + step.ans + ')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-400 border border-slate-200 font-bold text-lg py-4 rounded-2xl transition-all cursor-not-allowed" disabled>Жауапты тексеру</button>' +
    '<button id="next-btn" onclick="nextStep()" class="hidden w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg py-4 rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all flex justify-center items-center gap-2">Келесі тапсырма <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></button>' +
    '</div>';

  return '<div class="w-full max-w-2xl bg-white p-8 sm:p-12 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 animate-fade">' +
    '<div class="flex justify-between items-center mb-8 pb-5 border-b border-slate-100">' +
      headerButtons + stepBadge +
    '</div>' +
    '<h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">Теңдеудің түбірлерін табыңыз:</h2>' +
    '<div class="font-mono text-4xl sm:text-5xl font-black text-center text-slate-900 bg-slate-50 py-8 rounded-3xl border border-slate-200 mb-10 shadow-inner">' + step.eq + '</div>' +
    '<div class="space-y-4 mb-10">' + optionsHtml + '</div>' +
    feedbackHtml +
    actionsHtml +
  '</div>';
}

function buildInputContent(step, savedResult) {
  var headerButtons = '<button onclick="prevStep()" class="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">' +
    '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg> Артқа</button>';

  var stepBadge = '<div class="flex items-center gap-3">' +
    '<span class="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg uppercase tracking-wide">' + step.title + '</span>' +
    '<span class="text-xs font-bold text-slate-500 font-mono bg-slate-100 px-2.5 py-1.5 rounded-md">' + currentStepIndex + '/' + (steps.length - 1) + '</span></div>';

  var input1Class = 'w-24 h-16 bg-white text-center text-3xl font-bold font-mono border-2 rounded-2xl outline-none shadow-sm transition-all';
  var input2Class = 'w-24 h-16 bg-white text-center text-3xl font-bold font-mono border-2 rounded-2xl outline-none shadow-sm transition-all';
  var val1 = '';
  var val2 = '';
  var feedbackHtml = '';

  if (repeatMode && savedResult) {
    val1 = savedResult.userVal1 !== undefined ? savedResult.userVal1 : '';
    val2 = savedResult.userVal2 !== undefined ? savedResult.userVal2 : '';
    if (savedResult.correct) {
      input1Class += ' border-emerald-500 bg-emerald-50 text-emerald-900';
      input2Class += ' border-emerald-500 bg-emerald-50 text-emerald-900';
    } else {
      input1Class += ' border-rose-500 bg-rose-50 text-rose-900';
      input2Class += ' border-rose-500 bg-rose-50 text-rose-900';
    }
  } else {
    input1Class += ' border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-slate-900';
    input2Class += ' border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-slate-900';
  }

  if (repeatMode && savedResult) {
    if (savedResult.correct) {
      feedbackHtml = '<div class="mb-8 p-5 rounded-2xl text-lg font-bold bg-emerald-100/50 text-emerald-800 border border-emerald-200 animate-fade flex items-center justify-center gap-3">' +
        '<svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Дұрыс!</div>';
    } else {
      feedbackHtml = '<div class="mb-8 p-5 rounded-2xl text-[1.05rem] font-medium bg-rose-50 text-rose-800 border border-rose-200 animate-fade text-center">' +
        '<strong class="font-bold text-rose-900">Қате.</strong> Дұрыс жауап: <span class="font-mono font-bold">' + step.root1 + ' және ' + step.root2 + '</span></div>';
    }
  } else {
    feedbackHtml = '<div id="input-feedback" class="hidden mb-8 p-5 rounded-2xl text-lg font-bold text-center"></div>';
  }

  var actionsHtml;
  if (repeatMode) {
    actionsHtml = '<div class="flex gap-4">' +
      '<button id="check-btn" onclick="checkInputAnswer(' + step.root1 + ', ' + step.root2 + ')" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-md">Жауапты тексеру</button>' +
      '<button id="next-btn" onclick="nextStep()" class="hidden w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg py-4 rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all flex justify-center items-center gap-2">' +
      (currentStepIndex === steps.length - 1 ? 'Аяқтау ✨' : 'Келесі тапсырма') +
      (currentStepIndex !== steps.length - 1 ? ' <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>' : '') +
      '</button></div>';
  } else {
    actionsHtml = '<button id="check-btn" onclick="checkInputAnswer(' + step.root1 + ', ' + step.root2 + ')" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-md">Жауапты тексеру</button>' +
      '<button id="next-btn" onclick="nextStep()" class="hidden w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg py-4 rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all flex justify-center items-center gap-2">' +
      (currentStepIndex === steps.length - 1 ? 'Аяқтау ✨' : 'Келесі тапсырма') +
      (currentStepIndex !== steps.length - 1 ? ' <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>' : '') +
      '</button>';
  }

  return '<div class="w-full max-w-2xl bg-white p-8 sm:p-12 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 animate-fade">' +
    '<div class="flex justify-between items-center mb-8 pb-5 border-b border-slate-100">' +
      headerButtons + stepBadge +
    '</div>' +
    '<h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">Жауапты өзіңіз енгізіңіз:</h2>' +
    '<div class="font-mono text-4xl sm:text-5xl font-black text-center text-slate-900 bg-slate-50 py-8 rounded-3xl border border-slate-200 mb-10 shadow-inner">' + step.eq + '</div>' +
    '<div class="flex justify-center items-center gap-8 mb-10">' +
      '<div class="flex items-center gap-4"><span class="text-2xl font-mono font-bold text-slate-500">x₁ =</span><input type="number" id="root1" class="' + input1Class + '" value="' + val1 + '"></div>' +
      '<div class="flex items-center gap-4"><span class="text-2xl font-mono font-bold text-slate-500">x₂ =</span><input type="number" id="root2" class="' + input2Class + '" value="' + val2 + '"></div>' +
    '</div>' +
    feedbackHtml +
    actionsHtml +
  '</div>';
}

function selectOption(index) {
  selectedTestOption = index;

  if (repeatMode) {
    var step = steps[currentStepIndex];
    var savedResult = stepResults[currentStepIndex];
    var feedback = document.getElementById('test-feedback');
    if (feedback) {
      feedback.classList.remove('hidden');
      if (index === step.ans) {
        feedback.className = 'mb-8 p-5 rounded-2xl text-lg font-bold bg-emerald-100/50 text-emerald-800 border border-emerald-200 animate-fade flex items-center gap-3';
        feedback.innerHTML = '<svg class="w-6 h-6 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Дұрыс! ' + (savedResult ? step.hint : '');
      } else {
        feedback.className = 'mb-8 p-5 rounded-2xl text-[1.05rem] font-medium bg-rose-50 text-rose-800 border border-rose-200 animate-fade';
        feedback.innerHTML = "<strong class='font-bold text-rose-900'>❌ Қате.</strong> Правильный ответ: " + step.opts[step.ans] + '. ' + step.hint;
      }
    }
    return;
  }

  var btns = document.querySelectorAll('.test-opt-btn');
  btns.forEach(function(btn) {
    btn.classList.remove('border-blue-600', 'bg-blue-50', 'text-blue-950');
    btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
    btn.querySelector('.radio-circle').classList.remove('border-blue-600');
    btn.querySelector('.radio-circle').classList.add('border-slate-300');
    btn.querySelector('.inner-dot').classList.add('hidden');
  });

  var selectedBtn = document.getElementById('opt-btn-' + index);
  selectedBtn.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
  selectedBtn.classList.add('border-blue-600', 'bg-blue-50', 'text-blue-950');
  selectedBtn.querySelector('.radio-circle').classList.remove('border-slate-300');
  selectedBtn.querySelector('.radio-circle').classList.add('border-blue-600');
  selectedBtn.querySelector('.inner-dot').classList.remove('hidden');

  var submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = false;
  submitBtn.className = 'w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-md';
}

function checkTestAnswer(correctIndex) {
  if (selectedTestOption === null) return;

  if (repeatMode) {
    var feedback = document.getElementById('test-feedback');
    var step = steps[currentStepIndex];
    feedback.classList.remove('hidden');
    if (selectedTestOption === correctIndex) {
      feedback.className = 'mb-8 p-5 rounded-2xl text-lg font-bold bg-emerald-100/50 text-emerald-800 border border-emerald-200 animate-fade flex items-center gap-3';
      feedback.innerHTML = '<svg class="w-6 h-6 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Дұрыс!';
    } else {
      feedback.className = 'mb-8 p-5 rounded-2xl text-[1.05rem] font-medium bg-rose-50 text-rose-800 border border-rose-200 animate-fade';
      feedback.innerHTML = "<strong class='font-bold text-rose-900'>❌ Қате.</strong> " + step.hint;
    }
    document.getElementById('submit-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
    return;
  }

  totalAttempts++;
  var correct = selectedTestOption === correctIndex;
  if (correct) correctAnswers++;

  var btns = document.querySelectorAll('.test-opt-btn');
  btns.forEach(function(btn) { btn.disabled = true; });

  var feedback = document.getElementById('test-feedback');
  feedback.classList.remove('hidden');
  document.getElementById('submit-btn').classList.add('hidden');
  document.getElementById('next-btn').classList.remove('hidden');

  if (correct) {
    var btn = document.getElementById('opt-btn-' + selectedTestOption);
    btn.classList.replace('border-blue-600', 'border-emerald-500');
    btn.classList.replace('bg-blue-50', 'bg-emerald-50');
    btn.querySelector('.radio-circle').classList.replace('border-blue-600', 'border-emerald-500');
    btn.querySelector('.inner-dot').classList.replace('bg-blue-600', 'bg-emerald-500');
    feedback.className = 'mb-8 p-5 rounded-2xl text-lg font-bold bg-emerald-100/50 text-emerald-800 border border-emerald-200 animate-fade flex items-center gap-3';
    feedback.innerHTML = '<svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Өте дұрыс! Жарарайсың.';
  } else {
    var wrongBtn = document.getElementById('opt-btn-' + selectedTestOption);
    wrongBtn.classList.replace('border-blue-600', 'border-rose-500');
    wrongBtn.classList.replace('bg-blue-50', 'bg-rose-50');
    wrongBtn.querySelector('.radio-circle').classList.replace('border-blue-600', 'border-rose-500');
    wrongBtn.querySelector('.inner-dot').classList.replace('bg-blue-600', 'bg-rose-500');
    var correctBtn = document.getElementById('opt-btn-' + correctIndex);
    correctBtn.classList.add('border-emerald-500', 'bg-emerald-50');
    var step = steps[currentStepIndex];
    feedback.className = 'mb-8 p-5 rounded-2xl text-[1.05rem] font-medium bg-rose-50 text-rose-800 border border-rose-200 animate-fade';
    feedback.innerHTML = "<strong class='font-bold text-rose-900'>❌ Қате.</strong> Есіңізде болсын: " + step.hint;
  }

  stepResults[currentStepIndex] = {
    stepIndex: currentStepIndex,
    type: 'test',
    correct: correct,
    userAnswer: selectedTestOption,
    correctAnswer: correctIndex,
    hint: steps[currentStepIndex].hint,
    opts: steps[currentStepIndex].opts,
  };
}

function checkInputAnswer(correctRoot1, correctRoot2) {
  var val1 = parseInt(document.getElementById('root1').value);
  var val2 = parseInt(document.getElementById('root2').value);
  var feedback = document.getElementById('input-feedback');

  if (isNaN(val1) || isNaN(val2)) {
    alert('Екі ұяшыққа да сандарды енгізіңіз!');
    return;
  }

  if (repeatMode) {
    feedback.classList.remove('hidden');
    var corr = (val1 === correctRoot1 && val2 === correctRoot2) || (val1 === correctRoot2 && val2 === correctRoot1);
    if (corr) {
      feedback.className = 'mb-8 p-5 rounded-2xl text-lg font-bold bg-emerald-100/50 text-emerald-800 border border-emerald-200 animate-fade flex items-center justify-center gap-3';
      feedback.innerHTML = '<svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Дұрыс!';
    } else {
      feedback.className = 'mb-8 p-5 rounded-2xl text-[1.05rem] font-medium bg-rose-50 text-rose-800 border border-rose-200 animate-fade';
      feedback.innerHTML = "<strong class='font-bold text-rose-900'>❌ Қате.</strong> Дұрыс жауап: " + correctRoot1 + " және " + correctRoot2 + ".";
    }
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
    return;
  }

  totalAttempts++;
  feedback.classList.remove('hidden');
  var correct = (val1 === correctRoot1 && val2 === correctRoot2) || (val1 === correctRoot2 && val2 === correctRoot1);

  if (correct) {
    correctAnswers++;
    feedback.className = 'mb-8 p-5 rounded-2xl text-lg font-bold bg-emerald-100/50 text-emerald-800 border border-emerald-200 animate-fade flex items-center justify-center gap-3';
    feedback.innerHTML = '<svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Дұрыс таптыңыз! Керемет.';
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
    ['root1', 'root2'].forEach(function(id) {
      var el = document.getElementById(id);
      el.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-900');
      el.disabled = true;
    });
  } else {
    feedback.className = 'mb-8 p-5 rounded-2xl text-[1.05rem] font-medium bg-rose-50 text-rose-800 border border-rose-200 animate-fade';
    feedback.innerHTML = "<strong class='font-bold text-rose-900'>❌ Қате.</strong> Ережені қайта тексеріңіз.";
  }

  stepResults[currentStepIndex] = {
    stepIndex: currentStepIndex,
    type: 'input',
    correct: correct,
    userVal1: val1,
    userVal2: val2,
    correctVal1: correctRoot1,
    correctVal2: correctRoot2,
  };
}

restoreSavedResults();
renderSidebar();

if (repeatMode) {
  var banner = document.createElement('div');
  banner.id = 'repeat-banner';
  banner.className = 'fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b-2 border-amber-200 px-4 py-3 text-center shadow-md';
  banner.innerHTML = '<p class="text-sm font-bold text-amber-800">📖 Режим повторения. Повторное прохождение не влияет на прогресс и не приносит XP.</p>';
  document.body.prepend(banner);
  document.querySelector('aside').style.marginTop = '48px';
  document.getElementById('main-content').style.marginTop = '48px';
}

ANIME.initPageTransitions();
