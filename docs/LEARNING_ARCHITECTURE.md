# MathLogic Learning Architecture

This document describes the current product model. The source of truth is the
implementation, primarily `data/curriculum.js`, `js/learning.js`,
`data/lesson-assets.js` and `js/data.js`.

## Two layers: curriculum and presentation

The canonical curriculum is:

```text
Subject → Unit → Topic → Lesson
```

- `Subject` is currently Algebra or Geometry.
- `Unit` is a large official-curriculum grouping with grade metadata and
  curriculum-code coverage.
- `Topic` is a real mathematical group with a stable ID, localized title and
  description, and its own ordered lesson IDs. It is not a generated
  `*.core` placeholder.
- `Lesson` is one routeable learning session with objectives, prerequisites,
  source references, interaction intent, evidence and production status.

`grade` is curriculum metadata, not a platform boundary and not the required
student navigation. The currently populated content scope is grades 7–9; the
data model can add later school levels or other programmes without changing
lesson IDs or storage.

`data/program-presentation.js` is a presentation layer, not a second
curriculum. It maps canonical topic IDs into student-facing **Large Modules**:

```text
Subject → Large Module → Topic → Lesson
```

The Program page is a vertical learning path. It deliberately does not make
grade tabs the primary hierarchy. Large Modules describe a broad direction;
Topics group related lessons; lessons retain canonical order and prerequisites.
Development order never determines course order.

## Curriculum, content and availability

`data/curriculum.js` contains lightweight metadata only. It must not contain
full lesson blocks. A lesson can be `planned`, `implemented`, `reference` or
`needs-review`; this is a production status, not a student state.

`js/data.js` contains `LESSON_REGISTRY`, the registry of actual lesson configs.
Only registry entries have a config global, canonical route
`lesson.html?id=<stable-id>`, duration and loadable content. The legacy `DATA`
view is generated for compatibility and must not become a second source of
truth.

`Learning.getLessonStatus(id)` derives the student state from registry metadata,
progress and prerequisites:

| State | Meaning |
|---|---|
| `completed` | A completed product result exists. |
| `current` | An unfinished meaningful session exists. |
| `available` | Content exists and hard prerequisites are complete. |
| `comingSoon` | A future release date is configured. |
| `locked` | Content is absent/unavailable or required prerequisites are incomplete. |

The Program shows all canonical lessons in their Topic. A lesson title is a
link only when content and a route exist; planned lessons do not create dead
routes. Completed lessons remain routeable for repeat/viewing. Topic progress
uses published lessons only, not nearby planned lessons.

Hard prerequisites affect availability; soft prerequisites are advisory
metadata. The current product deliberately avoids a separate user-managed
unlock state. `Learning.unlock()` remains a compatibility no-op.

Stable canonical lesson IDs are storage and History keys. Do not rename them
casually. `LESSON_LEGACY_MAP` maps known historic IDs and URLs to current IDs.

## Runtime model

`js/learning.js` is the learning-domain API joining curriculum metadata,
registry data and `ML` storage. Useful reads include `getSubjects`,
`getTopics`, `getLessons`, `getLesson`, `getLessonStatus` and `getNextLesson`.
Writes are centred on `completeLesson`, `resetLesson`, `resetSubject` and
`resetAll`.

`getNextLesson()` is deterministic: resume a current lesson first; otherwise
return the earliest unfinished available registered lesson in the active
subject/grade context. The canonical recommended order is authoritative.

`js/dashboard.js` consumes that API for the next lesson and nearby path.
`js/program.js` consumes the presentation layer for the complete student path.
Neither page owns curriculum order.

## Session, completion and history

All data is stored under `mathlogic_data` (storage schema version 2). Lesson
sessions live at `lesson.sessions[canonicalLessonId]`; completed results live
at `progress.lessons[canonicalLessonId]`. Use the storage helpers for dotted
lesson IDs rather than generic dotted-path access.

The Lesson Engine persists its current index, completed blocks, block results,
draft/evidence interaction state and elapsed time. Blocks persist only
meaningful state: drafts, checked answers, hints, repairs and configured
workspace evidence—not every keystroke, pointer move or animation frame.

`js/lesson.js` receives the Engine finish event and calls
`Learning.completeLesson()` once. That transaction records the product result,
study activity and a Learning History event, then clears the in-progress
session. Completion is idempotent; repeating a completed lesson does not add a
second completion or activity event.

Historical XP/streak/reward fields remain only for storage compatibility.
Current learning completion does not award XP or achievements.

## Lesson loading and performance

`lesson.html?id=…` loads the small shared shell first. `js/lesson-loader.js`
resolves the requested canonical ID through `data/lesson-assets.js`, then loads
only that config and its required renderer scripts.

- MathLive is vendored and loads only for lessons that use Math Input.
- Equation, graph and geometry renderers load only when the selected lesson
  declares them in the assets manifest.
- Numeric-angle geometry currently uses a native field and does not load
  MathLive merely for that field.
- `js/dev.js` is loaded only in explicit debug mode (`?debug=1` or `DEV`).

An unknown, locked or unavailable direct route loads only the safe lesson-page
error controller. Direct canonical routes remain the only lesson runtime route.

## Current content

The complete planned catalogue belongs in `data/curriculum.js`; do not maintain
a manual mirror here. Current production examples include the powers sequence,
monomials and polynomials, equivalent transformations of linear equations,
linear-function graphs, Vieta and the triangle-angle-sum lesson.

Use `LESSON_REGISTRY` and `MATHLOGIC_LESSON_ASSETS.lessons` to determine the
current set of loadable lessons rather than this prose.

## Adding a lesson

Follow `docs/LESSON_AUTHORING_GUIDE.md`. In short: use an existing canonical
lesson record, author a validated config, register it, add its lazy-load asset
entry, change production status only after QA, and run the integrity and
relevant primitive tests. Do not create an alternate HTML lesson, a new
completion path or a second curriculum list.
