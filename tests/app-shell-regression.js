'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const dashboard = fs.readFileSync(path.join(ROOT, 'dashboard.html'), 'utf8');
const profile = fs.readFileSync(path.join(ROOT, 'profile.html'), 'utf8');
const settings = fs.readFileSync(path.join(ROOT, 'settings.html'), 'utf8');
const lesson = fs.readFileSync(path.join(ROOT, 'lesson.html'), 'utf8');
const topic = fs.readFileSync(path.join(ROOT, 'topic.html'), 'utf8');
const dashboardJs = fs.readFileSync(path.join(ROOT, 'js/dashboard.js'), 'utf8');
const profileJs = fs.readFileSync(path.join(ROOT, 'js/profile.js'), 'utf8');
const settingsJs = fs.readFileSync(path.join(ROOT, 'js/settings.js'), 'utf8');
const siteJs = fs.readFileSync(path.join(ROOT, 'js/site.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/app-shell.css'), 'utf8');

const program = fs.readFileSync(path.join(ROOT, 'program.html'), 'utf8');

/* All authenticated pages render one shared shell rather than copied controls. */
[dashboard, profile, program, settings, lesson, topic].forEach(function(html) {
  assert.match(html, /css\/app-shell\.css/, 'authenticated page must load the shared shell');
  assert.match(html, /data-app-shell/, 'authenticated page must expose the shared shell mount');
  assert.match(html, /js\/site\.js/, 'authenticated page must load the shared shell runtime');
  assert.doesNotMatch(html, /v8-settings-link|data-app-logout/, 'profile actions belong to the shared dropdown');
});
assert.match(siteJs, /data-shell-logout/);
assert.match(siteJs, /settings\.html/);
assert.match(siteJs, /profile\.html/);
assert.match(siteJs, /event\.key === 'Escape'/);
assert.match(siteJs, /event\.key === 'ArrowDown'/);
assert.match(siteJs, /username \? '<span>/, 'profile menu must not render a fake username');
assert.match(lesson, /class="lesson-topbar"/, 'lesson keeps its focused context row beneath the shared header');
[
  ['--ink', '#111318'], ['--navy', '#18243a'], ['--navy-secondary', '#223451'],
  ['--teal', '#2c6260'], ['--teal-dark', '#1f4a4a'], ['--surface', '#f3f3ef'],
  ['--surface-muted', '#e9ece8'], ['--text', '#111318'], ['--text-muted', '#70747c'],
].forEach(function(token) {
  assert.match(css, new RegExp(token[0] + ':\\s*' + token[1], 'i'), 'missing shared token ' + token[0]);
});
assert.doesNotMatch(css, /#315c?ff|#244be8|#8b5cf6|#f2a65a/i, 'legacy vivid SaaS accents must not return');

/* Dashboard values and explorer are derived from the canonical learning state. */
['dashboard-completed', 'dashboard-active', 'dashboard-days', 'dashboard-available', 'dashboard-subject-grid', 'dashboard-topic-grid'].forEach(function(id) {
  assert.match(dashboard, new RegExp('id="' + id + '"'), 'dashboard is missing #' + id);
});
assert.match(dashboardJs, /Learning\.getTotalCompletedLessons\(\)/);
assert.match(dashboardJs, /Learning\.getSubjects\(\)/);
assert.match(dashboardJs, /Learning\.getTopics\(state\.currentSubject\)/);
assert.match(dashboardJs, /data-dashboard-subject/);
assert.match(dashboardJs, /\.slice\(0, 6\)/, 'dashboard topic explorer must remain concise');
assert.doesNotMatch(dashboard, /dashboard-(?:level|xp)|>XP<|Уровень/);

/* Profile may display achievements only when persisted records actually exist. */
['profile-member-since', 'metric-completed', 'metric-days', 'metric-streak', 'profile-achievements', 'profile-achievement-grid'].forEach(function(id) {
  assert.match(profile, new RegExp('id="' + id + '"'), 'profile is missing #' + id);
});
assert.match(profile, /id="profile-achievements" hidden/);
assert.match(profileJs, /ML\.get\('achievements', \[\]\)/);
assert.match(profileJs, /section\.hidden = true/);
assert.doesNotMatch(profileJs, /Math\.random\s*\(/);
assert.doesNotMatch(profile, /metric-(?:level|xp)|>XP<|Уровень/);
assert.doesNotMatch(profile, /id="metric-active"|id="metric-active-note"|В процессе/, 'in-progress lessons must not be a top-level journal metric');
assert.doesNotMatch(profileJs, /доступных уроков|есть сохранённый шаг|нет начатых уроков|последнее: /, 'profile summary must not expose technical metric copy');
assert.match(profileJs, /function completedLessons\(count\)/, 'completed metric must use a concise lesson label');
assert.match(profileJs, /function studyDaysNote\(count\)/, 'study-day metric must use a concise activity label');
assert.match(profileJs, /ML\.getCurrentStreak\(\)/, 'streak metric must be derived from canonical activity dates');
assert.match(css, /--streak-teal:\s*#356f6a/i);
assert.match(css, /--activity-accent:\s*#c96a32/i);
assert.match(css, /\.v7-profile-page \.v7-journal-grid[^}]*align-items:\s*start\s*!important/s);
assert.match(css, /\.v7-profile-page \.v7-journal-grid > \.v7-continue[^}]*height:\s*fit-content\s*!important/s);
assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.v7-profile-page \.v7-journal-grid\s*\{[^}]*grid-template-columns:\s*1fr/, 'journal must stack before the tablet grid becomes cramped');
assert.match(profileJs, /var historyVisible = 10/);
assert.match(profileJs, /achievements\.slice\(0, 8\)/);
assert.match(profileJs, /first_lesson:\s*\['Первый урок'/);
assert.doesNotMatch(profileJs, /date \? formatDate\(date, true\) : id/);

/* Settings reuses the existing state controls inside a compact editorial layout. */
assert.match(settings, /<h1[^>]*data-copy-ru="Настройки"[^>]*data-copy-kk="Баптаулар"/);
assert.match(settings, /id="settings-profile-name"/);
assert.match(settings, /id="language-options"[\s\S]*data-language="ru"[\s\S]*data-language="kk"/);
assert.match(settings, /id="theme-options"[\s\S]*data-theme="light"[\s\S]*data-theme="dark"[\s\S]*data-theme="system"/);
assert.match(settings, /id="progress-summary"/);
assert.doesNotMatch(settings, /Профиль на устройстве|Имя и учебная история остаются в этом браузере/);
assert.match(css, /\.v7-app \.v7-nav\[data-app-shell\]/);
assert.match(css, /\.v7-settings-page \.v7-setting[^}]*background:var\(--v7-paper\)/s);
assert.match(css, /@media \(max-width: 1020px\)[\s\S]*\.v7-settings-page \.v7-settings-shell\s*\{[^}]*grid-template-columns:\s*1fr/s);
assert.match(settingsJs, /Learning\.getRegistry\(\)/);
assert.match(settingsJs, /ML\.getCompletedLessons\(\)/);
assert.match(settingsJs, /geomat-backup-/);
assert.match(settingsJs, /ML\.resetLearning\(\)/);

/* Responsive layouts collapse to one reading column and retain the product nav. */
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /\.v8-subject-grid\s*\{\s*grid-template-columns:\s*1fr/);
assert.match(css, /\.v8-topic-grid,\s*\.v7-profile-page \.product-topic-list\s*\{\s*grid-template-columns:\s*1fr/);
assert.match(css, /\.v7-app \.v7-mobile-nav[^}]*grid-template-columns:\s*repeat\(3,1fr\)/s);

console.log('app-shell-regression: ok');
