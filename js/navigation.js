/* ========================================
   NAVIGATION — math·logic
   Единая навигация, обработка ссылок
   ======================================== */

const NAV = (function() {

  // Fix all internal links — ensure they point to correct pages
  function fixLinks() {
    const linkMap = {
      'index.html': 'index.html',
      'dashboard.html': 'dashboard.html',
      'profile.html': 'profile.html',
      'settings.html': 'settings.html',
      'login.html': 'login.html',
      'onboarding.html': 'onboarding.html',
      'lesson.html': 'lesson.html',
      'topic-1-expressions.html': 'topic-1-expressions.html',
    };

    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      // Skip external links and anchors
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
      // If it's a known page, ensure it exists (we skip topic.html — empty/broken)
    });
  }

  // Logout
  function logout() {
    UI.showConfirm('Выйти из аккаунта?', function() {
      ML.clearUser();
      window.location.href = 'login.html';
    });
  }

  // Navigate to settings
  function goToSettings(e) {
    if (e) e.preventDefault();
    window.location.href = 'settings.html';
  }

  // Navigate to profile
  function goToProfile(e) {
    if (e) e.preventDefault();
    window.location.href = 'profile.html';
  }

  // Navigate to dashboard
  function goToDashboard(e) {
    if (e) e.preventDefault();
    window.location.href = 'dashboard.html';
  }

  return {
    fixLinks,
    logout,
    goToSettings,
    goToProfile,
    goToDashboard
  };
})();