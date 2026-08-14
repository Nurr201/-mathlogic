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
    'algebra.g7.alg-04.property': {
      configGlobal: 'LESSON_ALGEBRAIC_FRACTION_PROPERTY', configScript: 'data/lessons/algebraic-fraction-property.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.g7.alg-04.domain': {
      configGlobal: 'LESSON_ALGEBRAIC_FRACTION_DOMAIN', configScript: 'data/lessons/algebraic-fraction-domain.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.g7.alg-04.common-denominator': {
      configGlobal: 'LESSON_ALGEBRAIC_FRACTION_COMMON_DENOMINATOR', configScript: 'data/lessons/algebraic-fraction-common-denominator.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.g7.alg-04.add-subtract': {
      configGlobal: 'LESSON_ALGEBRAIC_FRACTION_ADD_SUBTRACT', configScript: 'data/lessons/algebraic-fraction-add-subtract.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.g7.alg-04.multiply-divide': {
      configGlobal: 'LESSON_ALGEBRAIC_FRACTION_MULTIPLY_DIVIDE', configScript: 'data/lessons/algebraic-fraction-multiply-divide.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'], mathLive: true,
    },
    'algebra.g7.alg-04.practice': {
      configGlobal: 'LESSON_ALGEBRAIC_FRACTION_TRANSFORMATIONS', configScript: 'data/lessons/algebraic-fraction-transformations.js',
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
    'algebra.g7.alg-05.function-meaning': {
      configGlobal: 'LESSON_FUNCTION_MEANING',
      configScript: 'data/lessons/function-meaning.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js'],
      mathLive: true,
    },
    'algebra.g7.alg-05.coordinate-plane': {
      configGlobal: 'LESSON_COORDINATE_PLANE',
      configScript: 'data/lessons/coordinate-plane.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/graph-workspace.js'],
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
    'algebra.g7.alg-05.linear-position': {
      configGlobal: 'LESSON_LINEAR_GRAPH_POSITIONS',
      configScript: 'data/lessons/linear-graph-positions.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js','js/lesson-blocks/graph-workspace.js'],
      mathLive: true,
    },
    'algebra.g7.alg-05.systems-graphically': {
      configGlobal: 'LESSON_LINEAR_SYSTEMS_GRAPHICALLY',
      configScript: 'data/lessons/linear-systems-graphically.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js','js/lesson-blocks/graph-workspace.js'],
      mathLive: true,
    },
    'algebra.g7.alg-05.other-functions': {
      configGlobal: 'LESSON_OTHER_FUNCTION_GRAPHS',
      configScript: 'data/lessons/other-function-graphs.js',
      primitiveScripts: ['js/lesson-blocks/guided.js','js/math-input.js','js/lesson-blocks/math-response.js','js/lesson-blocks/graph-workspace.js'],
      mathLive: true,
    },
    'algebra.vieta.intro': {
      configGlobal: 'LESSON_VIETA',
      configScript: '',
      primitiveScripts: [],
      mathLive: false,
    },
    'geometry.g7.geo-01.figures-axioms': {
      configGlobal: 'LESSON_GEOMETRY_FIGURES_AXIOMS',
      configScript: 'data/lessons/geometry-figures-axioms.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-01.equal-figures': {
      configGlobal: 'LESSON_GEOMETRY_EQUAL_FIGURES',
      configScript: 'data/lessons/geometry-equal-figures.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-01.proof-methods': {
      configGlobal: 'LESSON_GEOMETRY_PROOF_METHODS',
      configScript: 'data/lessons/geometry-proof-methods.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-01.angles-perpendicular': {
      configGlobal: 'LESSON_GEOMETRY_ANGLES_PERPENDICULAR',
      configScript: 'data/lessons/geometry-angles-perpendicular.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-01.practice': {
      configGlobal: 'LESSON_GEOMETRY_INITIAL_PRACTICE',
      configScript: 'data/lessons/geometry-initial-practice.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-02.types': {
      configGlobal: 'LESSON_GEOMETRY_TRIANGLE_TYPES',
      configScript: 'data/lessons/geometry-triangle-types.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js','js/lesson-blocks/geometry-workspace.js'],
      mathLive: false,
    },
    'geometry.g7.geo-02.elements': {
      configGlobal: 'LESSON_GEOMETRY_TRIANGLE_ELEMENTS',
      configScript: 'data/lessons/geometry-triangle-elements.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-02.congruence-1': {
      configGlobal: 'LESSON_GEOMETRY_TRIANGLE_CONGRUENCE_1',
      configScript: 'data/lessons/geometry-triangle-congruence-1.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-02.congruence-2': {
      configGlobal: 'LESSON_GEOMETRY_TRIANGLE_CONGRUENCE_2',
      configScript: 'data/lessons/geometry-triangle-congruence-2.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-02.isosceles': {
      configGlobal: 'LESSON_GEOMETRY_TRIANGLE_ISOSCELES',
      configScript: 'data/lessons/geometry-triangle-isosceles.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-02.equilateral': {
      configGlobal: 'LESSON_GEOMETRY_TRIANGLE_EQUILATERAL',
      configScript: 'data/lessons/geometry-triangle-equilateral.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-02.practice': {
      configGlobal: 'LESSON_GEOMETRY_TRIANGLE_CONGRUENCE_PRACTICE',
      configScript: 'data/lessons/geometry-triangle-congruence-practice.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'],
      mathLive: false,
    },
    'geometry.g7.geo-03.transversal': {
      configGlobal: 'LESSON_GEOMETRY_G03_TRANSVERSAL', configScript: 'data/lessons/geometry-g03-transversal.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'], mathLive: false,
    },
    'geometry.g7.geo-03.criteria': {
      configGlobal: 'LESSON_GEOMETRY_G03_CRITERIA', configScript: 'data/lessons/geometry-g03-criteria.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'], mathLive: false,
    },
    'geometry.g7.geo-03.properties': {
      configGlobal: 'LESSON_GEOMETRY_G03_PROPERTIES', configScript: 'data/lessons/geometry-g03-properties.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'], mathLive: false,
    },
    'geometry.g7.geo-03.triangle-relations': {
      configGlobal: 'LESSON_GEOMETRY_G03_TRIANGLE_RELATIONS', configScript: 'data/lessons/geometry-g03-triangle-relations.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'], mathLive: false,
    },
    'geometry.g7.geo-03.right-triangles': {
      configGlobal: 'LESSON_GEOMETRY_G03_RIGHT_TRIANGLES', configScript: 'data/lessons/geometry-g03-right-triangles.js',
      primitiveScripts: ['js/lesson-blocks/geometry-diagram.js','js/lesson-blocks/guided.js'], mathLive: false,
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
