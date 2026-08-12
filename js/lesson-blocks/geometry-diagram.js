/* Small structured SVG renderer for task-linked elementary geometry diagrams. */
window.GeometryDiagram = (function() {
  'use strict';

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function number(value) { return Number(value) || 0; }
  function point(value) { return { x: number(value && value.x), y: number(value && value.y) }; }
  function distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y) || 1; }
  function unit(from, to) {
    var length = distance(from, to);
    return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
  }
  function className(element, base) {
    return base + (element.highlight ? ' is-highlighted' : '') + (element.muted ? ' is-muted' : '');
  }
  function label(x, y, text, anchor, classValue) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" class="' + (classValue || 'geometry-diagram-label') + '">' + escapeHtml(text) + '</text>';
  }
  function lineElement(element, markerId) {
    var from = point(element.from), to = point(element.to);
    var markerStart = element.kind === 'line' ? ' marker-start="url(#' + markerId + ')"' : '';
    var markerEnd = element.kind === 'line' || element.kind === 'ray' ? ' marker-end="url(#' + markerId + ')"' : '';
    return '<line x1="' + from.x + '" y1="' + from.y + '" x2="' + to.x + '" y2="' + to.y + '" class="' + className(element, 'geometry-diagram-edge') + '"' + markerStart + markerEnd + '/>';
  }
  function polygonElement(element) {
    var points = (element.points || []).map(function(item) { var p = point(item); return p.x + ',' + p.y; }).join(' ');
    return '<polygon points="' + points + '" class="' + className(element, 'geometry-diagram-polygon') + '"/>';
  }
  function pointElement(element) {
    var at = point(element.at);
    return '<circle cx="' + at.x + '" cy="' + at.y + '" r="1.25" class="geometry-diagram-point"/>' +
      (element.label ? label(at.x + number(element.dx || 0), at.y + number(element.dy === undefined ? -3 : element.dy), element.label, element.anchor) : '');
  }
  function textElement(element) {
    var at = point(element.at);
    return label(at.x, at.y, element.text, element.anchor, 'geometry-diagram-label' + (element.highlight ? ' is-highlighted' : ''));
  }
  function equalMark(element) {
    var from = point(element.from), to = point(element.to), direction = unit(from, to);
    var normal = { x: -direction.y, y: direction.x };
    var middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    var count = Math.max(1, Math.min(3, Number(element.count) || 1));
    var spacing = 2.2, half = 2.1, result = '';
    for (var index = 0; index < count; index++) {
      var offset = (index - (count - 1) / 2) * spacing;
      var center = { x: middle.x + direction.x * offset, y: middle.y + direction.y * offset };
      result += '<line x1="' + (center.x - normal.x * half) + '" y1="' + (center.y - normal.y * half) + '" x2="' + (center.x + normal.x * half) + '" y2="' + (center.y + normal.y * half) + '" class="geometry-diagram-mark"/>';
    }
    return result;
  }
  function parallelMark(element) {
    var from = point(element.from), to = point(element.to), direction = unit(from, to);
    var normal = { x: -direction.y, y: direction.x };
    var middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    var count = Math.max(1, Math.min(2, Number(element.count) || 1));
    var result = '';
    for (var index = 0; index < count; index++) {
      var offset = (index - (count - 1) / 2) * 4;
      var center = { x: middle.x + direction.x * offset, y: middle.y + direction.y * offset };
      var tip = { x: center.x + normal.x * 2.3, y: center.y + normal.y * 2.3 };
      var left = { x: tip.x - direction.x * 2.4 - normal.x * 1.8, y: tip.y - direction.y * 2.4 - normal.y * 1.8 };
      var right = { x: tip.x + direction.x * 2.4 - normal.x * 1.8, y: tip.y + direction.y * 2.4 - normal.y * 1.8 };
      result += '<polyline points="' + left.x + ',' + left.y + ' ' + tip.x + ',' + tip.y + ' ' + right.x + ',' + right.y + '" class="geometry-diagram-parallel-mark"/>';
    }
    return result;
  }
  function rightAngle(element) {
    var vertex = point(element.vertex), first = unit(vertex, point(element.along1)), second = unit(vertex, point(element.along2));
    var size = Number(element.size) || 6;
    var a = { x: vertex.x + first.x * size, y: vertex.y + first.y * size };
    var b = { x: a.x + second.x * size, y: a.y + second.y * size };
    var c = { x: vertex.x + second.x * size, y: vertex.y + second.y * size };
    return '<polyline points="' + a.x + ',' + a.y + ' ' + b.x + ',' + b.y + ' ' + c.x + ',' + c.y + '" class="geometry-diagram-right-angle"/>';
  }
  function angleArc(element) {
    var vertex = point(element.vertex), startPoint = point(element.from), endPoint = point(element.to);
    var start = Math.atan2(startPoint.y - vertex.y, startPoint.x - vertex.x);
    var end = Math.atan2(endPoint.y - vertex.y, endPoint.x - vertex.x);
    var delta = end - start;
    while (delta <= -Math.PI) delta += Math.PI * 2;
    while (delta > Math.PI) delta -= Math.PI * 2;
    if (element.reflex) delta += delta > 0 ? -Math.PI * 2 : Math.PI * 2;
    var radius = Number(element.radius) || 9;
    var begin = { x: vertex.x + Math.cos(start) * radius, y: vertex.y + Math.sin(start) * radius };
    var finish = { x: vertex.x + Math.cos(start + delta) * radius, y: vertex.y + Math.sin(start + delta) * radius };
    var large = Math.abs(delta) > Math.PI ? 1 : 0, sweep = delta > 0 ? 1 : 0;
    var middle = start + delta / 2;
    var result = '<path d="M ' + begin.x + ' ' + begin.y + ' A ' + radius + ' ' + radius + ' 0 ' + large + ' ' + sweep + ' ' + finish.x + ' ' + finish.y + '" class="' + className(element, 'geometry-diagram-angle') + '"/>';
    if (element.label) result += label(vertex.x + Math.cos(middle) * (radius + 5), vertex.y + Math.sin(middle) * (radius + 5) + 1, element.label);
    return result;
  }
  function highlightPoint(element) {
    var at = point(element.at);
    return '<circle cx="' + at.x + '" cy="' + at.y + '" r="' + (Number(element.radius) || 6) + '" class="geometry-diagram-highlight"/>';
  }

  function render(diagram, index) {
    if (!diagram || !Array.isArray(diagram.elements)) return '';
    var viewBox = Array.isArray(diagram.viewBox) && diagram.viewBox.length === 4 ? diagram.viewBox : [0, 0, 100, 60];
    var markerId = 'geometry-diagram-arrow-' + String(index).replace(/[^a-zA-Z0-9_-]/g, '-');
    var markup = diagram.elements.map(function(element) {
      if (!element || !element.kind) return '';
      if (['line','ray','segment'].indexOf(element.kind) > -1) return lineElement(element, markerId);
      if (element.kind === 'polygon') return polygonElement(element);
      if (element.kind === 'point') return pointElement(element);
      if (element.kind === 'label') return textElement(element);
      if (element.kind === 'equal-mark') return equalMark(element);
      if (element.kind === 'parallel-mark') return parallelMark(element);
      if (element.kind === 'right-angle') return rightAngle(element);
      if (element.kind === 'angle') return angleArc(element);
      if (element.kind === 'highlight-point') return highlightPoint(element);
      return '';
    }).join('');
    return '<figure class="geometry-diagram">' +
      '<svg viewBox="' + viewBox.join(' ') + '" role="img" aria-label="' + escapeHtml(diagram.ariaLabel || '') + '" preserveAspectRatio="xMidYMid meet">' +
        '<defs><marker id="' + markerId + '" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="geometry-diagram-arrow"/></marker></defs>' + markup +
      '</svg>' + (diagram.caption ? '<figcaption>' + diagram.caption + '</figcaption>' : '') + '</figure>';
  }

  return { render: render };
})();
