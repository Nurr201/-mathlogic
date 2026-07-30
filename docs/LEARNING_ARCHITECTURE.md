# Learning Engine — Архитектура

## Обзор

`js/learning.js` — центральная система обучения платформы MathLogic.

Learning Engine — единственный модуль, который:
- строит структуру курса (Subject → Topic → Lesson)
- управляет состояниями уроков (locked / available / completed)
- рассчитывает прогресс (общий, по предмету, по теме)
- генерирует события после завершения урока

Dashboard, Profile и другие страницы **не вычисляют** прогресс самостоятельно — они только отображают данные, полученные через API Learning.

---

## Структура данных

```
Subject
├── key          — идентификатор (algebra, geometry, logic, numbers)
├── name         — название
├── icon         — SVG-иконка
├── mainColor    — основной цвет
├── bgActive     — цвет фона
├── totalLessons — общее количество уроков
├── firstLessonId — ID первого урока
├── topics[]
│   ├── title         — название темы (раздела)
│   ├── level         — уровень сложности
│   ├── order         — порядковый номер
│   ├── totalLessons  — количество уроков
│   └── lessons[]
│       ├── id        — уникальный ID (subjectKey_order)
│       ├── name      — название урока
│       ├── order     — порядковый номер
│       ├── link      — ссылка на HTML-страницу (если есть)
│       ├── subtopics — массив подтем
│       ├── subjectKey — привязка к предмету
│       ├── sectionTitle  — название темы
│       └── sectionLevel  — уровень темы
└── lessons[]   — плоский список всех уроков
```

### Статусы уроков

| Статус      | Описание                          |
|-------------|-----------------------------------|
| `locked`    | Урок заблокирован                 |
| `available` | Урок доступен для прохождения     |
| `completed` | Урок успешно завершён             |

Хранятся в `localStorage` по пути `progress.lessonStates` через ML (storage.js).

---

## Публичный API

### Subjects

```js
Learning.getSubjects()
// → [{ key, name, icon, mainColor, bgActive, totalLessons, completedLessons, progress }]

Learning.getSubject(subjectKey)
// → { key, name, icon, mainColor, bgActive, topics: [...], totalLessons, completedLessons, progress, firstLessonId }
```

### Topics

```js
Learning.getTopics(subjectKey)
// → [{ title, level, order, progress, totalLessons, completedLessons, lessons: [...] }]

Learning.getTopic(subjectKey, topicTitle)
// → { title, level, order, progress, totalLessons, completedLessons, lessons: [...] }
```

### Lessons

```js
Learning.getLessons(subjectKey)
// → [{ id, name, order, sectionTitle, sectionLevel, state, link, subtopics }]

Learning.getLesson(lessonId)
// → { id, name, order, sectionTitle, sectionLevel, state, link, subtopics, subjectKey }

Learning.getLessonState(lessonId)
// → 'locked' | 'available' | 'completed'
```

### Status

```js
Learning.isUnlocked(lessonId)
// → true | false

Learning.unlock(lessonId)
// → true (если разблокирован) | false (уже доступен или не найден)
```

### Completion

```js
Learning.completeLesson(lessonId, result)
// result: { score, correct, total, attempts, time, xpEarned, grade }
// → { lessonId, xpEarned, score, grade }
```

`completeLesson`:
1. Проверяет, не завершён ли уже урок
2. Устанавливает статус `completed`
3. Сохраняет результат через `ML.completeLesson()`
4. Отмечает подтемы как выполненные
5. Добавляет запись в timeline
6. Разблокирует следующий урок
7. **Генерирует события** (не вызывает XP напрямую)

### Reset

```js
Learning.resetSubject(subjectKey)
// Сбрасывает все уроки предмета в начальное состояние

Learning.resetAll()
// Сбрасывает прогресс по всем предметам
```

### Progress

```js
Learning.getOverallProgress()
// → 0–100 (процент)

Learning.getSubjectProgress(subjectKey)
// → 0–100

Learning.getTopicProgress(subjectKey, topicTitle)
// → 0–100
```

### Navigation

```js
Learning.getNextLesson()
// → { id, name, subjectKey, subjectName, link, sectionTitle } | null

Learning.getNextLessonId(currentLessonId)
// → id | null

Learning.unlockNextLesson(currentLessonId)
// → id | null

Learning.getLastCompletedLesson()
// → { id, name, ... } | null

Learning.getTotalCompletedLessons()
// → number

Learning.getTotalLessons()
// → number
```

---

## События

После завершения урока Learning **не вызывает XP напрямую**.
Вместо этого он генерирует события, на которые подписываются другие модули.

### Список событий

| Событие              | Детали                                                   | Когда срабатывает                |
|----------------------|----------------------------------------------------------|----------------------------------|
| `lesson:completed`   | `{ lessonId, lessonName, score, xpEarned, correct, total, grade }` | Урок завершён                    |
| `progress:update`    | `{ lessonId, lessonName, score, xpEarned, correct, total, grade }` | Прогресс изменён                 |
| `topic:completed`    | `{ topicTitle, subjectKey }`                             | Все уроки темы завершены         |
| `subject:completed`  | `{ subjectKey }`                                         | Все уроки предмета завершены     |

### Как подписаться

```js
document.addEventListener('lesson:completed', function(e) {
  console.log('Урок завершён:', e.detail);
});

document.addEventListener('progress:update', function(e) {
  console.log('Прогресс обновлён:', e.detail);
});
```

---

## Взаимодействие с модулями

### storage.js (ML)

Learning использует ML для:
- чтения и записи состояний уроков (`ML.get('progress.lessonStates')` / `ML.set(...)`)
- сохранения результата урока (`ML.completeLesson()`)
- отметки подтем (`ML.markSubtopicsDone()`)
- добавления записи в ленту (`ML.addTimelineEntry()`)
- чтения старых завершённых уроков (`ML.getCompletedLessons()`)

### events.js (EVENTS)

Learning использует `EVENTS.emit(name, detail)` для отправки событий.
Никаких прямых вызовов XP не происходит.

### xp.js (XP)

Learning **не вызывает** `XP.addXP()`.
XP-система должна подписаться на события и начислять XP самостоятельно.

Пример для XP-модуля:

```js
document.addEventListener('lesson:completed', function(e) {
  var detail = e.detail;
  XP.addXP(detail.xpEarned, 'lesson:' + detail.lessonId);
});
```

---

## Как подключить будущие системы

### XP

Подписаться на `lesson:completed`.
При получении события вызвать `XP.addXP(detail.xpEarned, ...)`.

### Achievements

Подписаться на `lesson:completed`, `topic:completed`, `subject:completed`.
Проверять условия достижений и разблокировать.

### Streak

Подписаться на `lesson:completed`.
Отмечать день как активный.

### Progress (аналитика)

Подписаться на `progress:update`.
Обновлять графики и статистику.

### Leaderboard

Подписаться на `lesson:completed`.
Отправлять данные на сервер.

### Cloud Sync

Читать данные через ML API. Синхронизировать при изменении.

### AI Tutor

Использовать `Learning.getLesson(id)` для получения
контекста урока и `Learning.getSubjectProgress(key)` для
адаптации сложности.

---

## Примеры использования

### Получить все предметы с прогрессом

```js
var subjects = Learning.getSubjects();
subjects.forEach(function(s) {
  console.log(s.name + ': ' + s.progress + '% (' + s.completedLessons + '/' + s.totalLessons + ')');
});
```

### Завершить урок

```js
Learning.completeLesson('algebra_3', {
  score: 85,
  correct: 4,
  total: 5,
  attempts: 1,
  time: 340,
  xpEarned: 90,
  grade: 'A',
});
```

### Проверить, доступен ли урок

```js
if (Learning.isUnlocked('geometry_5')) {
  window.location.href = 'lesson.html';
}
```

### Получить следующий доступный урок

```js
var next = Learning.getNextLesson();
if (next) {
  console.log('Следующий:', next.name, '(' + next.subjectName + ')');
}
```

### Получить прогресс по теме

```js
var pct = Learning.getTopicProgress('algebra', 'Функциялар, Графиктер және Туынды');
console.log('Прогресс темы:', pct + '%');
```

---

## Принципы

1. **Единый источник истины** — Learning Engine централизует все данные о курсе и прогрессе
2. **События вместо прямых вызовов** — модули не вызывают друг друга напрямую
3. **Никаких вычислений на страницах** — Dashboard, Profile только отображают данные
4. **Никакой магии** — каждая функция делает только то, что написано в её названии
5. **Никаких циклических зависимостей** — Learning зависит только от ML (storage.js)
6. **Полная обратная совместимость** — `window.COURSE` = `window.Learning`
