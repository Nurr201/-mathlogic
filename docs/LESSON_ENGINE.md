# Lesson Engine overview

This short overview is kept for older links. The current API contract is in
[`LESSON_ENGINE_API.md`](LESSON_ENGINE_API.md); the production workflow is in
[`LESSON_AUTHORING_GUIDE.md`](LESSON_AUTHORING_GUIDE.md).

The current runtime is Lesson Engine **2.4.0** with lesson schema **2.5.0**.
It loads a validated config, restores a canonical lesson session, renders
registered blocks, persists meaningful interaction state and emits a finish
event. `js/lesson.js` then performs the one idempotent product completion via
`Learning.completeLesson()`.

Lesson Engine does not own the canonical curriculum, availability, direct route
selection or a CAS. Those are provided respectively by `data/curriculum.js`,
`js/learning.js`, `data/lesson-assets.js`/`js/lesson-loader.js`, and the
configured primitives described in the API document.
