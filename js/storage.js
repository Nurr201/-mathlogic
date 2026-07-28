/* ========================================
   STORAGE — math·logic
   Единый слой для работы с localStorage
   ======================================== */

const ML = (function() {
  const KEYS = {
    USER: 'math_logic_user',
    SUBTOPICS: 'math_logic_subtopics',
    LANG: 'math_logic_lang',
  };

  // --- User ---
  function getUser() {
    try {
      const raw = localStorage.getItem(KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  function setUser(data) {
    try { localStorage.setItem(KEYS.USER, JSON.stringify(data)); } catch(e) {}
  }

  function clearUser() {
    try { localStorage.removeItem(KEYS.USER); } catch(e) {}
  }

  function isLoggedIn() {
    const user = getUser();
    return user && user.loggedIn === true;
  }

  // --- Language ---
  function getLang() {
    try { return localStorage.getItem(KEYS.LANG) || 'kz'; } catch(e) { return 'kz'; }
  }

  function setLang(lang) {
    try { localStorage.setItem(KEYS.LANG, lang); } catch(e) {}
  }

  // --- Subtopics Progress ---
  function getSubtopics() {
    try {
      const saved = localStorage.getItem(KEYS.SUBTOPICS);
      return saved ? JSON.parse(saved) : {};
    } catch(e) { return {}; }
  }

  function setSubtopics(data) {
    try { localStorage.setItem(KEYS.SUBTOPICS, JSON.stringify(data)); } catch(e) {}
  }

  function resetSubtopics() {
    try { localStorage.removeItem(KEYS.SUBTOPICS); } catch(e) {}
  }

  // --- Profile Data (generic get/set) ---
  function getProfile(key, defaultVal) {
    try {
      const stored = localStorage.getItem('profile_' + key);
      return stored !== null ? JSON.parse(stored) : defaultVal;
    } catch(e) { return defaultVal; }
  }

  function setProfile(key, value) {
    try { localStorage.setItem('profile_' + key, JSON.stringify(value)); } catch(e) {}
  }

  function getProfileStat(key, defaultVal) {
    try {
      const stored = localStorage.getItem('profile_stat_' + key);
      return stored !== null ? parseInt(stored, 10) : defaultVal;
    } catch(e) { return defaultVal; }
  }

  // Public API
  return {
    getUser, setUser, clearUser, isLoggedIn,
    getLang, setLang,
    getSubtopics, setSubtopics, resetSubtopics,
    getProfile, setProfile, getProfileStat,
    KEYS
  };
})();