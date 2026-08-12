'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/landing.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'js/home.js'), 'utf8');

/* Every landing copy node that enters the global language mechanism needs both branches. */
const copyNodes = html.match(/<[^>]+data-copy-ru="[^"]*"[^>]*>/g) || [];
assert.ok(copyNodes.length >= 45, 'landing should expose all substantial copy through RU/KK branches');
copyNodes.forEach(function(node) {
  assert.match(node, /data-copy-kk="[^"]*"/, 'localized node requires a KK branch: ' + node);
});
assert.doesNotMatch(html, /ml-language(?:-preview|__copy|\s)/, 'standalone language section must not return');
assert.doesNotMatch(html, /7[–-]9\s+(?:класс|сынып)/i, 'public hero must not foreground grades');
assert.doesNotMatch(js, /\+\s*grade\s*\+\s*['"]\s*(?:класс|сынып)/, 'program preview must not render grade labels');
assert.match(css, /--ml-home-bg:\s*#f3f3ef/i, 'the main landing background should use a warm editorial off-white');
assert.match(css, /--ml-home-surface:\s*#e9ece8/i, 'alternating section surfaces should use a cool neutral');
assert.match(css, /--ml-home-blue-soft:\s*#e9ece8/i, 'interactive product panels need a restrained cool-light support color');
assert.match(css, /--ml-home-blue:\s*#18243a/i, 'the public landing should use the deep-navy identity token');
assert.match(css, /--ml-home-blue-bright:\s*#223451/i, 'navy cards need a related, low-saturation hover token');
assert.match(css, /--ml-home-green:\s*#2c6260/i, 'verification states need one controlled muted-teal token');
assert.match(css, /--ml-home-green-soft:\s*#e6efeb/i, 'lesson surfaces need the desaturated mint-gray support token');
assert.match(css, /--ml-home-teal-dark:\s*#1f4a4a/i, 'the monumental invariant section needs a dark muted teal');
assert.doesNotMatch(css, /#3157f6|#2448e8|#1f3fd1|#22c55e|#16a34a/i, 'vivid royal-blue and emerald tokens must not return');
assert.doesNotMatch(css, /#f2a65a|--ml-home-warm|purple|orange/i, 'landing must keep a controlled blue-and-green accent system');
assert.match(css, /\.ml-hero\s*\{[^}]*background:\s*var\(--ml-home-blue\)/s, 'hero must be a solid saturated-blue card');
assert.match(css, /\.ml-hero-demo\s*\{[^}]*background:\s*white/s, 'hero geometry must live inside a white product panel');
assert.match(css, /\.ml-method-step[^}]*background:\s*var\(--ml-home-blue\)/s, 'the method system should begin in the shared deep-navy family');
assert.match(css, /\.ml-method-step:nth-child\(2\)[^}]*background:\s*var\(--ml-home-teal-dark\)/s, 'verification step should use the related dark-teal sibling');
assert.match(css, /\.ml-hero\s*\{[^}]*width:\s*min\(1440px,\s*calc\(100vw\s*-\s*48px\)\)/s, 'hero should escape the standard 1240px shell');
assert.match(css, /\.ml-geometry-section\s*\{[^}]*min-height:\s*82svh[^}]*background:\s*var\(--ml-home-blue\)/s, 'geometry showcase should be a major full-width blue moment');
assert.match(html, /class="ml-equation-statement"/, 'landing should include a strong oversized mathematical statement');
assert.match(css, /\.ml-equation-statement h2[^}]*clamp\(112px,\s*16vw,\s*240px\)/s, 'mathematical statement needs an oversized editorial scale');
assert.match(css, /\.ml-equation-statement\s*\{[^}]*background:\s*var\(--ml-home-teal-dark\)/s, 'the invariant statement should become a restrained dark-teal editorial section');
assert.match(html, /class="ml-equation-statement__construction"/, 'the invariant statement needs a full-spread mathematical construction');
assert.match(html, /class="ml-statement-triangle"/, 'the invariant construction should include an oversized triangle');
assert.match(html, /class="ml-statement-projection"/, 'the invariant construction should expose its projected height');
assert.doesNotMatch(html, /ml-equation-statement__orbit/, 'the invariant section should not fall back to another decorative ring');
assert.match(css, /\.ml-method-step:nth-child\(1\)::before[^}]*var\(--ml-home-blue-dark\)/s, 'step one needs a deep-blue construction plane');
assert.match(css, /\.ml-method-step:nth-child\(2\)::before[^}]*var\(--ml-home-green-soft\)/s, 'step two needs a distinct mint construction plane');
assert.match(css, /\.ml-method-step:nth-child\(3\)::before[^}]*var\(--ml-home-offwhite\)/s, 'step three needs an asymmetric off-white coordinate plane');
assert.match(css, /\.ml-geometry-section::before[^}]*var\(--ml-home-blue-dark\)/s, 'geometry needs a secondary deep-blue plane behind the white workspace');
assert.match(css, /\.ml-function__grid\s*\{[^}]*grid-template-columns:\s*minmax\(360px,\s*40%\)\s*minmax\(0,\s*60%\)/s, 'function playground should use a full-width 40/60 split-screen');
assert.match(css, /\.ml-function-slope path\s*\{[^}]*var\(--ml-home-green\)/s, 'graph slope verification should use green while the main line stays blue');
assert.match(css, /\.ml-program > \.ml-shell\s*\{[^}]*1400px/s, 'curriculum should use a wider visual shell');
assert.match(css, /\.ml-hero\s*\{[^}]*min-height:\s*640px/s, 'desktop hero should remain dominant without approaching a full viewport');
assert.match(css, /\.ml-method-step,\s*\.ml-method-step \+ \.ml-method-step\s*\{[^}]*min-height:\s*286px/s, 'learning cards should use the compact editorial height');
assert.match(css, /\.ml-geometry-section\s*\{[^}]*min-height:\s*72svh[^}]*padding-block:\s*28px/s, 'geometry should stay immersive without a full-screen dead zone');
assert.match(css, /\.ml-lesson-preview\s*\{[^}]*min-height:\s*440px[^}]*margin-top:\s*30px/s, 'lesson flow should keep its UI legible while tightening the stack');
assert.match(css, /\.ml-equation-statement\s*\{[^}]*min-height:\s*54svh/s, 'the invariant formula should be a compact editorial moment');
assert.match(css, /\.ml-function,\s*\.ml-function__grid\s*\{[^}]*min-height:\s*74svh/s, 'the interactive function playground should retain proportionally more space');
assert.match(css, /\.ml-program-browser\s*\{[^}]*min-height:\s*430px[^}]*margin-top:\s*24px/s, 'curriculum should tighten its panel and heading gap');
assert.match(css, /\.ml-reasoning\s*\{[^}]*min-height:\s*66svh[^}]*padding-block:\s*34px 38px/s, 'reasoning should keep the triangle dominant without excess vertical space');
assert.match(css, /\.ml-final\s*\{[^}]*min-height:\s*58svh/s, 'final CTA should breathe without becoming another full-screen section');
assert.match(js, /function initStatementMotion\(\)/, 'oversized mathematical typography should react subtly to scroll');
assert.match(js, /productionStatus === 'implemented'/, 'curriculum green status must correspond to implemented material');
assert.match(js, /classList\.toggle\('is-verified'/, 'reasoning green state must correspond to an applied condition');
assert.match(html, /ml-final__green-point/, 'dark final geometry should close with both blue and green strokes');
assert.doesNotMatch(html, /ml-hero-guides/, 'hero must not rely on decorative full-canvas guide lines');
assert.match(html, /data-part="side-labels"/, 'hero geometry should expose live side measurements');
assert.match(html, /class="ml-atmosphere"/, 'page should expose restrained large-scale background atmosphere');
assert.match(css, /\.ml-hero\s*\{[^}]*border-radius:\s*26px/s, 'desktop hero should read as one large product-showcase card');
assert.equal((html.match(/class="ml-method-step ml-reveal" tabindex="0"/g) || []).length, 3, 'all three mathematical method marks must be keyboard focusable');
assert.equal((html.match(/data-method-motion=/g) || []).length, 3, 'each method step needs a restrained product micro-interaction');

/* The program preview reads canonical metadata and does not invent topic totals. */
assert.match(html, /<script src="data\/curriculum\.js"><\/script>/);
assert.match(js, /window\.MATHLOGIC_CURRICULUM/);
assert.match(js, /ALG-01\.linear-equations/);
assert.match(js, /GEO-02\.triangle-basics/);
assert.match(js, /function topicPreview\(topic\)/, 'real curriculum topics should expose lightweight mathematical previews');
assert.match(js, /data-explore-toggle/, 'lesson exploration stage should include a real interaction');
assert.match(html, /data-function-demo/, 'landing should include the compact linear-function product moment');
assert.match(js, /function initFunctionDemo\(\)/, 'linear-function controls need an isolated demo controller');
assert.equal((html.match(/data-function-handle=/g) || []).length, 2, 'function playground should expose two draggable mathematical handles');
assert.match(js, /data-practice-form/, 'lesson practice must accept a real answer without touching progress');
const curriculumContext = { window: {} };
vm.createContext(curriculumContext);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/curriculum.js'), 'utf8'), curriculumContext);
assert.deepEqual(Array.from(curriculumContext.window.MATHLOGIC_CURRICULUM.subjects, function(subject) { return subject.id; }), ['algebra', 'geometry']);
assert.ok(curriculumContext.window.MATHLOGIC_CURRICULUM.topics.length > 0);

/* Landing demos are isolated: language preference may change, learning state may not. */
['completeLesson', 'setLessonSession', 'setInteractionState', 'markSubtopicsDone', 'progress.lessons', 'lesson.sessions'].forEach(function(forbidden) {
  assert.equal(js.includes(forbidden), false, 'landing must not mutate learning data via ' + forbidden);
});

/* Navigation resolves to real sections or pages. */
['features', 'program', 'about', 'top'].forEach(function(id) {
  assert.match(html, new RegExp('id="' + id + '"'), 'missing landing anchor target #' + id);
  assert.match(html, new RegExp('href="#' + id + '"'), 'missing navigation link to #' + id);
});
['program.html', 'dashboard.html', 'profile.html', 'lesson.html?id=geometry.triangle-angle-sum'].forEach(function(route) {
  assert.ok(html.includes(route), 'landing route must point to an existing product page: ' + route);
});

/* Avoid claims and UI patterns explicitly excluded by the brief. */
['testimonial', 'leaderboard', 'AI tutor', 'тысяч студентов', 'тысячи учеников', 'user count'].forEach(function(term) {
  assert.equal((html + js).toLowerCase().includes(term.toLowerCase()), false, 'landing contains excluded claim/pattern: ' + term);
});

/* Responsive and interaction contracts. */
assert.match(css, /@media \(max-width: 800px\)/);
assert.match(css, /@media \(max-width: 520px\)/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /touch-action:\s*none/);
assert.match(css, /overflow-x:\s*auto/);
assert.match(html, /role="tablist"/);
assert.match(js, /ArrowLeft/);
assert.match(js, /pointerdown/);

/* Keep the public entry point lightweight: no lesson engine, catalogs, or vendor runtime. */
const scripts = Array.from(html.matchAll(/<script src="([^"]+)"/g), function(match) { return match[1]; });
assert.deepEqual(scripts, ['js/storage.js', 'js/i18n.js', 'js/site.js', 'data/curriculum.js', 'js/home.js']);

console.log('landing-regression: ok', JSON.stringify({ localizedNodes: copyNodes.length, scripts: scripts.length }));
