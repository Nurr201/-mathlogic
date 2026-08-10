# MathLogic Lesson Authoring Guide

Use this guide to add a production lesson inside the existing MathLogic
architecture. Do not start by designing a new engine.

## 1. Start with the canonical lesson

1. Find the planned lesson in `data/curriculum.js` and its Topic.
2. Confirm its stable ID, subject, grade metadata, Unit/Topic, objectives,
   curriculum codes, hard/soft prerequisites, intended archetype, sources and
   exclusions.
3. Read the immediately previous and next lessons so that the Topic is a
   sequence, not repeated independent files.
4. Do targeted research in MathLogic Sources for this Topic only. Use it for
   scope, sequence, misconceptions and verified RU/KK terminology—not copied
   textbook prose.
5. Write a short content spec: new meaning, why it works, worked example if
   needed, independent evidence, likely misconception, transfer and exclusions.

`data/curriculum.js` is the canonical order. The order in which a developer
authors lesson files never changes the Program path. Do not rename released
lesson IDs: progress, History, sessions and direct routes depend on them.

## 2. Choose an existing primitive

| Need | Use |
|---|---|
| Explain a concise idea | `theory`, often followed by `worked-example` |
| Diagnose a conceptual distinction or prediction | `decision` or a selective `quiz` |
| Give scaffolded choice/text practice | `guided-practice` |
| Let the learner write an expression/equation/number | `math-response` + Math Input |
| Require a strictly numeric angle | `math-response` with `numeric-angle` answer mode |
| Preserve equality through explicit steps | `equation-step` |
| Connect table, points, linear graph or parameter | `graph-workspace` |
| Explore a configured triangle or proof states | `geometry-workspace` |
| Show a task-linked elementary geometry drawing | `guided-practice` with structured `diagram` |
| Close a lesson | `lesson-summary` |

Use a workspace only when directly manipulating its mathematical object helps
the objective. A new dependency, renderer, parser, CAS or workspace is an
architecture task, not routine lesson authoring. MathLive is already vendored;
do not download it or another library per lesson.

## 3. Production lesson standard

Aim usually for **8–12 meaningful states**. A harder topic may need more; a
simple skill may need fewer. State count is not a KPI.

Build a visible progression:

```text
new idea and why → supported application → independent work
→ less familiar/tricky case → transfer or conceptual check
```

- Explain the new mathematical meaning before the first difficult independent
  task. A lesson must not be only a sequence of tests.
- Explain *why*, using a specific expression/diagram/transformation, not only
  a procedure. Include a concise worked example where the step is new.
- Remove filler, repeated restatements and near-identical drills. Do not remove
  required reasoning, feedback or meaningful practice merely to make a lesson
  shorter.
- Once the learner has demonstrated the idea twice, raise the demand or move
  on. The final task should not be the first task with different numbers.
- Prefer independent Math Input or the relevant workspace once writing a real
  answer is feasible. Use multiple choice mainly for diagnostic distractors,
  predictions and conceptual discrimination.
- Keep correct option positions stable in data and non-predictably distributed;
  never runtime-shuffle answers.

Before finalising, remove any state that adds no new understanding, support,
practice variation or evidence.

## 4. Config, feedback and evidence

Create a config in `data/lessons/` using schema version `2.5.0`. Every
student-facing field needs authored RU and KK content, including titles,
prompts, options, feedback, hints and summary. Verify terms against Kazakhstan
sources; leave research flags honest when a term still needs checking.

Use the exact block config fields defined by `data/lesson-schema.js` and
summarised in `docs/LESSON_ENGINE_API.md`. Validate with:

```js
LessonValidator.validate(config)
```

For assessment:

- Editing, dragging, choosing a draft and moving a parameter are not attempts.
  Require explicit Check.
- Treat empty, incomplete and invalid Math Input as repair states, not wrong
  mathematics.
- Add targeted feedback only for safe, known misconception patterns. Other
  valid wrong answers deserve useful conceptual feedback.
- Hints progress from direction → principle → concrete next step. Do not reveal
  the complete answer in the first hint.
- Define completion evidence that proves the objective. Viewing theory or
  moving a diagram is not mastery evidence by itself.

The Engine persists meaningful drafts, hints, checked results, repairs and
workspace evidence. Do not write custom storage for every keystroke, slider
tick or pointer move. Refresh must not duplicate completion, Learning History
or Activity.

## 5. Register and load the lesson

After the config genuinely exists:

1. Add the existing canonical ID to `LESSON_REGISTRY` in `js/data.js` through
   the normal registry helper. Keep its canonical route
   `lesson.html?id=<id>`, title, duration and legacy mapping intact.
2. Add the matching entry to `data/lesson-assets.js`: config global, config
   script, only the primitive scripts it needs, and `mathLive: true` only when
   the lesson really uses Math Input.
3. Change only that existing curriculum lesson's production status to
   `implemented` or `reference` after validation and QA. Do not create a
   duplicate curriculum record.
4. Confirm Program now uses the canonical Topic and route: real content has a
   clickable title; planned content has no dead link.
5. Check `Learning.getNextLesson()` from the neighbouring lessons. Preserve
   canonical prerequisites and recommended order.

Lesson metadata stays in curriculum; full lesson blocks stay out of it. The
assets manifest is what keeps lesson loading proportional to the opened route.

## 6. Topic batch workflow

One production run can implement a coherent Topic of two to four lessons:

1. Select the Topic and enumerate all its planned lessons.
2. Do one focused research pass for the shared mathematics, then set distinct
   boundaries for each lesson.
3. Design the sequence so later lessons use earlier knowledge without
   reteaching it from zero.
4. Author all configs, then register configs/assets and update production
   status only for actual content.
5. Audit Program order, prerequisite chain, direct routes, next lesson,
   resume/completion and Topic progress together.

Topic authoring order may differ from learning order. Program always follows
the curriculum's deterministic recommended order.

## 7. Accessibility and performance

- Labels, keyboard focus and keyboard operation are required for answer
  controls. Color never carries the sole meaning.
- Use the contextual MathLive keyboard groups; keep compact answers compact.
- Graph and geometry exploration must work through their documented keyboard
  paths, preserve meaningful state on resize/refresh, and respect reduced
  motion.
- Keep RU/KK source text authored in data; do not machine-translate in a
  renderer at runtime.
- Do not add a dependency for a normal production lesson. Use existing
  vendored dependencies and primitives.

## 8. Required checks

Run the relevant subset plus the shared integrity gates:

```sh
node tests/curriculum-integrity.js
node tests/answer-position-audit.js
node tests/math-input.js                 # when Math Input is used
node tests/graph-workspace.js            # when graph workspace is used
node tests/geometry-workspace.js         # when geometry workspace is used
node tests/performance-audit.js           # assets/loading manifest changed
node tests/core-smoke.js
node tests/page-smoke.js
node --check <each changed JS file>
git diff --check
```

`curriculum-integrity` checks canonical entities, IDs, topic membership,
prerequisites/cycles, registry alignment and presentation references.
`answer-position-audit` checks option answers and positional bias.
`math-input` checks parser/normalization and numeric-angle cases.
`graph-workspace` and `geometry-workspace` test configured mathematical and
interaction behaviour. `performance-audit` checks the lazy lesson-load budget.
`core-smoke` covers learning/storage/engine integration; `page-smoke` exercises
routes, lesson flows, persistence and selected page DOM behaviour.

Automated smoke tests are not real visual browser QA. When a browser runtime is
available, also complete a correct path, misconception/repair path and
refresh/resume path in RU and KK at the relevant desktop and mobile widths.
State clearly when browser QA could not run.
