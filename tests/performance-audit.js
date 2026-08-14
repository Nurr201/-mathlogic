/* Static loading-budget and lazy lesson asset regression audit. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function bytes(files) {
  return Array.from(new Set(files)).reduce(function(total, file) {
    return total + fs.statSync(path.join(ROOT, file)).size;
  }, 0);
}

const html = read('lesson.html');
const staticScripts = Array.from(html.matchAll(/<script\s+src="([^"]+)"/g), function(match) { return match[1]; });
const context = { window: {} };
context.window = context;
vm.createContext(context);
vm.runInContext(read('data/lesson-assets.js'), context, { filename: 'data/lesson-assets.js' });
const manifest = context.MATHLOGIC_LESSON_ASSETS;

const registryContext = { window: {} };
registryContext.window = registryContext;
vm.createContext(registryContext);
vm.runInContext(read('data/curriculum.js'), registryContext, { filename: 'data/curriculum.js' });
vm.runInContext(read('js/data.js'), registryContext, { filename: 'js/data.js' });
const registryIds = vm.runInContext('Object.keys(LESSON_REGISTRY)', registryContext);

assert.equal(staticScripts.length, 10, 'lesson shell should stay small with the shared navigation runtime');
assert.ok(staticScripts.includes('js/site.js'));
assert.ok(staticScripts.includes('data/lesson-assets.js'));
assert.ok(staticScripts.includes('js/lesson-loader.js'));
assert.equal(staticScripts.some(function(src) { return /data\/lessons\//.test(src); }), false);
assert.equal(staticScripts.some(function(src) { return /lesson-blocks\/(equation-step|graph-workspace|geometry-workspace|math-response|guided)/.test(src); }), false);
assert.equal(staticScripts.some(function(src) { return /mathlive/i.test(src); }), false);
assert.equal(staticScripts.includes('js/dev.js'), false);
assert.equal(/cdn\.tailwindcss\.com/.test(html), false);
assert.equal(staticScripts.some(function(src) { return src.includes('?'); }), false, 'stable script URLs must remain cacheable');
['index.html', 'dashboard.html', 'program.html', 'lesson.html', 'profile.html', 'settings.html'].forEach(function(page) {
  const source = read(page);
  assert.ok(/rel="preload" as="style" href="https:\/\/fonts\.googleapis\.com/.test(source), page + ' should not block first render on the font stylesheet');
  assert.ok(source.includes('display=swap'), page + ' needs a usable fallback while fonts load');
});
assert.equal(/\bblocks\s*:/.test(read('data/curriculum.js')), false, 'curriculum must remain metadata-only');

assert.deepEqual(Object.keys(manifest.lessons).sort(), Array.from(registryIds).sort(), 'every implemented route needs a load plan');
Object.keys(manifest.lessons).forEach(function(id) {
  const entry = manifest.lessons[id];
  assert.equal(registryContext.LESSON_REGISTRY, undefined); // top-level const is intentionally not a global property
  assert.equal(vm.runInContext('LESSON_REGISTRY[' + JSON.stringify(id) + '].route', registryContext), 'lesson.html?id=' + id);
  (entry.primitiveScripts || []).forEach(function(file) { assert.ok(fs.existsSync(path.join(ROOT, file)), file); });
  if (entry.configScript) assert.ok(fs.existsSync(path.join(ROOT, entry.configScript)), entry.configScript);
});

const geometry = manifest.lessons['geometry.triangle-angle-sum'];
const graph = manifest.lessons['algebra.linear-functions.graph'];
const simple = manifest.lessons['algebra.vieta.intro'];
const naturalExponent = manifest.lessons['algebra.g7.alg-02.meaning'];
const powerRules = manifest.lessons['algebra.g7.alg-02.power-rules'];
const zeroNegative = manifest.lessons['algebra.g7.alg-02.zero-negative'];
const standardForm = manifest.lessons['algebra.g7.alg-02.standard-form'];
const monomials = manifest.lessons['algebra.g7.alg-03.monomials'];
const polynomials = manifest.lessons['algebra.g7.alg-03.polynomials'];
const polynomialMultiplication = manifest.lessons['algebra.g7.alg-03.multiplication'];
const squareSumDifference = manifest.lessons['algebra.g7.alg-03.square-sum-difference'];
const differenceSquares = manifest.lessons['algebra.g7.alg-03.difference-squares'];
const cubeIdentities = manifest.lessons['algebra.g7.alg-03.cubes'];
assert.equal(geometry.mathLive, false, 'numeric-angle geometry must not load MathLive');
assert.ok(geometry.primitiveScripts.includes('js/lesson-blocks/geometry-workspace.js'));
assert.equal(geometry.primitiveScripts.includes('js/lesson-blocks/graph-workspace.js'), false);
assert.equal(graph.mathLive, true);
assert.ok(graph.primitiveScripts.includes('js/lesson-blocks/graph-workspace.js'));
assert.equal(graph.primitiveScripts.includes('js/lesson-blocks/geometry-workspace.js'), false);
assert.equal(simple.mathLive, false);
assert.deepEqual(Array.from(simple.primitiveScripts), []);
assert.equal(naturalExponent.mathLive, true, 'the natural exponent lesson uses Math Input');
assert.ok(naturalExponent.primitiveScripts.includes('js/math-input.js'));
assert.ok(naturalExponent.primitiveScripts.includes('js/lesson-blocks/math-response.js'));
assert.equal(naturalExponent.primitiveScripts.includes('js/lesson-blocks/graph-workspace.js'), false);
assert.equal(naturalExponent.primitiveScripts.includes('js/lesson-blocks/geometry-workspace.js'), false);
[powerRules, zeroNegative, standardForm, monomials, polynomials, polynomialMultiplication, squareSumDifference, differenceSquares, cubeIdentities].forEach(function(entry) {
  assert.equal(entry.mathLive, true);
  assert.ok(entry.primitiveScripts.includes('js/math-input.js'));
  assert.equal(entry.primitiveScripts.includes('js/lesson-blocks/graph-workspace.js'), false);
  assert.equal(entry.primitiveScripts.includes('js/lesson-blocks/geometry-workspace.js'), false);
});

const loader = read('js/lesson-loader.js');
assert.ok(loader.includes("get('debug') === '1'"));
assert.ok(loader.includes("loadScript('js/dev.js')"));
assert.ok(loader.includes('Promise.all((scripts || []).map(loadScript))'), 'ordered scripts should download as a batch, not a waterfall');
assert.equal(/setTimeout\s*\([^)]*(location|href)/s.test(loader), false, 'navigation must not have an artificial timeout');

function storageContext(seed) {
  let writes = 0;
  const values = { mathlogic_data: JSON.stringify(seed) };
  const localStorage = {
    get length() { return Object.keys(values).length; },
    key(index) { return Object.keys(values)[index] || null; },
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { writes++; values[key] = String(value); },
    removeItem(key) { delete values[key]; },
  };
  const state = { console, localStorage, window: {}, document: { body: {}, documentElement: { dataset: {}, style: { setProperty() {} } } } };
  state.window = state;
  vm.createContext(state);
  vm.runInContext(read('js/storage.js'), state, { filename: 'js/storage.js' });
  vm.runInContext('ML.getData()', state);
  return writes;
}
assert.equal(storageContext({
  version: 2,
  user: { id: 'existing', createdAt: 1 },
  progress: { lessons: {}, subtopics: {} }, lesson: { sessions: {} }, settings: {}, stats: {},
  achievements: [], activity: { dates: [], studySecondsByDate: {}, history: [] }, timeline: [], analytics: {}, rewards: {},
}), 0, 'reading valid storage must not synchronously rewrite it');

let learningReads = 0;
const learningContext = {
  console,
  window: {},
  ML: {
    get(pathName) { learningReads++; return pathName === 'lesson.sessions' ? {} : {}; },
    getLessonSession() { throw new Error('bulk lesson view should use its session snapshot'); },
    migrateLessonIds() {}, resetCache() {},
  },
  addEventListener() {},
};
learningContext.window = learningContext;
vm.createContext(learningContext);
vm.runInContext(read('data/curriculum.js'), learningContext, { filename: 'data/curriculum.js' });
vm.runInContext(read('js/data.js'), learningContext, { filename: 'js/data.js' });
vm.runInContext(read('js/learning.js'), learningContext, { filename: 'js/learning.js' });
vm.runInContext("Learning.getLessons('algebra')", learningContext);
assert.equal(learningReads, 2, 'the whole Program lesson list should share one progress/session snapshot');

const baseRuntime = [
  'js/lesson-engine/state.js', 'js/lesson-engine/hooks.js', 'js/lesson-engine/storage.js',
  'js/lesson-engine/serializer.js', 'js/lesson-engine/core.js', 'js/lesson-engine.js',
  'js/lesson-blocks/helpers.js', 'js/lesson-blocks/registry.js', 'js/lesson-blocks/renderers.js',
  'js/lesson-blocks.js',
];
function planFiles(entry) {
  return staticScripts.concat(baseRuntime, [manifest.schemaScript], entry.primitiveScripts || [],
    entry.mathLive ? ['vendor/mathlive/mathlive.min.js'] : [],
    entry.configScript ? [entry.configScript] : [], ['js/lesson.js']);
}
const results = {};
Object.keys(manifest.lessons).forEach(function(id) {
  const files = planFiles(manifest.lessons[id]);
  results[id] = { scriptRequests: files.length, rawJsBytes: bytes(files) };
});

assert.ok(results['algebra.vieta.intro'].rawJsBytes < 400000, 'simple lesson must stay below the raw JS budget');
assert.ok(results['geometry.triangle-angle-sum'].rawJsBytes < 650000, 'native numeric geometry should not inherit MathLive payload');
assert.ok(results['algebra.linear-functions.graph'].rawJsBytes < 1500000, 'graph lesson should load only its own workspace/config');

console.log('performance-audit: ok');
console.log(JSON.stringify({ staticLessonScripts: staticScripts.length, lessonPlans: results }, null, 2));
