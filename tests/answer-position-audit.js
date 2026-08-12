/* Stable content audit: production multiple-choice ordering must not bias one position. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function load(file, globalName) {
  const context = {};
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  return context[globalName];
}

function optionText(option) {
  if (typeof option === 'string') return option;
  if (option && typeof option.text === 'string') return option.text;
  if (option && option.text && typeof option.text.ru === 'string') return option.text.ru;
  if (option && typeof option.ru === 'string') return option.ru;
  return '';
}

function collectChoices(lesson) {
  const choices = [];
  function walk(value, location) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, location + '[' + index + ']'));
      return;
    }
    if (Array.isArray(value.options) && Number.isInteger(value.answer)) {
      choices.push({ location, options: value.options, answer: value.answer });
    }
    Object.keys(value).forEach(key => {
      if (key !== 'options') walk(value[key], location ? location + '.' + key : key);
    });
  }
  lesson.blocks.forEach(block => walk(block, block.id));
  return choices;
}

const vieta = load('data/lesson-schema.js', 'LESSON_VIETA');
const lessons = [
  { id: 'natural-exponent-meaning', lesson: load('data/lessons/natural-exponent-meaning.js', 'LESSON_NATURAL_EXPONENT_MEANING') },
  { id: 'power-rules', lesson: load('data/lessons/power-rules.js', 'LESSON_POWER_RULES') },
  { id: 'zero-negative-exponents', lesson: load('data/lessons/zero-negative-exponents.js', 'LESSON_ZERO_NEGATIVE_EXPONENTS') },
  { id: 'standard-form', lesson: load('data/lessons/standard-form.js', 'LESSON_STANDARD_FORM') },
  { id: 'monomials-standard-form', lesson: load('data/lessons/monomials-standard-form.js', 'LESSON_MONOMIALS_STANDARD_FORM') },
  { id: 'polynomials-add-subtract', lesson: load('data/lessons/polynomials-add-subtract.js', 'LESSON_POLYNOMIALS_ADD_SUBTRACT') },
  { id: 'monomial-polynomial-multiplication', lesson: load('data/lessons/monomial-polynomial-multiplication.js', 'LESSON_MONOMIAL_POLYNOMIAL_MULTIPLICATION') },
  { id: 'square-sum-difference', lesson: load('data/lessons/square-sum-difference.js', 'LESSON_SQUARE_SUM_DIFFERENCE') },
  { id: 'difference-squares', lesson: load('data/lessons/difference-squares.js', 'LESSON_DIFFERENCE_SQUARES') },
  { id: 'cube-identities', lesson: load('data/lessons/cube-identities.js', 'LESSON_CUBE_IDENTITIES') },
  { id: 'factorization', lesson: load('data/lessons/factorization.js', 'LESSON_FACTORIZATION') },
  { id: 'polynomial-transformations-practice', lesson: load('data/lessons/polynomial-transformations-practice.js', 'LESSON_POLYNOMIAL_TRANSFORMATIONS_PRACTICE') },
  { id: 'fractions', lesson: load('data/lessons/fractions.js', 'LESSON_ALG01_FRACTIONS') },
  { id: 'percent', lesson: load('data/lessons/percent.js', 'LESSON_ALG01_PERCENT') },
  { id: 'proportions', lesson: load('data/lessons/proportions.js', 'LESSON_ALG01_PROPORTIONS') },
  { id: 'parts-mixtures', lesson: load('data/lessons/parts-mixtures.js', 'LESSON_ALG01_PARTS_MIXTURES') },
  { id: 'model', lesson: load('data/lessons/model.js', 'LESSON_ALG01_MODEL') },
  { id: 'practice', lesson: load('data/lessons/practice.js', 'LESSON_ALG01_PRACTICE') },
  { id: 'exponents', lesson: load('data/lessons/exponents.js', 'LESSON_EXPONENTS') },
  { id: 'linear-equations', lesson: load('data/lessons/linear-equations.js', 'LESSON_LINEAR_EQUATIONS') },
  { id: 'linear-functions', lesson: load('data/lessons/linear-functions.js', 'LESSON_LINEAR_FUNCTIONS') },
  { id: 'triangle-angle-sum', lesson: load('data/lessons/triangle-angle-sum.js', 'LESSON_TRIANGLE_ANGLE_SUM') },
  { id: 'geometry-figures-axioms', lesson: load('data/lessons/geometry-figures-axioms.js', 'LESSON_GEOMETRY_FIGURES_AXIOMS') },
  { id: 'geometry-equal-figures', lesson: load('data/lessons/geometry-equal-figures.js', 'LESSON_GEOMETRY_EQUAL_FIGURES') },
  { id: 'geometry-proof-methods', lesson: load('data/lessons/geometry-proof-methods.js', 'LESSON_GEOMETRY_PROOF_METHODS') },
  { id: 'geometry-angles-perpendicular', lesson: load('data/lessons/geometry-angles-perpendicular.js', 'LESSON_GEOMETRY_ANGLES_PERPENDICULAR') },
  { id: 'geometry-initial-practice', lesson: load('data/lessons/geometry-initial-practice.js', 'LESSON_GEOMETRY_INITIAL_PRACTICE') },
  { id: 'geometry-triangle-types', lesson: load('data/lessons/geometry-triangle-types.js', 'LESSON_GEOMETRY_TRIANGLE_TYPES') },
  { id: 'geometry-triangle-elements', lesson: load('data/lessons/geometry-triangle-elements.js', 'LESSON_GEOMETRY_TRIANGLE_ELEMENTS') },
  { id: 'geometry-g03-transversal', lesson: load('data/lessons/geometry-g03-transversal.js', 'LESSON_GEOMETRY_G03_TRANSVERSAL') },
  { id: 'geometry-g03-criteria', lesson: load('data/lessons/geometry-g03-criteria.js', 'LESSON_GEOMETRY_G03_CRITERIA') },
  { id: 'geometry-g03-properties', lesson: load('data/lessons/geometry-g03-properties.js', 'LESSON_GEOMETRY_G03_PROPERTIES') },
  { id: 'geometry-g03-triangle-relations', lesson: load('data/lessons/geometry-g03-triangle-relations.js', 'LESSON_GEOMETRY_G03_TRIANGLE_RELATIONS') },
  { id: 'geometry-g03-right-triangles', lesson: load('data/lessons/geometry-g03-right-triangles.js', 'LESSON_GEOMETRY_G03_RIGHT_TRIANGLES') },
  { id: 'geometry-triangle-congruence-1', lesson: load('data/lessons/geometry-triangle-congruence-1.js', 'LESSON_GEOMETRY_TRIANGLE_CONGRUENCE_1') },
  { id: 'geometry-triangle-congruence-2', lesson: load('data/lessons/geometry-triangle-congruence-2.js', 'LESSON_GEOMETRY_TRIANGLE_CONGRUENCE_2') },
  { id: 'geometry-triangle-isosceles', lesson: load('data/lessons/geometry-triangle-isosceles.js', 'LESSON_GEOMETRY_TRIANGLE_ISOSCELES') },
  { id: 'geometry-triangle-equilateral', lesson: load('data/lessons/geometry-triangle-equilateral.js', 'LESSON_GEOMETRY_TRIANGLE_EQUILATERAL') },
  { id: 'geometry-triangle-congruence-practice', lesson: load('data/lessons/geometry-triangle-congruence-practice.js', 'LESSON_GEOMETRY_TRIANGLE_CONGRUENCE_PRACTICE') },
  { id: 'vieta', lesson: vieta },
];

const expectedCorrectText = {
  'natural-exponent-meaning': {
    'repeated-factor-probe': '5', 'meaning-not-coefficient': 'x · x · x · x', 'name-the-parts': 'b',
    'what-the-exponent-says': 'Что множитель b повторяется 6 раз', 'read-a-power': 'a · a',
    'same-notation-different-structure': 'В 2³ повторяется 2 три раза, а в 3² повторяется 3 два раза',
    'exponent-is-not-an-extra-factor': '5 · 5 · 5', 'final-conceptual': 'q — основание, а 4 показывает четыре одинаковых множителя q',
  },
  'power-rules': {
    'same-base-gate': 'Нет: основания разные', 'quotient-meaning': 'a²/b²',
    'mixed-transfer': 'Сложить показатели: 2 + 3',
  },
  'zero-negative-exponents': {
    'zero-not-zero': '1', 'negative-not-sign': '1/3²', 'division-transfer': '1/x³',
  },
  'standard-form': {
    'identify-standard-form': '4,8 · 10⁶', 'compare-orders': '3,1 · 10⁶', 'ordinary-form-check': '6 300',
  },
  'monomials-standard-form': {
    'recognize-monomial': '−4a²b³',
    'coefficient-degree-check': 'Коэффициент −1, степень 5',
    'constant-boundary': 'Коэффициент −7, степень 0',
  },
  'polynomials-add-subtract': {
    'like-terms-retrieval': '−2ab² и 7ab²',
    'minus-distribution-check': '−2a² + 3a − 5',
    'unlike-terms-boundary': 'Нет: у трёх членов разные буквенные части',
  },
  'monomial-polynomial-multiplication': {
    'distribution-check': '−6x² − 10x',
    'all-products-check': 'a² − 2a + 4a − 8',
    'term-count-boundary': '6',
  },
  'square-sum-difference': {
    'product-retrieval': '(a + b)(a + b)',
    'missing-middle-check': '10m',
    'difference-sign-check': 'p² − 12p + 36',
  },
  'difference-squares': {
    'square-structure-retrieval': '9x²',
    'recognition-check': 'a² − 16',
    'boundary-check': 'Потому что между квадратами стоит плюс',
  },
  'cube-identities': {
    'cube-meaning-retrieval': '(a + b)(a + b)(a + b)',
    'mixed-term-check': '27m',
    'structure-choice': 'Первое — куб всего двучлена, второе — разность двух кубов',
  },
  factorization: {
    'product-retrieval': '3x² + 6x', 'common-factor-check': '4m²',
  },
  'polynomial-transformations-practice': {
    'method-choice': 'Разложить как разность квадратов',
    'verification-check': 'Раскрыть скобки справа и сравнить все члены',
  },
  fractions: {
    'fraction-meaning': 'Пять равных частей из двенадцати частей целого',
    'fraction-compare': '5/8 > 0,6',
  },
  percent: {
    'percent-meaning': '18/100',
    'percent-discount': 'Найти 25% от 8000 и вычесть эту сумму из 8000',
    'percent-final-check': '72 : 0,24',
  },
  proportions: {
    'ratio-order': 'Сколько граммов риса приходится на одну порцию',
    'direct-dependence': 'Тоже увеличится в 2 раза',
    'proportion-setup': '5600/4 = x/7',
  },
  'parts-mixtures': {
    'parts-meaning': '5', 'whole-or-part': 'От всех 250 г раствора',
  },
  model: {
    'choose-unknown': 'Число яблок во втором ящике',
    'model-equation-choice': 'x + (x − 5) = 23',
    'model-reasonableness': '12 тг',
  },
  practice: {
    'practice-identify-percent': 'Найти 0,35 от 80',
    'practice-proportion-choice': 'Цена за 1 кг остаётся постоянной',
    'practice-model-choice': 'Обозначить число шаров во второй коробке x и составить x + (x + 8) = 46',
  },
  exponents: {
    prerequisite_meaning: 'a · a · a · a', multiply_observation_count: '6', multiply_observation_pattern: 'Они сложились: 2 + 4 = 6',
    multiply_why: 'Потому что объединяются две группы одинаковых множителей', multiply_misconception: 'a⁵', different_bases_boundary: 'Нет, основания a и b различаются',
    division_observation: 'Оно уменьшилось на 2: 5 − 2 = 3', division_misconception: 'a⁴', final_conceptual: 'При умножении группы одинаковых множителей объединяются, при делении часть одинаковых множителей убирается',
  },
  'linear-equations': {
    prerequisite_obvious_root: '5', meaning_probe: 'После подстановки 4 исходное равенство становится верным', equality_boundary: 'Вычесть 7 из обеих частей',
    verification_choice: '3 · 4 + 2 = 14', final_conceptual: 'Чтобы сохранить равенство и те же корни у новой строки', final_verification: '6 · 6 − 5 = 31',
  },
  'linear-functions': {
    coordinate_prerequisite: 'Сначала 2 по оси x, затем 3 по оси y', notice_alignment: 'Они лежат на одной прямой',
    'reveal_function_graph.followUp': 'Нет, линия содержит и другие точки, удовлетворяющие формуле', point_membership: 'При x = 2 формула даёт y = 5',
    predict_positive_k: 'y = 3x', 'explore_positive_k.followUp': 'k = 2', explain_k_change: 'В первом случае y меняется на 1, во втором — на 3',
    predict_negative_k: 'При росте x значения y будут уменьшаться', 'explore_negative_k.followUp': 'При движении слева направо значения y уменьшаются',
    'b_boundary.followUp': 'Значение y при x = 0', 'transfer_table_graph.followUp': 'Два билета стоят 6 единиц', final_graph_meaning: 'При x = a функция принимает значение y = b',
  },
  'triangle-angle-sum': {
    interior_angle_prerequisite: 'Угол внутри треугольника между сторонами AB и AC',
    'first_triangle_exploration.followUp': 'Углы изменились и перераспределились между вершинами',
    predict_angle_sum: 'Сумма может оставаться равной 180°',
    'test_distinct_triangles.followUp': 'Измеренная сумма оставалась около 180°',
    experiment_not_proof: 'Обоснованную гипотезу, которой ещё нужна математическая причина',
    parallel_lines_prerequisite: 'Потому что это накрест лежащие углы при параллельных прямых',
    proof_reason_parallel: 'Потому что DE ∥ BC, а стороны AB и AC — секущие',
    proof_reason_straight: 'Они заполняют развёрнутый угол на прямой DE',
    size_misconception: 'Соответствующие углы равны, и сумма у каждого равна 180°',
    possible_triangle_transfer: 'Нет, потому что сумма равна 190°, а должна быть 180°',
    final_conceptual_check: 'Измерения дали гипотезу, а параллельная прямая объяснила её для любого треугольника',
  },
  'geometry-figures-axioms': {
    classify_ray: 'Луч OP', diagram_limit: 'Можно утверждать лишь то, что явно дано или отмечено',
    axiom_or_theorem: 'Это теорема: для неё дана цепочка обоснований', transfer_statement: 'Аксиома о единственной прямой через две различные точки',
  },
  'geometry-equal-figures': {
    not_just_appearance: 'Нет: без изменения размера полностью совместить их нельзя', corresponding_side: 'LM',
    angle_transfer: '∠L = 70°', insufficient_data: 'Нет, нужно основание для полного совмещения всех соответствующих частей',
    equal_transfer: 'Получена равная фигура в новом положении',
  },
  'geometry-proof-methods': {
    given_or_goal: 'Это цель доказательства', choose_reason: 'По условию луч делит угол на равные части',
    finite_examples: 'Получено наблюдение, которое поддерживает гипотезу',
    order_chain: 'AC = AB + BC по сложению частей отрезка; значит AC = 3 + 4 = 7',
    proof_transfer: 'Выписать данное и цель, затем найти определение или свойство, которое их связывает',
  },
  'geometry-angles-perpendicular': {
    identify_adjacent: 'Общая сторона, а две другие стороны — противоположные лучи', vertical_or_adjacent: 'Вертикальные',
    angle_chain: '∠2 = 112°, ∠3 = 68°', perpendicular_evidence: 'Один из образованных углов отмечен как 90°',
  },
  'geometry-initial-practice': {
    object_reading: 'Луч AB', condition_vs_picture: 'Равенство установить нельзя без условия, отметок или доказательства',
    equal_figures_transfer: 'MP = 6 см', proof_plan: 'По определению середина делит отрезок на две равные части',
    angle_independent: '141°: ∠B = 180° − 39°, а вертикальный ∠C равен ∠B',
    perpendicular_transfer: 'a ⟂ b, потому что один образованный угол прямой; остальные тоже 90° по свойствам смежных и вертикальных углов',
    axiom_theorem_transfer: 'Теорему можно применить, когда выполнены её условия, и назвать её основанием вывода',
  },
  'geometry-triangle-types': {
    side_evidence: 'Равнобедренный: AB = AC', 'explore_angle_types.followUp': 'Один измеренный или явно отмеченный угол равен 90°',
    equilateral_relation: 'Он равносторонний и также равнобедренный: три равные стороны включают хотя бы две равные',
    independent_full_classification: 'Разносторонний прямоугольный', transfer_isosceles_obtuse: 'Равнобедренный тупоугольный',
  },
  'geometry-triangle-elements': {
    median_evidence: 'M — середина BC, потому что BM = MC', bisector_evidence: 'Две одинаковые дуги показывают ∠LKN = ∠NKM',
    height_evidence: 'PH идёт из вершины P перпендикулярно прямой QR',
    not_enough_evidence: 'Пока известно только, что AD — отрезок из вершины к стороне BC',
    obtuse_altitude: 'AH идёт из вершины A перпендикулярно прямой, содержащей BC',
    special_isosceles: 'Потому что даны все три нужных признака: равные части, равные углы и прямой угол',
  },
  'geometry-g03-transversal': { read_diagram:'Накрест лежащие внутренние', supplementary:'116°', no_parallel:'Пока нет: параллельность не дана и не доказана', transfer:'Соответственный равен 128°, односторонний внутренний равен 52°', independent_pair:'Накрест лежащий угол равен 74°, а односторонний внутренний — 106°' },
  'geometry-g03-criteria': { alternate:'m ∥ n', wrong_direction:'Нет: признак нужен, когда параллельность ещё не дана', transfer:'Равенство накрест лежащих углов', independent_criterion:'Прямые параллельны по признаку односторонних внутренних углов' },
  'geometry-g03-properties': { diagram:'Противоположный угол у того же пересечения: 68°', calculate:'112°', transfer:'Вертикальные и соответствующие равны 68°, смежные дают 112°', contrast:'Он не указал, является ли угол соответствующим/вертикальным или смежным' },
  'geometry-g03-triangle-relations': { exterior:'∠ACD = ∠A + ∠B', inequality:'Нет: 4 + 5 не больше 10', transfer:'75°', inequality_contrast:'Потому что 3 + 4 = 7: фигура вырождается в прямую' },
  'geometry-g03-right-triangles': { read:'BC', altitude:'AH перпендикулярна BC; BH и HC — проекции', transfer:'Гипотенуза; она длиннее каждого катета', independent_roles:'BH = HC' },
  'geometry-triangle-congruence-1': { sas_read: 'Первый: две стороны и угол между ними', asa_check: 'Дана сторона и два угла при её концах', not_enough: 'Нет: не хватает третьего связанного условия', transfer: '△ABC = △KLM по первому признаку: равны две стороны и угол между ними' },
  'geometry-triangle-congruence-2': { sss_diagram: '△ABC и △KLM равны по третьему признаку', lengths_check: 'Треугольники равны по третьему признаку', two_sides_only: 'Пока равенство не доказано: нужна ещё третья сторона или другой полный набор данных', transfer: '△DEF = △UVW' },
  'geometry-triangle-isosceles': { property_read: '∠B и ∠C — углы при основании BC', calculate_base: '68°', converse: 'DE = DF, поэтому треугольник равнобедренный', not_appearance: 'Нет: нужны отметки, длины или другое обоснование', transfer: 'KM = LM; треугольник равнобедренный с основанием KL' },
  'geometry-triangle-equilateral': { marks_read: 'Все три стороны равны', angle_check: '60°', converse: 'Треугольник равносторонний', not_enough: 'Нет: нужна отметка или длина третьей стороны', transfer: 'Все углы равны, поэтому по обратному свойству получаем AB = BC = CA' },
  'geometry-triangle-congruence-practice': { choose_criterion: '△ABC = △DEF по первому признаку', corresponding_angle: '71°', isosceles_transfer: '70°', equilateral_transfer: 'Каждый угол равен 60°', evidence_limit: 'Пока нельзя утверждать равенство', final_assessment: 'AB = AC → ∠B = ∠C → ∠C = 55°' },
  vieta: {
    warmup: '12', quiz_1: '5', quiz_2: '5 и 6', 'challenge_1.tasks[0]': 'x² – 10x + 21 = 0', 'challenge_1.tasks[2]': '–18',
  },
};

let total = 0;
const summary = {};

lessons.forEach(({ id, lesson }) => {
  const choices = collectChoices(lesson);
  const expected = expectedCorrectText[id];
  assert.equal(choices.length, Object.keys(expected).length, id + ': expected audit map must cover every production choice');

  const counts = {};
  choices.forEach(choice => {
    assert.ok(choice.answer >= 0 && choice.answer < choice.options.length, id + ': invalid answer index at ' + choice.location);
    assert.equal(optionText(choice.options[choice.answer]), expected[choice.location], id + ': correct option changed at ' + choice.location);
    counts[choice.answer] = (counts[choice.answer] || 0) + 1;
  });

  if (choices.length >= 5) {
    const positions = Math.min(4, Math.max.apply(null, choices.map(choice => choice.options.length)));
    const allowedAtOnePosition = Math.ceil(choices.length / positions) + 1;
    assert.ok(Math.max.apply(null, Object.values(counts)) <= allowedAtOnePosition, id + ': answer index is too concentrated');
  }

  for (let index = 3; index < choices.length; index += 1) {
    const run = choices.slice(index - 3, index + 1).map(choice => choice.answer);
    assert.equal(new Set(run).size === 1, false, id + ': four equal answer indices in a row');
  }

  total += choices.length;
  summary[id] = counts;
});

assert.equal(total, 179);
console.log('answer-position-audit: ok', JSON.stringify(summary));
