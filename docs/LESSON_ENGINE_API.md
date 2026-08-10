# Lesson Engine API

Current implementation: **Lesson Engine 2.4.0**. Current config schema:
**2.5.0** (`data/lesson-schema.js`). The engine is a configured lesson runner;
it is not a CAS, graphing calculator or general geometry system.

## Core lifecycle

```js
LessonEngine.load(config, container);
LessonEngine.next(result);
LessonEngine.prev();
LessonEngine.goTo(index);
LessonEngine.render();
LessonEngine.getState();
LessonEngine.getBlockResult(index);
LessonEngine.getInteractionState(index);
LessonEngine.setInteractionState(index, value);
LessonEngine.exportState();
LessonEngine.importState(json);
LessonEngine.clearProgress();
```

`load()` validates the compatible schema, restores the canonical lesson session
and determines repeat mode from Learning progress. `next(result)` marks a
block complete, persists the session and eventually emits the finish event.
`js/lesson.js`, not a block renderer, converts that event into the product
completion through `Learning.completeLesson()`.

`getState()` returns the current lesson/block indexes, completed blocks,
assessment summary, attempts, elapsed time, repeat/finished flags and an
evidence summary. Result blocks are not separately responsible for product
completion.

Lifecycle hooks use `LessonEngine.on(name, callback)` / `off()` with
`beforeRender`, `afterRender`, `beforeComplete`, `afterComplete`,
`beforeLesson`, `afterLesson`, `beforeFinish` and `afterFinish`.
Analytics subscriptions use `LessonEngine.analytics.on()` / `off()` with
`onBlockStart`, `onBlockFinish`, `onLessonFinish` and `onAnswer`. The engine
also dispatches DOM events `lesson:blockStart`, `lesson:blockComplete` and
`lesson:finished`.

## Config shape

Every config has a stable `id`, localized content supplied by the authoring
data, `blocks`, optional `meta`, and normally `schemaVersion: '2.5.0'`.
`LessonValidator.validate(config)` is the authoritative preflight check. The
full field-level schema stays in `data/lesson-schema.js`; do not copy it into
lesson configs from an old document.

Every assessment renderer must make submission explicit. Typing, choosing a
draft, moving a graph point, dragging geometry or changing a slider is not an
attempt by itself. Attempts begin when the learner presses the configured
Check action.

## Registered production blocks

The base renderer bundle registers the legacy/general blocks below. Use them
only when their interaction genuinely fits the objective.

| Block | Use and important fields | Persistence / limits |
|---|---|---|
| `hero`, `goal`, `anchor` | Opening, objective, or a short problem to notice. | Informational; no assessment evidence. |
| `theory` | Concise explanation. Use `title`, `content`, optional `formula`, `examples`. `content` is an array. | Informational; it should explain a new idea before demanding independent use. |
| `warmup`, `quiz` | Short choice checks. Use `question`, `options`, `answer`, optional explanation/hint. | Choice draft/result is saved. Do not use long runs of choices as a substitute for instruction. |
| `input` | Small structured native fields. | Exact configured fields; not a general expression editor. |
| `worked-example` | A compact explained transformation. Use `steps`, optional expression/result/takeaway. | Informational support; follow it with learner work when appropriate. |
| `factor-model` | Visual repeated-factor model for configured multiplication/division. | Restricted configured model, not symbolic manipulation. |
| `guided-practice` | Scaffolding with `responseType` (`choice` or `input`), hints, feedback and explicit Check. | Saves answer, hints, attempts, repairs and completion evidence. |
| `decision` | Prediction/decision interaction with options and feedback. | Explicit checked decision; intended for conceptual distinctions. |
| `math-response` | Free mathematical response. Use `question`, `answer`, optional `expression`, `keyboard`, `misconceptions`, `hints`, `compact`. | Saves a debounced draft, syntax issues, hints and checked evidence. See Math Input below. |
| `equation-step` | Explicit next-line equation transformations. Use `initial`, `steps`, optional operation options, keyboard, hints. | Saves equation history and each checked step. It validates configured expected states; it is not a symbolic solver. |
| `graph-workspace` | Configured linear graph work. Use `mode`, `viewport`, structured linear `function`, and mode-specific target/rows/parameter/follow-up. | See Graph Workspace. |
| `geometry-workspace` | Configured triangle exploration or proof. Use `mode`, `viewport`, `vertices`, constraints and mode-specific evidence. | See Geometry Workspace. |
| `lesson-summary` | Final capability summary and next-route handoff. Use `title`, `capabilities`, optional description/labels. | It is the normal final learning block, not a score engine. |
| `mistake`, `sandbox`, `challenge`, `reflection`, `result` | Older/general renderers still registered for compatible configs. | Prefer the production primitives above for new work; they are not a reason to invent custom behaviour. |

`numeric-angle` is not a separate registered renderer. It is a strict
`math-response` answer mode (`answer.kind: 'numeric-angle'`) rendered as a
numeric field with a UI degree suffix.

## Math Input

The stack is:

```text
MathLive editor → MathInput analysis/normalization → block answer validation
```

`js/math-input.js` recognizes numbers, Latin variables, `+ - * / ^ =`,
parentheses, implicit multiplication, superscripts, and configured `sqrt` /
fraction forms. It normalizes a parsed syntax tree for the `normalized`
validator. This accepts structurally equivalent notation supported by that
normalizer; it does **not** prove arbitrary algebraic equivalence or simplify
expressions like a CAS.

Validation distinguishes `empty`, `incomplete`, `invalid`, `incorrect` and
`correct`. Empty/incomplete/invalid input is a repair state, not a mathematical
attempt. `misconceptions` may safely match configured accepted forms for
targeted feedback.

Authors narrow the MathLive keyboard with `keyboard.groups` (`numbers`,
`variables`, `operators`, `powers`, `fractions`, `roots`) and
`keyboard.variables`. Do not expose structures the task does not need.

For a numeric angle, use `kind`/`validation: 'numeric-angle'` and optional
`numericInput.prefix` / `suffix`; the learner enters the magnitude, while the
degree sign belongs to the UI. The validator also accepts familiar persisted or
typed forms such as `67°` and `∠C = 67°`. It accepts signed and decimal
magnitudes syntactically; a lesson's expected answer still determines what is
mathematically correct.

## Equation Workspace (`equation-step`)

Each step has a configured prompt, operation label, expected next line and
expression answer spec. Optional `operationOptions` can diagnose the operation
before entry. The workspace shows Equation History, provides retry and
progressive hints, and persists the current step, history, draft, repairs and
hints.

It does not derive arbitrary legal transformations and does not compare
algebraically equivalent equations beyond the configured normalized answer
forms. Do not claim it is a CAS.

## Graph Workspace (`graph-workspace`)

Current modes are `place-point`, `value-table`, `inspect` and `parameter`.
The function is declarative linear data (`k`, `b`), never executable formula
text. A config supplies a viewport and appropriate targets, rows, parameter or
follow-up decision.

Exploration is distinct from assessment. Selecting/placing a candidate point,
editing a table value or moving a parameter creates local workspace state; an
explicit Check validates the target and records an attempt. The renderer makes
local DOM updates for graph state rather than re-rendering the whole lesson on
each interaction. Meaningful rows, point, parameter visits, hints and repairs
persist; pointer frames do not.

This is a small configured linear-graph primitive, not Desmos and not a parser
for arbitrary functions.

## Geometry Workspace (`geometry-workspace`)

The workspace renders SVG. Mathematical A/B/C vertex coordinates are the
single source of truth; segments, angle arcs, labels and measurements are
computed from them using vector/`atan2` angle calculation. Modes are `explore`
and `proof`.

In `explore`, configured draggable vertices respond to Pointer Events and to
keyboard focus plus arrow keys. Vertices have enlarged touch hit areas. Area
and side constraints prevent nearly degenerate triangles. Dragging is
exploration, not an attempt; a configured follow-up requires explicit Check.

In `proof`, the learner advances author-configured proof steps and can record
the explanation. The renderer persists meaningful vertices, semantic shape
categories, completed drags, follow-up state, hints, repairs and proof step;
it does not write storage for every pointer move. Reduced motion is respected.

Current scope is intentionally narrow: triangle `A/B/C`, its
`acute`/`right`/`obtuse`/`narrow` categories, and a proof overlay whose
auxiliary line is through `A`. It is not a general geometry solver or CAD tool.

## Error handling and debug

If a renderer throws, the engine shows its safe error block and logs the error;
the learner can skip the failed block. Production lesson loading does not load
the debug renderer. Debug is opt-in through `?debug=1` or `window.DEV`.

In debug mode, `ML.dev.resetCurrentLesson()` removes only the current lesson's
session, answers/evidence, completion record, lesson-specific history and its
recorded activity contribution, then reloads the route at its first state. It
preserves other lessons, profile data, settings and language.

## Test the API you use

Run `LessonValidator.validate()` for each config and the relevant tests from
`docs/LESSON_AUTHORING_GUIDE.md`. Schema validation and smoke tests are not a
substitute for a real browser visual pass when one is available.
