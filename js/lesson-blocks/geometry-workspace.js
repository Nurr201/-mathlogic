/* Reusable SVG workspace for small, author-configured geometry investigations. */
window.GeometryWorkspaceBlock = (function() {
  'use strict';

  var H = window.__BlockHelpers;
  var WIDTH = 640;
  var HEIGHT = 420;
  var PADDING = 30;
  var dragState = null;

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function copy(ru, kk) {
    return typeof ML !== 'undefined' && ML.getLang && ML.getLang() === 'kk' ? kk : ru;
  }

  function currentBlock(index) {
    var state = window.__EngineInternal && window.__EngineInternal.state;
    return state && state.blocks ? state.blocks[index] : null;
  }

  function finite(value) { return typeof value === 'number' && isFinite(value); }
  function clean(value) { return Math.abs(value) < 1e-9 ? 0 : Math.round(value * 1000) / 1000; }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function createTransform(viewport, width, height, padding) {
    padding = padding === undefined ? PADDING : padding;
    var innerWidth = width - padding * 2;
    var innerHeight = height - padding * 2;
    return {
      mathToScreen: function(x, y) {
        return {
          x: padding + (x - viewport.xMin) / (viewport.xMax - viewport.xMin) * innerWidth,
          y: padding + (viewport.yMax - y) / (viewport.yMax - viewport.yMin) * innerHeight,
        };
      },
      screenToMath: function(px, py) {
        return {
          x: viewport.xMin + (px - padding) / innerWidth * (viewport.xMax - viewport.xMin),
          y: viewport.yMax - (py - padding) / innerHeight * (viewport.yMax - viewport.yMin),
        };
      },
    };
  }

  function triangleArea(vertices) {
    if (!vertices || !vertices.A || !vertices.B || !vertices.C) return 0;
    return Math.abs(
      (vertices.B.x - vertices.A.x) * (vertices.C.y - vertices.A.y) -
      (vertices.B.y - vertices.A.y) * (vertices.C.x - vertices.A.x)
    ) / 2;
  }

  function distance(a, b) {
    var dx = Number(a.x) - Number(b.x);
    var dy = Number(a.y) - Number(b.y);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function angleAt(vertex, first, second) {
    if (!vertex || !first || !second) return 0;
    var ux = first.x - vertex.x;
    var uy = first.y - vertex.y;
    var vx = second.x - vertex.x;
    var vy = second.y - vertex.y;
    var firstLength = Math.sqrt(ux * ux + uy * uy);
    var secondLength = Math.sqrt(vx * vx + vy * vy);
    if (firstLength < 1e-9 || secondLength < 1e-9) return 0;
    var cross = Math.abs(ux * vy - uy * vx);
    var dot = ux * vx + uy * vy;
    var angle = Math.atan2(cross, dot) * 180 / Math.PI;
    return finite(angle) ? angle : 0;
  }

  function triangleAngles(vertices) {
    return {
      A: angleAt(vertices.A, vertices.B, vertices.C),
      B: angleAt(vertices.B, vertices.A, vertices.C),
      C: angleAt(vertices.C, vertices.A, vertices.B),
    };
  }

  function angleSum(vertices) {
    var angles = triangleAngles(vertices);
    return angles.A + angles.B + angles.C;
  }

  function isValidTriangle(vertices, constraints) {
    constraints = constraints || {};
    var minimumArea = finite(constraints.minArea) ? constraints.minArea : 1.2;
    var minimumSide = finite(constraints.minSide) ? constraints.minSide : 0.8;
    return triangleArea(vertices) >= minimumArea &&
      distance(vertices.A, vertices.B) >= minimumSide &&
      distance(vertices.B, vertices.C) >= minimumSide &&
      distance(vertices.C, vertices.A) >= minimumSide;
  }

  function triangleCategories(vertices) {
    var angles = triangleAngles(vertices);
    var values = [angles.A, angles.B, angles.C];
    var maximum = Math.max.apply(Math, values);
    var minimum = Math.min.apply(Math, values);
    var result = [];
    if (Math.abs(maximum - 90) <= 3) result.push('right');
    else if (maximum > 90) result.push('obtuse');
    else result.push('acute');
    if (minimum < 24) result.push('narrow');
    return result;
  }

  function emptyRecord(block) {
    return {
      blockId: block.id,
      mode: block.mode,
      vertices: clone(block.vertices || {}),
      movedVertices: [],
      visitedCategories: triangleCategories(block.vertices || {}),
      dragCount: 0,
      followUpSelected: null,
      proofStep: 0,
      attemptCount: 0,
      attempts: [],
      hintCount: 0,
      misconceptionCodes: [],
      lastStatus: '',
      lastFeedback: '',
      completed: false,
    };
  }

  function addUnique(list, value) {
    if (value !== undefined && value !== null && list.indexOf(value) === -1) list.push(value);
  }

  function ensureRecord(block, record) {
    record = record || emptyRecord(block);
    if (!record.vertices || !record.vertices.A || !record.vertices.B || !record.vertices.C) record.vertices = clone(block.vertices || {});
    record.movedVertices = Array.isArray(record.movedVertices) ? record.movedVertices : [];
    record.visitedCategories = Array.isArray(record.visitedCategories) ? record.visitedCategories : [];
    record.attempts = Array.isArray(record.attempts) ? record.attempts : [];
    record.misconceptionCodes = Array.isArray(record.misconceptionCodes) ? record.misconceptionCodes : [];
    return record;
  }

  function recordFor(block, ctx) {
    var record = ensureRecord(block, ctx.interactionState || (ctx.savedResult && ctx.savedResult.evidence));
    triangleCategories(record.vertices).forEach(function(category) { addUnique(record.visitedCategories, category); });
    return record;
  }

  function save(index, record) {
    LessonEngine.setInteractionState(index, record);
    return record;
  }

  function formatAngle(value) {
    return (Math.round(value * 10) / 10).toFixed(1).replace('.', ',') + '°';
  }

  function screenVertices(block, record) {
    var transform = createTransform(block.viewport, WIDTH, HEIGHT, PADDING);
    var result = {};
    ['A', 'B', 'C'].forEach(function(id) {
      result[id] = transform.mathToScreen(record.vertices[id].x, record.vertices[id].y);
    });
    return result;
  }

  function shortDelta(start, end) {
    var delta = end - start;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta <= -Math.PI) delta += Math.PI * 2;
    return delta;
  }

  function arcPath(vertex, first, second, radius) {
    var a1 = Math.atan2(first.y - vertex.y, first.x - vertex.x);
    var a2 = Math.atan2(second.y - vertex.y, second.x - vertex.x);
    var delta = shortDelta(a1, a2);
    var start = { x: vertex.x + Math.cos(a1) * radius, y: vertex.y + Math.sin(a1) * radius };
    var end = { x: vertex.x + Math.cos(a2) * radius, y: vertex.y + Math.sin(a2) * radius };
    return 'M ' + clean(start.x) + ' ' + clean(start.y) + ' A ' + radius + ' ' + radius + ' 0 0 ' + (delta > 0 ? 1 : 0) + ' ' + clean(end.x) + ' ' + clean(end.y);
  }

  function interiorLabelPoint(vertex, first, second, radius) {
    var ux = first.x - vertex.x;
    var uy = first.y - vertex.y;
    var vx = second.x - vertex.x;
    var vy = second.y - vertex.y;
    var ul = Math.sqrt(ux * ux + uy * uy) || 1;
    var vl = Math.sqrt(vx * vx + vy * vy) || 1;
    var bx = ux / ul + vx / vl;
    var by = uy / ul + vy / vl;
    var length = Math.sqrt(bx * bx + by * by) || 1;
    return { x: vertex.x + bx / length * radius, y: vertex.y + by / length * radius };
  }

  function outwardLabelPoint(id, points) {
    var centroid = {
      x: (points.A.x + points.B.x + points.C.x) / 3,
      y: (points.A.y + points.B.y + points.C.y) / 3,
    };
    var vertex = points[id];
    var dx = vertex.x - centroid.x;
    var dy = vertex.y - centroid.y;
    var length = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: clamp(vertex.x + dx / length * 22, 12, WIDTH - 12),
      y: clamp(vertex.y + dy / length * 22 + 5, 16, HEIGHT - 10),
    };
  }

  function vertexHtml(id, point, draggable, recommended, index) {
    var label = copy('Вершина ', 'Төбе ') + id + (draggable ? copy('. Перемещайте стрелками.', '. Бағыттауыш пернелермен жылжытыңыз.') : '');
    return '<g id="geometry-vertex-' + index + '-' + id + '" class="geometry-vertex' + (draggable ? ' is-draggable' : '') + '" data-vertex-id="' + id + '"' +
      (draggable ? ' tabindex="0" role="button" aria-label="' + escapeHtml(label) + '"' + (recommended ? ' aria-describedby="geometry-drag-hint-' + index + '"' : '') : '') + '>' +
      '<circle class="geometry-vertex-hit" cx="' + point.x + '" cy="' + point.y + '" r="22"></circle>' +
      '<circle class="geometry-vertex-dot" cx="' + point.x + '" cy="' + point.y + '" r="7"></circle></g>';
  }

  function recommendedVertex(block, record) {
    if (block.mode !== 'explore' || record.completed || record.dragCount > 0) return '';
    var vertices = block.draggableVertices && block.draggableVertices.length ? block.draggableVertices : ['A', 'B', 'C'];
    return vertices[0] || '';
  }

  function usesCoarsePointer() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  }

  function dragHintText(id) {
    if (usesCoarsePointer()) {
      return copy('Коснитесь точки ' + id + ' и потяните', id + ' нүктесін түртіп, тартыңыз');
    }
    return copy('Потяните вершину ' + id, id + ' төбесін тартыңыз');
  }

  function dragHintMarkup(block, record, points, index) {
    var id = recommendedVertex(block, record);
    if (!id || !points[id]) return '';
    var centroid = {
      x: (points.A.x + points.B.x + points.C.x) / 3,
      y: (points.A.y + points.B.y + points.C.y) / 3,
    };
    var vertex = points[id];
    var dx = vertex.x - centroid.x;
    var dy = vertex.y - centroid.y;
    var length = Math.sqrt(dx * dx + dy * dy) || 1;
    var tip = { x: vertex.x + dx / length * 20, y: vertex.y + dy / length * 20 };
    var text = dragHintText(id);
    var width = usesCoarsePointer() ? copy(196, 168) : copy(124, 118);
    var boxX = clamp(tip.x - width / 2, 10, WIDTH - width - 10);
    var boxY = clamp(tip.y - 42, 10, HEIGHT - 34);
    var lineEndX = clamp(tip.x, boxX + 14, boxX + width - 14);
    var lineEndY = boxY + 24;
    return '<g id="geometry-drag-hint-' + index + '" class="geometry-drag-hint">' +
      '<line x1="' + clean(vertex.x) + '" y1="' + clean(vertex.y) + '" x2="' + clean(lineEndX) + '" y2="' + clean(lineEndY) + '"></line>' +
      '<rect x="' + clean(boxX) + '" y="' + clean(boxY) + '" width="' + width + '" height="24" rx="8"></rect>' +
      '<text x="' + clean(boxX + width / 2) + '" y="' + clean(boxY + 16) + '" text-anchor="middle">' + escapeHtml(text) + '</text></g>';
  }

  function auxiliaryLinePoints(block, record, points) {
    var at = block.auxiliaryAt || 'A';
    var other = ['A', 'B', 'C'].filter(function(id) { return id !== at; });
    var dx = points[other[1]].x - points[other[0]].x;
    var dy = points[other[1]].y - points[other[0]].y;
    var length = Math.sqrt(dx * dx + dy * dy) || 1;
    var scale = Math.max(WIDTH, HEIGHT) * 1.2 / length;
    return {
      start: { x: points[at].x - dx * scale, y: points[at].y - dy * scale },
      end: { x: points[at].x + dx * scale, y: points[at].y + dy * scale },
    };
  }

  function proofMarkup(block, record, points) {
    if (block.mode !== 'proof' || record.proofStep < 1) return '';
    var line = auxiliaryLinePoints(block, record, points);
    var markup = '<line class="geometry-auxiliary-line" x1="' + line.start.x + '" y1="' + line.start.y + '" x2="' + line.end.x + '" y2="' + line.end.y + '"></line>' +
      '<text class="geometry-auxiliary-label" x="' + (points.A.x + 150) + '" y="' + (points.A.y - 10) + '">DE ∥ BC</text>';
    if (record.proofStep >= 2) {
      markup += '<path class="geometry-proof-arc geometry-proof-arc-b" d="' + arcPath(points.A, line.start, points.B, 35) + '"></path>' +
        '<path class="geometry-proof-arc geometry-proof-arc-c" d="' + arcPath(points.A, points.C, line.end, 35) + '"></path>' +
        '<text class="geometry-proof-label" x="' + (points.A.x - 72) + '" y="' + (points.A.y + 24) + '">∠B</text>' +
        '<text class="geometry-proof-label" x="' + (points.A.x + 62) + '" y="' + (points.A.y + 24) + '">∠C</text>';
    }
    if (record.proofStep >= 3) {
      markup += '<path class="geometry-straight-angle" d="M ' + (points.A.x - 120) + ' ' + points.A.y + ' L ' + (points.A.x + 120) + ' ' + points.A.y + '"></path>' +
        '<text class="geometry-straight-label" x="' + points.A.x + '" y="' + (points.A.y - 24) + '" text-anchor="middle">∠B + ∠A + ∠C = 180°</text>';
    }
    return markup;
  }

  function sceneDescription(block, record) {
    var angles = triangleAngles(record.vertices);
    var description = copy('Треугольник ABC. ', 'ABC үшбұрышы. ') +
      copy('Внутренние углы: ', 'Ішкі бұрыштары: ') +
      'A ' + formatAngle(angles.A) + ', B ' + formatAngle(angles.B) + ', C ' + formatAngle(angles.C) + '. ';
    if (block.showSum) description += copy('Измеренная сумма приблизительно 180 градусов. ', 'Өлшенген қосынды шамамен 180 градус. ');
    if (block.mode === 'proof') description += copy('Шаг доказательства ', 'Дәлелдеу қадамы ') + (record.proofStep + 1) + '.';
    return description;
  }

  function svgHtml(block, record, index) {
    var points = screenVertices(block, record);
    var angles = triangleAngles(record.vertices);
    var draggable = block.mode === 'explore' && !record.completed;
    var angleDefs = [
      { id: 'A', first: 'B', second: 'C' },
      { id: 'B', first: 'A', second: 'C' },
      { id: 'C', first: 'A', second: 'B' },
    ];
    var arcs = angleDefs.map(function(definition) {
      var label = interiorLabelPoint(points[definition.id], points[definition.first], points[definition.second], 48);
      return '<path id="geometry-angle-arc-' + index + '-' + definition.id + '" class="geometry-angle-arc geometry-angle-' + definition.id.toLowerCase() + '" d="' + arcPath(points[definition.id], points[definition.first], points[definition.second], 29) + '"></path>' +
        '<text id="geometry-angle-value-' + index + '-' + definition.id + '" class="geometry-angle-value" x="' + label.x + '" y="' + (label.y + 4) + '" text-anchor="middle">' + (block.showMeasurements === false ? '∠' + definition.id : formatAngle(angles[definition.id])) + '</text>';
    }).join('');
    var labels = ['A', 'B', 'C'].map(function(id) {
      var label = outwardLabelPoint(id, points);
      return '<text id="geometry-vertex-label-' + index + '-' + id + '" class="geometry-vertex-label" x="' + label.x + '" y="' + label.y + '" text-anchor="middle">' + id + '</text>';
    }).join('');
    var recommended = recommendedVertex(block, record);
    var vertices = ['A', 'B', 'C'].map(function(id) {
      return vertexHtml(id, points[id], draggable && (!block.draggableVertices || block.draggableVertices.indexOf(id) > -1), id === recommended, index);
    }).join('');
    var description = sceneDescription(block, record);
    return '<div class="geometry-canvas-shell"><svg id="geometry-svg-' + index + '" class="geometry-svg" viewBox="0 0 ' + WIDTH + ' ' + HEIGHT + '" role="img" aria-labelledby="geometry-title-' + index + ' geometry-description-' + index + '">' +
      '<title id="geometry-title-' + index + '">' + escapeHtml(block.title) + '</title><desc id="geometry-description-' + index + '">' + escapeHtml(description) + '</desc>' +
      '<polygon id="geometry-triangle-' + index + '" class="geometry-triangle" points="' + points.A.x + ',' + points.A.y + ' ' + points.B.x + ',' + points.B.y + ' ' + points.C.x + ',' + points.C.y + '"></polygon>' +
      '<g id="geometry-angle-layer-' + index + '">' + arcs + '</g><g id="geometry-proof-layer-' + index + '">' + proofMarkup(block, record, points) + '</g>' +
      '<g id="geometry-vertex-layer-' + index + '">' + vertices + labels + dragHintMarkup(block, record, points, index) + '</g></svg>' +
      '<p id="geometry-text-state-' + index + '" class="sr-only" aria-live="polite">' + escapeHtml(description) + '</p></div>';
  }

  function measurementsHtml(block, record, index) {
    if (block.showMeasurements === false) return '';
    var angles = triangleAngles(record.vertices);
    return '<div class="geometry-measurements" aria-label="' + escapeHtml(copy('Измерения углов', 'Бұрыш өлшемдері')) + '">' +
      ['A', 'B', 'C'].map(function(id) { return '<span><b>∠' + id + '</b><output id="geometry-measure-' + index + '-' + id + '">' + formatAngle(angles[id]) + '</output></span>'; }).join('') +
      (block.showSum ? '<span class="geometry-sum"><b>Σ</b><output id="geometry-sum-' + index + '">≈ 180°</output></span>' : '') + '</div>';
  }

  function requiredExplorationMet(block, record) {
    var required = block.requiredCategories || [];
    var requiredMoves = Math.max(0, Number(block.requiredMoves) || 0);
    return record.dragCount >= requiredMoves && required.every(function(category) { return record.visitedCategories.indexOf(category) > -1; });
  }

  function explorationHtml(block, record, index) {
    if (block.mode !== 'explore') return '';
    var required = block.requiredCategories || [];
    var items = required.map(function(category) {
      var found = record.visitedCategories.indexOf(category) > -1;
      var label = block.categoryLabels && block.categoryLabels[category] ? block.categoryLabels[category] : category;
      return '<li class="' + (found ? 'is-visited' : '') + '"><span aria-hidden="true">' + (found ? '✓' : '○') + '</span>' + label + '</li>';
    }).join('');
    return required.length ? '<div id="geometry-exploration-' + index + '" class="geometry-exploration"><p>' + (block.task || copy('Измените треугольник и сравните измерения.', 'Үшбұрышты өзгертіп, өлшемдерді салыстырыңыз.')) + '</p><ul>' + items + '</ul></div>' :
      '<p class="geometry-task">' + (block.task || copy('Измените треугольник и сравните измерения.', 'Үшбұрышты өзгертіп, өлшемдерді салыстырыңыз.')) + '</p>';
  }

  function feedbackHtml(record, index) {
    if (!record.lastStatus || !record.lastFeedback) return '<div id="geometry-feedback-' + index + '" class="math-response-feedback-slot" aria-live="polite"></div>';
    var correct = record.lastStatus === 'correct';
    return '<div id="geometry-feedback-' + index + '" class="math-response-feedback is-' + record.lastStatus + '" role="' + (correct ? 'status' : 'alert') + '" aria-live="polite" tabindex="-1"><strong>' +
      (correct ? copy('Вывод согласован с чертежом', 'Қорытынды сызбамен сәйкес') : copy('Сверьте вывод с измерениями', 'Қорытындыны өлшемдермен салыстырыңыз')) +
      '</strong><p>' + record.lastFeedback + '</p></div>';
  }

  function hintsHtml(block, record, index) {
    if (record.completed || !(block.hints || []).length) return '';
    var shown = block.hints.slice(0, record.hintCount).map(function(hint, hintIndex) {
      return '<li><span>H' + (hintIndex + 1) + '</span><p>' + hint + '</p></li>';
    }).join('');
    var button = record.hintCount < block.hints.length ? '<button type="button" class="guided-hint-button" onclick="GeometryWorkspaceBlock.showHint(' + index + ')">' +
      (record.hintCount ? copy('Следующая подсказка', 'Келесі нұсқау') : copy('Показать подсказку', 'Нұсқауды көрсету')) + '</button>' : '';
    return '<div class="guided-hints">' + (shown ? '<ol>' + shown + '</ol>' : '') + button + '</div>';
  }

  function followUpHtml(block, record, index) {
    if (!block.followUp || record.completed) return '';
    var ready = requiredExplorationMet(block, record);
    var name = 'geometry-follow-up-' + index;
    var options = block.followUp.options.map(function(option, optionIndex) {
      var selected = Number(record.followUpSelected) === optionIndex;
      var resultClass = record.lastStatus === 'incorrect' && selected ? ' is-incorrect' : '';
      return '<label class="lesson-option geometry-choice' + (selected ? ' is-selected' : '') + resultClass + '"><input type="radio" name="' + name + '" value="' + optionIndex + '" ' +
        (selected ? 'checked aria-checked="true"' : 'aria-checked="false"') + ' onchange="GeometryWorkspaceBlock.selectFollowUp(this,' + index + ')" onkeydown="GeometryWorkspaceBlock.keySelectFollowUp(event,this,' + index + ')"><span class="lesson-option-dot" aria-hidden="true"></span><span>' + option.text + '</span></label>';
    }).join('');
    return '<fieldset class="geometry-follow-up"' + (ready ? '' : ' disabled') + '><legend>' + block.followUp.question + '</legend><div>' + options + '</div>' +
      (!ready ? '<p class="geometry-follow-up-gate">' + (block.explorationGate || copy('Сначала исследуйте указанные формы.', 'Алдымен көрсетілген пішіндерді зерттеңіз.')) + '</p>' : '') +
      '<button id="geometry-check-' + index + '" type="button" class="guided-submit-button"' + (!ready || record.followUpSelected === null ? ' disabled' : '') + ' onclick="GeometryWorkspaceBlock.checkFollowUp(' + index + ')">' + copy('Проверить', 'Тексеру') + '</button></fieldset>';
  }

  function proofHtml(block, record, index) {
    if (block.mode !== 'proof') return '';
    var steps = block.proofSteps || [];
    var step = steps[Math.min(record.proofStep, steps.length - 1)] || {};
    var atEnd = record.proofStep >= steps.length - 1;
    var action = record.completed ? '' : (!atEnd ? '<button type="button" class="guided-submit-button" onclick="GeometryWorkspaceBlock.advanceProof(' + index + ')">' + copy('Дальше', 'Әрі қарай') + '</button>' :
      '<button type="button" class="guided-submit-button" onclick="GeometryWorkspaceBlock.finishProof(' + index + ')">' + copy('Зафиксировать объяснение', 'Түсіндіруді бекіту') + '</button>');
    return '<div class="geometry-proof-panel"><p class="geometry-proof-count">' + copy('Шаг ', 'Қадам ') + (record.proofStep + 1) + ' / ' + steps.length + '</p>' +
      '<h3>' + (step.title || '') + '</h3><p>' + (step.text || '') + '</p>' + (action ? '<div class="geometry-proof-actions">' + action + '</div>' : '') + '</div>';
  }

  function actionsHtml(record, index) {
    return record.completed ? '<button type="button" class="lesson-continue-button" onclick="GeometryWorkspaceBlock.complete(' + index + ')">' + copy('Продолжить', 'Жалғастыру') + '</button>' : '';
  }

  function render(block, ctx) {
    var record = recordFor(block, ctx);
    return H.wrap('<div class="geometry-workspace-block">' + H.progress(ctx.index, ctx.total) + H.blockBadge(block.badgeLabel || copy('Работа с чертежом', 'Сызбамен жұмыс')) +
      '<h2>' + block.title + '</h2>' + (block.intro ? '<p class="geometry-workspace-intro">' + block.intro + '</p>' : '') +
      '<div class="geometry-layout"><div class="geometry-visual-column">' + svgHtml(block, record, ctx.index) + '<div id="geometry-measurements-' + ctx.index + '">' + measurementsHtml(block, record, ctx.index) + '</div></div>' +
      '<div class="geometry-side-column"><div id="geometry-exploration-slot-' + ctx.index + '">' + explorationHtml(block, record, ctx.index) + '</div><div id="geometry-proof-slot-' + ctx.index + '">' + proofHtml(block, record, ctx.index) + '</div></div></div>' +
      '<div id="geometry-follow-up-slot-' + ctx.index + '">' + followUpHtml(block, record, ctx.index) + '</div><div id="geometry-hints-slot-' + ctx.index + '">' + hintsHtml(block, record, ctx.index) + '</div>' +
      '<div id="geometry-feedback-slot-' + ctx.index + '">' + feedbackHtml(record, ctx.index) + '</div><div id="geometry-actions-' + ctx.index + '" class="guided-actions">' + actionsHtml(record, ctx.index) + '</div></div>', { className: 'geometry-workspace-wrap' });
  }

  function replaceHtml(id, html) {
    var node = document.getElementById(id);
    if (node) node.innerHTML = html;
  }

  function updateGeometry(block, record, index) {
    var points = screenVertices(block, record);
    var angles = triangleAngles(record.vertices);
    var triangle = document.getElementById('geometry-triangle-' + index);
    if (triangle) triangle.setAttribute('points', points.A.x + ',' + points.A.y + ' ' + points.B.x + ',' + points.B.y + ' ' + points.C.x + ',' + points.C.y);
    [
      { id: 'A', first: 'B', second: 'C' },
      { id: 'B', first: 'A', second: 'C' },
      { id: 'C', first: 'A', second: 'B' },
    ].forEach(function(definition) {
      var arc = document.getElementById('geometry-angle-arc-' + index + '-' + definition.id);
      var value = document.getElementById('geometry-angle-value-' + index + '-' + definition.id);
      var measure = document.getElementById('geometry-measure-' + index + '-' + definition.id);
      var label = interiorLabelPoint(points[definition.id], points[definition.first], points[definition.second], 48);
      if (arc) arc.setAttribute('d', arcPath(points[definition.id], points[definition.first], points[definition.second], 29));
      if (value) {
        value.setAttribute('x', label.x); value.setAttribute('y', label.y + 4);
        value.textContent = block.showMeasurements === false ? '∠' + definition.id : formatAngle(angles[definition.id]);
      }
      if (measure) measure.textContent = formatAngle(angles[definition.id]);
      var vertex = document.getElementById('geometry-vertex-' + index + '-' + definition.id);
      if (vertex && vertex.querySelectorAll) Array.prototype.forEach.call(vertex.querySelectorAll('circle'), function(circle) { circle.setAttribute('cx', points[definition.id].x); circle.setAttribute('cy', points[definition.id].y); });
      var vertexLabel = document.getElementById('geometry-vertex-label-' + index + '-' + definition.id);
      var vertexLabelPoint = outwardLabelPoint(definition.id, points);
      if (vertexLabel) { vertexLabel.setAttribute('x', vertexLabelPoint.x); vertexLabel.setAttribute('y', vertexLabelPoint.y); }
    });
    replaceHtml('geometry-proof-layer-' + index, proofMarkup(block, record, points));
    var description = sceneDescription(block, record);
    var descriptionNode = document.getElementById('geometry-description-' + index);
    var textNode = document.getElementById('geometry-text-state-' + index);
    if (descriptionNode) descriptionNode.textContent = description;
    if (textNode) textNode.textContent = description;
  }

  function updateInteractionUi(block, record, index, focusFeedback) {
    replaceHtml('geometry-exploration-slot-' + index, explorationHtml(block, record, index));
    replaceHtml('geometry-follow-up-slot-' + index, followUpHtml(block, record, index));
    replaceHtml('geometry-hints-slot-' + index, hintsHtml(block, record, index));
    replaceHtml('geometry-feedback-slot-' + index, feedbackHtml(record, index));
    replaceHtml('geometry-actions-' + index, actionsHtml(record, index));
    if (record.completed) {
      var svg = document.getElementById('geometry-svg-' + index);
      var vertices = svg && svg.querySelectorAll ? svg.querySelectorAll('.geometry-vertex.is-draggable') : [];
      Array.prototype.forEach.call(vertices, function(vertex) {
        vertex.classList.remove('is-draggable', 'is-dragging');
        vertex.setAttribute('tabindex', '-1');
        vertex.setAttribute('aria-disabled', 'true');
      });
    }
    if (focusFeedback) setTimeout(function() {
      var feedback = document.getElementById('geometry-feedback-' + index);
      if (feedback && feedback.focus) feedback.focus();
    }, 0);
  }

  function markExploration(record, vertexId) {
    record.dragCount += 1;
    addUnique(record.movedVertices, vertexId);
    triangleCategories(record.vertices).forEach(function(category) { addUnique(record.visitedCategories, category); });
  }

  function dismissDragHint(index) {
    var hint = document.getElementById('geometry-drag-hint-' + index);
    if (hint && hint.parentNode && hint.parentNode.removeChild) hint.parentNode.removeChild(hint);
  }

  function candidateFromPointer(block, svg, event) {
    var rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    var px = (event.clientX - rect.left) / rect.width * WIDTH;
    var py = (event.clientY - rect.top) / rect.height * HEIGHT;
    var point = createTransform(block.viewport, WIDTH, HEIGHT, PADDING).screenToMath(px, py);
    return {
      x: clean(clamp(point.x, block.viewport.xMin, block.viewport.xMax)),
      y: clean(clamp(point.y, block.viewport.yMin, block.viewport.yMax)),
    };
  }

  function applyVertex(block, record, id, point) {
    var candidate = clone(record.vertices);
    candidate[id] = { x: clean(point.x), y: clean(point.y) };
    if (!isValidTriangle(candidate, block.constraints)) return false;
    record.vertices = candidate;
    record.lastStatus = '';
    record.lastFeedback = '';
    return true;
  }

  function pointerDown(event, index, id) {
    var block = currentBlock(index);
    var svg = document.getElementById('geometry-svg-' + index);
    var record = block ? ensureRecord(block, LessonEngine.getInteractionState(index)) : null;
    if (!block || block.mode !== 'explore' || !svg || (record && record.completed)) return;
    dismissDragHint(index);
    event.preventDefault();
    dragState = { index: index, id: id, pointerId: event.pointerId, svg: svg, record: record, changed: false };
    if (event.currentTarget && event.currentTarget.classList) event.currentTarget.classList.add('is-dragging');
    if (svg.setPointerCapture) svg.setPointerCapture(event.pointerId);
  }

  function pointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    var block = currentBlock(dragState.index);
    if (!block) return;
    var record = dragState.record || ensureRecord(block, LessonEngine.getInteractionState(dragState.index));
    var point = candidateFromPointer(block, dragState.svg, event);
    if (point && applyVertex(block, record, dragState.id, point)) {
      dragState.changed = true;
      dragState.record = record;
      updateGeometry(block, record, dragState.index);
    }
  }

  function endPointer(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    var active = dragState;
    var block = currentBlock(active.index);
    var record = block ? (active.record || ensureRecord(block, LessonEngine.getInteractionState(active.index))) : null;
    if (active.svg && active.svg.releasePointerCapture) {
      try { active.svg.releasePointerCapture(event.pointerId); } catch (error) { /* already released */ }
    }
    var node = document.getElementById('geometry-vertex-' + active.index + '-' + active.id);
    if (node && node.classList) node.classList.remove('is-dragging');
    dragState = null;
    if (block && record && active.changed) {
      markExploration(record, active.id);
      save(active.index, record);
      updateInteractionUi(block, record, active.index, false);
    }
  }

  function moveVertexByKeyboard(event, index, id) {
    var directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (!directions[event.key]) return;
    var block = currentBlock(index);
    if (!block || block.mode !== 'explore') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    if (record.completed) return;
    event.preventDefault();
    var step = Number(block.keyboardStep) || 0.2;
    if (event.shiftKey) step *= 2;
    var current = record.vertices[id];
    var point = { x: clamp(current.x + directions[event.key][0] * step, block.viewport.xMin, block.viewport.xMax), y: clamp(current.y + directions[event.key][1] * step, block.viewport.yMin, block.viewport.yMax) };
    if (!applyVertex(block, record, id, point)) return;
    dismissDragHint(index);
    markExploration(record, id);
    save(index, record);
    updateGeometry(block, record, index);
    updateInteractionUi(block, record, index, false);
  }

  function selectFollowUp(input, index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'geometry-workspace') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    Array.prototype.forEach.call(document.querySelectorAll('input[name="' + input.name + '"]'), function(radio) {
      var selected = radio === input;
      radio.checked = selected;
      radio.setAttribute('aria-checked', selected ? 'true' : 'false');
      var label = radio.closest && radio.closest('label');
      if (label) { label.classList.toggle('is-selected', selected); label.classList.remove('is-correct', 'is-incorrect'); }
    });
    record.followUpSelected = Number(input.value);
    record.lastStatus = '';
    record.lastFeedback = '';
    save(index, record);
    var button = document.getElementById('geometry-check-' + index);
    if (button) button.disabled = !requiredExplorationMet(block, record);
  }

  function keySelectFollowUp(event, input, index) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectFollowUp(input, index);
  }

  function finish(block, record) {
    if (record.completed) return record;
    record.completed = true;
    record.completedAt = Date.now();
    var evidence = clone(record);
    record.pendingResult = block.followUp ? {
      correct: true,
      correctAnswers: 1,
      totalQuestions: 1,
      attempts: record.attemptCount,
      points: Number(block.points) || 10,
      firstTry: record.attemptCount <= 1 && record.hintCount === 0,
      independent: record.attemptCount <= 1 && record.hintCount === 0,
      repairedAfterFeedback: record.attemptCount > 1,
      hintsUsed: record.hintCount,
      role: block.role || '',
      misconceptionCodes: record.misconceptionCodes.slice(),
      evidence: evidence,
    } : {
      points: 0,
      role: block.role || '',
      evidence: evidence,
    };
    return record;
  }

  function checkFollowUp(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'geometry-workspace' || !block.followUp) return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    if (!requiredExplorationMet(block, record)) return;
    if (record.followUpSelected === null) {
      record.lastStatus = 'empty';
      record.lastFeedback = copy('Сначала выберите вывод.', 'Алдымен қорытындыны таңдаңыз.');
      save(index, record); updateInteractionUi(block, record, index, true); return;
    }
    record.attemptCount += 1;
    var correct = Number(record.followUpSelected) === Number(block.followUp.answer);
    var option = block.followUp.options[record.followUpSelected] || {};
    record.attempts.push({ type: 'geometry-follow-up', answer: record.followUpSelected, correct: correct, misconception: option.code || '', at: Date.now() });
    if (correct) {
      record.lastStatus = 'correct';
      record.lastFeedback = block.followUp.successFeedback || block.successFeedback || copy('Вывод подтверждён.', 'Қорытынды расталды.');
      finish(block, record);
    } else {
      record.lastStatus = 'incorrect';
      record.lastFeedback = option.feedback || block.feedback || copy('Сравните вывод со всеми исследованными формами.', 'Қорытындыны зерттелген барлық пішіндермен салыстырыңыз.');
      addUnique(record.misconceptionCodes, option.code);
    }
    save(index, record);
    updateInteractionUi(block, record, index, true);
  }

  function showHint(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'geometry-workspace') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    record.hintCount = Math.min((block.hints || []).length, record.hintCount + 1);
    save(index, record);
    replaceHtml('geometry-hints-slot-' + index, hintsHtml(block, record, index));
  }

  function advanceProof(index) {
    var block = currentBlock(index);
    if (!block || block.mode !== 'proof') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    record.proofStep = Math.min((block.proofSteps || []).length - 1, record.proofStep + 1);
    save(index, record);
    updateGeometry(block, record, index);
    replaceHtml('geometry-proof-slot-' + index, proofHtml(block, record, index));
  }

  function finishProof(index) {
    var block = currentBlock(index);
    if (!block || block.mode !== 'proof') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    if (record.proofStep < (block.proofSteps || []).length - 1) return;
    record.lastStatus = 'correct';
    record.lastFeedback = block.successFeedback || copy('Объяснение связывает углы треугольника с развёрнутым углом.', 'Түсіндіру үшбұрыш бұрыштарын жазыңқы бұрышпен байланыстырады.');
    finish(block, record);
    save(index, record);
    updateInteractionUi(block, record, index, false);
    replaceHtml('geometry-proof-slot-' + index, proofHtml(block, record, index));
  }

  function complete(index) {
    var record = LessonEngine.getInteractionState(index);
    if (record && record.completed && record.pendingResult) LessonEngine.next(record.pendingResult);
  }

  function initialize(index, block) {
    var svg = document.getElementById('geometry-svg-' + index);
    if (!svg || svg.dataset.geometryReady === 'true') return;
    svg.dataset.geometryReady = 'true';
    if (block.mode !== 'explore') return;
    var vertices = svg.querySelectorAll ? svg.querySelectorAll('.geometry-vertex.is-draggable') : [];
    Array.prototype.forEach.call(vertices, function(node) {
      var id = node.getAttribute('data-vertex-id');
      node.addEventListener('pointerdown', function(event) { pointerDown(event, index, id); });
      node.addEventListener('keydown', function(event) { moveVertexByKeyboard(event, index, id); });
    });
    svg.addEventListener('pointermove', pointerMove);
    svg.addEventListener('pointerup', endPointer);
    svg.addEventListener('pointercancel', endPointer);
  }

  LessonBlocks.register('geometry-workspace', render);
  if (LessonEngine && LessonEngine.on) LessonEngine.on('afterRender', function(data) {
    if (data.block && data.block.type === 'geometry-workspace') initialize(data.blockIndex, data.block);
  });

  return {
    render: render,
    initialize: initialize,
    createTransform: createTransform,
    triangleArea: triangleArea,
    angleAt: angleAt,
    triangleAngles: triangleAngles,
    angleSum: angleSum,
    isValidTriangle: isValidTriangle,
    triangleCategories: triangleCategories,
    moveVertexByKeyboard: moveVertexByKeyboard,
    selectFollowUp: selectFollowUp,
    keySelectFollowUp: keySelectFollowUp,
    checkFollowUp: checkFollowUp,
    showHint: showHint,
    advanceProof: advanceProof,
    finishProof: finishProof,
    complete: complete,
    _pointerDown: pointerDown,
    _pointerMove: pointerMove,
    _pointerEnd: endPointer,
  };
})();
