# Lesson Engine 2.2

Lesson Engine отображает JSON-конфиг урока, управляет блоками и незавершённой session. Он не записывает product result самостоятельно.

## Состав

| Файл | Ответственность |
|---|---|
| `js/lesson-engine/state.js` | runtime state, время, assessment summary |
| `js/lesson-engine/storage.js` | session через `ML.getLessonSession` / `setLessonSession` |
| `js/lesson-engine/hooks.js` | lifecycle и analytics callbacks |
| `js/lesson-engine/core.js` | load, render, navigation, finish |
| `js/lesson-engine/serializer.js` | ручной export/import session |
| `js/lesson-blocks/*` | реестр и renderers 12 типов блоков |
| `data/lesson-schema.js` | validator и конфиг Виета |
| `data/lessons/exponents.js` | конфиг степеней |
| `js/lesson.js` | Axis shell, route, metadata и связь с Learning |

## Lifecycle

```text
LessonEngine.load(config)
  → validate config/version
  → init state
  → определить repeatMode через Learning
  → восстановить lesson.sessions[id]
  → render current block

LessonEngine.next(result)
  → заменить result текущего блока
  → пересчитать score/mistakes без накопления дублей
  → отметить block completed
  → сохранить session
  → render next block
  → если next block = result, вызвать finish()

finish() [идемпотентно]
  → обновить duration
  → сохранить финальный runtime state
  → emit lesson:finished / onLessonFinish
  → js/lesson.js вызывает Learning.completeLesson один раз
  → Learning сохраняет result, учебные stats, activity и очищает session
```

Completion фиксируется при входе на подтверждённый экран `result`; уход со страницы после появления результата не теряет завершение.

## Assessment

В процент входят только блоки, которые вернули `correct`. Теория, подсказки, sandbox и reflection не считаются правильными ответами. Challenge может вернуть `correctAnswers` и `totalQuestions`, поэтому частично решённый challenge учитывается корректно.

`LessonEngine.getState()` дополнительно возвращает `correctAnswers`, `totalQuestions`, `percentage`, `attempts`, `startedAt`.

Повторная отправка ответа заменяет сохранённый результат блока. Она не прибавляет баллы второй раз. Для нескольких равноправных корней input поддерживает `unordered: true`.

## Session и repeat mode

Незавершённое состояние лежит в `mathlogic_data.lesson.sessions[canonicalLessonId]` и содержит текущий индекс, completed blocks, ответы, результаты блоков, прошедшее время и `startedAt`.

У завершённого урока `Learning` хранит product result в `progress.lessons`. При новом открытии Engine включает `repeatMode`, а временная repeat-session очищается после результата. Повтор не изменяет ранее сохранённый результат.

## Блоки

Поддерживаются `hero`, `goal`, `warmup`, `anchor`, `theory`, `quiz`, `input`, `mistake`, `sandbox`, `challenge`, `reflection`, `result`.

Hint у quiz скрыт до явного действия. Challenge требует ответы на все задания. Sandbox не выполняет динамический код: вычисления реализованы безопасными ветками renderer.

## UI-интеграция

`lesson.html?id={canonicalId}` — единственный активный маршрут. `js/lesson.js` берёт metadata/config из registry, а любое число блоков группирует в пять визуальных этапов Axis: старт, правило, разбор, практика, результат. Это только навигационная группировка; Engine не ограничен пятью блоками.

Тексты shell доступны на русском и казахском через `settings.lang`. Содержимое самих текущих lesson configs остаётся русским и должно локализоваться на уровне данных, не внутри Engine.

## Проверка нового урока

```js
const result = LessonValidator.validate(config);
if (!result.valid) console.error(result.errors);
```

Проверить оба маршрута в браузере, resume после reload, завершение, repeat без изменения результата и отображение результата на Dashboard. Ядро: `node tests/core-smoke.js`.
