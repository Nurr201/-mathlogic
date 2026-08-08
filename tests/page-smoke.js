/* Minimal DOM smoke checks for the two active controllers. No external packages. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function classList() {
  const values = new Set();
  return {
    add() { Array.from(arguments).forEach(function(value) { values.add(value); }); },
    remove() { Array.from(arguments).forEach(function(value) { values.delete(value); }); },
    contains(value) { return values.has(value); },
    toggle(value, force) {
      const next = force === undefined ? !values.has(value) : !!force;
      if (next) values.add(value); else values.delete(value);
      return next;
    },
  };
}

function element(id) {
  const child = { dataset: {}, textContent: '', setAttribute() {} };
  const listeners = {};
  return {
    id,
    hidden: false,
    textContent: '',
    innerHTML: '',
    href: '',
    scrollTop: 0,
    dataset: {},
    style: { width: '', setProperty() {} },
    classList: classList(),
    setAttribute() {},
    addEventListener(name, callback) { (listeners[name] = listeners[name] || []).push(callback); },
    click() { (listeners.click || []).forEach(function(callback) { callback({ target: this }); }, this); },
    querySelector() { return child; },
    querySelectorAll() { return []; },
  };
}

function environment(search, initialStorage) {
  const nodes = {};
  const documentListeners = {};
  const values = Object.assign({}, initialStorage || {});
  const storage = {
    get length() { return Object.keys(values).length; },
    key(index) { return Object.keys(values)[index] || null; },
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { values[key] = String(value); },
    removeItem(key) { delete values[key]; },
  };
  const document = {
    readyState: 'complete',
    body: element('body'),
    documentElement: { dataset: {}, lang: '', style: { fontSize: '', setProperty() {} } },
    getElementById(id) { return nodes[id] || (nodes[id] = element(id)); },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener(name, callback) { (documentListeners[name] = documentListeners[name] || []).push(callback); },
    dispatchEvent(event) { (documentListeners[event.type] || []).forEach(function(callback) { callback(event); }); },
    createElement(tag) { return element(tag); },
  };
  const context = {
    console,
    document,
    localStorage: storage,
    location: { search: search || '', hostname: 'example.test', pathname: '/dashboard.html' },
    URLSearchParams,
    Intl,
    Date,
    Math,
    JSON,
    CustomEvent: function(name, options) { this.type = name; this.detail = options && options.detail; },
    matchMedia() { return { matches: false }; },
    addEventListener() {},
    setTimeout() { return 1; },
    clearTimeout() {},
  };
  context.window = context;
  vm.createContext(context);
  return { context, nodes, document, storage };
}

function load(app, files) {
  files.forEach(function(file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), app.context, { filename: file });
  });
}

const CORE = ['js/data.js', 'js/storage.js', 'js/i18n.js', 'js/events.js', 'js/learning.js'];
const LESSON = [
  'js/lesson-engine/state.js', 'js/lesson-engine/hooks.js', 'js/lesson-engine/storage.js',
  'js/lesson-engine/debug.js', 'js/lesson-engine/serializer.js', 'js/lesson-engine/core.js', 'js/lesson-engine.js',
  'js/lesson-blocks/helpers.js', 'js/lesson-blocks/registry.js', 'js/lesson-blocks/renderers.js', 'js/lesson-blocks.js',
  'data/lesson-schema.js', 'data/lessons/exponents.js', 'js/lesson.js',
];

function testDashboardShell() {
  const html = fs.readFileSync(path.join(ROOT, 'dashboard.html'), 'utf8');
  const scripts = Array.from(html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g), function(match) { return match[1].split('?')[0]; });
  assert.deepEqual(scripts, [
    'js/data.js', 'js/storage.js', 'js/i18n.js',
    'js/events.js', 'js/learning.js', 'js/site.js', 'js/dashboard.js',
  ]);
  assert.equal((html.match(/js\/dashboard\.js/g) || []).length, 1);
  assert.equal(/<style\b/i.test(html), false);
  assert.equal(/<script(?!\s+src=)[^>]*>/i.test(html), false);
}

function testDashboard() {
  const app = environment('');
  app.document.body.classList.add('axis-app');
  app.document.getElementById('dashboard-content').hidden = true;
  app.document.getElementById('dashboard-error').hidden = true;
  load(app, CORE.concat(['js/site.js', 'js/dashboard.js']));
  assert.equal(app.document.getElementById('dashboard-content').hidden, false);
  assert.equal(app.document.getElementById('dashboard-error').hidden, true);
  assert.equal(app.document.getElementById('hero-primary').href, 'lesson.html?id=algebra.exponents.basics');
  const currentPath = app.document.getElementById('current-path-points').innerHTML;
  assert.ok(currentPath.includes('v7-current-path-item'));
  assert.ok((currentPath.match(/v7-current-path-item/g) || []).length <= 5);
  assert.equal(currentPath.includes('route-module'), false);
  assert.equal(app.document.getElementById('current-path-link').href, 'program.html?subject=algebra');
}

function testLesson(id, expectedTitle, initialStorage) {
  const app = environment('?id=' + encodeURIComponent(id), initialStorage);
  app.document.body.classList.add('axis-app');
  app.document.getElementById('lesson-active').hidden = true;
  app.document.getElementById('lesson-error').hidden = true;
  load(app, CORE.concat(LESSON));
  assert.equal(app.document.getElementById('lesson-error').hidden, true);
  assert.equal(app.document.getElementById('lesson-active').hidden, false);
  assert.equal(app.document.getElementById('lesson-title').textContent, expectedTitle);
  assert.equal(vm.runInContext('__EngineInternal.state.lessonId', app.context), id);
  return app;
}

function testBilingualLessonContent() {
  const kk = testLesson('algebra.exponents.basics', 'Негіздері бірдей дәрежелерді көбейту және бөлу');
  assert.equal(vm.runInContext("__EngineInternal.state.lesson.blocks[1].title", kk.context), 'Сабақтың мақсаты');
  assert.equal(vm.runInContext("__EngineInternal.state.lesson.blocks[4].title", kk.context), 'Көбейту: көрсеткіштер қосылады');
  assert.ok(vm.runInContext("__EngineInternal.state.lesson.blocks[6].content[3].text.includes('a ≠ 0')", kk.context));

  const ru = testLesson('algebra.exponents.basics', 'Умножение и деление степеней с одинаковым основанием', { math_logic_lang: 'ru' });
  assert.equal(vm.runInContext("__EngineInternal.state.lesson.blocks[1].title", ru.context), 'Цель урока');
  assert.equal(vm.runInContext("__EngineInternal.state.lesson.blocks[4].title", ru.context), 'Умножение: показатели складываются');
  assert.ok(vm.runInContext("__EngineInternal.state.lesson.blocks[6].content[3].text.includes('a ≠ 0')", ru.context));
}

function testUnknownLesson() {
  const app = environment('?id=unknown.lesson');
  app.document.body.classList.add('axis-app');
  app.document.getElementById('lesson-active').hidden = true;
  app.document.getElementById('lesson-error').hidden = true;
  load(app, CORE.concat(LESSON));
  assert.equal(app.document.getElementById('lesson-error').hidden, false);
  assert.equal(app.document.getElementById('lesson-active').hidden, true);
  assert.equal(app.document.getElementById('lesson-error-title').textContent, 'Сабақ табылмады');
}

function testCompletionBridge() {
  const app = environment('?id=algebra.exponents.basics');
  app.document.body.classList.add('axis-app');
  app.document.getElementById('lesson-active').hidden = true;
  app.document.getElementById('lesson-error').hidden = true;
  load(app, CORE.concat(LESSON));
  let guard = 100;
  while (vm.runInContext("__EngineInternal.state.finished", app.context) === false && guard-- > 0) {
    const type = vm.runInContext("__EngineInternal.getCurrentBlock().type", app.context);
    const assessed = ['warmup', 'quiz', 'input', 'challenge'].includes(type);
    const taskCount = type === 'challenge'
      ? vm.runInContext('__EngineInternal.getCurrentBlock().tasks.length', app.context)
      : 0;
    const result = type === 'challenge'
      ? '{correct:true,correctAnswers:' + taskCount + ',totalQuestions:' + taskCount + ',attempts:' + taskCount + ',answers:[],points:' + (taskCount * 10) + '}'
      : assessed ? '{correct:true,correctAnswers:1,totalQuestions:1,attempts:1,answers:"ok",points:10}' : 'undefined';
    vm.runInContext('LessonEngine.next(' + result + ')', app.context);
  }
  assert.ok(guard > 0, 'lesson must reach result');
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.exponents.basics')", app.context), 'completed');
  assert.equal(vm.runInContext("ML.get('user.xp')", app.context), 0);
  assert.equal(vm.runInContext("ML.getLessonSession('algebra.exponents.basics')", app.context), null);
  assert.equal(vm.runInContext("ML.get('progress.lessons')['algebra.exponents.basics'].percentage", app.context), 100);
  assert.equal(vm.runInContext('LessonEngine.finish()', app.context), false);
  assert.equal(vm.runInContext("Object.keys(ML.get('rewards',{})).length", app.context), 0);
  assert.equal(vm.runInContext('Learning.getNextLesson().id', app.context), 'algebra.vieta.intro');
  assert.deepEqual(Array.from(vm.runInContext("ML.getLearningHistory().map(function(event){return event.type;}).sort()", app.context)), ['LESSON_COMPLETED', 'LESSON_STARTED']);

  const repeat = environment('?id=algebra.exponents.basics', {
    mathlogic_data: app.storage.getItem('mathlogic_data'),
  });
  repeat.document.body.classList.add('axis-app');
  repeat.document.getElementById('lesson-active').hidden = true;
  repeat.document.getElementById('lesson-error').hidden = true;
  load(repeat, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.repeatMode', repeat.context), true);
  assert.equal(repeat.document.getElementById('lesson-mode').textContent, 'Қайталап оқу');
  guard = 100;
  while (vm.runInContext('__EngineInternal.state.finished', repeat.context) === false && guard-- > 0) {
    const type = vm.runInContext('__EngineInternal.getCurrentBlock().type', repeat.context);
    const assessed = ['warmup', 'quiz', 'input', 'challenge'].includes(type);
    const taskCount = type === 'challenge'
      ? vm.runInContext('__EngineInternal.getCurrentBlock().tasks.length', repeat.context)
      : 0;
    const result = type === 'challenge'
      ? '{correct:true,correctAnswers:' + taskCount + ',totalQuestions:' + taskCount + ',attempts:' + taskCount + ',answers:[],points:' + (taskCount * 10) + '}'
      : assessed ? '{correct:true,correctAnswers:1,totalQuestions:1,attempts:1,answers:"ok",points:10}' : 'undefined';
    vm.runInContext('LessonEngine.next(' + result + ')', repeat.context);
  }
  assert.equal(vm.runInContext("ML.get('user.xp')", repeat.context), 0);
  assert.equal(vm.runInContext("ML.getLessonSession('algebra.exponents.basics')", repeat.context), null);
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED']}).length", repeat.context), 1);
}

function testRepeatAnswerUx() {
  const app = environment('?id=algebra.exponents.basics');
  app.document.body.classList.add('axis-app');
  app.document.getElementById('lesson-active').hidden = true;
  app.document.getElementById('lesson-error').hidden = true;
  load(app, CORE.concat(LESSON));

  const freshQuiz = vm.runInContext("LessonBlocks.render('quiz',{question:'Q',options:['A','B'],answer:1,explanation:'E'},{index:3,total:5,repeatMode:true,savedResult:null})", app.context);
  assert.ok(freshQuiz.includes('LessonBlocks._submitQuiz'));
  assert.ok(freshQuiz.includes('lesson-option'));
  assert.equal(freshQuiz.includes(' disabled'), false);

  const savedQuiz = vm.runInContext("LessonBlocks.render('quiz',{question:'Q',options:['A','B'],answer:1,explanation:'E'},{index:3,total:5,repeatMode:true,savedResult:{answers:'1',correct:true,explanation:'E'}})", app.context);
  assert.ok(savedQuiz.includes('checked'));
  assert.ok(savedQuiz.includes('is-selected'));
  assert.ok(savedQuiz.includes('is-correct'));
  assert.ok(savedQuiz.includes('disabled'));
  assert.ok(savedQuiz.includes('LessonEngine.next()'));

  const freshWarmup = vm.runInContext("LessonBlocks.render('warmup',{question:'Q',options:['A','B'],answer:0},{index:2,total:5,repeatMode:true,savedResult:null})", app.context);
  assert.ok(freshWarmup.includes('LessonBlocks._submitWarmup'));
  assert.equal(freshWarmup.includes(' disabled'), false);
}

function testEmptyOpenAnswerCannotSubmit() {
  const app = environment('?id=algebra.exponents.basics');
  app.document.body.classList.add('axis-app');
  app.document.getElementById('lesson-active').hidden = true;
  app.document.getElementById('lesson-error').hidden = true;
  load(app, CORE.concat(LESSON));
  let nextCalls = 0;
  let toastCalls = 0;
  app.context.LessonEngine.next = function() { nextCalls++; };
  app.context.UI = { showToast() { toastCalls++; } };
  app.context.document.querySelectorAll = function(selector) {
    return selector.indexOf('[id^="input_4_"') === 0 ? [{ value: '   ' }] : [];
  };
  vm.runInContext("LessonBlocks._checkInput('input_4',[8],'Explanation',false)", app.context);
  assert.equal(nextCalls, 0);
  assert.equal(toastCalls, 1);

  const repeatInput = vm.runInContext("LessonBlocks.render('input',{question:'Q',fields:[{type:'text'}],answer:['x']},{index:4,total:5,repeatMode:true,savedResult:null})", app.context);
  assert.ok(repeatInput.includes('LessonBlocks._checkInput'));
  assert.ok(repeatInput.includes('required'));
  assert.equal(repeatInput.includes('LessonEngine.next()'), false);
}

function testResume() {
  const first = environment('?id=algebra.vieta.intro');
  first.document.body.classList.add('axis-app');
  first.document.getElementById('lesson-active').hidden = true;
  first.document.getElementById('lesson-error').hidden = true;
  load(first, CORE.concat(LESSON));
  vm.runInContext('LessonEngine.next();LessonEngine.next()', first.context);
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', first.context), 2);

  const resumed = environment('?id=algebra.vieta.intro', {
    mathlogic_data: first.storage.getItem('mathlogic_data'),
  });
  resumed.document.body.classList.add('axis-app');
  resumed.document.getElementById('lesson-active').hidden = true;
  resumed.document.getElementById('lesson-error').hidden = true;
  load(resumed, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', resumed.context), 2);
  assert.equal(vm.runInContext('__EngineInternal.state.completedBlocks.length', resumed.context), 2);
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.vieta.intro')", resumed.context), 'current');
  vm.runInContext('LessonEngine.next()', resumed.context);
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_CONTINUED'],lessonId:'algebra.vieta.intro'}).length", resumed.context), 1);
}

function testProfileActivity() {
  const empty = environment('');
  empty.context.location.pathname = '/profile.html';
  load(empty, CORE.concat(['js/site.js', 'js/profile.js']));
  const emptyChart = empty.document.getElementById('activity-chart').innerHTML;
  assert.ok(emptyChart.includes('v7-activity-grid'));
  assert.equal(emptyChart.includes('<button'), false);
  assert.equal(empty.document.getElementById('activity-empty').hidden, false);
  assert.ok(empty.document.getElementById('activity-summary').textContent.startsWith('0 '));
  assert.ok(empty.document.getElementById('profile-history').innerHTML.includes('v7-history-empty'));
  assert.equal(empty.document.getElementById('history-count-pill').hidden, true);

  const filled = environment('');
  filled.context.location.pathname = '/profile.html';
  load(filled, CORE);
  vm.runInContext('ML.recordLearningActivity(600,Date.now())', filled.context);
  load(filled, ['js/site.js', 'js/profile.js']);
  const filledChart = filled.document.getElementById('activity-chart').innerHTML;
  assert.ok(filledChart.includes('<button'));
  assert.ok(filledChart.includes('data-level="2"'));
  assert.equal(filled.document.getElementById('activity-empty').hidden, true);
  assert.equal(/Math\.random\s*\(/.test(fs.readFileSync(path.join(ROOT, 'js/profile.js'), 'utf8')), false);
}

function testProfileLearningHistory() {
  const app = environment('');
  app.context.location.pathname = '/profile.html';
  load(app, CORE);
  vm.runInContext("ML.setLang('ru')", app.context);
  const now = Date.now();
  for (let index = 0; index < 25; index++) {
    const type = index % 2 === 0 ? 'LESSON_STARTED' : 'LESSON_CONTINUED';
    const lessonId = index % 2 ? 'algebra.exponents.basics' : 'algebra.vieta.intro';
    const timestamp = now - index * 3 * 60 * 60 * 1000;
    vm.runInContext("ML.addLearningEvent({type:'" + type + "',lessonId:'" + lessonId + "',timestamp:" + timestamp + ",metadata:{totalQuestions:5,correctAnswers:4,duration:600}})", app.context);
  }
  vm.runInContext("ML.addLearningEvent({type:'LESSON_STARTED',lessonId:'removed.lesson',timestamp:" + (now + 1000) + ",metadata:{lessonTitle:{ru:'Очень длинное название удалённого урока для безопасной проверки',kk:'Қауіпсіз тексеруге арналған бағдарламадан алынған ұзақ сабақ атауы'}}})", app.context);
  load(app, ['js/site.js', 'js/profile.js']);

  let history = app.document.getElementById('profile-history').innerHTML;
  assert.ok(history.includes('Сегодня'));
  assert.ok(history.includes('Вчера'));
  assert.ok(history.includes('Урок начат'));
  assert.ok(history.includes('Очень длинное название удалённого урока'));
  assert.equal((history.match(/v7-history-event/g) || []).length, 20);
  assert.ok(history.includes('id="history-more"'));
  app.document.getElementById('history-more').click();
  history = app.document.getElementById('profile-history').innerHTML;
  assert.equal((history.match(/v7-history-event/g) || []).length, 26);
  assert.equal(history.includes('id="history-more"'), false);
  assert.equal(history.includes('lesson.html?id=removed.lesson'), false);

  vm.runInContext("ML.setLang('kk')", app.context);
  app.document.querySelectorAll = function() { return []; };
  app.context.document.dispatchEvent({ type: 'progress:update' });
  assert.ok(app.document.getElementById('profile-history').innerHTML.includes('Бүгін'));
  assert.ok(app.document.getElementById('profile-history').innerHTML.includes('Кеше'));

  vm.runInContext("ML.set('activity.history',ML.getLearningHistory().slice(0,5))", app.context);
  app.context.document.dispatchEvent({ type: 'progress:update' });
  assert.equal((app.document.getElementById('profile-history').innerHTML.match(/v7-history-event/g) || []).length, 5);
}

testDashboardShell();
testDashboard();
testLesson('algebra.vieta.intro', 'Виет теоремасы');
testBilingualLessonContent();
testUnknownLesson();
testCompletionBridge();
testRepeatAnswerUx();
testEmptyOpenAnswerCannotSubmit();
testResume();
testProfileActivity();
testProfileLearningHistory();
console.log('page-smoke: ok');
