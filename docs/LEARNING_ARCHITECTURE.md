# MathLogic Learning Architecture

Актуальный контракт после перехода на канонические уроки и storage schema v2.

## Источники данных

- `js/data.js` содержит каталог `DATA` и реестр реально реализованных уроков `LESSON_REGISTRY`.
- Каталог описывает весь будущий курс. Наличие строки в `DATA` не означает, что контент готов.
- Только урок из `LESSON_REGISTRY` с `availability: "available"` и выполненными optional `prerequisites` открывается в `lesson.html?id=...`.
- `LESSON_LEGACY_MAP` явно сопоставляет старые ID и старые URL с постоянными ID. ID больше не выводится из позиции элемента в массиве.
- `js/learning.js` объединяет каталог, реестр и пользовательские данные и является публичным read/write API учебного домена.

Сейчас зарегистрированы:

| Канонический ID | Конфиг | Маршрут |
|---|---|---|
| `algebra.exponents.basics` | `LESSON_EXPONENTS` | `lesson.html?id=algebra.exponents.basics` |
| `algebra.vieta.intro` | `LESSON_VIETA` | `lesson.html?id=algebra.vieta.intro` |

`topic-1-expressions.html` сохранён только как redirect для старых ссылок.

## Storage schema v2

Все пользовательские данные хранятся под одним ключом `mathlogic_data`:

```js
{
  version: 2,
  user: { xp, level, streak, ... },
  progress: {
    lessons: {
      "algebra.exponents.basics": {
        status: "completed",
        percentage: 80,
        correctAnswers: 4,
        totalQuestions: 5,
        duration: 320,
        startedAt: 0,
        completedAt: 0,
        xpEarned: 90
      }
    },
    subtopics: {}
  },
  lesson: {
    sessions: {
      "algebra.vieta.intro": { currentIndex, completedBlocks, answers, blockResults, timeSpent }
    }
  },
  activity: { dates: [], studySecondsByDate: {} },
  rewards: { "lesson:algebra.exponents.basics": { amount, awardedAt, reason } },
  settings: {}, stats: {}, achievements: [], timeline: []
}
```

`ML.get()` возвращает копию данных. Согласованные изменения выполняются через `ML.update(mutator)`. Сессии с ID, содержащими точки, читаются только через `getLessonSession` / `setLessonSession`, а не через dotted path.

При чтении применяются defaults, проверяются основные типы и выполняются идемпотентные миграции:

- `progress.lessonStates` → `progress.lessons`;
- `lesson.v2` → `lesson.sessions`;
- старые lesson ID → канонические ID;
- `ml_streak_dates` → `activity.dates`.

Ошибки чтения/записи не скрываются полностью: они доступны через `ML.getDiagnostics()` и выводятся в console. При повреждённом JSON приложение безопасно стартует с defaults.

## Статусы урока

`Learning.getLessonStatus(id)` возвращает ровно одно состояние:

| Статус | Основание |
|---|---|
| `completed` | есть завершённый result в `progress.lessons` |
| `current` | есть незавершённая session с пройденными блоками |
| `available` | контент зарегистрирован и доступен |
| `comingSoon` | задана валидная будущая `releaseDate` |
| `locked` | контент отсутствует или явно заблокирован |

Для незарегистрированных модулей не создаются фиктивные даты. Dashboard показывает честную причину «урок пока не готов».

## Completion и XP

`Learning.completeLesson(id, result)` — единственный product-level lifecycle завершения урока. В одной транзакции он:

1. проверяет первое завершение;
2. сохраняет нормализованный result;
3. помечает подтемы;
4. фиксирует одноразовую награду `lesson:{id}`;
5. обновляет XP и производные level-поля;
6. обновляет stats и timeline.

После транзакции очищается session, отмечается единый день активности и отправляются `xp:update`, `lesson:completed`, `progress:update`.

Повторное прохождение возвращает `xpEarned: 0`. `resetLesson()` удаляет result/session, но сохраняет reward ledger, поэтому локальный reset результата нельзя использовать для фарма XP. `resetAll()` очищает прогресс, XP, награды, активность и аналитику, сохраняя профиль, авторизацию и настройки.

Модель уровней едина во всех экранах:

```js
xpAtLevel(level) = (level - 1) ** 2 * 100
level(xp) = floor(sqrt(xp / 100)) + 1
```

## Публичный API

Основное чтение: `getSubjects`, `getSubject`, `getTopics`, `getLessons`, `getLesson`, `getLessonStatus`, `getNextLesson`, `getLastCompletedLesson`, методы progress.

Основная запись: `completeLesson`, `resetLesson`, `resetSubject`, `resetAll`.

Старый `getLessonState()` оставлен совместимым и сводит новые статусы к трём старым. `unlock()` оставлен no-op: готовность контента не должна создаваться пользовательским состоянием.

## Добавление урока

1. Добавить постоянный namespaced ID, метаданные, route и имя config в `LESSON_REGISTRY`.
2. Если раньше был другой ID/URL, внести его в `legacyIds`.
3. Добавить этот ID соответствующему module в `DATA`.
4. Создать config по schema и подключить его до `js/lesson.js`.
5. Проверить `LessonValidator.validate(config)` и выполнить `node tests/core-smoke.js`.

Не добавлять отдельную HTML-реализацию completion и не начислять lesson XP из renderer/page.
