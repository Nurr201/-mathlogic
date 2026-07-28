/* ========================================
   NAVIGATION — math·logic
   Единая навигация, обработка ссылок
   ======================================== */

const NAV = (function() {

  function fixLinks() {
    var knownPages = {
      'index.html': 1, 'dashboard.html': 1, 'profile.html': 1,
      'settings.html': 1, 'login.html': 1, 'onboarding.html': 1,
      'lesson.html': 1, 'topic-1-expressions.html': 1, 'topic.html': 1
    };

    document.querySelectorAll('a[href]').forEach(function(a) {
      var href = a.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
    });
  }

  function logout() {
    UI.showConfirm('Выйти из аккаунта?', function() {
      ML.clearUser();
      window.location.href = 'login.html';
    });
  }

  function goToSettings(e) {
    if (e) e.preventDefault();
    window.location.href = 'settings.html';
  }

  function goToProfile(e) {
    if (e) e.preventDefault();
    window.location.href = 'profile.html';
  }

  function goToDashboard(e) {
    if (e) e.preventDefault();
    window.location.href = 'dashboard.html';
  }

  // Проверка: если не залогинен → редирект на login
  function requireAuth() {
    if (!ML.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  return {
    fixLinks: fixLinks,
    logout: logout,
    goToSettings: goToSettings,
    goToProfile: goToProfile,
    goToDashboard: goToDashboard,
    requireAuth: requireAuth
  };
})();
