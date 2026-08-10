/* Dependency-free smoke checks for storage and canonical lesson lifecycle. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCES = [
  'data/curriculum.js', 'js/data.js', 'js/storage.js', 'js/i18n.js', 'js/events.js', 'js/learning.js',
  'data/lesson-schema.js', 'data/lessons/natural-exponent-meaning.js', 'data/lessons/exponents.js', 'data/lessons/power-rules.js', 'data/lessons/zero-negative-exponents.js', 'data/lessons/standard-form.js',
  'data/lessons/fractions.js', 'data/lessons/percent.js', 'data/lessons/proportions.js',
  'data/lessons/parts-mixtures.js', 'data/lessons/model.js', 'data/lessons/practice.js',
  'data/lessons/monomials-standard-form.js', 'data/lessons/polynomials-add-subtract.js', 'data/lessons/monomial-polynomial-multiplication.js',
  'data/lessons/square-sum-difference.js', 'data/lessons/difference-squares.js', 'data/lessons/cube-identities.js',
  'data/lessons/factorization.js', 'data/lessons/polynomial-transformations-practice.js',
  'data/lessons/linear-equations.js', 'data/lessons/linear-functions.js', 'data/lessons/triangle-angle-sum.js',
];

function createStorage(initial) {
  const values = Object.assign({}, initial || {});
  return {
    get length() { return Object.keys(values).length; },
    key(index) { return Object.keys(values)[index] || null; },
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { values[key] = String(value); },
    removeItem(key) { delete values[key]; },
    dump() { return Object.assign({}, values); },
  };
}

function boot(initialStorage) {
  const listeners = {};
  const context = {
    console,
    localStorage: createStorage(initialStorage),
    CustomEvent: function(name, options) { this.type = name; this.detail = options && options.detail; },
    document: {
      body: null,
      documentElement: { dataset: {}, style: { setProperty() {} } },
      addEventListener(name, callback) { (listeners[name] = listeners[name] || []).push(callback); },
      dispatchEvent(event) { (listeners[event.type] || []).forEach(function(callback) { callback(event); }); },
    },
    addEventListener() {},
    matchMedia() { return { matches: false }; },
    setTimeout,
    clearTimeout,
  };
  context.window = context;
  vm.createContext(context);
  SOURCES.forEach(function(file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  });
  return {
    context,
    run(code) { return vm.runInContext(code, context); },
  };
}

function testCanonicalLifecycle() {
  const app = boot();
  assert.equal(app.run("Learning.getLessonStatus('algebra.g7.alg-02.meaning')"), 'available');
  assert.equal(app.run("Learning.getLessonStatus('algebra.exponents.basics')"), 'available');
  assert.equal(app.run("Learning.getLessonStatus('algebra.g7.alg-04.property')"), 'locked');
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson('algebra.exponents.basics').prerequisites.hard")), ['algebra.g7.alg-02.meaning']);
  app.run("Learning.completeLesson('algebra.g7.alg-02.meaning',{percentage:100,correctAnswers:1,totalQuestions:1})");
  assert.equal(app.run("Learning.getLessonStatus('algebra.exponents.basics')"), 'available');
  app.run("ML.setLessonSession('algebra.exponents.basics',{completedBlocks:[0],currentIndex:1})");
  assert.equal(app.run("Learning.getLessonStatus('algebra.exponents.basics')"), 'current');

  const first = app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:80,correctAnswers:4,totalQuestions:5,duration:30})");
  assert.equal(first.xpEarned, 0);
  assert.equal(app.run("ML.getLessonSession('algebra.exponents.basics')"), null);
  assert.ok(app.run("Object.keys(ML.get('progress.subtopics')).length") > 0);
  const repeated = app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5})");
  assert.equal(repeated.xpEarned, 0);
  assert.equal(app.run("ML.get('user.xp')"), 0);
  assert.equal(app.run("Object.keys(ML.get('rewards',{})).length"), 0);
  app.run("Learning.resetLesson('algebra.exponents.basics')");
  assert.ok(app.run("Object.keys(ML.get('progress.subtopics')).length") > 0);
  assert.equal(app.run("ML.get('stats.lessons_completed')"), 1);
  const afterReset = app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5})");
  assert.equal(afterReset.xpEarned, 0);
  assert.equal(app.run("ML.get('user.xp')"), 0);
}

function testRegistryAndConfigs() {
  const app = boot();
  const ids = app.run('Object.keys(LESSON_REGISTRY)');
  assert.deepEqual(Array.from(ids), ['algebra.g7.alg-01.fractions', 'algebra.g7.alg-01.percent', 'algebra.g7.alg-01.proportions', 'algebra.g7.alg-01.parts-mixtures', 'algebra.g7.alg-01.model', 'algebra.g7.alg-01.practice', 'algebra.g7.alg-02.meaning', 'algebra.exponents.basics', 'algebra.g7.alg-02.power-rules', 'algebra.g7.alg-02.zero-negative', 'algebra.g7.alg-02.standard-form', 'algebra.g7.alg-03.monomials', 'algebra.g7.alg-03.polynomials', 'algebra.g7.alg-03.multiplication', 'algebra.g7.alg-03.square-sum-difference', 'algebra.g7.alg-03.difference-squares', 'algebra.g7.alg-03.cubes', 'algebra.g7.alg-03.factorization', 'algebra.g7.alg-03.practice', 'algebra.linear-equations.equivalent-transformations', 'algebra.linear-functions.graph', 'algebra.vieta.intro', 'geometry.triangle-angle-sum']);
  assert.equal(new Set(ids).size, ids.length);
  ['LESSON_ALG01_FRACTIONS', 'LESSON_ALG01_PERCENT', 'LESSON_ALG01_PROPORTIONS', 'LESSON_ALG01_PARTS_MIXTURES', 'LESSON_ALG01_MODEL', 'LESSON_ALG01_PRACTICE'].forEach(function(globalName) {
    assert.equal(app.run('LessonValidator.validate(' + globalName + ').valid'), true);
  });
  assert.equal(app.run("LessonValidator.validate(LESSON_NATURAL_EXPONENT_MEANING).valid"), true);
  assert.equal(app.run("LESSON_NATURAL_EXPONENT_MEANING.blocks.length"), 14);
  assert.equal(app.run("LESSON_NATURAL_EXPONENT_MEANING.blocks.filter(function(block){return block.type==='math-response';}).length"), 3);
  assert.equal(app.run("LESSON_NATURAL_EXPONENT_MEANING.blocks.some(function(block){return block.id==='meaning-not-coefficient'&&block.answer===2;})"), true);
  assert.equal(app.run("LESSON_NATURAL_EXPONENT_MEANING.blocks.some(function(block){return block.id==='transfer-seven-factors'&&block.answer.expected==='p^7';})"), true);
  assert.equal(app.run("LESSON_NATURAL_EXPONENT_MEANING.blocks[13].type"), 'lesson-summary');
  assert.equal(app.run("LESSON_NATURAL_EXPONENT_MEANING.title.kk"), 'Натурал көрсеткішті дәреже');
  assert.equal(app.run("LessonValidator.validate(LESSON_EXPONENTS).valid"), true);
  assert.equal(app.run("LessonValidator.validate(LESSON_EXPONENTS).warnings.length"), 0);
  assert.equal(app.run("LESSON_EXPONENTS.blocks.length"), 23);
  assert.equal(app.run("LESSON_EXPONENTS.schemaVersion"), '2.2.0');
  assert.equal(app.run("LESSON_EXPONENTS.blocks.filter(function(block){return block.type==='math-response';}).length"), 5);
  assert.equal(app.run("LESSON_EXPONENTS.blocks.some(function(block){return block.id==='multiply_pair_problem'&&block.answer.expected==='x^7';})"), true);
  assert.equal(app.run("LESSON_EXPONENTS.blocks[0].id"), 'prerequisite_meaning');
  assert.equal(app.run("LESSON_EXPONENTS.blocks.some(function(block){return block.id==='multiply_factor_model'&&block.type==='factor-model';})"), true);
  assert.equal(app.run("LESSON_EXPONENTS.blocks.some(function(block){return block.id==='multiply_misconception'&&block.type==='guided-practice';})"), true);
  assert.equal(app.run("LESSON_EXPONENTS.blocks.some(function(block){return block.id==='division_factor_model'&&block.type==='factor-model';})"), true);
  assert.equal(app.run("LESSON_EXPONENTS.blocks.some(function(block){return block.id==='transfer_chain'&&block.role==='transfer';})"), true);
  assert.equal(app.run("LESSON_EXPONENTS.blocks[22].type"), 'lesson-summary');
  assert.equal(app.run("LESSON_EXPONENTS.meta.routeStages.length"), 5);
  assert.equal(app.run("LESSON_EXPONENTS.title.kk"), 'Негіздері бірдей дәрежелерді көбейту және бөлу');
  assert.equal(app.run("LessonValidator.validate(LESSON_POWER_RULES).valid"), true);
  assert.equal(app.run("LESSON_POWER_RULES.blocks.length"), 10);
  assert.equal(app.run("LESSON_POWER_RULES.blocks.some(function(block){return block.id==='final-transfer'&&block.role==='final';})"), true);
  assert.equal(app.run("LESSON_POWER_RULES.title.kk"), 'Көбейтіндінің, бөліндінің және дәреженің дәрежесі');
  assert.equal(app.run("LessonValidator.validate(LESSON_ZERO_NEGATIVE_EXPONENTS).valid"), true);
  assert.equal(app.run("LESSON_ZERO_NEGATIVE_EXPONENTS.blocks.length"), 10);
  assert.equal(app.run("LESSON_ZERO_NEGATIVE_EXPONENTS.blocks.some(function(block){return block.id==='negative-not-sign'&&block.answer===1;})"), true);
  assert.equal(app.run("LESSON_ZERO_NEGATIVE_EXPONENTS.title.kk"), 'Нөлдік және теріс көрсеткіш');
  assert.equal(app.run("LessonValidator.validate(LESSON_STANDARD_FORM).valid"), true);
  assert.equal(app.run("LESSON_STANDARD_FORM.blocks.length"), 10);
  assert.equal(app.run("LESSON_STANDARD_FORM.blocks.some(function(block){return block.id==='practical-transfer'&&block.role==='transfer';})"), true);
  assert.equal(app.run("LESSON_STANDARD_FORM.title.kk"), 'Санның стандарт түрі және практикалық шамалар');
  assert.equal(app.run("LessonValidator.validate(LESSON_MONOMIALS_STANDARD_FORM).valid"), true);
  assert.equal(app.run("LESSON_MONOMIALS_STANDARD_FORM.blocks.length"), 10);
  assert.equal(app.run("LESSON_MONOMIALS_STANDARD_FORM.blocks.filter(function(block){return block.type==='math-response';}).length"), 3);
  assert.equal(app.run("LESSON_MONOMIALS_STANDARD_FORM.blocks.some(function(block){return block.id==='volume-transfer'&&block.role==='transfer';})"), true);
  assert.equal(app.run("LESSON_MONOMIALS_STANDARD_FORM.title.kk"), 'Бірмүшелер және стандарт түр');
  assert.equal(app.run("LessonValidator.validate(LESSON_POLYNOMIALS_ADD_SUBTRACT).valid"), true);
  assert.equal(app.run("LESSON_POLYNOMIALS_ADD_SUBTRACT.blocks.length"), 10);
  assert.equal(app.run("LESSON_POLYNOMIALS_ADD_SUBTRACT.blocks.some(function(block){return block.id==='subtraction-meaning'&&block.type==='worked-example';})"), true);
  assert.equal(app.run("LESSON_POLYNOMIALS_ADD_SUBTRACT.blocks.some(function(block){return block.id==='mixed-transfer'&&block.role==='transfer';})"), true);
  assert.equal(app.run("LESSON_POLYNOMIALS_ADD_SUBTRACT.title.kk"), 'Көпмүшелерді қосу және азайту');
  assert.equal(app.run("LessonValidator.validate(LESSON_MONOMIAL_POLYNOMIAL_MULTIPLICATION).valid"), true);
  assert.equal(app.run("LESSON_MONOMIAL_POLYNOMIAL_MULTIPLICATION.blocks.length"), 11);
  assert.equal(app.run("LESSON_MONOMIAL_POLYNOMIAL_MULTIPLICATION.blocks.some(function(block){return block.id==='polynomial-product-meaning'&&block.type==='theory';})"), true);
  assert.equal(app.run("LESSON_MONOMIAL_POLYNOMIAL_MULTIPLICATION.blocks.some(function(block){return block.id==='trinomial-transfer'&&block.role==='transfer';})"), true);
  assert.equal(app.run("LESSON_MONOMIAL_POLYNOMIAL_MULTIPLICATION.title.kk"), 'Бірмүшелер мен көпмүшелерді көбейту');
  [
    ['LESSON_SQUARE_SUM_DIFFERENCE',10,'area-transfer','Қосынды мен айырманың квадраты'],
    ['LESSON_DIFFERENCE_SQUARES',10,'numeric-transfer','Квадраттар айырмасы'],
    ['LESSON_CUBE_IDENTITIES',11,'combined-transfer','Кубтар формулалары'],
  ].forEach(function(item) {
    assert.equal(app.run('LessonValidator.validate(' + item[0] + ').valid'), true);
    assert.equal(app.run('LessonValidator.validate(' + item[0] + ').warnings.length'), 0);
    assert.equal(app.run(item[0] + '.blocks.length'), item[1]);
    assert.equal(app.run(item[0] + ".blocks.some(function(block){return block.id==='" + item[2] + "'&&block.role==='transfer';})"), true);
    assert.equal(app.run(item[0] + '.title.kk'), item[3]);
  });
  assert.equal(app.run("LessonValidator.validate(LESSON_VIETA).valid"), true);
  assert.equal(app.run("LessonValidator.validate(LESSON_LINEAR_EQUATIONS).valid"), true);
  assert.equal(app.run("LessonValidator.validate(LESSON_LINEAR_EQUATIONS).warnings.length"), 0);
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.blocks.length"), 20);
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.schemaVersion"), '2.3.0');
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.blocks.filter(function(block){return block.type==='equation-step';}).length"), 6);
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.blocks[0].id"), 'prerequisite_obvious_root');
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.blocks.some(function(block){return block.id==='meaning_probe'&&block.role==='conceptual';})"), true);
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.blocks.some(function(block){return block.id==='balance_one_step'&&block.balanceModel;})"), true);
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.blocks.some(function(block){return block.id==='paired_two_step'&&block.steps.length===2;})"), true);
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.blocks.some(function(block){return block.id==='transfer_model'&&block.role==='transfer';})"), true);
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.blocks[19].type"), 'lesson-summary');
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.meta.routeStages.length"), 5);
  assert.equal(app.run("LESSON_LINEAR_EQUATIONS.title.kk"), 'Сызықтық теңдеулер');
  assert.equal(app.run("LessonValidator.validate(LESSON_LINEAR_FUNCTIONS).valid"), true);
  assert.equal(app.run("LessonValidator.validate(LESSON_LINEAR_FUNCTIONS).warnings.length"), 0);
  assert.equal(app.run("LESSON_LINEAR_FUNCTIONS.blocks.length"), 20);
  assert.equal(app.run("LESSON_LINEAR_FUNCTIONS.schemaVersion"), '2.4.0');
  assert.equal(app.run("LESSON_LINEAR_FUNCTIONS.blocks.filter(function(block){return block.type==='graph-workspace';}).length"), 9);
  assert.equal(app.run("LESSON_LINEAR_FUNCTIONS.blocks.some(function(block){return block.id==='build_value_table'&&block.mode==='value-table';})"), true);
  assert.equal(app.run("LESSON_LINEAR_FUNCTIONS.blocks.some(function(block){return block.id==='explore_negative_k'&&block.parameter.min<0;})"), true);
  assert.equal(app.run("LESSON_LINEAR_FUNCTIONS.blocks.some(function(block){return block.id==='transfer_table_graph'&&block.role==='transfer';})"), true);
  assert.equal(app.run("LESSON_LINEAR_FUNCTIONS.title.kk"), 'Сызықтық функция және оның графигі');
  assert.equal(app.run("LessonValidator.validate(LESSON_TRIANGLE_ANGLE_SUM).valid"), true);
  assert.equal(app.run("LessonValidator.validate(LESSON_TRIANGLE_ANGLE_SUM).warnings.length"), 0);
  assert.equal(app.run("LESSON_TRIANGLE_ANGLE_SUM.blocks.length"), 18);
  assert.equal(app.run("LESSON_TRIANGLE_ANGLE_SUM.schemaVersion"), '2.5.0');
  assert.equal(app.run("LESSON_TRIANGLE_ANGLE_SUM.blocks.filter(function(block){return block.type==='geometry-workspace';}).length"), 3);
  assert.equal(app.run("LESSON_TRIANGLE_ANGLE_SUM.blocks.some(function(block){return block.id==='test_distinct_triangles'&&block.requiredCategories.indexOf('obtuse')>-1;})"), true);
  assert.equal(app.run("LESSON_TRIANGLE_ANGLE_SUM.blocks.some(function(block){return block.id==='triangle_angle_proof'&&block.mode==='proof'&&block.proofSteps.length===4;})"), true);
  assert.equal(app.run("LESSON_TRIANGLE_ANGLE_SUM.blocks.some(function(block){return block.id==='obtuse_transfer'&&block.role==='transfer';})"), true);
  assert.equal(app.run("LESSON_TRIANGLE_ANGLE_SUM.blocks[17].type"), 'lesson-summary');
  assert.equal(app.run("LESSON_TRIANGLE_ANGLE_SUM.title.kk"), 'Үшбұрыш бұрыштарының қосындысы');
  assert.equal(app.run("LESSON_REGISTRY['geometry.triangle-angle-sum'].config"), 'LESSON_TRIANGLE_ANGLE_SUM');
  assert.equal(app.run("Learning.resolveLessonId('algebra_1')"), 'algebra.exponents.basics');
  assert.equal(app.run("Learning.resolveLessonId('lesson.html')"), 'algebra.vieta.intro');
  assert.equal(app.run("Learning.getTopic('algebra','ALG-02.powers').id"), 'ALG-02.powers');
  assert.equal(app.run("Learning.getTopic('algebra','ALG-02.core').id"), 'ALG-02.powers');
  assert.equal(app.run("Learning.getTopic('algebra','ALG-05.function-representations').id"), 'ALG-05.function-representations');
  assert.equal(app.run("Learning.getLesson('unknown.lesson')"), null);
}

function testRecommendedPathContext() {
  const app = boot();
  assert.equal(app.run("Learning.getNextLesson({subjectKey:'algebra',grade:7}).id"), 'algebra.linear-equations.equivalent-transformations');
  assert.equal(app.run("Learning.getNextLesson({subjectKey:'algebra',grade:8}).id"), 'algebra.vieta.intro');
  assert.equal(app.run("Learning.getNextLesson({subjectKey:'geometry',grade:7}).id"), 'geometry.triangle-angle-sum');

  app.run("Learning.completeLesson('algebra.g7.alg-01.fractions',{percentage:100});Learning.completeLesson('algebra.g7.alg-01.percent',{percentage:100});Learning.completeLesson('algebra.g7.alg-01.proportions',{percentage:100});Learning.completeLesson('algebra.g7.alg-01.parts-mixtures',{percentage:100});Learning.completeLesson('algebra.g7.alg-01.model',{percentage:100});Learning.completeLesson('algebra.g7.alg-01.practice',{percentage:100});Learning.completeLesson('algebra.g7.alg-02.meaning',{percentage:100});Learning.completeLesson('algebra.linear-equations.equivalent-transformations',{percentage:100});Learning.completeLesson('algebra.exponents.basics',{percentage:100});Learning.completeLesson('algebra.g7.alg-02.power-rules',{percentage:100});Learning.completeLesson('algebra.g7.alg-02.zero-negative',{percentage:100});Learning.completeLesson('algebra.g7.alg-02.standard-form',{percentage:100});Learning.completeLesson('algebra.g7.alg-03.monomials',{percentage:100});Learning.completeLesson('algebra.g7.alg-03.polynomials',{percentage:100});Learning.completeLesson('algebra.g7.alg-03.multiplication',{percentage:100});Learning.completeLesson('algebra.g7.alg-03.square-sum-difference',{percentage:100});Learning.completeLesson('algebra.g7.alg-03.difference-squares',{percentage:100});Learning.completeLesson('algebra.g7.alg-03.cubes',{percentage:100});Learning.completeLesson('algebra.g7.alg-03.factorization',{percentage:100});Learning.completeLesson('algebra.g7.alg-03.practice',{percentage:100});Learning.completeLesson('algebra.linear-functions.graph',{percentage:100})");
  assert.equal(app.run("Learning.getNextLesson({subjectKey:'algebra',grade:7})"), null, 'next lesson must not jump to another grade');
  assert.equal(app.run("Learning.getNextLesson({subjectKey:'algebra',grade:8}).id"), 'algebra.vieta.intro');
}

function testPowersTopicIntegration() {
  const app = boot();
  const ids = [
    'algebra.g7.alg-02.meaning',
    'algebra.exponents.basics',
    'algebra.g7.alg-02.power-rules',
    'algebra.g7.alg-02.zero-negative'
  ];
  const standardFormId = 'algebra.g7.alg-02.standard-form';
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getTopic('ALG-02.powers').lessonIds")), ids);
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getTopic('ALG-02.standard-form').lessonIds")), [standardFormId]);
  ids.forEach(function(id) {
    assert.equal(app.run("MATHLOGIC_CURRICULUM.getLesson(" + JSON.stringify(id) + ").productionStatus"), id === 'algebra.exponents.basics' ? 'reference' : 'implemented');
    assert.equal(app.run("LESSON_REGISTRY[" + JSON.stringify(id) + "].route"), 'lesson.html?id=' + id);
    assert.equal(app.run("Learning.getLesson(" + JSON.stringify(id) + ").hasContent"), true);
  });
  assert.equal(app.run("MATHLOGIC_CURRICULUM.getLesson(" + JSON.stringify(standardFormId) + ").productionStatus"), 'implemented');
  assert.equal(app.run("LESSON_REGISTRY[" + JSON.stringify(standardFormId) + "].route"), 'lesson.html?id=' + standardFormId);
  assert.equal(app.run("Learning.getLesson(" + JSON.stringify(standardFormId) + ").hasContent"), true);
  assert.equal(app.run("Learning.getTopics('algebra').find(function(topic){return topic.id==='ALG-02.powers';}).totalLessons"), 4);
  assert.equal(app.run("Learning.getTopics('algebra').find(function(topic){return topic.id==='ALG-02.powers';}).plannedLessons"), 0);
  assert.equal(app.run("Learning.getNextLessonId('algebra.g7.alg-02.meaning')"), ids[1]);
  assert.equal(app.run("Learning.getNextLessonId('algebra.exponents.basics')"), ids[2]);
  assert.equal(app.run("Learning.getNextLessonId('algebra.g7.alg-02.power-rules')"), ids[3]);
  assert.equal(app.run("Learning.getNextLessonId('algebra.g7.alg-02.zero-negative')"), 'algebra.g7.alg-02.standard-form');
  assert.equal(app.run("Learning.getNextLessonId('algebra.g7.alg-02.standard-form')"), 'algebra.g7.alg-03.monomials');
  app.run("Learning.completeLesson('algebra.g7.alg-02.meaning',{percentage:100})");
  assert.equal(app.run("Learning.getLessonStatus('algebra.exponents.basics')"), 'available');
  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100})");
  assert.equal(app.run("Learning.getLessonStatus('algebra.g7.alg-02.power-rules')"), 'available');
  app.run("Learning.completeLesson('algebra.g7.alg-02.power-rules',{percentage:100})");
  assert.equal(app.run("Learning.getLessonStatus('algebra.g7.alg-02.zero-negative')"), 'available');
  app.run("Learning.completeLesson('algebra.g7.alg-02.zero-negative',{percentage:100})");
  assert.equal(app.run("Learning.getLessonStatus('algebra.g7.alg-02.standard-form')"), 'available');
  assert.equal(app.run("Learning.getTopicProgress('algebra','ALG-02.powers')"), 100);
  assert.equal(app.run("Learning.getLessonStatus('algebra.exponents.basics')"), 'completed');
}

function testMonomialsPolynomialsTopicIntegration() {
  const app = boot();
  const ids = ['algebra.g7.alg-03.monomials','algebra.g7.alg-03.polynomials','algebra.g7.alg-03.multiplication'];
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getTopic('ALG-03.monomials-polynomials').lessonIds")), ids);
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson('algebra.g7.alg-03.monomials').curriculumCodes")), ['7.2.1.2-4']);
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson('algebra.g7.alg-03.polynomials').curriculumCodes")), ['7.2.1.5-7']);
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson('algebra.g7.alg-03.multiplication').curriculumCodes")), ['7.2.1.8-9']);
  ids.forEach(function(id) {
    assert.equal(app.run("MATHLOGIC_CURRICULUM.getLesson(" + JSON.stringify(id) + ").productionStatus"), 'implemented');
    assert.equal(app.run("LESSON_REGISTRY[" + JSON.stringify(id) + "].route"), 'lesson.html?id=' + id);
    assert.equal(app.run("Learning.getLesson(" + JSON.stringify(id) + ").hasContent"), true);
  });
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson('algebra.g7.alg-03.monomials').prerequisites.hard")), []);
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson('algebra.g7.alg-03.monomials').prerequisites.soft")), ['ALG-02']);
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson('algebra.g7.alg-03.polynomials').prerequisites.hard")), [ids[0]]);
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson('algebra.g7.alg-03.multiplication').prerequisites.hard")), [ids[1]]);
  assert.equal(app.run("Learning.getNextLessonId('algebra.g7.alg-02.standard-form')"), ids[0]);
  assert.equal(app.run("Learning.getNextLessonId(" + JSON.stringify(ids[0]) + ")"), ids[1]);
  assert.equal(app.run("Learning.getNextLessonId(" + JSON.stringify(ids[1]) + ")"), ids[2]);
  assert.equal(app.run("Learning.getNextLessonId(" + JSON.stringify(ids[2]) + ")"), 'algebra.g7.alg-03.square-sum-difference');
  app.run("Learning.completeLesson('algebra.g7.alg-02.standard-form',{percentage:100})");
  assert.equal(app.run("Learning.getLessonStatus(" + JSON.stringify(ids[0]) + ")"), 'available');
  app.run("Learning.completeLesson(" + JSON.stringify(ids[0]) + ",{percentage:100})");
  assert.equal(app.run("Learning.getLessonStatus(" + JSON.stringify(ids[1]) + ")"), 'available');
  app.run("Learning.completeLesson(" + JSON.stringify(ids[1]) + ",{percentage:100})");
  assert.equal(app.run("Learning.getLessonStatus(" + JSON.stringify(ids[2]) + ")"), 'available');
}

function testIdentityTopicIntegration() {
  const app = boot();
  const ids = [
    'algebra.g7.alg-03.square-sum-difference',
    'algebra.g7.alg-03.difference-squares',
    'algebra.g7.alg-03.cubes',
  ];
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getTopic('ALG-03.identities').lessonIds")), ids);
  ids.forEach(function(id) {
    assert.equal(app.run("MATHLOGIC_CURRICULUM.getLesson(" + JSON.stringify(id) + ").productionStatus"), 'implemented');
    assert.equal(app.run("LESSON_REGISTRY[" + JSON.stringify(id) + "].route"), 'lesson.html?id=' + id);
    assert.equal(app.run("Learning.getLesson(" + JSON.stringify(id) + ").hasContent"), true);
  });
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson(" + JSON.stringify(ids[0]) + ").prerequisites.hard")), ['algebra.g7.alg-03.multiplication']);
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson(" + JSON.stringify(ids[1]) + ").prerequisites.hard")), [ids[0]]);
  assert.deepEqual(Array.from(app.run("MATHLOGIC_CURRICULUM.getLesson(" + JSON.stringify(ids[2]) + ").prerequisites.hard")), [ids[1]]);
  assert.equal(app.run("Learning.getNextLessonId('algebra.g7.alg-03.multiplication')"), ids[0]);
  assert.equal(app.run("Learning.getNextLessonId(" + JSON.stringify(ids[0]) + ")"), ids[1]);
  assert.equal(app.run("Learning.getNextLessonId(" + JSON.stringify(ids[1]) + ")"), ids[2]);
  assert.equal(app.run("Learning.getNextLessonId(" + JSON.stringify(ids[2]) + ")"), 'algebra.g7.alg-03.factorization');
  app.run("Learning.completeLesson('algebra.g7.alg-03.multiplication',{percentage:100})");
  assert.equal(app.run("Learning.getLessonStatus(" + JSON.stringify(ids[0]) + ")"), 'available');
  app.run("Learning.completeLesson(" + JSON.stringify(ids[0]) + ",{percentage:100})");
  assert.equal(app.run("Learning.getLessonStatus(" + JSON.stringify(ids[1]) + ")"), 'available');
  app.run("Learning.completeLesson(" + JSON.stringify(ids[1]) + ",{percentage:100})");
  assert.equal(app.run("Learning.getLessonStatus(" + JSON.stringify(ids[2]) + ")"), 'available');
  assert.equal(app.run("Learning.getTopics('algebra').find(function(topic){return topic.id==='ALG-03.identities';}).plannedLessons"), 0);
}

function testLegacyMigration() {
  const legacy = {
    version: 1,
    user: { xp: 40, loggedIn: true },
    progress: { lessonStates: { algebra_1: 'completed' }, lessons: {} },
    lesson: { v2: { algebra_1: { completedBlocks: [0, 1], currentIndex: 2 } } },
    dashboard: { quests: { legacy: true } },
    dailyQuests: [{ id: 'quest_login' }],
  };
  const app = boot({ mathlogic_data: JSON.stringify(legacy), ml_dash_state: '{"legacy":true}' });
  assert.equal(app.run("Learning.getLessonStatus('algebra.exponents.basics')"), 'completed');
  assert.equal(app.run("ML.get('progress.lessons.algebra_1',null)"), null);
  assert.equal(app.run("ML.getLessonSession('algebra.exponents.basics').currentIndex"), 2);
  assert.equal(app.run("Object.keys(ML.get('rewards',{})).length"), 0);
  assert.equal(app.run("ML.get('dashboard',null)"), null);
  assert.equal(app.run("ML.get('dailyQuests',null)"), null);
  assert.equal(app.context.localStorage.getItem('ml_dash_state'), null);
  assert.equal(app.run("ML.get('version')"), 2);
}

function testScatteredLegacyMigration() {
  const app = boot({
    math_logic_user: JSON.stringify({ name: 'Legacy', loggedIn: true, xp: 125 }),
    math_logic_lang: 'ru',
    profile_stat_lessons_completed: '4',
    profile_streak_data: JSON.stringify({ current: 2, best: 4, total: 7, days: ['2026-07-30', '2026-07-31'] }),
  });
  assert.equal(app.run("ML.get('user.name')"), 'Legacy');
  assert.equal(app.run("ML.get('settings.lang')"), 'ru');
  assert.equal(app.run("ML.get('user.streak')"), 2);
  assert.equal(app.run("ML.get('activity.dates').length"), 2);
  assert.equal(app.context.localStorage.getItem('profile_streak_data'), null);
}

function testLanguageCompatibility() {
  const app = boot();
  assert.equal(app.run('ML.getLang()'), 'kk');
  app.run("ML.setLang('kz')");
  assert.equal(app.run('ML.getLang()'), 'kk');
  assert.equal(app.run("ML.get('settings.lang')"), 'kk');
  app.run("ML.setSetting('lang','kk')");
  assert.equal(app.run('I18N.getLang()'), 'kk');
  assert.equal(app.run("I18N.t('lesson.repeat','kz')"), 'Қайталап оқу');
  assert.equal(app.run("I18N.localize({title:'RU',titleKz:'KK'},'title','kk')"), 'KK');
  app.run("ML.setSetting('lang','ru')");
  assert.equal(app.run('ML.getLang()'), 'ru');

  const legacy = boot({ math_logic_lang: 'kz' });
  assert.equal(legacy.run('ML.getLang()'), 'kk');
  assert.equal(legacy.run("ML.get('settings.lang')"), 'kk');

  const savedLegacy = boot({ mathlogic_data: JSON.stringify({ version: 2, settings: { lang: 'kz' } }) });
  assert.equal(savedLegacy.run('ML.getLang()'), 'kk');
  assert.equal(savedLegacy.run("ML.get('settings.lang')"), 'kk');
}

function testLearningReset() {
  const app = boot();
  app.run("ML.setUser({name:'Test',loggedIn:true});ML.setLang('ru');Learning.completeLesson('algebra.vieta.intro',{percentage:100,correctAnswers:3,totalQuestions:3});Learning.resetAll()");
  assert.equal(app.run("ML.get('settings.lang')"), 'ru');
  assert.equal(app.run("ML.get('user.name')"), 'Test');
  assert.equal(app.run("ML.get('user.loggedIn')"), true);
  assert.equal(app.run('Object.keys(ML.getCompletedLessons()).length'), 0);
  assert.equal(app.run("Object.keys(ML.get('rewards',{})).length"), 0);
}

function testTargetedLessonReset() {
  const app = boot();
  const completedAt = new Date(2026, 7, 10, 12, 0).getTime();
  app.run("ML.setLang('ru');ML.setSetting('theme','dark');ML.setUser({name:'QA',xp:77});" +
    "Learning.completeLesson('algebra.exponents.basics',{percentage:80,correctAnswers:4,totalQuestions:5,duration:120,completedAt:" + completedAt + "});" +
    "Learning.completeLesson('algebra.vieta.intro',{percentage:100,correctAnswers:3,totalQuestions:3,duration:300,completedAt:" + (completedAt + 1000) + "});" +
    "ML.setLessonSession('algebra.exponents.basics',{completedBlocks:[0,1],currentIndex:2,interactionStates:{1:{attemptCount:2}}})");
  assert.equal(app.run("ML.getActivityByDate(new Date(" + completedAt + ")).seconds"), 420);
  assert.equal(app.run("ML.getLearningHistory({lessonId:'algebra.exponents.basics'}).length"), 1);

  app.run("Learning.resetLesson('algebra.exponents.basics')");
  assert.equal(app.run("ML.getLessonSession('algebra.exponents.basics')"), null);
  assert.equal(app.run("Learning.getLessonStatus('algebra.exponents.basics')"), 'available');
  assert.equal(app.run("Learning.getLessonStatus('algebra.vieta.intro')"), 'completed');
  assert.equal(app.run("ML.getLearningHistory({lessonId:'algebra.exponents.basics'}).length"), 0);
  assert.equal(app.run("ML.getLearningHistory({lessonId:'algebra.vieta.intro'}).length"), 1);
  assert.equal(app.run("ML.getActivityByDate(new Date(" + completedAt + ")).seconds"), 300);
  assert.equal(app.run("ML.get('settings.lang')"), 'ru');
  assert.equal(app.run("ML.get('settings.theme')"), 'dark');
  assert.equal(app.run("ML.get('user.name')"), 'QA');
  assert.equal(app.run("ML.get('user.xp')"), 77);

  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5,duration:120,completedAt:" + (completedAt + 2000) + "})");
  assert.equal(app.run("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.exponents.basics'}).length"), 1);
  assert.equal(app.run("ML.getActivityByDate(new Date(" + completedAt + ")).seconds"), 420);
}

function testSubjectReset() {
  const app = boot();
  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5});Learning.completeLesson('algebra.vieta.intro',{percentage:100,correctAnswers:3,totalQuestions:3})");
  app.run("Learning.resetSubject('algebra')");
  assert.equal(app.run('Object.keys(ML.getCompletedLessons()).length'), 0);
  assert.equal(app.run("Object.keys(ML.get('progress.subtopics')).length"), 0);
  assert.equal(app.run("ML.get('stats.lessons_completed')"), 0);
  assert.equal(app.run("Object.keys(ML.get('rewards')).length"), 0);
}

function testCorruptStorageFallback() {
  const app = boot({ mathlogic_data: '{broken json' });
  assert.equal(app.run("ML.get('version')"), 2);
  assert.ok(app.run('ML.getDiagnostics().length') > 0);
}

function testCompletionDoesNotMutateLegacyGameFields() {
  const app = boot({ mathlogic_data: JSON.stringify({ version: 2, user: { xp: 125, streak: 4 }, rewards: { legacy: { amount: 10 } }, achievements: [{ id: 'legacy' }] }) });
  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5,duration:20})");
  assert.equal(app.run("ML.get('user.xp')"), 125);
  assert.equal(app.run("ML.get('user.streak')"), 4);
  assert.equal(app.run("Object.keys(ML.get('rewards')).length"), 1);
  assert.equal(app.run("ML.get('achievements').length"), 1);
  assert.equal(app.run("ML.get('activity.dates').length"), 1);
}

function testActivityHistory() {
  const app = boot();
  assert.equal(app.run('ML.getActivityRange().length'), 365);
  assert.equal(app.run('ML.getActivityRange().filter(function(day){return day.active;}).length'), 0);

  const today = boot();
  today.run('ML.recordLearningActivity(90)');
  assert.equal(today.run('ML.getActivityByDate().active'), true);
  assert.equal(today.run('ML.getActivityByDate().seconds'), 90);
  assert.equal(today.run('ML.getActivityRange().filter(function(day){return day.active;}).length'), 1);

  app.run("ML.recordLearningActivity(120,new Date(2024,1,29,23,30).getTime())");
  assert.equal(app.run("ML.getActivityByDate('2024-02-29').active"), true);
  assert.equal(app.run("ML.getActivityByDate('2024-02-29').seconds"), 120);
  assert.equal(app.run("ML.getActivityByDate('2024-02-29').intensity"), 1);

  app.run("ML.recordLearningActivity(300,new Date(2024,1,29,23,45).getTime())");
  assert.equal(app.run("ML.getActivityByDate('2024-02-29').seconds"), 420);
  assert.equal(app.run("ML.getActivityByDate('2024-02-29').intensity"), 2);
  assert.equal(app.run("ML.get('activity.dates').filter(function(day){return day==='2024-02-29';}).length"), 1);

  app.run("ML.recordLearningActivity(900,new Date(2024,2,1,0,15).getTime())");
  assert.deepEqual(Array.from(app.run("ML.getActivityRange('2024-02-28','2024-03-01').map(function(day){return day.date;})")), ['2024-02-28', '2024-02-29', '2024-03-01']);
  assert.equal(app.run("ML.getActivityRange('2024-02-28','2024-03-01').filter(function(day){return day.active;}).length"), 2);

  app.run("ML.recordLearningActivity(60,new Date(2025,11,31,23,30).getTime());ML.recordLearningActivity(60,new Date(2026,0,1,0,30).getTime())");
  assert.equal(app.run("ML.getActivityRange('2025-12-31','2026-01-01').length"), 2);
  assert.equal(app.run("ML.getActivityRange('2025-12-31','2026-01-01').every(function(day){return day.active;})"), true);
  assert.equal(app.run("ML.getActivityRange('2026-01-02','2026-01-01').length"), 0);
  assert.equal(app.run('ML.getActivityIntensity(0,false)'), 0);
  assert.equal(app.run('ML.getActivityIntensity(1800,true)'), 4);
}

function testLearningHistory() {
  const app = boot();
  assert.equal(app.run('ML.getLearningHistory().length'), 0);
  const base = new Date(2026, 7, 8, 15, 0).getTime();

  const started = app.run("ML.addLearningEvent({type:'LESSON_STARTED',lessonId:'algebra.exponents.basics',timestamp:" + base + ",metadata:{completedBlocks:1}})");
  assert.equal(started.added, true);
  const duplicateStart = app.run("ML.addLearningEvent({type:'LESSON_STARTED',lessonId:'algebra.exponents.basics',timestamp:" + (base + 60000) + "})");
  assert.equal(duplicateStart.added, false);
  assert.equal(app.run("ML.getLearningHistory({lessonId:'algebra.exponents.basics'}).length"), 1);

  app.run("ML.addLearningEvent({type:'LESSON_CONTINUED',lessonId:'algebra.exponents.basics',timestamp:" + (base + 3600000) + "})");
  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:80,correctAnswers:4,totalQuestions:5,duration:600,completedAt:" + (base + 7200000) + "})");
  app.run("Learning.completeLesson('algebra.exponents.basics',{percentage:100,correctAnswers:5,totalQuestions:5,completedAt:" + (base + 7300000) + "})");
  assert.equal(app.run("ML.getLearningHistory({types:['LESSON_COMPLETED'],lessonId:'algebra.exponents.basics'}).length"), 1);
  assert.equal(app.run("ML.getLearningHistory({lessonId:'algebra.exponents.basics'})[0].metadata.totalQuestions"), 5);

  app.run("Learning.completeLesson('algebra.vieta.intro',{percentage:100,correctAnswers:3,totalQuestions:3,duration:300,completedAt:" + (base + 10800000) + "})");
  assert.equal(app.run("ML.getLearningHistory({lessonId:'algebra.vieta.intro'}).length"), 1);
  assert.equal(app.run("ML.getLearningHistory().every(function(event,index,list){return !index || list[index-1].timestamp >= event.timestamp;})"), true);

  const reloaded = boot(app.context.localStorage.dump());
  assert.equal(reloaded.run('ML.getLearningHistory().length'), app.run('ML.getLearningHistory().length'));
  assert.equal(reloaded.run("ML.getLearningHistory()[0].lessonId"), 'algebra.vieta.intro');

  const malformed = boot({ mathlogic_data: JSON.stringify({ version: 2, activity: { history: [null, 'bad', { type: 'UNKNOWN', lessonId: 'x', timestamp: base }, { type: 'LESSON_STARTED', lessonId: '', timestamp: base }] } }) });
  assert.equal(malformed.run('ML.getLearningHistory().length'), 0);

  const backfilled = boot({ mathlogic_data: JSON.stringify({ version: 2, progress: { lessons: { 'algebra.exponents.basics': { status: 'completed', completedAt: base, correctAnswers: 4, totalQuestions: 5, duration: 600 } } } }) });
  assert.equal(backfilled.run("ML.getLearningHistory({types:['LESSON_COMPLETED']}).length"), 1);
  assert.equal(backfilled.run("ML.getLearningHistory()[0].timestamp"), base);

  const capped = boot();
  capped.run("for(var i=0;i<205;i++){ML.addLearningEvent({type:i%2?'LESSON_STARTED':'LESSON_CONTINUED',lessonId:'algebra.exponents.basics',timestamp:" + base + "+i*31*60*1000})}");
  assert.equal(capped.run('ML.getLearningHistory().length'), 200);
  assert.equal(capped.run('ML.getLearningHistory()[0].timestamp > ML.getLearningHistory()[199].timestamp'), true);
}

testCanonicalLifecycle();
testRegistryAndConfigs();
testRecommendedPathContext();
testPowersTopicIntegration();
testMonomialsPolynomialsTopicIntegration();
testIdentityTopicIntegration();
testLegacyMigration();
testScatteredLegacyMigration();
testLanguageCompatibility();
testLearningReset();
testTargetedLessonReset();
testSubjectReset();
testCorruptStorageFallback();
testCompletionDoesNotMutateLegacyGameFields();
testActivityHistory();
testLearningHistory();
console.log('core-smoke: ok');
