/* Dependency-free checks for geometry math, interaction, and persistence. */
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
  const listeners = {};
  return {
    id,
    innerHTML: '',
    textContent: '',
    dataset: {},
    classList: classList(),
    setAttribute(name, value) { attrs[name] = String(value); },
    getAttribute(name) { return attrs[name] || null; },
    addEventListener(name, callback) { (listeners[name] = listeners[name] || []).push(callback); },
    dispatch(name, event) {
      const payload = Object.assign({ currentTarget: this }, event || {});
      (listeners[name] || []).forEach(callback => callback(payload));
    },
    listenerCount(name) { return (listeners[name] || []).length; },
    querySelectorAll() { return []; },
    focus() { this.focused = true; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 420 }; },
    setPointerCapture(pointerId) { this.capturedPointer = pointerId; },
    releasePointerCapture(pointerId) { this.releasedPointer = pointerId; },
  };
}

function createApp(lang, coarsePointer) {
  const nodes = {};
  const interactionStates = {};
  const context = {
    console,
    Date,
    Math,
    JSON,
    isFinite,
    document: {
      getElementById(id) { return nodes[id] || (nodes[id] = element(id)); },
      querySelectorAll() { return []; },
    },
    setTimeout(callback) { callback(); return 1; },
    matchMedia(query) { return { matches: coarsePointer === true && query === '(pointer: coarse)' }; },
    ML: { getLang() { return lang || 'ru'; } },
    __BlockHelpers: {
      progress() { return '<div class="progress"></div>'; },
      blockBadge(value) { return '<span>' + value + '</span>'; },
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
    renderCount: 0,
  };
  context.window = context;
  context.__EngineInternal = { state: { blocks: [] } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/lesson-blocks/geometry-workspace.js'), 'utf8'), context, { filename: 'geometry-workspace.js' });
  return { context, nodes, interactionStates };
}

function viewport() { return { xMin: 0, xMax: 10, yMin: 0, yMax: 7 }; }
function standardVertices() { return { A: { x: 5, y: 6 }, B: { x: 1.5, y: 1 }, C: { x: 8.5, y: 1 } }; }

function explorationBlock() {
  return {
    id: 'explore', type: 'geometry-workspace', mode: 'explore', title: 'Треугольник', viewport: viewport(),
    vertices: standardVertices(), draggableVertices: ['A', 'B', 'C'], constraints: { minArea: 1.2, minSide: 0.7 },
    keyboardStep: 0.3, requiredMoves: 1,
    followUp: { question: 'Вывод?', options: [{ text: 'Зависит от размера', code: 'size' }, { text: 'Сохраняется' }], answer: 1, successFeedback: 'Верно.' },
    feedback: 'Сравните измерения.',
  };
}

function close(actual, expected, tolerance) {
  assert.ok(Math.abs(actual - expected) <= (tolerance || 1e-8), actual + ' != ' + expected);
}

function testGeometryMath() {
  const geometry = createApp('ru').context.GeometryWorkspaceBlock;
  const equilateral = { A: { x: 0, y: Math.sqrt(3) }, B: { x: -1, y: 0 }, C: { x: 1, y: 0 } };
  const angles = geometry.triangleAngles(equilateral);
  close(angles.A, 60, 1e-8); close(angles.B, 60, 1e-8); close(angles.C, 60, 1e-8);
  close(geometry.angleSum(equilateral), 180, 1e-8);
  close(geometry.triangleArea(equilateral), Math.sqrt(3), 1e-8);

  const right = { A: { x: 0, y: 0 }, B: { x: 3, y: 0 }, C: { x: 0, y: 4 } };
  close(geometry.triangleAngles(right).A, 90, 1e-8);
  assert.ok(Array.from(geometry.triangleCategories(right)).includes('right'));

  const obtuse = { A: { x: 0, y: 0 }, B: { x: 5, y: 0 }, C: { x: 1, y: 0.6 } };
  assert.ok(Array.from(geometry.triangleCategories(obtuse)).includes('obtuse'));
  close(geometry.angleSum(obtuse), 180, 1e-8);

  const narrow = { A: { x: 0, y: 0 }, B: { x: 0.5, y: 0 }, C: { x: 0.25, y: 6 } };
  assert.ok(Array.from(geometry.triangleCategories(narrow)).includes('narrow'));
  assert.equal(geometry.isValidTriangle(narrow, { minArea: 1, minSide: 0.5 }), true);

  const degenerate = { A: { x: 0, y: 0 }, B: { x: 2, y: 0 }, C: { x: 4, y: 0 } };
  assert.equal(geometry.triangleArea(degenerate), 0);
  assert.equal(geometry.isValidTriangle(degenerate, { minArea: 1, minSide: 0.5 }), false);
  assert.equal(Number.isNaN(geometry.angleSum(degenerate)), false);
}

function testTransformAndResizeInvariant() {
  const geometry = createApp('ru').context.GeometryWorkspaceBlock;
  const transform = geometry.createTransform(viewport(), 640, 420, 30);
  const screen = transform.mathToScreen(6.2, 2.7);
  const restored = transform.screenToMath(screen.x, screen.y);
  close(restored.x, 6.2); close(restored.y, 2.7);
  const narrowTransform = geometry.createTransform(viewport(), 360, 280, 24);
  const state = standardVertices();
  const serialized = JSON.stringify(state);
  narrowTransform.mathToScreen(state.A.x, state.A.y);
  assert.equal(JSON.stringify(state), serialized, 'resize/projection must not mutate math state');
}

function testKeyboardEditDoesNotSubmit() {
  const app = createApp('ru');
  const block = explorationBlock();
  app.context.__EngineInternal.state.blocks = [block];
  let prevented = false;
  app.context.GeometryWorkspaceBlock.moveVertexByKeyboard({ key: 'ArrowRight', shiftKey: false, preventDefault() { prevented = true; } }, 0, 'A');
  assert.equal(prevented, true);
  assert.equal(app.interactionStates[0].dragCount, 1);
  assert.equal(app.interactionStates[0].attemptCount, 0);
  assert.equal(app.interactionStates[0].completed, false);
  assert.equal(app.context.renderCount, 0);

  app.context.GeometryWorkspaceBlock.selectFollowUp({ name: 'geometry-follow-up-0', value: '0' }, 0);
  assert.equal(app.interactionStates[0].attemptCount, 0);
  app.context.GeometryWorkspaceBlock.checkFollowUp(0);
  assert.equal(app.interactionStates[0].attemptCount, 1);
  assert.equal(app.interactionStates[0].completed, false);
  assert.deepEqual(app.interactionStates[0].misconceptionCodes, ['size']);

  app.context.GeometryWorkspaceBlock.selectFollowUp({ name: 'geometry-follow-up-0', value: '1' }, 0);
  app.context.GeometryWorkspaceBlock.checkFollowUp(0);
  assert.equal(app.interactionStates[0].attemptCount, 2);
  assert.equal(app.interactionStates[0].completed, true);
  assert.equal(app.interactionStates[0].pendingResult.repairedAfterFeedback, true);
  const completedX = app.interactionStates[0].vertices.A.x;
  app.context.GeometryWorkspaceBlock.moveVertexByKeyboard({ key: 'ArrowRight', shiftKey: false, preventDefault() {} }, 0, 'A');
  assert.equal(app.interactionStates[0].vertices.A.x, completedX, 'checked geometry is fixed until the lesson continues');
  assert.equal(app.context.renderCount, 0);
}

function testDragConstraintAndPointerCancel() {
  const app = createApp('ru');
  const constrained = explorationBlock();
  constrained.vertices = { A: { x: 5, y: 1.2 }, B: { x: 1, y: 1 }, C: { x: 9, y: 1 } };
  constrained.keyboardStep = 0.2;
  constrained.constraints = { minArea: 1.2, minSide: 0.7 };
  app.context.__EngineInternal.state.blocks = [constrained];
  app.context.GeometryWorkspaceBlock.moveVertexByKeyboard({ key: 'ArrowDown', shiftKey: false, preventDefault() {} }, 0, 'A');
  assert.equal(app.interactionStates[0], undefined, 'invalid degenerate move must be rejected');

  const block = explorationBlock();
  app.context.__EngineInternal.state.blocks = [block];
  const svg = app.context.document.getElementById('geometry-svg-0');
  const vertex = app.context.document.getElementById('geometry-vertex-0-A');
  app.context.GeometryWorkspaceBlock._pointerDown({ pointerId: 7, currentTarget: vertex, preventDefault() {} }, 0, 'A');
  app.context.GeometryWorkspaceBlock._pointerMove({ pointerId: 7, clientX: 360, clientY: 80 });
  app.context.GeometryWorkspaceBlock._pointerEnd({ pointerId: 7, type: 'pointercancel' });
  assert.equal(app.interactionStates[0].dragCount, 1);
  assert.equal(app.context.GeometryWorkspaceBlock.isValidTriangle(app.interactionStates[0].vertices, block.constraints), true);
  assert.equal(svg, app.context.document.getElementById('geometry-svg-0'));
  assert.equal(app.context.renderCount, 0);
}

function testAffordanceHintAndBoundPointerFlow() {
  const app = createApp('ru');
  const block = explorationBlock();
  app.context.__EngineInternal.state.blocks = [block];
  const initialHtml = app.context.GeometryWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: null, savedResult: null });
  assert.ok(initialHtml.includes('geometry-drag-hint-0'));
  assert.ok(initialHtml.includes('Потяните вершину A'));
  assert.ok(initialHtml.includes('aria-describedby="geometry-drag-hint-0"'));
  const movedHtml = app.context.GeometryWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: { dragCount: 1, vertices: standardVertices() }, savedResult: null });
  assert.equal(movedHtml.includes('geometry-drag-hint-0'), false, 'the instructional hint disappears after the first movement');

  const svg = app.context.document.getElementById('geometry-svg-0');
  const vertex = app.context.document.getElementById('geometry-vertex-0-A');
  vertex.setAttribute('data-vertex-id', 'A');
  vertex.classList.add('geometry-vertex', 'is-draggable');
  svg.querySelectorAll = selector => selector === '.geometry-vertex.is-draggable' ? [vertex] : [];
  const hint = app.context.document.getElementById('geometry-drag-hint-0');
  hint.parentNode = { removeChild(node) { node.removed = true; } };
  app.context.GeometryWorkspaceBlock.initialize(0, block);
  assert.equal(vertex.listenerCount('pointerdown'), 1, 'the real draggable vertex receives pointerdown listener');
  assert.equal(vertex.listenerCount('keydown'), 1, 'the real draggable vertex receives keyboard listener');
  assert.equal(svg.listenerCount('pointermove'), 1);
  assert.equal(svg.listenerCount('pointerup'), 1);

  let prevented = false;
  vertex.dispatch('pointerdown', { pointerId: 17, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(svg.capturedPointer, 17, 'pointerdown captures the active pointer on the SVG');
  assert.equal(hint.removed, true, 'the local prompt is dismissed before dragging');
  svg.dispatch('pointermove', { pointerId: 17, clientX: 360, clientY: 80 });
  svg.dispatch('pointerup', { pointerId: 17 });
  assert.notEqual(app.interactionStates[0].vertices.A.x, block.vertices.A.x, 'pointermove changes geometry coordinates');
  assert.equal(app.interactionStates[0].dragCount, 1);
  assert.equal(app.interactionStates[0].attemptCount, 0);
  assert.equal(app.context.renderCount, 0, 'drag updates local SVG state without global Lesson render');

  const touchApp = createApp('kk', true);
  touchApp.context.__EngineInternal.state.blocks = [block];
  const touchHtml = touchApp.context.GeometryWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: null, savedResult: null });
  assert.ok(touchHtml.includes('A нүктесін түртіп, тартыңыз'));
  const css = fs.readFileSync(path.join(ROOT, 'css/editorial.css'), 'utf8');
  assert.ok(css.includes('.geometry-vertex-hit { fill:transparent; stroke:transparent; pointer-events:all; }'));
  assert.equal(/\.geometry-drag-hint[^}]*animation\s*:/.test(css), false, 'the hint is static and therefore respects reduced motion');
}

function testProofAndPersistence() {
  const app = createApp('kk');
  const block = {
    id: 'proof', type: 'geometry-workspace', mode: 'proof', title: 'Дәлелдеу', viewport: viewport(), vertices: standardVertices(),
    auxiliaryAt: 'A', proofSteps: [{ title: '1', text: 'a' }, { title: '2', text: 'b' }, { title: '3', text: 'c' }],
  };
  app.context.__EngineInternal.state.blocks = [block];
  let html = app.context.GeometryWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: null, savedResult: null });
  assert.ok(html.includes('Сызбамен жұмыс'));
  app.context.GeometryWorkspaceBlock.advanceProof(0);
  const serialized = JSON.stringify(app.interactionStates[0]);
  const restored = JSON.parse(serialized);
  assert.equal(restored.proofStep, 1);
  html = app.context.GeometryWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: restored, savedResult: null });
  assert.ok(html.includes('DE ∥ BC'));
  app.context.GeometryWorkspaceBlock.advanceProof(0);
  app.context.GeometryWorkspaceBlock.finishProof(0);
  assert.equal(app.interactionStates[0].completed, true);
  assert.equal(app.interactionStates[0].pendingResult.totalQuestions, undefined);
  assert.equal(app.interactionStates[0].pendingResult.correct, undefined, 'proof viewing is evidence, not an assessed proof claim');
  assert.equal(app.interactionStates[0].pendingResult.points, 0);
  assert.equal(app.interactionStates[0].attemptCount, 0);
  html = app.context.GeometryWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: app.interactionStates[0], savedResult: null });
  assert.equal(html.includes('Зафиксировать объяснение'), false);
}

function testSchemaRejectsMalformedGeometry() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/lesson-schema.js'), 'utf8'), context, { filename: 'lesson-schema.js' });
  const malformed = {
    id: 'bad.geometry', title: 'Bad', blocks: [{
      id: 'bad', type: 'geometry-workspace', title: 'Bad', mode: 'drag-everything',
      viewport: { xMin: 2, xMax: 1, yMin: 0, yMax: 7 },
      vertices: { A: { x: 1, y: 2 }, B: { x: '3', y: 1 } }, draggableVertices: ['Z'],
    }],
  };
  const validation = context.LESSON_SCHEMA.validate(malformed);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(error => error.includes('mode must be')));
  assert.ok(validation.errors.some(error => error.includes('xMin < xMax')));
  assert.ok(validation.errors.some(error => error.includes('vertices.B')));
  assert.ok(validation.errors.some(error => error.includes('vertices.C')));
  assert.ok(validation.errors.some(error => error.includes('draggableVertices')));

  const degenerate = {
    id: 'bad.geometry.line', title: 'Bad line', blocks: [{
      id: 'line', type: 'geometry-workspace', title: 'Line', mode: 'explore',
      viewport: { xMin: 0, xMax: 5, yMin: 0, yMax: 5 },
      vertices: { A: { x: 1, y: 1 }, B: { x: 2, y: 2 }, C: { x: 3, y: 3 } },
    }],
  };
  const degenerateValidation = context.LESSON_SCHEMA.validate(degenerate);
  assert.equal(degenerateValidation.valid, false);
  assert.ok(degenerateValidation.errors.some(error => error.includes('degenerate or too narrow')));
}

function testNoGlobalRenderPath() {
  const source = fs.readFileSync(path.join(ROOT, 'js/lesson-blocks/geometry-workspace.js'), 'utf8');
  assert.equal(source.includes('LessonEngine.render()'), false);
}

function testInitialCategoryIsMeaningfulEvidence() {
  const app = createApp('ru');
  const block = explorationBlock();
  app.context.__EngineInternal.state.blocks = [block];
  app.context.GeometryWorkspaceBlock.render(block, { index: 0, total: 1, interactionState: null, savedResult: null });
  app.context.GeometryWorkspaceBlock.moveVertexByKeyboard({ key: 'ArrowLeft', shiftKey: false, preventDefault() {} }, 0, 'A');
  assert.ok(app.interactionStates[0].visitedCategories.includes('acute'), 'the valid initial form must survive the first persisted edit');
}

testGeometryMath();
testTransformAndResizeInvariant();
testKeyboardEditDoesNotSubmit();
testDragConstraintAndPointerCancel();
testAffordanceHintAndBoundPointerFlow();
testProofAndPersistence();
testSchemaRejectsMalformedGeometry();
testInitialCategoryIsMeaningfulEvidence();
testNoGlobalRenderPath();
console.log('geometry-workspace: ok');
