/* ========================================
   STORAGE — math·logic
   Единая система хранения данных
   Все данные в одном ключе localStorage
   ======================================== */

const ML = (function() {

  const STORAGE_KEY = 'mathlogic_data';

  const DEFAULTS = {
    user: {
      id: null,
      name: 'Нұрбол Абдазов',
      username: '@nurbek_dev',
      email: 'nurbek@example.com',
      level: 12,
      xp: 700,
      xpToNext: 2000,
      streak: 17,
      streakBest: 42,
      streakTotal: 186,
      lastVisit: null,
      lastLesson: 'Виет теоремасы',
      createdAt: null,
      loggedIn: false,
    },
    progress: {
      subtopics: {},
    },
    settings: {
      theme: 'light',
      accent: '#1D4ED8',
      font_size: 'medium',
      lang: 'kz',
      daily_goal: 3,
      reminders: true,
      autosave: true,
      solutions: 'after_answer',
      push: false,
      email: true,
      sound: true,
      animations: true,
    },
    stats: {
      lessons_completed: 34,
      modules_completed: 12,
      xp_earned: 1248,
      study_time: 684,
      problems_solved: 237,
      avg_score: 86,
      best_streak: 14,
      achievements_count: 8,
    },
    achievements: [],
    streak_data: null,
    timeline: [],
    goals: null,
    analytics: {},
  };

  // Полная структура данных
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

  /* ---------- МИГРАЦИЯ СО СТАРЫХ КЛЮЧЕЙ ---------- */

  function migrate() {
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

    // Собираем старые profile_* ключи
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

    // Строим новый объект
    data = clone(DEFAULTS);

    if (oldUser) {
      data.user.name = oldUser.name || data.user.name;
      data.user.email = oldUser.email || data.user.email;
      data.user.loggedIn = oldUser.loggedIn || false;
      data.user.level = oldUser.level || data.user.level;
      data.user.id = oldUser.id || data.user.id;
    }

    if (oldSubtopics) {
      data.progress.subtopics = oldSubtopics;
    }

    if (oldLang) {
      data.settings.lang = oldLang;
    }

    // Перенос настроек из profile_settings_*
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

    // Перенос статистики
    var statKeys = ['lessons_completed','modules_completed','xp_earned','study_time','problems_solved','avg_score','best_streak','achievements_count'];
    statKeys.forEach(function(k) {
      if (oldProfile[k] !== undefined) data.stats[k] = parseInt(oldProfile[k], 10);
    });

    // Перенос achievements, streak, timeline, goals, analytics
    if (oldProfile.achievements) data.achievements = oldProfile.achievements;
    if (oldProfile.streak_data) data.streak_data = oldProfile.streak_data;
    if (oldProfile.timeline) data.timeline = oldProfile.timeline;
    if (oldProfile.goals) data.goals = oldProfile.goals;
    if (oldProfile.analytics) data.analytics = oldProfile.analytics;

    // Удаляем старые ключи
    var oldKeys = [
      'math_logic_user','math_logic_subtopics','math_logic_lang',
    ];
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

  /* ---------- ЗАГРУЗКА ---------- */

  function getData() {
    if (_cache) return _cache;
    var data = loadRaw();
    if (!data) {
      data = migrate();
    }
    if (!data) {
      data = clone(DEFAULTS);
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

  /* ---------- API ---------- */

  // --- User ---
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

  // --- Language ---
  function getLang() {
    var d = getData();
    return d.settings.lang || 'kz';
  }

  function setLang(lang) {
    var d = getData();
    d.settings.lang = lang;
    saveData(d);
  }

  // --- Progress / Subtopics ---
  function getSubtopics() {
    var d = getData();
    return d.progress.subtopics || {};
  }

  function setSubtopics(data) {
    var d = getData();
    d.progress.subtopics = data || {};
    saveData(d);
  }

  function resetSubtopics() {
    var d = getData();
    d.progress.subtopics = {};
    saveData(d);
  }

  // --- Profile (generic deep get/set) ---
  function getProfile(path, defaultVal) {
    var d = getData();
    var parts = path.split('.');
    var current = d;
    for (var i = 0; i < parts.length; i++) {
      if (current === null || current === undefined || typeof current !== 'object') return defaultVal;
      current = current[parts[i]];
    }
    return current !== undefined && current !== null ? current : defaultVal;
  }

  function setProfile(path, value) {
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

  // --- Stats shortcuts ---
  function getStat(key, defaultVal) {
    return getProfile('stats.' + key, defaultVal);
  }

  function setStat(key, value) {
    setProfile('stats.' + key, value);
  }

  // --- Settings shortcuts ---
  function getSetting(key, defaultVal) {
    return getProfile('settings.' + key, defaultVal);
  }

  function setSetting(key, value) {
    setProfile('settings.' + key, value);
  }

  // --- Reset all ---
  function resetAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    _cache = null;
  }

  function exportAll() {
    return clone(getData());
  }

  // ===== НОВЫЕ ФУНКЦИИ ИНТЕГРАЦИИ =====

  function calcLevel(xp) {
    return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  }

  function calcXpForLevel(level) {
    return level * level * 100;
  }

  function calcXpToNext(level, xp) {
    return calcXpForLevel(level + 1) - xp;
  }

  function awardXP(amount, reason) {
    if (!amount || amount <= 0) return;
    var d = getData();
    d.user.xp = (d.user.xp || 0) + amount;
    d.user.level = calcLevel(d.user.xp);
    d.user.xpToNext = calcXpToNext(d.user.level, d.user.xp);
    d.stats.xp_earned = (d.stats.xp_earned || 0) + amount;
    saveData(d);
  }

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
    if (typeof DATA === 'undefined' || !DATA) {
      var total = Object.keys(completed).length;
      return total > 0 ? Math.min(total * 5, 100) : 0;
    }
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
    // User
    getUser, setUser, clearUser, isLoggedIn,
    // Language
    getLang, setLang,
    // Progress
    getSubtopics, setSubtopics, resetSubtopics,
    // Generic paths
    getProfile, setProfile,
    // Stats
    getStat, setStat,
    // Settings
    getSetting, setSetting,
    // Integration
    calcLevel, calcXpForLevel, calcXpToNext,
    awardXP, completeLesson, getCompletedLessons,
    markSubtopicsDone, updateLastVisit, addTimelineEntry,
    calcOverallProgress, applySettings,
    // Utilities
    resetAll, exportAll,
    // Backward-compat aliases
    getProfileStat: getStat,
  };
})();
