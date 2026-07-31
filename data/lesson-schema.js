window.LESSON_SCHEMA = (function() {

  var SCHEMA_VERSION = '2.0.0';

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

  var BLOCK_VALIDATORS = {
    warmup: _checkAnswerBounds,
    quiz: _checkAnswerBounds,
    input: _checkInputFields,
    challenge: _checkChallengeTasks,
    result: _checkResultNextLesson,
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
          options: ['\u20135', '5', '6', '\u20136'],
          answer: 1,
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
              options: ['x\u00B2 \u2013 10x + 21 = 0', 'x\u00B2 + 10x + 21 = 0', 'x\u00B2 \u2013 10x \u2013 21 = 0', 'x\u00B2 + 10x \u2013 21 = 0'],
              answer: 0,
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
              options: ['\u201318', '18', '\u20137', '\u201311'],
              answer: 0,
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
