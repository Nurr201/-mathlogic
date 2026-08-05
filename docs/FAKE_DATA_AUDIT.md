# Runtime Data Audit

Актуально для Axis Dashboard и Lesson.

## Удалено из активного Dashboard

- hardcoded проценты, XP, streak и количество завершённых уроков;
- `DASH_SUBJECTS`, `TOPIC_LESSON_MAP` и отдельное dashboard storage;
- ежедневные квесты без backend/правил выполнения;
- фиктивные даты разблокировки;
- XP за декоративные действия вроде «запомнить формулу»;
- inline page logic и отдельная completion-логика старого урока;
- legacy-компоненты `.subj-card`, `.topic-chip`, `.bottom-bar`, `.bottom-item`, `.section-block`, `.section-title` и `.formula-card`;
- невозможные достижения `first_quest`/`thirty_quests` и обработчик `quest:completed`.

Dashboard читает только `Learning`, `ML` и `I18N`. Его единственный контроллер — `js/dashboard.js`; игровые модули удалены. Каталог будущих тем из `DATA` показывается как locked/unavailable, а интерактивные ссылки создаются только для `LESSON_REGISTRY`.

Нормализация storage удаляет старые поля `dashboard` и `dailyQuests`, а отдельный ключ `ml_dash_state` оставлен только в списке миграционной очистки.

## Реальные данные

- профиль и настройки из `mathlogic_data`;
- lesson results и незавершённые sessions;
- количество завершённых и незавершённых уроков;
- реальные учебные дни из `activity.dates`;
- stats/timeline, созданные реальным completion;
- две существующие JSON-конфигурации уроков.

## Прототипные области

- большинство модулей в `DATA` — продуктовый каталог без lesson config;
- auth остаётся локальным демо без backend;
- профиль/аналитика используют локальные данные и не синхронизируются с сервером;
- lesson content сейчас только на русском, хотя shell поддерживает RU/KZ;
- внешние CDN (шрифты, Tailwind на Lesson) требуют сеть и production bundling.

`topic.html` остаётся честной страницей «в разработке». `topic-1-expressions.html` — только redirect для обратной совместимости.

`js/topic.js` и `js/quiz.js` помечены deprecated и не подключаются к новому Lesson. Они сохранены как совместимый код до отдельной проверки старых внешних ссылок. `js/navigation.js` продолжает обслуживать legacy-страницы, но не подключается к Axis Dashboard/Lesson.
