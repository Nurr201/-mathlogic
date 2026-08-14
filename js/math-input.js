/* Geomat math-entry primitive.
   MathLive owns visual editing. This module owns safe syntax analysis,
   normalized validation and contextual keyboard configuration. It is not a CAS. */
window.MathInput = (function() {
  'use strict';

  var VALIDATORS = {};
  var SUPER_DIGITS = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁻': '-', '⁺': '+',
  };

  function issue(status, code) {
    var error = new Error(code);
    error.mathInputStatus = status;
    error.code = code;
    return error;
  }

  function replaceSuperscripts(value) {
    return value.replace(/[⁰¹²³⁴-⁹⁻⁺]+/g, function(sequence) {
      return '^(' + sequence.split('').map(function(char) { return SUPER_DIGITS[char] || ''; }).join('') + ')';
    });
  }

  function prepare(value) {
    var source = String(value === undefined || value === null ? '' : value).trim();
    if (!source) return '';
    source = replaceSuperscripts(source)
      .replace(/[−–—]/g, '-')
      .replace(/[×·]/g, '*')
      .replace(/÷|:/g, '/')
      .replace(/\\(?:left|right)\s*/g, '')
      .replace(/\\(?:cdot|times)\b/g, '*')
      .replace(/\\div\b/g, '/')
      .replace(/\\sqrt\b/g, 'sqrt')
      .replace(/\\frac\b/g, 'frac')
      .replace(/\\(?:,|;|!|quad|qquad)\s*/g, '')
      .replace(/\\placeholder(?:\[[^\]]*\])?\{[^}]*\}/g, '□')
      .replace(/[{}]/g, function(char) { return char === '{' ? '(' : ')'; })
      .replace(/\s+/g, '');
    return source;
  }

  function tokenize(value) {
    var source = prepare(value);
    if (!source) return [];
    var tokens = [];
    var index = 0;
    while (index < source.length) {
      var char = source[index];
      if (char === '□') throw issue('incomplete', 'placeholder');
      if (/[0-9.]/.test(char)) {
        var start = index;
        var dots = 0;
        while (index < source.length && /[0-9.]/.test(source[index])) {
          if (source[index] === '.') dots++;
          index++;
        }
        var number = source.slice(start, index);
        if (dots > 1 || number === '.') throw issue('invalid', 'invalid-number');
        tokens.push({ type: 'number', value: number });
        continue;
      }
      if (source.slice(index, index + 4).toLowerCase() === 'sqrt') {
        tokens.push({ type: 'sqrt', value: 'sqrt' });
        index += 4;
        continue;
      }
      if (source.slice(index, index + 4).toLowerCase() === 'frac') {
        tokens.push({ type: 'frac', value: 'frac' });
        index += 4;
        continue;
      }
      if (/[a-zA-Z]/.test(char)) {
        tokens.push({ type: 'variable', value: char });
        index++;
        continue;
      }
      if ('+-*/^=()'.indexOf(char) > -1) {
        tokens.push({ type: char, value: char });
        index++;
        continue;
      }
      throw issue('invalid', char === '\\' ? 'unsupported-command' : 'unsupported-character');
    }
    return tokens;
  }

  function Parser(tokens) {
    this.tokens = tokens;
    this.index = 0;
  }

  Parser.prototype.peek = function(type) {
    var token = this.tokens[this.index];
    return type ? !!token && token.type === type : token;
  };

  Parser.prototype.take = function(type) {
    var token = this.tokens[this.index];
    if (!token) throw issue('incomplete', 'unexpected-end');
    if (type && token.type !== type) throw issue('invalid', 'unexpected-token');
    this.index++;
    return token;
  };

  Parser.prototype.parse = function() {
    if (!this.tokens.length) throw issue('empty', 'empty');
    var node = this.parseEquality();
    if (this.index < this.tokens.length) throw issue('invalid', 'trailing-token');
    return node;
  };

  Parser.prototype.parseEquality = function() {
    var node = this.parseSum();
    if (this.peek('=')) {
      this.take('=');
      if (!this.peek()) throw issue('incomplete', 'missing-right-side');
      node = { type: 'eq', left: node, right: this.parseSum() };
      if (this.peek('=')) throw issue('invalid', 'multiple-equality');
    }
    return node;
  };

  Parser.prototype.parseSum = function() {
    var node = this.parseProduct();
    while (this.peek('+') || this.peek('-')) {
      var operator = this.take().type;
      if (!this.peek()) throw issue('incomplete', 'missing-term');
      node = { type: operator === '+' ? 'add' : 'sub', left: node, right: this.parseProduct() };
    }
    return node;
  };

  function startsAtom(token) {
    return !!token && ['number', 'variable', '(', 'sqrt', 'frac'].indexOf(token.type) > -1;
  }

  Parser.prototype.parseProduct = function() {
    var node = this.parseUnary();
    while (this.peek('*') || this.peek('/') || startsAtom(this.peek())) {
      var operator = startsAtom(this.peek()) ? '*' : this.take().type;
      if (!this.peek()) throw issue('incomplete', 'missing-factor');
      node = { type: operator === '*' ? 'mul' : 'div', left: node, right: this.parseUnary() };
    }
    return node;
  };

  Parser.prototype.parseUnary = function() {
    if (this.peek('+')) {
      this.take('+');
      if (!this.peek()) throw issue('incomplete', 'missing-unary-value');
      return this.parseUnary();
    }
    if (this.peek('-')) {
      this.take('-');
      if (!this.peek()) throw issue('incomplete', 'missing-unary-value');
      return { type: 'neg', value: this.parseUnary() };
    }
    return this.parsePower();
  };

  Parser.prototype.parsePower = function() {
    var node = this.parseAtom();
    if (this.peek('^')) {
      this.take('^');
      if (!this.peek()) throw issue('incomplete', 'missing-exponent');
      node = { type: 'pow', base: node, exponent: this.parseUnary() };
    }
    return node;
  };

  Parser.prototype.parseGroup = function() {
    this.take('(');
    if (!this.peek()) throw issue('incomplete', 'unclosed-group');
    if (this.peek(')')) throw issue('incomplete', 'empty-group');
    var node = this.parseEquality();
    if (!this.peek()) throw issue('incomplete', 'unclosed-group');
    this.take(')');
    return node;
  };

  Parser.prototype.parseAtom = function() {
    var token = this.peek();
    if (!token) throw issue('incomplete', 'missing-value');
    if (token.type === 'number') return { type: 'number', value: this.take().value };
    if (token.type === 'variable') return { type: 'variable', value: this.take().value };
    if (token.type === '(') return this.parseGroup();
    if (token.type === 'sqrt') {
      this.take('sqrt');
      if (!this.peek()) throw issue('incomplete', 'missing-radicand');
      if (!this.peek('(')) throw issue('invalid', 'root-requires-group');
      return { type: 'sqrt', value: this.parseGroup() };
    }
    if (token.type === 'frac') {
      this.take('frac');
      if (!this.peek()) throw issue('incomplete', 'missing-numerator');
      if (!this.peek('(')) throw issue('invalid', 'fraction-requires-groups');
      var numerator = this.parseGroup();
      if (!this.peek()) throw issue('incomplete', 'missing-denominator');
      if (!this.peek('(')) throw issue('invalid', 'fraction-requires-groups');
      return { type: 'div', left: numerator, right: this.parseGroup() };
    }
    if (token.type === ')') throw issue('invalid', 'unexpected-closing-group');
    throw issue('invalid', 'unexpected-token');
  };

  function serialize(node) {
    if (node.type === 'number') return 'n:' + String(Number(node.value));
    if (node.type === 'variable') return 'v:' + node.value;
    if (node.type === 'neg') return 'neg(' + serialize(node.value) + ')';
    if (node.type === 'sqrt') return 'sqrt(' + serialize(node.value) + ')';
    if (node.type === 'pow') return 'pow(' + serialize(node.base) + ',' + serialize(node.exponent) + ')';
    if (node.type === 'eq') return 'eq(' + serialize(node.left) + ',' + serialize(node.right) + ')';
    return node.type + '(' + serialize(node.left) + ',' + serialize(node.right) + ')';
  }

  function analyze(value) {
    var raw = String(value === undefined || value === null ? '' : value);
    if (!raw.trim()) return { status: 'empty', raw: raw, normalized: '', ast: null, code: 'empty' };
    try {
      var ast = new Parser(tokenize(raw)).parse();
      return { status: 'valid', raw: raw, normalized: serialize(ast), ast: ast, code: '' };
    } catch (error) {
      return {
        status: error.mathInputStatus || 'invalid',
        raw: raw,
        normalized: '',
        ast: null,
        code: error.code || 'invalid-syntax',
      };
    }
  }

  function normalizedValidator(input, answerSpec) {
    var candidates = [answerSpec.expected].concat(answerSpec.accepted || []);
    var accepted = candidates.map(analyze).filter(function(item) { return item.status === 'valid'; });
    if (!accepted.length) return { status: 'config-error', correct: false, code: 'invalid-answer-spec' };
    var matched = accepted.some(function(item) { return item.normalized === input.normalized; });
    return { status: matched ? 'correct' : 'incorrect', correct: matched, code: matched ? '' : 'not-accepted' };
  }

  VALIDATORS.normalized = normalizedValidator;

  /* A magnitude in degrees is deliberately narrower than a general math
     expression. It keeps the unit in the UI, while still accepting a few
     familiar written forms when restoring or checking an answer. */
  function analyzeNumericAngle(value) {
    var raw = String(value === undefined || value === null ? '' : value);
    var compact = raw.trim().replace(/[−–—]/g, '-');
    if (!compact) return { status: 'empty', raw: raw, normalized: '', ast: null, code: 'empty' };
    if (/^[-+]?([.,])?$/.test(compact)) {
      return { status: 'incomplete', raw: raw, normalized: '', ast: null, code: 'incomplete-number' };
    }
    /* Optional C = / ∠C = notation is accepted, but expressions such as
       180-52-71 stay outside this input type on purpose. */
    var match = compact.match(/^(?:(?:∠\s*)?[A-Za-zА-Яа-яЁё]\s*=\s*)?([-+]?(?:\d+(?:[.,]\d*)?|[.,]\d+))\s*(?:°|º)?$/);
    if (!match) return { status: 'invalid', raw: raw, normalized: '', ast: null, code: 'invalid-angle-number' };
    var numeric = Number(match[1].replace(',', '.'));
    if (!isFinite(numeric)) return { status: 'invalid', raw: raw, normalized: '', ast: null, code: 'invalid-angle-number' };
    return { status: 'valid', raw: raw, normalized: 'angle:n:' + String(numeric), ast: null, value: numeric, code: '' };
  }

  function numericAngleValidator(input, answerSpec) {
    var candidates = [answerSpec.expected].concat(answerSpec.accepted || []);
    var accepted = candidates.map(analyzeNumericAngle).filter(function(item) { return item.status === 'valid'; });
    if (!accepted.length) return { status: 'config-error', correct: false, code: 'invalid-answer-spec' };
    var matched = accepted.some(function(item) { return item.normalized === input.normalized; });
    return { status: matched ? 'correct' : 'incorrect', correct: matched, code: matched ? '' : 'not-accepted' };
  }

  VALIDATORS['numeric-angle'] = numericAngleValidator;

  function validate(value, answerSpec) {
    answerSpec = answerSpec || {};
    var isNumericAngle = answerSpec.kind === 'numeric-angle' || answerSpec.validation === 'numeric-angle';
    var input = isNumericAngle ? analyzeNumericAngle(value) : analyze(value);
    if (input.status !== 'valid') return Object.assign({ correct: false }, input);
    var validator = VALIDATORS[answerSpec.validation || (isNumericAngle ? 'numeric-angle' : 'normalized')];
    if (!validator) return Object.assign({ correct: false, status: 'config-error', code: 'unknown-validator' }, input);
    var result = validator(input, answerSpec);
    return Object.assign({}, input, result);
  }

  function matches(value, candidates, answerSpec) {
    var isNumericAngle = answerSpec && (answerSpec.kind === 'numeric-angle' || answerSpec.validation === 'numeric-angle');
    var analyzer = isNumericAngle ? analyzeNumericAngle : analyze;
    var input = analyzer(value);
    if (input.status !== 'valid') return false;
    return (candidates || []).some(function(candidate) {
      var expected = analyzer(candidate);
      return expected.status === 'valid' && expected.normalized === input.normalized;
    });
  }

  function text(key, fallback) {
    if (typeof I18N !== 'undefined' && I18N.t) {
      var translated = I18N.t('lesson.math.' + key);
      if (translated && translated !== 'lesson.math.' + key) return translated;
    }
    return fallback || key;
  }

  function keyboardLayout(config) {
    var groups = Array.isArray(config) ? config : config && config.groups;
    var variables = config && !Array.isArray(config) && Array.isArray(config.variables) ? config.variables : ['x', 'y'];
    groups = Array.isArray(groups) && groups.length ? groups : ['numbers', 'variables', 'operators', 'powers', 'fractions', 'roots'];
    variables = variables.map(String).filter(function(value) { return /^[A-Za-z]$/.test(value); }).slice(0, 6);
    var enabled = {};
    groups.forEach(function(group) { enabled[group] = true; });
    var rows = [];
    if (enabled.numbers) rows.push(['[1]', '[2]', '[3]', '[4]', '[5]', '[6]', '[7]', '[8]', '[9]', '[0]']);
    var basics = [];
    if (enabled.variables) basics = basics.concat(variables);
    if (enabled.operators) basics = basics.concat(['[+]', '[-]', '[*]', '[/]', '[(]', '[)]', '[=]']);
    if (basics.length) rows.push(basics.slice(0, 10));
    var structures = [];
    if (enabled.powers) structures = structures.concat([
      { label: '<i>x</i><sup>n</sup>', insert: '#@^{#?}', tooltip: text('power', 'Power') },
      { label: '<i>x</i><sup>2</sup>', insert: '#@^{2}', tooltip: text('square', 'Square') },
    ]);
    if (enabled.fractions) structures.push({ label: '¼', insert: '\\frac{#0}{#?}', tooltip: text('fraction', 'Fraction') });
    if (enabled.roots) structures.push({ latex: '\\sqrt{#0}', tooltip: text('root', 'Root') });
    structures = structures.concat([
      { label: '[left]', tooltip: text('left', 'Move left') },
      { label: '[right]', tooltip: text('right', 'Move right') },
      { label: '[backspace]', width: 1.5, tooltip: text('delete', 'Delete') },
      { label: '[hide-keyboard]', tooltip: text('hideKeyboard', 'Hide keyboard') },
    ]);
    rows.push(structures);
    return { label: 'GEOMAT', tooltip: text('keyboard', 'Math keyboard'), rows: rows };
  }

  function configureMathLive() {
    if (typeof MathfieldElement === 'undefined') return false;
    MathfieldElement.fontsDirectory = './fonts';
    MathfieldElement.soundsDirectory = null;
    MathfieldElement.keypressSound = null;
    MathfieldElement.plonkSound = null;
    MathfieldElement.locale = typeof ML !== 'undefined' && ML.getLang && ML.getLang() === 'kk' ? 'kk' : 'ru';
    return true;
  }

  function configureField(field, keyboard) {
    if (!field) return false;
    field.smartFence = true;
    field.smartSuperscript = true;
    field.mathVirtualKeyboardPolicy = 'auto';
    field.letterShapeStyle = 'tex';
    field.setAttribute('aria-label', text('answer', 'Answer'));
    field.setAttribute('aria-required', 'true');
    field.addEventListener('focusin', function() {
      if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.layouts = keyboardLayout(keyboard);
        window.mathVirtualKeyboard.editToolbar = 'none';
      }
    });
    return true;
  }

  function fieldValue(field) {
    if (!field) return '';
    try {
      if (typeof field.getValue === 'function') return field.getValue('latex');
    } catch (error) { /* fallback below */ }
    return String(field.value || field.textContent || '');
  }

  function registerValidator(name, validator) {
    if (typeof name !== 'string' || typeof validator !== 'function') return false;
    VALIDATORS[name] = validator;
    return true;
  }

  configureMathLive();

  return {
    version: '1.0.0',
    editor: 'MathLive 0.110.0',
    analyze: analyze,
    analyzeNumericAngle: analyzeNumericAngle,
    normalize: function(value) { return analyze(value).normalized; },
    validate: validate,
    matches: matches,
    keyboardLayout: keyboardLayout,
    configureMathLive: configureMathLive,
    configureField: configureField,
    fieldValue: fieldValue,
    registerValidator: registerValidator,
  };
})();
