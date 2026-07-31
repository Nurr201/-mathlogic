# Lesson Engine v2 — API Reference

Version: 2.2.0 · Schema: 2.0.0

---

## 1. LessonEngine

### load(config, containerEl)
Загружает урок в DOM-контейнер.

```js
LessonEngine.load(lessonConfig, document.getElementById('main-content'));
```

- `config` — объект урока (см. Схема урока)
- `containerEl` — DOM-элемент для рендера
- Проверяет `schemaVersion` на совместимость
- Восстанавливает прогресс из localStorage
- Определяет repeatMode через `Learning.getLessonState()`
- Запускает `beforeLesson` / `afterLesson` lifecycle

---

### next(blockResult)
Завершает текущий блок и переходит к следующему.

```js
LessonEngine.next({ correct: true, answers: '3', points: 10 });
```

- `blockResult` — объект результата:
  - `correct` (boolean) — правильно/неправильно
  - `answers` (string|array) — ответ пользователя
  - `points` (number) — баллы за блок
  - `explanation` (string) — пояснение
  - `values` (array) — для input-блоков
- Автоматически обновляет `score` и `mistakes`
- Сохраняет прогресс в localStorage
- Запускает `beforeComplete` / `afterComplete` lifecycle
- Триггерит `onAnswer` и `onBlockFinish` analytics
- Если блок последний — вызывает `finish()`

---

### prev()
Возвращается к предыдущему блоку (если возможно).

### goTo(index)
Переходит к конкретному блоку по индексу. Не дальше чем `currentIndex + 1`.

### render()
Принудительно перерендеривает текущий блок.

---

### getState()
Возвращает объект состояния:

```js
{
  lessonId: 'vieta_theorem',
  currentIndex: 3,
  totalBlocks: 14,
  currentBlock: { type: 'quiz', ... },
  score: 45,
  mistakes: 1,
  timeSpent: 342,
  completedBlocks: [0, 1, 2, 3],
  repeatMode: false,
  finished: false,
  correctAnswers: 3,
  totalQuestions: 4,
  percentage: 75,
  attempts: 4,
  startedAt: 1712345678000,
  hasNext: true,
  hasPrev: true,
}
```

### getBlockResult(index)
Возвращает сохранённый результат для блока (или текущего, если index не указан).

### clearProgress()
Очищает сохранённый прогресс урока из localStorage.

---

## 2. Plugin API (LessonBlocks)

### LessonBlocks.register(type, renderer)
Регистрирует новый тип блока.

```js
LessonBlocks.register('video', function(block, ctx) {
  return '<div class="max-w-3xl mx-auto p-8">' +
    '<video src="' + block.src + '" controls></video>' +
    '</div>';
});
```

- `type` — строка — уникальный идентификатор
- `renderer` — функция `(blockData, context) → HTML string`
- Возвращает `true/false`

### LessonBlocks.unregister(type)
Удаляет зарегистрированный рендерер.

### LessonBlocks.has(type)
Проверяет, зарегистрирован ли тип. Возвращает `true/false`.

### LessonBlocks.get(type)
Возвращает функцию-рендерер или `null`.

### LessonBlocks.render(type, block, ctx)
Вызывает рендерер с обработкой ошибок. Возвращает HTML или `null` при ошибке.

### LessonBlocks.registeredTypes()
Возвращает массив зарегистрированных типов.

### Контекст рендерера

```js
{
  index: 0,        // номер текущего блока
  total: 14,       // всего блоков
  answers: {},     // ответы пользователя по блокам
  score: 45,       // текущий счёт
  mistakes: 1,     // количество ошибок
  repeatMode: false, // режим повторения
  savedResult: null, // результат при repeatMode
  duration: 15,    // секунд на блоке
}
```

---

## 3. Lifecycle Hooks

### LessonEngine.on(hook, callback)
Подписывается на хук жизненного цикла. Возвращает функцию отписки.

```js
var unsub = LessonEngine.on('afterRender', function(data) {
  console.log('Block rendered:', data.blockIndex);
});
unsub(); // отписаться
```

### LessonEngine.off(hook, callback)
Отписывается от хука.

### Хуки

| Хук | data | Когда |
|-----|------|-------|
| `beforeRender` | `{ block, blockIndex, context }` | Перед рендером блока |
| `afterRender` | `{ block, blockIndex, html }` | После рендера блока |
| `beforeComplete` | `{ block, blockIndex, result, score, mistakes }` | Перед завершением блока |
| `afterComplete` | `{ block, blockIndex, result, score, mistakes }` | После завершения блока |
| `beforeLesson` | `{ config, lessonId }` | Перед загрузкой урока |
| `afterLesson` | `{ config, lessonId, currentIndex }` | После загрузки и восстановления прогресса (до рендера блока) |
| `beforeFinish` | `{ lessonId, score, mistakes, timeSpent, assessment }` | Перед финальным событием |
| `afterFinish` | `{ lessonId, score, mistakes, timeSpent, assessment }` | После финального события |

Порядок вызова:
```
beforeLesson → loadProgress → afterLesson → render → beforeRender → afterRender
  → next → beforeComplete → afterComplete → render → ...
  → finish → beforeFinish → onLessonFinish → afterFinish
```

---

## 4. Analytics

### LessonEngine.analytics.on(event, callback)
Подписывается на аналитическое событие. Возвращает функцию отписки.

```js
LessonEngine.analytics.on('onLessonFinish', function(data) {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(data),
  });
});
```

### LessonEngine.analytics.off(event, callback)
Отписывается.

### Cобытия

| Событие | data | Когда |
|---------|------|-------|
| `onBlockStart` | `{ blockIndex, blockType, blockId }` | Блок показан |
| `onBlockFinish` | `{ blockIndex, blockType, result, score, mistakes }` | Блок завершён |
| `onLessonFinish` | `{ lessonId, score, mistakes, timeSpent, totalBlocks, completedBlocks, startedAt, correctAnswers, totalQuestions, percentage, attempts }` | Урок завершён |
| `onAnswer` | `{ blockIndex, blockType, correct, answers, points }` | Дан ответ |

---

## 5. Debug Mode

Включается:
- `debug: true` в JSON конфигурации урока
- Параметр `?debug=1` в URL

Что показывает:
- Панель в правом нижнем углу
- Версию движка и ID урока
- Текущий номер и тип блока
- Score, Mistakes, Time
- JSON текущего блока
- Ленту последних событий

В консоли:
- `[LessonEngine] Debug mode enabled`
- `[LessonEngine] Rendering block N type`
- Все события с таймстемпом

---

## 6. Serializer

### LessonEngine.exportState()
Экспортирует текущее состояние в JSON-строку.

```js
var saved = LessonEngine.exportState();
// → '{"version":"2.2.0","lessonId":"algebra.vieta.intro","currentIndex":5,...}'
```

### LessonEngine.importState(json)
Восстанавливает состояние из JSON-строки.

```js
LessonEngine.importState(saved);
// → true (или false при ошибке)
```

Поля в экспорте: `version, exportedAt, lessonId, currentIndex, score, mistakes, timeSpent, startedAt, completedBlocks, answers, blockResults, finished`.

---

## 7. Error Recovery

Если рендерер бросает исключение:
1. Ошибка логируется в `console.error`
2. Вместо блока показывается Error Block:
   - Иконка предупреждения
   - Сообщение "Ошибка блока"
   - Текст ошибки (в debug режиме)
   - Кнопка "Пропустить блок"
3. Движок продолжает работать
4. `LessonEngine.next()` можно вызвать для пропуска

---

## 8. Схема урока

### Поля верхнего уровня

```js
{
  schemaVersion: '2.0.0',   // опционально, для проверки совместимости
  id: 'lesson_id',           // уникальный идентификатор
  title: 'Название',         // название урока
  description: 'Описание',   // краткое описание
  subject: 'algebra',        // предмет
  xp: 50,                    // XP за прохождение
  debug: true,               // опционально — включает debug-панель
  meta: {                    // метаданные
    difficulty: 2,
    estimatedTime: 480,
    prerequisites: ['linear_equations'],
    tags: ['quadratic', 'vieta'],
  },
  blocks: [ /* массив блоков */ ],
}
```

### Типы блоков и обязательные поля

| Тип | Обязательные поля |
|-----|-------------------|
| `hero` | type, title |
| `goal` | type, title, text |
| `warmup` | type, question, options, answer |
| `anchor` | type, title, problem |
| `theory` | type, title |
| `quiz` | type, question, options, answer |
| `input` | type, question, fields, answer |
| `mistake` | type, wrongSolution, correctSolution |
| `sandbox` | type |
| `challenge` | type, tasks |
| `reflection` | type, questions |
| `result` | type |

### Базовые поля каждого блока

```js
{
  id: 'unique_id',  // опционально, для ссылок и дубль-контроля
  type: 'hero',     // обязательный тип
  // ... поля специфичные для типа
}
```

---

## 9. LessonValidator

### LessonValidator.validate(config)
Проверяет конфигурацию урока на корректность.

```js
var result = LessonValidator.validate(lessonConfig);
console.log(result.valid);    // true/false
console.log(result.errors);   // массив строк — критические ошибки
console.log(result.warnings); // массив строк — предупреждения
```

Что проверяется:
- Наличие `id`, `title`, `blocks`
- Каждый блок имеет допустимый `type`
- Обязательные поля для каждого типа
- `answer` в bounds для quiz/warmup
- Соответствие `fields.length` и `answer.length` для input
- Дубликаты `id` среди блоков
- Неизвестные поля (warnings)
- Структура `challenge.tasks[]`
- Структура `result.nextLesson`

---

## 10. Version

```js
LessonEngine.version
// → '2.2.0'
```

При загрузке урока проверяется `schemaVersion`:
- Если не указана — считается `1.0.0`
- Минимальная поддерживаемая — `1.0.0`
- При несовместимости — `console.error` и выход

---

## 11. Вспомогательное

### LessonEngine.version
Строка версии движка: `'2.2.0'`

---

## Пример интеграции

```html
<script src="js/lesson-engine.js"></script>
<script src="js/lesson-blocks.js"></script>
<script src="data/lessons/algebra_vieta.js"></script>
<script>
  var result = LessonValidator.validate(algebraVieta);
  if (result.valid) {
    LessonEngine.load(algebraVieta, document.getElementById('main-content'));
  } else {
    console.error('Lesson config invalid:', result.errors);
  }

  LessonEngine.analytics.on('onLessonFinish', function(data) {
    console.log('Lesson finished:', data);
  });
</script>
```
