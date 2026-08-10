/* Runtime assets for implemented lessons. Curriculum metadata remains canonical. */
window.MATHLOGIC_LESSON_ASSETS = {
  version: '1.0.0',
  schemaScript: 'data/lesson-schema.js',
  lessons: {
    'algebra.g7.alg-01.fractions': {
      configGlobal: 'LESSON_ALG01_FRACTIONS',
      configScript: 'data/lessons/fractions.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-01.percent': {
      configGlobal: 'LESSON_ALG01_PERCENT',
      configScript: 'data/lessons/percent.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-01.proportions': {
      configGlobal: 'LESSON_ALG01_PROPORTIONS', configScript: 'data/lessons/proportions.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.g7.alg-01.parts-mixtures': {
      configGlobal: 'LESSON_ALG01_PARTS_MIXTURES', configScript: 'data/lessons/parts-mixtures.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.g7.alg-01.model': {
      configGlobal: 'LESSON_ALG01_MODEL', configScript: 'data/lessons/model.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.g7.alg-01.practice': {
      configGlobal: 'LESSON_ALG01_PRACTICE', configScript: 'data/lessons/practice.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.g7.alg-02.meaning': {
      configGlobal: 'LESSON_NATURAL_EXPONENT_MEANING',
      configScript: 'data/lessons/natural-exponent-meaning.js',
      primitiveScripts: [
        'js/lesson-blocks/guided.js',
        'js/math-input.js',
        'js/lesson-blocks/math-response.js',
      ],
      mathLive: true,
    },
    'algebra.exponents.basics': {
      configGlobal: 'LESSON_EXPONENTS',
      configScript: 'data/lessons/exponents.js',
      primitiveScripts: [
        'js/lesson-blocks/guided.js',
        'js/math-input.js',
        'js/lesson-blocks/math-response.js',
      ],
      mathLive: true,
    },
    'algebra.g7.alg-02.power-rules': {
      configGlobal: 'LESSON_POWER_RULES',
      configScript: 'data/lessons/power-rules.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-02.zero-negative': {
      configGlobal: 'LESSON_ZERO_NEGATIVE_EXPONENTS',
      configScript: 'data/lessons/zero-negative-exponents.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-02.standard-form': {
      configGlobal: 'LESSON_STANDARD_FORM',
      configScript: 'data/lessons/standard-form.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-03.monomials': {
      configGlobal: 'LESSON_MONOMIALS_STANDARD_FORM',
      configScript: 'data/lessons/monomials-standard-form.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-03.polynomials': {
      configGlobal: 'LESSON_POLYNOMIALS_ADD_SUBTRACT',
      configScript: 'data/lessons/polynomials-add-subtract.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-03.multiplication': {
      configGlobal: 'LESSON_MONOMIAL_POLYNOMIAL_MULTIPLICATION',
      configScript: 'data/lessons/monomial-polynomial-multiplication.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-03.square-sum-difference': {
      configGlobal: 'LESSON_SQUARE_SUM_DIFFERENCE',
      configScript: 'data/lessons/square-sum-difference.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-03.difference-squares': {
      configGlobal: 'LESSON_DIFFERENCE_SQUARES',
      configScript: 'data/lessons/difference-squares.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-03.cubes': {
      configGlobal: 'LESSON_CUBE_IDENTITIES',
      configScript: 'data/lessons/cube-identities.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-03.factorization': {
      configGlobal: 'LESSON_FACTORIZATION', configScript: 'data/lessons/factorization.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.g7.alg-03.practice': {
      configGlobal: 'LESSON_POLYNOMIAL_TRANSFORMATIONS_PRACTICE', configScript: 'data/lessons/polynomial-transformations-practice.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.linear-equations.equivalent-transformations': {
      configGlobal: 'LESSON_LINEAR_EQUATIONS',
      configScript: 'data/lessons/linear-equations.js',
      primitiveScripts: [
        'js/lesson-blocks/guided.js',
        'js/math-input.js',
        'js/lesson-blocks/math-response.js',
        'js/lesson-blocks/equation-step.js',
      ],
      mathLive: true,
    },
    'algebra.linear-functions.graph': {
      configGlobal: 'LESSON_LINEAR_FUNCTIONS',
      configScript: 'data/lessons/linear-functions.js',
      primitiveScripts: [
        'js/lesson-blocks/guided.js',
        'js/math-input.js',
        'js/lesson-blocks/math-response.js',
        'js/lesson-blocks/graph-workspace.js',
      ],
      mathLive: true,
    },
    'algebra.vieta.intro': {
      configGlobal: 'LESSON_VIETA',
      configScript: '',
      primitiveScripts: [],
      mathLive: false,
    },
    'geometry.triangle-angle-sum': {
      configGlobal: 'LESSON_TRIANGLE_ANGLE_SUM',
      configScript: 'data/lessons/triangle-angle-sum.js',
      primitiveScripts: [
        'js/lesson-blocks/guided.js',
        'js/math-input.js',
        'js/lesson-blocks/math-response.js',
        'js/lesson-blocks/geometry-workspace.js',
      ],
      /* Its math-response blocks use the native numeric-angle field. */
      mathLive: false,
    },
  },
};
