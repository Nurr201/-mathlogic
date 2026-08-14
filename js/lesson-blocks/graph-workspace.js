/* Reusable SVG workspace for small, author-configured coordinate lessons. */
window.GraphWorkspaceBlock = (function() {
  'use strict';

  var H = window.__BlockHelpers;
  var WIDTH = 640;
  var HEIGHT = 420;
  var PADDING = { left: 52, right: 24, top: 24, bottom: 44 };
  var draftTimers = {};
  var lifecycleBound = false;

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function copy(ru, kk) {
    return typeof ML !== 'undefined' && ML.getLang && ML.getLang() === 'kk' ? kk : ru;
  }

  function mathLabel(key, ru, kk) {
    if (typeof I18N !== 'undefined' && I18N.t) return I18N.t('lesson.math.' + key) || copy(ru, kk);
    return copy(ru, kk);
  }

  function currentBlock(index) {
    var state = window.__EngineInternal && window.__EngineInternal.state;
    return state && state.blocks ? state.blocks[index] : null;
  }

  function finite(value) { return typeof value === 'number' && isFinite(value); }
  function clean(value) { return Math.abs(value) < 1e-9 ? 0 : Math.round(value * 1000) / 1000; }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function pointIsSelected(record, index) {
    return record.selectedPoint !== null && record.selectedPoint !== undefined && Number(record.selectedPoint) === index;
  }
  function formatNumber(value) {
    value = clean(Number(value));
    return String(value).replace('-', '−');
  }

  function createTransform(viewport, width, height, padding) {
    padding = padding || PADDING;
    var innerWidth = width - padding.left - padding.right;
    var innerHeight = height - padding.top - padding.bottom;
    return {
      mathToScreen: function(x, y) {
        return {
          x: padding.left + (x - viewport.xMin) / (viewport.xMax - viewport.xMin) * innerWidth,
          y: padding.top + (viewport.yMax - y) / (viewport.yMax - viewport.yMin) * innerHeight,
        };
      },
      screenToMath: function(px, py) {
        return {
          x: viewport.xMin + (px - padding.left) / innerWidth * (viewport.xMax - viewport.xMin),
          y: viewport.yMax - (py - padding.top) / innerHeight * (viewport.yMax - viewport.yMin),
        };
      },
      plot: { x: padding.left, y: padding.top, width: innerWidth, height: innerHeight },
    };
  }

  function isPointWithinTolerance(point, target, tolerance) {
    if (!point || !target) return false;
    var dx = Number(point.x) - Number(target.x);
    var dy = Number(point.y) - Number(target.y);
    return Math.sqrt(dx * dx + dy * dy) <= Number(tolerance || 0.45);
  }

  function lineSegment(viewport, k, b) {
    var candidates = [];
    function add(x, y) {
      if (x < viewport.xMin - 1e-8 || x > viewport.xMax + 1e-8 || y < viewport.yMin - 1e-8 || y > viewport.yMax + 1e-8) return;
      if (!candidates.some(function(point) { return Math.abs(point.x - x) < 1e-7 && Math.abs(point.y - y) < 1e-7; })) candidates.push({ x: clean(x), y: clean(y) });
    }
    add(viewport.xMin, k * viewport.xMin + b);
    add(viewport.xMax, k * viewport.xMax + b);
    if (Math.abs(k) > 1e-9) {
      add((viewport.yMin - b) / k, viewport.yMin);
      add((viewport.yMax - b) / k, viewport.yMax);
    }
    return candidates.length >= 2 ? [candidates[0], candidates[1]] : [];
  }

  function functionValue(fn, x) {
    if (fn.type === 'quadratic') return Number(fn.a) * x * x;
    if (fn.type === 'cubic') return Number(fn.a) * x * x * x;
    if (fn.type === 'reciprocal') return Math.abs(x) < 1e-9 ? null : Number(fn.k) / x;
    return Number(fn.k) * x + Number(fn.b);
  }

  function formulaText(fn) {
    if (fn.type === 'quadratic') return 'y = ' + (clean(fn.a) === 1 ? '' : clean(fn.a) === -1 ? '−' : formatNumber(fn.a)) + 'x²';
    if (fn.type === 'cubic') return 'y = ' + (clean(fn.a) === 1 ? '' : clean(fn.a) === -1 ? '−' : formatNumber(fn.a)) + 'x³';
    if (fn.type === 'reciprocal') return 'y = ' + (clean(fn.k) === 1 ? '1' : clean(fn.k) === -1 ? '−1' : formatNumber(fn.k)) + '/x';
    var k = clean(fn.k);
    var b = clean(fn.b);
    var xTerm = k === 0 ? '' : k === 1 ? 'x' : k === -1 ? '−x' : formatNumber(k) + 'x';
    var bTerm = b === 0 ? '' : (b > 0 && xTerm ? ' + ' : b < 0 && xTerm ? ' − ' : b < 0 ? '−' : '') + formatNumber(Math.abs(b));
    return 'y = ' + (xTerm || (bTerm ? '' : '0')) + bTerm;
  }

  function formulaLatex(fn) {
    if (fn.type === 'quadratic') return 'y=' + (clean(fn.a) === 1 ? '' : clean(fn.a) === -1 ? '-' : clean(fn.a)) + 'x^2';
    if (fn.type === 'cubic') return 'y=' + (clean(fn.a) === 1 ? '' : clean(fn.a) === -1 ? '-' : clean(fn.a)) + 'x^3';
    if (fn.type === 'reciprocal') return 'y=\\frac{' + (clean(fn.k) === 1 ? '1' : clean(fn.k)) + '}{x}';
    return '';
  }

  function emptyTableRow() {
    return { draftLatex: '', lastAnswer: '', lastStatus: '', lastFeedback: '', attempts: 0, hints: 0, completed: false };
  }

  function emptyRecord(block) {
    var initial = block.parameter && finite(block.parameter.initial) ? block.parameter.initial : null;
    return {
      blockId: block.id,
      mode: block.mode,
      placedPoint: null,
      attempts: [],
      attemptCount: 0,
      hintCount: 0,
      misconceptionCodes: [],
      currentRow: 0,
      table: (block.rows || []).map(emptyTableRow),
      selectedPoint: null,
      parameterValue: initial,
      visitedParameters: initial === null ? [] : [initial],
      followUpSelected: null,
      followUpComplete: false,
      lastStatus: '',
      lastFeedback: '',
      completed: false,
    };
  }

  function ensureRecord(block, record) {
    record = record || emptyRecord(block);
    record.attempts = Array.isArray(record.attempts) ? record.attempts : [];
    record.misconceptionCodes = Array.isArray(record.misconceptionCodes) ? record.misconceptionCodes : [];
    record.visitedParameters = Array.isArray(record.visitedParameters) ? record.visitedParameters : [];
    record.table = Array.isArray(record.table) ? record.table : [];
    while (record.table.length < (block.rows || []).length) record.table.push(emptyTableRow());
    return record;
  }

  function recordFor(block, ctx) {
    return ensureRecord(block, ctx.interactionState || (ctx.savedResult && ctx.savedResult.evidence));
  }

  function save(index, record) {
    LessonEngine.setInteractionState(index, record);
    return record;
  }

  function activeFunction(block, record, previewValue) {
    var source = block.function || {};
    var fn = { type: source.type || 'linear', k: Number(source.k || 0), b: Number(source.b || 0), a: Number(source.a === undefined ? 1 : source.a), label: source.label || '', formulaMath: source.formulaMath || '', color: source.color || '' };
    if (block.mode === 'parameter' && block.parameter) {
      var value = finite(previewValue) ? previewValue : Number(record.parameterValue);
      fn[block.parameter.name] = value;
    }
    return fn;
  }

  function functionsFor(block, record) {
    if (Array.isArray(block.functions) && block.functions.length) return block.functions.map(function(fn) { return { type: fn.type || 'linear', k: Number(fn.k || 0), b: Number(fn.b || 0), a: Number(fn.a === undefined ? 1 : fn.a), label: fn.label || '', formulaMath: fn.formulaMath || '', color: fn.color || '' }; });
    return block.function ? [activeFunction(block, record)] : [];
  }

  function pointsFor(block, record, fn) {
    var points = (block.plotPoints || []).map(function(point) { return { x: point.x, y: point.y, label: point.label || '', kind: 'given' }; });
    if (block.mode === 'parameter') {
      (block.referenceX || [-2, 0, 2]).forEach(function(x, index) {
        var y = functionValue(fn, x);
        if (y !== null && finite(y)) points.push({ x: x, y: clean(y), kind: 'reference', rowIndex: index });
      });
    }
    return points;
  }

  function dynamicPointsFor(block, record) {
    var points = [];
    if (block.mode === 'value-table') {
      (block.rows || []).forEach(function(row, index) {
        if (record.table[index] && record.table[index].completed) points.push({ x: row.x, y: row.y, label: row.label || '', kind: 'table', rowIndex: index });
      });
    }
    if (block.mode === 'place-point' && record.placedPoint) {
      points.push({ x: record.placedPoint.x, y: record.placedPoint.y, kind: record.lastStatus === 'correct' ? 'correct' : 'candidate' });
    }
    return points;
  }

  function gridHtml(viewport, transform) {
    var step = Number(viewport.gridStep) || 1;
    var labelStep = Number(viewport.labelStep) || Math.max(1, step);
    var html = '';
    var value;
    for (value = Math.ceil(viewport.xMin / step) * step; value <= viewport.xMax + 1e-9; value += step) {
      value = clean(value);
      var xp = transform.mathToScreen(value, 0).x;
      html += '<line class="graph-grid-line" x1="' + xp + '" y1="' + transform.plot.y + '" x2="' + xp + '" y2="' + (transform.plot.y + transform.plot.height) + '"></line>';
      if (value !== 0 && Math.abs(value / labelStep - Math.round(value / labelStep)) < 1e-7) {
        var labelY = clamp(transform.mathToScreen(0, 0).y + 20, transform.plot.y + 14, transform.plot.y + transform.plot.height - 4);
        html += '<text class="graph-tick-label" x="' + xp + '" y="' + labelY + '" text-anchor="middle">' + formatNumber(value) + '</text>';
      }
    }
    for (value = Math.ceil(viewport.yMin / step) * step; value <= viewport.yMax + 1e-9; value += step) {
      value = clean(value);
      var yp = transform.mathToScreen(0, value).y;
      html += '<line class="graph-grid-line" x1="' + transform.plot.x + '" y1="' + yp + '" x2="' + (transform.plot.x + transform.plot.width) + '" y2="' + yp + '"></line>';
      if (value !== 0 && Math.abs(value / labelStep - Math.round(value / labelStep)) < 1e-7) {
        var labelX = clamp(transform.mathToScreen(0, 0).x - 10, transform.plot.x + 10, transform.plot.x + transform.plot.width - 8);
        html += '<text class="graph-tick-label" x="' + labelX + '" y="' + (yp + 4) + '" text-anchor="end">' + formatNumber(value) + '</text>';
      }
    }
    return html;
  }

  function axesHtml(viewport, transform) {
    var xAxisY = clamp(transform.mathToScreen(0, 0).y, transform.plot.y, transform.plot.y + transform.plot.height);
    var yAxisX = clamp(transform.mathToScreen(0, 0).x, transform.plot.x, transform.plot.x + transform.plot.width);
    return '<line class="graph-axis" x1="' + transform.plot.x + '" y1="' + xAxisY + '" x2="' + (transform.plot.x + transform.plot.width) + '" y2="' + xAxisY + '" marker-end="url(#graph-arrow)"></line>' +
      '<line class="graph-axis" x1="' + yAxisX + '" y1="' + (transform.plot.y + transform.plot.height) + '" x2="' + yAxisX + '" y2="' + transform.plot.y + '" marker-end="url(#graph-arrow)"></line>' +
      '<text class="graph-axis-label" x="' + (transform.plot.x + transform.plot.width - 4) + '" y="' + (xAxisY - 10) + '">x</text>' +
      '<text class="graph-axis-label" x="' + (yAxisX + 11) + '" y="' + (transform.plot.y + 14) + '">y</text>' +
      (viewport.xMin <= 0 && viewport.xMax >= 0 && viewport.yMin <= 0 && viewport.yMax >= 0
        ? '<text class="graph-origin-label" x="' + (yAxisX - 10) + '" y="' + (xAxisY + 18) + '" text-anchor="end">0</text>' : '');
  }

  function pointHtml(point, transform, index, blockIndex, selected) {
    var screen = transform.mathToScreen(point.x, point.y);
    var state = point.kind === 'candidate' ? ' is-candidate' : point.kind === 'correct' ? ' is-correct' : '';
    if (selected) state += ' is-selected';
    var pointName = point.label ? ' ' + point.label : '';
    var label = copy('Точка', 'Нүкте') + pointName + ' (' + formatNumber(point.x) + ', ' + formatNumber(point.y) + ')';
    return '<g class="graph-point' + state + '" tabindex="0" role="button" aria-label="' + escapeHtml(label) + '" data-point-index="' + index + '" onclick="event.stopPropagation();GraphWorkspaceBlock.selectPoint(' + blockIndex + ',' + index + ')" onkeydown="GraphWorkspaceBlock.keySelectPoint(event,' + blockIndex + ',' + index + ')">' +
      '<circle class="graph-point-hit" cx="' + screen.x + '" cy="' + screen.y + '" r="16"></circle>' +
      '<circle class="graph-point-dot" cx="' + screen.x + '" cy="' + screen.y + '" r="6" data-reference-x="' + escapeHtml(point.x) + '"></circle>' +
      (point.label ? '<text class="graph-point-label" x="' + (screen.x + 11) + '" y="' + (screen.y - 11) + '">' + escapeHtml(point.label) + '</text>' : '') +
      '</g>';
  }

  function functionLineHtml(block, fn, index, lineIndex) {
    var palette = ['#4f46e5', '#0f766e', '#b45309', '#be123c'];
    var color = fn.color || palette[lineIndex || 0];
    if (fn.type !== 'linear') {
      var curveTransform = createTransform(block.viewport, WIDTH, HEIGHT, PADDING);
      var path = '';
      var drawing = false;
      for (var sample = 0; sample <= 220; sample += 1) {
        var x = block.viewport.xMin + (block.viewport.xMax - block.viewport.xMin) * sample / 220;
        var y = functionValue(fn, x);
        var visible = y !== null && finite(y) && y >= block.viewport.yMin - .25 && y <= block.viewport.yMax + .25;
        if (!visible) { drawing = false; continue; }
        var point = curveTransform.mathToScreen(x, y);
        path += (drawing ? ' L ' : 'M ') + point.x.toFixed(2) + ' ' + point.y.toFixed(2);
        drawing = true;
      }
      return path ? '<path id="graph-function-line-' + index + '-' + (lineIndex || 0) + '" class="graph-function-line graph-function-line-' + (lineIndex || 0) + '" style="stroke:' + escapeHtml(color) + '" d="' + path + '"></path>' : '';
    }
    var segment = (block.function || block.functions) ? lineSegment(block.viewport, fn.k, fn.b) : [];
    if (segment.length !== 2) return '';
    var transform = createTransform(block.viewport, WIDTH, HEIGHT, PADDING);
    var start = transform.mathToScreen(segment[0].x, segment[0].y);
    var end = transform.mathToScreen(segment[1].x, segment[1].y);
    return '<line id="graph-function-line-' + index + '-' + (lineIndex || 0) + '" class="graph-function-line graph-function-line-' + (lineIndex || 0) + '" style="stroke:' + escapeHtml(color) + '" x1="' + start.x + '" y1="' + start.y + '" x2="' + end.x + '" y2="' + end.y + '"></line>';
  }

  function formulasHtml(block, record, index) {
    var fns = functionsFor(block, record);
    if (!fns.length) return '';
    return '<div id="graph-formula-' + index + '" class="graph-formula graph-formula-list" aria-live="polite">' + fns.map(function(fn, lineIndex) {
      var palette = ['#4f46e5', '#0f766e', '#b45309', '#be123c'];
      var label = fn.label || formulaText(fn);
      var latex = block.mode === 'parameter' ? formulaLatex(fn) : (fn.formulaMath || formulaLatex(fn));
      return '<span><i style="background:' + escapeHtml(fn.color || palette[lineIndex]) + '"></i>' + (latex && H.mathMarkup ? H.mathMarkup(latex, label, false) : escapeHtml(label)) + '</span>';
    }).join('') + '</div>';
  }

  function svgHtml(block, record, index) {
    var viewport = block.viewport;
    var transform = createTransform(viewport, WIDTH, HEIGHT, PADDING);
    var fn = activeFunction(block, record);
    var allFunctions = functionsFor(block, record);
    var points = pointsFor(block, record, fn);
    var dynamicPoints = dynamicPointsFor(block, record);
    var lineVisible = block.showLine || (block.revealLine && (record.currentRow >= (block.rows || []).length || record.completed));
    var line = lineVisible ? allFunctions.map(function(item, lineIndex) { return functionLineHtml(block, item, index, lineIndex); }).join('') : '';
    var pointMarkup = points.map(function(point, pointIndex) { return pointHtml(point, transform, pointIndex, index, pointIsSelected(record, pointIndex)); }).join('');
    var dynamicPointMarkup = dynamicPoints.map(function(point, pointIndex) { return pointHtml(point, transform, pointIndex, index, pointIsSelected(record, pointIndex)); }).join('');
    var clickable = block.mode === 'place-point' && !record.completed ? ' onclick="GraphWorkspaceBlock.placeFromPointer(event,' + index + ')"' : '';
    var description = copy('Координатная плоскость.', 'Координаталық жазықтық.') + ' ' +
      (allFunctions.length ? allFunctions.map(formulaText).join('; ') + '. ' : '') +
      ((points.length || dynamicPoints.length) ? copy('Отмечены точки: ', 'Белгіленген нүктелер: ') + points.concat(dynamicPoints).map(function(point) { return '(' + formatNumber(point.x) + ', ' + formatNumber(point.y) + ')'; }).join(', ') + '.' : copy('Точек пока нет.', 'Әзірше нүктелер жоқ.'));
    return '<div class="graph-canvas-shell"><svg id="graph-svg-' + index + '" class="graph-svg" viewBox="0 0 ' + WIDTH + ' ' + HEIGHT + '" role="img" aria-labelledby="graph-title-' + index + ' graph-description-' + index + '"' + clickable + '>' +
      '<title id="graph-title-' + index + '">' + escapeHtml(block.title) + '</title><desc id="graph-description-' + index + '">' + escapeHtml(description) + '</desc>' +
      '<defs><marker id="graph-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>' +
      '<rect class="graph-plot-bg" x="' + transform.plot.x + '" y="' + transform.plot.y + '" width="' + transform.plot.width + '" height="' + transform.plot.height + '"></rect>' +
      gridHtml(viewport, transform) + axesHtml(viewport, transform) + '<g id="graph-line-layer-' + index + '">' + line + '</g>' + pointMarkup + '<g id="graph-dynamic-points-' + index + '">' + dynamicPointMarkup + '</g></svg>' +
      '<p class="graph-text-state sr-only" aria-live="polite">' + escapeHtml(description) + '</p></div>';
  }

  function feedbackHtml(record, index) {
    if (!record.lastStatus || !record.lastFeedback) return '<div id="graph-feedback-' + index + '" class="math-response-feedback-slot" aria-live="polite"></div>';
    var title = record.lastStatus === 'correct' ? copy('Связь найдена', 'Байланыс табылды') : copy('Проверьте связь', 'Байланысты тексеріңіз');
    return '<div id="graph-feedback-' + index + '" class="math-response-feedback is-' + record.lastStatus + '" role="' + (record.lastStatus === 'incorrect' ? 'alert' : 'status') + '" aria-live="polite" tabindex="-1"><strong>' + title + '</strong><p>' + record.lastFeedback + '</p></div>';
  }

  function hintsHtml(block, record, index) {
    if (record.completed || !(block.hints || []).length) return '';
    var shown = block.hints.slice(0, record.hintCount).map(function(hint, hintIndex) {
      return '<li><span>H' + (hintIndex + 1) + '</span><p>' + hint + '</p></li>';
    }).join('');
    var button = record.hintCount < block.hints.length ? '<button type="button" class="guided-hint-button" onclick="GraphWorkspaceBlock.showHint(' + index + ')">' +
      (record.hintCount ? copy('Следующая подсказка', 'Келесі нұсқау') : copy('Показать подсказку', 'Нұсқауды көрсету')) + '</button>' : '';
    return '<div class="guided-hints">' + (shown ? '<ol>' + shown + '</ol>' : '') + button + '</div>';
  }

  function placementControls(block, record, index) {
    if (block.mode !== 'place-point' || record.completed) return '';
    var x = record.placedPoint ? record.placedPoint.x : '';
    var y = record.placedPoint ? record.placedPoint.y : '';
    return '<div class="graph-coordinate-entry"><p>' + (block.task || copy('Нажмите на плоскость или введите координаты.', 'Жазықтықты басыңыз немесе координаталарды енгізіңіз.')) + '</p>' +
      '<div><label for="graph-x-' + index + '">x</label><input id="graph-x-' + index + '" type="number" inputmode="decimal" step="' + (block.viewport.gridStep || 1) + '" value="' + escapeHtml(x) + '">' +
      '<label for="graph-y-' + index + '">y</label><input id="graph-y-' + index + '" type="number" inputmode="decimal" step="' + (block.viewport.gridStep || 1) + '" value="' + escapeHtml(y) + '">' +
      '<button type="button" class="guided-submit-button" onclick="GraphWorkspaceBlock.placeFromInputs(' + index + ')">' + copy('Поставить точку', 'Нүктені белгілеу') + '</button>' +
      '<button id="graph-check-point-' + index + '" type="button" class="guided-submit-button"' + (record.placedPoint ? '' : ' disabled') + ' onclick="GraphWorkspaceBlock.' + (record.lastStatus === 'incorrect' ? 'editPoint' : 'checkPoint') + '(' + index + ')">' +
      (record.lastStatus === 'incorrect' ? mathLabel('checkAgain', 'Исправить ответ', 'Жауапты түзету') : mathLabel('check', 'Проверить', 'Тексеру')) + '</button></div></div>';
  }

  function tableHtml(block, record, index) {
    if (block.mode !== 'value-table') return '';
    var rows = (block.rows || []).map(function(row, rowIndex) {
      var rowRecord = record.table[rowIndex];
      var active = rowIndex === record.currentRow && !record.completed;
      var value = rowRecord.completed ? formatNumber(row.y) : (rowRecord.draftLatex || '');
      return '<tr class="' + (active ? 'is-current ' : '') + (pointIsSelected(record, rowIndex) ? 'is-linked' : '') + '"><th scope="row">' + formatNumber(row.x) + '</th><td>' +
        (rowRecord.completed ? '<button type="button" class="graph-table-value" onclick="GraphWorkspaceBlock.selectPoint(' + index + ',' + rowIndex + ')" aria-label="' + escapeHtml(copy('Показать точку ', 'Нүктені көрсету ') + '(' + row.x + ', ' + row.y + ')') + '">' + formatNumber(row.y) + '</button>' :
          active ? '<math-field id="graph-table-field-' + index + '-' + rowIndex + '" class="graph-table-field" math-virtual-keyboard-policy="auto" aria-label="' + escapeHtml(copy('Значение y при x равно ', 'x мәні берілгендегі y мәні ') + row.x) + '">' + escapeHtml(value) + '</math-field>' : '<span aria-hidden="true">—</span>') + '</td></tr>';
    }).join('');
    var action = record.currentRow < block.rows.length && !record.completed ? '<button type="button" class="guided-submit-button" onclick="GraphWorkspaceBlock.submitTableValue(' + index + ',' + record.currentRow + ')">' + copy('Проверить значение', 'Мәнді тексеру') + '</button>' : '';
    return '<div id="graph-value-table-wrap-' + index + '" class="graph-value-table-wrap"><table class="graph-value-table"><caption>' + copy('Таблица значений', 'Мәндер кестесі') + '</caption><thead><tr><th scope="col">x</th><th scope="col">y</th></tr></thead><tbody>' + rows + '</tbody></table>' + action + '</div>';
  }

  function explorationReady(block, record) {
    var required = block.requiredValues || [];
    return required.every(function(value) { return record.visitedParameters.some(function(visited) { return Math.abs(visited - value) < 1e-9; }); });
  }

  function parameterHtml(block, record, index) {
    if (block.mode !== 'parameter') return '';
    var parameter = block.parameter;
    var value = Number(record.parameterValue);
    var required = block.requiredValues || [];
    var slider = Array.isArray(parameter.values) && parameter.values.length
      ? '<span class="graph-parameter-discrete" aria-label="' + escapeHtml(copy('Доступны только заданные значения', 'Тек берілген мәндер қолжетімді')) + '">' + parameter.values.map(formatNumber).join(' · ') + '</span>'
      : '<input id="graph-parameter-' + index + '" type="range" min="' + parameter.min + '" max="' + parameter.max + '" step="' + parameter.step + '" value="' + value + '" aria-label="' + escapeHtml(parameter.label || copy('Коэффициент', 'Коэффициент')) + '" oninput="GraphWorkspaceBlock.previewParameter(this,' + index + ')" onchange="GraphWorkspaceBlock.commitParameter(this,' + index + ')">';
    var checklist = required.map(function(requiredValue) {
      var visited = record.visitedParameters.some(function(item) { return Math.abs(item - requiredValue) < 1e-9; });
      return '<li class="' + (visited ? 'is-visited' : '') + '"><span aria-hidden="true">' + (visited ? '✓' : '○') + '</span>' + parameter.name + ' = ' + formatNumber(requiredValue) + '</li>';
    }).join('');
    return '<div class="graph-parameter-panel"><p>' + (block.task || '') + '</p><div class="graph-parameter-value"><span>' + parameter.name + ' =</span><output id="graph-parameter-output-' + index + '">' + formatNumber(value) + '</output></div>' +
      '<div class="graph-parameter-controls"><button type="button" onclick="GraphWorkspaceBlock.stepParameter(' + index + ',-1)" aria-label="' + escapeHtml(copy('Уменьшить ', 'Кеміту ') + parameter.name) + '">−</button>' +
      slider +
      '<button type="button" onclick="GraphWorkspaceBlock.stepParameter(' + index + ',1)" aria-label="' + escapeHtml(copy('Увеличить ', 'Арттыру ') + parameter.name) + '">+</button></div>' +
      (checklist ? '<ul class="graph-parameter-checklist" aria-label="' + escapeHtml(copy('Значения для исследования', 'Зерттелетін мәндер')) + '">' + checklist + '</ul>' : '') + '</div>';
  }

  function followUpHtml(block, record, index) {
    var followUp = block.followUp;
    if (!followUp || record.completed) return '';
    var ready = block.mode !== 'parameter' || explorationReady(block, record);
    if (!ready) return '<p class="graph-follow-up-gate">' + (followUp.gateText || copy('Сначала исследуйте отмеченные значения параметра.', 'Алдымен параметрдің белгіленген мәндерін зерттеңіз.')) + '</p>';
    var name = 'graph-follow-up-' + index;
    var options = followUp.options.map(function(option, optionIndex) {
      var selected = record.followUpSelected !== null && record.followUpSelected !== undefined && Number(record.followUpSelected) === optionIndex;
      var resultClass = selected && record.lastStatus === 'incorrect' ? ' is-incorrect' : '';
      return '<label class="lesson-option graph-choice' + (selected ? ' is-selected' : '') + resultClass + '"><input type="radio" name="' + name + '" value="' + optionIndex + '" ' + (selected ? 'checked aria-checked="true"' : 'aria-checked="false"') + ' onchange="GraphWorkspaceBlock.selectFollowUp(this,' + index + ')" onkeydown="GraphWorkspaceBlock.keySelectFollowUp(event,this,' + index + ')"><span class="lesson-option-dot" aria-hidden="true"></span><span>' + option.text + '</span></label>';
    }).join('');
    return '<fieldset class="graph-follow-up"><legend>' + followUp.question + '</legend><div>' + options + '</div><button type="button" class="guided-submit-button" onclick="GraphWorkspaceBlock.checkFollowUp(' + index + ')">' + copy('Проверить вывод', 'Қорытындыны тексеру') + '</button></fieldset>';
  }

  function render(block, ctx) {
    var record = recordFor(block, ctx);
    var fn = activeFunction(block, record);
    var formula = formulasHtml(block, record, ctx.index);
    var content = '<div class="graph-representations">' +
      (block.mode === 'value-table' ? tableHtml(block, record, ctx.index) : '') +
      '<div class="graph-visual-column">' + formula + svgHtml(block, record, ctx.index) + '</div></div>' +
      placementControls(block, record, ctx.index) + parameterHtml(block, record, ctx.index) + '<div id="graph-follow-up-slot-' + ctx.index + '">' + followUpHtml(block, record, ctx.index) + '</div>' +
      '<div id="graph-hints-slot-' + ctx.index + '">' + hintsHtml(block, record, ctx.index) + '</div><div id="graph-feedback-slot-' + ctx.index + '">' + feedbackHtml(record, ctx.index) + '</div>';
    var action = record.completed ? '<button type="button" class="lesson-continue-button" onclick="GraphWorkspaceBlock.complete(' + ctx.index + ')">' + copy('Продолжить', 'Жалғастыру') + '</button>' : '';
    return H.wrap('<div class="graph-workspace-block">' + H.progress(ctx.index, ctx.total) + H.blockBadge(block.badgeLabel || copy('Графическая работа', 'Графикпен жұмыс')) +
      '<h2>' + block.title + '</h2>' + (block.intro ? '<p class="graph-workspace-intro">' + block.intro + '</p>' : '') + content + '<div id="graph-actions-' + ctx.index + '" class="guided-actions">' + action + '</div></div>', { className: 'graph-workspace-wrap' });
  }

  function focusFeedback(index) {
    setTimeout(function() {
      var node = document.getElementById('graph-feedback-' + index);
      if (node && typeof node.focus === 'function') node.focus();
    }, 0);
  }

  function replaceHtml(id, html) {
    var node = document.getElementById(id);
    if (node) node.innerHTML = html;
  }

  function updateFeedback(block, record, index, focus) {
    replaceHtml('graph-feedback-slot-' + index, feedbackHtml(record, index));
    if (focus) focusFeedback(index);
  }

  function updateHints(block, record, index) {
    replaceHtml('graph-hints-slot-' + index, hintsHtml(block, record, index));
  }

  function updateFollowUp(block, record, index) {
    replaceHtml('graph-follow-up-slot-' + index, followUpHtml(block, record, index));
  }

  function updateActions(record, index) {
    replaceHtml('graph-actions-' + index, record.completed
      ? '<button type="button" class="lesson-continue-button" onclick="GraphWorkspaceBlock.complete(' + index + ')">' + copy('Продолжить', 'Жалғастыру') + '</button>'
      : '');
  }

  function updateDynamicPoints(block, record, index) {
    var layer = document.getElementById('graph-dynamic-points-' + index);
    if (!layer) return;
    var transform = createTransform(block.viewport, WIDTH, HEIGHT, PADDING);
    layer.innerHTML = dynamicPointsFor(block, record).map(function(point, pointIndex) {
      return pointHtml(point, transform, pointIndex, index, pointIsSelected(record, pointIndex));
    }).join('');
  }

  function updateLine(block, record, index, previewValue) {
    var layer = document.getElementById('graph-line-layer-' + index);
    if (!layer) return;
    var visible = block.showLine || (block.revealLine && (record.currentRow >= (block.rows || []).length || record.completed));
    layer.innerHTML = visible ? functionLineHtml(block, activeFunction(block, record, previewValue), index) : '';
  }

  function updateGraphDescription(block, record, index, previewValue) {
    var svg = document.getElementById('graph-svg-' + index);
    var fn = activeFunction(block, record, previewValue);
    var allFunctions = functionsFor(block, record);
    var points = pointsFor(block, record, fn).concat(dynamicPointsFor(block, record));
    var description = copy('Координатная плоскость.', 'Координаталық жазықтық.') + ' ' +
      (allFunctions.length ? allFunctions.map(formulaText).join('; ') + '. ' : '') +
      (points.length ? copy('Отмечены точки: ', 'Белгіленген нүктелер: ') + points.map(function(point) { return '(' + formatNumber(point.x) + ', ' + formatNumber(point.y) + ')'; }).join(', ') + '.' : copy('Точек пока нет.', 'Әзірше нүктелер жоқ.'));
    var descriptionNode = document.getElementById('graph-description-' + index);
    var stateNode = svg && svg.parentNode && svg.parentNode.querySelector ? svg.parentNode.querySelector('.graph-text-state') : null;
    if (descriptionNode) descriptionNode.textContent = description;
    if (stateNode) stateNode.textContent = description;
  }

  function updatePointCheck(record, index) {
    var button = document.getElementById('graph-check-point-' + index);
    if (!button) return;
    button.disabled = !record.placedPoint || record.completed;
    button.textContent = record.lastStatus === 'incorrect' ? mathLabel('checkAgain', 'Исправить ответ', 'Жауапты түзету') : mathLabel('check', 'Проверить', 'Тексеру');
    button.setAttribute('onclick', 'GraphWorkspaceBlock.' + (record.lastStatus === 'incorrect' ? 'editPoint' : 'checkPoint') + '(' + index + ')');
  }

  function updateTable(block, record, index) {
    replaceHtml('graph-value-table-wrap-' + index, tableHtml(block, record, index).replace(/^<div[^>]*>|<\/div>$/g, ''));
    initialize(index, block);
  }

  function addMisconception(record, code) {
    if (code && record.misconceptionCodes.indexOf(code) === -1) record.misconceptionCodes.push(code);
  }

  function finish(block, record) {
    if (record.completed) return record;
    record.completed = true;
    record.completedAt = Date.now();
    var evidence = JSON.parse(JSON.stringify(record));
    var expectedAttempts = block.mode === 'value-table'
      ? (block.rows || []).length + (block.followUp ? 1 : 0)
      : 1;
    var independent = record.attemptCount === expectedAttempts && record.hintCount === 0;
    record.pendingResult = {
      correct: true,
      correctAnswers: 1,
      totalQuestions: 1,
      attempts: Math.max(1, record.attemptCount),
      points: Number(block.points) || 10,
      firstTry: independent,
      independent: independent,
      repairedAfterFeedback: record.attemptCount > expectedAttempts,
      hintsUsed: record.hintCount,
      role: block.role || '',
      misconceptionCodes: record.misconceptionCodes.slice(),
      evidence: evidence,
    };
    return record;
  }

  function evaluatePoint(block, record, point) {
    var tolerance = Number(block.tolerance) || 0.45;
    record.placedPoint = { x: clean(point.x), y: clean(point.y) };
    record.attemptCount += 1;
    var correct = isPointWithinTolerance(record.placedPoint, block.target, tolerance);
    var swapped = !correct && isPointWithinTolerance(record.placedPoint, { x: block.target.y, y: block.target.x }, tolerance);
    record.attempts.push({ type: 'place-point', point: record.placedPoint, correct: correct, misconception: swapped ? 'swapped-coordinates' : '', at: Date.now() });
    if (correct) {
      record.lastStatus = 'correct';
      record.lastFeedback = block.successFeedback || copy('Точка поставлена по заданным координатам.', 'Нүкте берілген координаталар бойынша белгіленді.');
      finish(block, record);
    } else {
      record.lastStatus = 'incorrect';
      record.lastFeedback = swapped && block.misconceptions && block.misconceptions.swapped
        ? block.misconceptions.swapped
        : block.feedback || copy('Сначала проверьте положение по x, затем по y.', 'Алдымен x бойынша, содан кейін y бойынша орнын тексеріңіз.');
      if (swapped) addMisconception(record, 'swapped-coordinates');
    }
    return record;
  }

  function placePoint(index, x, y) {
    var block = currentBlock(index);
    if (!block || block.type !== 'graph-workspace' || block.mode !== 'place-point') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    if (!finite(Number(x)) || !finite(Number(y))) return;
    record.placedPoint = { x: clean(Number(x)), y: clean(Number(y)) };
    record.lastStatus = '';
    record.lastFeedback = '';
    save(index, record);
    updateDynamicPoints(block, record, index);
    updateGraphDescription(block, record, index);
    updateFeedback(block, record, index, false);
    updatePointCheck(record, index);
    var xInput = document.getElementById('graph-x-' + index);
    var yInput = document.getElementById('graph-y-' + index);
    if (xInput) xInput.value = record.placedPoint.x;
    if (yInput) yInput.value = record.placedPoint.y;
  }

  function placeFromInputs(index) {
    var xInput = document.getElementById('graph-x-' + index);
    var yInput = document.getElementById('graph-y-' + index);
    if (!xInput || !yInput || xInput.value === '' || yInput.value === '') {
      var block = currentBlock(index); var record = ensureRecord(block, LessonEngine.getInteractionState(index));
      record.lastStatus = 'empty'; record.lastFeedback = copy('Введите обе координаты.', 'Екі координатаны да енгізіңіз.');
      save(index, record); updateFeedback(block, record, index, true); return;
    }
    placePoint(index, Number(xInput.value), Number(yInput.value));
  }

  function checkPoint(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'graph-workspace' || block.mode !== 'place-point') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    if (!record.placedPoint) {
      record.lastStatus = 'empty';
      record.lastFeedback = copy('Сначала поставьте точку.', 'Алдымен нүктені белгілеңіз.');
      save(index, record); updateFeedback(block, record, index, true); return;
    }
    evaluatePoint(block, record, record.placedPoint);
    save(index, record);
    updateDynamicPoints(block, record, index);
    updateGraphDescription(block, record, index);
    updateFeedback(block, record, index, true);
    updateHints(block, record, index);
    updateActions(record, index);
    updatePointCheck(record, index);
  }

  function editPoint(index) {
    var input = document.getElementById('graph-x-' + index);
    if (input && typeof input.focus === 'function') input.focus();
  }

  function placeFromPointer(event, index) {
    var block = currentBlock(index);
    var svg = document.getElementById('graph-svg-' + index);
    if (!block || !svg || !svg.getBoundingClientRect) return;
    var rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var px = (event.clientX - rect.left) / rect.width * WIDTH;
    var py = (event.clientY - rect.top) / rect.height * HEIGHT;
    var transform = createTransform(block.viewport, WIDTH, HEIGHT, PADDING);
    var point = transform.screenToMath(px, py);
    var step = Number(block.viewport.gridStep) || 1;
    point.x = clean(Math.round(point.x / step) * step);
    point.y = clean(Math.round(point.y / step) * step);
    placePoint(index, point.x, point.y);
  }

  function tableField(index, rowIndex) { return document.getElementById('graph-table-field-' + index + '-' + rowIndex); }

  function saveTableDraft(index, rowIndex) {
    var block = currentBlock(index);
    if (!block || block.type !== 'graph-workspace' || block.mode !== 'value-table') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    var field = tableField(index, rowIndex);
    if (field && !record.table[rowIndex].completed) record.table[rowIndex].draftLatex = MathInput.fieldValue(field);
    save(index, record);
  }

  function tableMisconception(block, answer, rowIndex) {
    return (block.misconceptions || []).find(function(item) {
      return (item.rowIndex === undefined || Number(item.rowIndex) === rowIndex) && MathInput.matches(answer, item.accepted || []);
    }) || null;
  }

  function submitTableValue(index, rowIndex) {
    var block = currentBlock(index);
    if (!block || block.type !== 'graph-workspace' || block.mode !== 'value-table') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    var field = tableField(index, rowIndex);
    var answer = MathInput.fieldValue(field);
    var validation = MathInput.validate(answer, { kind: 'expression', expected: String(block.rows[rowIndex].y), accepted: block.rows[rowIndex].accepted || [], validation: 'normalized' });
    record.table[rowIndex].draftLatex = answer;
    record.table[rowIndex].lastAnswer = answer;
    if (['empty', 'incomplete', 'invalid'].indexOf(validation.status) > -1) {
      record.lastStatus = validation.status;
      record.lastFeedback = validation.status === 'empty' ? copy('Сначала вычислите y.', 'Алдымен y мәнін есептеңіз.') : copy('Завершите математическую запись.', 'Математикалық жазбаны аяқтаңыз.');
      save(index, record); updateFeedback(block, record, index, true); return;
    }
    record.attemptCount += 1;
    var correct = validation.status === 'correct';
    var misconception = correct ? null : tableMisconception(block, answer, rowIndex);
    record.attempts.push({ type: 'function-value', rowIndex: rowIndex, answer: answer, correct: correct, misconception: misconception ? misconception.code : '', at: Date.now() });
    if (!correct) {
      record.lastStatus = 'incorrect';
      record.lastFeedback = misconception ? misconception.feedback : block.feedback || copy('Подставьте x в формулу и вычислите y.', 'x мәнін формулаға қойып, y мәнін есептеңіз.');
      if (misconception) addMisconception(record, misconception.code);
      save(index, record); updateFeedback(block, record, index, true); return;
    }
    record.table[rowIndex].completed = true;
    record.table[rowIndex].lastStatus = 'correct';
    record.currentRow = rowIndex + 1;
    record.selectedPoint = rowIndex;
    record.lastStatus = 'correct';
    record.lastFeedback = block.rows[rowIndex].successFeedback || copy('Значение образует координатную пару, и точка появилась на графике.', 'Мән координаталық жұп құрады, нүкте графикте пайда болды.');
    if (record.currentRow >= block.rows.length && !block.followUp) finish(block, record);
    save(index, record);
    updateTable(block, record, index);
    updateDynamicPoints(block, record, index);
    updateLine(block, record, index);
    updateGraphDescription(block, record, index);
    updateFollowUp(block, record, index);
    updateHints(block, record, index);
    updateFeedback(block, record, index, true);
    updateActions(record, index);
  }

  function selectPoint(index, pointIndex) {
    var block = currentBlock(index);
    if (!block || block.type !== 'graph-workspace') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    record.selectedPoint = Number(pointIndex);
    save(index, record);
    var svg = document.getElementById('graph-svg-' + index);
    if (svg && svg.querySelectorAll) Array.prototype.forEach.call(svg.querySelectorAll('.graph-point'), function(pointNode, pointNodeIndex) {
      pointNode.classList.toggle('is-selected', pointNodeIndex === Number(pointIndex));
    });
    var table = document.getElementById('graph-value-table-wrap-' + index);
    if (table && table.querySelectorAll) Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function(row, rowIndex) {
      row.classList.toggle('is-linked', rowIndex === Number(pointIndex));
    });
  }

  function keySelectPoint(event, index, pointIndex) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault(); selectPoint(index, pointIndex);
  }

  function selectFollowUp(input, index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'graph-workspace') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    Array.prototype.forEach.call(document.querySelectorAll('input[name="' + input.name + '"]'), function(radio) {
      var selected = radio === input;
      radio.checked = selected;
      radio.setAttribute('aria-checked', selected ? 'true' : 'false');
      var label = radio.closest && radio.closest('label');
      if (label) {
        label.classList.toggle('is-selected', selected);
        label.classList.remove('is-correct', 'is-incorrect');
      }
    });
    record.followUpSelected = Number(input.value);
    record.lastStatus = ''; record.lastFeedback = '';
    save(index, record);
  }

  function keySelectFollowUp(event, input, index) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault(); selectFollowUp(input, index);
  }

  function markFollowUpResult(index, correct) {
    Array.prototype.forEach.call(document.querySelectorAll('input[name="graph-follow-up-' + index + '"]'), function(radio) {
      var label = radio.closest && radio.closest('label');
      if (!label) return;
      label.classList.toggle('is-correct', !!correct && radio.checked);
      label.classList.toggle('is-incorrect', !correct && radio.checked);
    });
  }

  function checkFollowUp(index) {
    var block = currentBlock(index);
    if (!block || !block.followUp) return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    if (record.followUpSelected === null || record.followUpSelected === undefined) {
      record.lastStatus = 'empty'; record.lastFeedback = copy('Сначала выберите вывод.', 'Алдымен қорытындыны таңдаңыз.');
      save(index, record); updateFeedback(block, record, index, true); return;
    }
    record.attemptCount += 1;
    var option = block.followUp.options[Number(record.followUpSelected)];
    var correct = Number(record.followUpSelected) === Number(block.followUp.answer);
    record.attempts.push({ type: 'conceptual', value: Number(record.followUpSelected), correct: correct, misconception: option && option.code || '', at: Date.now() });
    if (!correct) {
      record.lastStatus = 'incorrect'; record.lastFeedback = option && option.feedback ? option.feedback : block.feedback;
      if (option && option.code) addMisconception(record, option.code);
      save(index, record); markFollowUpResult(index, false); updateFeedback(block, record, index, true); return;
    }
    record.followUpComplete = true;
    record.lastStatus = 'correct'; record.lastFeedback = block.followUp.successFeedback || block.successFeedback || copy('Вывод согласуется с графиком.', 'Қорытынды графикке сәйкес келеді.');
    finish(block, record);
    save(index, record);
    updateFollowUp(block, record, index);
    updateHints(block, record, index);
    updateFeedback(block, record, index, true);
    updateActions(record, index);
  }

  function previewParameter(input, index) {
    var block = currentBlock(index);
    var record = block ? ensureRecord(block, LessonEngine.getInteractionState(index)) : null;
    if (!block || !record) return;
    var value = Number(input.value);
    var output = document.getElementById('graph-parameter-output-' + index);
    if (output) output.textContent = formatNumber(value);
    var formula = document.getElementById('graph-formula-' + index);
    if (formula && block.function) formula.outerHTML = formulasHtml({ functions: [activeFunction(block, record, value)] }, record, index);
    updateLine(block, record, index, value);
    updateGraphDescription(block, record, index, value);
  }

  function commitParameter(input, index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'graph-workspace' || block.mode !== 'parameter') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    var value = clamp(Number(input.value), block.parameter.min, block.parameter.max);
    if (Array.isArray(block.parameter.values) && block.parameter.values.length) value = block.parameter.values.reduce(function(best, candidate) { return Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best; }, block.parameter.values[0]);
    record.parameterValue = clean(value);
    if (!record.visitedParameters.some(function(item) { return Math.abs(item - value) < 1e-9; })) record.visitedParameters.push(clean(value));
    record.lastStatus = ''; record.lastFeedback = '';
    save(index, record);
    previewParameter({ value: String(value) }, index);
    updateFollowUp(block, record, index);
    updateFeedback(block, record, index, false);
    var checklist = document.getElementById('graph-parameter-' + index);
    if (checklist) checklist.value = value;
    var panel = checklist && checklist.closest ? checklist.closest('.graph-parameter-panel') : null;
    if (panel && panel.querySelectorAll) Array.prototype.forEach.call(panel.querySelectorAll('.graph-parameter-checklist li'), function(item, itemIndex) {
      var requiredValue = (block.requiredValues || [])[itemIndex];
      item.classList.toggle('is-visited', record.visitedParameters.some(function(visited) { return Math.abs(visited - requiredValue) < 1e-9; }));
      var marker = item.querySelector ? item.querySelector('span') : null;
      if (marker) marker.textContent = item.classList.contains('is-visited') ? '✓' : '○';
    });
  }

  function stepParameter(index, direction) {
    var block = currentBlock(index);
    if (!block || !block.parameter) return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    var next;
    if (Array.isArray(block.parameter.values) && block.parameter.values.length) {
      var values = block.parameter.values;
      var current = values.indexOf(Number(record.parameterValue));
      next = values[clamp((current < 0 ? 0 : current) + direction, 0, values.length - 1)];
    } else next = clamp(Number(record.parameterValue) + direction * block.parameter.step, block.parameter.min, block.parameter.max);
    commitParameter({ value: String(clean(next)) }, index);
  }

  function showHint(index) {
    var block = currentBlock(index);
    if (!block || block.type !== 'graph-workspace') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    record.hintCount = Math.min((block.hints || []).length, record.hintCount + 1);
    save(index, record); updateHints(block, record, index);
  }

  function initialize(index, block) {
    if (block.mode !== 'value-table') return;
    var record = ensureRecord(block, LessonEngine.getInteractionState(index));
    if (record.completed || record.currentRow >= block.rows.length) return;
    var rowIndex = record.currentRow;
    var field = tableField(index, rowIndex);
    if (!field || field.dataset.mathlogicReady === 'true') return;
    field.dataset.mathlogicReady = 'true';
    MathInput.configureMathLive();
    MathInput.configureField(field, block.keyboard || { groups: ['numbers', 'operators'], variables: [] });
    field.addEventListener('input', function() {
      if (draftTimers[index]) clearTimeout(draftTimers[index]);
      draftTimers[index] = setTimeout(function() { saveTableDraft(index, rowIndex); }, 250);
    });
    field.addEventListener('change', function() { saveTableDraft(index, rowIndex); });
    field.addEventListener('focusout', function() { saveTableDraft(index, rowIndex); });
    field.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitTableValue(index, rowIndex); }
      else if (event.key === 'Escape' && window.mathVirtualKeyboard) window.mathVirtualKeyboard.hide();
    });
    bindLifecycle();
  }

  function bindLifecycle() {
    if (lifecycleBound || !window.addEventListener) return;
    lifecycleBound = true;
    function persist() {
      var state = window.__EngineInternal && window.__EngineInternal.state;
      var index = state ? state.currentIndex : null;
      var block = index !== null ? currentBlock(index) : null;
      if (block && block.type === 'graph-workspace' && block.mode === 'value-table') {
        var record = ensureRecord(block, LessonEngine.getInteractionState(index));
        if (!record.completed && record.currentRow < block.rows.length) saveTableDraft(index, record.currentRow);
      }
    }
    window.addEventListener('pagehide', persist);
    if (document.addEventListener) document.addEventListener('visibilitychange', function() { if (document.visibilityState === 'hidden') persist(); });
  }

  function complete(index) {
    var record = LessonEngine.getInteractionState(index);
    if (record && record.completed && record.pendingResult) LessonEngine.next(record.pendingResult);
  }

  LessonBlocks.register('graph-workspace', render);
  if (LessonEngine && LessonEngine.on) LessonEngine.on('afterRender', function(data) {
    if (data.block && data.block.type === 'graph-workspace') initialize(data.blockIndex, data.block);
  });

  return {
    render: render,
    initialize: initialize,
    createTransform: createTransform,
    lineSegment: lineSegment,
    isPointWithinTolerance: isPointWithinTolerance,
    formulaText: formulaText,
    placePoint: placePoint,
    checkPoint: checkPoint,
    editPoint: editPoint,
    placeFromInputs: placeFromInputs,
    placeFromPointer: placeFromPointer,
    saveTableDraft: saveTableDraft,
    submitTableValue: submitTableValue,
    selectPoint: selectPoint,
    keySelectPoint: keySelectPoint,
    selectFollowUp: selectFollowUp,
    keySelectFollowUp: keySelectFollowUp,
    checkFollowUp: checkFollowUp,
    previewParameter: previewParameter,
    commitParameter: commitParameter,
    stepParameter: stepParameter,
    showHint: showHint,
    complete: complete,
  };
})();
