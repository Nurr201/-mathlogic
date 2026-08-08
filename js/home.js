(function() {
  'use strict';

  function lang() { return ML.getLang(); }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }

  function renderHeader() {
    var account = document.getElementById('home-account');
    var primary = document.getElementById('home-primary');
    var headerPrimary = document.getElementById('home-header-primary');
    if (ML.isLoggedIn()) {
      account.href = 'profile.html';
      account.textContent = copy('Профиль', 'Профиль');
      primary.textContent = copy('Продолжить обучение', 'Оқуды жалғастыру');
      headerPrimary.textContent = copy('Продолжить', 'Жалғастыру');
    } else {
      account.href = 'login.html';
      account.textContent = copy('Войти', 'Кіру');
      primary.textContent = copy('Начать обучение', 'Оқуды бастау');
      headerPrimary.textContent = copy('Начать обучение', 'Оқуды бастау');
    }
  }

  function showDemoFeedback(choice) {
    var feedback = document.getElementById('home-demo-feedback');
    var buttons = document.querySelectorAll('[data-demo-choice]');
    buttons.forEach(function(button) {
      button.classList.remove('is-selected', 'is-correct', 'is-incorrect');
      button.setAttribute('aria-pressed', 'false');
    });
    choice.classList.add('is-selected');
    choice.setAttribute('aria-pressed', 'true');
    feedback.hidden = false;

    if (choice.dataset.demoChoice === 'correct') {
      choice.classList.add('is-correct');
      feedback.className = 'home-demo-feedback is-correct';
      feedback.innerHTML = '<strong>' + copy('Верный первый шаг.', 'Дұрыс алғашқы қадам.') + '</strong><span>' + copy('У 3x и 2x одинаковая переменная часть x, поэтому можно сложить коэффициенты: 3x + 2x = 5x.', '3x пен 2x-тің айнымалы бөлігі x бірдей, сондықтан коэффициенттерді қосуға болады: 3x + 2x = 5x.') + '</span>';
      return;
    }

    choice.classList.add('is-incorrect');
    feedback.className = 'home-demo-feedback is-incorrect';
    if (choice.dataset.demoChoice === 'unlike') {
      feedback.innerHTML = '<strong>' + copy('Проверьте структуру слагаемых.', 'Қосылғыштардың құрылымын тексеріңіз.') + '</strong><span>' + copy('3x содержит переменную часть, а 5 — постоянное число. Найдите два слагаемых с одинаковой переменной частью.', '3x айнымалы бөліктен тұрады, ал 5 — тұрақты сан. Айнымалы бөлігі бірдей екі қосылғышты табыңыз.') + '</span>';
    } else {
      feedback.innerHTML = '<strong>' + copy('Значение x не задано.', 'x мәні берілмеген.') + '</strong><span>' + copy('Выражение можно упростить для любого x. Сначала посмотрите, какие слагаемые являются подобными.', 'Өрнекті кез келген x үшін ықшамдауға болады. Алдымен қай қосылғыштар ұқсас екенін қараңыз.') + '</span>';
    }
  }

  function initDemo() {
    document.querySelectorAll('[data-demo-choice]').forEach(function(button) {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', function() { showDemoFeedback(button); });
    });
  }

  function init() {
    ML.applySettings();
    MathLogicSite.applyCopy();
    renderHeader();
    initDemo();
    if (typeof ANIME !== 'undefined' && ANIME.initPageTransitions) ANIME.initPageTransitions();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
