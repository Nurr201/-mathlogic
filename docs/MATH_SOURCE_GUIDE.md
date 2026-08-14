# Geomat Source Guide

Audit date: 2026-08-13

## Future lesson-authoring workflow

For every new Geomat topic:

1. Read this guide.
2. Locate the curriculum topic in `data/curriculum.js`.
3. Open only the source chapters or sections mapped to that topic.
4. Verify terminology, scope, prerequisites, and difficulty.
5. Inspect the immediately preceding and following Geomat lessons.
6. Design the interactive lesson sequence.
7. Use source material as the content foundation.
8. Do not copy source prose verbatim.
9. If source coverage is insufficient, explicitly identify the gap before supplementing it.

The guide is a map; a mapped textbook section remains the authority. Do not reread every book for every topic. Do not treat an identifier in code as proof that its source was inspected.

## Audit result and evidence labels

No textbook, PDF, book, teacher manual, exercise collection, or separately stored RU/KK curriculum source is present in the repository working tree or any locally available Git ref. The repository contains project-native curriculum metadata, lesson-authoring methodology, and authored lessons. Those materials are useful for navigation and internal comparison, but they cannot replace the missing educational sources.

This guide uses three evidence labels:

- **Source-derived**: supported by an inspectable educational source file. There are no entries with this label in this audit.
- **Project-defined**: stated in Geomat's own curriculum or authoring documents.
- **Inference**: a cautious comparison made during this audit and explicitly identified as such.

Consequently, every textbook coverage rating below is **SOURCE COVERAGE: NONE**. This means “no inspectable source in the repository,” not “the topic is absent from Kazakhstan textbooks.”

## Source inventory

### Inspectable project-native materials

| Path | Language | Grade(s) | Subject | Identifiable title/author | Coverage and use | Classification |
|---|---|---:|---|---|---|---|
| `data/curriculum.js` | RU/KK | 7–9, plus one grade 5–6 bridge code | Algebra, geometry | Canonical Geomat curriculum metadata; author not stated | 28 units, 65 topics, 169 lesson records; order, curriculum-code tags, prerequisites, misconceptions, scope, and statuses | Project-defined curriculum map; not a textbook |
| `docs/LESSON_AUTHORING_GUIDE.md` | English, with RU/KK implementation requirements | 7–9 | Cross-subject | Geomat Lesson Authoring Guide; author not stated | Targeted source research workflow, lesson progression, evidence, bilingual authoring, and QA rules | Project-defined methodological guide; not mathematical authority |
| `docs/LEARNING_ARCHITECTURE.md` | English | 7–9 | Cross-subject | Geomat Learning Architecture; author not stated | Subject → Unit → Topic → Lesson model, canonical order, prerequisites, production status, and runtime boundaries | Project-defined architecture guide; not mathematical authority |
| `data/lessons/*.js` | Mostly RU/KK; one legacy Vieta example is effectively RU-only | Mostly grade 7; one grade 8 example | Algebra, geometry | Individual Geomat lesson configs; authors not stated | High-level alignment corpus only. Forty-five config files were parsed; 42 correspond to canonical published records and three are noncanonical experiment/legacy configs | Existing authored content; never use as an independent curriculum source |

`docs/FAKE_DATA_AUDIT.md`, engine/API documentation, tests, UI files, and vendor documentation were excluded because they do not provide mathematical curriculum content or external teaching guidance.

### Missing or unresolved references

These identifiers occur in metadata, but no corresponding file, title page, table of contents, chapter text, or stable repository locator exists. They were **not inspected** and must not be cited as verified sources.

| Identifier | Where found | Intended coverage suggested by the identifier | Audit status |
|---|---|---|---|
| `course-design:recommended-course-structure@2026-07-31` | `data/curriculum.js` | Whole-course sequence | Unresolved; no file in repository |
| `course-design:curriculum-coverage-matrix@2026-07-31` | `data/curriculum.js` | Whole-course curriculum coverage | Unresolved; no file in repository |
| `rk-curriculum:algebra-7-9-order-399` | `data/curriculum.js` | Algebra, grades 7–9 | Unresolved; no document or page references |
| `rk-curriculum:geometry-7-9-order-399` | `data/curriculum.js` | Geometry, grades 7–9 | Unresolved; no document or page references |
| `rk-curriculum:<code/range>` | Some lesson `meta.sourceReferences` | Individual learning-objective codes | Reference token only; underlying document unavailable |
| `atamura-algebra-7:*` | Ten grade 7 algebra lesson configs | Powers, standard form, monomials, polynomials, multiplication, and identities | Unresolved; no book file, edition, authors, contents, chapters, or pages |
| `textbook:<subject>-<grade>-ru-kk` | Generated `researchTargets` in `data/curriculum.js` | A future bilingual textbook lookup | Placeholder, not a source |

The `atamura-algebra-7:*` tokens appear in `natural-exponent-meaning.js`, `power-rules.js`, `zero-negative-exponents.js`, `standard-form.js`, `monomials-standard-form.js`, `polynomials-add-subtract.js`, `monomial-polynomial-multiplication.js`, `square-sum-difference.js`, `difference-squares.js`, and `cube-identities.js`. Their apparent specificity does not make them verifiable citations.

## What was actually inspected

- The complete source inventory, including ignored files, symlinks, locally available branches, Git history filenames, and large historical blobs.
- All of `docs/LESSON_AUTHORING_GUIDE.md` and `docs/LEARNING_ARCHITECTURE.md`.
- The complete unit/topic/lesson structure exported by `data/curriculum.js`, including status, prerequisite, scope, code, and source-reference metadata.
- All 45 files in `data/lessons/` by loading their configs and summarizing block progression; targeted close reading covered the active foundations in fractions, functions, algebraic fractions, monomials/polynomials, linear equations/functions, and grade 7 geometry.
- The registry and lazy-load manifests to distinguish canonical published content from orphaned or schema-example content.

No PDF pages or book chapters could be inspected because no such files exist in the repository. Chapter names and page numbers below are therefore intentionally blank rather than guessed.

## Algebra curriculum map

For every row: **Primary source: none available. Secondary source: none available. Relevant chapters/pages: not determinable.** The sequence column is project-defined from `data/curriculum.js`, not textbook-derived.

| Unit | Grade | Project-defined concept sequence (topics) | Published state at audit | Textbook coverage |
|---|---:|---|---|---|
| ALG-01 — Числа и практическая арифметика / Сандар және практикалық арифметика | 7 | Linear equations → fractions and percent → proportions and mathematical models | 6 implemented; bridge/reference lesson stored separately | **SOURCE COVERAGE: NONE** |
| ALG-02 — Степень с целым показателем / Бүтін көрсеткішті дәреже | 7 | Meaning and rules of powers → standard form of a number | 4 implemented, 1 reference | **SOURCE COVERAGE: NONE** |
| ALG-03 — Многочлены и формулы сокращённого умножения / Көпмүшелер және қысқаша көбейту формулалары | 7 | Monomials and polynomials → identities → factorization | 8 implemented | **SOURCE COVERAGE: NONE** |
| ALG-04 — Алгебраические дроби / Алгебралық бөлшектер | 7 | Properties and admissible values → common denominator → operations | 1 implemented, 5 planned | **SOURCE COVERAGE: NONE** |
| ALG-05 — Функции и графики / Функциялар және графиктер | 7 | Function representations → linear relationships → other graphs | 2 implemented, 1 reference, 3 planned | **SOURCE COVERAGE: NONE** |
| ALG-06 — Элементы статистики / Статистика элементтері | 7 | Data and frequencies → representation and analysis | 4 planned | **SOURCE COVERAGE: NONE** |
| ALG-07 — Квадратные корни / Квадрат түбірлер | 8 | Real numbers and roots → transformations with roots | 6 planned | **SOURCE COVERAGE: NONE** |
| ALG-08 — Квадратные уравнения / Квадрат теңдеулер | 8 | Solving quadratics → Vieta and trinomial → reducible equations and models | 1 implemented schema example, 7 planned | **SOURCE COVERAGE: NONE** |
| ALG-09 — Квадратичная функция / Квадраттық функция | 8 | Parabola and its properties → applications | 6 planned | **SOURCE COVERAGE: NONE** |
| ALG-10 — Неравенства / Теңсіздіктер | 8 | Quadratic/rational inequalities and interval method → systems and applications | 7 planned | **SOURCE COVERAGE: NONE** |
| ALG-11 — Элементы статистики / Статистика элементтері | 8 | Grouped data and histograms → cumulative frequency and dispersion | 5 planned | **SOURCE COVERAGE: NONE** |
| ALG-12 — Уравнения и неравенства с двумя переменными / Екі айнымалысы бар теңдеулер мен теңсіздіктер | 9 | Equations and nonlinear systems on the plane → plane inequalities | 6 planned | **SOURCE COVERAGE: NONE** |
| ALG-13 — Комбинаторика / Комбинаторика | 9 | Counting rules and factorial → arrangements, combinations, binomial theorem | 6 planned | **SOURCE COVERAGE: NONE** |
| ALG-14 — Последовательности / Тізбектер | 9 | Sequences and induction → arithmetic/geometric progressions | 6 planned | **SOURCE COVERAGE: NONE** |
| ALG-15 — Тригонометрия / Тригонометрия | 9 | Angle measure and trigonometric functions → identities and transformations | 7 planned | **SOURCE COVERAGE: NONE** |
| ALG-16 — Элементы теории вероятностей / Ықтималдық теориясының элементтері | 9 | Events and elementary probability → classical, statistical, and geometric models | 5 planned | **SOURCE COVERAGE: NONE** |

Exact topic IDs for targeted lookup:

- ALG-01: `ALG-01.linear-equations`, `ALG-01.fractions-percent`, `ALG-01.proportions-models`
- ALG-02: `ALG-02.powers`, `ALG-02.standard-form`
- ALG-03: `ALG-03.monomials-polynomials`, `ALG-03.identities`, `ALG-03.factorization`
- ALG-04: `ALG-04.properties-domain`, `ALG-04.common-denominator`, `ALG-04.operations`
- ALG-05: `ALG-05.function-representations`, `ALG-05.linear-relationships`, `ALG-05.other-graphs`
- ALG-06: `ALG-06.data-frequency`, `ALG-06.data-representation`
- ALG-07: `ALG-07.real-roots`, `ALG-07.root-transformations`
- ALG-08: `ALG-08.quadratic-solving`, `ALG-08.vieta-trinomial`, `ALG-08.quadratic-applications`
- ALG-09: `ALG-09.parabola`, `ALG-09.parabola-applications`
- ALG-10: `ALG-10.interval-method`, `ALG-10.inequality-systems`
- ALG-11: `ALG-11.grouped-data`, `ALG-11.data-measures`
- ALG-12: `ALG-12.two-variable-equations`, `ALG-12.plane-inequalities`
- ALG-13: `ALG-13.counting-rules`, `ALG-13.combinatorics`
- ALG-14: `ALG-14.sequence-basics`, `ALG-14.progressions`
- ALG-15: `ALG-15.trig-functions`, `ALG-15.trig-identities`
- ALG-16: `ALG-16.events`, `ALG-16.probability-models`

## Geometry curriculum map

For every row: **Primary source: none available. Secondary source: none available. Relevant chapters/pages: not determinable.** The sequence column is project-defined from `data/curriculum.js`, not textbook-derived.

| Unit | Grade | Project-defined concept sequence (topics) | Published state at audit | Textbook coverage |
|---|---:|---|---|---|
| GEO-01 — Начальные геометрические сведения / Бастапқы геометриялық мәліметтер | 7 | Geometric language and proof → angles and lines | 5 implemented | **SOURCE COVERAGE: NONE** |
| GEO-02 — Треугольники / Үшбұрыштар | 7 | Triangle types/elements → congruence and special triangles | 7 implemented | **SOURCE COVERAGE: NONE** |
| GEO-03 — Параллельные прямые / Параллель түзулер | 7 | Parallel lines and transversal → triangle angles/inequalities → right triangles | 5 implemented, 1 reference | **SOURCE COVERAGE: NONE** |
| GEO-04 — Окружность и построения / Шеңбер және салу есептері | 7 | Circle and relative positions → tangents and constructions | 5 planned | **SOURCE COVERAGE: NONE** |
| GEO-05 — Четырёхугольники / Төртбұрыштар | 8 | Polygons/parallelogram → special quadrilaterals → lines and centres | 7 planned | **SOURCE COVERAGE: NONE** |
| GEO-06 — Прямоугольный треугольник и теорема Пифагора / Тікбұрышты үшбұрыш және Пифагор теоремасы | 8 | Ratios and Pythagoras → altitude/constructions → identities and applications | 6 planned | **SOURCE COVERAGE: NONE** |
| GEO-07 — Площади / Аудандар | 8 | Meaning and base area formulas → triangle, trapezoid, and composite areas | 6 planned | **SOURCE COVERAGE: NONE** |
| GEO-08 — Метод координат / Координаталар әдісі | 8 | Distance, midpoint, section ratio → circle/line equations | 5 planned | **SOURCE COVERAGE: NONE** |
| GEO-09 — Векторы / Векторлар | 9 | Vector meaning and operations → coordinates, dot product, vector method | 6 planned | **SOURCE COVERAGE: NONE** |
| GEO-10 — Подобие и движения / Ұқсастық және түрлендірулер | 9 | Plane motions → homothety and similarity | 6 planned | **SOURCE COVERAGE: NONE** |
| GEO-11 — Решение треугольников / Үшбұрыштарды шешу | 9 | Cosine/sine laws → area, radii, and solving triangles | 6 planned | **SOURCE COVERAGE: NONE** |
| GEO-12 — Окружности и правильные многоугольники / Шеңберлер және дұрыс көпбұрыштар | 9 | Arcs/sectors/inscribed angles → chords, tangents, cyclic quadrilaterals → regular polygons | 6 planned | **SOURCE COVERAGE: NONE** |

Exact topic IDs for targeted lookup:

- GEO-01: `GEO-01.geometry-language`, `GEO-01.angles-lines`
- GEO-02: `GEO-02.triangle-basics`, `GEO-02.congruence-properties`
- GEO-03: `GEO-03.parallel-lines`, `GEO-03.triangle-angles`, `GEO-03.right-triangles`
- GEO-04: `GEO-04.circle-positions`, `GEO-04.tangents-constructions`
- GEO-05: `GEO-05.polygons-parallelogram`, `GEO-05.special-quadrilaterals`, `GEO-05.quadrilateral-lines`
- GEO-06: `GEO-06.right-triangle-ratios`, `GEO-06.right-triangle-constructions`, `GEO-06.right-triangle-applications`
- GEO-07: `GEO-07.area-basics`, `GEO-07.area-figures`
- GEO-08: `GEO-08.coordinate-basics`, `GEO-08.coordinate-equations`
- GEO-09: `GEO-09.vector-operations`, `GEO-09.vector-coordinates`
- GEO-10: `GEO-10.transformations`, `GEO-10.similarity`
- GEO-11: `GEO-11.triangle-laws`, `GEO-11.triangle-area`
- GEO-12: `GEO-12.arcs-angles`, `GEO-12.circle-lines`, `GEO-12.regular-polygons`

## RU/KK terminology

No independent RU/KK source was available, so the table records **current project usage only**. It is a search aid, not a source-verified glossary. Future authors must verify every row against actual mapped RU and KK materials before publishing.

| Concept | Current RU usage | Current KK usage | Repository evidence | Status |
|---|---|---|---|---|
| function | функция | функция | `data/lessons/function-meaning.js` | Project-defined; external check required |
| argument | аргумент | аргумент | `data/lessons/function-meaning.js` | Project-defined; external check required |
| function value | значение функции | функцияның мәні | `data/lessons/function-meaning.js` | Project-defined; external check required |
| algebraic fraction | алгебраическая дробь | алгебралық бөлшек | `data/lessons/algebraic-fraction-property.js` | Project-defined; external check required |
| numerator | числитель | алым | `data/lessons/fractions.js`, `data/lessons/algebraic-fraction-property.js` | Project-defined; external check required |
| denominator | знаменатель | бөлім | Same as above | Project-defined; external check required |
| admissible values of a variable | допустимые значения переменной | айнымалының мүмкін мәндері | `data/curriculum.js` | Planned label only; highest-priority external check |
| monomial | одночлен | бірмүше | `data/lessons/monomials-standard-form.js` | Project-defined; unresolved Atamura token exists |
| polynomial | многочлен | көпмүше | `data/lessons/polynomials-add-subtract.js` | Project-defined; unresolved Atamura token exists |
| coefficient | коэффициент | коэффициент | `data/lessons/monomials-standard-form.js` | Project-defined; external check required |
| degree | степень | дәреже | `data/lessons/monomials-standard-form.js` | Project-defined; external check required |
| equation | уравнение | теңдеу | `data/curriculum.js`, `data/lessons/linear-equations.js` | Project-defined; external check required |
| inequality | неравенство | теңсіздік | `data/curriculum.js` | Curriculum label only; external check required |

No disagreement between actual source books can be documented because none are present. One concrete internal KK issue was found: in `data/lessons/algebraic-fraction-property.js`, the spoken label for `6/8` is `алтыдан сегіз`; the same file otherwise uses the denominator-first pattern (for example `төрттен үш` for `3/4`). This label should be checked and corrected during a future lesson audit, not in this source-audit task.

## Pedagogical information available in the repository

The following is **project-defined**, primarily by `docs/LESSON_AUTHORING_GUIDE.md`, and not attributed to a textbook:

- Preferred progression: new idea and why → supported application → independent work → unfamiliar or misconception case → transfer/concept check.
- Introduce meaning before the first difficult independent task; avoid test-only sequences.
- Typical lessons use 8–12 meaningful states, with length determined by the idea rather than a quota.
- Prefer written mathematical evidence or the relevant workspace once feasible. Viewing theory or moving a diagram alone is not mastery evidence.
- Hints should progress from direction → principle → concrete next step.
- Current authored examples often begin with a numerical, visual, or contextual case before formal language: equal numerical fractions before algebraic fractions; an input/output machine before the definition of function; a product structure before the definition and degree of a monomial.
- Common authored progression is anchor/diagnosis → theory or worked example → guided practice → independent response → transfer → summary. This is an observation about Geomat content, not a recovered textbook sequence.

Textbook-specific prerequisite relationships, example order, exercise ladders, and expected difficulty remain unknown until the actual sources are stored.

## Authoring rules derived from the audit

1. Treat `data/curriculum.js` as the canonical Geomat order, not as proof of textbook coverage.
2. Treat `course-design:*`, `rk-curriculum:*`, `atamura-algebra-7:*`, and `textbook:*` strings as unresolved until they point to an existing file and section.
3. Do not change `SOURCE COVERAGE: NONE` to partial or strong from a lesson's citation token alone.
4. Do not use current lesson wording as the authority for KK terminology. It may be retained provisionally only when clearly marked for source verification.
5. When sources are added, record edition/title/author, language, printed page and PDF page if different, table-of-contents structure, relevant definitions/examples, task progression, prerequisites, and terminology.
6. Map only topics actually covered. Use **STRONG** when a source supplies definition, sequence, examples, and suitable exercises; **PARTIAL** when it supplies only part of that foundation; otherwise use **NONE**.
7. Preserve Geomat's interactive strengths, but do not silently expand difficulty or scope beyond the mapped source level.
8. Read the preceding and following canonical lessons so the topic builds rather than restarts.
9. Do not copy textbook prose or exercises in bulk; summarize the pedagogical role and create original interactive tasks.
10. If external supplementation is necessary, state the source gap before research and add the resulting stable source to this guide.

## Existing lesson alignment notes

These are intentionally high-level.

- **Internally aligned, but not textbook-validated:** the published grade 7 sequences for ALG-01 through ALG-03, the opening ALG-04 lesson, the opening ALG-05 lessons, and GEO-01 through GEO-03 generally follow their canonical topic order and move from explanation/diagnosis to supported and independent evidence.
- **Source grounding is unverified:** all 39 lessons marked `implemented` also have `needsKKTerminologyCheck: true` and `needsMisconceptionResearch: true` in the current generated metadata. Ten algebra lessons name an unavailable Atamura token; the others usually cite only unresolved curriculum/course-design tokens or contain no config-level references.
- **Concrete prerequisite problem:** `algebra.vieta.intro` is marked implemented and routeable while its hard prerequisite `algebra.g8.alg-08.discriminant` is planned. Runtime registry construction removes unavailable prerequisite IDs, so the implemented Vieta example can appear without the prerequisite demanded by the canonical curriculum.
- **Concrete content-status problem:** `algebra.vieta.intro` is copied from `LESSON_SCHEMA.example`, is effectively RU-only, retains legacy/example metadata, and is nevertheless counted as implemented. It should not be treated as source-grounded production evidence.
- **Scope overlap to verify:** `geometry.g7.geo-03.right-triangles` introduces the altitude to the hypotenuse and projections, while the grade 8 GEO-06 map separately reserves an altitude/constructions topic. Without a source, the grade 7 scope cannot be confirmed; inspect both grade 7 and grade 8 source sections before extending either sequence.
- **Internal order discrepancy:** the ALG-01 linear-equations bridge appears first in canonical order but declares fractions as a soft prerequisite, which follows it in that same order. This may be an intentional bridge, but future authoring should not assume the displayed order establishes the prerequisite.
- Noncanonical experimental lesson configs found outside the curriculum, registry, and runtime asset manifest were removed during the release cleanup.
- No other obvious mathematical error, clearly excessive difficulty, or missing prerequisite was established by this limited comparison. Absence of a flag is not source validation.

## Coverage gaps

- No inspectable RU or KK textbook for algebra or geometry, grades 7–9.
- No teacher book, methodological manual, exercise collection, or official curriculum/order document.
- No title, author, edition, chapter, or page data behind the Atamura tokens.
- No source-established RU/KK terminology table.
- No source-derived exercise progression or difficulty calibration for any of the 65 topics.
- No source evidence for the 126 planned lessons, and no verified source evidence for the 43 published/reference records.
- No way to compare terminology disagreements between RU and KK editions.

## Next Geomat authoring target

The immediate canonical lesson after the implemented `algebra.g7.alg-04.property` is `algebra.g7.alg-04.domain` within topic `ALG-04.properties-domain`:

- RU: **Допустимые значения переменной**
- KK: **Айнымалының мүмкін мәндері** (provisional project wording)
- Required predecessor inspection: `data/lessons/algebraic-fraction-property.js`
- Required following-scope inspection: metadata for `algebra.g7.alg-04.common-denominator` in `data/curriculum.js`
- Required authoritative source sections: grade 7 RU and KK algebra sections that define algebraic fractions, denominator restrictions/admissible variable values, equality under cancellation, and the transition to a common denominator.
- Current source sections/pages to open: **none available**. Do not author this lesson as source-grounded until those files are stored and mapped here.

The next wholly unopened algebra topic is `ALG-04.common-denominator`; the next wholly unopened geometry topic is `GEO-04.circle-positions`. Both also have **SOURCE COVERAGE: NONE**.

## Verification record

- Every path presented as an existing repository file was checked on 2026-08-13.
- No nonexistent chapter or page reference is presented as verified.
- All source-identifying claims are separated from project-defined metadata and audit inference.
- No lesson or curriculum file was changed during this audit.
