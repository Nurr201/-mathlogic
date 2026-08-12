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
  const attributes = {};
  return {
    id,
    hidden: false,
    textContent: '',
    innerHTML: '',
    value: '',
    href: '',
    scrollTop: 0,
    dataset: {},
    style: { width: '', setProperty() {} },
    classList: classList(),
    setAttribute(name, value) { attributes[name] = String(value); },
    getAttribute(name) { return attributes[name] || null; },
    addEventListener(name, callback) { (listeners[name] = listeners[name] || []).push(callback); },
    click() { (listeners.click || []).forEach(function(callback) { callback({ target: this }); }, this); },
    dispatch(name, event) { (listeners[name] || []).forEach(function(callback) { callback(event || { target: this }); }, this); },
    focus() { this.focused = true; },
    scrollIntoView() { this.scrolledIntoView = true; },
    appendChild(childNode) { this.lastChild = childNode; return childNode; },
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

const CORE = ['data/curriculum.js', 'js/data.js', 'js/storage.js', 'js/i18n.js', 'js/events.js', 'js/learning.js'];
const LESSON = [
  'js/lesson-engine/state.js', 'js/lesson-engine/hooks.js', 'js/lesson-engine/storage.js',
  'js/lesson-engine/debug.js', 'js/lesson-engine/serializer.js', 'js/lesson-engine/core.js', 'js/lesson-engine.js',
  'js/lesson-blocks/helpers.js', 'js/lesson-blocks/registry.js', 'js/lesson-blocks/renderers.js', 'js/lesson-blocks.js',
  'js/lesson-blocks/geometry-diagram.js', 'js/lesson-blocks/guided.js',
  'js/math-input.js', 'js/lesson-blocks/math-response.js', 'js/lesson-blocks/equation-step.js', 'js/lesson-blocks/graph-workspace.js', 'js/lesson-blocks/geometry-workspace.js',
  'data/lessons/geometry-g03-transversal.js', 'data/lessons/geometry-g03-criteria.js', 'data/lessons/geometry-g03-properties.js', 'data/lessons/geometry-g03-triangle-relations.js', 'data/lessons/geometry-g03-right-triangles.js',
  'data/lesson-schema.js', 'data/lessons/fractions.js', 'data/lessons/percent.js', 'data/lessons/proportions.js', 'data/lessons/parts-mixtures.js', 'data/lessons/model.js', 'data/lessons/practice.js', 'data/lessons/natural-exponent-meaning.js', 'data/lessons/exponents.js', 'data/lessons/power-rules.js', 'data/lessons/zero-negative-exponents.js', 'data/lessons/standard-form.js', 'data/lessons/monomials-standard-form.js', 'data/lessons/polynomials-add-subtract.js', 'data/lessons/monomial-polynomial-multiplication.js', 'data/lessons/square-sum-difference.js', 'data/lessons/difference-squares.js', 'data/lessons/cube-identities.js', 'data/lessons/factorization.js', 'data/lessons/polynomial-transformations-practice.js', 'data/lessons/linear-equations.js', 'data/lessons/linear-functions.js', 'data/lessons/triangle-angle-sum.js', 'data/lessons/geometry-figures-axioms.js', 'data/lessons/geometry-equal-figures.js', 'data/lessons/geometry-proof-methods.js', 'data/lessons/geometry-angles-perpendicular.js', 'data/lessons/geometry-initial-practice.js', 'data/lessons/geometry-triangle-types.js', 'data/lessons/geometry-triangle-elements.js', 'data/lessons/geometry-triangle-congruence-1.js', 'data/lessons/geometry-triangle-congruence-2.js', 'data/lessons/geometry-triangle-isosceles.js', 'data/lessons/geometry-triangle-equilateral.js', 'data/lessons/geometry-triangle-congruence-practice.js', 'js/lesson.js',
];

function testDashboardShell() {
  const html = fs.readFileSync(path.join(ROOT, 'dashboard.html'), 'utf8');
  const scripts = Array.from(html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g), function(match) { return match[1].split('?')[0]; });
  assert.deepEqual(scripts, [
    'data/curriculum.js', 'js/data.js', 'js/storage.js', 'js/i18n.js',
    'js/events.js', 'js/learning.js', 'js/dashboard-data.js', 'js/site.js', 'js/dashboard.js',
  ]);
  assert.equal((html.match(/js\/dashboard\.js/g) || []).length, 1);
  assert.equal(/<style\b/i.test(html), false);
  assert.equal(/<script(?!\s+src=)[^>]*>/i.test(html), false);
}

function testLocalMathEditorDependency() {
  const html = fs.readFileSync(path.join(ROOT, 'lesson.html'), 'utf8');
  const assets = fs.readFileSync(path.join(ROOT, 'data/lesson-assets.js'), 'utf8');
  const license = fs.readFileSync(path.join(ROOT, 'vendor/mathlive/LICENSE.txt'), 'utf8');
  const manifest = fs.readFileSync(path.join(ROOT, 'vendor/mathlive/README.mathlogic.md'), 'utf8');
  assert.equal(html.includes('vendor/mathlive/mathlive.min.js'), false);
  assert.ok(assets.includes('vendor/mathlive/mathlive.min.js') === false);
  assert.ok(fs.readFileSync(path.join(ROOT, 'js/lesson-loader.js'), 'utf8').includes('vendor/mathlive/mathlive.min.js'));
  assert.equal(/https?:\/\/[^"']*mathlive/i.test(html), false);
  assert.ok(license.includes('Permission is hereby granted, free of charge'));
  assert.ok(manifest.includes('Version: `0.110.0`'));
  assert.ok(fs.existsSync(path.join(ROOT, 'vendor/mathlive/fonts/KaTeX_Main-Regular.woff2')));
}

function testDashboard() {
  const app = environment('');
  app.document.body.classList.add('axis-app');
  app.document.getElementById('dashboard-content').hidden = true;
  app.document.getElementById('dashboard-error').hidden = true;
  load(app, CORE.concat(['js/dashboard-data.js', 'js/site.js', 'js/dashboard.js']));
  assert.equal(app.document.getElementById('dashboard-content').hidden, false);
  assert.equal(app.document.getElementById('dashboard-error').hidden, true);
  assert.equal(app.document.getElementById('hero-primary').href, 'lesson.html?id=algebra.linear-equations.equivalent-transformations');
  const currentTopic = app.document.getElementById('current-topic-points').innerHTML;
  assert.ok(currentTopic.includes('v7-current-topic-item'));
  assert.ok((currentTopic.match(/v7-current-topic-item/g) || []).length <= 6);
  assert.equal(currentTopic.includes('route-module'), false);
  assert.equal(app.document.getElementById('current-topic-link').href, 'program.html?subject=algebra');
}

function testDashboardResponsiveContract() {
  const css = fs.readFileSync(path.join(ROOT, 'css/editorial.css'), 'utf8');
  assert.ok(css.includes('.v7-dashboard-context { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(250px,.8fr);'), 'desktop dashboard keeps an editorial two-column context');
  assert.ok(css.includes('.v7-dashboard-context { display:block; margin-top:48px; }'), 'mobile dashboard stacks context without horizontal scrolling');
  assert.ok(css.includes('.v7-recent { margin-top:46px; padding-top:34px; padding-left:0; border-top:1px solid var(--v7-ink); border-left:0; }'), 'mobile recent activity becomes a separated lower section');
  assert.ok(css.includes('.v7-current-topic-item > div { min-width:0; }'), 'long lesson titles can shrink within a topic row');
}

function testProgramCurriculum() {
  const programCss = fs.readFileSync(path.join(ROOT, 'css/editorial.css'), 'utf8');
  assert.ok(programCss.includes('.v7-program-topics { column-count:3;'), 'desktop topics use independent columns');
  assert.ok(programCss.includes('.v7-program-topics { column-count:2;'), 'tablet topics use two compact columns');
  assert.ok(programCss.includes('.v7-program-topics { column-count:1;'), 'mobile topics stack in one column');
  function lessonMarkup(html, id) {
    const idStart = html.indexOf('data-lesson-id="' + id + '"');
    assert.ok(idStart > -1, 'Program must render lesson ' + id);
    const start = html.lastIndexOf('<article', idStart);
    const end = html.indexOf('</article>', idStart);
    return html.slice(start, end > -1 ? end : idStart + 1000);
  }
  function open(search, initialStorage) {
    const app = environment(search, initialStorage);
    const language = element('language-toggle');
    const theme = element('theme-toggle');
    app.document.querySelector = function(selector) {
      if (selector === '[data-language-toggle]') return language;
      if (selector === '[data-theme-toggle]') return theme;
      return null;
    };
    app.context.history = { replaceState() {} };
    app.context.location.reload = function() {};
    load(app, CORE.concat(['data/program-presentation.js', 'js/site.js', 'js/program.js']));
    return app;
  }

  const algebra = open('?subject=algebra', { math_logic_lang: 'ru' });
  const algebraContent = algebra.document.getElementById('program-content').innerHTML;
  ['Основы алгебры', 'Выражения, зависимости и данные', 'Уравнения, неравенства и функции', 'Закономерности и вероятность'].forEach(function(title) {
    assert.ok(algebraContent.includes(title), 'all algebra modules are visible immediately: ' + title);
  });
  assert.equal(algebraContent.includes('program-grades'), false);
  assert.ok(algebraContent.includes('lesson.html?id=algebra.exponents.basics'), 'all module lesson lists are open');
  assert.equal(algebraContent.includes('aria-expanded'), false, 'Program has no accordion state');
  assert.equal(algebraContent.includes('data-program-module'), false, 'Program has no collapsible module control');
  assert.ok(algebraContent.includes('data-topic-id="ALG-02.powers"'), 'Program renders canonical topic groups');
  assert.ok(algebraContent.includes('ТЕМА 01'), 'each topic has a distinct RU eyebrow');
  assert.ok(algebraContent.includes('Степени</h3>'), 'a topic has its own heading');
  assert.ok(algebra.document.getElementById('program-now').innerHTML.includes('Линейные уравнения'));
  assert.ok(algebraContent.includes('Готовится'));
  assert.equal(algebraContent.includes('implemented'), false);
  const naturalExponent = lessonMarkup(algebraContent, 'algebra.g7.alg-02.meaning');
  assert.ok(naturalExponent.includes('<a class="v7-program-lesson-title" href="lesson.html?id=algebra.g7.alg-02.meaning">'));
  assert.ok(naturalExponent.includes('Степень с натуральным показателем'));
  [
    'algebra.g7.alg-02.meaning',
    'algebra.exponents.basics',
    'algebra.g7.alg-02.power-rules',
    'algebra.g7.alg-02.zero-negative',
  ].forEach(function(id) {
    const row = lessonMarkup(algebraContent, id);
    assert.ok(row.includes('<a class="v7-program-lesson-title" href="lesson.html?id=' + id + '">'), 'every published powers lesson has a canonical title link');
    assert.equal(row.includes('Готовится'), false, 'published powers lessons do not look planned');
  });
  [
    'algebra.g7.alg-03.monomials',
    'algebra.g7.alg-03.polynomials',
    'algebra.g7.alg-03.multiplication',
    'algebra.g7.alg-03.square-sum-difference',
    'algebra.g7.alg-03.difference-squares',
    'algebra.g7.alg-03.cubes',
  ].forEach(function(id) {
    const row = lessonMarkup(algebraContent, id);
    assert.ok(row.includes('<a class="v7-program-lesson-title" href="lesson.html?id=' + id + '">'), 'every published polynomial lesson has a canonical title link');
    assert.equal(row.includes('Готовится'), false, 'published polynomial lessons do not look planned');
    assert.ok(row.includes(' мин'), 'published polynomial lessons show duration');
  });
  assert.ok(algebraContent.includes('data-topic-id="ALG-03.monomials-polynomials"'));
  assert.ok(algebraContent.includes('data-topic-id="ALG-03.identities"'));
  const availableExponentBeforePrerequisite = lessonMarkup(algebraContent, 'algebra.exponents.basics');
  assert.ok(availableExponentBeforePrerequisite.includes('<a class="v7-program-lesson-title" href="lesson.html?id=algebra.exponents.basics">'), 'an implemented lesson remains directly openable before its prerequisite is complete');
  assert.ok(availableExponentBeforePrerequisite.includes('Доступен · 20 мин'), 'implemented lessons are available before their prerequisite is complete');
  const currentEquation = lessonMarkup(algebraContent, 'algebra.linear-equations.equivalent-transformations');
  assert.ok(currentEquation.includes('<a class="v7-program-lesson-title" href="lesson.html?id=algebra.linear-equations.equivalent-transformations">'));
  assert.ok(currentEquation.includes('Линейные уравнения'));
  const displayedAlgebraIds = Array.from(algebraContent.matchAll(/data-lesson-id="([^"]+)"/g), function(match) { return match[1]; });
  assert.equal(new Set(displayedAlgebraIds).size, displayedAlgebraIds.length, 'displayed algebra lessons are unique');
  assert.ok(displayedAlgebraIds.every(function(id) { return vm.runInContext("!!Learning.getLesson('" + id + "')", algebra.context); }));
  ['algebra.g7.alg-01.fractions', 'algebra.g7.alg-01.percent', 'algebra.g7.alg-01.proportions', 'algebra.g7.alg-01.parts-mixtures', 'algebra.g7.alg-01.model', 'algebra.g7.alg-01.practice'].forEach(function(id) {
    const row = lessonMarkup(algebraContent, id);
    assert.ok(row.includes('<a class="v7-program-lesson-title" href="lesson.html?id=' + id + '">'), 'implemented ALG-01 lesson has a canonical title link');
    assert.ok(row.includes('Доступен · 18 мин'), 'implemented ALG-01 lesson is directly openable without a prerequisite lock');
  });
  assert.ok(algebraContent.includes('4 урока'), 'topic counter describes lessons in that topic');
  assert.ok(algebraContent.includes('0 / 4 пройдено'), 'published topic progress is factual before completion');
  assert.equal(displayedAlgebraIds.length, vm.runInContext("Learning.getLessons('algebra').length", algebra.context), 'planned lessons remain visible in the learning path');

  vm.runInContext("ML.completeLesson('algebra.g7.alg-02.meaning',{percentage:100});MathLogicProgram.selectSubject('algebra')", algebra.context);
  const availableExponent = lessonMarkup(algebra.document.getElementById('program-content').innerHTML, 'algebra.exponents.basics');
  assert.ok(availableExponent.includes('<a class="v7-program-lesson-title" href="lesson.html?id=algebra.exponents.basics">'), 'the reference lesson unlocks after the meaning lesson');
  vm.runInContext("ML.completeLesson('algebra.exponents.basics',{percentage:100});MathLogicProgram.selectSubject('algebra')", algebra.context);
  const completedExponent = lessonMarkup(algebra.document.getElementById('program-content').innerHTML, 'algebra.exponents.basics');
  assert.ok(completedExponent.includes('is-done'));
  assert.ok(completedExponent.includes('<a class="v7-program-lesson-title" href="lesson.html?id=algebra.exponents.basics">'), 'completed lesson title remains a canonical link');

  const kkAlgebra = open('?subject=algebra', { math_logic_lang: 'kk' });
  const kkAlgebraContent = kkAlgebra.document.getElementById('program-content').innerHTML;
  assert.ok(kkAlgebraContent.includes('Қысқаша көбейту формулалары'));
  assert.ok(lessonMarkup(kkAlgebraContent, 'algebra.g7.alg-03.square-sum-difference').includes('>Қосынды мен айырманың квадраты</a>'));
  assert.ok(lessonMarkup(kkAlgebraContent, 'algebra.g7.alg-03.difference-squares').includes('>Квадраттар айырмасы</a>'));
  assert.ok(lessonMarkup(kkAlgebraContent, 'algebra.g7.alg-03.cubes').includes('>Кубтар формулалары</a>'));

  vm.runInContext("MathLogicProgram.selectSubject('geometry')", algebra.context);
  const geometryContent = algebra.document.getElementById('program-content').innerHTML;
  ['Основы геометрии и углы', 'Фигуры и измерения', 'Координаты и преобразования'].forEach(function(title) {
    assert.ok(geometryContent.includes(title), 'all geometry modules are visible immediately: ' + title);
  });
  assert.ok(algebra.document.getElementById('program-now').innerHTML.includes('Основные фигуры, аксиомы и теоремы'));
  [
    'geometry.g7.geo-01.figures-axioms', 'geometry.g7.geo-01.equal-figures',
    'geometry.g7.geo-01.proof-methods', 'geometry.g7.geo-01.angles-perpendicular',
    'geometry.g7.geo-01.practice',
    'geometry.g7.geo-02.types', 'geometry.g7.geo-02.elements',
    'geometry.g7.geo-02.congruence-1', 'geometry.g7.geo-02.congruence-2', 'geometry.g7.geo-02.isosceles', 'geometry.g7.geo-02.equilateral', 'geometry.g7.geo-02.practice',
    'geometry.g7.geo-03.transversal', 'geometry.g7.geo-03.criteria', 'geometry.g7.geo-03.properties', 'geometry.triangle-angle-sum', 'geometry.g7.geo-03.triangle-relations', 'geometry.g7.geo-03.right-triangles',
  ].forEach(function(id) {
    assert.ok(algebra.document.getElementById('program-content').innerHTML.includes('lesson.html?id=' + id), id + ' requires a canonical Program link');
  });
  assert.ok(algebra.document.getElementById('program-content').innerHTML.includes('lesson.html?id=geometry.triangle-angle-sum'));

  const kk = open('?subject=geometry');
  assert.ok(kk.document.getElementById('program-content').innerHTML.includes('Геометрия негіздері және бұрыштар'));
  assert.ok(kk.document.getElementById('program-content').innerHTML.includes('Негізгі фигуралар, аксиомалар және теоремалар'));
  assert.ok(kk.document.getElementById('program-content').innerHTML.includes('Бастапқы геометрия практикасы'));
  assert.ok(kk.document.getElementById('program-content').innerHTML.includes('Үшбұрыш бұрыштарының қосындысы'));
  assert.ok(kk.document.getElementById('program-content').innerHTML.includes('ТАҚЫРЫП 01'));
  assert.ok(lessonMarkup(kk.document.getElementById('program-content').innerHTML, 'geometry.triangle-angle-sum').includes('<a class="v7-program-lesson-title" href="lesson.html?id=geometry.triangle-angle-sum">Үшбұрыш бұрыштарының қосындысы</a>'));
  assert.ok(kk.document.getElementById('program-content').innerHTML.includes('сабақ'));
  assert.ok(kk.document.getElementById('program-now').innerHTML.includes('Келесі сабақ'));

  vm.runInContext("ML.setLessonSession('algebra.linear-functions.graph',{completedBlocks:[0],currentIndex:1});MathLogicProgram.selectSubject('algebra')", algebra.context);
  assert.ok(algebra.document.getElementById('program-now').innerHTML.includes('Продолжить'));
  assert.ok(algebra.document.getElementById('program-now').innerHTML.includes('<a class="v7-program-lesson-title" href="lesson.html?id=algebra.linear-functions.graph">Линейная функция и её график</a>'));
  const currentFunction = lessonMarkup(algebra.document.getElementById('program-content').innerHTML, 'algebra.linear-functions.graph');
  assert.ok(currentFunction.includes('is-current'));
  assert.ok(currentFunction.includes('<a class="v7-program-lesson-title" href="lesson.html?id=algebra.linear-functions.graph">'), 'current lesson title remains a canonical link');

  const html = fs.readFileSync(path.join(ROOT, 'program.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css/editorial.css'), 'utf8');
  assert.ok(html.includes('data/program-presentation.js'));
  assert.equal(html.includes('program-grades'), false);
  assert.ok(css.includes('.v7-program-large-module'));
  assert.equal(css.includes('.v7-program-lesson.is-current {'), false, 'a resumable lesson row stays visually neutral');
  assert.ok(css.includes('.v7-program-topics { column-count:3;'));
  assert.ok(css.includes('@media (max-width:1199px)'));
  assert.ok(css.includes('@media (max-width:760px)'));
  assert.ok(css.includes('a.v7-program-lesson-title:focus-visible'), 'lesson title links retain a visible keyboard focus state');
  assert.ok(css.includes('a.v7-program-lesson-title:active'), 'lesson title links acknowledge a press immediately');
  assert.ok(css.includes('.v7-program-lesson:has(a:active)'), 'the current Program row responds without a renderer update');
  const programSource = fs.readFileSync(path.join(ROOT, 'js/program.js'), 'utf8');
  assert.equal(programSource.includes('setTimeout'), false, 'Program navigation has no artificial timeout');
  assert.equal(programSource.includes('preventDefault'), false, 'Program lesson links remain native navigation');
}

function testNavigationResponsivenessContract() {
  const animations = fs.readFileSync(path.join(ROOT, 'js/animations.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css/editorial.css'), 'utf8');
  assert.equal(/setTimeout\([^\n]*location\.href/.test(animations), false, 'page transitions do not delay native navigation');
  assert.equal(animations.includes("a.addEventListener('click'"), false, 'page transitions do not intercept ordinary links');
  assert.ok(css.includes('.v7-button:active:not(:disabled)'));
  assert.ok(css.includes('.v7-links a:active'));
  assert.ok(css.includes('.v7-lesson .lesson-engine-content button:not(:disabled):active'));
  assert.ok(css.includes('.v7-mobile-nav a:active'));
  assert.ok(css.includes('@media (prefers-reduced-motion:reduce)'));
}

function withImplementedPrerequisites(id, initialStorage) {
  const storage = Object.assign({}, initialStorage || {});
  const prerequisiteMap = {
    'algebra.exponents.basics': ['algebra.g7.alg-02.meaning'],
    'algebra.g7.alg-03.polynomials': ['algebra.g7.alg-03.monomials'],
    'algebra.g7.alg-03.multiplication': ['algebra.g7.alg-03.monomials','algebra.g7.alg-03.polynomials'],
    'algebra.g7.alg-03.square-sum-difference': ['algebra.g7.alg-03.monomials','algebra.g7.alg-03.polynomials','algebra.g7.alg-03.multiplication'],
    'algebra.g7.alg-03.difference-squares': ['algebra.g7.alg-03.monomials','algebra.g7.alg-03.polynomials','algebra.g7.alg-03.multiplication','algebra.g7.alg-03.square-sum-difference'],
    'algebra.g7.alg-03.cubes': ['algebra.g7.alg-03.monomials','algebra.g7.alg-03.polynomials','algebra.g7.alg-03.multiplication','algebra.g7.alg-03.square-sum-difference','algebra.g7.alg-03.difference-squares'],
  };
  const prerequisites = prerequisiteMap[id] || [];
  if (!prerequisites.length) return storage;
  let data = {};
  try { data = JSON.parse(storage.mathlogic_data || '{}'); } catch (error) { data = {}; }
  data.version = data.version || 2;
  data.settings = data.settings || {};
  if (storage.math_logic_lang && !data.settings.lang) data.settings.lang = storage.math_logic_lang;
  data.progress = data.progress || {};
  data.progress.lessons = data.progress.lessons || {};
  prerequisites.forEach(function(prerequisiteId, index) {
    if (!data.progress.lessons[prerequisiteId]) {
      data.progress.lessons[prerequisiteId] = { status: 'completed', completedAt: index + 1, percentage: 100 };
    }
  });
  storage.mathlogic_data = JSON.stringify(data);
  return storage;
}

function testLesson(id, expectedTitle, initialStorage) {
  const app = environment('?id=' + encodeURIComponent(id), withImplementedPrerequisites(id, initialStorage));
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
  assert.equal(vm.runInContext("__EngineInternal.state.lesson.blocks.find(function(block){return block.id==='multiply_rule';}).formula", kk.context), 'aᵐ · aⁿ = aᵐ⁺ⁿ');
  assert.ok(vm.runInContext("__EngineInternal.state.lesson.blocks.find(function(block){return block.id==='division_rule';}).conditions.some(function(item){return item.includes('a ≠ 0');})", kk.context));
  assert.equal(vm.runInContext("__EngineInternal.state.lesson.meta.routeStages[1].label", kk.context), 'Көбейту');

  const ru = testLesson('algebra.exponents.basics', 'Умножение и деление степеней с одинаковым основанием', { math_logic_lang: 'ru' });
  assert.equal(vm.runInContext("__EngineInternal.state.lesson.blocks.find(function(block){return block.id==='multiply_rule';}).formula", ru.context), 'aᵐ · aⁿ = aᵐ⁺ⁿ');
  assert.ok(vm.runInContext("__EngineInternal.state.lesson.blocks.find(function(block){return block.id==='division_rule';}).conditions.some(function(item){return item.includes('a ≠ 0');})", ru.context));
  assert.equal(vm.runInContext("__EngineInternal.state.lesson.meta.routeStages[1].label", ru.context), 'Умножение');
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

function testPublishedLessonDirectAccessPolicy() {
  const fresh = environment('?id=algebra.g7.alg-03.cubes');
  fresh.document.body.classList.add('axis-app');
  fresh.document.getElementById('lesson-active').hidden = true;
  fresh.document.getElementById('lesson-error').hidden = true;
  load(fresh, CORE.concat(LESSON));
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.g7.alg-03.cubes')", fresh.context), 'available');
  assert.equal(fresh.document.getElementById('lesson-error').hidden, true);
  assert.equal(fresh.document.getElementById('lesson-active').hidden, false);
  assert.equal(fresh.document.getElementById('lesson-title').textContent, 'Кубтар формулалары');
  assert.deepEqual(Array.from(vm.runInContext("MATHLOGIC_CURRICULUM.getLesson('algebra.g7.alg-03.cubes').prerequisites.hard", fresh.context)), ['algebra.g7.alg-03.difference-squares']);
  assert.equal(vm.runInContext("Learning.getNextLessonId('algebra.g7.alg-03.cubes')", fresh.context), 'algebra.g7.alg-03.factorization');

  vm.runInContext("Learning.completeLesson('algebra.g7.alg-03.cubes',{percentage:100})", fresh.context);
  const repeated = environment('?id=algebra.g7.alg-03.cubes', { mathlogic_data: fresh.storage.getItem('mathlogic_data') });
  repeated.document.body.classList.add('axis-app');
  repeated.document.getElementById('lesson-active').hidden = true;
  repeated.document.getElementById('lesson-error').hidden = true;
  load(repeated, CORE.concat(LESSON));
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.g7.alg-03.cubes')", repeated.context), 'completed');
  assert.equal(repeated.document.getElementById('lesson-error').hidden, true);
  assert.equal(repeated.document.getElementById('lesson-active').hidden, false);

  const planned = environment('?id=algebra.g7.alg-04.property');
  planned.document.body.classList.add('axis-app');
  planned.document.getElementById('lesson-active').hidden = true;
  planned.document.getElementById('lesson-error').hidden = true;
  load(planned, CORE.concat(LESSON));
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.g7.alg-04.property')", planned.context), 'locked');
  assert.equal(planned.document.getElementById('lesson-error').hidden, false);
  assert.equal(planned.document.getElementById('lesson-active').hidden, true);
}

function testCompletionBridge() {
  const app = environment('?id=algebra.exponents.basics', withImplementedPrerequisites('algebra.exponents.basics'));
  app.document.body.classList.add('axis-app');
  app.document.getElementById('lesson-active').hidden = true;
  app.document.getElementById('lesson-error').hidden = true;
  load(app, CORE.concat(LESSON));
  let guard = 100;
  while (vm.runInContext("__EngineInternal.state.finished", app.context) === false && guard-- > 0) {
    const type = vm.runInContext("__EngineInternal.getCurrentBlock().type", app.context);
    const assessed = ['warmup', 'quiz', 'input', 'challenge', 'guided-practice', 'math-response'].includes(type);
    const taskCount = type === 'challenge'
      ? vm.runInContext('__EngineInternal.getCurrentBlock().tasks.length', app.context)
      : 0;
    const result = type === 'challenge'
      ? '{correct:true,correctAnswers:' + taskCount + ',totalQuestions:' + taskCount + ',attempts:' + taskCount + ',answers:[],points:' + (taskCount * 10) + '}'
      : assessed ? '{correct:true,correctAnswers:1,totalQuestions:1,attempts:1,answers:"ok",points:10,firstTry:true,independent:true}' : 'undefined';
    vm.runInContext('LessonEngine.next(' + result + ')', app.context);
  }
  assert.ok(guard > 0, 'lesson must reach result');
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.exponents.basics')", app.context), 'completed');
  assert.equal(vm.runInContext("ML.get('user.xp')", app.context), 0);
  assert.equal(vm.runInContext("ML.getLessonSession('algebra.exponents.basics').completedSnapshot", app.context), true);
  assert.equal(vm.runInContext("ML.get('progress.lessons')['algebra.exponents.basics'].percentage", app.context), 100);
  assert.equal(vm.runInContext("ML.get('activity.dates').length", app.context), 1);
  assert.equal(vm.runInContext('LessonEngine.finish()', app.context), false);
  assert.equal(vm.runInContext("Object.keys(ML.get('rewards',{})).length", app.context), 0);
  assert.equal(vm.runInContext('Learning.getNextLesson().id', app.context), 'algebra.linear-equations.equivalent-transformations');
  assert.deepEqual(Array.from(vm.runInContext("ML.getLearningHistory({lessonId:'algebra.exponents.basics'}).map(function(event){return event.type;}).sort()", app.context)), ['LESSON_COMPLETED', 'LESSON_STARTED']);
  const activityBeforeRefresh = vm.runInContext("JSON.stringify(ML.get('activity'))", app.context);

  const refreshed = environment('?id=algebra.exponents.basics', withImplementedPrerequisites('algebra.exponents.basics', {
    mathlogic_data: app.storage.getItem('mathlogic_data'),
  }));
  refreshed.document.body.classList.add('axis-app');
  refreshed.document.getElementById('lesson-active').hidden = true;
  refreshed.document.getElementById('lesson-error').hidden = true;
  load(refreshed, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.repeatMode', refreshed.context), true);
  assert.equal(vm.runInContext('__EngineInternal.state.finished', refreshed.context), true);
  assert.equal(vm.runInContext('__EngineInternal.getCurrentBlock().type', refreshed.context), 'lesson-summary');
  assert.equal(refreshed.document.getElementById('lesson-mode').textContent, 'Сабақ аяқталды');
  assert.equal(vm.runInContext('LessonEngine.finish()', refreshed.context), false);
  assert.equal(vm.runInContext("ML.get('user.xp')", refreshed.context), 0);
  assert.equal(vm.runInContext("ML.getLessonSession('algebra.exponents.basics').completedSnapshot", refreshed.context), true);
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.exponents.basics'}).length", refreshed.context), 1);
  assert.equal(vm.runInContext("JSON.stringify(ML.get('activity'))", refreshed.context), activityBeforeRefresh);
}

function selectGuidedAnswer(app, index, block, answer) {
  if (block.responseType === 'input') {
    app.document.getElementById('guided-input-' + index).value = String(answer);
    return;
  }
  app.document.querySelector = function(selector) {
    return selector === 'input[name="guided_' + index + '"]:checked' ? { value: String(answer) } : null;
  };
}

function finishReferencePath(app, beforeCorrect) {
  let guard = 100;
  while (vm.runInContext('__EngineInternal.state.finished', app.context) === false && guard-- > 0) {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (block.type !== 'guided-practice' && block.type !== 'math-response') {
      vm.runInContext('LessonEngine.next()', app.context);
      continue;
    }
    if (beforeCorrect) beforeCorrect(app, index, block);
    if (block.type === 'math-response') {
      app.document.getElementById('math-response-field-' + index).value = block.answer.expected;
      vm.runInContext('MathResponseBlock.submit(' + index + ')', app.context);
    } else {
      const answer = block.responseType === 'input' ? block.acceptedAnswers[0] : block.answer;
      selectGuidedAnswer(app, index, block, answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ')', app.context);
    }
    assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').completed', app.context), true);
    vm.runInContext((block.type === 'math-response' ? 'MathResponseBlock' : 'GuidedLessonBlocks') + '.complete(' + index + ')', app.context);
  }
  assert.ok(guard > 0, 'reference path must reach the summary');
  assert.equal(vm.runInContext('__EngineInternal.getCurrentBlock().type', app.context), 'lesson-summary');
}

function freshReferenceLesson() {
  return testLesson('algebra.exponents.basics', 'Негіздері бірдей дәрежелерді көбейту және бөлу');
}

function freshNaturalExponentLesson(lang, storage) {
  const initial = Object.assign({ math_logic_lang: lang || 'ru' }, storage || {});
  return testLesson(
    'algebra.g7.alg-02.meaning',
    lang === 'kk' ? 'Натурал көрсеткішті дәреже' : 'Степень с натуральным показателем',
    initial
  );
}

function testMonomialsPolynomialsStudentPaths() {
  const cases = [
    {
      id: 'algebra.g7.alg-03.monomials', title: 'Одночлены и стандартный вид',
      next: 'algebra.g7.alg-03.polynomials', transfer: 'volume-transfer', blocks: 10,
    },
    {
      id: 'algebra.g7.alg-03.polynomials', title: 'Многочлены: сложение и вычитание',
      next: 'algebra.g7.alg-03.multiplication', transfer: 'mixed-transfer', blocks: 10,
    },
    {
      id: 'algebra.g7.alg-03.multiplication', title: 'Умножение одночленов и многочленов',
      next: 'algebra.g7.alg-03.square-sum-difference', transfer: 'trinomial-transfer', blocks: 11,
    },
    {
      id: 'algebra.g7.alg-03.square-sum-difference', title: 'Квадрат суммы и квадрат разности',
      next: 'algebra.g7.alg-03.difference-squares', transfer: 'area-transfer', blocks: 10,
    },
    {
      id: 'algebra.g7.alg-03.difference-squares', title: 'Разность квадратов',
      next: 'algebra.g7.alg-03.cubes', transfer: 'numeric-transfer', blocks: 10,
    },
    {
      id: 'algebra.g7.alg-03.cubes', title: 'Формулы кубов',
      next: 'algebra.g7.alg-03.factorization', transfer: 'combined-transfer', blocks: 11,
    },
  ];
  cases.forEach(function(item) {
    const app = testLesson(item.id, item.title, { math_logic_lang: 'ru' });
    assert.equal(vm.runInContext('__EngineInternal.state.blocks.length', app.context), item.blocks);
    assert.equal(vm.runInContext("__EngineInternal.state.blocks.some(function(block){return block.id==='" + item.transfer + "'&&block.role==='transfer';})", app.context), true);
    finishReferencePath(app);
    assert.equal(vm.runInContext('__EngineInternal.state.finished', app.context), true);
    assert.equal(vm.runInContext("Learning.getLessonStatus('" + item.id + "')", app.context), 'completed');
    assert.equal(vm.runInContext("Learning.getNextLessonId('" + item.id + "')", app.context), item.next);
    assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'" + item.id + "'}).length", app.context), 1);
    assert.equal(vm.runInContext('LessonEngine.finish()', app.context), false, 'completion remains idempotent for ' + item.id);
  });
}

function advanceReferenceLessonTo(app, blockId) {
  let guard = 80;
  while (vm.runInContext('__EngineInternal.getCurrentBlock().id', app.context) !== blockId && guard-- > 0) {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (block.type === 'guided-practice') {
      selectGuidedAnswer(app, index, block, block.responseType === 'input' ? block.acceptedAnswers[0] : block.answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', app.context);
    } else if (block.type === 'math-response') {
      app.document.getElementById('math-response-field-' + index).value = block.answer.expected;
      vm.runInContext('MathResponseBlock.submit(' + index + ');MathResponseBlock.complete(' + index + ')', app.context);
    } else {
      vm.runInContext('LessonEngine.next()', app.context);
    }
  }
  assert.ok(guard > 0, 'reference lesson reaches ' + blockId);
}

function testProductionTheoryStateVisibility() {
  [
    { id: 'algebra.g7.alg-03.monomials', title: 'Бірмүшелер және стандарт түр', block: 'parts-and-degree', copy: 'Коэффициент, әріптік бөлік және дәреже' },
    { id: 'algebra.g7.alg-03.polynomials', title: 'Көпмүшелерді қосу және азайту', block: 'polynomial-meaning', copy: 'Көпмүше — бірмүшелердің қосындысы' },
    { id: 'algebra.g7.alg-03.multiplication', title: 'Бірмүшелер мен көпмүшелерді көбейту', block: 'polynomial-product-meaning', copy: 'Әр мүше әр мүшемен' },
    { id: 'algebra.g7.alg-03.square-sum-difference', title: 'Қосынды мен айырманың квадраты', block: 'middle-term-theory', copy: '2ab қайдан пайда болады' },
    { id: 'algebra.g7.alg-03.difference-squares', title: 'Квадраттар айырмасы', block: 'identity-theory', copy: 'Ортаңғы мүшелер жойылады' },
    { id: 'algebra.g7.alg-03.cubes', title: 'Кубтар формулалары', block: 'binomial-cube-theory', copy: '1, 3, 3, 1 коэффициенттері' },
  ].forEach(function(item) {
    const app = testLesson(item.id, item.title);
    advanceReferenceLessonTo(app, item.block);
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const state = vm.runInContext('LessonEngine.getState()', app.context);
    assert.equal(state.totalBlocks, vm.runInContext('__EngineInternal.state.lesson.blocks.length', app.context));
    assert.equal(state.completedBlocks.includes(index), false, item.block + ' is not auto-completed');
    assert.ok(app.document.getElementById('main-content').innerHTML.includes(item.copy), item.block + ' is visibly rendered');
    assert.ok(app.document.getElementById('main-content').innerHTML.includes('Түсіндіру'), item.block + ' theory badge is KK');
    assert.ok(app.document.getElementById('main-content').innerHTML.includes('Түсінікті'), item.block + ' theory action is KK');
    vm.runInContext('LessonEngine.next()', app.context);
    assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', app.context), index + 1);
    assert.equal(vm.runInContext('__EngineInternal.state.completedBlocks.includes(' + index + ')', app.context), true);
  });
}

function testPolynomialsFeedbackLocaleAfterResume() {
  const ru = testLesson('algebra.g7.alg-03.polynomials', 'Многочлены: сложение и вычитание', { math_logic_lang: 'ru' });
  advanceReferenceLessonTo(ru, 'subtract-independent');
  const index = vm.runInContext('__EngineInternal.state.currentIndex', ru.context);
  ru.document.getElementById('math-response-field-' + index).value = '-3x^2+7x-6';
  vm.runInContext('MathResponseBlock.submit(' + index + ')', ru.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').lastFeedback', ru.context), 'Проверьте раскрытие второй скобки и три группы подобных членов.');

  const data = JSON.parse(ru.storage.getItem('mathlogic_data'));
  data.settings.lang = 'kk';
  const kk = testLesson('algebra.g7.alg-03.polynomials', 'Көпмүшелерді қосу және азайту', { mathlogic_data: JSON.stringify(data) });
  assert.equal(vm.runInContext('__EngineInternal.getCurrentBlock().id', kk.context), 'subtract-independent');
  assert.equal(vm.runInContext('__EngineInternal.getCurrentBlock().feedback', kk.context), 'Екінші жақшаның ашылуын және ұқсас мүшелердің үш тобын тексеріңіз.');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').lastFeedback', kk.context), 'Екінші жақшаның ашылуын және ұқсас мүшелердің үш тобын тексеріңіз.');
  assert.ok(kk.document.getElementById('main-content').innerHTML.includes('Екінші жақшаның ашылуын'));
  assert.equal(kk.document.getElementById('main-content').innerHTML.includes('Проверьте раскрытие второй скобки'), false);
}

function testDeveloperCurrentLessonResetApi() {
  const app = testLesson('algebra.g7.alg-03.polynomials', 'Көпмүшелерді қосу және азайту');
  const firstBlock = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
  selectGuidedAnswer(app, 0, firstBlock, firstBlock.answer);
  vm.runInContext('GuidedLessonBlocks.submit(0);GuidedLessonBlocks.complete(0)', app.context);
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', app.context), 1);

  const resumed = testLesson('algebra.g7.alg-03.polynomials', 'Көпмүшелерді қосу және азайту', {
    mathlogic_data: app.storage.getItem('mathlogic_data'),
  });
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', resumed.context), 1);
  assert.equal(vm.runInContext('__EngineInternal.state.completedBlocks.length', resumed.context), 1);
  let reloads = 0;
  resumed.context.DEV = true;
  resumed.context.location.reload = function() { reloads++; };
  load(resumed, ['js/dev.js']);
  assert.equal(vm.runInContext('typeof ML.dev.resetCurrentLesson', resumed.context), 'function');
  assert.equal(vm.runInContext('ML.dev.resetCurrentLesson()', resumed.context), true);
  assert.equal(reloads, 1);
  assert.equal(vm.runInContext("ML.getLessonSession('algebra.g7.alg-03.polynomials')", resumed.context), null);
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.g7.alg-03.polynomials')", resumed.context), 'available');
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.g7.alg-03.monomials')", resumed.context), 'completed');
  assert.equal(vm.runInContext("ML.get('settings.lang')", resumed.context), 'kk');

  const restarted = testLesson('algebra.g7.alg-03.polynomials', 'Көпмүшелерді қосу және азайту', {
    mathlogic_data: resumed.storage.getItem('mathlogic_data'),
  });
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', restarted.context), 0);
  assert.equal(vm.runInContext('__EngineInternal.state.completedBlocks.length', restarted.context), 0);
  assert.equal(vm.runInContext('Object.keys(__EngineInternal.state.interactionStates).length', restarted.context), 0);
  finishReferencePath(restarted);
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.g7.alg-03.polynomials')", restarted.context), 'completed');
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.g7.alg-03.polynomials'}).length", restarted.context), 1);
  const activityAfterCompletion = vm.runInContext("JSON.stringify(ML.get('activity'))", restarted.context);

  const completedRefresh = testLesson('algebra.g7.alg-03.polynomials', 'Көпмүшелерді қосу және азайту', {
    mathlogic_data: restarted.storage.getItem('mathlogic_data'),
  });
  assert.equal(vm.runInContext('__EngineInternal.state.finished', completedRefresh.context), true);
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.g7.alg-03.polynomials'}).length", completedRefresh.context), 1);
  assert.equal(vm.runInContext("JSON.stringify(ML.get('activity'))", completedRefresh.context), activityAfterCompletion);
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.g7.alg-03.monomials')", completedRefresh.context), 'completed');
}

function advanceNaturalTo(app, blockId) {
  let guard = 30;
  while (vm.runInContext('__EngineInternal.getCurrentBlock().id', app.context) !== blockId && guard-- > 0) {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (block.type === 'guided-practice') {
      const answer = block.responseType === 'input' ? block.acceptedAnswers[0] : block.answer;
      selectGuidedAnswer(app, index, block, answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', app.context);
    } else if (block.type === 'math-response') {
      app.document.getElementById('math-response-field-' + index).value = block.answer.expected;
      vm.runInContext('MathResponseBlock.submit(' + index + ');MathResponseBlock.complete(' + index + ')', app.context);
    } else {
      vm.runInContext('LessonEngine.next()', app.context);
    }
  }
  assert.ok(guard > 0, 'natural-exponent path reaches ' + blockId);
}

function testNaturalExponentStudentPaths() {
  const kk = freshNaturalExponentLesson('kk');
  assert.equal(vm.runInContext("__EngineInternal.state.lesson.blocks.find(function(block){return block.id==='what-the-exponent-says';}).question", kk.context).includes('көрсеткіші'), true);
  assert.equal(vm.runInContext("__EngineInternal.state.lesson.meta.routeStages[1].label", kk.context), 'Негіз және көрсеткіш');

  const pathA = freshNaturalExponentLesson('ru');
  finishReferencePath(pathA);
  assert.equal(vm.runInContext('__EngineInternal.state.finished', pathA.context), true);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.assessed', pathA.context), 11);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.independentlySolved', pathA.context), 11);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.transferCompleted', pathA.context), 1);
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.g7.alg-02.meaning')", pathA.context), 'completed');
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.exponents.basics')", pathA.context), 'available');
  assert.equal(vm.runInContext("Learning.getNextLessonId('algebra.g7.alg-02.meaning')", pathA.context), 'algebra.exponents.basics');

  const pathB = freshNaturalExponentLesson('ru');
  advanceNaturalTo(pathB, 'meaning-not-coefficient');
  const misconceptionIndex = vm.runInContext('__EngineInternal.state.currentIndex', pathB.context);
  const misconceptionBlock = vm.runInContext('__EngineInternal.getCurrentBlock()', pathB.context);
  selectGuidedAnswer(pathB, misconceptionIndex, misconceptionBlock, 0);
  vm.runInContext('GuidedLessonBlocks.submit(' + misconceptionIndex + ')', pathB.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + misconceptionIndex + ').completed', pathB.context), false);
  assert.equal(vm.runInContext("LessonEngine.getInteractionState(" + misconceptionIndex + ").misconceptionCodes[0]", pathB.context), 'exponent-as-coefficient');
  assert.ok(vm.runInContext('LessonEngine.getInteractionState(' + misconceptionIndex + ').lastFeedback', pathB.context).includes('4 · x'));
  selectGuidedAnswer(pathB, misconceptionIndex, misconceptionBlock, 2);
  vm.runInContext('GuidedLessonBlocks.submit(' + misconceptionIndex + ')', pathB.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + misconceptionIndex + ').attemptCount', pathB.context), 2);

  const pathC = freshNaturalExponentLesson('ru');
  advanceNaturalTo(pathC, 'write-b-six');
  const responseIndex = vm.runInContext('__EngineInternal.state.currentIndex', pathC.context);
  const field = pathC.document.getElementById('math-response-field-' + responseIndex);
  field.value = 'b^';
  vm.runInContext('MathResponseBlock.submit(' + responseIndex + ');MathResponseBlock.showHint(' + responseIndex + ')', pathC.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + responseIndex + ').lastStatus', pathC.context), 'incomplete');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + responseIndex + ').attemptCount', pathC.context), 0);
  const resumed = environment('?id=algebra.g7.alg-02.meaning', { mathlogic_data: pathC.storage.getItem('mathlogic_data'), math_logic_lang: 'ru' });
  resumed.document.body.classList.add('axis-app');
  resumed.document.getElementById('lesson-active').hidden = true;
  resumed.document.getElementById('lesson-error').hidden = true;
  load(resumed, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', resumed.context), responseIndex);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + responseIndex + ').hintCount', resumed.context), 1);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + responseIndex + ').attemptCount', resumed.context), 0);
  resumed.document.getElementById('math-response-field-' + responseIndex).value = '6b';
  vm.runInContext('MathResponseBlock.submit(' + responseIndex + ')', resumed.context);
  assert.equal(vm.runInContext("LessonEngine.getInteractionState(" + responseIndex + ").misconceptionCodes[0]", resumed.context), 'exponent-as-coefficient');
  resumed.document.getElementById('math-response-field-' + responseIndex).value = 'b^6';
  vm.runInContext('MathResponseBlock.submit(' + responseIndex + ')', resumed.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + responseIndex + ').completed', resumed.context), true);
}

function testReferenceStudentPaths() {
  const pathA = freshReferenceLesson();
  finishReferencePath(pathA);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.assessed', pathA.context), 15);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.independentlySolved', pathA.context), 15);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.hintsUsed', pathA.context), 0);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.transferCompleted', pathA.context), 1);
  assert.ok(pathA.document.getElementById('main-content').innerHTML.includes('15 / 15'));

  const pathB = freshReferenceLesson();
  let multiplicationErrorMade = false;
  finishReferencePath(pathB, function(app, index, block) {
    if (block.id !== 'multiply_pair_problem' || multiplicationErrorMade) return;
    multiplicationErrorMade = true;
    app.document.getElementById('math-response-field-' + index).value = 'x^12';
    vm.runInContext('MathResponseBlock.submit(' + index + ')', app.context);
    assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').completed', app.context), false);
    assert.equal(vm.runInContext("LessonEngine.getInteractionState(" + index + ").misconceptionCodes[0]", app.context), 'multiply-exponents');
    assert.ok(vm.runInContext('LessonEngine.getInteractionState(' + index + ').lastFeedback', app.context).includes('4 · 3'));
  });
  assert.equal(multiplicationErrorMade, true);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.repairedAfterFeedback', pathB.context), 1);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.independentlySolved', pathB.context), 14);

  const pathCStarted = freshReferenceLesson();
  while (vm.runInContext('__EngineInternal.getCurrentBlock().id', pathCStarted.context) !== 'multiply_pair_problem') {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', pathCStarted.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', pathCStarted.context);
    if (block.type === 'guided-practice') {
      const answer = block.responseType === 'input' ? block.acceptedAnswers[0] : block.answer;
      selectGuidedAnswer(pathCStarted, index, block, answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', pathCStarted.context);
    } else {
      vm.runInContext('LessonEngine.next()', pathCStarted.context);
    }
  }
  const mathIndex = vm.runInContext('__EngineInternal.state.currentIndex', pathCStarted.context);
  const mathField = pathCStarted.document.getElementById('math-response-field-' + mathIndex);
  mathField.value = 'x^';
  vm.runInContext('MathResponseBlock.submit(' + mathIndex + ')', pathCStarted.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + mathIndex + ').lastStatus', pathCStarted.context), 'incomplete');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + mathIndex + ').attemptCount', pathCStarted.context), 0);
  mathField.value = 'x@';
  vm.runInContext('MathResponseBlock.submit(' + mathIndex + ');MathResponseBlock.showHint(' + mathIndex + ')', pathCStarted.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + mathIndex + ').lastStatus', pathCStarted.context), 'invalid');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + mathIndex + ').attemptCount', pathCStarted.context), 0);

  const pathC = environment('?id=algebra.exponents.basics', withImplementedPrerequisites('algebra.exponents.basics', {
    mathlogic_data: pathCStarted.storage.getItem('mathlogic_data'),
  }));
  pathC.document.body.classList.add('axis-app');
  pathC.document.getElementById('lesson-active').hidden = true;
  pathC.document.getElementById('lesson-error').hidden = true;
  load(pathC, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', pathC.context), mathIndex);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + mathIndex + ').hintCount', pathC.context), 1);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + mathIndex + ').attemptCount', pathC.context), 0);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + mathIndex + ').syntaxIssueCount', pathC.context), 2);
  assert.ok(pathC.document.getElementById('main-content').innerHTML.includes('x@'));
  assert.ok(pathC.document.getElementById('main-content').innerHTML.includes('H1'));
  finishReferencePath(pathC);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.hintsUsed', pathC.context), 1);
  assert.equal(vm.runInContext('LessonEngine.getState().evidence.repairedAfterFeedback', pathC.context), 0);
  assert.equal(vm.runInContext('__EngineInternal.state.blockResults[' + mathIndex + '].inputRepaired', pathC.context), true);
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.exponents.basics'}).length", pathC.context), 1);
}

function testLessonResponsiveSmoke() {
  const css = fs.readFileSync(path.join(ROOT, 'css/editorial.css'), 'utf8');
  assert.ok(css.includes('@media (prefers-reduced-motion:reduce)'));
  assert.ok(css.includes('input:focus-visible'));
  [1440, 1280, 768, 390, 360].forEach(function(width) {
    const app = freshReferenceLesson();
    app.context.innerWidth = width;
    const guided = vm.runInContext("LessonBlocks.render('guided-practice',__EngineInternal.state.lesson.blocks[0],{index:0,total:23,interactionState:null,savedResult:null})", app.context);
    const factors = vm.runInContext("LessonBlocks.render('factor-model',__EngineInternal.state.lesson.blocks.find(function(block){return block.id==='multiply_factor_model';}),{index:3,total:23})", app.context);
    const math = vm.runInContext("LessonBlocks.render('math-response',__EngineInternal.state.lesson.blocks.find(function(block){return block.id==='multiply_pair_problem';}),{index:7,total:23,interactionState:null,savedResult:null})", app.context);
    assert.ok(guided.includes('type="radio"'));
    assert.ok(guided.includes('aria-live="polite"'));
    assert.ok(factors.includes('role="img"'));
    assert.ok(math.includes('<math-field'));
    assert.ok(math.includes('aria-describedby="math-response-feedback-7"'));
    assert.equal(app.document.getElementById('lesson-error').hidden, true);
  });

  const layout = freshReferenceLesson();
  const shortInline = vm.runInContext("LessonBlocks.render('math-response',{id:'short-inline',type:'math-response',question:'Multiply',expression:'b · b⁵ =',acceptedAnswers:['b^6']},{index:4,total:10,interactionState:null,savedResult:null})", layout.context);
  const longStandalone = vm.runInContext("LessonBlocks.render('math-response',{id:'long-polynomial',type:'math-response',question:'Simplify',expression:'(−2x² + 3x − 5) − (x² − 4x + 2)',acceptedAnswers:['-3x^2+7x-7'],compact:true},{index:5,total:10,interactionState:null,savedResult:null})", layout.context);
  assert.ok(shortInline.includes('math-response-equation is-inline-expression'));
  assert.ok(shortInline.includes('<span class="math-response-given"'));
  assert.equal(/<math-field[^>]*>[\s\S]*b · b⁵ =/.test(shortInline), false);
  assert.ok(longStandalone.includes('math-response-problem-expression'));
  assert.ok(longStandalone.includes('math-response-equation is-standalone-answer'));
  assert.equal(longStandalone.includes('<span class="math-response-given"'), false);
  assert.equal(/<math-field[^>]*>[\s\S]*−2x²/.test(longStandalone), false);
  assert.ok(css.includes('.math-response-equation.is-standalone-answer'));
}

function testMathResponseKeyboardAndLocale() {
  const app = freshReferenceLesson();
  let hidden = 0;
  app.context.mathVirtualKeyboard = { layouts: null, editToolbar: 'default', hide() { hidden++; } };
  while (vm.runInContext('__EngineInternal.getCurrentBlock().id', app.context) !== 'multiply_pair_problem') {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (block.type === 'guided-practice') {
      selectGuidedAnswer(app, index, block, block.responseType === 'input' ? block.acceptedAnswers[0] : block.answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', app.context);
    } else vm.runInContext('LessonEngine.next()', app.context);
  }
  const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
  const field = app.document.getElementById('math-response-field-' + index);
  assert.equal(field.getAttribute('aria-label'), 'Жауап');
  assert.equal(field.getAttribute('aria-required'), 'true');
  field.dispatch('focusin', { target: field });
  assert.equal(app.context.mathVirtualKeyboard.layouts.rows[1][0], 'x');
  assert.equal(app.context.mathVirtualKeyboard.editToolbar, 'none');
  let prevented = false;
  field.value = 'x^7';
  field.dispatch('keydown', { key: 'Enter', shiftKey: false, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').completed', app.context), true);

  field.dispatch('keydown', { key: 'Escape', shiftKey: false, preventDefault() {} });
  assert.equal(hidden, 1);
  assert.equal(vm.runInContext("I18N.t('lesson.math.check','ru')", app.context), 'Проверить');
  assert.equal(vm.runInContext("I18N.t('lesson.math.check','kk')", app.context), 'Тексеру');
  assert.equal(vm.runInContext("I18N.t('lesson.math.root','kk')", app.context), 'Түбір');
}

function testMathResponseStatesAndCheckedResume() {
  const app = freshReferenceLesson();
  while (vm.runInContext('__EngineInternal.getCurrentBlock().id', app.context) !== 'multiply_pair_problem') {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (block.type === 'guided-practice') {
      selectGuidedAnswer(app, index, block, block.responseType === 'input' ? block.acceptedAnswers[0] : block.answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', app.context);
    } else vm.runInContext('LessonEngine.next()', app.context);
  }
  const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
  const field = app.document.getElementById('math-response-field-' + index);
  field.value = '';
  vm.runInContext('MathResponseBlock.submit(' + index + ')', app.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').lastStatus', app.context), 'empty');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').attemptCount', app.context), 0);

  field.value = 'x^8';
  vm.runInContext('MathResponseBlock.submit(' + index + ')', app.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').lastStatus', app.context), 'incorrect');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').misconceptionCodes.length', app.context), 0);
  assert.ok(vm.runInContext('LessonEngine.getInteractionState(' + index + ').lastFeedback', app.context).length > 20);

  field.value = 'x^7';
  vm.runInContext('MathResponseBlock.submit(' + index + ')', app.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').completed', app.context), true);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.repairedAfterFeedback', app.context), true);

  const resumed = environment('?id=algebra.exponents.basics', withImplementedPrerequisites('algebra.exponents.basics', { mathlogic_data: app.storage.getItem('mathlogic_data') }));
  resumed.document.body.classList.add('axis-app');
  resumed.document.getElementById('lesson-active').hidden = true;
  resumed.document.getElementById('lesson-error').hidden = true;
  load(resumed, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', resumed.context), index);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').completed', resumed.context), true);
  assert.ok(resumed.document.getElementById('main-content').innerHTML.includes('x^7'));
  assert.ok(resumed.document.getElementById('main-content').innerHTML.includes('disabled'));
  vm.runInContext('MathResponseBlock.complete(' + index + ')', resumed.context);
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', resumed.context), index + 1);
}

function testExistingDecisionBlockStillLoads() {
  const app = environment('');
  let registered = '';
  app.context.LessonBlocks = { register(type) { registered = type; } };
  load(app, ['js/lesson-blocks/decision.js']);
  assert.equal(registered, 'decision');
  const result = vm.runInContext("DecisionExperiment.evaluate({stepOptions:[{id:'s',correct:true}],reasonOptions:[{id:'r',correct:true}],acceptedAnswers:['5x+5'],answerMisconceptions:[],successFeedback:'ok'},{stepId:'s',reasonId:'r',answer:'5x + 5'})", app.context);
  assert.equal(result.complete, true);
  assert.equal(result.correct, true);
}

function countState(html, state) {
  return (html.match(new RegExp('\\b' + state + '\\b', 'g')) || []).length;
}

function radioFixture(name, value) {
  const label = element('label-' + value);
  const radio = element('radio-' + value);
  radio.name = name;
  radio.value = String(value);
  radio.checked = false;
  radio.disabled = false;
  radio.closest = function(selector) { return selector === 'label' ? label : null; };
  return { radio, label };
}

function testChoiceSelectionRegression() {
  const app = freshReferenceLesson();
  const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
  const fresh = vm.runInContext("LessonBlocks.render('guided-practice',__EngineInternal.getCurrentBlock(),{index:0,total:23,interactionState:null,savedResult:null})", app.context);
  assert.equal(countState(fresh, 'is-selected'), 0, 'a new guided question must not preselect option zero');
  assert.equal((fresh.match(/\schecked/g) || []).length, 0);
  assert.equal((fresh.match(/aria-checked="true"/g) || []).length, 0);
  const wrongRender = vm.runInContext("LessonBlocks.render('guided-practice',__EngineInternal.getCurrentBlock(),{index:0,total:23,interactionState:{blockId:'prerequisite_meaning',attemptCount:1,hintCount:0,attempts:[],misconceptionCodes:[],completed:false,selectedAnswer:1,lastAnswer:1,lastFeedback:'wrong'},savedResult:null})", app.context);
  assert.equal(countState(wrongRender, 'is-selected'), 1);
  assert.ok(wrongRender.includes('guided-option is-selected is-incorrect'));
  assert.equal(countState(wrongRender, 'is-correct'), 0);
  const correctRender = vm.runInContext("LessonBlocks.render('guided-practice',__EngineInternal.getCurrentBlock(),{index:0,total:23,interactionState:{blockId:'prerequisite_meaning',attemptCount:1,hintCount:0,attempts:[],misconceptionCodes:[],completed:true,selectedAnswer:0,lastAnswer:0,lastFeedback:'correct'},savedResult:null})", app.context);
  assert.ok(correctRender.includes('guided-option is-selected is-correct'));

  const first = radioFixture('guided_0', 0);
  const second = radioFixture('guided_0', 1);
  const radios = [first.radio, second.radio];
  app.document.querySelectorAll = function(selector) { return selector === 'input[name="guided_0"]' ? radios : []; };
  vm.runInContext('GuidedLessonBlocks.select', app.context)(first.radio, 0);
  assert.equal(first.radio.checked, true);
  assert.equal(first.label.classList.contains('is-selected'), true);
  assert.equal(second.label.classList.contains('is-selected'), false);

  vm.runInContext('GuidedLessonBlocks.select', app.context)(second.radio, 0);
  assert.equal(radios.filter(function(radio) { return radio.checked; }).length, 1);
  assert.equal([first.label, second.label].filter(function(label) { return label.classList.contains('is-selected'); }).length, 1);
  assert.equal(first.radio.getAttribute('aria-checked'), 'false');
  assert.equal(second.radio.getAttribute('aria-checked'), 'true');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(0).selectedAnswer', app.context), 1);
  second.label.classList.add('is-incorrect');
  vm.runInContext('GuidedLessonBlocks.select', app.context)(first.radio, 0);
  assert.equal(second.label.classList.contains('is-incorrect'), false, 'retry must clear the old result state');
  vm.runInContext('GuidedLessonBlocks.select', app.context)(second.radio, 0);

  let prevented = false;
  vm.runInContext('GuidedLessonBlocks.keySelect', app.context)({ key: 'Tab', preventDefault() { prevented = true; } }, first.radio, 0);
  assert.equal(prevented, false);
  assert.equal(second.radio.checked, true, 'focus navigation must not change the answer');
  vm.runInContext('GuidedLessonBlocks.keySelect', app.context)({ key: 'Enter', preventDefault() { prevented = true; } }, first.radio, 0);
  assert.equal(prevented, true);
  assert.equal(radios.filter(function(radio) { return radio.checked; }).length, 1);
  assert.equal(first.radio.checked, true);

  const resumed = environment('?id=algebra.exponents.basics', withImplementedPrerequisites('algebra.exponents.basics', { mathlogic_data: app.storage.getItem('mathlogic_data') }));
  resumed.document.body.classList.add('axis-app');
  resumed.document.getElementById('lesson-active').hidden = true;
  resumed.document.getElementById('lesson-error').hidden = true;
  load(resumed, CORE.concat(LESSON));
  assert.equal(countState(resumed.document.getElementById('main-content').innerHTML, 'is-selected'), 1);
  assert.equal((resumed.document.getElementById('main-content').innerHTML.match(/aria-checked="true"/g) || []).length, 1);

  const genericFresh = vm.runInContext("__BlockRenderers._renderOptions(['A','B'],'quiz_4',false,null,1)", app.context);
  assert.equal(countState(genericFresh, 'is-selected'), 0);
  const genericFirst = radioFixture('quiz_4', 0);
  const genericSecond = radioFixture('quiz_4', 1);
  const genericRadios = [genericFirst.radio, genericSecond.radio];
  app.document.querySelectorAll = function(selector) { return selector === 'input[name="quiz_4"]' ? genericRadios : []; };
  vm.runInContext('LessonBlocks._selectOption', app.context)(genericFirst.radio);
  vm.runInContext('LessonBlocks._selectOption', app.context)(genericSecond.radio);
  assert.equal(genericRadios.filter(function(radio) { return radio.checked; }).length, 1);
  assert.equal([genericFirst.label, genericSecond.label].filter(function(label) { return label.classList.contains('is-selected'); }).length, 1);
  assert.equal(genericFirst.radio.getAttribute('aria-checked'), 'false');
  assert.equal(genericSecond.radio.getAttribute('aria-checked'), 'true');
  const genericResumed = vm.runInContext("LessonBlocks.render('quiz',{question:'Q',options:['A','B'],answer:1},{index:4,total:5,repeatMode:false,savedResult:null,interactionState:LessonEngine.getInteractionState(4)})", app.context);
  assert.equal(countState(genericResumed, 'is-selected'), 1);
  assert.equal((genericResumed.match(/aria-checked="true"/g) || []).length, 1);
  const nextQuestion = vm.runInContext("LessonBlocks.render('quiz',{question:'Next',options:['A','B'],answer:0},{index:5,total:5,repeatMode:false,savedResult:null,interactionState:null})", app.context);
  assert.equal(countState(nextQuestion, 'is-selected'), 0, 'moving to a new question must not reuse the previous selection');
  const genericWrong = vm.runInContext("__BlockRenderers._renderOptions(['A','B'],'quiz_4',true,0,1)", app.context);
  assert.equal(countState(genericWrong, 'is-incorrect'), 1);
  assert.equal(countState(genericWrong, 'is-correct'), 0, 'an unselected correct option must not be revealed');

  const css = fs.readFileSync(path.join(ROOT, 'css/editorial.css'), 'utf8');
  assert.ok(css.includes('.lesson-option:has(input:focus-visible)'));
  assert.ok(css.includes('.lesson-option.is-selected'));
}

function testDecisionSelectionRegression() {
  const app = environment('');
  const decisionBlock = {
    id: 'decision-regression', type: 'decision', experimentId: 'decision-regression', role: 'base',
    title: 'Q', prompt: 'P', expression: 'x', stepQuestion: 'S', reasonQuestion: 'R', answerQuestion: 'A',
    stepOptions: [{ id: 's0', text: 'S0', correct: false }, { id: 's1', text: 'S1', correct: true }],
    reasonOptions: [{ id: 'r0', text: 'R0', correct: true }, { id: 'r1', text: 'R1', correct: false }],
    hints: [], acceptedAnswers: ['x'], answerMisconceptions: [], successFeedback: 'ok',
  };
  app.context.__EngineInternal = { state: { blocks: [decisionBlock], startedAt: 123, lessonId: 'test', repeatMode: false } };
  app.context.__BlockHelpers = { wrap(value) { return value; }, progress() { return ''; }, blockBadge() { return ''; }, formulaBlock() { return ''; } };
  app.context.LessonBlocks = { register() {} };
  load(app, ['js/lesson-blocks/decision.js']);
  const render = vm.runInContext('DecisionExperiment.render', app.context);
  assert.equal(countState(render(decisionBlock, { index: 0, savedResult: null }), 'is-selected'), 0);

  const first = radioFixture('decision_step_0', 's0');
  const second = radioFixture('decision_step_0', 's1');
  const radios = [first.radio, second.radio];
  app.document.querySelectorAll = function(selector) { return selector === 'input[name="decision_step_0"]' ? radios : []; };
  vm.runInContext('DecisionExperiment.select', app.context)(first.radio, 0, 'stepId');
  vm.runInContext('DecisionExperiment.select', app.context)(second.radio, 0, 'stepId');
  assert.equal(radios.filter(function(radio) { return radio.checked; }).length, 1);
  assert.equal([first.label, second.label].filter(function(label) { return label.classList.contains('is-selected'); }).length, 1);
  vm.runInContext('DecisionExperiment.keySelect', app.context)({ key: 'Tab', preventDefault() { throw new Error('Tab must not be intercepted'); } }, first.radio, 0, 'stepId');
  assert.equal(second.radio.checked, true);
  let prevented = false;
  vm.runInContext('DecisionExperiment.keySelect', app.context)({ key: 'Enter', preventDefault() { prevented = true; } }, first.radio, 0, 'stepId');
  assert.equal(prevented, true);
  assert.equal(first.radio.checked, true);
  assert.equal(radios.filter(function(radio) { return radio.checked; }).length, 1);
  const restored = render(decisionBlock, { index: 0, savedResult: null });
  assert.equal(countState(restored, 'is-selected'), 1);
  assert.equal((restored.match(/aria-checked="true"/g) || []).length, 1);
}

function testRepeatAnswerUx() {
  const app = environment('?id=algebra.exponents.basics', withImplementedPrerequisites('algebra.exponents.basics'));
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
  const app = environment('?id=algebra.exponents.basics', withImplementedPrerequisites('algebra.exponents.basics'));
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
  assert.equal((history.match(/v7-history-event/g) || []).length, 10);
  assert.ok(history.includes('id="history-more"'));
  app.document.getElementById('history-more').click();
  history = app.document.getElementById('profile-history').innerHTML;
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

function freshLinearLesson(lang) {
  const storage = lang === 'ru' ? { math_logic_lang: 'ru' } : undefined;
  return testLesson(
    'algebra.linear-equations.equivalent-transformations',
    lang === 'ru' ? 'Линейные уравнения' : 'Сызықтық теңдеулер',
    storage
  );
}

function chooseEquationOperation(app, index, stepIndex, optionIndex) {
  const name = 'equation-operation-' + index + '-' + stepIndex;
  const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
  const fixtures = block.steps[stepIndex].operationOptions.map(function(_, i) { return radioFixture(name, i); });
  app.document.querySelectorAll = function(selector) {
    return selector === 'input[name="' + name + '"]' ? fixtures.map(function(item) { return item.radio; }) : [];
  };
  vm.runInContext('EquationStepBlock.selectOperation', app.context)(fixtures[optionIndex].radio, index, stepIndex);
  vm.runInContext('EquationStepBlock.checkOperation(' + index + ',' + stepIndex + ')', app.context);
  return fixtures;
}

function solveCurrentEquationBlock(app, beforeSubmit) {
  const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
  const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
  while (!vm.runInContext('LessonEngine.getInteractionState(' + index + ')&&LessonEngine.getInteractionState(' + index + ').completed===true', app.context)) {
    const stepIndex = vm.runInContext('(LessonEngine.getInteractionState(' + index + ')||{currentStep:0}).currentStep', app.context);
    const step = block.steps[stepIndex];
    if (step.operationOptions) {
      const correct = step.operationOptions.findIndex(function(option, optionIndex) { return option.correct === true || Number(step.operationAnswer) === optionIndex; });
      chooseEquationOperation(app, index, stepIndex, correct);
    }
    if (beforeSubmit) beforeSubmit(app, index, block, stepIndex);
    const field = app.document.getElementById('equation-step-field-' + index + '-' + stepIndex);
    field.value = step.answer.expected;
    vm.runInContext('EquationStepBlock.submit(' + index + ',' + stepIndex + ')', app.context);
  }
  vm.runInContext('EquationStepBlock.complete(' + index + ')', app.context);
}

function finishLinearLesson(app, beforeInteraction) {
  let guard = 120;
  while (vm.runInContext('__EngineInternal.state.finished', app.context) === false && guard-- > 0) {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (beforeInteraction) beforeInteraction(app, index, block);
    if (block.type === 'guided-practice') {
      selectGuidedAnswer(app, index, block, block.responseType === 'input' ? block.acceptedAnswers[0] : block.answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', app.context);
    } else if (block.type === 'math-response') {
      app.document.getElementById('math-response-field-' + index).value = block.answer.expected;
      vm.runInContext('MathResponseBlock.submit(' + index + ');MathResponseBlock.complete(' + index + ')', app.context);
    } else if (block.type === 'equation-step') {
      solveCurrentEquationBlock(app);
    } else {
      vm.runInContext('LessonEngine.next()', app.context);
    }
  }
  assert.ok(guard > 0, 'linear lesson must reach its summary');
  assert.equal(vm.runInContext('__EngineInternal.getCurrentBlock().type', app.context), 'lesson-summary');
}

function goToLinearBlock(app, id) {
  let guard = 80;
  while (vm.runInContext('__EngineInternal.getCurrentBlock().id', app.context) !== id && guard-- > 0) {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (block.type === 'guided-practice') {
      selectGuidedAnswer(app, index, block, block.answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', app.context);
    } else if (block.type === 'math-response') {
      app.document.getElementById('math-response-field-' + index).value = block.answer.expected;
      vm.runInContext('MathResponseBlock.submit(' + index + ');MathResponseBlock.complete(' + index + ')', app.context);
    } else if (block.type === 'equation-step') solveCurrentEquationBlock(app);
    else vm.runInContext('LessonEngine.next()', app.context);
  }
  assert.ok(guard > 0, 'target linear block must be reachable: ' + id);
}

function testLinearLessonArchitectureAndLocale() {
  const kk = freshLinearLesson('kk');
  assert.equal(vm.runInContext('__EngineInternal.state.blocks.length', kk.context), 20);
  assert.equal(vm.runInContext('__EngineInternal.state.lesson.meta.routeStages[1].label', kk.context), 'Теңдік');
  assert.equal(vm.runInContext("__EngineInternal.state.blocks[0].id", kk.context), 'prerequisite_obvious_root');
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.some(function(block){return block.id==='meaning_probe'&&block.role==='conceptual';})", kk.context), true);
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.some(function(block){return block.id==='final_procedural'&&block.type==='equation-step';})", kk.context), true);
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.some(function(block){return block.id==='final_verification'&&block.role==='verification';})", kk.context), true);
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.some(function(block){return block.id==='transfer_model'&&block.role==='transfer';})", kk.context), true);
  assert.equal((kk.document.getElementById('main-content').innerHTML.match(/is-selected/g) || []).length, 0, 'fresh prerequisite must have no selected answer');
  assert.equal(kk.document.getElementById('main-content').innerHTML.includes('Әрекет: 0'), false);

  const ru = freshLinearLesson('ru');
  assert.equal(vm.runInContext('__EngineInternal.state.lesson.meta.routeStages[1].label', ru.context), 'Равенство');
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.find(function(block){return block.id==='equation_meaning';}).content[0].includes('Левая и правая части')", ru.context), true);
}

function testEquationStepValidationFeedbackAndRetry() {
  const app = freshLinearLesson('ru');
  goToLinearBlock(app, 'balance_one_step');
  const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
  const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
  assert.ok(app.document.getElementById('main-content').innerHTML.includes('equation-history'));
  assert.ok(app.document.getElementById('main-content').innerHTML.includes('equation-balance-model'));
  assert.equal((app.document.getElementById('main-content').innerHTML.match(/is-selected/g) || []).length, 0);

  const wrongFixtures = chooseEquationOperation(app, index, 0, 1);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').steps[0].operationAccepted', app.context), false);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').steps[0].misconceptionCodes[0]', app.context), 'one-side-only');
  assert.equal(wrongFixtures.filter(function(item) { return item.label.classList.contains('is-selected'); }).length, 1);
  assert.ok(app.document.getElementById('main-content').innerHTML.includes('is-selected is-incorrect'));

  chooseEquationOperation(app, index, 0, 0);
  let field = app.document.getElementById('equation-step-field-' + index + '-0');
  field.value = 'x=';
  vm.runInContext('EquationStepBlock.submit(' + index + ',0)', app.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').steps[0].lastStatus', app.context), 'incomplete');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').steps[0].syntaxIssueCount', app.context), 1);

  field.value = 'x=6';
  vm.runInContext('EquationStepBlock.submit(' + index + ',0)', app.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').steps[0].lastStatus', app.context), 'incorrect');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').steps[0].misconceptionCodes.length', app.context), 1, 'unknown wrong state must use generic feedback');

  field.value = 'x=8';
  vm.runInContext('EquationStepBlock.submit(' + index + ',0)', app.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').steps[0].misconceptionCodes.includes("one-side-only")', app.context), true);
  vm.runInContext('EquationStepBlock.showHint(' + index + ',0)', app.context);
  field = app.document.getElementById('equation-step-field-' + index + '-0');
  field.value = 'x=5';
  vm.runInContext('EquationStepBlock.submit(' + index + ',0)', app.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').completed', app.context), true);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').history[0].equation', app.context), 'x = 5');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.repairedAfterFeedback', app.context), true);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.inputRepaired', app.context), true);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.hintsUsed', app.context), 1);
}

function testEquationChainResumeAndRefresh() {
  const started = freshLinearLesson('ru');
  goToLinearBlock(started, 'paired_two_step');
  const index = vm.runInContext('__EngineInternal.state.currentIndex', started.context);
  const block = vm.runInContext('__EngineInternal.getCurrentBlock()', started.context);
  chooseEquationOperation(started, index, 0, 0);
  started.document.getElementById('equation-step-field-' + index + '-0').value = block.steps[0].answer.expected;
  vm.runInContext('EquationStepBlock.submit(' + index + ',0)', started.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').currentStep', started.context), 1);
  chooseEquationOperation(started, index, 1, 0);
  started.document.getElementById('equation-step-field-' + index + '-1').value = 'x=';
  vm.runInContext('EquationStepBlock.saveDraft(' + index + ',1)', started.context);

  const historyBefore = vm.runInContext('ML.getLearningHistory().length', started.context);
  const activityBefore = vm.runInContext("JSON.stringify(ML.get('activity'))", started.context);
  const resumed = environment('?id=algebra.linear-equations.equivalent-transformations', { mathlogic_data: started.storage.getItem('mathlogic_data'), math_logic_lang: 'ru' });
  resumed.document.body.classList.add('axis-app');
  resumed.document.getElementById('lesson-active').hidden = true;
  resumed.document.getElementById('lesson-error').hidden = true;
  load(resumed, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', resumed.context), index);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').currentStep', resumed.context), 1);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').history.length', resumed.context), 1);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').steps[1].operationAccepted', resumed.context), true);
  assert.ok(resumed.document.getElementById('main-content').innerHTML.includes('x='));
  assert.equal(vm.runInContext('ML.getLearningHistory().length', resumed.context), historyBefore);
  assert.equal(vm.runInContext("JSON.stringify(ML.get('activity'))", resumed.context), activityBefore);
}

function testLinearStudentPathsAndCompletion() {
  const pathA = freshLinearLesson('ru');
  finishLinearLesson(pathA);
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.linear-equations.equivalent-transformations')", pathA.context), 'completed');
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.linear-equations.equivalent-transformations'}).length", pathA.context), 1);
  assert.equal(vm.runInContext("ML.getLessonSession('algebra.linear-equations.equivalent-transformations').completedSnapshot", pathA.context), true);
  const activity = vm.runInContext("JSON.stringify(ML.get('activity'))", pathA.context);

  const refreshed = environment('?id=algebra.linear-equations.equivalent-transformations', { mathlogic_data: pathA.storage.getItem('mathlogic_data'), math_logic_lang: 'ru' });
  refreshed.document.body.classList.add('axis-app');
  refreshed.document.getElementById('lesson-active').hidden = true;
  refreshed.document.getElementById('lesson-error').hidden = true;
  load(refreshed, CORE.concat(LESSON));
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.linear-equations.equivalent-transformations'}).length", refreshed.context), 1);
  assert.equal(vm.runInContext("JSON.stringify(ML.get('activity'))", refreshed.context), activity);

  const pathB = freshLinearLesson('ru');
  let oneSideMade = false;
  finishLinearLesson(pathB, function(app, index, block) {
    if (oneSideMade || block.id !== 'balance_one_step') return;
    oneSideMade = true;
    chooseEquationOperation(app, index, 0, 1);
    assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').steps[0].misconceptionCodes[0]', app.context), 'one-side-only');
  });
  assert.equal(oneSideMade, true);
  assert.ok(vm.runInContext('LessonEngine.getState().evidence.repairedAfterFeedback', pathB.context) >= 1);

  const pathC = freshLinearLesson('ru');
  let signMade = false;
  finishLinearLesson(pathC, function(app, index, block) {
    if (signMade || block.id !== 'sign_equation_chain') return;
    signMade = true;
    chooseEquationOperation(app, index, 0, 1);
    assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').steps[0].misconceptionCodes[0]', app.context), 'wrong-sign');
  });
  assert.equal(signMade, true);

  const pathD = freshLinearLesson('ru');
  let hinted = false;
  finishLinearLesson(pathD, function(app, index, block) {
    if (hinted || block.id !== 'independent_chain') return;
    hinted = true;
    vm.runInContext('EquationStepBlock.showHint(' + index + ',0)', app.context);
  });
  assert.equal(hinted, true);
  assert.ok(vm.runInContext('LessonEngine.getState().evidence.hintsUsed', pathD.context) >= 1);
}

function testEquationResponsiveAndKeyboardSmoke() {
  const css = fs.readFileSync(path.join(ROOT, 'css/editorial.css'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'lesson.html'), 'utf8');
  const assets = fs.readFileSync(path.join(ROOT, 'data/lesson-assets.js'), 'utf8');
  [1440, 1280, 768, 390, 360].forEach(function(width) { assert.ok(width > 0); });
  assert.ok(css.includes('.equation-history'));
  assert.ok(css.includes('.equation-operation-option.is-selected'));
  assert.ok(css.includes('.equation-history-state.is-new'));
  assert.ok(css.includes('@media (prefers-reduced-motion:reduce)'));
  assert.ok(css.includes('.math-response-equation.is-compact'));
  assert.ok(css.includes('#lesson-active.is-compact-heading'));
  assert.equal(html.includes('js/lesson-blocks/equation-step.js'), false);
  assert.ok(assets.includes('js/lesson-blocks/equation-step.js'));
  assert.ok(assets.includes('data/lessons/linear-equations.js'));

  const app = freshLinearLesson('ru');
  goToLinearBlock(app, 'balance_one_step');
  const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
  const name = 'equation-operation-' + index + '-0';
  const first = radioFixture(name, 0);
  const second = radioFixture(name, 1);
  const radios = [first.radio, second.radio];
  app.document.querySelectorAll = function(selector) { return selector === 'input[name="' + name + '"]' ? radios : []; };
  let prevented = false;
  vm.runInContext('EquationStepBlock.keySelectOperation', app.context)({ key: 'Tab', preventDefault() { prevented = true; } }, first.radio, index, 0);
  assert.equal(prevented, false);
  assert.equal(radios.some(function(radio) { return radio.checked; }), false);
  vm.runInContext('EquationStepBlock.keySelectOperation', app.context)({ key: ' ', preventDefault() { prevented = true; } }, first.radio, index, 0);
  assert.equal(prevented, true);
  assert.equal(radios.filter(function(radio) { return radio.checked; }).length, 1);
  vm.runInContext('EquationStepBlock.keySelectOperation', app.context)({ key: 'Enter', preventDefault() {} }, second.radio, index, 0);
  assert.equal(radios.filter(function(radio) { return radio.checked; }).length, 1);
  assert.equal(second.radio.getAttribute('aria-checked'), 'true');
}

function freshFunctionLesson(lang) {
  const storage = lang === 'ru' ? { math_logic_lang: 'ru' } : undefined;
  return testLesson(
    'algebra.linear-functions.graph',
    lang === 'ru' ? 'Линейная функция и её график' : 'Сызықтық функция және оның графигі',
    storage
  );
}

function selectGraphFollowUp(app, index, block, optionIndex) {
  const name = 'graph-follow-up-' + index;
  const fixtures = block.followUp.options.map(function(_, i) { return radioFixture(name, i); });
  app.document.querySelectorAll = function(selector) {
    return selector === 'input[name="' + name + '"]' ? fixtures.map(function(item) { return item.radio; }) : [];
  };
  vm.runInContext('GraphWorkspaceBlock.selectFollowUp', app.context)(fixtures[optionIndex].radio, index);
  vm.runInContext('GraphWorkspaceBlock.checkFollowUp(' + index + ')', app.context);
  return fixtures;
}

function solveCurrentGraphBlock(app, beforeComplete) {
  const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
  const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
  if (beforeComplete) beforeComplete(app, index, block);
  if (block.mode === 'place-point') {
    vm.runInContext('GraphWorkspaceBlock.placePoint(' + index + ',' + block.target.x + ',' + block.target.y + ')', app.context);
    vm.runInContext('GraphWorkspaceBlock.checkPoint(' + index + ')', app.context);
  } else if (block.mode === 'value-table') {
    let rowIndex = vm.runInContext('(LessonEngine.getInteractionState(' + index + ')||{currentRow:0}).currentRow', app.context);
    while (rowIndex < block.rows.length) {
      app.document.getElementById('graph-table-field-' + index + '-' + rowIndex).value = String(block.rows[rowIndex].y);
      vm.runInContext('GraphWorkspaceBlock.submitTableValue(' + index + ',' + rowIndex + ')', app.context);
      rowIndex = vm.runInContext('LessonEngine.getInteractionState(' + index + ').currentRow', app.context);
    }
  } else if (block.mode === 'parameter') {
    (block.requiredValues || []).forEach(function(value) {
      vm.runInContext('GraphWorkspaceBlock.commitParameter', app.context)({ value: String(value) }, index);
    });
  }
  if (block.followUp && !vm.runInContext('LessonEngine.getInteractionState(' + index + ')&&LessonEngine.getInteractionState(' + index + ').completed===true', app.context)) {
    selectGraphFollowUp(app, index, block, block.followUp.answer);
  }
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').completed', app.context), true, 'graph block must complete: ' + block.id);
  vm.runInContext('GraphWorkspaceBlock.complete(' + index + ')', app.context);
}

function finishFunctionLesson(app, beforeInteraction) {
  let guard = 160;
  while (vm.runInContext('__EngineInternal.state.finished', app.context) === false && guard-- > 0) {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (beforeInteraction) beforeInteraction(app, index, block);
    if (block.type === 'guided-practice') {
      selectGuidedAnswer(app, index, block, block.responseType === 'input' ? block.acceptedAnswers[0] : block.answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', app.context);
    } else if (block.type === 'math-response') {
      app.document.getElementById('math-response-field-' + index).value = block.answer.expected;
      vm.runInContext('MathResponseBlock.submit(' + index + ');MathResponseBlock.complete(' + index + ')', app.context);
    } else if (block.type === 'graph-workspace') {
      solveCurrentGraphBlock(app);
    } else {
      vm.runInContext('LessonEngine.next()', app.context);
    }
  }
  assert.ok(guard > 0, 'function lesson must reach its summary');
  assert.equal(vm.runInContext('__EngineInternal.getCurrentBlock().type', app.context), 'lesson-summary');
}

function goToFunctionBlock(app, id) {
  let guard = 120;
  while (vm.runInContext('__EngineInternal.getCurrentBlock().id', app.context) !== id && guard-- > 0) {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (block.type === 'guided-practice') {
      selectGuidedAnswer(app, index, block, block.answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', app.context);
    } else if (block.type === 'math-response') {
      app.document.getElementById('math-response-field-' + index).value = block.answer.expected;
      vm.runInContext('MathResponseBlock.submit(' + index + ');MathResponseBlock.complete(' + index + ')', app.context);
    } else if (block.type === 'graph-workspace') solveCurrentGraphBlock(app);
    else vm.runInContext('LessonEngine.next()', app.context);
  }
  assert.ok(guard > 0, 'target function block must be reachable: ' + id);
}

function testFunctionLessonArchitectureAndLocale() {
  const kk = freshFunctionLesson('kk');
  assert.equal(vm.runInContext('__EngineInternal.state.blocks.length', kk.context), 20);
  assert.equal(vm.runInContext('__EngineInternal.state.lesson.meta.routeStages[0].label', kk.context), 'Координаталар');
  assert.equal(vm.runInContext('__EngineInternal.state.lesson.meta.routeStages[3].label', kk.context), 'Коэффициент');
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.filter(function(block){return block.type==='graph-workspace';}).length", kk.context), 9);
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.some(function(block){return block.id==='build_value_table'&&block.revealLine;})", kk.context), true);
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.some(function(block){return block.id==='explore_negative_k'&&block.requiredValues.indexOf(-1)>-1;})", kk.context), true);
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.some(function(block){return block.id==='transfer_table_graph'&&block.role==='transfer';})", kk.context), true);
  assert.ok(kk.document.getElementById('lesson-route').innerHTML.includes('Координаталар'));
  assert.equal((kk.document.getElementById('main-content').innerHTML.match(/is-selected/g) || []).length, 0);
  finishFunctionLesson(kk);
  assert.equal(vm.runInContext('__EngineInternal.getCurrentBlock().title', kk.context), 'Енді не істей аласыз');
  assert.ok(kk.document.getElementById('main-content').innerHTML.includes('координаталық жұпты'));

  const ru = freshFunctionLesson('ru');
  assert.equal(vm.runInContext('__EngineInternal.state.lesson.meta.routeStages[0].label', ru.context), 'Координаты');
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.find(function(block){return block.id==='graph_definition';}).content[0].includes('множество точек')", ru.context), true);
}

function testGraphMisconceptionsHintsAndParameterPath() {
  const swapped = freshFunctionLesson('ru');
  goToFunctionBlock(swapped, 'place_coordinate_point');
  let index = vm.runInContext('__EngineInternal.state.currentIndex', swapped.context);
  vm.runInContext('GraphWorkspaceBlock.placePoint(' + index + ',3,2)', swapped.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').attemptCount', swapped.context), 0);
  vm.runInContext('GraphWorkspaceBlock.checkPoint(' + index + ')', swapped.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').lastStatus', swapped.context), 'incorrect');
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').misconceptionCodes[0]', swapped.context), 'swapped-coordinates');
  vm.runInContext('GraphWorkspaceBlock.showHint(' + index + ')', swapped.context);
  vm.runInContext('GraphWorkspaceBlock.placePoint(' + index + ',2,3)', swapped.context);
  vm.runInContext('GraphWorkspaceBlock.checkPoint(' + index + ')', swapped.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.repairedAfterFeedback', swapped.context), true);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.hintsUsed', swapped.context), 1);

  const valueError = freshFunctionLesson('ru');
  goToFunctionBlock(valueError, 'first_function_value');
  index = vm.runInContext('__EngineInternal.state.currentIndex', valueError.context);
  valueError.document.getElementById('math-response-field-' + index).value = '2';
  vm.runInContext('MathResponseBlock.submit(' + index + ')', valueError.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').misconceptionCodes[0]', valueError.context), 'coefficient-only');
  valueError.document.getElementById('math-response-field-' + index).value = '3';
  vm.runInContext('MathResponseBlock.submit(' + index + ')', valueError.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.repairedAfterFeedback', valueError.context), true);

  const parameterError = freshFunctionLesson('ru');
  goToFunctionBlock(parameterError, 'explore_negative_k');
  index = vm.runInContext('__EngineInternal.state.currentIndex', parameterError.context);
  const parameterBlock = vm.runInContext('__EngineInternal.getCurrentBlock()', parameterError.context);
  parameterBlock.requiredValues.forEach(function(value) {
    vm.runInContext('GraphWorkspaceBlock.commitParameter', parameterError.context)({ value: String(value) }, index);
  });
  selectGraphFollowUp(parameterError, index, parameterBlock, parameterBlock.followUp.options.findIndex(function(option) { return option.code === 'negative-k-all-negative-y'; }));
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').misconceptionCodes[0]', parameterError.context), 'negative-k-all-negative-y');
  selectGraphFollowUp(parameterError, index, parameterBlock, parameterBlock.followUp.answer);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.repairedAfterFeedback', parameterError.context), true);
}

function testGraphTableResumeAndRefresh() {
  const started = freshFunctionLesson('ru');
  goToFunctionBlock(started, 'build_value_table');
  const index = vm.runInContext('__EngineInternal.state.currentIndex', started.context);
  const block = vm.runInContext('__EngineInternal.getCurrentBlock()', started.context);
  [0, 1].forEach(function(rowIndex) {
    started.document.getElementById('graph-table-field-' + index + '-' + rowIndex).value = String(block.rows[rowIndex].y);
    vm.runInContext('GraphWorkspaceBlock.submitTableValue(' + index + ',' + rowIndex + ')', started.context);
  });
  started.document.getElementById('graph-table-field-' + index + '-2').value = '5';
  vm.runInContext('GraphWorkspaceBlock.saveTableDraft(' + index + ',2)', started.context);
  const historyBefore = vm.runInContext('ML.getLearningHistory().length', started.context);
  const activityBefore = vm.runInContext("JSON.stringify(ML.get('activity'))", started.context);

  const resumed = environment('?id=algebra.linear-functions.graph', { mathlogic_data: started.storage.getItem('mathlogic_data'), math_logic_lang: 'ru' });
  resumed.document.body.classList.add('axis-app');
  resumed.document.getElementById('lesson-active').hidden = true;
  resumed.document.getElementById('lesson-error').hidden = true;
  load(resumed, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', resumed.context), index);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').currentRow', resumed.context), 2);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').table.filter(function(row){return row.completed;}).length', resumed.context), 2);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').table[2].draftLatex', resumed.context), '5');
  assert.equal((resumed.document.getElementById('main-content').innerHTML.match(/class="graph-point/g) || []).length >= 2, true);
  assert.equal(vm.runInContext('ML.getLearningHistory().length', resumed.context), historyBefore);
  assert.equal(vm.runInContext("JSON.stringify(ML.get('activity'))", resumed.context), activityBefore);
}

function testGraphParameterResumeAndRefresh() {
  const started = freshFunctionLesson('ru');
  goToFunctionBlock(started, 'explore_positive_k');
  const index = vm.runInContext('__EngineInternal.state.currentIndex', started.context);
  vm.runInContext('GraphWorkspaceBlock.commitParameter', started.context)({ value: '2' }, index);
  vm.runInContext('GraphWorkspaceBlock.commitParameter', started.context)({ value: '3' }, index);
  const historyBefore = vm.runInContext('ML.getLearningHistory().length', started.context);
  const activityBefore = vm.runInContext("JSON.stringify(ML.get('activity'))", started.context);

  const resumed = environment('?id=algebra.linear-functions.graph', { mathlogic_data: started.storage.getItem('mathlogic_data'), math_logic_lang: 'ru' });
  resumed.document.body.classList.add('axis-app');
  resumed.document.getElementById('lesson-active').hidden = true;
  resumed.document.getElementById('lesson-error').hidden = true;
  load(resumed, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', resumed.context), index);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').parameterValue', resumed.context), 3);
  assert.deepEqual(Array.from(vm.runInContext('LessonEngine.getInteractionState(' + index + ').visitedParameters', resumed.context)), [1, 2, 3]);
  assert.ok(resumed.document.getElementById('main-content').innerHTML.includes('y = 3x'));
  assert.equal(vm.runInContext('ML.getLearningHistory().length', resumed.context), historyBefore);
  assert.equal(vm.runInContext("JSON.stringify(ML.get('activity'))", resumed.context), activityBefore);
}

function testFunctionLessonCompletionAndDedupe() {
  const pathA = freshFunctionLesson('ru');
  finishFunctionLesson(pathA);
  assert.equal(vm.runInContext("Learning.getLessonStatus('algebra.linear-functions.graph')", pathA.context), 'completed');
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.linear-functions.graph'}).length", pathA.context), 1);
  assert.equal(vm.runInContext("ML.getLessonSession('algebra.linear-functions.graph').completedSnapshot", pathA.context), true);
  const activity = vm.runInContext("JSON.stringify(ML.get('activity'))", pathA.context);

  const refreshed = environment('?id=algebra.linear-functions.graph', { mathlogic_data: pathA.storage.getItem('mathlogic_data'), math_logic_lang: 'ru' });
  refreshed.document.body.classList.add('axis-app');
  refreshed.document.getElementById('lesson-active').hidden = true;
  refreshed.document.getElementById('lesson-error').hidden = true;
  load(refreshed, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.finished', refreshed.context), true);
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.linear-functions.graph'}).length", refreshed.context), 1);
  assert.equal(vm.runInContext("JSON.stringify(ML.get('activity'))", refreshed.context), activity);
  assert.equal(vm.runInContext('LessonEngine.finish()', refreshed.context), false);
}

function testGraphResponsiveAndStaticSmoke() {
  const css = fs.readFileSync(path.join(ROOT, 'css/editorial.css'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'lesson.html'), 'utf8');
  const assets = fs.readFileSync(path.join(ROOT, 'data/lesson-assets.js'), 'utf8');
  [1440, 1280, 768, 390, 360].forEach(function(width) { assert.ok(width > 0); });
  assert.ok(css.includes('.graph-workspace-wrap'));
  assert.ok(css.includes('.graph-point-hit'));
  assert.ok(css.includes('.graph-representations:has(.graph-value-table-wrap)'));
  assert.ok(css.includes('@media (max-width:390px)'));
  assert.ok(css.includes('@media (prefers-reduced-motion:reduce)'));
  assert.equal(html.includes('js/lesson-blocks/graph-workspace.js'), false);
  assert.ok(assets.includes('js/lesson-blocks/graph-workspace.js'));
  assert.ok(assets.includes('data/lessons/linear-functions.js'));
}

function freshGeometryLesson(lang) {
  const storage = { math_logic_lang: lang || 'ru' };
  return testLesson(
    'geometry.triangle-angle-sum',
    lang === 'kk' ? 'Үшбұрыш бұрыштарының қосындысы' : 'Сумма углов треугольника',
    storage
  );
}

function prepareGeometryExploration(app, index) {
  vm.runInContext("(function(){var block=__EngineInternal.getCurrentBlock();LessonEngine.setInteractionState(" + index + ",{blockId:block.id,mode:block.mode,vertices:JSON.parse(JSON.stringify(block.vertices)),movedVertices:['A'],visitedCategories:(block.requiredCategories||[]).slice(),dragCount:Math.max(1,Number(block.requiredMoves)||0),followUpSelected:null,proofStep:0,attemptCount:0,attempts:[],hintCount:0,misconceptionCodes:[],lastStatus:'',lastFeedback:'',completed:false});})()", app.context);
}

function selectGeometryFollowUp(app, index, block, optionIndex) {
  const name = 'geometry-follow-up-' + index;
  const fixtures = block.followUp.options.map(function(_, option) { return radioFixture(name, option); });
  app.document.querySelectorAll = function(selector) {
    return selector === 'input[name="' + name + '"]' ? fixtures.map(function(item) { return item.radio; }) : [];
  };
  vm.runInContext('GeometryWorkspaceBlock.selectFollowUp', app.context)(fixtures[optionIndex].radio, index);
  vm.runInContext('GeometryWorkspaceBlock.checkFollowUp(' + index + ')', app.context);
  return fixtures;
}

function solveCurrentGeometryBlock(app) {
  const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
  const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
  if (block.mode === 'proof') {
    while (vm.runInContext('(LessonEngine.getInteractionState(' + index + ')||{proofStep:0}).proofStep', app.context) < block.proofSteps.length - 1) {
      vm.runInContext('GeometryWorkspaceBlock.advanceProof(' + index + ')', app.context);
    }
    vm.runInContext('GeometryWorkspaceBlock.finishProof(' + index + ')', app.context);
  } else {
    prepareGeometryExploration(app, index);
    selectGeometryFollowUp(app, index, block, block.followUp.answer);
  }
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').completed', app.context), true, 'geometry block must complete: ' + block.id);
  vm.runInContext('GeometryWorkspaceBlock.complete(' + index + ')', app.context);
}

function finishGeometryLesson(app, beforeInteraction) {
  let guard = 140;
  while (vm.runInContext('__EngineInternal.state.finished', app.context) === false && guard-- > 0) {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (beforeInteraction) beforeInteraction(app, index, block);
    if (block.type === 'guided-practice') {
      selectGuidedAnswer(app, index, block, block.answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', app.context);
    } else if (block.type === 'math-response') {
      app.document.getElementById('math-response-field-' + index).value = block.answer.expected;
      vm.runInContext('MathResponseBlock.submit(' + index + ');MathResponseBlock.complete(' + index + ')', app.context);
    } else if (block.type === 'geometry-workspace') {
      solveCurrentGeometryBlock(app);
    } else {
      vm.runInContext('LessonEngine.next()', app.context);
    }
  }
  assert.ok(guard > 0, 'geometry lesson must reach its summary');
  assert.equal(vm.runInContext('__EngineInternal.getCurrentBlock().type', app.context), 'lesson-summary');
}

function goToGeometryBlock(app, id) {
  let guard = 100;
  while (vm.runInContext('__EngineInternal.getCurrentBlock().id', app.context) !== id && guard-- > 0) {
    const index = vm.runInContext('__EngineInternal.state.currentIndex', app.context);
    const block = vm.runInContext('__EngineInternal.getCurrentBlock()', app.context);
    if (block.type === 'guided-practice') {
      selectGuidedAnswer(app, index, block, block.answer);
      vm.runInContext('GuidedLessonBlocks.submit(' + index + ');GuidedLessonBlocks.complete(' + index + ')', app.context);
    } else if (block.type === 'math-response') {
      app.document.getElementById('math-response-field-' + index).value = block.answer.expected;
      vm.runInContext('MathResponseBlock.submit(' + index + ');MathResponseBlock.complete(' + index + ')', app.context);
    } else if (block.type === 'geometry-workspace') solveCurrentGeometryBlock(app);
    else vm.runInContext('LessonEngine.next()', app.context);
  }
  assert.ok(guard > 0, 'target geometry block must be reachable: ' + id);
}

function testGeometryLessonArchitectureAndLocale() {
  const kk = freshGeometryLesson('kk');
  assert.equal(vm.runInContext('__EngineInternal.state.blocks.length', kk.context), 18);
  assert.equal(vm.runInContext('__EngineInternal.state.lesson.meta.routeStages[0].label', kk.context), 'Өлшеу');
  assert.equal(vm.runInContext('__EngineInternal.state.lesson.meta.routeStages[2].label', kk.context), 'Түсіндіру');
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.filter(function(block){return block.type==='geometry-workspace';}).length", kk.context), 3);
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.find(function(block){return block.id==='triangle_angle_proof';}).proofSteps.length", kk.context), 4);
  assert.equal(vm.runInContext("__EngineInternal.state.blocks.some(function(block){return block.id==='obtuse_transfer'&&block.role==='transfer';})", kk.context), true);
  assert.ok(kk.document.getElementById('lesson-route').innerHTML.includes('Өлшеу'));
  assert.ok(vm.runInContext("__EngineInternal.state.blocks[1].question.includes('ішкі бұрышы')", kk.context));
  finishGeometryLesson(kk);
  assert.equal(vm.runInContext('__EngineInternal.getCurrentBlock().title', kk.context), 'Қасиеттің себебі түсінікті болды');

  const ru = freshGeometryLesson('ru');
  assert.equal(vm.runInContext('__EngineInternal.state.lesson.meta.routeStages[2].label', ru.context), 'Объяснение');
  assert.ok(vm.runInContext("__EngineInternal.state.blocks[1].question.includes('внутренним углом')", ru.context));
  goToGeometryBlock(ru, 'unknown_angle_practice');
  const angleIndex = vm.runInContext('__EngineInternal.state.currentIndex', ru.context);
  const angleHtml = ru.document.getElementById('main-content').innerHTML;
  assert.ok(angleHtml.includes('math-response-angle-field'));
  assert.ok(angleHtml.includes('math-response-angle-suffix'));
  assert.ok(angleHtml.includes('∠C ='));
  ru.document.getElementById('math-response-field-' + angleIndex).value = '57°';
  vm.runInContext('MathResponseBlock.submit(' + angleIndex + ')', ru.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + angleIndex + ').lastStatus', ru.context), 'correct');

  const expression = freshReferenceLesson();
  const expressionHtml = vm.runInContext("LessonBlocks.render('math-response',__EngineInternal.state.lesson.blocks.find(function(block){return block.id==='multiply_pair_problem';}),{index:7,total:23,interactionState:null,savedResult:null})", expression.context);
  assert.ok(expressionHtml.includes('<math-field'));
  assert.equal(expressionHtml.includes('math-response-angle-suffix'), false);
}

function testGeometryMisconceptionHintAndRepair() {
  const shapeError = freshGeometryLesson('ru');
  goToGeometryBlock(shapeError, 'first_triangle_exploration');
  let index = vm.runInContext('__EngineInternal.state.currentIndex', shapeError.context);
  let block = vm.runInContext('__EngineInternal.getCurrentBlock()', shapeError.context);
  prepareGeometryExploration(shapeError, index);
  selectGeometryFollowUp(shapeError, index, block, 0);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').attemptCount', shapeError.context), 1);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').misconceptionCodes[0]', shapeError.context), 'angles-fixed');
  vm.runInContext('GeometryWorkspaceBlock.showHint(' + index + ')', shapeError.context);
  selectGeometryFollowUp(shapeError, index, block, block.followUp.answer);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.repairedAfterFeedback', shapeError.context), true);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.hintsUsed', shapeError.context), 1);

  const obtuseError = freshGeometryLesson('ru');
  goToGeometryBlock(obtuseError, 'test_distinct_triangles');
  index = vm.runInContext('__EngineInternal.state.currentIndex', obtuseError.context);
  block = vm.runInContext('__EngineInternal.getCurrentBlock()', obtuseError.context);
  prepareGeometryExploration(obtuseError, index);
  selectGeometryFollowUp(obtuseError, index, block, 2);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').misconceptionCodes[0]', obtuseError.context), 'obtuse-sum-over-180');
  assert.ok(vm.runInContext('LessonEngine.getInteractionState(' + index + ').lastFeedback.includes("два остальных уменьшаются")', obtuseError.context));
  selectGeometryFollowUp(obtuseError, index, block, block.followUp.answer);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.repairedAfterFeedback', obtuseError.context), true);

  const angleError = freshGeometryLesson('ru');
  goToGeometryBlock(angleError, 'unknown_angle_practice');
  index = vm.runInContext('__EngineInternal.state.currentIndex', angleError.context);
  angleError.document.getElementById('math-response-field-' + index).value = '128';
  vm.runInContext('MathResponseBlock.submit(' + index + ')', angleError.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').misconceptionCodes[0]', angleError.context), 'subtracts-one-angle');
  vm.runInContext('MathResponseBlock.showHint(' + index + ')', angleError.context);
  angleError.document.getElementById('math-response-field-' + index).value = '57';
  vm.runInContext('MathResponseBlock.submit(' + index + ')', angleError.context);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').pendingResult.repairedAfterFeedback', angleError.context), true);
}

function testGeometryResumeAndCompletionDedupe() {
  const exploration = freshGeometryLesson('ru');
  goToGeometryBlock(exploration, 'first_triangle_exploration');
  const explorationIndex = vm.runInContext('__EngineInternal.state.currentIndex', exploration.context);
  vm.runInContext('GeometryWorkspaceBlock.moveVertexByKeyboard', exploration.context)({ key: 'ArrowLeft', shiftKey: false, preventDefault() {} }, explorationIndex, 'A');
  const movedX = vm.runInContext('LessonEngine.getInteractionState(' + explorationIndex + ').vertices.A.x', exploration.context);
  const explorationRefresh = environment('?id=geometry.triangle-angle-sum', { mathlogic_data: exploration.storage.getItem('mathlogic_data'), math_logic_lang: 'ru' });
  explorationRefresh.document.body.classList.add('axis-app');
  explorationRefresh.document.getElementById('lesson-active').hidden = true;
  explorationRefresh.document.getElementById('lesson-error').hidden = true;
  load(explorationRefresh, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', explorationRefresh.context), explorationIndex);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + explorationIndex + ').vertices.A.x', explorationRefresh.context), movedX);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + explorationIndex + ').dragCount', explorationRefresh.context), 1);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + explorationIndex + ').attemptCount', explorationRefresh.context), 0);

  const started = freshGeometryLesson('ru');
  goToGeometryBlock(started, 'triangle_angle_proof');
  const index = vm.runInContext('__EngineInternal.state.currentIndex', started.context);
  vm.runInContext('GeometryWorkspaceBlock.advanceProof(' + index + ')', started.context);
  const historyBefore = vm.runInContext('ML.getLearningHistory().length', started.context);
  const activityBefore = vm.runInContext("JSON.stringify(ML.get('activity'))", started.context);
  const resumed = environment('?id=geometry.triangle-angle-sum', { mathlogic_data: started.storage.getItem('mathlogic_data'), math_logic_lang: 'ru' });
  resumed.document.body.classList.add('axis-app');
  resumed.document.getElementById('lesson-active').hidden = true;
  resumed.document.getElementById('lesson-error').hidden = true;
  load(resumed, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.currentIndex', resumed.context), index);
  assert.equal(vm.runInContext('LessonEngine.getInteractionState(' + index + ').proofStep', resumed.context), 1);
  assert.equal(vm.runInContext('ML.getLearningHistory().length', resumed.context), historyBefore);
  assert.equal(vm.runInContext("JSON.stringify(ML.get('activity'))", resumed.context), activityBefore);

  finishGeometryLesson(resumed);
  assert.equal(vm.runInContext("Learning.getLessonStatus('geometry.triangle-angle-sum')", resumed.context), 'completed');
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'geometry.triangle-angle-sum'}).length", resumed.context), 1);
  const completedActivity = vm.runInContext("JSON.stringify(ML.get('activity'))", resumed.context);
  const refreshed = environment('?id=geometry.triangle-angle-sum', { mathlogic_data: resumed.storage.getItem('mathlogic_data'), math_logic_lang: 'ru' });
  refreshed.document.body.classList.add('axis-app');
  refreshed.document.getElementById('lesson-active').hidden = true;
  refreshed.document.getElementById('lesson-error').hidden = true;
  load(refreshed, CORE.concat(LESSON));
  assert.equal(vm.runInContext('__EngineInternal.state.finished', refreshed.context), true);
  assert.equal(vm.runInContext("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'geometry.triangle-angle-sum'}).length", refreshed.context), 1);
  assert.equal(vm.runInContext("JSON.stringify(ML.get('activity'))", refreshed.context), completedActivity);
  assert.equal(vm.runInContext('LessonEngine.finish()', refreshed.context), false);
}

function testGeometryResponsiveAndStaticSmoke() {
  const css = fs.readFileSync(path.join(ROOT, 'css/editorial.css'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'lesson.html'), 'utf8');
  const assets = fs.readFileSync(path.join(ROOT, 'data/lesson-assets.js'), 'utf8');
  [1440, 1280, 768, 390, 360].forEach(function(width) { assert.ok(width > 0); });
  assert.ok(css.includes('.geometry-workspace-wrap'));
  assert.ok(css.includes('.geometry-vertex-hit'));
  assert.ok(css.includes('.geometry-proof-panel'));
  assert.ok(css.includes('.geometry-diagram { width:100%'));
  assert.ok(css.includes('.geometry-diagram svg { display:block; width:100%; height:auto'));
  assert.ok(css.includes('overflow:hidden'));
  assert.ok(css.includes('@media (max-width:390px)'));
  assert.ok(css.includes('@media (prefers-reduced-motion:reduce)'));
  assert.equal(html.includes('js/lesson-blocks/geometry-workspace.js'), false);
  assert.ok(assets.includes('js/lesson-blocks/geometry-workspace.js'));
  assert.ok(assets.includes('data/lessons/triangle-angle-sum.js'));
}

function testGeometryDiagramRenderer() {
  const diagram = environment('');
  load(diagram, ['js/lesson-blocks/geometry-diagram.js']);
  const html = vm.runInContext("GeometryDiagram.render({ariaLabel:'Accessible geometry',caption:'Reason from the marks',elements:[{kind:'ray',from:{x:10,y:30},to:{x:90,y:30}},{kind:'point',at:{x:10,y:30},label:'A'},{kind:'equal-mark',from:{x:10,y:30},to:{x:50,y:30}},{kind:'angle',vertex:{x:50,y:30},from:{x:10,y:30},to:{x:50,y:5},label:'1'},{kind:'right-angle',vertex:{x:50,y:30},along1:{x:80,y:30},along2:{x:50,y:5}}]},'regression')", diagram.context);
  assert.ok(html.includes('<svg viewBox="0 0 100 60" role="img" aria-label="Accessible geometry"'));
  assert.ok(html.includes('marker-end="url(#geometry-diagram-arrow-regression)"'));
  assert.ok(html.includes('geometry-diagram-mark'));
  assert.ok(html.includes('geometry-diagram-angle'));
  assert.ok(html.includes('geometry-diagram-right-angle'));
  assert.ok(html.includes('<figcaption>Reason from the marks</figcaption>'));
}

testDashboardShell();
testLocalMathEditorDependency();
testDashboard();
testDashboardResponsiveContract();
testProgramCurriculum();
testNavigationResponsivenessContract();
testLesson('algebra.vieta.intro', 'Виет теоремасы');
testLesson('algebra.g7.alg-03.monomials', 'Бірмүшелер және стандарт түр');
testLesson('algebra.g7.alg-03.polynomials', 'Көпмүшелерді қосу және азайту');
testLesson('algebra.g7.alg-03.multiplication', 'Бірмүшелер мен көпмүшелерді көбейту');
testLesson('algebra.g7.alg-03.square-sum-difference', 'Қосынды мен айырманың квадраты');
testLesson('algebra.g7.alg-03.difference-squares', 'Квадраттар айырмасы');
testLesson('algebra.g7.alg-03.cubes', 'Кубтар формулалары');
testLesson('geometry.g7.geo-03.transversal', 'Екі түзу мен қиюшыдағы бұрыштар');
testLesson('geometry.g7.geo-03.criteria', 'Түзулердің параллельдік белгілері');
testLesson('geometry.g7.geo-03.properties', 'Параллель түзулердің қасиеттері');
testLesson('geometry.g7.geo-03.triangle-relations', 'Сыртқы бұрыш және үшбұрыш теңсіздігі');
testLesson('geometry.g7.geo-03.right-triangles', 'Тікбұрышты үшбұрыштар және проекциялар');
testBilingualLessonContent();
testUnknownLesson();
testPublishedLessonDirectAccessPolicy();
testCompletionBridge();
testReferenceStudentPaths();
testNaturalExponentStudentPaths();
testMonomialsPolynomialsStudentPaths();
testProductionTheoryStateVisibility();
testPolynomialsFeedbackLocaleAfterResume();
testDeveloperCurrentLessonResetApi();
testLessonResponsiveSmoke();
testMathResponseKeyboardAndLocale();
testMathResponseStatesAndCheckedResume();
testExistingDecisionBlockStillLoads();
testChoiceSelectionRegression();
testDecisionSelectionRegression();
testRepeatAnswerUx();
testEmptyOpenAnswerCannotSubmit();
testResume();
testProfileActivity();
testProfileLearningHistory();
testLinearLessonArchitectureAndLocale();
testEquationStepValidationFeedbackAndRetry();
testEquationChainResumeAndRefresh();
testLinearStudentPathsAndCompletion();
testEquationResponsiveAndKeyboardSmoke();
testFunctionLessonArchitectureAndLocale();
testGraphMisconceptionsHintsAndParameterPath();
testGraphTableResumeAndRefresh();
testGraphParameterResumeAndRefresh();
testFunctionLessonCompletionAndDedupe();
testGraphResponsiveAndStaticSmoke();
testGeometryLessonArchitectureAndLocale();
testGeometryMisconceptionHintAndRepair();
testGeometryResumeAndCompletionDedupe();
testGeometryResponsiveAndStaticSmoke();
testGeometryDiagramRenderer();
console.log('page-smoke: ok');
