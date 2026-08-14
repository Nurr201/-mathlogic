/* Dependency-free unit checks for the reusable SVG graph primitive. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function classList() {
  const values = new Set();
  return {
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    toggle(value, force) { if (force) values.add(value); else values.delete(value); },
    contains(value) { return values.has(value); },
  };
}

function element(id) {
  const attrs = {};
  return {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    dataset: {},
    classList: classList(),
    setAttribute(name, value) { attrs[name] = String(value); },
    getAttribute(name) { return attrs[name] || null; },
    addEventListener() {},
    focus() { this.focused = true; },
    querySelectorAll() { return []; },
  };
}

function normalize(value) {
  return String(value || '').replace(/\s+/g, '').replace(/−/g, '-').replace(/\\cdot|\\times/g, '*');
}

function createApp(lang) {
  const nodes = {};
  const interactionStates = {};
  const context = {
    console,
    Date,
    Math,
    JSON,
    isFinite,
    document: {
      visibilityState: 'visible',
      getElementById(id) { return nodes[id] || (nodes[id] = element(id)); },
      querySelectorAll() { return []; },
      addEventListener() {},
    },
    addEventListener() {},
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
    ML: { getLang() { return lang || 'ru'; } },
    __BlockHelpers: {
      progress() { return '<div class="progress"></div>'; },
      blockBadge(value) { return '<span class="badge">' + value + '</span>'; },
      wrap(value) { return value; },
    },
    LessonBlocks: { register(type, renderer) { context.registered = { type, renderer }; } },
    LessonEngine: {
      on() {},
      getInteractionState(index) { return interactionStates[index] || null; },
      setInteractionState(index, value) { interactionStates[index] = JSON.parse(JSON.stringify(value)); },
      render() { context.renderCount += 1; },
      next(result) { context.completedResult = result; },
    },
    MathInput: {
      fieldValue(field) { return field ? field.value : ''; },
      configureMathLive() {},
      configureField() {},
      matches(value, accepted) { return accepted.some(function(item) { return normalize(item) === normalize(value); }); },
      validate(value, spec) {
        const normalized = normalize(value);
        if (!normalized) return { status: 'empty', normalized: '' };
        if (/=$/.test(normalized)) return { status: 'incomplete', normalized };
        const accepted = [spec.expected].concat(spec.accepted || []).map(normalize);
        return { status: accepted.includes(normalized) ? 'correct' : 'incorrect', normalized };
      },
    },
    renderCount: 0,
  };
  context.window = context;
  context.__EngineInternal = { state: { blocks: [] } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/lesson-blocks/graph-workspace.js'), 'utf8'), context, { filename: 'graph-workspace.js' });
  return { context, nodes, interactionStates };
}

function viewport() { return { xMin: -4, xMax: 4, yMin: -4, yMax: 4, gridStep: 1, labelStep: 1 }; }

function testCoordinateTransformAndLine() {
  const app = createApp('ru');
  const graph = app.context.GraphWorkspaceBlock;
  const transform = graph.createTransform(viewport(), 640, 420, { left: 52, right: 24, top: 24, bottom: 44 });
  const screen = transform.mathToScreen(2, -3);
  const restored = transform.screenToMath(screen.x, screen.y);
  assert.ok(Math.abs(restored.x - 2) < 1e-9);
  assert.ok(Math.abs(restored.y + 3) < 1e-9);
  [[-4, -4], [0, 0], [4, 4]].forEach(function(pair) {
    const edgeScreen = transform.mathToScreen(pair[0], pair[1]);
    const edgeRestored = transform.screenToMath(edgeScreen.x, edgeScreen.y);
    assert.ok(Math.abs(edgeRestored.x - pair[0]) < 1e-9);
    assert.ok(Math.abs(edgeRestored.y - pair[1]) < 1e-9);
  });
  assert.deepEqual(Array.from(graph.lineSegment(viewport(), -1, 0), function(point) { return [point.x, point.y]; }), [[-4, 4], [4, -4]]);
  assert.equal(graph.formulaText({ k: -1, b: 0 }), 'y = −x');
  assert.equal(graph.formulaText({ k: 2, b: -2 }), 'y = 2x − 2');
}

function testPlacementToleranceAndMisconception() {
  const app = createApp('ru');
  const graph = app.context.GraphWorkspaceBlock;
  assert.equal(graph.isPointWithinTolerance({ x: 2.2, y: 3.2 }, { x: 2, y: 3 }, 0.4), true);
  assert.equal(graph.isPointWithinTolerance({ x: 2.5, y: 3.5 }, { x: 2, y: 3 }, 0.4), false);

  const block = {
    id: 'place', type: 'graph-workspace', mode: 'place-point', title: 'Точка', viewport: viewport(),
    target: { x: 2, y: 3 }, tolerance: 0.46, points: 17,
    misconceptions: { swapped: 'Первая координата — x.' }, feedback: 'Проверьте координаты.', successFeedback: 'Верно.',
  };
  app.context.__EngineInternal.state.blocks = [block];
  const svgBefore = app.context.document.getElementById('graph-svg-0');
  graph.placePoint(0, 3, 2);
  assert.equal(app.interactionStates[0].attemptCount, 0);
  assert.equal(app.interactionStates[0].lastStatus, '');
  assert.equal(app.interactionStates[0].completed, false);
  assert.equal(app.context.renderCount, 0);
  assert.equal(app.context.document.getElementById('graph-svg-0'), svgBefore);
  graph.checkPoint(0);
  assert.equal(app.interactionStates[0].lastStatus, 'incorrect');
  assert.equal(app.interactionStates[0].attemptCount, 1);
  assert.deepEqual(app.interactionStates[0].misconceptionCodes, ['swapped-coordinates']);
  assert.equal(app.interactionStates[0].completed, false);
  graph.placePoint(0, 2, 3);
  assert.equal(app.interactionStates[0].attemptCount, 1);
  assert.equal(app.interactionStates[0].lastStatus, '');
  graph.checkPoint(0);
  assert.equal(app.interactionStates[0].lastStatus, 'correct');
  assert.equal(app.interactionStates[0].attemptCount, 2);
  assert.equal(app.interactionStates[0].completed, true);
  assert.equal(app.interactionStates[0].pendingResult.repairedAfterFeedback, true);
  assert.equal(app.interactionStates[0].pendingResult.points, 17);
  assert.equal(app.context.renderCount, 0);
}

function testKeyboardAlternativeAndLocale() {
  const app = createApp('kk');
  const block = { id: 'p', type: 'graph-workspace', mode: 'place-point', title: 'Нүкте', viewport: viewport(), target: { x: 1, y: 2 } };
  const html = app.context.GraphWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: null, savedResult: null });
  assert.ok(html.includes('Графикпен жұмыс'));
  assert.ok(html.includes('id="graph-x-0"'));
  assert.ok(html.includes('id="graph-y-0"'));
  assert.ok(html.includes('id="graph-check-point-0"'));
  assert.ok(html.includes('disabled'));
  assert.ok(html.includes('Нүктені белгілеу'));
  let prevented = false;
  app.context.GraphWorkspaceBlock.keySelectPoint({ key: 'Tab', preventDefault() { prevented = true; } }, 0, 0);
  assert.equal(prevented, false);
}

function testFunctionValueBecomesPoint() {
  const app = createApp('ru');
  const block = {
    id: 'table', type: 'graph-workspace', mode: 'value-table', title: 'Таблица', viewport: viewport(),
    function: { type: 'linear', k: 2, b: 1 }, rows: [{ x: 0, y: 1 }, { x: 1, y: 3 }], revealLine: true,
  };
  app.context.__EngineInternal.state.blocks = [block];
  app.nodes['graph-table-field-0-0'] = element('graph-table-field-0-0');
  app.nodes['graph-table-field-0-0'].value = '0';
  app.context.GraphWorkspaceBlock.saveTableDraft(0, 0);
  assert.equal(app.interactionStates[0].attemptCount, 0);
  assert.equal(app.context.renderCount, 0);
  app.context.GraphWorkspaceBlock.submitTableValue(0, 0);
  assert.equal(app.interactionStates[0].lastStatus, 'incorrect');
  assert.equal(app.interactionStates[0].attemptCount, 1);
  app.nodes['graph-table-field-0-0'].value = '1';
  app.context.GraphWorkspaceBlock.submitTableValue(0, 0);
  assert.equal(app.interactionStates[0].table[0].completed, true);
  assert.equal(app.interactionStates[0].currentRow, 1);
  assert.equal(app.context.renderCount, 0);
  const html = app.context.GraphWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: app.interactionStates[0] });
  assert.ok(html.includes('graph-point'));
  assert.ok(html.includes('Точка (0, 1)'));
}

function testMultipleLinesAndLegend() {
  const app = createApp('ru');
  const block = {
    id: 'two-lines', type: 'graph-workspace', mode: 'inspect', title: 'Две прямые', viewport: viewport(), showLine: true,
    functions: [{ type: 'linear', k: 2, b: 1, label: 'y = 2x + 1' }, { type: 'linear', k: -1, b: 4, label: 'y = −x + 4' }],
  };
  const html = app.context.GraphWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: null, savedResult: null });
  assert.ok(html.includes('graph-function-line-0-0'));
  assert.ok(html.includes('graph-function-line-0-1'));
  assert.ok(html.includes('y = 2x + 1'));
  assert.ok(html.includes('y = −x + 4'));
}

function testNonlinearCurvesAndGap() {
  const app = createApp('ru');
  const graph = app.context.GraphWorkspaceBlock;
  const quadratic = { id: 'quadratic', type: 'graph-workspace', mode: 'inspect', title: 'Квадрат', viewport: viewport(), function: { type: 'quadratic', a: 1 }, showLine: true };
  const reciprocal = { id: 'reciprocal', type: 'graph-workspace', mode: 'inspect', title: 'Дробь', viewport: viewport(), function: { type: 'reciprocal', k: 1 }, showLine: true };
  const quadraticHtml = graph.render(quadratic, { index: 0, total: 1, interactionState: null, savedResult: null });
  const reciprocalHtml = graph.render(reciprocal, { index: 1, total: 1, interactionState: null, savedResult: null });
  assert.ok(quadraticHtml.includes('<path id="graph-function-line-0-0"'));
  assert.ok(reciprocalHtml.includes('<path id="graph-function-line-1-0"'));
  assert.equal(reciprocalHtml.includes('<line id="graph-function-line-1-0"'), false, 'reciprocal graph must use a sampled curve rather than a straight line');
}

function testFractionTableAnswers() {
  const app = createApp('ru');
  const block = {
    id: 'fraction-table', type: 'graph-workspace', mode: 'value-table', title: 'Дробь', viewport: viewport(),
    function: { type: 'reciprocal', k: 1 }, rows: [{ x: 2, y: 0.5, accepted: ['1/2'] }],
  };
  app.context.__EngineInternal.state.blocks = [block];
  app.nodes['graph-table-field-0-0'] = element('graph-table-field-0-0');
  app.nodes['graph-table-field-0-0'].value = '1/2';
  app.context.GraphWorkspaceBlock.submitTableValue(0, 0);
  assert.equal(app.interactionStates[0].table[0].completed, true);
}

function testParameterStateAndSerialization() {
  const app = createApp('ru');
  const block = {
    id: 'parameter', type: 'graph-workspace', mode: 'parameter', title: 'k', viewport: viewport(),
    function: { type: 'linear', k: 1, b: 0 }, showLine: true, referenceX: [-2, 0, 2],
    parameter: { name: 'k', min: -2, max: 2, step: 1, initial: 1 }, requiredValues: [1, -1], targetParameter: -1,
    followUp: { question: 'Вывод?', options: [{ text: 'Верно' }, { text: 'Неверно' }], answer: 0 },
  };
  app.context.__EngineInternal.state.blocks = [block];
  app.context.GraphWorkspaceBlock.commitParameter({ value: '-1' }, 0);
  assert.equal(app.interactionStates[0].parameterValue, -1);
  assert.deepEqual(app.interactionStates[0].visitedParameters, [1, -1]);
  assert.equal(app.interactionStates[0].completed, false);
  assert.equal(app.interactionStates[0].attemptCount, 0);
  assert.equal(app.context.renderCount, 0);
  app.context.GraphWorkspaceBlock.selectFollowUp({ name: 'graph-follow-up-0', value: '0' }, 0);
  assert.equal(app.interactionStates[0].attemptCount, 0);
  app.context.GraphWorkspaceBlock.checkFollowUp(0);
  assert.equal(app.interactionStates[0].completed, true);
  assert.equal(app.interactionStates[0].attemptCount, 1);
  assert.equal(app.context.renderCount, 0);
  const serialized = JSON.stringify(app.interactionStates[0]);
  const restored = JSON.parse(serialized);
  const html = app.context.GraphWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: restored });
  assert.ok(html.includes('y = −x'));
  assert.ok(html.includes('k = −1'));
}

function testStaticPlotPointsDoNotConflictWithScore() {
  const app = createApp('ru');
  const block = {
    id: 'inspect', type: 'graph-workspace', mode: 'inspect', title: 'График', viewport: viewport(),
    plotPoints: [{ x: 0, y: 1 }, { x: 1, y: 3 }], points: 12,
  };
  const html = app.context.GraphWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: null, savedResult: null });
  assert.ok(html.includes('Точка (0, 1)'));
  assert.ok(html.includes('Точка (1, 3)'));
}

function testInspectStartsWithoutASelectedConclusionAndShowsLabels() {
  const app = createApp('ru');
  const block = {
    id: 'read', type: 'graph-workspace', mode: 'inspect', title: 'Точка A', viewport: viewport(),
    plotPoints: [{ x: -3, y: 2, label: 'A' }],
    followUp: { question: 'Координаты?', options: [{ text: '(3,−2)' }, { text: '(−3,2)' }], answer: 1 },
  };
  const html = app.context.GraphWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: null, savedResult: null });
  assert.ok(html.includes('Точка A (−3, 2)'));
  assert.ok(html.includes('class="graph-point-label"'));
  assert.equal(html.includes('checked aria-checked="true"'), false);
  assert.equal(html.includes('is-selected'), false);
}

function testSchemaRejectsMalformedGraph() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/lesson-schema.js'), 'utf8'), context, { filename: 'lesson-schema.js' });
  const malformed = {
    id: 'bad.graph', title: 'Bad', blocks: [{
      id: 'bad', type: 'graph-workspace', title: 'Bad', mode: 'place-point',
      viewport: { xMin: 2, xMax: 1, yMin: -1, yMax: 1, gridStep: 0 }, target: { x: '2', y: 3 },
    }],
  };
  const validation = context.LESSON_SCHEMA.validate(malformed);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(function(error) { return error.includes('xMin < xMax'); }));
  assert.ok(validation.errors.some(function(error) { return error.includes('gridStep'); }));
  assert.ok(validation.errors.some(function(error) { return error.includes('finite x and y'); }));
}

function testGraphInteractionsDoNotCallGlobalRender() {
  const source = fs.readFileSync(path.join(ROOT, 'js/lesson-blocks/graph-workspace.js'), 'utf8');
  assert.equal(source.includes('LessonEngine.render()'), false);
}

testCoordinateTransformAndLine();
testPlacementToleranceAndMisconception();
testKeyboardAlternativeAndLocale();
testFunctionValueBecomesPoint();
testMultipleLinesAndLegend();
testNonlinearCurvesAndGap();
testFractionTableAnswers();
testParameterStateAndSerialization();
testStaticPlotPointsDoNotConflictWithScore();
testInspectStartsWithoutASelectedConclusionAndShowsLabels();
testSchemaRejectsMalformedGraph();
testGraphInteractionsDoNotCallGlobalRender();
console.log('graph-workspace: ok');
