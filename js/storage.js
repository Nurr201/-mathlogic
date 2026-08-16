/* ========================================
   STORAGE — math·logic
   Единое версионированное хранилище данных
   ======================================== */

const ML = (function() {
  'use strict';

  const VERSION = 2;
  const STORAGE_KEY = 'mathlogic_data';

  const DEFAULT_STATS = {
    lessons_completed: 0,
    modules_completed: 0,
    xp_earned: 0,
    study_time: 0,
    problems_solved: 0,
    avg_score: 0,
    best_streak: 0,
    achievements_count: 0,
  };

  const DEFAULT_SETTINGS = {
    theme: 'light',
    accent: '#4F46E5',
    font_size: 'medium',
    lang: 'ru',
    daily_goal: 3,
    reminders: true,
    autosave: true,
    solutions: 'after_answer',
    push: false,
    email_notif: true,
    sound: true,
    animations: true,
  };

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
      authVersion: null,
      passwordSalt: '',
      passwordHash: '',
      age: null,
    },
    progress: {
      lessons: {},
      subtopics: {},
    },
    lesson: {
      sessions: {},
    },
    settings: DEFAULT_SETTINGS,
    stats: DEFAULT_STATS,
    achievements: [],
    activity: {
      dates: [],
      studySecondsByDate: {},
      history: [],
    },
    timeline: [],
    goals: null,
    analytics: {},
    rewards: {},
  };

  let _cache = null;
  const _diagnostics = [];
  let _pendingLegacyCleanup = [];

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeLang(lang) {
    const value = String(lang || '').toLowerCase();
    if (value === 'ru') return 'ru';
    if (value === 'kk' || value === 'kz') return 'kk';
    return 'kk';
  }

  function deepMerge(defaults, saved) {
    if (!isPlainObject(defaults)) return saved === undefined ? clone(defaults) : clone(saved);
    const result = {};
    Object.keys(defaults).forEach(function(key) {
      result[key] = clone(defaults[key]);
    });
    if (!isPlainObject(saved)) return result;
    Object.keys(saved).forEach(function(key) {
      if (isPlainObject(saved[key]) && isPlainObject(defaults[key])) {
        result[key] = deepMerge(defaults[key], saved[key]);
      } else {
        result[key] = clone(saved[key]);
      }
    });
    return result;
  }

  function diagnostic(code, error) {
    const entry = {
      code: code,
      message: error ? (error.message || String(error)) : '',
      at: Date.now(),
    };
    _diagnostics.push(entry);
    if (_diagnostics.length > 20) _diagnostics.shift();
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[ML:' + code + ']', entry.message);
    }
  }

  function loadRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!isPlainObject(parsed)) {
        diagnostic('invalid-root', new Error('Stored root is not an object'));
        return null;
      }
      return parsed;
    } catch (error) {
      diagnostic('read-failed', error);
      return null;
    }
  }

  function saveRaw(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      diagnostic('write-failed', error);
      return false;
    }
  }

  function persist(data) {
    const saved = saveRaw(data);
    if (saved && _pendingLegacyCleanup.length) {
      const unique = {};
      _pendingLegacyCleanup.forEach(function(key) { unique[key] = true; });
      Object.keys(unique).forEach(function(key) {
        try { localStorage.removeItem(key); } catch (error) { diagnostic('legacy-cleanup', error); }
      });
      _pendingLegacyCleanup = [];
    }
    return saved;
  }

  function ensureTypes(data) {
    if (!isPlainObject(data.user)) data.user = clone(DEFAULTS.user);
    if (!isPlainObject(data.progress)) data.progress = clone(DEFAULTS.progress);
    if (!isPlainObject(data.progress.lessons)) data.progress.lessons = {};
    if (!isPlainObject(data.progress.subtopics)) data.progress.subtopics = {};
    if (!isPlainObject(data.lesson)) data.lesson = clone(DEFAULTS.lesson);
    if (!isPlainObject(data.lesson.sessions)) data.lesson.sessions = {};
    if (!isPlainObject(data.settings)) data.settings = clone(DEFAULT_SETTINGS);
    data.settings.lang = normalizeLang(data.settings.lang);
    if (!isPlainObject(data.stats)) data.stats = clone(DEFAULT_STATS);
    if (!Array.isArray(data.achievements)) data.achievements = [];
    if (!Array.isArray(data.timeline)) data.timeline = [];
    if (!isPlainObject(data.activity)) data.activity = clone(DEFAULTS.activity);
    if (!Array.isArray(data.activity.dates)) data.activity.dates = [];
    if (!isPlainObject(data.activity.studySecondsByDate)) data.activity.studySecondsByDate = {};
    data.activity.history = normalizeLearningHistory(data.activity.history);
    Object.keys(data.progress.lessons).forEach(function(lessonId) {
      const record = data.progress.lessons[lessonId];
      if (!record || record.status !== 'completed' || !Number(record.completedAt)) return;
      const exists = data.activity.history.some(function(event) {
        return event.type === 'LESSON_COMPLETED' && event.lessonId === lessonId;
      });
      if (exists) return;
      const migrated = normalizeLearningEvent({
        id: 'lesson_completed:' + lessonId + ':' + Number(record.completedAt),
        type: 'LESSON_COMPLETED',
        timestamp: Number(record.completedAt),
        lessonId: lessonId,
        metadata: {
          correctAnswers: Math.max(0, Number(record.correctAnswers) || 0),
          totalQuestions: Math.max(0, Number(record.totalQuestions) || 0),
          duration: Math.max(0, Number(record.duration) || 0),
          attempts: Math.max(0, Number(record.attempts) || 0),
        },
      });
      if (migrated) data.activity.history.push(migrated);
    });
    data.activity.history = normalizeLearningHistory(data.activity.history);
    if (!isPlainObject(data.rewards)) data.rewards = {};
    data.user.xp = Math.max(0, Number(data.user.xp) || 0);
    data.user.level = Math.max(1, Number(data.user.level) || 1);
    data.version = VERSION;
    return data;
  }

  function migrateLegacyKeys(data) {
    if (data) return data;
    const migrated = clone(DEFAULTS);
    let found = false;
    const keysToRemove = [];

    try {
      const oldUser = JSON.parse(localStorage.getItem('math_logic_user') || 'null');
      if (oldUser) {
        migrated.user = deepMerge(migrated.user, oldUser);
        found = true;
        keysToRemove.push('math_logic_user');
      }
    } catch (error) { diagnostic('legacy-user', error); }

    try {
      const oldSubtopics = JSON.parse(localStorage.getItem('math_logic_subtopics') || 'null');
      if (isPlainObject(oldSubtopics)) {
        migrated.progress.subtopics = oldSubtopics;
        found = true;
        keysToRemove.push('math_logic_subtopics');
      }
    } catch (error) { diagnostic('legacy-subtopics', error); }

    try {
      const oldLang = localStorage.getItem('math_logic_lang');
      if (oldLang) {
        migrated.settings.lang = oldLang;
        found = true;
        keysToRemove.push('math_logic_lang');
      }
    } catch (error) { diagnostic('legacy-language', error); }

    /* Старые profile_* данные существовали до единого storage key. */
    try {
      const profile = {};
      if (typeof localStorage.length === 'number' && typeof localStorage.key === 'function') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key || key.indexOf('profile_') !== 0) continue;
          const raw = localStorage.getItem(key);
          let value = raw;
          try { value = JSON.parse(raw); } catch (error) { /* plain legacy value */ }
          const profileKey = key.indexOf('profile_stat_') === 0
            ? key.replace('profile_stat_', '')
            : key.replace('profile_', '');
          profile[profileKey] = value;
          keysToRemove.push(key);
        }
      }
      Object.keys(profile).forEach(function(key) {
        if (key.indexOf('settings_') === 0) {
          const setting = key.replace('settings_', '');
          migrated.settings[setting] = profile[key];
          found = true;
        }
      });
      Object.keys(DEFAULT_STATS).forEach(function(key) {
        if (profile[key] !== undefined) {
          migrated.stats[key] = Number(profile[key]) || 0;
          found = true;
        }
      });
      if (Array.isArray(profile.achievements)) { migrated.achievements = profile.achievements; found = true; }
      if (Array.isArray(profile.timeline)) { migrated.timeline = profile.timeline; found = true; }
      if (profile.goals) { migrated.goals = profile.goals; found = true; }
      if (isPlainObject(profile.analytics)) { migrated.analytics = profile.analytics; found = true; }
      if (isPlainObject(profile.streak_data)) {
        const streak = profile.streak_data;
        migrated.user.streak = Number(streak.current) || migrated.user.streak;
        migrated.user.streakBest = Number(streak.best) || migrated.user.streakBest;
        migrated.user.streakTotal = Number(streak.total) || migrated.user.streakTotal;
        if (Array.isArray(streak.days)) migrated.activity.dates = streak.days.map(normalizeDateKey).filter(Boolean);
        found = true;
      }
    } catch (error) { diagnostic('legacy-profile', error); }

    if (found) {
      _pendingLegacyCleanup = _pendingLegacyCleanup.concat(keysToRemove, ['ml_dash_state']);
    }

    return found ? migrated : null;
  }

  function migrateToV2(data) {
    data = isPlainObject(data) ? data : {};
    /* Старые Dashboard-квесты больше не являются частью продуктовой схемы. */
    delete data.dashboard;
    delete data.dailyQuests;
    _pendingLegacyCleanup.push('ml_dash_state');
    data.progress = isPlainObject(data.progress) ? data.progress : {};
    data.progress.lessons = isPlainObject(data.progress.lessons) ? data.progress.lessons : {};

    const oldStates = isPlainObject(data.progress.lessonStates) ? data.progress.lessonStates : {};
    Object.keys(oldStates).forEach(function(id) {
      const existing = isPlainObject(data.progress.lessons[id]) ? data.progress.lessons[id] : {};
      if (oldStates[id] === 'completed') existing.status = 'completed';
      else if (!existing.status && oldStates[id] === 'available') existing.status = 'available';
      data.progress.lessons[id] = existing;
    });
    delete data.progress.lessonStates;

    data.lesson = isPlainObject(data.lesson) ? data.lesson : {};
    data.lesson.sessions = isPlainObject(data.lesson.sessions) ? data.lesson.sessions : {};
    if (isPlainObject(data.lesson.v2)) {
      Object.keys(data.lesson.v2).forEach(function(id) {
        if (!data.lesson.sessions[id] && data.lesson.v2[id]) {
          data.lesson.sessions[id] = data.lesson.v2[id];
        }
      });
      delete data.lesson.v2;
    }

    data.activity = isPlainObject(data.activity) ? data.activity : { dates: [], studySecondsByDate: {}, history: [] };
    if (!Array.isArray(data.activity.dates)) data.activity.dates = [];
    if (!isPlainObject(data.activity.studySecondsByDate)) data.activity.studySecondsByDate = {};
    if (!Array.isArray(data.activity.history)) data.activity.history = [];
    if (isPlainObject(data.streak_data)) {
      const streak = data.streak_data;
      data.user = isPlainObject(data.user) ? data.user : {};
      data.user.streak = Number(streak.current) || data.user.streak || 0;
      data.user.streakBest = Number(streak.best) || data.user.streakBest || 0;
      data.user.streakTotal = Number(streak.total) || data.user.streakTotal || 0;
      if (Array.isArray(streak.days)) {
        streak.days.forEach(function(date) {
          const key = normalizeDateKey(date);
          if (key && data.activity.dates.indexOf(key) === -1) data.activity.dates.push(key);
        });
      }
    }
    delete data.streak_data;
    try {
      const legacyDates = JSON.parse(localStorage.getItem('ml_streak_dates') || '[]');
      if (Array.isArray(legacyDates)) {
        legacyDates.forEach(function(date) {
          const key = normalizeDateKey(date);
          if (key && data.activity.dates.indexOf(key) === -1) data.activity.dates.push(key);
        });
      }
      _pendingLegacyCleanup.push('ml_streak_dates');
    } catch (error) { diagnostic('legacy-streak', error); }

    data.version = VERSION;
    return data;
  }

  function normalize(data) {
    /* Миграция идемпотентна и также очищает legacy-поля в частично
       обновлённых записях, ошибочно уже помеченных как version 2. */
    data = migrateToV2(data);
    data = deepMerge(DEFAULTS, data || {});
    return ensureTypes(data);
  }

  function mutableData() {
    if (_cache) return _cache;
    let data = loadRaw();
    const loadedVersion = data && Number(data.version);
    const hasLegacyShape = !!(data && (
      data.dashboard !== undefined || data.dailyQuests !== undefined ||
      (data.progress && data.progress.lessonStates !== undefined) ||
      (data.lesson && data.lesson.v2 !== undefined) || data.streak_data !== undefined
    ));
    let shouldPersist = !data || loadedVersion !== VERSION || hasLegacyShape;
    if (!data) {
      data = migrateLegacyKeys(data);
      shouldPersist = true;
    }
    const isNew = !data;
    data = normalize(data || clone(DEFAULTS));
    if (!data.user.id) data.user.id = 'user_' + Date.now();
    if (!data.user.createdAt) data.user.createdAt = Date.now();
    if (isNew && !data.user.lastVisit) data.user.lastVisit = Date.now();
    _cache = data;
    /* A valid current record is already durable. Avoid rewriting the entire
       localStorage payload during every page's synchronous bootstrap. */
    if (shouldPersist) persist(data);
    return _cache;
  }

  function getData() {
    return clone(mutableData());
  }

  function saveData(data) {
    _cache = normalize(clone(data));
    persist(_cache);
    return clone(_cache);
  }

  function update(mutator) {
    const next = clone(mutableData());
    let result;
    try {
      result = mutator(next);
    } catch (error) {
      diagnostic('update-failed', error);
      throw error;
    }
    _cache = normalize(next);
    persist(_cache);
    return result;
  }

  function resetCache() { _cache = null; }

  function get(path, defaultVal) {
    const parts = path.split('.');
    let current = mutableData();
    for (let i = 0; i < parts.length; i++) {
      if (!isPlainObject(current) && !Array.isArray(current)) return clone(defaultVal);
      current = current[parts[i]];
      if (current === undefined || current === null) return clone(defaultVal);
    }
    return clone(current);
  }

  function set(path, value) {
    update(function(data) {
      const parts = path.split('.');
      let current = data;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!isPlainObject(current[parts[i]])) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = clone(value);
    });
  }

  function getUser() { return get('user', null); }

  function setUser(userData) {
    update(function(data) {
      data.user = deepMerge(data.user || {}, userData || {});
      if (!data.user.id) data.user.id = 'user_' + Date.now();
      if (!data.user.createdAt) data.user.createdAt = Date.now();
    });
  }

  function clearUser() { set('user.loggedIn', false); }
  function isLoggedIn() { return get('user.loggedIn', false) === true; }
  function getLang() { return normalizeLang(get('settings.lang', 'kk')); }
  function setLang(lang) { set('settings.lang', normalizeLang(lang)); }
  function getSubtopics() { return get('progress.subtopics', {}); }
  function setSubtopics(value) { set('progress.subtopics', isPlainObject(value) ? value : {}); }
  function getProfile(path, fallback) { return get(path, fallback); }
  function setProfile(path, value) { set(path, value); }
  function getProfileStat(key, fallback) { return get('stats.' + key, fallback); }
  function getSetting(key, fallback) { return get('settings.' + key, fallback); }
  function setSetting(key, value) { set('settings.' + key, key === 'lang' ? normalizeLang(value) : value); }

  function getCompletedLessons() {
    const lessons = get('progress.lessons', {});
    const completed = {};
    Object.keys(lessons).forEach(function(id) {
      if (lessons[id] && lessons[id].status === 'completed') completed[id] = lessons[id];
    });
    return completed;
  }

  function completeLesson(lessonId, result) {
    let response = null;
    update(function(data) {
      const previous = data.progress.lessons[lessonId];
      if (previous && previous.status === 'completed') {
        response = { firstCompletion: false, record: clone(previous) };
        return;
      }
      const now = Date.now();
      const record = deepMerge(previous || {}, result || {});
      record.lessonId = lessonId;
      record.status = 'completed';
      record.completedAt = Number(record.completedAt) || now;
      data.progress.lessons[lessonId] = record;
      response = { firstCompletion: true, record: clone(record) };
    });
    return response;
  }

  function getLessonSession(lessonId) {
    const sessions = get('lesson.sessions', {});
    return clone(sessions[lessonId] || null);
  }

  function setLessonSession(lessonId, session) {
    update(function(data) {
      if (session === null || session === undefined) delete data.lesson.sessions[lessonId];
      else data.lesson.sessions[lessonId] = clone(session);
    });
  }

  function markSubtopicsDone(subtopics) {
    update(function(data) {
      (subtopics || []).forEach(function(name) { data.progress.subtopics[name] = true; });
    });
  }

  function normalizeDateKey(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return localDateKey(date);
  }

  function localDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  const LEARNING_EVENT_TYPES = [
    'LESSON_STARTED',
    'LESSON_CONTINUED',
    'LESSON_COMPLETED',
  ];
  const LEARNING_HISTORY_LIMIT = 200;

  function normalizeLearningEvent(event) {
    if (!isPlainObject(event)) return null;
    const type = String(event.type || '').toUpperCase();
    const lessonId = String(event.lessonId || '').trim();
    const timestamp = Number(event.timestamp);
    if (LEARNING_EVENT_TYPES.indexOf(type) === -1 || !lessonId || !isFinite(timestamp) || timestamp <= 0) return null;
    const normalized = {
      id: String(event.id || (type.toLowerCase() + ':' + lessonId + ':' + timestamp)),
      type: type,
      timestamp: timestamp,
      lessonId: lessonId,
      metadata: isPlainObject(event.metadata) ? clone(event.metadata) : {},
    };
    if (event.subjectId) normalized.subjectId = String(event.subjectId);
    if (event.topicId) normalized.topicId = String(event.topicId);
    return normalized;
  }

  function normalizeLearningHistory(history) {
    const seen = {};
    return (Array.isArray(history) ? history : []).map(normalizeLearningEvent).filter(function(event) {
      if (!event || seen[event.id]) return false;
      seen[event.id] = true;
      return true;
    }).sort(function(a, b) {
      return b.timestamp - a.timestamp;
    }).slice(0, LEARNING_HISTORY_LIMIT);
  }

  function addLearningEvent(event, options) {
    const normalized = normalizeLearningEvent(Object.assign({}, event, {
      timestamp: event && event.timestamp ? event.timestamp : Date.now(),
    }));
    if (!normalized) return { added: false, event: null };
    options = isPlainObject(options) ? options : {};
    const dedupeWindowMs = Math.max(0, Number(options.dedupeWindowMs) || 30 * 60 * 1000);
    let response = { added: false, event: null };
    update(function(data) {
      const history = data.activity.history;
      const duplicate = history.find(function(saved) {
        if (saved.type !== normalized.type || saved.lessonId !== normalized.lessonId) return false;
        if (normalized.type === 'LESSON_COMPLETED') return true;
        return Math.abs(saved.timestamp - normalized.timestamp) <= dedupeWindowMs;
      });
      if (duplicate) {
        duplicate.subjectId = normalized.subjectId || duplicate.subjectId;
        duplicate.topicId = normalized.topicId || duplicate.topicId;
        duplicate.metadata = deepMerge(duplicate.metadata || {}, normalized.metadata || {});
        response = { added: false, event: clone(duplicate) };
        return;
      }
      history.push(normalized);
      data.activity.history = normalizeLearningHistory(history);
      response = { added: true, event: clone(normalized) };
    });
    return response;
  }

  function getLearningHistory(options) {
    options = isPlainObject(options) ? options : {};
    let history = normalizeLearningHistory(get('activity.history', []));
    if (options.lessonId) history = history.filter(function(event) { return event.lessonId === options.lessonId; });
    if (Array.isArray(options.types) && options.types.length) {
      history = history.filter(function(event) { return options.types.indexOf(event.type) !== -1; });
    }
    if (Number(options.since)) history = history.filter(function(event) { return event.timestamp >= Number(options.since); });
    if (Number(options.until)) history = history.filter(function(event) { return event.timestamp <= Number(options.until); });
    const limit = Math.max(0, Math.min(LEARNING_HISTORY_LIMIT, Number(options.limit) || LEARNING_HISTORY_LIMIT));
    return clone(history.slice(0, limit));
  }

  function localDateFromKey(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
    if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
    return date;
  }

  function getActivityIntensity(seconds, active) {
    const duration = Math.max(0, Number(seconds) || 0);
    if (!active && duration === 0) return 0;
    if (duration < 5 * 60) return 1;
    if (duration < 15 * 60) return 2;
    if (duration < 30 * 60) return 3;
    return 4;
  }

  function getActivityByDate(value) {
    const key = normalizeDateKey(value || new Date());
    if (!key) return null;
    const activity = get('activity', DEFAULTS.activity) || DEFAULTS.activity;
    const active = activity.dates.indexOf(key) !== -1;
    const seconds = Math.max(0, Number(activity.studySecondsByDate[key]) || 0);
    return {
      date: key,
      active: active || seconds > 0,
      seconds: seconds,
      intensity: getActivityIntensity(seconds, active),
    };
  }

  function getActivityRange(start, end) {
    const finish = end === undefined ? localDateFromKey(localDateKey(new Date())) : localDateFromKey(normalizeDateKey(end));
    let begin = start === undefined ? null : localDateFromKey(normalizeDateKey(start));
    if (!finish) return [];
    if (!begin) {
      begin = new Date(finish.getFullYear(), finish.getMonth(), finish.getDate() - 364, 12);
    }
    if (begin > finish) return [];

    const activity = get('activity', DEFAULTS.activity) || DEFAULTS.activity;
    const activeDates = {};
    activity.dates.forEach(function(key) { activeDates[key] = true; });
    const result = [];
    const cursor = new Date(begin.getFullYear(), begin.getMonth(), begin.getDate(), 12);
    while (cursor <= finish) {
      const key = localDateKey(cursor);
      const seconds = Math.max(0, Number(activity.studySecondsByDate[key]) || 0);
      const active = Boolean(activeDates[key]) || seconds > 0;
      result.push({
        date: key,
        active: active,
        seconds: seconds,
        intensity: getActivityIntensity(seconds, active),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }

  function getCurrentStreak(referenceDate) {
    let reference;
    if (typeof referenceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(referenceDate)) {
      reference = localDateFromKey(referenceDate);
    } else {
      reference = referenceDate === undefined ? new Date() : new Date(referenceDate);
    }
    if (!reference || isNaN(reference.getTime())) return 0;

    const activity = get('activity', DEFAULTS.activity) || DEFAULTS.activity;
    const activeDates = {};
    (Array.isArray(activity.dates) ? activity.dates : []).forEach(function(value) {
      const date = localDateFromKey(normalizeDateKey(value));
      if (date) activeDates[localDateKey(date)] = true;
    });

    const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), 12);
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12);
    let cursor;
    if (activeDates[localDateKey(today)]) cursor = today;
    else if (activeDates[localDateKey(yesterday)]) cursor = yesterday;
    else return 0;

    let streak = 0;
    while (activeDates[localDateKey(cursor)]) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function recordLearningActivity(seconds, timestamp) {
    update(function(data) {
      const date = new Date(timestamp || Date.now());
      if (isNaN(date.getTime())) return;
      const key = localDateKey(date);
      if (data.activity.dates.indexOf(key) === -1) data.activity.dates.push(key);
      if (seconds > 0) {
        data.activity.studySecondsByDate[key] = (data.activity.studySecondsByDate[key] || 0) + Math.floor(seconds);
      }
    });
  }

  function updateLastVisit() {
    set('user.lastVisit', Date.now());
  }

  function addTimelineEntry(entry) {
    update(function(data) {
      data.timeline.unshift({
        icon: entry.icon || '•',
        title: entry.title || '',
        desc: entry.desc || '',
        time: entry.time || Date.now(),
        color: entry.color || 'bg-blue-500',
      });
      if (data.timeline.length > 50) data.timeline = data.timeline.slice(0, 50);
    });
  }

  function migrateLessonIds(mapping) {
    if (!isPlainObject(mapping)) return;
    update(function(data) {
      Object.keys(mapping).forEach(function(legacyId) {
        const canonicalId = mapping[legacyId];
        if (!canonicalId || canonicalId === legacyId) return;

        const oldRecord = data.progress.lessons[legacyId];
        const current = data.progress.lessons[canonicalId];
        if (oldRecord) {
          if (!current || (oldRecord.completedAt || 0) > (current.completedAt || 0)) {
            const migrated = deepMerge(current || {}, oldRecord);
            migrated.lessonId = canonicalId;
            data.progress.lessons[canonicalId] = migrated;
          }
          delete data.progress.lessons[legacyId];
        }

        const oldSession = data.lesson.sessions[legacyId];
        if (oldSession && !data.lesson.sessions[canonicalId]) {
          data.lesson.sessions[canonicalId] = oldSession;
        }
        delete data.lesson.sessions[legacyId];

        data.activity.history.forEach(function(event) {
          if (event.lessonId === legacyId) event.lessonId = canonicalId;
        });
      });
    });
  }

  function resetLearning() {
    update(function(data) {
      data.progress = clone(DEFAULTS.progress);
      data.lesson = clone(DEFAULTS.lesson);
      data.stats = clone(DEFAULT_STATS);
      data.activity = clone(DEFAULTS.activity);
      data.achievements = [];
      data.timeline = [];
      data.goals = null;
      data.analytics = {};
      data.rewards = {};
      data.user.xp = 0;
      data.user.level = 1;
      data.user.xpToNext = 100;
      data.user.streak = 0;
      data.user.streakBest = 0;
      data.user.streakTotal = 0;
      data.user.lastLesson = '';
    });
  }

  function resetAll() {
    try {
      const legacyKeys = ['math_logic_user', 'math_logic_subtopics', 'math_logic_lang', 'ml_dash_state', 'ml_streak_dates'];
      if (typeof localStorage.length === 'number' && typeof localStorage.key === 'function') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.indexOf('profile_') === 0) legacyKeys.push(key);
        }
      }
      legacyKeys.forEach(function(key) { localStorage.removeItem(key); });
      localStorage.removeItem(STORAGE_KEY);
    }
    catch (error) { diagnostic('reset-failed', error); }
    _cache = null;
    _pendingLegacyCleanup = [];
  }

  function exportAll() { return getData(); }

  function calcOverallProgress() {
    if (typeof Learning !== 'undefined' && Learning.getOverallProgress) {
      return Learning.getOverallProgress();
    }
    return 0;
  }

  function applySettings() {
    const settings = get('settings', DEFAULT_SETTINGS);
    const body = document.body;
    if (!body) return;
    const dark = settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    body.classList.toggle('dark', dark);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.lang = normalizeLang(settings.lang);
    document.documentElement.style.setProperty('--primary', settings.accent || '#4F46E5');
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.fontSize = sizes[settings.font_size] || '16px';
  }

  return {
    VERSION: VERSION,
    getData: getData,
    saveData: saveData,
    update: update,
    resetCache: resetCache,
    get: get,
    set: set,
    getUser: getUser,
    setUser: setUser,
    clearUser: clearUser,
    isLoggedIn: isLoggedIn,
    normalizeLang: normalizeLang,
    getLang: getLang,
    setLang: setLang,
    getSubtopics: getSubtopics,
    setSubtopics: setSubtopics,
    getProfile: getProfile,
    setProfile: setProfile,
    getSetting: getSetting,
    setSetting: setSetting,
    getProfileStat: getProfileStat,
    completeLesson: completeLesson,
    getCompletedLessons: getCompletedLessons,
    getLessonSession: getLessonSession,
    setLessonSession: setLessonSession,
    markSubtopicsDone: markSubtopicsDone,
    recordLearningActivity: recordLearningActivity,
    getActivityByDate: getActivityByDate,
    getActivityRange: getActivityRange,
    getActivityIntensity: getActivityIntensity,
    getCurrentStreak: getCurrentStreak,
    addLearningEvent: addLearningEvent,
    getLearningHistory: getLearningHistory,
    updateLastVisit: updateLastVisit,
    addTimelineEntry: addTimelineEntry,
    migrateLessonIds: migrateLessonIds,
    calcOverallProgress: calcOverallProgress,
    applySettings: applySettings,
    resetLearning: resetLearning,
    resetAll: resetAll,
    exportAll: exportAll,
    getDiagnostics: function() { return clone(_diagnostics); },
  };
})();
