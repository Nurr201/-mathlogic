window.LESSON_SCHEMA = (function() {

  var SCHEMA_VERSION = '2.5.0';

  var REQUIRED_PER_TYPE = {
    hero: ['type', 'title'],
    goal: ['type', 'title', 'text'],
    warmup: ['type', 'question', 'options', 'answer'],
    anchor: ['type', 'title', 'problem'],
    theory: ['type', 'title'],
    quiz: ['type', 'question', 'options', 'answer'],
    input: ['type', 'question', 'fields', 'answer'],
    mistake: ['type', 'wrongSolution', 'correctSolution'],
    sandbox: ['type'],
    challenge: ['type', 'tasks'],
    reflection: ['type', 'questions'],
    result: ['type'],
    'factor-model': ['type', 'title', 'operation', 'base', 'leftCount', 'rightCount'],
    'worked-example': ['type', 'title', 'steps'],
    'guided-practice': ['type', 'question', 'responseType'],
    'math-response': ['type', 'question', 'answer'],
    'equation-step': ['type', 'title', 'initial', 'steps'],
    'graph-workspace': ['type', 'title', 'mode', 'viewport'],
    'geometry-workspace': ['type', 'title', 'mode', 'viewport', 'vertices'],
    'lesson-summary': ['type', 'title', 'capabilities'],
  };

  var KNOWN_FIELDS = {
    hero: ['id', 'type', 'icon', 'title', 'subtitle', 'teaser', 'visual'],
    goal: ['id', 'type', 'icon', 'title', 'text'],
    warmup: ['id', 'type', 'title', 'question', 'options', 'answer', 'points'],
    anchor: ['id', 'type', 'visual', 'title', 'problem', 'question'],
    theory: ['id', 'type', 'title', 'content', 'formula', 'formulaLabel', 'examples'],
    quiz: ['id', 'type', 'question', 'equation', 'options', 'answer', 'explanation', 'hint', 'points'],
    input: ['id', 'type', 'question', 'equation', 'fields', 'answer', 'explanation', 'points', 'unordered'],
    mistake: ['id', 'type', 'title', 'problem', 'wrongSolution', 'correctSolution', 'explanation'],
    sandbox: ['id', 'type', 'title', 'description', 'task', 'params', 'initialOutput'],
    challenge: ['id', 'type', 'title', 'tasks'],
    reflection: ['id', 'type', 'title', 'questions'],
    result: ['id', 'type', 'description', 'xp', 'nextLesson'],
    'factor-model': ['id', 'type', 'title', 'badgeLabel', 'intro', 'operation', 'base', 'leftCount', 'rightCount', 'result', 'ariaLabel', 'explanation'],
    'worked-example': ['id', 'type', 'title', 'badgeLabel', 'intro', 'expression', 'steps', 'result', 'formula', 'formulaLabel', 'conditions', 'takeaway'],
    'guided-practice': ['id', 'type', 'title', 'badgeLabel', 'prompt', 'expression', 'diagram', 'question', 'responseType', 'options', 'answer', 'acceptedAnswers', 'inputLabel', 'placeholder', 'hints', 'successFeedback', 'feedback', 'answerFeedback', 'role', 'points'],
    'math-response': ['id', 'type', 'title', 'badgeLabel', 'prompt', 'expression', 'question', 'inputLabel', 'answer', 'numericInput', 'keyboard', 'misconceptions', 'hints', 'successFeedback', 'feedback', 'role', 'points', 'compact', 'typingHelp'],
    'equation-step': ['id', 'type', 'title', 'badgeLabel', 'intro', 'initial', 'historyLabel', 'balanceModel', 'steps', 'keyboard', 'successTitle', 'successFeedback', 'role', 'points'],
    'graph-workspace': ['id', 'type', 'title', 'badgeLabel', 'intro', 'mode', 'viewport', 'function', 'plotPoints', 'referenceX', 'target', 'tolerance', 'rows', 'keyboard', 'showLine', 'revealLine', 'lineLabel', 'parameter', 'requiredValues', 'targetParameter', 'task', 'followUp', 'hints', 'successFeedback', 'feedback', 'misconceptions', 'role', 'points', 'uiLabels'],
    'geometry-workspace': ['id', 'type', 'title', 'badgeLabel', 'intro', 'mode', 'viewport', 'vertices', 'draggableVertices', 'constraints', 'keyboardStep', 'showMeasurements', 'showSum', 'task', 'requiredMoves', 'requiredCategories', 'categoryLabels', 'explorationGate', 'followUp', 'hints', 'successFeedback', 'feedback', 'role', 'points', 'auxiliaryAt', 'proofSteps'],
    'lesson-summary': ['id', 'type', 'title', 'description', 'capabilities', 'resultLabels', 'uiLabels', 'completesLesson', 'nextLesson'],
  };

  var TOP_LEVEL_KNOWN = ['id', 'title', 'description', 'subject', 'xp', 'blocks', 'meta', 'debug', 'schemaVersion'];

  var ANSWER_TYPES = ['warmup', 'quiz'];

  /* ------------------------------------------
     VALIDATION HELPERS
     ------------------------------------------ */

  function _checkAnswerBounds(block, errors, prefix) {
    if (block.answer === undefined) return;
    var optsLen = (block.options || []).length;
    if (block.answer < 0 || block.answer >= optsLen) {
      errors.push(prefix + ' answer (' + block.answer + ') is out of bounds for ' + optsLen + ' options');
    }
  }

  function _checkInputFields(block, errors, prefix) {
    if (!block.fields || !block.answer) return;
    if (block.fields.length !== block.answer.length) {
      errors.push(prefix + ' fields count (' + block.fields.length + ') does not match answer count (' + block.answer.length + ')');
    }
  }

  function _checkChallengeTasks(block, errors, prefix) {
    if (!block.tasks) return;
    block.tasks.forEach(function(task, ti) {
      var tp = prefix + '.tasks[' + ti + ']';
      if (!task.type || (task.type !== 'quiz' && task.type !== 'input')) {
        errors.push(tp + ' must have type "quiz" or "input"');
      }
      if (!task.question) {
        errors.push(tp + ' missing question');
      }
      if (task.type === 'quiz') {
        if (!task.options || !Array.isArray(task.options)) {
          errors.push(tp + ' missing options array');
        } else if (task.answer !== undefined) {
          if (task.answer < 0 || task.answer >= task.options.length) {
            errors.push(tp + ' answer is out of bounds');
          }
        }
      }
    });
  }

  function _checkResultNextLesson(block, errors, prefix) {
    if (block.nextLesson && (!block.nextLesson.title || !block.nextLesson.link)) {
      errors.push(prefix + ' nextLesson must have title and link');
    }
  }

  function _checkFactorModel(block, errors, prefix) {
    if (['multiply', 'divide'].indexOf(block.operation) === -1) errors.push(prefix + ' operation must be "multiply" or "divide"');
    if (Number(block.leftCount) < 1 || Number(block.rightCount) < 1) errors.push(prefix + ' factor counts must be positive');
    if (block.operation === 'divide' && Number(block.leftCount) <= Number(block.rightCount)) errors.push(prefix + ' division model requires leftCount > rightCount');
  }

  function _checkGuidedPractice(block, errors, prefix) {
    if (['choice', 'input'].indexOf(block.responseType) === -1) errors.push(prefix + ' responseType must be "choice" or "input"');
    if (block.responseType === 'choice') {
      if (!Array.isArray(block.options) || block.options.length < 2) errors.push(prefix + ' choice requires at least two options');
      else if (block.answer === undefined || block.answer < 0 || block.answer >= block.options.length) errors.push(prefix + ' answer is out of bounds');
    }
    if (block.responseType === 'input' && !Array.isArray(block.acceptedAnswers)) errors.push(prefix + ' input requires acceptedAnswers');
    if (block.hints !== undefined && !Array.isArray(block.hints)) errors.push(prefix + ' hints must be an array');
  }

  function _checkMathResponse(block, errors, prefix) {
    var keyboardGroups = ['numbers', 'variables', 'operators', 'powers', 'fractions', 'roots'];
    var answer = block.answer;
    if (!answer || typeof answer !== 'object') {
      errors.push(prefix + ' answer must be an object');
      return;
    }
    if (['expression', 'numeric-angle'].indexOf(answer.kind) === -1) errors.push(prefix + ' answer.kind must be "expression" or "numeric-angle"');
    if (typeof answer.expected !== 'string' || !answer.expected.trim()) errors.push(prefix + ' answer.expected must be a non-empty string');
    if (answer.validation && answer.validation !== 'normalized' && answer.validation !== 'numeric-angle') errors.push(prefix + ' uses an unsupported validator');
    if (answer.kind === 'numeric-angle' && answer.validation && answer.validation !== 'numeric-angle') errors.push(prefix + ' numeric-angle answers require the numeric-angle validator');
    if (answer.accepted !== undefined && !Array.isArray(answer.accepted)) errors.push(prefix + ' answer.accepted must be an array');
    else if (Array.isArray(answer.accepted) && answer.accepted.some(function(item) { return typeof item !== 'string'; })) errors.push(prefix + ' answer.accepted entries must be strings');
    if (block.keyboard !== undefined && !Array.isArray(block.keyboard) && (!block.keyboard || typeof block.keyboard !== 'object')) {
      errors.push(prefix + ' keyboard must be an array or object');
    } else if (Array.isArray(block.keyboard) && block.keyboard.some(function(group) { return keyboardGroups.indexOf(group) === -1; })) {
      errors.push(prefix + ' keyboard contains an unknown group');
    } else if (block.keyboard && !Array.isArray(block.keyboard)) {
      if (!Array.isArray(block.keyboard.groups) || block.keyboard.groups.some(function(group) { return keyboardGroups.indexOf(group) === -1; })) errors.push(prefix + ' keyboard.groups contains an unknown group');
      if (block.keyboard.variables !== undefined && (!Array.isArray(block.keyboard.variables) || block.keyboard.variables.some(function(value) { return typeof value !== 'string' || !/^[A-Za-z]$/.test(value); }))) errors.push(prefix + ' keyboard.variables must contain single Latin letters');
    }
    if (block.numericInput !== undefined) {
      if (!block.numericInput || typeof block.numericInput !== 'object') errors.push(prefix + ' numericInput must be an object');
      else ['prefix', 'suffix'].forEach(function(key) {
        if (block.numericInput[key] !== undefined && typeof block.numericInput[key] !== 'string') errors.push(prefix + '.numericInput.' + key + ' must be a string');
      });
    }
    if (block.hints !== undefined && !Array.isArray(block.hints)) errors.push(prefix + ' hints must be an array');
    if (block.misconceptions !== undefined && !Array.isArray(block.misconceptions)) {
      errors.push(prefix + ' misconceptions must be an array');
    } else if (Array.isArray(block.misconceptions)) {
      block.misconceptions.forEach(function(item, index) {
        var itemPrefix = prefix + '.misconceptions[' + index + ']';
        if (!item || typeof item !== 'object') errors.push(itemPrefix + ' must be an object');
        else {
          if (!item.code || typeof item.code !== 'string') errors.push(itemPrefix + ' requires a code');
          if (!Array.isArray(item.accepted) || item.accepted.length === 0) errors.push(itemPrefix + ' requires accepted forms');
          if (!item.feedback) errors.push(itemPrefix + ' requires feedback');
        }
      });
    }
  }

  function _checkEquationStep(block, errors, prefix) {
    if (typeof block.initial !== 'string' || !block.initial.trim()) errors.push(prefix + ' initial must be a non-empty string');
    if (!Array.isArray(block.steps) || block.steps.length === 0) {
      errors.push(prefix + ' steps must be a non-empty array');
      return;
    }
    block.steps.forEach(function(step, index) {
      var stepPrefix = prefix + '.steps[' + index + ']';
      if (!step || typeof step !== 'object') { errors.push(stepPrefix + ' must be an object'); return; }
      if (!step.prompt) errors.push(stepPrefix + ' requires prompt');
      if (!step.operationLabel) errors.push(stepPrefix + ' requires operationLabel');
      if (!step.result) errors.push(stepPrefix + ' requires result');
      if (!step.answer || step.answer.kind !== 'expression' || typeof step.answer.expected !== 'string') errors.push(stepPrefix + ' requires an expression answer');
      if (step.answer && step.answer.validation && step.answer.validation !== 'normalized') errors.push(stepPrefix + ' uses an unsupported validator');
      if (step.operationOptions !== undefined) {
        if (!Array.isArray(step.operationOptions) || step.operationOptions.length < 2) errors.push(stepPrefix + ' operationOptions must contain at least two choices');
        else if (!step.operationOptions.some(function(option, optionIndex) { return option && (option.correct === true || Number(step.operationAnswer) === optionIndex); })) errors.push(stepPrefix + ' requires one correct operation');
      }
      if (step.hints !== undefined && !Array.isArray(step.hints)) errors.push(stepPrefix + ' hints must be an array');
      if (step.misconceptions !== undefined && !Array.isArray(step.misconceptions)) errors.push(stepPrefix + ' misconceptions must be an array');
    });
  }

  function _isFiniteNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  function _checkGraphWorkspace(block, errors, prefix) {
    var modes = ['place-point', 'value-table', 'inspect', 'parameter'];
    if (modes.indexOf(block.mode) === -1) errors.push(prefix + ' mode must be place-point, value-table, inspect, or parameter');
    var viewport = block.viewport;
    if (!viewport || typeof viewport !== 'object') {
      errors.push(prefix + ' viewport must be an object');
    } else {
      ['xMin', 'xMax', 'yMin', 'yMax'].forEach(function(key) {
        if (!_isFiniteNumber(viewport[key])) errors.push(prefix + '.viewport.' + key + ' must be a finite number');
      });
      if (_isFiniteNumber(viewport.xMin) && _isFiniteNumber(viewport.xMax) && viewport.xMin >= viewport.xMax) errors.push(prefix + ' viewport requires xMin < xMax');
      if (_isFiniteNumber(viewport.yMin) && _isFiniteNumber(viewport.yMax) && viewport.yMin >= viewport.yMax) errors.push(prefix + ' viewport requires yMin < yMax');
      if (viewport.gridStep !== undefined && (!_isFiniteNumber(viewport.gridStep) || viewport.gridStep <= 0)) errors.push(prefix + ' viewport.gridStep must be positive');
      if (viewport.labelStep !== undefined && (!_isFiniteNumber(viewport.labelStep) || viewport.labelStep <= 0)) errors.push(prefix + ' viewport.labelStep must be positive');
    }
    if (block.function !== undefined) {
      if (!block.function || block.function.type !== 'linear') errors.push(prefix + ' function.type must be "linear"');
      else {
        if (!_isFiniteNumber(block.function.k)) errors.push(prefix + ' function.k must be a finite number');
        if (!_isFiniteNumber(block.function.b)) errors.push(prefix + ' function.b must be a finite number');
      }
    }
    function checkPoint(point, pointPrefix) {
      if (!point || !_isFiniteNumber(point.x) || !_isFiniteNumber(point.y)) errors.push(pointPrefix + ' requires finite x and y');
    }
    if (block.plotPoints !== undefined) {
      if (!Array.isArray(block.plotPoints)) errors.push(prefix + ' plotPoints must be an array');
      else block.plotPoints.forEach(function(point, index) { checkPoint(point, prefix + '.plotPoints[' + index + ']'); });
    }
    if (block.referenceX !== undefined && (!Array.isArray(block.referenceX) || block.referenceX.some(function(value) { return !_isFiniteNumber(value); }))) errors.push(prefix + ' referenceX must contain finite numbers');
    if (block.mode === 'place-point') checkPoint(block.target, prefix + '.target');
    if (block.mode === 'value-table') {
      if (!block.function) errors.push(prefix + ' value-table requires function');
      if (!Array.isArray(block.rows) || block.rows.length < 2) errors.push(prefix + ' value-table requires at least two rows');
      else block.rows.forEach(function(row, index) {
        if (!row || !_isFiniteNumber(row.x) || !_isFiniteNumber(row.y)) errors.push(prefix + '.rows[' + index + '] requires finite x and y');
      });
    }
    if (block.mode === 'parameter') {
      var parameter = block.parameter;
      if (!parameter || ['k', 'b'].indexOf(parameter.name) === -1) errors.push(prefix + ' parameter.name must be k or b');
      else {
        ['min', 'max', 'step', 'initial'].forEach(function(key) {
          if (!_isFiniteNumber(parameter[key])) errors.push(prefix + '.parameter.' + key + ' must be a finite number');
        });
        if (_isFiniteNumber(parameter.min) && _isFiniteNumber(parameter.max) && parameter.min >= parameter.max) errors.push(prefix + ' parameter requires min < max');
        if (_isFiniteNumber(parameter.step) && parameter.step <= 0) errors.push(prefix + ' parameter.step must be positive');
      }
      if (block.requiredValues !== undefined && (!Array.isArray(block.requiredValues) || block.requiredValues.some(function(value) { return !_isFiniteNumber(value); }))) errors.push(prefix + ' requiredValues must contain finite numbers');
    }
    if (block.followUp !== undefined) {
      if (!block.followUp || !Array.isArray(block.followUp.options) || block.followUp.options.length < 2) errors.push(prefix + ' followUp requires at least two options');
      else if (!Number.isInteger(block.followUp.answer) || block.followUp.answer < 0 || block.followUp.answer >= block.followUp.options.length) errors.push(prefix + ' followUp.answer is out of bounds');
    }
    if (block.hints !== undefined && !Array.isArray(block.hints)) errors.push(prefix + ' hints must be an array');
    if (block.tolerance !== undefined && (!_isFiniteNumber(block.tolerance) || block.tolerance <= 0)) errors.push(prefix + ' tolerance must be positive');
  }

  function _checkGeometryWorkspace(block, errors, prefix) {
    var modes = ['explore', 'proof'];
    if (modes.indexOf(block.mode) === -1) errors.push(prefix + ' mode must be explore or proof');
    var viewport = block.viewport;
    if (!viewport || typeof viewport !== 'object') {
      errors.push(prefix + ' viewport must be an object');
    } else {
      ['xMin', 'xMax', 'yMin', 'yMax'].forEach(function(key) {
        if (!_isFiniteNumber(viewport[key])) errors.push(prefix + '.viewport.' + key + ' must be a finite number');
      });
      if (_isFiniteNumber(viewport.xMin) && _isFiniteNumber(viewport.xMax) && viewport.xMin >= viewport.xMax) errors.push(prefix + ' viewport requires xMin < xMax');
      if (_isFiniteNumber(viewport.yMin) && _isFiniteNumber(viewport.yMax) && viewport.yMin >= viewport.yMax) errors.push(prefix + ' viewport requires yMin < yMax');
    }
    var vertices = block.vertices;
    if (!vertices || typeof vertices !== 'object') {
      errors.push(prefix + ' vertices must be an object');
    } else {
      ['A', 'B', 'C'].forEach(function(id) {
        var point = vertices[id];
        if (!point || !_isFiniteNumber(point.x) || !_isFiniteNumber(point.y)) errors.push(prefix + '.vertices.' + id + ' requires finite x and y');
      });
      var hasFiniteTriangle = ['A', 'B', 'C'].every(function(id) {
        return vertices[id] && _isFiniteNumber(vertices[id].x) && _isFiniteNumber(vertices[id].y);
      });
      if (hasFiniteTriangle) {
        var twiceArea = Math.abs(
          (vertices.B.x - vertices.A.x) * (vertices.C.y - vertices.A.y) -
          (vertices.B.y - vertices.A.y) * (vertices.C.x - vertices.A.x)
        );
        var minimumArea = block.constraints && _isFiniteNumber(block.constraints.minArea) ? block.constraints.minArea : 1.2;
        if (twiceArea / 2 < minimumArea) errors.push(prefix + ' initial vertices form a degenerate or too narrow triangle');
      }
    }
    if (block.draggableVertices !== undefined && (!Array.isArray(block.draggableVertices) || block.draggableVertices.some(function(id) { return ['A', 'B', 'C'].indexOf(id) === -1; }))) errors.push(prefix + ' draggableVertices may only reference A, B, or C');
    if (block.constraints !== undefined) {
      if (!block.constraints || typeof block.constraints !== 'object') errors.push(prefix + ' constraints must be an object');
      else ['minArea', 'minSide'].forEach(function(key) {
        if (block.constraints[key] !== undefined && (!_isFiniteNumber(block.constraints[key]) || block.constraints[key] <= 0)) errors.push(prefix + '.constraints.' + key + ' must be positive');
      });
    }
    if (block.requiredMoves !== undefined && (!Number.isInteger(block.requiredMoves) || block.requiredMoves < 0)) errors.push(prefix + ' requiredMoves must be a non-negative integer');
    if (block.requiredCategories !== undefined) {
      var categories = ['acute', 'right', 'obtuse', 'narrow'];
      if (!Array.isArray(block.requiredCategories) || block.requiredCategories.some(function(category) { return categories.indexOf(category) === -1; })) errors.push(prefix + ' requiredCategories contains an unsupported category');
    }
    if (block.followUp !== undefined) {
      if (!block.followUp || !Array.isArray(block.followUp.options) || block.followUp.options.length < 2) errors.push(prefix + ' followUp requires at least two options');
      else if (!Number.isInteger(block.followUp.answer) || block.followUp.answer < 0 || block.followUp.answer >= block.followUp.options.length) errors.push(prefix + ' followUp.answer is out of bounds');
    }
    if (block.mode === 'proof') {
      if (!Array.isArray(block.proofSteps) || block.proofSteps.length < 3) errors.push(prefix + ' proof mode requires at least three proofSteps');
      if (block.auxiliaryAt !== undefined && block.auxiliaryAt !== 'A') errors.push(prefix + ' auxiliaryAt currently supports A only');
    }
    if (block.hints !== undefined && !Array.isArray(block.hints)) errors.push(prefix + ' hints must be an array');
  }

  var BLOCK_VALIDATORS = {
    warmup: _checkAnswerBounds,
    quiz: _checkAnswerBounds,
    input: _checkInputFields,
    challenge: _checkChallengeTasks,
    result: _checkResultNextLesson,
    'factor-model': _checkFactorModel,
    'guided-practice': _checkGuidedPractice,
    'math-response': _checkMathResponse,
    'equation-step': _checkEquationStep,
    'graph-workspace': _checkGraphWorkspace,
    'geometry-workspace': _checkGeometryWorkspace,
    'lesson-summary': _checkResultNextLesson,
  };

  /* ------------------------------------------
     VALIDATE A SINGLE BLOCK
     ------------------------------------------ */

  function _validateBlock(block, i, errors, warnings, seenIds) {
    var prefix = 'blocks[' + i + ']';

    if (!block || typeof block !== 'object') {
      errors.push(prefix + ' must be an object');
      return;
    }

    if (!block.type) {
      errors.push(prefix + ' missing required field: type');
      return;
    }

    var required = REQUIRED_PER_TYPE[block.type];
    if (!required) {
      errors.push(prefix + ' unknown block type: "' + block.type + '"');
      warnings.push(prefix + ' type "' + block.type + '" is not registered — validate LessonBlocks.has("' + block.type + '")');
      return;
    }

    required.forEach(function(field) {
      if (block[field] === undefined || block[field] === null) {
        errors.push(prefix + ' (' + block.type + ') missing required field: ' + field);
      }
    });

    var known = KNOWN_FIELDS[block.type] || ['id', 'type'];
    Object.keys(block).forEach(function(key) {
      if (known.indexOf(key) === -1) {
        warnings.push(prefix + ' (' + block.type + ') unknown field: "' + key + '"');
      }
    });

    if (block.id) {
      if (seenIds[block.id]) {
        errors.push('Duplicate block id "' + block.id + '" at ' + prefix + ' (first seen at blocks[' + seenIds[block.id] + '])');
      } else {
        seenIds[block.id] = i;
      }
    }

    /* per-type validation */
    var validator = BLOCK_VALIDATORS[block.type];
    if (validator) {
      validator(block, errors, prefix);
    }
  }

  /* ------------------------------------------
     MAIN VALIDATE
     ------------------------------------------ */

  function validate(config) {
    var errors = [];
    var warnings = [];
    var seenIds = {};

    if (!config || typeof config !== 'object') {
      errors.push('Config must be an object');
      return { valid: false, errors: errors, warnings: warnings };
    }

    /* top-level required fields */
    ['id', 'title'].forEach(function(field) {
      if (!config[field]) {
        errors.push('Missing required top-level field: ' + field);
      }
    });

    if (!config.blocks || !Array.isArray(config.blocks)) {
      errors.push('Missing required top-level field: blocks (must be an array)');
      return { valid: errors.length === 0, errors: errors, warnings: warnings };
    }

    if (config.blocks.length === 0) {
      errors.push('blocks array is empty — at least one block is required');
    }

    config.blocks.forEach(function(block, i) {
      _validateBlock(block, i, errors, warnings, seenIds);
    });

    var routeStages = config.meta && config.meta.routeStages;
    if (routeStages !== undefined) {
      if (!Array.isArray(routeStages) || routeStages.length === 0) {
        errors.push('meta.routeStages must be a non-empty array');
      } else {
        var previousThrough = -1;
        routeStages.forEach(function(stage, index) {
          var prefix = 'meta.routeStages[' + index + ']';
          if (!stage || !stage.id || !stage.label) errors.push(prefix + ' requires id and label');
          if (!stage || !Number.isInteger(Number(stage.through)) || Number(stage.through) <= previousThrough) {
            errors.push(prefix + ' through must be an increasing integer');
          } else {
            previousThrough = Number(stage.through);
          }
        });
        if (previousThrough < config.blocks.length - 1) errors.push('meta.routeStages must cover every block');
      }
    }

    Object.keys(config).forEach(function(key) {
      if (TOP_LEVEL_KNOWN.indexOf(key) === -1) {
        warnings.push('Unknown top-level field: "' + key + '"');
      }
    });

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
    };
  }

  /* ------------------------------------------
     DEFAULTS
     ------------------------------------------ */

  function getDefault() {
    return {
      schemaVersion: SCHEMA_VERSION,
      id: '',
      title: '',
      description: '',
      subject: '',
      xp: 50,
      blocks: [],
      meta: {
        difficulty: 1,
        estimatedTime: 300,
        prerequisites: [],
        tags: [],
      },
    };
  }

  /* ------------------------------------------
     PUBLIC API
     ------------------------------------------ */

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,

    example: {
      schemaVersion: SCHEMA_VERSION,
      id: 'algebra.vieta.intro',
      title: '\u0412\u0438\u0435\u0442 \u0442\u0435\u043E\u0440\u0435\u043C\u0430\u0441\u044B',
      description: '\u0420\u0435\u0448\u0435\u043D\u0438\u0435 \u043A\u0432\u0430\u0434\u0440\u0430\u0442\u043D\u044B\u0445 \u0443\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0439 \u0447\u0435\u0440\u0435\u0437 \u0442\u0435\u043E\u0440\u0435\u043C\u0443 \u0412\u0438\u0435\u0442\u0430',
      subject: 'algebra',
      xp: 50,

      blocks: [

        {
          id: 'intro',
          type: 'hero',
          icon: '\uD83E\uDDE9',
          title: 'x\u00B2 \u2014 8x + 15 = 0',
          subtitle: '\u0422\u044B \u0440\u0435\u0448\u0438\u0448\u044C \u044D\u0442\u043E \u0437\u0430 10 \u0441\u0435\u043A\u0443\u043D\u0434. \u0411\u0435\u0437 \u0434\u0438\u0441\u043A\u0440\u0438\u043C\u0438\u043D\u0430\u043D\u0442\u0430.',
          teaser: '\u041A\u0430\u043A? \u0422\u0435\u043E\u0440\u0435\u043C\u0430 \u0412\u0438\u0435\u0442\u0430.',
        },

        {
          id: 'goal',
          type: 'goal',
          icon: '\uD83C\uDFAF',
          title: '\u0427\u0435\u043C\u0443 \u0442\u044B \u043D\u0430\u0443\u0447\u0438\u0448\u044C\u0441\u044F',
          text: '\u0420\u0435\u0448\u0430\u0442\u044C \u043A\u0432\u0430\u0434\u0440\u0430\u0442\u043D\u044B\u0435 \u0443\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u0432\u0438\u0434\u0430 x\u00B2 + px + q = 0 \u0443\u0441\u0442\u043D\u043E \u0437\u0430 5\u201310 \u0441\u0435\u043A\u0443\u043D\u0434.',
        },

        {
          id: 'warmup',
          type: 'warmup',
          question: '\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0431\u0443\u0434\u0435\u0442 3 \u00D7 4?',
          options: ['7', '12', '14', '9'],
          answer: 1,
        },

        {
          id: 'anchor',
          type: 'anchor',
          visual: '<div class="w-48 h-32 bg-blue-50 rounded-2xl border-2 border-blue-200 flex items-center justify-center text-2xl font-bold text-blue-700 mx-auto">S = 12, P = 14</div>',
          title: '\u041F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A \u0441 \u0441\u0435\u043A\u0440\u0435\u0442\u043E\u043C',
          problem: '\u0423 \u0442\u0435\u0431\u044F \u0435\u0441\u0442\u044C \u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A. \u041F\u043B\u043E\u0449\u0430\u0434\u044C = 12, \u043F\u0435\u0440\u0438\u043C\u0435\u0442\u0440 = 14. \u041A\u0430\u043A \u043D\u0430\u0439\u0442\u0438 \u0435\u0433\u043E \u0441\u0442\u043E\u0440\u043E\u043D\u044B? \u041C\u043E\u0436\u043D\u043E \u043F\u043E\u0434\u0431\u043E\u0440\u043E\u043C, \u043D\u043E \u044D\u0442\u043E \u0434\u043E\u043B\u0433\u043E.',
          question: '\u0410 \u0435\u0441\u043B\u0438 \u044F \u0441\u043A\u0430\u0436\u0443, \u0447\u0442\u043E \u0435\u0441\u0442\u044C \u0444\u043E\u0440\u043C\u0443\u043B\u0430, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0434\u0430\u0451\u0442 \u043E\u0442\u0432\u0435\u0442 \u0437\u0430 5 \u0441\u0435\u043A\u0443\u043D\u0434?',
        },

        {
          id: 'theory_1',
          type: 'theory',
          title: '\u0422\u0435\u043E\u0440\u0435\u043C\u0430 \u0412\u0438\u0435\u0442\u0430',
          content: [
            '\u0415\u0441\u043B\u0438 \u043A\u0432\u0430\u0434\u0440\u0430\u0442\u043D\u043E\u0435 \u0443\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u0438\u043C\u0435\u0435\u0442 \u0432\u0438\u0434 x\u00B2 + px + q = 0 \u0438 \u0435\u0433\u043E \u043A\u043E\u0440\u043D\u0438 \u2014 \u044D\u0442\u043E x\u2081 \u0438 x\u2082, \u0442\u043E:',
            { type: 'highlight', text: '\u0421\u0443\u043C\u043C\u0430 \u043A\u043E\u0440\u043D\u0435\u0439 \u0440\u0430\u0432\u043D\u0430 \u2013p, \u0430 \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u0440\u0430\u0432\u043D\u043E q.' },
          ],
          formula: 'x\u2081 + x\u2082 = \u2013p \\quad \\cdot \\quad x\u2081 \u00D7 x\u2082 = q',
          formulaLabel: '\u0424\u043E\u0440\u043C\u0443\u043B\u0430 \u0412\u0438\u0435\u0442\u0430',
          examples: [
            {
              equation: 'x\u00B2 \u2013 7x + 12 = 0',
              steps: [
                { label: '1. \u041D\u0430\u0445\u043E\u0434\u0438\u043C p \u0438 q:', text: 'p = \u20137, q = 12' },
                { label: '2. \u0421\u0443\u043C\u043C\u0430:', text: 'x\u2081 + x\u2082 = \u2013(\u20137) = 7' },
                { label: '3. \u041F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435:', text: 'x\u2081 \u00D7 x\u2082 = 12' },
                { label: '4. \u041F\u043E\u0434\u0431\u043E\u0440:', text: '\u041A\u0430\u043A\u0438\u0435 \u0447\u0438\u0441\u043B\u0430 \u0432 \u0441\u0443\u043C\u043C\u0435 \u0434\u0430\u044E\u0442 7, \u0430 \u0432 \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0438 12?' },
              ],
              result: 'x\u2081 = 3, x\u2082 = 4',
            },
          ],
        },

        {
          id: 'quiz_1',
          type: 'quiz',
          question: '\u0414\u043B\u044F \u0443\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F x\u00B2 \u2013 5x + 6 = 0 \u0447\u0435\u043C\u0443 \u0440\u0430\u0432\u043D\u0430 \u0441\u0443\u043C\u043C\u0430 \u043A\u043E\u0440\u043D\u0435\u0439?',
          equation: 'x\u00B2 \u2013 5x + 6 = 0',
          options: ['\u20135', '6', '5', '\u20136'],
          answer: 2,
          explanation: 'p = \u20135, \u0437\u043D\u0430\u0447\u0438\u0442 \u2013p = 5. \u0421\u0443\u043C\u043C\u0430 \u043A\u043E\u0440\u043D\u0435\u0439 \u0440\u0430\u0432\u043D\u0430 5.',
        },

        {
          id: 'mistake_1',
          type: 'mistake',
          title: '\u0427\u0430\u0441\u0442\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430',
          problem: '\u041C\u043D\u043E\u0433\u0438\u0435 \u0434\u0443\u043C\u0430\u044E\u0442, \u0447\u0442\u043E \u0441\u0443\u043C\u043C\u0430 \u043A\u043E\u0440\u043D\u0435\u0439 \u044D\u0442\u043E \u043F\u0440\u043E\u0441\u0442\u043E p. \u041D\u043E \u044D\u0442\u043E \u043D\u0435 \u0442\u0430\u043A.',
          wrongSolution: 'x\u00B2 \u2013 7x + 12 = 0 \u2192 x\u2081 + x\u2082 = \u20137',
          correctSolution: 'x\u00B2 \u2013 7x + 12 = 0 \u2192 x\u2081 + x\u2082 = \u2013(\u20137) = 7',
          explanation: '\u0412 \u0444\u043E\u0440\u043C\u0443\u043B\u0435 x\u2081 + x\u2082 = \u2013p. \u0415\u0441\u043B\u0438 p = \u20137, \u0442\u043E \u2013p = 7. \u041D\u0435 \u0437\u0430\u0431\u044B\u0432\u0430\u0439 \u043F\u0440\u043E \u0437\u043D\u0430\u043A \u043C\u0438\u043D\u0443\u0441!',
        },

        {
          id: 'theory_2',
          type: 'theory',
          title: '\u0410\u043B\u0433\u043E\u0440\u0438\u0442\u043C \u043F\u043E\u0434\u0431\u043E\u0440\u0430 \u043A\u043E\u0440\u043D\u0435\u0439',
          content: [
            '\u0422\u0435\u043F\u0435\u0440\u044C \u0433\u043B\u0430\u0432\u043D\u043E\u0435: \u043A\u0430\u043A \u043F\u043E\u0434\u0431\u0438\u0440\u0430\u0442\u044C \u0447\u0438\u0441\u043B\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u0434\u0430\u044E\u0442 \u043D\u0443\u0436\u043D\u0443\u044E \u0441\u0443\u043C\u043C\u0443 \u0438 \u043D\u0443\u0436\u043D\u043E\u0435 \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435.',
            { type: 'note', text: '\u0412\u0441\u0435\u0433\u0434\u0430 \u043D\u0430\u0447\u0438\u043D\u0430\u0439 \u0441 \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F (q). \u041F\u043E\u0442\u043E\u043C \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0439 \u0441\u0443\u043C\u043C\u0443 (\u2013p).' },
          ],
          examples: [
            {
              equation: 'x\u00B2 + 3x \u2013 10 = 0',
              steps: [
                { label: '1. p \u0438 q:', text: 'p = 3, q = \u201310' },
                { label: '2. \u0421\u0443\u043C\u043C\u0430:', text: 'x\u2081 + x\u2082 = \u20133 (\u043E\u0431\u0440\u0430\u0442\u0438 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u0435: \u0437\u043D\u0430\u043A \u043C\u0438\u043D\u0443\u0441!)' },
                { label: '3. \u041F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435:', text: 'x\u2081 \u00D7 x\u2082 = \u201310 (\u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u2014 \u0437\u043D\u0430\u0447\u0438\u0442 \u043A\u043E\u0440\u043D\u0438 \u0440\u0430\u0437\u043D\u044B\u0445 \u0437\u043D\u0430\u043A\u043E\u0432)' },
                { label: '4. \u041F\u043E\u0434\u0431\u043E\u0440:', text: '\u041F\u0430\u0440\u044B: (1, \u201310), (2, \u20135), (\u20132, 5). \u041A\u0430\u043A\u0430\u044F \u0432 \u0441\u0443\u043C\u043C\u0435 \u0434\u0430\u0451\u0442 \u20133? 2 + (\u20135) = \u20133.' },
              ],
              result: 'x\u2081 = 2, x\u2082 = \u20135',
            },
          ],
        },

        {
          id: 'quiz_2',
          type: 'quiz',
          question: '\u041D\u0430\u0439\u0434\u0438 \u043A\u043E\u0440\u043D\u0438 \u0443\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F',
          equation: 'x\u00B2 \u2013 11x + 30 = 0',
          options: ['5 \u0438 6', '\u20135 \u0438 \u20136', '3 \u0438 10', '\u20133 \u0438 \u201310'],
          answer: 0,
          explanation: '\u0421\u0443\u043C\u043C\u0430 = 11, \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 = 30. 5 + 6 = 11, 5 \u00D7 6 = 30.',
        },

        {
          id: 'input_1',
          type: 'input',
          question: '\u041D\u0430\u0439\u0434\u0438 \u043A\u043E\u0440\u043D\u0438',
          equation: 'x\u00B2 \u2013 8x + 15 = 0',
          fields: [
            { label: 'x\u2081 =', type: 'number', placeholder: '?' },
            { label: 'x\u2082 =', type: 'number', placeholder: '?' },
          ],
          answer: [3, 5],
          unordered: true,
          explanation: '\u0421\u0443\u043C\u043C\u0430 = 8, \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 = 15. \u041F\u043E\u0434\u0445\u043E\u0434\u044F\u0442 3 \u0438 5.',
        },

        {
          id: 'sandbox_1',
          type: 'sandbox',
          title: '\u041F\u043E\u0438\u0433\u0440\u0430\u0439 \u0441 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u043C\u0438',
          description: '\u0418\u0437\u043C\u0435\u043D\u044F\u0439 p \u0438 q \u0438 \u043D\u0430\u0431\u043B\u044E\u0434\u0430\u0439, \u043A\u0430\u043A \u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u043A\u043E\u0440\u043D\u0438.',
          task: '\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C p \u0438 q \u0442\u0430\u043A, \u0447\u0442\u043E\u0431\u044B \u043E\u0431\u0430 \u043A\u043E\u0440\u043D\u044F \u0431\u044B\u043B\u0438 \u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u043C\u0438.',
          params: [
            { label: 'p', min: -15, max: 15, default: -7 },
            { label: 'q', min: -15, max: 15, default: 12 },
          ],
        },

        {
          id: 'challenge_1',
          type: 'challenge',
          title: '\u0424\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u0430\u0443\u043D\u0434',
          tasks: [
            {
              type: 'quiz',
              question: '\u0423 \u043A\u0430\u043A\u043E\u0433\u043E \u0443\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u043A\u043E\u0440\u043D\u0438 3 \u0438 7?',
              options: ['x\u00B2 + 10x + 21 = 0', 'x\u00B2 \u2013 10x \u2013 21 = 0', 'x\u00B2 + 10x \u2013 21 = 0', 'x\u00B2 \u2013 10x + 21 = 0'],
              answer: 3,
            },
            {
              type: 'input',
              question: '\u041D\u0430\u0439\u0434\u0438 \u043A\u043E\u0440\u043D\u0438: x\u00B2 + 8x + 15 = 0',
              answer: [-3, -5],
              placeholder: '?',
            },
            {
              type: 'quiz',
              question: '\u0427\u0435\u043C\u0443 \u0440\u0430\u0432\u043D\u043E q, \u0435\u0441\u043B\u0438 \u043A\u043E\u0440\u043D\u0438 \u2014 \u044D\u0442\u043E 2 \u0438 \u20139?',
              options: ['18', '\u201318', '\u20137', '\u201311'],
              answer: 1,
              explanation: 'q = 2 \u00D7 (\u20139) = \u201318',
            },
          ],
        },

        {
          id: 'reflect_1',
          type: 'reflection',
          title: '\u041E\u0441\u043C\u044B\u0441\u043B\u0438 \u043F\u0440\u043E\u0439\u0434\u0435\u043D\u043D\u043E\u0435',
          questions: [
            {
              type: 'choice',
              text: '\u0427\u0442\u043E \u043D\u043E\u0432\u043E\u0433\u043E \u0442\u044B \u0443\u0437\u043D\u0430\u043B?',
              options: ['\u0422\u0435\u043E\u0440\u0435\u043C\u0443 \u0412\u0438\u0435\u0442\u0430', '\u0424\u043E\u0440\u043C\u0443\u043B\u0443 \u0434\u0438\u0441\u043A\u0440\u0438\u043C\u0438\u043D\u0430\u043D\u0442\u0430', '\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u043E\u0432\u043E\u0433\u043E'],
            },
            {
              type: 'rate',
              text: '\u041A\u0430\u043A \u043F\u043E\u043D\u044F\u0442\u043D\u043E \u0431\u044B\u043B\u043E \u043E\u0431\u044A\u044F\u0441\u043D\u0435\u043D\u0438\u0435?',
            },
          ],
        },

        {
          id: 'result',
          type: 'result',
          description: '\u0422\u044B \u043D\u0430\u0443\u0447\u0438\u043B\u0441\u044F \u0440\u0435\u0448\u0430\u0442\u044C \u043A\u0432\u0430\u0434\u0440\u0430\u0442\u043D\u044B\u0435 \u0443\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u0447\u0435\u0440\u0435\u0437 \u0442\u0435\u043E\u0440\u0435\u043C\u0443 \u0412\u0438\u0435\u0442\u0430!',
          xp: 50,
          nextLesson: {
            title: '\u041F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0442\u0435\u043E\u0440\u0435\u043C\u044B \u0412\u0438\u0435\u0442\u0430',
            link: 'dashboard.html',
          },
        },
      ],

      meta: {
        difficulty: 2,
        estimatedTime: 480,
        prerequisites: ['linear_equations'],
        tags: ['quadratic', 'vieta', 'mental_math'],
      },
    },

    validate: validate,
    getDefault: getDefault,
  };

})();

window.LessonValidator = {
  validate: function(config) {
    return LESSON_SCHEMA.validate(config);
  },
};

/* Production-конфигурация примера. Отдельное имя позволяет реестру
   загрузить урок без копирования его HTML или схемы. */
window.LESSON_VIETA = JSON.parse(JSON.stringify(LESSON_SCHEMA.example));
