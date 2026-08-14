(function() {
  'use strict';

  var geometryScenes = new Map();
  var activeFlow = 'explain';

  function lang() { return typeof ML !== 'undefined' && ML.getLang ? ML.getLang() : 'ru'; }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }
  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function angleAt(vertex, first, second) {
    var ux = first.x - vertex.x;
    var uy = first.y - vertex.y;
    var vx = second.x - vertex.x;
    var vy = second.y - vertex.y;
    return Math.atan2(Math.abs(ux * vy - uy * vx), ux * vx + uy * vy) * 180 / Math.PI;
  }
  function angles(points) {
    return {
      A: angleAt(points.A, points.B, points.C),
      B: angleAt(points.B, points.A, points.C),
      C: angleAt(points.C, points.A, points.B),
    };
  }
  function formatAngle(value) { return (Math.round(value * 10) / 10).toFixed(1).replace('.', ',') + '°'; }
  function clean(value) { return Math.round(value * 100) / 100; }
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
  function labelPoint(vertex, first, second, radius) {
    var ux = first.x - vertex.x, uy = first.y - vertex.y;
    var vx = second.x - vertex.x, vy = second.y - vertex.y;
    var ul = Math.hypot(ux, uy) || 1, vl = Math.hypot(vx, vy) || 1;
    var bx = ux / ul + vx / vl, by = uy / ul + vy / vl;
    var length = Math.hypot(bx, by) || 1;
    return { x: vertex.x + bx / length * radius, y: vertex.y + by / length * radius };
  }
  function vertexLabelPoint(id, points) {
    var center = { x: (points.A.x + points.B.x + points.C.x) / 3, y: (points.A.y + points.B.y + points.C.y) / 3 };
    var dx = points[id].x - center.x, dy = points[id].y - center.y;
    var length = Math.hypot(dx, dy) || 1;
    return { x: points[id].x + dx / length * 27, y: points[id].y + dy / length * 27 + 5 };
  }
  function triangleArea(points) {
    return Math.abs((points.B.x - points.A.x) * (points.C.y - points.A.y) - (points.B.y - points.A.y) * (points.C.x - points.A.x)) / 2;
  }
  function validTriangle(points) {
    return triangleArea(points) > 6500 && distance(points.A, points.B) > 90 && distance(points.B, points.C) > 90 && distance(points.C, points.A) > 90;
  }
  function projectPoint(point, first, second) {
    var vx = second.x - first.x, vy = second.y - first.y;
    var lengthSquared = vx * vx + vy * vy || 1;
    var t = ((point.x - first.x) * vx + (point.y - first.y) * vy) / lengthSquared;
    return { x: first.x + vx * t, y: first.y + vy * t };
  }

  function sceneSize(scene) {
    var viewBox = scene.svg.viewBox.baseVal;
    return { width: viewBox.width, height: viewBox.height };
  }
  function clonePoints(points) {
    return { A: { x: points.A.x, y: points.A.y }, B: { x: points.B.x, y: points.B.y }, C: { x: points.C.x, y: points.C.y } };
  }
  function triangleType(measurements) {
    var values = [measurements.A, measurements.B, measurements.C];
    var max = Math.max.apply(Math, values);
    if (Math.abs(max - 90) <= 1.5) return copy('прямоугольный', 'тікбұрышты');
    if (max > 90) return copy('тупоугольный', 'доғал бұрышты');
    return copy('остроугольный', 'сүйір бұрышты');
  }

  function renderGeometry(scene) {
    var points = scene.points;
    var measured = angles(points);
    scene.root.querySelector('[data-part="polygon"]').setAttribute('points', ['A', 'B', 'C'].map(function(id) { return points[id].x + ',' + points[id].y; }).join(' '));

    scene.root.querySelector('[data-part="angles"]').innerHTML = [
      { id: 'A', first: 'B', second: 'C' },
      { id: 'B', first: 'A', second: 'C' },
      { id: 'C', first: 'A', second: 'B' },
    ].map(function(def) {
      var label = labelPoint(points[def.id], points[def.first], points[def.second], scene.kind === 'hero' ? 50 : 54);
      return '<path data-angle="' + def.id + '" class="' + (scene.activeId === def.id ? 'is-active' : '') + '" d="' + arcPath(points[def.id], points[def.first], points[def.second], scene.kind === 'hero' ? 31 : 35) + '"></path>' +
        '<text x="' + clean(label.x) + '" y="' + clean(label.y + 5) + '" text-anchor="middle">' + formatAngle(measured[def.id]) + '</text>';
    }).join('');

    scene.root.querySelector('[data-part="vertices"]').innerHTML = ['A', 'B', 'C'].map(function(id) {
      var point = points[id];
      var label = vertexLabelPoint(id, points);
      var aria = copy('Вершина ' + id + '. Перемещайте стрелками.', id + ' төбесі. Бағыттауыш пернелермен жылжытыңыз.');
      return '<g class="ml-vertex' + (scene.activeId === id ? ' is-active' : '') + '" data-vertex="' + id + '" role="button" tabindex="0" aria-label="' + esc(aria) + '">' +
        '<circle class="ml-vertex__hit" cx="' + point.x + '" cy="' + point.y + '" r="28"></circle>' +
        '<circle class="ml-vertex__dot" cx="' + point.x + '" cy="' + point.y + '" r="7"></circle>' +
        '<text x="' + clean(label.x) + '" y="' + clean(label.y) + '" text-anchor="middle">' + id + '</text></g>';
    }).join('');

    if (scene.kind === 'hero') {
      var foot = projectPoint(points.B, points.A, points.C);
      var baseLength = distance(points.A, points.C) || 1;
      var altitudeLength = distance(points.B, foot) || 1;
      var ux = (points.C.x - points.A.x) / baseLength, uy = (points.C.y - points.A.y) / baseLength;
      var nx = (points.B.x - foot.x) / altitudeLength, ny = (points.B.y - foot.y) / altitudeLength;
      var altitude = scene.root.querySelector('[data-hero-altitude]');
      var rightAngle = scene.root.querySelector('[data-hero-right-angle]');
      var coordinate = scene.root.querySelector('[data-hero-coordinate]');
      if (altitude) altitude.setAttribute('d', 'M' + clean(points.B.x) + ' ' + clean(points.B.y) + 'L' + clean(foot.x) + ' ' + clean(foot.y));
      if (rightAngle) rightAngle.setAttribute('d', 'M' + clean(foot.x + ux * 14) + ' ' + clean(foot.y + uy * 14) + 'L' + clean(foot.x + ux * 14 + nx * 14) + ' ' + clean(foot.y + uy * 14 + ny * 14) + 'L' + clean(foot.x + nx * 14) + ' ' + clean(foot.y + ny * 14));
      if (coordinate) {
        coordinate.setAttribute('x', clean(points.B.x + 14));
        coordinate.setAttribute('y', clean(points.B.y + 43));
        coordinate.textContent = 'B(' + Math.round(points.B.x) + '; ' + Math.round(points.B.y) + ')';
      }
      var center = { x: (points.A.x + points.B.x + points.C.x) / 3, y: (points.A.y + points.B.y + points.C.y) / 3 };
      var sideLabels = scene.root.querySelector('[data-part="side-labels"]');
      if (sideLabels) {
        sideLabels.innerHTML = [{ id: 'AB', first: 'A', second: 'B' }, { id: 'BC', first: 'B', second: 'C' }, { id: 'CA', first: 'C', second: 'A' }].map(function(side) {
          var first = points[side.first], second = points[side.second];
          var midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
          var dx = midpoint.x - center.x, dy = midpoint.y - center.y;
          var length = Math.hypot(dx, dy) || 1;
          var x = midpoint.x + dx / length * 18, y = midpoint.y + dy / length * 18;
          return '<text x="' + clean(x) + '" y="' + clean(y) + '" text-anchor="middle">' + side.id + ' ' + (distance(first, second) / 52).toFixed(1).replace('.', ',') + '</text>';
        }).join('');
      }
      var heroRoot = scene.root.closest('.ml-hero');
      var proofB = heroRoot && heroRoot.querySelector('[data-proof-b]');
      var proofArea = heroRoot && heroRoot.querySelector('[data-proof-area]');
      if (proofB) proofB.textContent = '(' + Math.round(points.B.x) + '; ' + Math.round(points.B.y) + ')';
      if (proofArea) proofArea.textContent = (triangleArea(points) / (52 * 52)).toFixed(1).replace('.', ',');
      ['A', 'B', 'C'].forEach(function(id) {
        var output = scene.root.querySelector('[data-measure="' + id + '"]');
        if (output) output.textContent = formatAngle(measured[id]);
      });
      var sum = scene.root.querySelector('[data-measure="sum"]');
      if (sum) sum.textContent = '≈ ' + Math.round(measured.A + measured.B + measured.C) + '°';
    } else {
      var sideValues = { AB: distance(points.A, points.B), BC: distance(points.B, points.C), CA: distance(points.C, points.A) };
      scene.root.querySelector('[data-readout="angles"]').textContent = ['A ' + formatAngle(measured.A), 'B ' + formatAngle(measured.B), 'C ' + formatAngle(measured.C)].join(' · ');
      scene.root.querySelector('[data-readout="sides"]').textContent = Object.keys(sideValues).map(function(id) { return id + ' ' + (sideValues[id] / 52).toFixed(1).replace('.', ','); }).join(' · ');
      scene.root.querySelector('[data-readout="type"]').textContent = triangleType(measured);
    }
  }

  function svgPoint(svg, event) {
    var point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    var matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : point;
  }
  function moveVertex(scene, id, x, y) {
    var size = sceneSize(scene);
    var candidate = clonePoints(scene.points);
    candidate[id] = { x: clamp(x, 48, size.width - 48), y: clamp(y, 46, size.height - 42) };
    if (!validTriangle(candidate)) return;
    scene.points = candidate;
    renderGeometry(scene);
    var hint = scene.root.querySelector('.ml-demo-hint');
    if (hint) hint.hidden = true;
  }
  function releaseActiveVertex(scene) {
    if (scene.activeTimer) window.clearTimeout(scene.activeTimer);
    scene.activeTimer = window.setTimeout(function() {
      scene.activeId = '';
      scene.activeTimer = null;
      renderGeometry(scene);
    }, 240);
  }
  function initGeometry(root) {
    var kind = root.dataset.geometry;
    var svg = root.querySelector('svg.ml-geometry');
    var defaults = kind === 'hero'
      ? { A: { x: 98, y: 405 }, B: { x: 320, y: 82 }, C: { x: 586, y: 405 } }
      : { A: { x: 105, y: 435 }, B: { x: 390, y: 78 }, C: { x: 660, y: 435 } };
    var scene = { root: root, svg: svg, kind: kind, points: clonePoints(defaults), defaults: defaults, dragging: null, activeId: '', activeTimer: null };
    geometryScenes.set(root, scene);
    renderGeometry(scene);

    svg.addEventListener('pointerdown', function(event) {
      var vertex = event.target.closest && event.target.closest('[data-vertex]');
      if (!vertex) return;
      scene.dragging = { id: vertex.dataset.vertex, pointerId: event.pointerId };
      if (scene.activeTimer) window.clearTimeout(scene.activeTimer);
      scene.activeId = vertex.dataset.vertex;
      renderGeometry(scene);
      if (svg.setPointerCapture) svg.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    svg.addEventListener('pointermove', function(event) {
      if (!scene.dragging || scene.dragging.pointerId !== event.pointerId) return;
      var point = svgPoint(svg, event);
      moveVertex(scene, scene.dragging.id, point.x, point.y);
    });
    function endDrag(event) {
      if (!scene.dragging || scene.dragging.pointerId !== event.pointerId) return;
      if (svg.releasePointerCapture && svg.hasPointerCapture && svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      scene.dragging = null;
      releaseActiveVertex(scene);
    }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('keydown', function(event) {
      var vertex = event.target.closest && event.target.closest('[data-vertex]');
      if (!vertex || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(event.key) === -1) return;
      var point = scene.points[vertex.dataset.vertex];
      var step = event.shiftKey ? 20 : 8;
      var dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      var dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      if (scene.activeTimer) window.clearTimeout(scene.activeTimer);
      scene.activeId = vertex.dataset.vertex;
      moveVertex(scene, vertex.dataset.vertex, point.x + dx, point.y + dy);
      releaseActiveVertex(scene);
      event.preventDefault();
    });

    var reset = root.querySelector('[data-reset-geometry]');
    if (reset) reset.addEventListener('click', function() {
      if (scene.activeTimer) window.clearTimeout(scene.activeTimer);
      scene.activeId = '';
      scene.points = clonePoints(scene.defaults);
      renderGeometry(scene);
    });
  }

  var flowOrder = ['explain', 'example', 'practice', 'review'];
  function flowContent(id) {
    var content = {
      explain: {
        kicker: copy('Объяснение · Степени', 'Түсіндіру · Дәрежелер'),
        title: copy('Что означает показатель степени', 'Дәреже көрсеткіші нені білдіреді'),
        text: copy('Запись aⁿ показывает, сколько раз число a используется как множитель.', 'aⁿ жазбасы a саны көбейткіш ретінде неше рет қолданылатынын көрсетеді.'),
        extra: '<div class="ml-flow-formula">a<sup>n</sup> = a · a · … · a</div>',
      },
      example: {
        kicker: copy('Исследование · Чертёж', 'Зерттеу · Сызба'),
        title: copy('Правило видно на примере', 'Ереже мысалдан көрінеді'),
        text: copy('Схема связывает условие, математическую запись и наблюдение.', 'Сызба шартты, математикалық жазбаны және бақылауды байланыстырады.'),
        extra: '<div class="ml-mini-explore"><svg viewBox="0 0 520 176" aria-hidden="true"><path d="M35 145 225 24l235 121Z"/><path d="M65 145a36 36 0 0 1 17-29M430 145a36 36 0 0 0-19-30"/><circle cx="225" cy="24" r="4"/><path class="ml-explore-result" d="M225 24v121M213 145h24"/></svg><button type="button" data-explore-toggle aria-pressed="false">' + copy('Показать высоту', 'Биіктікті көрсету') + '</button></div>',
      },
      practice: {
        kicker: copy('Практика · Один шаг', 'Жаттығу · Бір қадам'),
        title: copy('Проверь понимание', 'Түсінгеніңді тексер'),
        text: copy('Вычисли: 2³ = ?', 'Есепте: 2³ = ?'),
        extra: '<form class="ml-flow-question" data-practice-form><label for="ml-flow-answer">' + copy('Введи ответ', 'Жауапты енгіз') + '</label><div class="ml-flow-input"><input id="ml-flow-answer" name="answer" inputmode="numeric" autocomplete="off" aria-label="' + copy('Ответ', 'Жауап') + '"><button type="submit">' + copy('Проверить', 'Тексеру') + '</button></div><p class="ml-flow-feedback" aria-live="polite"></p></form>',
      },
      review: {
        kicker: copy('Разбор · Связь шагов', 'Талдау · Қадамдар байланысы'),
        title: copy('Почему ответ равен 8', 'Неліктен жауап 8-ге тең'),
        text: copy('Показатель 3 означает три одинаковых множителя.', '3 көрсеткіші үш бірдей көбейткішті білдіреді.'),
        extra: '<div class="ml-review-line"><span>✓</span><p>2³ = 2 · 2 · 2</p></div><div class="ml-review-line"><span>✓</span><p>2 · 2 · 2 = 8</p></div>',
      },
    };
    return content[id];
  }
  function renderFlow(id, focusPanel) {
    if (flowOrder.indexOf(id) === -1) return;
    activeFlow = id;
    var item = flowContent(id);
    var index = flowOrder.indexOf(id);
    document.querySelectorAll('[data-flow]').forEach(function(button) {
      button.setAttribute('aria-selected', String(button.dataset.flow === id));
      button.tabIndex = button.dataset.flow === id ? 0 : -1;
    });
    var preview = document.querySelector('.ml-lesson-preview');
    preview.style.setProperty('--flow-width', ((index + 1) / flowOrder.length * 100) + '%');
    preview.querySelector('[data-flow-count]').textContent = (index + 1) + ' / ' + flowOrder.length;
    var panel = preview.querySelector('[data-flow-panel]');
    panel.className = 'ml-flow-panel';
    panel.innerHTML = '<p class="ml-kicker">' + esc(item.kicker) + '</p><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p>' + item.extra;
    if (focusPanel) panel.setAttribute('tabindex', '-1');
  }
  function initFlow() {
    document.querySelector('.ml-flow-tabs').addEventListener('click', function(event) {
      var button = event.target.closest('[data-flow]');
      if (button) renderFlow(button.dataset.flow, false);
    });
    document.querySelector('.ml-flow-tabs').addEventListener('keydown', function(event) {
      if (['ArrowLeft', 'ArrowRight'].indexOf(event.key) === -1) return;
      var current = flowOrder.indexOf(activeFlow);
      var next = (current + (event.key === 'ArrowRight' ? 1 : -1) + flowOrder.length) % flowOrder.length;
      renderFlow(flowOrder[next], false);
      document.querySelector('[data-flow="' + flowOrder[next] + '"]').focus();
      event.preventDefault();
    });
    document.querySelector('.ml-lesson-preview').addEventListener('click', function(event) {
      var explore = event.target.closest('[data-explore-toggle]');
      if (explore) {
        var exploration = explore.closest('.ml-mini-explore');
        var nextState = explore.getAttribute('aria-pressed') !== 'true';
        explore.setAttribute('aria-pressed', String(nextState));
        explore.textContent = nextState ? copy('Скрыть высоту', 'Биіктікті жасыру') : copy('Показать высоту', 'Биіктікті көрсету');
        exploration.classList.toggle('is-open', nextState);
        return;
      }
    });
    document.querySelector('.ml-lesson-preview').addEventListener('submit', function(event) {
      var form = event.target.closest('[data-practice-form]');
      if (!form) return;
      event.preventDefault();
      var feedback = document.querySelector('.ml-flow-feedback');
      var correct = form.elements.answer.value.trim() === '8';
      feedback.className = 'ml-flow-feedback ' + (correct ? 'is-correct' : 'is-wrong');
      feedback.textContent = correct ? copy('Верно: 2 · 2 · 2 = 8.', 'Дұрыс: 2 · 2 · 2 = 8.') : copy('Посчитай три множителя 2 ещё раз.', 'Үш 2 көбейткішін қайта есепте.');
    });
    renderFlow(activeFlow, false);
  }

  function local(record, key) {
    return typeof I18N !== 'undefined' && I18N.localize ? I18N.localize(record, key, lang()) : (record[key + (lang() === 'kk' ? 'Kk' : 'Ru')] || '');
  }
  function topicPreview(topic) {
    var previews = {
      'ALG-01.linear-equations': '2x + 4 = 12',
      'ALG-01.fractions-percent': '<span class="ml-program-fraction"><span>3</span><span>4</span></span>',
      'ALG-02.powers': 'a³ = a · a · a',
      'ALG-03.identities': '(a + b)² = a² + 2ab + b²',
      'ALG-05.function-representations': '<svg viewBox="0 0 150 44" aria-hidden="true"><path d="M8 36H143M24 42V4"/><path d="M24 33C47 31 56 11 79 14s34 17 62-6"/><circle cx="79" cy="14" r="3"/></svg>',
      'ALG-05.linear-relationships': 'y = kx + b',
      'GEO-01.angles-lines': '<svg viewBox="0 0 150 44" aria-hidden="true"><path d="M12 36H138M75 36 112 6M75 36a25 25 0 0 1 14-21"/></svg>',
      'GEO-02.triangle-basics': '<svg viewBox="0 0 150 44" aria-hidden="true"><path d="M16 38 69 5l65 33Z"/><path d="M69 5v33"/></svg>',
      'GEO-03.parallel-lines': '<svg viewBox="0 0 150 44" aria-hidden="true"><path d="M10 12H140M10 34H140M40 2l64 42"/><path d="m19 8 8 4-8 4M119 30l8 4-8 4"/></svg>',
      'GEO-03.triangle-angles': '∠A + ∠B + ∠C = 180°',
      'GEO-04.circle-positions': '<svg viewBox="0 0 150 44" aria-hidden="true"><circle cx="72" cy="22" r="18"/><path d="M8 38 142 7"/><circle cx="72" cy="22" r="2"/></svg>',
      'GEO-06.right-triangle-ratios': '<svg viewBox="0 0 150 44" aria-hidden="true"><path d="M17 38V7l99 31Z"/><path d="M17 28h10v10"/></svg>',
    };
    return '<div class="ml-program-math" aria-hidden="true">' + (previews[topic.id] || 'x + y = z') + '</div>';
  }
  function renderProgram(subject) {
    var curriculum = window.MATHLOGIC_CURRICULUM;
    var target = document.querySelector('[data-program-list]');
    if (!curriculum || !target) return;
    var featured = {
      algebra: ['ALG-01.linear-equations', 'ALG-01.fractions-percent', 'ALG-02.powers', 'ALG-03.identities', 'ALG-05.function-representations', 'ALG-05.linear-relationships'],
      geometry: ['GEO-01.angles-lines', 'GEO-02.triangle-basics', 'GEO-03.parallel-lines', 'GEO-03.triangle-angles', 'GEO-04.circle-positions', 'GEO-06.right-triangle-ratios'],
    };
    document.querySelectorAll('[data-subject]').forEach(function(button) {
      button.setAttribute('aria-selected', String(button.dataset.subject === subject));
      button.tabIndex = button.dataset.subject === subject ? 0 : -1;
    });
    var topics = (featured[subject] || []).map(function(id) { return curriculum.getTopic(id); }).filter(Boolean);
    target.innerHTML = '<div class="ml-program-topic-list">' + topics.map(function(topic) {
      var lessons = topic.lessonIds.slice(0, 2).map(function(id) { return curriculum.getLesson(id); }).filter(Boolean);
      var available = topic.lessonIds.some(function(id) {
        var lesson = curriculum.getLesson(id);
        return lesson && lesson.productionStatus === 'implemented';
      });
      var status = available ? '<span class="ml-program-status">✓ ' + copy('Доступно', 'Қолжетімді') + '</span>' : '';
      return '<article class="ml-program-topic' + (available ? ' is-available' : '') + '"><a href="program.html?subject=' + encodeURIComponent(subject) + '">' + esc(local(topic, 'title')) + '</a><p>' + esc(local(topic, 'description')) + '</p>' + topicPreview(topic) + status + '<small>' + lessons.map(function(lesson) { return local(lesson, 'title'); }).join(' · ') + '</small></article>';
    }).join('') + '</div>';
  }
  function initProgram() {
    var tabs = document.querySelector('.ml-program-tabs');
    tabs.addEventListener('click', function(event) {
      var button = event.target.closest('[data-subject]');
      if (button) renderProgram(button.dataset.subject);
    });
    tabs.addEventListener('keydown', function(event) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(event.key) === -1) return;
      var current = document.querySelector('[data-subject][aria-selected="true"]');
      var next = current.dataset.subject === 'algebra' ? 'geometry' : 'algebra';
      renderProgram(next);
      document.querySelector('[data-subject="' + next + '"]').focus();
      event.preventDefault();
    });
    document.querySelector('[data-program-list]').addEventListener('click', function(event) {
      if (event.target.closest('a')) return;
      var topic = event.target.closest('.ml-program-topic');
      if (!topic) return;
      topic.classList.toggle('is-active');
    });
    renderProgram('algebra');
  }

  function renderConditionResult(root) {
    var active = ['sides', 'angles', 'right'].filter(function(id) { return root.dataset[id] === 'true'; });
    var result = root.querySelector('[data-condition-result]');
    var text;
    if (!active.length) text = copy('Пока задан только треугольник.', 'Әзірге тек үшбұрыш берілген.');
    else {
      var notation = { sides: 'AB = AC', angles: '∠A = ∠C', right: 'AB ⟂ AC' };
      text = copy('Задано условием: ', 'Шартпен берілген: ') + active.map(function(id) { return notation[id]; }).join(' · ');
    }
    result.textContent = text;
    result.classList.toggle('is-verified', active.length > 0);
  }

  function initMethodMotion() {
    document.querySelectorAll('[data-method-motion]').forEach(function(step) {
      function setPosition(event) {
        var rect = step.getBoundingClientRect();
        var x = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
        var y = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
        step.style.setProperty('--method-x', x.toFixed(2));
        step.style.setProperty('--method-y', y.toFixed(2));
      }
      step.addEventListener('pointermove', function(event) { if (event.pointerType !== 'touch') setPosition(event); });
      step.addEventListener('pointerdown', setPosition);
      step.addEventListener('pointerleave', function() {
        step.style.setProperty('--method-x', '0');
        step.style.setProperty('--method-y', '0');
      });
    });
  }

  function initFunctionDemo() {
    var root = document.querySelector('[data-function-demo]');
    if (!root) return;
    var state = { a: 1, b: 0 };
    var updateTimer = null;
    var origin = { x: 340, y: 210 };
    var scale = { x: 60, y: 40 };
    function point(x, y) { return { x: origin.x + x * scale.x, y: origin.y - y * scale.y }; }
    function equation() {
      var coefficient = state.a === 1 ? '' : state.a === -1 ? '−' : String(state.a);
      var intercept = state.b === 0 ? '' : (state.b > 0 ? ' + ' + state.b : ' − ' + Math.abs(state.b));
      return coefficient + 'x' + intercept;
    }
    function render() {
      var candidates = [];
      [-5, 5].forEach(function(x) {
        var y = state.a * x + state.b;
        if (y >= -4.5 && y <= 4.5) candidates.push({ x: x, y: y });
      });
      if (state.a !== 0) [-4.5, 4.5].forEach(function(y) {
        var x = (y - state.b) / state.a;
        if (x >= -5 && x <= 5) candidates.push({ x: x, y: y });
      });
      if (state.a === 0) candidates = [{ x: -5, y: state.b }, { x: 5, y: state.b }];
      var first = point(candidates[0].x, candidates[0].y);
      var last = point(candidates[candidates.length - 1].x, candidates[candidates.length - 1].y);
      root.querySelector('[data-function-line]').setAttribute('d', 'M' + clean(first.x) + ' ' + clean(first.y) + 'L' + clean(last.x) + ' ' + clean(last.y));
      var intercept = point(0, state.b);
      var run = point(1, state.b);
      var rise = point(1, state.a + state.b);
      var slope = root.querySelector('[data-function-slope]');
      slope.querySelector('path').setAttribute('d', 'M' + clean(intercept.x) + ' ' + clean(intercept.y) + 'H' + clean(run.x) + 'V' + clean(rise.y));
      var labels = slope.querySelectorAll('text');
      labels[0].setAttribute('x', clean(run.x + 8)); labels[0].setAttribute('y', clean((run.y + rise.y) / 2));
      labels[1].setAttribute('x', clean((intercept.x + run.x) / 2)); labels[1].setAttribute('y', clean(run.y + 18));
      var dot = root.querySelector('[data-function-intercept]');
      dot.setAttribute('cx', intercept.x); dot.setAttribute('cy', intercept.y);
      var label = root.querySelector('[data-function-intercept-label]');
      label.setAttribute('x', intercept.x + 12); label.setAttribute('y', intercept.y - 10); label.textContent = 'b = ' + state.b;
      root.querySelector('[data-function-equation]').textContent = equation();
      root.querySelector('[data-function-value="a"]').textContent = state.a;
      root.querySelector('[data-function-value="b"]').textContent = state.b;
      root.querySelector('[data-function-state]').textContent = 'Δy / Δx = ' + state.a;
      root.querySelector('[data-function-slope-value]').textContent = state.a;
      root.querySelector('[data-function-intersection-value]').textContent = state.b;
      root.querySelector('[data-function-handle="intercept"]').setAttribute('transform', 'translate(' + clean(intercept.x) + ' ' + clean(intercept.y) + ')');
      root.querySelector('[data-function-handle="slope"]').setAttribute('transform', 'translate(' + clean(rise.x) + ' ' + clean(rise.y) + ')');
      var controls = root.querySelector('.ml-function__controls');
      controls.classList.add('is-updating');
      if (updateTimer) window.clearTimeout(updateTimer);
      updateTimer = window.setTimeout(function() { controls.classList.remove('is-updating'); updateTimer = null; }, 280);
    }
    root.addEventListener('click', function(event) {
      var button = event.target.closest('[data-function-control]');
      if (!button) return;
      var key = button.dataset.functionControl;
      state[key] = clamp(state[key] + Number(button.dataset.delta), -3, 3);
      render();
    });
    var graph = root.querySelector('.ml-function-graph svg');
    var dragging = null;
    graph.addEventListener('pointerdown', function(event) {
      var handle = event.target.closest && event.target.closest('[data-function-handle]');
      if (!handle) return;
      dragging = { key: handle.dataset.functionHandle, pointerId: event.pointerId };
      if (graph.setPointerCapture) graph.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    graph.addEventListener('pointermove', function(event) {
      if (!dragging || dragging.pointerId !== event.pointerId) return;
      var current = svgPoint(graph, event);
      var yValue = (origin.y - current.y) / scale.y;
      if (dragging.key === 'intercept') state.b = clamp(Math.round(yValue), -3, 3);
      else state.a = clamp(Math.round(yValue - state.b), -3, 3);
      render();
    });
    function endFunctionDrag(event) {
      if (!dragging || dragging.pointerId !== event.pointerId) return;
      if (graph.releasePointerCapture && graph.hasPointerCapture && graph.hasPointerCapture(event.pointerId)) graph.releasePointerCapture(event.pointerId);
      dragging = null;
    }
    graph.addEventListener('pointerup', endFunctionDrag);
    graph.addEventListener('pointercancel', endFunctionDrag);
    graph.addEventListener('keydown', function(event) {
      var handle = event.target.closest && event.target.closest('[data-function-handle]');
      if (!handle || ['ArrowUp', 'ArrowDown'].indexOf(event.key) === -1) return;
      var delta = event.key === 'ArrowUp' ? 1 : -1;
      if (handle.dataset.functionHandle === 'intercept') state.b = clamp(state.b + delta, -3, 3);
      else state.a = clamp(state.a + delta, -3, 3);
      render();
      event.preventDefault();
    });
    render();
  }
  function initReasoning() {
    var root = document.querySelector('.ml-reasoning-demo');
    var recentTimer = null;
    root.querySelector('.ml-condition-controls').addEventListener('click', function(event) {
      var button = event.target.closest('[data-condition]');
      if (!button) return;
      var next = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(next));
      root.dataset[button.dataset.condition] = String(next);
      if (recentTimer) window.clearTimeout(recentTimer);
      root.querySelectorAll('[data-condition]').forEach(function(item) { item.classList.remove('is-recent'); });
      if (next) {
        root.dataset.recent = button.dataset.condition;
        button.classList.add('is-recent');
        recentTimer = window.setTimeout(function() {
          delete root.dataset.recent;
          button.classList.remove('is-recent');
          recentTimer = null;
        }, 320);
      } else {
        delete root.dataset.recent;
      }
      renderConditionResult(root);
    });
  }

  function syncLanguageControls() {
    document.querySelectorAll('[data-lang]').forEach(function(button) { button.setAttribute('aria-pressed', String(button.dataset.lang === lang())); });
    document.documentElement.lang = lang();
    var title = copy('GEOMAT — математика с объяснениями и практикой', 'GEOMAT — түсіндірулер мен практикаға негізделген математика');
    document.title = title;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = copy('GEOMAT — алгебра и геометрия с понятными объяснениями, задачами и интерактивными чертежами.', 'GEOMAT — түсінікті түсіндірулері, есептері және интерактивті сызбалары бар алгебра мен геометрия.');
    document.querySelectorAll('[data-function-control]').forEach(function(button) {
      var direction = Number(button.dataset.delta) > 0 ? copy('Увеличить ', 'Үлкейту ') : copy('Уменьшить ', 'Кішірейту ');
      button.setAttribute('aria-label', direction + button.dataset.functionControl);
    });
    var interceptHandle = document.querySelector('[data-function-handle="intercept"]');
    var slopeHandle = document.querySelector('[data-function-handle="slope"]');
    if (interceptHandle) interceptHandle.setAttribute('aria-label', copy('Переместить пересечение с осью y', 'y осімен қиылысуды жылжыту'));
    if (slopeHandle) slopeHandle.setAttribute('aria-label', copy('Изменить наклон прямой', 'Түзудің көлбеуін өзгерту'));
  }
  function refreshLanguage() {
    MathLogicSite.applyCopy();
    syncLanguageControls();
    geometryScenes.forEach(renderGeometry);
    renderFlow(activeFlow, false);
    var selectedSubject = document.querySelector('[data-subject][aria-selected="true"]');
    renderProgram(selectedSubject ? selectedSubject.dataset.subject : 'algebra');
    renderConditionResult(document.querySelector('.ml-reasoning-demo'));
  }
  function initLanguage() {
    document.addEventListener('click', function(event) {
      var button = event.target.closest('[data-lang]');
      if (!button) return;
      ML.setLang(button.dataset.lang);
      refreshLanguage();
    });
    syncLanguageControls();
  }

  function initReveal() {
    var nodes = document.querySelectorAll('.ml-reveal');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(function(node) { node.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    nodes.forEach(function(node) { observer.observe(node); });
  }
  function initFinalPointer() {
    var section = document.querySelector('.ml-final');
    var art = section.querySelector('.ml-final__math');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    section.addEventListener('pointermove', function(event) {
      if (event.pointerType === 'touch') return;
      var rect = section.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - .5;
      var y = (event.clientY - rect.top) / rect.height - .5;
      art.style.transform = 'translate(' + (x * 12).toFixed(1) + 'px,' + (y * 10).toFixed(1) + 'px)';
    });
    section.addEventListener('pointerleave', function() { art.style.transform = ''; });
  }

  function initStatementMotion() {
    var section = document.querySelector('.ml-equation-statement');
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ticking = false;
    function update() {
      var rect = section.getBoundingClientRect();
      var distance = (window.innerHeight * .5) - (rect.top + rect.height * .5);
      var progress = Math.max(-1, Math.min(1, distance / window.innerHeight));
      section.style.setProperty('--statement-shift', (progress * 18).toFixed(1) + 'px');
      ticking = false;
    }
    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }

  function init() {
    if (typeof ML !== 'undefined' && ML.applySettings) ML.applySettings();
    MathLogicSite.applyCopy();
    document.querySelectorAll('[data-geometry]').forEach(initGeometry);
    initFlow();
    initProgram();
    initReasoning();
    initMethodMotion();
    initFunctionDemo();
    initLanguage();
    initReveal();
    initStatementMotion();
    initFinalPointer();
  }

  window.MathLogicLanding = {
    triangleAngles: angles,
    renderProgram: renderProgram,
    renderFlow: renderFlow,
    refreshLanguage: refreshLanguage,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
