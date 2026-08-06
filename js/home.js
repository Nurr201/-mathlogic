(function() {
  'use strict';

  function lang() { return ML.getLang(); }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }
  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function localize(record, key) { return I18N.localize(record, key, lang()); }

  function applyTheme() {
    ML.applySettings();
    document.querySelectorAll('[data-theme-toggle]').forEach(function(button) {
      button.textContent = document.documentElement.dataset.theme === 'dark' ? '◑' : '◐';
    });
  }

  function renderHeader() {
    document.querySelectorAll('[data-language-choice]').forEach(function(button) {
      button.setAttribute('aria-pressed', String(button.dataset.languageChoice === lang()));
    });
    var account = document.getElementById('home-account');
    var primary = document.getElementById('home-primary');
    var headerPrimary = document.getElementById('home-header-primary');
    if (ML.isLoggedIn()) {
      account.href = 'profile.html';
      account.textContent = copy('Профиль', 'Профиль');
      primary.querySelector('span:last-child').textContent = copy('Продолжить обучение', 'Оқуды жалғастыру');
      headerPrimary.textContent = copy('Продолжить', 'Жалғастыру');
    } else {
      account.href = 'login.html';
      account.textContent = copy('Войти', 'Кіру');
      primary.querySelector('span:last-child').textContent = copy('Открыть курс', 'Курсты ашу');
      headerPrimary.textContent = copy('Начать', 'Бастау');
    }
  }

  function renderSubjects() {
    var root = document.getElementById('home-subjects');
    root.innerHTML = Learning.getSubjects().map(function(subject) {
      var name = I18N.t('subjects.' + subject.key, lang()) || localize(subject, 'name') || subject.name;
      var lessonLabel = copy('уроков в маршруте', 'сабақ бағытта');
      return '<article class="product-subject-card" style="--subject-color:' + escapeHtml(subject.mainColor) + '">' +
        '<span class="product-subject-icon" aria-hidden="true">' + subject.icon + '</span><span><strong>' + escapeHtml(name) + '</strong>' +
        '<small>' + subject.completedLessons + ' / ' + subject.totalLessons + ' ' + escapeHtml(lessonLabel) + '</small></span>' +
        '<b class="mono">' + subject.progress + '%</b></article>';
    }).join('');
  }

  function renderLessonPreview() {
    var lesson = Learning.getLesson('algebra.exponents.basics') || Learning.getNextLesson();
    if (!lesson) return;
    document.getElementById('home-preview-title').textContent = localize(lesson, 'title');
    document.getElementById('home-preview-description').textContent = localize(lesson, 'description');
    document.getElementById('home-sample-title').textContent = localize(lesson, 'title');
    document.getElementById('home-sample-link').href = lesson.route;
  }

  function render() {
    MathLogicSite.applyCopy();
    applyTheme();
    renderHeader();
    renderSubjects();
    renderLessonPreview();
  }

  function init() {
    document.querySelectorAll('[data-language-choice]').forEach(function(button) {
      button.addEventListener('click', function() {
        ML.setLang(button.dataset.languageChoice);
        render();
      });
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(function(button) {
      button.addEventListener('click', function() {
        ML.setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
        applyTheme();
      });
    });
    render();
    if (typeof ANIME !== 'undefined' && ANIME.initPageTransitions) ANIME.initPageTransitions();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
