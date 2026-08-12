/* Targeted dashboard data regression checks: resume, topic context, and journal. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCES = ['data/curriculum.js', 'js/data.js', 'js/storage.js', 'js/i18n.js', 'js/events.js', 'js/learning.js', 'js/dashboard-data.js'];

function boot(seed) {
  const values = { mathlogic_data: JSON.stringify(seed) };
  const context = {
    console,
    localStorage: {
      get length() { return Object.keys(values).length; },
      key(index) { return Object.keys(values)[index] || null; },
      getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
      setItem(key, value) { values[key] = String(value); },
      removeItem(key) { delete values[key]; },
    },
    addEventListener() {},
    document: { documentElement: { dataset: {}, style: { setProperty() {} } }, addEventListener() {}, dispatchEvent() {} },
    CustomEvent: function(name, options) { this.type = name; this.detail = options && options.detail; },
  };
  context.window = context;
  vm.createContext(context);
  SOURCES.forEach(function(file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  });
  return context;
}

function data(overrides) {
  return Object.assign({
    version: 2,
    user: { id: 'learner', name: 'Алия', createdAt: 1 },
    progress: { lessons: {}, subtopics: {} },
    lesson: { sessions: {} },
    settings: { lang: 'ru' }, stats: {}, achievements: [], timeline: [], analytics: {}, rewards: {},
    activity: { dates: [], studySecondsByDate: {}, history: [] },
  }, overrides || {});
}

const resumedId = 'geometry.g7.geo-02.elements';
const olderId = 'algebra.exponents.basics';
const app = boot(data({
  lesson: { sessions: {
    [olderId]: { completedBlocks: [0], startedAt: 100, updatedAt: 200 },
    [resumedId]: { completedBlocks: [0, 1, 2], startedAt: 300, updatedAt: 400 },
  } },
  activity: { dates: [], studySecondsByDate: {}, history: [
    { id: 'resume', type: 'LESSON_CONTINUED', lessonId: resumedId, subjectId: 'geometry', topicId: 'GEO-02.elements', timestamp: 400, metadata: { completedBlocks: 3 } },
    { id: 'done', type: 'LESSON_COMPLETED', lessonId: olderId, subjectId: 'algebra', topicId: 'ALG-02.exponents', timestamp: 350, metadata: {} },
  ] },
}));
const model = app.DashboardData.getModel('ru');
assert.equal(model.focus.id, resumedId, 'the most recently saved session is the dashboard resume lesson');
assert.equal(model.action.id, resumedId);
assert.equal(model.resume.id, resumedId);
assert.equal(model.topic.id, app.MATHLOGIC_CURRICULUM.getLesson(resumedId).topicId, 'topic comes from canonical curriculum');
assert.ok(model.topic.lessons.some(function(lesson) { return lesson.id === resumedId; }));
assert.equal(model.recent[0].lessonId, resumedId, 'recent activity preserves chronological learning history');
assert.equal(model.recent[0].completedBlocks, 3, 'saved block count is real session activity metadata');

const legacy = boot(data({
  progress: { lessons: { [olderId]: { status: 'completed', completedAt: 900 } }, subtopics: {} },
}));
const fallback = legacy.DashboardData.recentActivity('kk', 3);
assert.equal(fallback.length, 1, 'completed records are a graceful fallback when old history is empty');
assert.equal(fallback[0].type, 'LESSON_COMPLETED');
assert.ok(fallback[0].title, 'fallback preserves localized lesson title');

const completedOnly = boot(data({
  progress: { lessons: { [olderId]: { status: 'completed', completedAt: 900 } }, subtopics: {} },
}));
vm.runInContext("ML.update(function(saved) { Object.keys(Learning.getRegistry()).forEach(function(id) { saved.progress.lessons[id] = { status: 'completed', completedAt: 900 }; }); });", completedOnly);
const completedModel = completedOnly.DashboardData.getModel('ru');
assert.equal(completedModel.action, null, 'a last completed lesson is context only, never a fictional next lesson');
assert.equal(completedModel.focus.status, 'completed');

console.log('dashboard-data: ok');
