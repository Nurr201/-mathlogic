/* Dependency-free smoke checks for storage and canonical lesson lifecycle. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCES = [
  'js/data.js', 'js/storage.js', 'js/i18n.js', 'js/events.js', 'js/learning.js',
  'data/lesson-schema.js', 'data/lessons/exponents.js',
];

function createStorage(initial) {
  const values = Object.assign({}, initial || {});
  return {
    get length() { return Object.keys(values).length; },
    key(index) { return Object.keys(values)[index] || null; },
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { values[key] = String(value); },
    removeItem(key) { delete values[key]; },
    dump() { return Object.assign({}, values); },
  };
}

function boot(initialStorage) {
  const listeners = {};
  const context = {
    console,
    localStorage: createStorage(initialStorage),
    CustomEvent: function(name, options) { this.type = name; this.detail = options && options.detail; },
    document: {
      body: null,
      documentElement: { dataset: {}, style: { setProperty() {} } },
      addEventListener(name, callback) { (listeners[name] = listeners[name] || []).push(callback); },
      dispatchEvent(event) { (listeners[event.type] || []).forEach(function(callback) { callback(event); }); },
    },
    addEventListener() {},
    matchMedia() { return { matches: false }; },
    setTimeout,
    clearTimeout,
  };
  context.window = context;
  vm.createContext(context);
  SOURCES.forEach(function(file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  });
  return {
    context,
    run(code) { return vm.runInContext(code, context); },
  };
}

function testCanonicalLifecycle() {
  const app = boot();
  assert.equal(app.run("Learning.getLessonStatus('algebra.exponents.basics')"), 'available');
  app.run("ML.setLessonSession('algebra.exponents.basics',{completedBlocks:[0],currentIndex:1})");
  assert.equal(app.run("Learning.getLessonStatus('algebra.exponents.basics')"), 'current');

  const first = app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:80,correctAnswers:4,totalQuestions:5,duration:30})");
  assert.equal(first.xpEarned, 0);
  assert.equal(app.run("ML.getLessonSession('algebra.exponents.basics')"), null);
  assert.ok(app.run("Object.keys(ML.get('progress.subtopics')).length") > 0);
  const repeated = app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5})");
  assert.equal(repeated.xpEarned, 0);
  assert.equal(app.run("ML.get('user.xp')"), 0);
  assert.equal(app.run("Object.keys(ML.get('rewards',{})).length"), 0);
  app.run("Learning.resetLesson('algebra.exponents.basics')");
  assert.equal(app.run("Object.keys(ML.get('progress.subtopics')).length"), 0);
  assert.equal(app.run("ML.get('stats.lessons_completed')"), 0);
  const afterReset = app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5})");
  assert.equal(afterReset.xpEarned, 0);
  assert.equal(app.run("ML.get('user.xp')"), 0);
}

function testRegistryAndConfigs() {
  const app = boot();
  const ids = app.run('Object.keys(LESSON_REGISTRY)');
  assert.deepEqual(Array.from(ids), ['algebra.exponents.basics', 'algebra.vieta.intro']);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(app.run("LessonValidator.validate(LESSON_EXPONENTS).valid"), true);
  assert.equal(app.run("LessonValidator.validate(LESSON_EXPONENTS).warnings.length"), 0);
  assert.equal(app.run("LESSON_EXPONENTS.blocks.length"), 15);
  assert.equal(app.run("LESSON_EXPONENTS.blocks.filter(function(block){return block.type==='challenge';}).length"), 2);
  assert.equal(app.run("LESSON_EXPONENTS.title.kk"), 'Негіздері бірдей дәрежелерді көбейту және бөлу');
  assert.equal(app.run("LessonValidator.validate(LESSON_VIETA).valid"), true);
  assert.equal(app.run("Learning.resolveLessonId('algebra_1')"), 'algebra.exponents.basics');
  assert.equal(app.run("Learning.resolveLessonId('lesson.html')"), 'algebra.vieta.intro');
  assert.equal(app.run("Learning.getTopic('algebra','algebra.powers-roots-logs').id"), 'algebra.powers-roots-logs');
  assert.equal(app.run("Learning.getLesson('unknown.lesson')"), null);
}

function testLegacyMigration() {
  const legacy = {
    version: 1,
    user: { xp: 40, loggedIn: true },
    progress: { lessonStates: { algebra_1: 'completed' }, lessons: {} },
    lesson: { v2: { algebra_1: { completedBlocks: [0, 1], currentIndex: 2 } } },
    dashboard: { quests: { legacy: true } },
    dailyQuests: [{ id: 'quest_login' }],
  };
  const app = boot({ mathlogic_data: JSON.stringify(legacy), ml_dash_state: '{"legacy":true}' });
  assert.equal(app.run("Learning.getLessonStatus('algebra.exponents.basics')"), 'completed');
  assert.equal(app.run("ML.get('progress.lessons.algebra_1',null)"), null);
  assert.equal(app.run("ML.getLessonSession('algebra.exponents.basics').currentIndex"), 2);
  assert.equal(app.run("Object.keys(ML.get('rewards',{})).length"), 0);
  assert.equal(app.run("ML.get('dashboard',null)"), null);
  assert.equal(app.run("ML.get('dailyQuests',null)"), null);
  assert.equal(app.context.localStorage.getItem('ml_dash_state'), null);
  assert.equal(app.run("ML.get('version')"), 2);
}

function testScatteredLegacyMigration() {
  const app = boot({
    math_logic_user: JSON.stringify({ name: 'Legacy', loggedIn: true, xp: 125 }),
    math_logic_lang: 'ru',
    profile_stat_lessons_completed: '4',
    profile_streak_data: JSON.stringify({ current: 2, best: 4, total: 7, days: ['2026-07-30', '2026-07-31'] }),
  });
  assert.equal(app.run("ML.get('user.name')"), 'Legacy');
  assert.equal(app.run("ML.get('settings.lang')"), 'ru');
  assert.equal(app.run("ML.get('user.streak')"), 2);
  assert.equal(app.run("ML.get('activity.dates').length"), 2);
  assert.equal(app.context.localStorage.getItem('profile_streak_data'), null);
}

function testLanguageCompatibility() {
  const app = boot();
  assert.equal(app.run('ML.getLang()'), 'kk');
  app.run("ML.setLang('kz')");
  assert.equal(app.run('ML.getLang()'), 'kk');
  assert.equal(app.run("ML.get('settings.lang')"), 'kk');
  app.run("ML.setSetting('lang','kk')");
  assert.equal(app.run('I18N.getLang()'), 'kk');
  assert.equal(app.run("I18N.t('lesson.repeat','kz')"), 'Қайталап оқу');
  assert.equal(app.run("I18N.localize({title:'RU',titleKz:'KK'},'title','kk')"), 'KK');
  app.run("ML.setSetting('lang','ru')");
  assert.equal(app.run('ML.getLang()'), 'ru');

  const legacy = boot({ math_logic_lang: 'kz' });
  assert.equal(legacy.run('ML.getLang()'), 'kk');
  assert.equal(legacy.run("ML.get('settings.lang')"), 'kk');

  const savedLegacy = boot({ mathlogic_data: JSON.stringify({ version: 2, settings: { lang: 'kz' } }) });
  assert.equal(savedLegacy.run('ML.getLang()'), 'kk');
  assert.equal(savedLegacy.run("ML.get('settings.lang')"), 'kk');
}

function testLearningReset() {
  const app = boot();
  app.run("ML.setUser({name:'Test',loggedIn:true});ML.setLang('ru');Learning.completeLesson('algebra.vieta.intro',{percentage:100,correctAnswers:3,totalQuestions:3});Learning.resetAll()");
  assert.equal(app.run("ML.get('settings.lang')"), 'ru');
  assert.equal(app.run("ML.get('user.name')"), 'Test');
  assert.equal(app.run("ML.get('user.loggedIn')"), true);
  assert.equal(app.run('Object.keys(ML.getCompletedLessons()).length'), 0);
  assert.equal(app.run("Object.keys(ML.get('rewards',{})).length"), 0);
}

function testSubjectReset() {
  const app = boot();
  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5});Learning.completeLesson('algebra.vieta.intro',{percentage:100,correctAnswers:3,totalQuestions:3})");
  app.run("Learning.resetSubject('algebra')");
  assert.equal(app.run('Object.keys(ML.getCompletedLessons()).length'), 0);
  assert.equal(app.run("Object.keys(ML.get('progress.subtopics')).length"), 0);
  assert.equal(app.run("ML.get('stats.lessons_completed')"), 0);
  assert.equal(app.run("Object.keys(ML.get('rewards')).length"), 0);
}

function testCorruptStorageFallback() {
  const app = boot({ mathlogic_data: '{broken json' });
  assert.equal(app.run("ML.get('version')"), 2);
  assert.ok(app.run('ML.getDiagnostics().length') > 0);
}

function testCompletionDoesNotMutateLegacyGameFields() {
  const app = boot({ mathlogic_data: JSON.stringify({ version: 2, user: { xp: 125, streak: 4 }, rewards: { legacy: { amount: 10 } }, achievements: [{ id: 'legacy' }] }) });
  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5,duration:20})");
  assert.equal(app.run("ML.get('user.xp')"), 125);
  assert.equal(app.run("ML.get('user.streak')"), 4);
  assert.equal(app.run("Object.keys(ML.get('rewards')).length"), 1);
  assert.equal(app.run("ML.get('achievements').length"), 1);
  assert.equal(app.run("ML.get('activity.dates').length"), 1);
}

function testActivityHistory() {
  const app = boot();
  assert.equal(app.run('ML.getActivityRange().length'), 365);
  assert.equal(app.run('ML.getActivityRange().filter(function(day){return day.active;}).length'), 0);

  const today = boot();
  today.run('ML.recordLearningActivity(90)');
  assert.equal(today.run('ML.getActivityByDate().active'), true);
  assert.equal(today.run('ML.getActivityByDate().seconds'), 90);
  assert.equal(today.run('ML.getActivityRange().filter(function(day){return day.active;}).length'), 1);

  app.run("ML.recordLearningActivity(120,new Date(2024,1,29,23,30).getTime())");
  assert.equal(app.run("ML.getActivityByDate('2024-02-29').active"), true);
  assert.equal(app.run("ML.getActivityByDate('2024-02-29').seconds"), 120);
  assert.equal(app.run("ML.getActivityByDate('2024-02-29').intensity"), 1);

  app.run("ML.recordLearningActivity(300,new Date(2024,1,29,23,45).getTime())");
  assert.equal(app.run("ML.getActivityByDate('2024-02-29').seconds"), 420);
  assert.equal(app.run("ML.getActivityByDate('2024-02-29').intensity"), 2);
  assert.equal(app.run("ML.get('activity.dates').filter(function(day){return day==='2024-02-29';}).length"), 1);

  app.run("ML.recordLearningActivity(900,new Date(2024,2,1,0,15).getTime())");
  assert.deepEqual(Array.from(app.run("ML.getActivityRange('2024-02-28','2024-03-01').map(function(day){return day.date;})")), ['2024-02-28', '2024-02-29', '2024-03-01']);
  assert.equal(app.run("ML.getActivityRange('2024-02-28','2024-03-01').filter(function(day){return day.active;}).length"), 2);

  app.run("ML.recordLearningActivity(60,new Date(2025,11,31,23,30).getTime());ML.recordLearningActivity(60,new Date(2026,0,1,0,30).getTime())");
  assert.equal(app.run("ML.getActivityRange('2025-12-31','2026-01-01').length"), 2);
  assert.equal(app.run("ML.getActivityRange('2025-12-31','2026-01-01').every(function(day){return day.active;})"), true);
  assert.equal(app.run("ML.getActivityRange('2026-01-02','2026-01-01').length"), 0);
  assert.equal(app.run('ML.getActivityIntensity(0,false)'), 0);
  assert.equal(app.run('ML.getActivityIntensity(1800,true)'), 4);
}

function testLearningHistory() {
  const app = boot();
  assert.equal(app.run('ML.getLearningHistory().length'), 0);
  const base = new Date(2026, 7, 8, 15, 0).getTime();

  const started = app.run("ML.addLearningEvent({type:'LESSON_STARTED',lessonId:'algebra.exponents.basics',timestamp:" + base + ",metadata:{completedBlocks:1}})");
  assert.equal(started.added, true);
  const duplicateStart = app.run("ML.addLearningEvent({type:'LESSON_STARTED',lessonId:'algebra.exponents.basics',timestamp:" + (base + 60000) + "})");
  assert.equal(duplicateStart.added, false);
  assert.equal(app.run("ML.getLearningHistory({lessonId:'algebra.exponents.basics'}).length"), 1);

  app.run("ML.addLearningEvent({type:'LESSON_CONTINUED',lessonId:'algebra.exponents.basics',timestamp:" + (base + 3600000) + "})");
  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:80,correctAnswers:4,totalQuestions:5,duration:600,completedAt:" + (base + 7200000) + "})");
  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5,completedAt:" + (base + 7300000) + "})");
  assert.equal(app.run("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.exponents.basics'}).length"), 1);
  assert.equal(app.run("ML.getLearningHistory({lessonId:'algebra.exponents.basics'})[0].metadata.totalQuestions"), 5);

  app.run("Learning.completeLesson('algebra.vieta.intro',{percentage:100,correctAnswers:3,totalQuestions:3,duration:300,completedAt:" + (base + 10800000) + "})");
  assert.equal(app.run("ML.getLearningHistory({lessonId:'algebra.vieta.intro'}).length"), 1);
  assert.equal(app.run("ML.getLearningHistory().every(function(event,index,list){return !index || list[index-1].timestamp >= event.timestamp;})"), true);

  const reloaded = boot(app.context.localStorage.dump());
  assert.equal(reloaded.run('ML.getLearningHistory().length'), app.run('ML.getLearningHistory().length'));
  assert.equal(reloaded.run("ML.getLearningHistory()[0].lessonId"), 'algebra.vieta.intro');

  const malformed = boot({ mathlogic_data: JSON.stringify({ version: 2, activity: { history: [null, 'bad', { type: 'UNKNOWN', lessonId: 'x', timestamp: base }, { type: 'LESSON_STARTED', lessonId: '', timestamp: base }] } }) });
  assert.equal(malformed.run('ML.getLearningHistory().length'), 0);

  const backfilled = boot({ mathlogic_data: JSON.stringify({ version: 2, progress: { lessons: { 'algebra.exponents.basics': { status: 'completed', completedAt: base, correctAnswers: 4, totalQuestions: 5, duration: 600 } } } }) });
  assert.equal(backfilled.run("ML.getLearningHistory({types:['LESSON_COMPLETED']}).length"), 1);
  assert.equal(backfilled.run("ML.getLearningHistory()[0].timestamp"), base);

  const capped = boot();
  capped.run("for(var i=0;i<205;i++){ML.addLearningEvent({type:i%2?'LESSON_STARTED':'LESSON_CONTINUED',lessonId:'algebra.exponents.basics',timestamp:" + base + "+i*31*60*1000})}");
  assert.equal(capped.run('ML.getLearningHistory().length'), 200);
  assert.equal(capped.run('ML.getLearningHistory()[0].timestamp > ML.getLearningHistory()[199].timestamp'), true);
}

testCanonicalLifecycle();
testRegistryAndConfigs();
testLegacyMigration();
testScatteredLegacyMigration();
testLanguageCompatibility();
testLearningReset();
testSubjectReset();
testCorruptStorageFallback();
testCompletionDoesNotMutateLegacyGameFields();
testActivityHistory();
testLearningHistory();
console.log('core-smoke: ok');
