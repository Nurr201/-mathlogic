# Lesson Engine v2 — Архитектура

## Обзор

Lesson Engine v2 — новая система отображения уроков MathLogic, построенная на JSON-конфигурации.

Основные принципы:
- **Один урок = один JSON** — без копирования HTML
- **Движок ничего не знает о предмете** — только рендер блоков
- **300+ уроков без нового кода** — достаточно создать JSON
- **Полная обратная совместимость** — работает параллельно с текущим `lesson.html`

---

## Файлы

| Файл | Роль |
|------|------|
| `js/lesson-engine.js` | Ядро: состояние, навигация, события, сохранение |
| `js/lesson-blocks.js` | Рендереры для 12 типов блоков |
| `data/lesson-schema.js` | JSON-схема + валидация + пример урока |
| `docs/LESSON_ENGINE.md` | Этот документ |

---

## API

### LessonEngine

```js
// Загрузить урок в контейнер
LessonEngine.load(lessonConfig, containerElement);

// Перейти к следующему блоку (с результатом)
LessonEngine.next(blockResult);

// Вернуться к предыдущему блоку
LessonEngine.prev();

// Перейти к конкретному блоку
LessonEngine.goTo(index);

// Принудительно перерендерить текущий блок
LessonEngine.render();

// Получить текущее состояние
LessonEngine.getState();
// → { lessonId, currentIndex, totalBlocks, currentBlock,
//     score, mistakes, timeSpent, completedBlocks,
//     repeatMode, finished, hasNext, hasPrev }

// Получить результат блока
LessonEngine.getBlockResult(index);

// Очистить прогресс урока
LessonEngine.clearProgress();
```

### LessonBlocks

```js
// Каждый рендерер: function(blockData, context) → HTML string
LessonBlocks.hero(block, ctx)
LessonBlocks.goal(block, ctx)
LessonBlocks.warmup(block, ctx)
LessonBlocks.anchor(block, ctx)
LessonBlocks.theory(block, ctx)
LessonBlocks.quiz(block, ctx)
LessonBlocks.input(block, ctx)
LessonBlocks.mistake(block, ctx)
LessonBlocks.sandbox(block, ctx)
LessonBlocks.challenge(block, ctx)
LessonBlocks.reflection(block, ctx)
LessonBlocks.result(block, ctx)
```

---

## Типы блоков

### hero
Стартовый экран — захват внимания. Крупная визуализация, тема, тизер.

```js
{ type: 'hero', icon, title, subtitle, teaser, visual }
```

### goal
Контракт — чёткая цель урока. Одна строка «к концу урока ты сможешь».

```js
{ type: 'goal', icon, title, text }
```

### warmup
Разминка — простой вопрос для включения мозга. Может быть не по теме.

```js
{ type: 'warmup', question, options[], answer, points }
```

### anchor
Якорь — реальная проблема или визуальный вызов перед теорией.

```js
{ type: 'anchor', visual, title, problem, question }
```

### theory
Теоретический блок с контентом, формулой и примерами.

```js
{ type: 'theory', title, content[], formula, formulaLabel, examples[] }
```

### quiz
Вопрос с выбором одного ответа.

```js
{ type: 'quiz', question, equation, options[], answer, explanation, hint }
```

### input
Задача со свободным вводом (одно или несколько полей).

```js
{ type: 'input', question, equation, fields[], answer[], explanation }
```

### mistake
Демонстрация типичной ошибки с интерактивным показом правильного решения.

```js
{ type: 'mistake', title, problem, wrongSolution, correctSolution, explanation }
```

### sandbox
Интерактивная песочница — слайдеры для параметров, визуализация результата.

```js
{ type: 'sandbox', title, description, task, params[], initialOutput }
```

### challenge
Финальный вызов — набор из 3 разнотипных заданий.

```js
{ type: 'challenge', title, tasks[] }
```

### reflection
Рефлексия — вопросы на осмысление и оценку урока.

```js
{ type: 'reflection', title, questions[] }
```

### result
Экран завершения с результатом, XP, временем, оценкой и кнопкой следующего урока.

```js
{ type: 'result', description, xp, nextLesson{ title, link } }
```

---

## Состояние (State)

### Внутреннее состояние движка

```js
{
  lessonId: 'vieta_theorem',
  lesson: { /* исходный JSON */ },
  currentIndex: 3,
  blocks: [ /* массив блоков */ ],
  answers: { '0': '1', '3': '3,5' },
  score: 45,
  mistakes: 1,
  timeSpent: 342,
  completedBlocks: [0, 1, 2, 3],
  repeatMode: false,
  startTime: 1712345678000,
  blockStartTime: 1712345679000,
  blockResults: { /* результаты по каждому блоку */ },
  container: DOMElement,
  finished: false,
}
```

### Сохранение

Прогресс сохраняется в `localStorage` по ключу `lesson.v2.{lessonId}`:
- `completedBlocks[]` — какие блоки пройдены
- `score` — текущий счёт
- `mistakes` — количество ошибок
- `answers` — ответы пользователя
- `blockResults` — подробные результаты по блокам

При повторном открытии урока прогресс восстанавливается.

---

## События

| Событие | Детали | Когда |
|---------|--------|-------|
| `lesson:blockStart` | `{ blockIndex, blockType, blockId }` | Блок показан |
| `lesson:blockComplete` | `{ blockIndex, blockType, result, score, mistakes }` | Блок пройден |
| `lesson:finished` | `{ score, mistakes, timeSpent, totalBlocks, completedBlocks }` | Урок завершён |
| `lesson:scoreChanged` | `{ score, delta }` | Счёт изменился |
| `lesson:answer` | `{ blockIndex, answer, correct }` | Дан ответ |

---

## Жизненный цикл урока

```
LessonEngine.load(config, container)
    │
    ├─ 1. Инициализация состояния
    ├─ 2. Восстановление прогресса (localStorage)
    ├─ 3. Определение repeatMode (если урок уже пройден)
    └─ 4. Рендер первого блока
            │
            ▼
    ┌── Блок показан ──► lesson:blockStart
    │
    │   Пользователь взаимодействует
    │   (выбирает ответ, вводит, нажимает «Далее»)
    │
    ▼
    ┌── LessonEngine.next(blockResult)
    │
    ├─ 1. Сохранить результат блока
    ├─ 2. Обновить score/mistakes
    ├─ 3. Добавить в completedBlocks
    ├─ 4. Сохранить прогресс (localStorage)
    ├─ 5. lesson:blockComplete
    │
    ├─ Если есть следующий блок → рендер
    └─ Если блок последний → finish()
            │
            ▼
    ┌── finish()
    │
    ├─ 1. Обновить timeSpent
    ├─ 2. lesson:finished
    └─ 3. state.finished = true
```

---

## Пример JSON-урока

Полный пример урока «Теорема Виета» находится в `data/lesson-schema.js`:

```js
LessonEngine.load(LESSON_SCHEMA.example, document.getElementById('main-content'));
```

---

## Как в будущем подключить старый lesson.html

Текущий `lesson.html` использует `lesson.js` с массивом `steps[]`.

Для миграции на новый Engine:

1. **Создать JSON-конфигурацию** для каждого урока в отдельном файле `data/lessons/{id}.js`
2. **Подключить** `lesson-engine.js` и `lesson-blocks.js` в `lesson.html`
3. **Заменить** вызов `QuizEngine.completeLesson()` на интеграцию с `Learning.completeLesson()` внутри обработчика `lesson:finished`
4. **Постепенно** заменять статические уроки, подгружая JSON через `LessonEngine.load()`

```html
<!-- Новый порядок подключения -->
<script src="js/lesson-engine.js"></script>
<script src="js/lesson-blocks.js"></script>
<script src="data/lessons/algebra_vieta.js"></script>
<script>
  LessonEngine.load(algebraVieta, document.getElementById('main-content'));
</script>
```

---

## Как добавить новый тип блока

1. Создать рендерер в `lesson-blocks.js`:

```js
function renderMyBlock(block, ctx) {
  return wrap('<div>...</div>');
}
```

2. Добавить в публичный API:

```js
return {
  // ... существующие,
  myBlock: renderMyBlock,
};
```

3. Готово. Теперь в любом JSON-уроке можно использовать:

```js
{ type: 'myBlock', /* параметры */ }
```

---

## Принципы

1. **Engine ничего не знает о контенте** — только рендер и навигация
2. **Один блок — одна функция-рендерер** — легко тестировать и расширять
3. **JSON как единственный источник** — любой урок = данные
4. **События вместо прямых вызовов** — движок сообщает, внешний код реагирует
5. **Сохранение прогресса** — пользователь не теряет позицию при перезагрузке
6. **Параллельное существование** — старый и новый движки не конфликтуют
