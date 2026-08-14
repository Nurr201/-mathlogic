# Runtime Data Audit

This is a concise audit of what current product pages may present as real data.
For the full learning model, see [`LEARNING_ARCHITECTURE.md`](LEARNING_ARCHITECTURE.md).

## Real learning data

- Canonical curriculum metadata is in `data/curriculum.js`; it covers the
  current grades 7–9 content scope and includes planned lessons as metadata.
- Loadable production lessons are exactly the current `LESSON_REGISTRY` entries
  in `js/data.js`, with matching entries in `data/lesson-assets.js`.
- Completed results, unfinished sessions, Activity and Learning History are
  local data under `mathlogic_data`.
- Dashboard and Program obtain learning state through `Learning`; they do not
  maintain independent progress or unlock stores.
- Student-facing content is authored and localized in RU/KK where a production
  config supplies it. Shell copy also follows the saved language.

## Intentionally not represented as earned product data

- Current completion does not grant XP, rewards or achievements. The current streak is derived from canonical `activity.dates`; legacy persisted streak counters are not mutated.
  Historical fields remain only for storage compatibility.
- Program does not invent release dates or routes for planned lessons.
- Planned lesson metadata is not evidence that a lesson config or direct route
  exists.

## Product boundaries

- The app is a static, local-first product. Authentication, profile and
  settings are local demo/runtime features; there is no server synchronisation.
- Lesson content is loaded lazily from the assets manifest. Production lesson
  routes do not statically load every config, MathLive or every workspace.
- Fonts remain external with a non-blocking `display=swap` loading path; this
  is not a claim of offline font availability.
- Legacy `topic.html`, `js/topic.js`, `js/quiz.js` and `js/navigation.js` are
  retained for compatibility outside the current Program/Lesson flow. They are
  not the current canonical learning UI.
