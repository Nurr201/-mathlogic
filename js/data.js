/* Runtime adapters around the canonical curriculum and implemented lesson registry. */

const MATHIGON_ICONS = [
  `<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path opacity="0.3" d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path d="M10.5 5.5L4 16h13L10.5 5.5z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path opacity="0.3" d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 z"/><path d="M6 12s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z"/></svg>`,
];

const THEME_COLORS = {
  algebra: ['#4F46E5', '#0284C7', '#6366F1', '#4338CA'],
  geometry: ['#059669', '#10B981', '#047857', '#065F46'],
};

const SUBJECTS = [
  { key: 'algebra', name: 'Алгебра', nameRu: 'Алгебра', nameKk: 'Алгебра', mainColor: '#4F46E5', bgActive: '#EEF2FF', icon: MATHIGON_ICONS[0] },
  { key: 'geometry', name: 'Геометрия', nameRu: 'Геометрия', nameKk: 'Геометрия', mainColor: '#059669', bgActive: '#ECFDF5', icon: MATHIGON_ICONS[1] },
];

/* Compatibility view only. It is generated from MATHLOGIC_CURRICULUM and is
   never maintained separately. New code should read MATHLOGIC_CURRICULUM. */
const DATA = (function() {
  var result = {};
  SUBJECTS.forEach(function(subject) {
    result[subject.key] = [];
    var curriculumSubject = MATHLOGIC_CURRICULUM.subjects.find(function(item) { return item.id === subject.key; });
    (curriculumSubject ? curriculumSubject.grades : []).forEach(function(grade) {
      var units = MATHLOGIC_CURRICULUM.getUnits(subject.key, grade);
      result[subject.key].push({
        id: subject.key + '.grade-' + grade,
        grade: grade,
        title: grade + ' класс', titleRu: grade + ' класс', titleKk: grade + '-сынып', level: '',
        modules: units.map(function(unit) {
          return {
            id: unit.id, name: unit.titleRu, titleRu: unit.titleRu, titleKk: unit.titleKk,
            subtopics: unit.lessonIds.map(function(id) { return MATHLOGIC_CURRICULUM.getLesson(id).titleRu; }),
          };
        }),
      });
    });
  });
  return result;
})();

const TOPICS_LANDING = {
  algebra: {
    ru: ['· Выражения и преобразования','· Степени','· Уравнения','· Функции и графики','· Статистика и вероятность'],
    kk: ['· Өрнектер және түрлендірулер','· Дәрежелер','· Теңдеулер','· Функциялар және графиктер','· Статистика және ықтималдық'],
  },
  geometry: {
    ru: ['· Геометрические фигуры','· Треугольники','· Параллельные прямые','· Площади','· Окружности и векторы'],
    kk: ['· Геометриялық фигуралар','· Үшбұрыштар','· Параллель түзулер','· Аудандар','· Шеңберлер және векторлар'],
  },
};

const TAB_NAMES = {
  algebra: { ru: 'Алгебра', kk: 'Алгебра' },
  geometry: { ru: 'Геометрия', kk: 'Геометрия' },
};

function curriculumMeta(id) {
  var meta = MATHLOGIC_CURRICULUM.getLesson(id);
  if (!meta) throw new Error('Curriculum metadata is missing for implemented lesson: ' + id);
  return meta;
}

function registryEntry(id, config, descriptionRu, descriptionKk, legacyIds) {
  var meta = curriculumMeta(id);
  return {
    id: id, subjectId: meta.subject, unitId: meta.unitId, topicId: meta.topicId, grade: meta.grade,
    title: meta.titleRu, titleRu: meta.titleRu, titleKk: meta.titleKk,
    description: descriptionRu, descriptionRu: descriptionRu, descriptionKk: descriptionKk,
    duration: meta.estimatedDuration, availability: 'available',
    prerequisites: meta.prerequisites.hard.filter(function(prerequisiteId) {
      return !!MATHLOGIC_CURRICULUM.getLesson(prerequisiteId) &&
        MATHLOGIC_CURRICULUM.getLesson(prerequisiteId).productionStatus !== 'planned';
    }),
    softPrerequisites: meta.prerequisites.soft.slice(), unlockReason: '', releaseDate: null,
    config: config, route: 'lesson.html?id=' + id, order: meta.recommendedOrder || 0,
    productionStatus: meta.productionStatus, legacyIds: legacyIds || [], xp: 0,
  };
}

/* Content registry is deliberately separate from curriculum metadata: only
   entries here have loadable production lesson configs. */
const LESSON_REGISTRY = {
  'algebra.g7.alg-01.fractions': registryEntry(
    'algebra.g7.alg-01.fractions', 'LESSON_ALG01_FRACTIONS',
    'Как связать часть целого с обыкновенной и десятичной дробью, сравнивать и складывать доли.',
    'Бүтіннің бөлігін жай және ондық бөлшекпен байланыстырып, үлестерді салыстыру және қосуды үйренеміз.'
  ),
  'algebra.g7.alg-01.percent': registryEntry(
    'algebra.g7.alg-01.percent', 'LESSON_ALG01_PERCENT',
    'Как находить процент от числа и восстанавливать целое по известной части.',
    'Санның пайызын тауып, белгілі бөлігі бойынша бүтінді қалпына келтіруді үйренеміз.'
  ),
  'algebra.g7.alg-01.proportions': registryEntry(
    'algebra.g7.alg-01.proportions', 'LESSON_ALG01_PROPORTIONS',
    'Как сохранять смысл отношения, составлять пропорцию и распознавать прямую зависимость.',
    'Қатынастың мағынасын сақтап, пропорция құрастыруды және тура тәуелділікті тануды үйренеміз.'
  ),
  'algebra.g7.alg-01.parts-mixtures': registryEntry(
    'algebra.g7.alg-01.parts-mixtures', 'LESSON_ALG01_PARTS_MIXTURES',
    'Как делить целое в отношении и находить компонент как долю всей смеси.',
    'Бүтінді қатынаста бөліп, компонентті бүкіл қоспаның үлесі ретінде табуды үйренеміз.'
  ),
  'algebra.g7.alg-01.model': registryEntry(
    'algebra.g7.alg-01.model', 'LESSON_ALG01_MODEL',
    'Как выбрать неизвестную, перевести текст в уравнение и проверить смысл ответа.',
    'Белгісізді таңдап, мәтінді теңдеуге аудару және жауаптың мағынасын тексеруді үйренеміз.'
  ),
  'algebra.g7.alg-01.practice': registryEntry(
    'algebra.g7.alg-01.practice', 'LESSON_ALG01_PRACTICE',
    'Как выбрать дробь, процент, пропорцию или уравнение по структуре задачи.',
    'Есеп құрылымы бойынша бөлшекті, пайызды, пропорцияны немесе теңдеуді таңдауды үйренеміз.'
  ),
  'algebra.g7.alg-02.meaning': registryEntry(
    'algebra.g7.alg-02.meaning', 'LESSON_NATURAL_EXPONENT_MEANING',
    'Как короткая запись показывает произведение одинаковых множителей.',
    'Қысқа жазба бірдей көбейткіштердің көбейтіндісін қалай көрсететінін түсінеміз.'
  ),
  'algebra.exponents.basics': registryEntry(
    'algebra.exponents.basics', 'LESSON_EXPONENTS',
    'Почему при умножении показатели складывают, а при делении вычитают.',
    'Көбейткенде көрсеткіштер неге қосылатынын, ал бөлгенде неге азайтылатынын түсінеміз.',
    ['algebra_1','algebra_4','topic-1-expressions.html']
  ),
  'algebra.g7.alg-02.power-rules': registryEntry(
    'algebra.g7.alg-02.power-rules', 'LESSON_POWER_RULES',
    'Как выбирать свойство степени по структуре произведения, частного или степени.',
    'Көбейтінді, бөлінді немесе дәреже құрылымы бойынша дәреже қасиетін қалай таңдайтынын үйренеміз.'
  ),
  'algebra.g7.alg-02.zero-negative': registryEntry(
    'algebra.g7.alg-02.zero-negative', 'LESSON_ZERO_NEGATIVE_EXPONENTS',
    'Почему нулевой показатель даёт 1, а отрицательный — обратную степень.',
    'Неліктен нөлдік көрсеткіш 1-ге, ал теріс көрсеткіш кері дәрежеге тең екенін түсінеміз.'
  ),
  'algebra.g7.alg-02.standard-form': registryEntry(
    'algebra.g7.alg-02.standard-form', 'LESSON_STANDARD_FORM',
    'Как записывать большие и малые числа через значащую часть и степень десяти.',
    'Үлкен және кіші сандарды мәнді бөлік пен он дәрежесі арқылы қалай жазатынын үйренеміз.'
  ),
  'algebra.g7.alg-03.monomials': registryEntry(
    'algebra.g7.alg-03.monomials', 'LESSON_MONOMIALS_STANDARD_FORM',
    'Как коэффициент, буквенная часть и степень образуют одночлен стандартного вида.',
    'Коэффициент, әріптік бөлік және дәреже стандарт түрдегі бірмүшені қалай құрайтынын түсінеміз.'
  ),
  'algebra.g7.alg-03.polynomials': registryEntry(
    'algebra.g7.alg-03.polynomials', 'LESSON_POLYNOMIALS_ADD_SUBTRACT',
    'Почему объединяются только подобные члены и как корректно вычитать многочлены.',
    'Неліктен тек ұқсас мүшелер біріктірілетінін және көпмүшелерді қалай дұрыс азайтатынын түсінеміз.'
  ),
  'algebra.g7.alg-03.multiplication': registryEntry(
    'algebra.g7.alg-03.multiplication', 'LESSON_MONOMIAL_POLYNOMIAL_MULTIPLICATION',
    'Как распределительное свойство объясняет умножение одночленов и многочленов.',
    'Үлестірімділік қасиет бірмүшелер мен көпмүшелерді көбейтуді қалай түсіндіретінін үйренеміз.'
  ),
  'algebra.g7.alg-03.square-sum-difference': registryEntry(
    'algebra.g7.alg-03.square-sum-difference', 'LESSON_SQUARE_SUM_DIFFERENCE',
    'Откуда берётся удвоенное произведение и как раскрывать квадрат двучлена.',
    'Екі еселенген көбейтінді қайдан шығатынын және екімүшенің квадратын қалай ашатынын түсінеміз.'
  ),
  'algebra.g7.alg-03.difference-squares': registryEntry(
    'algebra.g7.alg-03.difference-squares', 'LESSON_DIFFERENCE_SQUARES',
    'Как распознать разность квадратов и преобразовать её в произведение.',
    'Квадраттар айырмасын қалай танып, оны көбейтіндіге түрлендіретінін үйренеміз.'
  ),
  'algebra.g7.alg-03.cubes': registryEntry(
    'algebra.g7.alg-03.cubes', 'LESSON_CUBE_IDENTITIES',
    'Как различать куб двучлена и сумму или разность кубов и выбирать нужную формулу.',
    'Екімүшенің кубы мен кубтар қосындысын немесе айырмасын ажыратып, қажетті формуланы таңдауды үйренеміз.'
  ),
  'algebra.g7.alg-03.factorization': registryEntry(
    'algebra.g7.alg-03.factorization', 'LESSON_FACTORIZATION',
    'Как вынести общий множитель и использовать группировку для разложения многочлена.',
    'Ортақ көбейткішті шығарып, көпмүшені топтау арқылы қалай жіктейтінін үйренеміз.'
  ),
  'algebra.g7.alg-03.practice': registryEntry(
    'algebra.g7.alg-03.practice', 'LESSON_POLYNOMIAL_TRANSFORMATIONS_PRACTICE',
    'Как выбрать подходящее преобразование многочлена и проверить результат.',
    'Көпмүшені түрлендірудің лайықты тәсілін таңдап, нәтижені қалай тексеретінін үйренеміз.'
  ),
  'algebra.linear-equations.equivalent-transformations': registryEntry(
    'algebra.linear-equations.equivalent-transformations', 'LESSON_LINEAR_EQUATIONS',
    'Как сохранять равенство, записывать шаги решения и проверять корень.',
    'Теңдікті сақтап, шешу қадамдарын жазу және түбірді тексеру.'
  ),
  'algebra.linear-functions.graph': registryEntry(
    'algebra.linear-functions.graph', 'LESSON_LINEAR_FUNCTIONS',
    'Как из значений функции появляются точки, прямая и предсказуемое изменение графика.',
    'Функция мәндерінен нүктелер мен түзу қалай пайда болатынын және графиктің қалай өзгеретінін зерттейміз.'
  ),
  'algebra.vieta.intro': registryEntry(
    'algebra.vieta.intro', 'LESSON_VIETA',
    'Решение приведённых квадратных уравнений через сумму и произведение корней.',
    'Келтірілген квадрат теңдеулерді түбірлер қосындысы мен көбейтіндісі арқылы шешу.',
    ['algebra_3','lesson.html']
  ),
  'geometry.g7.geo-01.figures-axioms': registryEntry(
    'geometry.g7.geo-01.figures-axioms', 'LESSON_GEOMETRY_FIGURES_AXIOMS',
    'Как различать основные геометрические объекты и роль аксиом и теорем.',
    'Негізгі геометриялық объектілерді және аксиомалар мен теоремалардың рөлін ажырату.'
  ),
  'geometry.g7.geo-01.equal-figures': registryEntry(
    'geometry.g7.geo-01.equal-figures', 'LESSON_GEOMETRY_EQUAL_FIGURES',
    'Как точное совмещение задаёт равенство фигур и соответствие элементов.',
    'Дәл беттестіру фигуралар теңдігін және элементтер сәйкестігін қалай анықтайды.'
  ),
  'geometry.g7.geo-01.proof-methods': registryEntry(
    'geometry.g7.geo-01.proof-methods', 'LESSON_GEOMETRY_PROOF_METHODS',
    'Как строить цепочку от данных к цели и обосновывать каждый переход.',
    'Берілгеннен мақсатқа дейін тізбек құрып, әр ауысуды қалай негіздеу керек.'
  ),
  'geometry.g7.geo-01.angles-perpendicular': registryEntry(
    'geometry.g7.geo-01.angles-perpendicular', 'LESSON_GEOMETRY_ANGLES_PERPENDICULAR',
    'Почему смежные углы дают 180°, вертикальные равны, а прямые перпендикулярны.',
    'Сыбайлас бұрыштар неге 180° беретінін, вертикаль бұрыштар неге тең және түзулер қашан перпендикуляр болатынын түсіндіру.'
  ),
  'geometry.g7.geo-01.practice': registryEntry(
    'geometry.g7.geo-01.practice', 'LESSON_GEOMETRY_INITIAL_PRACTICE',
    'Практика чтения чертежа, выбора свойства и короткого геометрического обоснования.',
    'Сызбаны оқу, қасиетті таңдау және қысқа геометриялық негіздеу практикасы.'
  ),
  'geometry.g7.geo-02.types': registryEntry(
    'geometry.g7.geo-02.types', 'LESSON_GEOMETRY_TRIANGLE_TYPES',
    'Как классифицировать треугольник по сторонам и углам, не полагаясь на внешний вид чертежа.',
    'Үшбұрышты сызбаның сыртқы түріне емес, қабырғалары мен бұрыштарына қарай жіктеу.'
  ),
  'geometry.g7.geo-02.elements': registryEntry(
    'geometry.g7.geo-02.elements', 'LESSON_GEOMETRY_TRIANGLE_ELEMENTS',
    'Как отличать медиану, биссектрису и высоту по их математическим условиям.',
    'Медиананы, биссектрисаны және биіктікті математикалық шарттары бойынша ажырату.'
  ),
  'geometry.g7.geo-02.congruence-1': registryEntry(
    'geometry.g7.geo-02.congruence-1', 'LESSON_GEOMETRY_TRIANGLE_CONGRUENCE_1',
    'Как применять первый и второй признаки равенства треугольников.',
    'Үшбұрыштар теңдігінің бірінші және екінші белгілерін қолдану.'
  ),
  'geometry.g7.geo-02.congruence-2': registryEntry(
    'geometry.g7.geo-02.congruence-2', 'LESSON_GEOMETRY_TRIANGLE_CONGRUENCE_2',
    'Как три стороны доказывают равенство треугольников.',
    'Үш қабырға үшбұрыштар теңдігін қалай дәлелдейтінін түсіну.'
  ),
  'geometry.g7.geo-02.isosceles': registryEntry(
    'geometry.g7.geo-02.isosceles', 'LESSON_GEOMETRY_TRIANGLE_ISOSCELES',
    'Свойства и обратное свойство равнобедренного треугольника.',
    'Теңбүйірлі үшбұрыштың қасиеттері және кері қасиеті.'
  ),
  'geometry.g7.geo-02.equilateral': registryEntry(
    'geometry.g7.geo-02.equilateral', 'LESSON_GEOMETRY_TRIANGLE_EQUILATERAL',
    'Как три равные стороны связаны с тремя углами по 60°.',
    'Үш тең қабырғаның үш 60° бұрышпен байланысы.'
  ),
  'geometry.g7.geo-02.practice': registryEntry(
    'geometry.g7.geo-02.practice', 'LESSON_GEOMETRY_TRIANGLE_CONGRUENCE_PRACTICE',
    'Практика выбора признака и короткого геометрического обоснования.',
    'Белгіні таңдау және қысқа геометриялық негіздеу практикасы.'
  ),
  'geometry.g7.geo-03.transversal': registryEntry('geometry.g7.geo-03.transversal','LESSON_GEOMETRY_G03_TRANSVERSAL','Углы при двух прямых и секущей.','Екі түзу мен қиюшыдағы бұрыштар.'),
  'geometry.g7.geo-03.criteria': registryEntry('geometry.g7.geo-03.criteria','LESSON_GEOMETRY_G03_CRITERIA','Признаки параллельности прямых.','Түзулердің параллельдік белгілері.'),
  'geometry.g7.geo-03.properties': registryEntry('geometry.g7.geo-03.properties','LESSON_GEOMETRY_G03_PROPERTIES','Свойства параллельных прямых.','Параллель түзулердің қасиеттері.'),
  'geometry.g7.geo-03.triangle-relations': registryEntry('geometry.g7.geo-03.triangle-relations','LESSON_GEOMETRY_G03_TRIANGLE_RELATIONS','Внешний угол и неравенство треугольника.','Сыртқы бұрыш және үшбұрыш теңсіздігі.'),
  'geometry.g7.geo-03.right-triangles': registryEntry('geometry.g7.geo-03.right-triangles','LESSON_GEOMETRY_G03_RIGHT_TRIANGLES','Прямоугольные треугольники и проекции.','Тікбұрышты үшбұрыштар және проекциялар.'),
  'geometry.triangle-angle-sum': registryEntry(
    'geometry.triangle-angle-sum', 'LESSON_TRIANGLE_ANGLE_SUM',
    'Как эксперимент приводит к гипотезе, а параллельная прямая объясняет сумму 180°.',
    'Тәжірибе болжамға қалай әкелетінін және параллель түзу 180° қосындысын қалай түсіндіретінін зерттейміз.'
  ),
};

const LESSON_LEGACY_MAP = (function() {
  var map = {};
  Object.keys(LESSON_REGISTRY).forEach(function(id) {
    (LESSON_REGISTRY[id].legacyIds || []).forEach(function(legacyId) { map[legacyId] = id; });
  });
  return map;
})();
