/* ========================================
   STORAGE — math·logic
   Единое ядро данных пользователя
   Все данные в одном ключе localStorage
   Версия схемы: 1
   ======================================== */

const ML = (function() {

  const VERSION = 1;
  const STORAGE_KEY = 'mathlogic_data';

  const DEFAULTS = {
    version: VERSION,
    user: {
      id: null,
      name: '',
      username: '',
      email: '',
      level: 1,
      xp: 0,
      xpToNext: 100,
      streak: 0,
      streakBest: 0,
      streakTotal: 0,
      lastVisit: null,
      lastLesson: '',
      createdAt: null,
      loggedIn: false,
      goals: [],
      age: null,
    },
    progress: {
      subtopics: {},
      lessons: {},
    },
    settings: {
      theme: 'light',
      accent: '#4F46E5',
      font_size: 'medium',
      lang: 'kz',
      daily_goal: 3,
      reminders: true,
      autosave: true,
      solutions: 'after_answer',
      push: false,
      email_notif: true,
      sound: true,
      animations: true,
    },
    stats: {
      lessons_completed: 0,
      modules_completed: 0,
      xp_earned: 0,
      study_time: 0,
      problems_solved: 0,
      avg_score: 0,
      best_streak: 0,
      achievements_count: 0,
    },
    achievements: [],
    streak_data: null,
    timeline: [],
    goals: null,
    analytics: {},
    dashboard: {
      quests: {},
    },
  };

  let _cache = null;

  /* ---------- ВНУТРЕННИЕ ---------- */

  function deepMerge(target, source) {
    var result = {};
    for (var k in target) result[k] = target[k];
    for (var k in source) {
      if (source[k] !== null && typeof source[k] === 'object' && !Array.isArray(source[k]) && typeof result[k] === 'object' && !Array.isArray(result[k])) {
        result[k] = deepMerge(result[k], source[k]);
      } else {
        result[k] = source[k];
      }
    }
    return result;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  function saveRaw(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
  }

  /* ---------- МИГРАЦИЯ ---------- */

  function migrateLegacy() {
    var data = loadRaw();
    if (data) return data;

    var oldUser = null;
    try {
      var raw = localStorage.getItem('math_logic_user');
      if (raw) oldUser = JSON.parse(raw);
    } catch(e) {}

    var oldSubtopics = null;
    try {
      var raw = localStorage.getItem('math_logic_subtopics');
      if (raw) oldSubtopics = JSON.parse(raw);
    } catch(e) {}

    var oldLang = localStorage.getItem('math_logic_lang');

    var oldProfile = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf('profile_') === 0) {
        try { oldProfile[key.replace('profile_', '')] = JSON.parse(localStorage.getItem(key)); }
        catch(e) { oldProfile[key.replace('profile_', '')] = localStorage.getItem(key); }
      }
      if (key && key.indexOf('profile_stat_') === 0) {
        try { oldProfile[key.replace('profile_stat_', '')] = parseInt(localStorage.getItem(key), 10); }
        catch(e) {}
      }
    }

    if (!oldUser && !oldSubtopics && !oldLang && Object.keys(oldProfile).length === 0) {
      return null;
    }

    data = clone(DEFAULTS);
    data.version = VERSION;

    if (oldUser) {
      data.user.name = oldUser.name || '';
      data.user.email = oldUser.email || '';
      data.user.loggedIn = oldUser.loggedIn || false;
      data.user.level = oldUser.level || 1;
      data.user.id = oldUser.id || null;
    }

    if (oldSubtopics) {
      data.progress.subtopics = oldSubtopics;
    }

    if (oldLang) {
      data.settings.lang = oldLang;
    }

    for (var sk in oldProfile) {
      if (sk.indexOf('settings_') === 0) {
        var skName = sk.replace('settings_', '');
        var skVal = oldProfile[sk];
        if (typeof skVal === 'boolean' || skVal === 'true' || skVal === 'false') {
          data.settings[skName] = skVal === true || skVal === 'true';
        } else if (!isNaN(parseInt(skVal, 10)) && skVal !== '' && ['name','username','email','lang','theme','accent','font_size','solutions'].indexOf(skName) === -1) {
          data.settings[skName] = parseInt(skVal, 10);
        } else {
          data.settings[skName] = skVal;
        }
      }
    }

    var statKeys = ['lessons_completed','modules_completed','xp_earned','study_time','problems_solved','avg_score','best_streak','achievements_count'];
    statKeys.forEach(function(k) {
      if (oldProfile[k] !== undefined) data.stats[k] = parseInt(oldProfile[k], 10);
    });

    if (oldProfile.achievements) data.achievements = oldProfile.achievements;
    if (oldProfile.streak_data) data.streak_data = oldProfile.streak_data;
    if (oldProfile.timeline) data.timeline = oldProfile.timeline;
    if (oldProfile.goals) data.goals = oldProfile.goals;
    if (oldProfile.analytics) data.analytics = oldProfile.analytics;

    var oldKeys = ['math_logic_user','math_logic_subtopics','math_logic_lang'];
    for (var j = 0; j < localStorage.length; j++) {
      var k2 = localStorage.key(j);
      if (k2 && (k2.indexOf('profile_') === 0 || k2.indexOf('math_logic_') === 0)) {
        oldKeys.push(k2);
      }
    }
    oldKeys.forEach(function(k) {
      try { localStorage.removeItem(k); } catch(e) {}
    });

    saveRaw(data);
    return data;
  }

  function runMigrations(data) {
    var v = data.version || 0;

    if (v < 1) {
      data = migrateV0toV1(data);
    }

    return data;
  }

  function migrateV0toV1(data) {
    data = data || {};

    delete data.settings.name;
    delete data.settings.username;
    delete data.settings.name_err;

    if (data.settings.email !== undefined) {
      if (typeof data.settings.email === 'boolean') {
        data.settings.email_notif = data.settings.email;
      }
    }
    delete data.settings.email;

    try {
      var dashRaw = localStorage.getItem('ml_dash_state');
      if (dashRaw) {
        var dashState = JSON.parse(dashRaw);
        if (dashState && typeof dashState === 'object') {
          data.dashboard = {
            quests: dashState.quests || {},
          };
        }
        localStorage.removeItem('ml_dash_state');
      }
    } catch(e) {}

    if (!data.dashboard || typeof data.dashboard !== 'object') {
      data.dashboard = { quests: {} };
    }

    if (!data.progress.lessons) data.progress.lessons = {};

    data.version = 1;
    return data;
  }

  /* ---------- ЗАГРУЗКА ---------- */

  function getData() {
    if (_cache) return _cache;
    var data = loadRaw();
    if (!data) {
      data = migrateLegacy();
    }
    if (!data) {
      data = clone(DEFAULTS);
      data.version = VERSION;
      data.user.id = 'user_' + Date.now();
      data.user.createdAt = Date.now();
      data.user.lastVisit = Date.now();
      saveRaw(data);
    } else if (!data.version || data.version < VERSION) {
      data = runMigrations(data);
      saveRaw(data);
    }
    _cache = data;
    return data;
  }

  function saveData(data) {
    _cache = data;
    saveRaw(data);
  }

  function resetCache() {
    _cache = null;
  }

  /* ---------- ОСНОВНОЙ (ПЕРВИЧНЫЙ) API ---------- */

  function get(path, defaultVal) {
    var d = getData();
    var parts = path.split('.');
    var current = d;
    for (var i = 0; i < parts.length; i++) {
      if (current === null || current === undefined || typeof current !== 'object') return defaultVal;
      current = current[parts[i]];
    }
    return current !== undefined && current !== null ? current : defaultVal;
  }

  function set(path, value) {
    var d = getData();
    var parts = path.split('.');
    var current = d;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    saveData(d);
  }

  /* ---------- USER ---------- */

  function getUser() {
    var d = getData();
    return d.user ? clone(d.user) : null;
  }

  function setUser(userData) {
    var d = getData();
    d.user = deepMerge(d.user || {}, userData);
    if (!d.user.id) d.user.id = 'user_' + Date.now();
    if (!d.user.createdAt) d.user.createdAt = Date.now();
    saveData(d);
  }

  function clearUser() {
    var d = getData();
    d.user.loggedIn = false;
    saveData(d);
  }

  function isLoggedIn() {
    var d = getData();
    return d.user && d.user.loggedIn === true;
  }

  /* ---------- LANGUAGE ---------- */

  function getLang() {
    var d = getData();
    return d.settings.lang || 'kz';
  }

  function setLang(lang) {
    var d = getData();
    d.settings.lang = lang;
    saveData(d);
  }

  /* ---------- PROGRESS ---------- */

  function getSubtopics() {
    var d = getData();
    return d.progress.subtopics || {};
  }

  function setSubtopics(data) {
    var d = getData();
    d.progress.subtopics = data || {};
    saveData(d);
  }

  /* ---------- ALIASES (обратная совместимость) ---------- */

  function getProfile(path, defaultVal) {
    return get(path, defaultVal);
  }

  function setProfile(path, value) {
    set(path, value);
  }

  function getProfileStat(key, defaultVal) {
    return get('stats.' + key, defaultVal);
  }

  function getSetting(key, defaultVal) {
    return get('settings.' + key, defaultVal);
  }

  function setSetting(key, value) {
    set('settings.' + key, value);
  }

  /* ---------- RESET ---------- */

  function resetAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    _cache = null;
  }

  function exportAll() {
    return clone(getData());
  }

  /* ===== СИСТЕМНЫЕ ФУНКЦИИ ===== */

  function completeLesson(lessonId, result) {
    var d = getData();
    if (!d.progress.lessons) d.progress.lessons = {};
    d.progress.lessons[lessonId] = {
      completedAt: Date.now(),
      score: result.score || 0,
      correct: result.correct || 0,
      total: result.total || 0,
      attempts: result.attempts || 0,
      time: result.time || 0,
      xpEarned: result.xpEarned || 0,
      grade: result.grade || '',
    };
    d.stats.lessons_completed = Object.keys(d.progress.lessons).length;
    if (result.time) d.stats.study_time = (d.stats.study_time || 0) + result.time;
    if (result.correct) d.stats.problems_solved = (d.stats.problems_solved || 0) + result.correct;
    if (result.score !== undefined) {
      var totalScore = 0, count = 0;
      for (var k in d.progress.lessons) {
        totalScore += d.progress.lessons[k].score;
        count++;
      }
      d.stats.avg_score = count > 0 ? Math.round(totalScore / count) : 0;
    }
    saveData(d);
  }

  function getCompletedLessons() {
    var d = getData();
    return d.progress.lessons || {};
  }

  function markSubtopicsDone(subtopicArray) {
    var d = getData();
    if (!d.progress.subtopics) d.progress.subtopics = {};
    subtopicArray.forEach(function(st) {
      d.progress.subtopics[st] = true;
    });
    saveData(d);
  }

  function updateLastVisit() {
    var d = getData();
    var now = Date.now();
    var today = new Date().toISOString().slice(0, 10);
    if (d.user.lastVisit) {
      var lastDate = new Date(d.user.lastVisit).toISOString().slice(0, 10);
      if (lastDate !== today) {
        var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastDate === yesterday) {
          d.user.streak = (d.user.streak || 0) + 1;
        } else {
          d.user.streak = 1;
        }
        d.user.streakBest = Math.max(d.user.streakBest || 0, d.user.streak);
        d.user.streakTotal = (d.user.streakTotal || 0) + 1;
        d.stats.best_streak = d.user.streakBest;
      }
    } else {
      d.user.streak = 1;
    }
    d.user.lastVisit = now;
    saveData(d);
  }

  function addTimelineEntry(entry) {
    var d = getData();
    if (!d.timeline) d.timeline = [];
    d.timeline.unshift({
      icon: entry.icon || '📘',
      title: entry.title || '',
      desc: entry.desc || '',
      time: Date.now(),
      color: entry.color || 'bg-blue-500',
    });
    if (d.timeline.length > 50) d.timeline = d.timeline.slice(0, 50);
    saveData(d);
  }

  function calcOverallProgress() {
    var d = getData();
    var completed = d.progress.subtopics || {};
    if (typeof DATA === 'undefined' || !DATA) return 0;
    var total = 0, done = 0;
    try {
      Object.keys(DATA).forEach(function(sKey) {
        (DATA[sKey] || []).forEach(function(sec) {
          (sec.modules || []).forEach(function(mod) {
            (mod.subtopics || []).forEach(function(st) {
              total++;
              if (completed[st]) done++;
            });
          });
        });
      });
    } catch(e) {}
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function applySettings() {
    var d = getData();
    var s = d.settings || {};
    var body = document.body;
    if (s.theme === 'dark') {
      body.classList.add('dark');
    } else if (s.theme === 'light') {
      body.classList.remove('dark');
    } else if (s.theme === 'system') {
      body.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    if (s.accent) {
      document.documentElement.style.setProperty('--primary', s.accent);
    }
    if (s.font_size) {
      var sizes = { small: '14px', medium: '16px', large: '18px' };
      document.documentElement.style.fontSize = sizes[s.font_size] || '16px';
    }
  }

  return {
    // Core
    getData, saveData, resetCache,
    // Primary API
    get, set,
    // User
    getUser, setUser, clearUser, isLoggedIn,
    // Language
    getLang, setLang,
    // Progress
    getSubtopics, setSubtopics,
    // Aliases (обратная совместимость)
    getProfile, setProfile,
    getSetting, setSetting,
    getProfileStat,
    // System
    completeLesson, getCompletedLessons,
    markSubtopicsDone, updateLastVisit, addTimelineEntry,
    calcOverallProgress, applySettings,
    // Utilities
    resetAll, exportAll,
  };
})();
