# Fake Data Audit — `math·logic`

## Итог: dashboard.html — гибрид (hardcoded темплейт + ML data)

### `dashboard.html`
| Что | Статус |
|---|---|
| `DASH_SUBJECTS` (46 topics, hardcoded — визуальный шаблон) | Жёсткая структура для отображения; прогресс подтягивается из `ML`/`Learning` |
| `QUEST_DATA` (4 daily quests) | Работают, XP синхронизируется через `XP.addXP()` |
| `state.xp` заменён на `XP.getXP()` | ✅ |
| `state.level` заменён на `XP.getLevel()` | ✅ |
| `updateStats()` — `ML.getCompletedLessons()`, `XP.getXP()` | ✅ |
| Topic status (`done`) — из `Learning.getLessonState()` | ✅ |
| `syncFromML()` — обновляет прогресс при загрузке | ✅ |
| `rememberFormula()` — `XP.addXP(10)` | ✅ |
| `TOPIC_LESSON_MAP` — маппинг тем на уроки | ✅ |
| Quest-состояния хранятся в `ml_dash_state` | ✅ |

### `profile.html`
| Что было | Что стало |
|---|---|
| `data-target="68"` / `data-target="24"` / `data-target="752"` | `data-target="0"` (заполняется в `loadProfileData()`) |
| `68%` / `72%` в HTML-разметке | `0%` (заполняется в `loadProfileData()`) |
| `data-target="17"` / строчка "42" / "186" (streak) | `data-target="0"`, JS обновляет из `ML.getUser()` |
| `getSubjectData()` — `[0,0,0,0]` | `Learning.getSubjects().progress` |
| `todayTasks: [{...},{...},{...}]` — fake ежедневные задачи | `[]` |
| `rewards: [{...},{...},{...}]` — fake награды | Показ "Нет данных о наградах" |
| `renderAnalytics()` — `return` при пустых данных (не рисовал doughnut) | Doughnut рисуется всегда; insights — с проверкой |
| `const ACHV_DATA = []` (мёртвый код) | Удалён |
| `querySelector('[data-target="68"]')` | `document.getElementById('overall-progress-pct-val')` |
| Лейбл "12 Наград" в HTML | `id="achv-total-label"`, обновляется из `getAchievements()` |

### `settings.html`
| Что было | Что стало |
|---|---|
| `<input value="Нұрбол Абдазов">` | `value="" placeholder="Ваше имя"` |
| `<input value="@nurbek_dev">` | `value="" placeholder="@username"` |
| `<input value="nurbek@example.com">` | `value="" placeholder="email@example.com"` |
| `showToast('... в демо', ...)` 6 раз | `showToast('Функция временно недоступна', ...)` |
| `renderAboutStats()` — `[27, 4, '60+', '2.4']` | Подсчёт из `DATA` (модули, разделы, темы) |

### `lesson.html`
| Что было | Что стало |
|---|---|
| `const moduleSubtopics = [5 hardcoded строчек]` | `lookupModuleSubtopics()` — поиск в `DATA` по `location.pathname` |
| `if (scorePct === 100) grade = 'S'` | `if (scorePct >= 90) grade = 'S'` (синхронизация с `learning.js`) |

### `topic-1-expressions.html`
| Что было | Что стало |
|---|---|
| `const moduleSubtopics = [5 hardcoded строчек]` | `lookupModuleSubtopics()` — поиск в `DATA` |
| `if(scorePct===100)grade='S'` | `if(scorePct>=90)grade='S'` |
| `if(solved===5)grade="S"` | `if(solved>=5)grade="S"` |

### `js/learning.js`
Без изменений — порог S (≥90) уже был корректным. HTML-страницы синхронизированы под него.

## Принципы замены
1. Ни одна HTML-страница не должна содержать собственных вычислений — только отображение.
2. Данные запрашиваются через `ML.*()`, `XP.*()`, `Learning.*()`.
3. Fake-константы (массивы, объекты) удалены.
4. При отсутствии данных показывается "Нет данных" или '0'.
5. Исключение: конфигурационные константы (цветовые схемы, размеры шрифта) остаются — они не являются данными.
