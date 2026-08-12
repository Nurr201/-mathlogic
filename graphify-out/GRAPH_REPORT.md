# Graph Report - .  (2026-08-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 369 nodes · 709 edges · 31 communities (26 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `09a10197`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- renderers.js
- learning.js
- ML
- decision.js
- page-smoke.js
- profile.js
- lesson.js
- dashboard.js
- core-smoke.js
- achievements.js
- xp.js
- helpers.js
- lesson-schema.js
- data.js
- registry.js
- animations.js
- navigation.js
- utils.js

## God Nodes (most connected - your core abstractions)
1. `ML` - 46 edges
2. `check()` - 13 edges
3. `boot()` - 13 edges
4. `renderRoute()` - 12 edges
5. `showToast()` - 12 edges
6. `init()` - 11 edges
7. `renderHero()` - 10 edges
8. `text()` - 10 edges
9. `testLesson()` - 10 edges
10. `t()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `buildCourse()` --references--> `SUBJECTS`  [EXTRACTED]
  js/learning.js → js/data.js
- `loadProfileData()` --references--> `ML`  [EXTRACTED]
  js/profile.js → js/storage.js
- `loadAll()` --references--> `ML`  [EXTRACTED]
  js/achievements.js → js/storage.js
- `countAGrades()` --references--> `ML`  [EXTRACTED]
  js/achievements.js → js/storage.js
- `countPerfectScores()` --references--> `ML`  [EXTRACTED]
  js/achievements.js → js/storage.js

## Import Cycles
- None detected.

## Communities (31 total, 5 thin omitted)

### Community 0 - "renderers.js"
Cohesion: 0.07
Nodes (41): _calcGrade(), _checkInput(), _compareAnswers(), _escapeAttr(), _formatTime(), _getInputValues(), _getSelected(), _markChallengeResult() (+33 more)

### Community 1 - "learning.js"
Cohesion: 0.13
Nodes (37): availableRegistryLessons(), buildCourse(), completeLesson(), emit(), findLesson(), findNextLessonId(), findSubject(), getCourse() (+29 more)

### Community 2 - "ML"
Cohesion: 0.12
Nodes (24): I18N_DICTIONARY, normalizeI18nLang(), getTotalCompletedLessons(), adjustGoal(), applyTheme(), closeModal(), exportData(), handleModalAction() (+16 more)

### Community 3 - "decision.js"
Cohesion: 0.17
Nodes (27): answerEvaluation(), complete(), copy(), currentBlock(), currentEvidence(), engineState(), ensureRun(), escapeHtml() (+19 more)

### Community 4 - "page-smoke.js"
Cohesion: 0.16
Nodes (25): assert, classList(), completeDecisionExperiment(), CORE, element(), environment(), fs, LESSON (+17 more)

### Community 5 - "profile.js"
Cohesion: 0.12
Nodes (24): chartInstances, filterAchv(), filterPeriod(), formatStatValue(), getAchievements(), getAnalyticsData(), getGoalsData(), getStatValue() (+16 more)

### Community 6 - "lesson.js"
Cohesion: 0.23
Nodes (22): bindEngine(), bindTheme(), completeFromEngine(), fillHeading(), init(), language(), localizeContent(), localized() (+14 more)

### Community 7 - "dashboard.js"
Cohesion: 0.34
Nodes (18): applyCopy(), applyTheme(), esc(), lessonDescription(), lessonMeta(), lessonTitle(), localized(), pct() (+10 more)

### Community 8 - "core-smoke.js"
Cohesion: 0.18
Nodes (18): assert, boot(), createStorage(), fs, path, ROOT, SOURCES, testCanonicalLifecycle() (+10 more)

### Community 9 - "achievements.js"
Cohesion: 0.30
Nodes (14): check(), countAGrades(), countCompletedTopics(), countPerfectScores(), countSubjectsWithLessons(), define(), formatDate(), getAchievement() (+6 more)

### Community 10 - "xp.js"
Cohesion: 0.36
Nodes (12): EVENTS, addXP(), applyToData(), awardOnce(), calcLevel(), calcXpForLevel(), dispatch(), getLevel() (+4 more)

### Community 11 - "helpers.js"
Cohesion: 0.17
Nodes (5): progress(), container, lessonStartTime, questions, updateStats()

### Community 13 - "data.js"
Cohesion: 0.22
Nodes (8): DATA, LESSON_LEGACY_MAP, LESSON_REGISTRY, MATHIGON_ICONS, SUBJECTS, TAB_NAMES, THEME_COLORS, TOPICS_LANDING

## Knowledge Gaps
- **34 isolated node(s):** `ANIME`, `MATHIGON_ICONS`, `THEME_COLORS`, `DATA`, `TOPICS_LANDING` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ML` connect `ML` to `renderers.js`, `learning.js`, `decision.js`, `profile.js`, `lesson.js`, `dashboard.js`, `achievements.js`, `xp.js`?**
  _High betweenness centrality (0.386) - this node is a cross-community bridge._
- **Why does `renderResult()` connect `renderers.js` to `ML`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `copy()` connect `decision.js` to `ML`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `ANIME`, `MATHIGON_ICONS`, `THEME_COLORS` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `renderers.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06938775510204082 - nodes in this community are weakly interconnected._
- **Should `learning.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1282051282051282 - nodes in this community are weakly interconnected._
- **Should `ML` be split into smaller, more focused modules?**
  _Cohesion score 0.12043010752688173 - nodes in this community are weakly interconnected._