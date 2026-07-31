/* Dependency-free smoke checks for storage, XP and canonical lesson lifecycle. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCES = [
  'js/data.js', 'js/storage.js', 'js/i18n.js', 'js/xp.js', 'js/events.js', 'js/learning.js',
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
  assert.equal(first.xpEarned, 90);
  assert.equal(app.run('XP.getXP()'), 90);
  assert.equal(app.run("ML.getLessonSession('algebra.exponents.basics')"), null);
  assert.ok(app.run("Object.keys(ML.get('progress.subtopics')).length") > 0);
  const repeated = app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5})");
  assert.equal(repeated.xpEarned, 0);
  assert.equal(app.run('XP.getXP()'), 90);
  assert.equal(app.run("ML.get('stats.xp_earned')"), 90);
  app.run("Learning.resetLesson('algebra.exponents.basics')");
  assert.equal(app.run("Object.keys(ML.get('progress.subtopics')).length"), 0);
  assert.equal(app.run("ML.get('stats.lessons_completed')"), 0);
  const afterReset = app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5})");
  assert.equal(afterReset.xpEarned, 0);
  assert.equal(app.run('XP.getXP()'), 90);
}

function testRegistryAndConfigs() {
  const app = boot();
  const ids = app.run('Object.keys(LESSON_REGISTRY)');
  assert.deepEqual(Array.from(ids), ['algebra.exponents.basics', 'algebra.vieta.intro']);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(app.run("LessonValidator.validate(LESSON_EXPONENTS).valid"), true);
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
  assert.equal(app.run("ML.get('rewards')['lesson:algebra.exponents.basics'].reason"), 'legacy-lesson');
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
  assert.equal(app.run("I18N.t('lesson.repeat','kz')"), 'Қайталау · XP есептелмейді');
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

function testXpBoundariesAndReset() {
  const app = boot();
  [[0, 1], [99, 1], [100, 2], [399, 2], [400, 3]].forEach(function(pair) {
    app.run('XP.setXP(' + pair[0] + ')');
    assert.equal(app.run('XP.getLevel()'), pair[1]);
  });
  app.run("ML.setUser({name:'Test',loggedIn:true});ML.setLang('ru');Learning.completeLesson('algebra.vieta.intro',{percentage:100,correctAnswers:3,totalQuestions:3});Learning.resetAll()");
  assert.equal(app.run('XP.getXP()'), 0);
  assert.equal(app.run("ML.get('settings.lang')"), 'ru');
  assert.equal(app.run("ML.get('user.name')"), 'Test');
  assert.equal(app.run("ML.get('user.loggedIn')"), true);
  assert.equal(app.run('Object.keys(ML.getCompletedLessons()).length'), 0);
  assert.equal(app.run("Object.keys(ML.get('rewards',{})).length"), 0);
}

function testSubjectReset() {
  const app = boot();
  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5});Learning.completeLesson('algebra.vieta.intro',{percentage:100,correctAnswers:3,totalQuestions:3})");
  assert.equal(app.run('XP.getXP()'), 160);
  app.run("Learning.resetSubject('algebra')");
  assert.equal(app.run('Object.keys(ML.getCompletedLessons()).length'), 0);
  assert.equal(app.run("Object.keys(ML.get('progress.subtopics')).length"), 0);
  assert.equal(app.run("ML.get('stats.lessons_completed')"), 0);
  assert.equal(app.run('XP.getXP()'), 160);
  assert.equal(app.run("Object.keys(ML.get('rewards')).length"), 2);
}

function testCorruptStorageFallback() {
  const app = boot({ mathlogic_data: '{broken json' });
  assert.equal(app.run("ML.get('version')"), 2);
  assert.ok(app.run('ML.getDiagnostics().length') > 0);
}

function testRetiredDashboardAchievements() {
  const app = boot();
  app.run("XP.setXP(75);ML.set('achievements',[{id:'first_quest',completed:true,rewardXP:50}])");
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/achievements.js'), 'utf8'), app.context, { filename: 'js/achievements.js' });
  assert.equal(app.run("ML.get('achievements').some(function(item){return item.id==='first_quest'||item.id==='thirty_quests';})"), false);
  assert.equal(app.run('XP.getXP()'), 75);
}

testCanonicalLifecycle();
testRegistryAndConfigs();
testLegacyMigration();
testScatteredLegacyMigration();
testLanguageCompatibility();
testXpBoundariesAndReset();
testSubjectReset();
testCorruptStorageFallback();
testRetiredDashboardAchievements();
console.log('core-smoke: ok');
