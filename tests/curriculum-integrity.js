/* Structural and product integrity checks for the canonical 7-9 curriculum. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const context = { console };
context.window = context;
vm.createContext(context);
[
  'data/curriculum.js','data/program-presentation.js','js/data.js','data/lesson-schema.js','data/lessons/natural-exponent-meaning.js','data/lessons/exponents.js','data/lessons/power-rules.js','data/lessons/zero-negative-exponents.js','data/lessons/standard-form.js','data/lessons/monomials-standard-form.js','data/lessons/polynomials-add-subtract.js','data/lessons/monomial-polynomial-multiplication.js',
  'data/lessons/fractions.js','data/lessons/percent.js',
  'data/lessons/proportions.js','data/lessons/parts-mixtures.js','data/lessons/model.js','data/lessons/practice.js',
  'data/lessons/square-sum-difference.js','data/lessons/difference-squares.js','data/lessons/cube-identities.js',
  'data/lessons/factorization.js','data/lessons/polynomial-transformations-practice.js',
  'data/lessons/linear-equations.js','data/lessons/linear-functions.js','data/lessons/triangle-angle-sum.js',
  'data/lessons/geometry-figures-axioms.js','data/lessons/geometry-equal-figures.js',
  'data/lessons/geometry-proof-methods.js','data/lessons/geometry-angles-perpendicular.js','data/lessons/geometry-initial-practice.js',
  'data/lessons/geometry-triangle-types.js','data/lessons/geometry-triangle-elements.js',
  'data/lessons/geometry-g03-transversal.js','data/lessons/geometry-g03-criteria.js','data/lessons/geometry-g03-properties.js','data/lessons/geometry-g03-triangle-relations.js','data/lessons/geometry-g03-right-triangles.js',
  'data/lessons/geometry-triangle-congruence-1.js','data/lessons/geometry-triangle-congruence-2.js',
  'data/lessons/geometry-triangle-isosceles.js','data/lessons/geometry-triangle-equilateral.js','data/lessons/geometry-triangle-congruence-practice.js',
].forEach(function(file) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
});

const curriculum = vm.runInContext('MATHLOGIC_CURRICULUM', context);
const presentation = vm.runInContext('MATHLOGIC_PROGRAM_PRESENTATION', context);
const registry = vm.runInContext('LESSON_REGISTRY', context);
const subjects = Array.from(curriculum.subjects);
const units = Array.from(curriculum.units);
const topics = Array.from(curriculum.topics);
const lessons = Array.from(curriculum.lessons);

function unique(values, label) {
  assert.equal(new Set(values).size, values.length, label + ' IDs must be unique');
}
function localized(record, label) {
  assert.ok(typeof record.titleRu === 'string' && record.titleRu.trim(), label + ' requires titleRu');
  assert.ok(typeof record.titleKk === 'string' && record.titleKk.trim(), label + ' requires titleKk');
}

const STUDENT_TEXT_KEYS = new Set([
  'title','description','content','intro','takeaway','question','prompt','problem','inputLabel',
  'feedback','successFeedback','incorrectFeedback','emptyFeedback','fallbackFeedback','explanation',
  'hint','hints','label','badgeLabel','formulaLabel','capabilities','uiLabels','resultLabels',
  'actionLabel','continueLabel','typingHelp','options','text',
  'ariaLabel','caption',
]);

function assertProductionConfigLocalization(config, lessonId) {
  function visit(value, pathName, fieldName, insideLocalePair) {
    if (Array.isArray(value)) {
      value.forEach(function(item, index) { visit(item, pathName + '[' + index + ']', fieldName, false); });
      return;
    }
    if (value && typeof value === 'object') {
      const hasLocalePair = Object.prototype.hasOwnProperty.call(value, 'ru') ||
        Object.prototype.hasOwnProperty.call(value, 'kk') || Object.prototype.hasOwnProperty.call(value, 'kz');
      if (hasLocalePair) {
        assert.ok(typeof value.ru === 'string' && value.ru.trim(), pathName + ' requires a RU branch');
        const kk = value.kk !== undefined ? value.kk : value.kz;
        assert.ok(typeof kk === 'string' && kk.trim(), pathName + ' requires a KK branch');
      }
      Object.keys(value).forEach(function(key) {
        visit(value[key], pathName + '.' + key, key, hasLocalePair);
      });
      return;
    }
    if (typeof value === 'string' && STUDENT_TEXT_KEYS.has(fieldName) &&
        /[А-Яа-яӘІҢҒҮҰҚӨҺ]/.test(value) && !insideLocalePair) {
      assert.fail(lessonId + ' has unlocalized student text at ' + pathName + ': ' + value);
    }
  }
  visit(config, lessonId, '', false);
}

assert.equal(curriculum.version, '1.0.0');
assert.deepEqual(subjects.map(function(item) { return item.id; }), ['algebra','geometry']);
unique(subjects.map(function(item) { return item.id; }), 'subject');
unique(units.map(function(item) { return item.id; }), 'unit');
unique(topics.map(function(item) { return item.id; }), 'topic');
unique(lessons.map(function(item) { return item.id; }), 'lesson');
subjects.forEach(function(item) { localized(item, item.id); });
subjects.forEach(function(item) {
  assert.ok(Array.isArray(item.grades) && item.grades.length, item.id + ' requires data-driven grades');
  item.grades.forEach(function(grade) { assert.ok(Number.isInteger(grade) && grade > 0); });
});
units.forEach(function(item) {
  localized(item, item.id);
  assert.ok(['algebra','geometry'].includes(item.subject));
  assert.ok(subjects.find(function(subject) { return subject.id === item.subject; }).grades.includes(item.grade));
  assert.ok(item.lessonIds.length >= 4 && item.lessonIds.length <= 8);
  assert.ok(Array.isArray(item.topicIds) && item.topicIds.length, item.id + ' requires topics');
  item.topicIds.forEach(function(id) { assert.ok(topics.some(function(topic) { return topic.id === id && topic.unitId === item.id; })); });
  item.lessonIds.forEach(function(id) { assert.ok(lessons.some(function(lesson) { return lesson.id === id; }), item.id + ' references unknown lesson ' + id); });
  item.prerequisites.forEach(function(id) { assert.ok(units.some(function(candidate) { return candidate.id === id; }), item.id + ' references unknown unit prerequisite ' + id); });
});

topics.forEach(function(item) {
  localized(item, item.id);
  assert.equal(/\.core$/.test(item.id), false, item.id + ' must not use a synthetic .core ID');
  assert.ok(units.some(function(unit) { return unit.id === item.unitId; }));
  assert.ok(typeof item.descriptionRu === 'string' && item.descriptionRu.trim(), item.id + ' requires descriptionRu');
  assert.ok(typeof item.descriptionKk === 'string' && item.descriptionKk.trim(), item.id + ' requires descriptionKk');
  assert.ok(Number.isInteger(item.order) && item.order > 0, item.id + ' requires deterministic order');
  assert.ok(item.lessonIds.length > 0);
  item.lessonIds.forEach(function(id) {
    assert.ok(lessons.some(function(lesson) { return lesson.id === id && lesson.topicId === item.id; }), item.id + ' references unknown lesson ' + id);
  });
});

const officialLessons = lessons.filter(function(item) { return !item.bridge; });
assert.equal(officialLessons.length, 168);
assert.equal(officialLessons.filter(function(item) { return item.subject === 'algebra'; }).length, 97);
assert.equal(officialLessons.filter(function(item) { return item.subject === 'geometry'; }).length, 71);
assert.equal(lessons.filter(function(item) { return item.bridge; }).length, 1);

const lessonIds = new Set(lessons.map(function(item) { return item.id; }));
const unitIds = new Set(units.map(function(item) { return item.id; }));
const topicIds = new Set(topics.map(function(item) { return item.id; }));
const codePattern = /^[6-9]\.\d+\.\d+\.\d+(?:-\d+)?$/;
lessons.forEach(function(item) {
  localized(item, item.id);
  assert.ok(['algebra','geometry'].includes(item.subject));
  assert.ok(subjects.find(function(subject) { return subject.id === item.subject; }).grades.includes(item.grade));
  assert.ok(unitIds.has(item.unitId));
  assert.ok(topicIds.has(item.topicId));
  assert.equal(topics.find(function(topic) { return topic.id === item.topicId; }).unitId, item.unitId);
  assert.ok(['planned','implemented','reference','needs-review'].includes(item.productionStatus));
  assert.ok(item.learningObjectives.ru.length && item.learningObjectives.kk.length);
  assert.ok(item.estimatedDuration >= 10 && item.estimatedDuration <= 30);
  assert.ok(item.primaryInteraction && Array.isArray(item.supportingInteractions));
  assert.ok(item.sources.length > 0);
  item.curriculumCodes.forEach(function(code) { assert.match(code, codePattern, item.id + ' has invalid curriculum code'); });
  item.prerequisites.hard.concat(item.prerequisites.soft).forEach(function(id) {
    assert.ok(lessonIds.has(id) || unitIds.has(id), item.id + ' references unknown prerequisite ' + id);
  });
});

/* Presentation may regroup topics, but it cannot become a second curriculum. */
assert.equal(presentation.version, '3.0.0');
unique(Array.from(presentation.subjects, function(item) { return item.id; }), 'presentation subject');
assert.deepEqual(Array.from(presentation.subjects, function(item) { return item.id; }), subjects.map(function(item) { return item.id; }));
const presentedTopics = new Set();
const largeModuleIds = [];
presentation.subjects.forEach(function(subject) {
  assert.ok(subjects.some(function(item) { return item.id === subject.id; }), 'presentation has an unknown subject');
  assert.ok(Array.isArray(subject.largeModules) && subject.largeModules.length, subject.id + ' requires large modules');
  const subjectOrder = [];
  subject.largeModules.forEach(function(module) {
    largeModuleIds.push(module.id);
    localized(module, module.id);
    assert.ok(Array.isArray(module.topicIds) && module.topicIds.length, module.id + ' requires topic IDs');
    module.topicIds.forEach(function(topicId) {
      const topic = topics.find(function(item) { return item.id === topicId; });
      assert.ok(topic, module.id + ' references unknown topic ' + topicId);
      assert.equal(topic.subject, subject.id, module.id + ' crosses subject boundaries');
      assert.equal(presentedTopics.has(topicId), false, topicId + ' appears in more than one large module');
      presentedTopics.add(topicId);
      const firstOrder = Math.min.apply(null, topic.lessonIds.map(function(id) {
        return lessons.find(function(lesson) { return lesson.id === id; }).recommendedOrder;
      }));
      subjectOrder.push(firstOrder);
    });
  });
  subjectOrder.forEach(function(order, index) {
    if (index) assert.ok(order > subjectOrder[index - 1], subject.id + ' presentation order must follow the recommended path');
  });
});
unique(largeModuleIds, 'large student module');
assert.equal(presentedTopics.size, topics.length, 'every canonical topic requires one student module placement');

/* Detect cycles among lesson-level hard prerequisites. */
const visiting = new Set();
const visited = new Set();
function visit(id) {
  if (visited.has(id)) return;
  assert.equal(visiting.has(id), false, 'dependency cycle at ' + id);
  visiting.add(id);
  const item = lessons.find(function(lesson) { return lesson.id === id; });
  (item ? item.prerequisites.hard : []).filter(function(prerequisite) { return lessonIds.has(prerequisite); }).forEach(visit);
  visiting.delete(id);
  visited.add(id);
}
lessons.forEach(function(item) { visit(item.id); });

/* Detect cycles between larger curriculum units as well. */
const visitingUnits = new Set();
const visitedUnits = new Set();
function visitUnit(id) {
  if (visitedUnits.has(id)) return;
  assert.equal(visitingUnits.has(id), false, 'unit dependency cycle at ' + id);
  visitingUnits.add(id);
  const item = units.find(function(unit) { return unit.id === id; });
  (item ? item.prerequisites : []).forEach(visitUnit);
  visitingUnits.delete(id);
  visitedUnits.add(id);
}
units.forEach(function(item) { visitUnit(item.id); });

['algebra','geometry'].forEach(function(subject) {
  const orders = lessons.filter(function(item) { return item.subject === subject; }).map(function(item) { return item.recommendedOrder; });
  assert.equal(new Set(orders).size, orders.length, subject + ' recommendedOrder values must be unique');
});

Object.keys(registry).forEach(function(id) {
  const metadata = lessons.find(function(item) { return item.id === id; });
  assert.ok(metadata, 'registry lesson must exist in curriculum: ' + id);
  assert.ok(['implemented','reference'].includes(metadata.productionStatus));
  assert.equal(registry[id].unitId, metadata.unitId);
  assert.equal(registry[id].topicId, metadata.topicId);
  assert.equal(registry[id].grade, metadata.grade);
  assert.equal(registry[id].xp, 0);
  assert.ok(vm.runInContext('typeof ' + registry[id].config + " !== 'undefined'", context), id + ' config must be loaded');
  assert.equal(vm.runInContext('LessonValidator.validate(' + registry[id].config + ').valid', context), true, id + ' config must validate');
  const productionConfig = vm.runInContext(registry[id].config, context);
  if (id !== 'algebra.vieta.intro') assertProductionConfigLocalization(productionConfig, id);
});
lessons.filter(function(item) { return ['implemented','reference'].includes(item.productionStatus); }).forEach(function(item) {
  assert.ok(registry[item.id], item.id + ' must have a registry entry');
});

const queue = Array.from(curriculum.productionQueue);
unique(queue.map(function(item) { return item.lessonId; }), 'production queue');
const queueIds = queue.map(function(item) { return item.lessonId; });
assert.deepEqual(queueIds, []);
queue.forEach(function(item, index) {
  assert.equal(item.priority, index + 1);
  assert.ok(lessonIds.has(item.lessonId));
  assert.equal(item.needsNewPrimitive, false);
  assert.ok(item.reusableBlocks.length > 0);
  assert.equal(item.status, 'queued');
  item.prerequisites.hard.filter(function(id) { return lessonIds.has(id); }).forEach(function(id) {
    const prerequisite = lessons.find(function(lesson) { return lesson.id === id; });
    if (prerequisite.productionStatus === 'planned') {
      assert.ok(queueIds.indexOf(id) > -1 && queueIds.indexOf(id) < index, item.lessonId + ' requires an earlier queued lesson ' + id);
    }
  });
});

console.log('curriculum-integrity: ok', JSON.stringify({
  units: units.length, topics: topics.length, officialLessons: officialLessons.length, bridgeLessons: 1,
  algebra: 97, geometry: 71, implemented: Object.keys(registry).length, batch: queue.length,
}));
