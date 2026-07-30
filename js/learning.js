/* ============================================
   LEARNING ENGINE — math·logic
   ============================================
   Центральная система управления обучением.
   Всё — Subjects, Topics, Lessons, Progress —
   рассчитывается только здесь.
   Dashboard и Profile только отображают данные.
   ============================================ */

window.Learning = (function() {

  /* ==========================================
     КОНСТАНТЫ
     ========================================== */

  var LS_KEY = 'progress.lessonStates';
  var LESSON_XP_BASE = 50;

  /* ==========================================
     ВНУТРЕННЕЕ: ПОСТРОЕНИЕ КУРСА
     ==========================================
     Строим Subject → Topic (section) → Lesson (module)
     из DATA + SUBJECTS.
     ========================================== */

  function buildCourse() {
    var subjects = [];
    try {
      if (typeof DATA === 'undefined' || typeof SUBJECTS === 'undefined') return subjects;

      var subjectMap = {};
      SUBJECTS.forEach(function(s) { subjectMap[s.key] = s; });

      Object.keys(DATA).forEach(function(subjectKey) {
        var meta = subjectMap[subjectKey];
        if (!meta) return;

        var dataSections = DATA[subjectKey];
        if (!dataSections || !Array.isArray(dataSections)) return;

        var topics = [];
        var allLessons = [];
        var globalOrder = 0;

        dataSections.forEach(function(section, si) {
          var topicLessons = [];

          (section.modules || []).forEach(function(mod, mi) {
            globalOrder++;
            var lessonId = subjectKey + '_' + globalOrder;

            var lesson = {
              id: lessonId,
              order: globalOrder,
              sectionIndex: si,
              sectionTitle: section.title,
              sectionLevel: section.level || '',
              name: mod.name,
              link: mod.link || null,
              subtopics: mod.subtopics || [],
              subjectKey: subjectKey,
            };

            topicLessons.push(lesson);
            allLessons.push(lesson);
          });

          topics.push({
            title: section.title,
            level: section.level || '',
            order: si,
            lessons: topicLessons,
            totalLessons: topicLessons.length,
          });
        });

        subjects.push({
          key: subjectKey,
          name: meta.name,
          icon: meta.icon || '',
          mainColor: meta.mainColor || '#4F46E5',
          bgActive: meta.bgActive || '#EEF2FF',
          topics: topics,
          lessons: allLessons,
          totalLessons: allLessons.length,
          firstLessonId: allLessons.length > 0 ? allLessons[0].id : null,
        });
      });
    } catch(e) {
      console.error('[Learning] buildCourse error:', e);
    }
    return subjects;
  }

  var _course = null;

  function getCourse() {
    if (_course) return _course;
    _course = buildCourse();
    return _course;
  }

  function resetCache() {
    _course = null;
  }

  /* ==========================================
     ВНУТРЕННЕЕ: СОСТОЯНИЯ УРОКОВ
     ========================================== */

  function getLessonStates() {
    var states = ML.get(LS_KEY, {});
    if (typeof states !== 'object' || Array.isArray(states)) return {};
    return states;
  }

  function setLessonStates(states) {
    ML.set(LS_KEY, states);
  }

  function getLessonState(lessonId) {
    var states = getLessonStates();
    return states[lessonId] || 'locked';
  }

  function setLessonState(lessonId, state) {
    var states = getLessonStates();
    states[lessonId] = state;
    setLessonStates(states);
  }

  /* ==========================================
     ВНУТРЕННЕЕ: ПОИСК
     ========================================== */

  function findSubject(subjectKey) {
    var course = getCourse();
    for (var i = 0; i < course.length; i++) {
      if (course[i].key === subjectKey) return course[i];
    }
    return null;
  }

  function findLesson(lessonId) {
    var course = getCourse();
    for (var si = 0; si < course.length; si++) {
      var subj = course[si];
      for (var li = 0; li < subj.lessons.length; li++) {
        if (subj.lessons[li].id === lessonId) {
          return { lesson: subj.lessons[li], subject: subj };
        }
      }
    }
    return null;
  }

  function findNextLessonId(currentId) {
    var course = getCourse();
    for (var si = 0; si < course.length; si++) {
      var subj = course[si];
      for (var li = 0; li < subj.lessons.length; li++) {
        if (subj.lessons[li].id === currentId) {
          return li + 1 < subj.lessons.length ? subj.lessons[li + 1].id : null;
        }
      }
    }
    return null;
  }

  /* ==========================================
     ВНУТРЕННЕЕ: ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЙ
     ========================================== */

  function initStates() {
    var course = getCourse();
    if (!course || course.length === 0) return;
    var states = getLessonStates();
    var changed = false;
    var completedLessons = ML.getCompletedLessons();

    course.forEach(function(subj) {
      subj.lessons.forEach(function(lesson) {
        var existing = states[lesson.id];

        if (existing === 'completed') return;

        if (completedLessons[lesson.id] || (lesson.link && completedLessons[lesson.link])) {
          states[lesson.id] = 'completed';
          changed = true;
          return;
        }

        if (!existing) {
          states[lesson.id] = lesson.order === 1 ? 'available' : 'locked';
          changed = true;
        }
      });
    });

    if (changed) {
      setLessonStates(states);
    }
  }

  function syncStates() {
    var course = getCourse();
    if (!course || course.length === 0) return;
    var states = getLessonStates();
    var completed = ML.getCompletedLessons();
    var changed = false;

    course.forEach(function(subj) {
      subj.lessons.forEach(function(lesson) {
        if (completed[lesson.id] || (lesson.link && completed[lesson.link])) {
          if (states[lesson.id] !== 'completed') {
            states[lesson.id] = 'completed';
            changed = true;
          }
        }
      });
    });

    if (changed) {
      setLessonStates(states);
    }
  }

  /* ==========================================
     ВНУТРЕННЕЕ: СОБЫТИЯ
     ========================================== */

  function emit(eventName, detail) {
    try {
      if (typeof EVENTS !== 'undefined' && EVENTS.emit) {
        EVENTS.emit(eventName, detail || {});
      }
    } catch(e) { /* silent */ }
  }

  /* ==========================================
     ВНУТРЕННЕЕ: ПРОВЕРКИ ЗАВЕРШЕНИЯ
     ========================================== */

  function isSectionCompleted(sectionTitle) {
    if (!sectionTitle) return false;
    var course = getCourse();
    var states = getLessonStates();
    var ids = [];

    course.forEach(function(subj) {
      subj.lessons.forEach(function(lesson) {
        if (lesson.sectionTitle === sectionTitle) {
          ids.push(lesson.id);
        }
      });
    });

    if (ids.length === 0) return false;
    return ids.every(function(id) { return states[id] === 'completed'; });
  }

  function isSubjectCompleted(subjectKey) {
    if (!subjectKey) return false;
    var subj = findSubject(subjectKey);
    if (!subj || subj.lessons.length === 0) return false;
    var states = getLessonStates();
    return subj.lessons.every(function(lesson) { return states[lesson.id] === 'completed'; });
  }

  /* ==========================================
     ПУБЛИЧНЫЙ API
     ========================================== */

  /* ---------- SUBJECTS ---------- */

  function getSubjects() {
    var course = getCourse();
    var states = getLessonStates();

    return course.map(function(subj) {
      var completed = 0;
      subj.lessons.forEach(function(lesson) {
        if (states[lesson.id] === 'completed') completed++;
      });

      return {
        key: subj.key,
        name: subj.name,
        icon: subj.icon,
        mainColor: subj.mainColor,
        bgActive: subj.bgActive,
        totalLessons: subj.totalLessons,
        completedLessons: completed,
        progress: subj.totalLessons > 0
          ? Math.round((completed / subj.totalLessons) * 100)
          : 0,
      };
    });
  }

  function getSubject(subjectKey) {
    var subj = findSubject(subjectKey);
    if (!subj) return null;

    var states = getLessonStates();
    var completed = 0;
    subj.lessons.forEach(function(lesson) {
      if (states[lesson.id] === 'completed') completed++;
    });

    return {
      key: subj.key,
      name: subj.name,
      icon: subj.icon,
      mainColor: subj.mainColor,
      bgActive: subj.bgActive,
      topics: subj.topics.map(function(topic) {
        var topicCompleted = 0;
        topic.lessons.forEach(function(lesson) {
          if (states[lesson.id] === 'completed') topicCompleted++;
        });
        return {
          title: topic.title,
          level: topic.level,
          order: topic.order,
          totalLessons: topic.totalLessons,
          completedLessons: topicCompleted,
          progress: topic.totalLessons > 0
            ? Math.round((topicCompleted / topic.totalLessons) * 100)
            : 0,
        };
      }),
      totalLessons: subj.totalLessons,
      completedLessons: completed,
      progress: subj.totalLessons > 0
        ? Math.round((completed / subj.totalLessons) * 100)
        : 0,
      firstLessonId: subj.firstLessonId,
    };
  }

  /* ---------- TOPICS ---------- */

  function getTopics(subjectKey) {
    var subj = findSubject(subjectKey);
    if (!subj) return [];

    var states = getLessonStates();

    return subj.topics.map(function(topic) {
      var lessonList = topic.lessons.map(function(lesson) {
        return {
          id: lesson.id,
          name: lesson.name,
          state: states[lesson.id] || 'locked',
          link: lesson.link,
          order: lesson.order,
          subtopics: lesson.subtopics,
        };
      });

      var completed = lessonList.filter(function(l) { return l.state === 'completed'; }).length;

      return {
        title: topic.title,
        level: topic.level,
        order: topic.order,
        progress: topic.totalLessons > 0
          ? Math.round((completed / topic.totalLessons) * 100)
          : 0,
        totalLessons: topic.totalLessons,
        completedLessons: completed,
        lessons: lessonList,
      };
    });
  }

  function getTopic(subjectKey, topicTitle) {
    var topics = getTopics(subjectKey);
    for (var i = 0; i < topics.length; i++) {
      if (topics[i].title === topicTitle) return topics[i];
    }
    return null;
  }

  /* ---------- LESSONS ---------- */

  function getLessons(subjectKey) {
    var subj = findSubject(subjectKey);
    if (!subj) return [];

    var states = getLessonStates();

    return subj.lessons.map(function(lesson) {
      return {
        id: lesson.id,
        name: lesson.name,
        order: lesson.order,
        sectionTitle: lesson.sectionTitle,
        sectionLevel: lesson.sectionLevel,
        state: states[lesson.id] || 'locked',
        link: lesson.link,
        subtopics: lesson.subtopics,
      };
    });
  }

  function getLesson(lessonId) {
    var found = findLesson(lessonId);
    if (!found) return null;

    var lesson = found.lesson;
    var states = getLessonStates();

    return {
      id: lesson.id,
      name: lesson.name,
      order: lesson.order,
      sectionTitle: lesson.sectionTitle,
      sectionLevel: lesson.sectionLevel,
      state: states[lesson.id] || 'locked',
      link: lesson.link,
      subtopics: lesson.subtopics,
      subjectKey: lesson.subjectKey,
    };
  }

  /* ---------- STATUS ---------- */

  function isUnlocked(lessonId) {
    var state = getLessonState(lessonId);
    return state === 'available' || state === 'completed';
  }

  function unlock(lessonId) {
    var current = getLessonState(lessonId);
    if (current === 'locked') {
      setLessonState(lessonId, 'available');
      return true;
    }
    return false;
  }

  /* ---------- COMPLETION ---------- */

  function completeLesson(lessonId, result) {
    result = result || {};
    var found = findLesson(lessonId);
    if (!found) {
      console.warn('[Learning] Unknown lesson:', lessonId);
      return null;
    }

    var lesson = found.lesson;
    var lessonName = lesson.name;

    if (getLessonState(lessonId) === 'completed') {
      return {
        lessonId: lessonId,
        xpEarned: 0,
        score: 0,
        grade: '',
        alreadyCompleted: true,
      };
    }

    var score = result.score || 0;
    var correct = result.correct || 0;
    var total = result.total || 0;
    var xpToAward = result.xpEarned > 0 ? result.xpEarned : (LESSON_XP_BASE + correct * 10);
    var grade = result.grade || '';
    if (!grade) {
      grade = score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
    }

    var storageKey = lesson.link ? lesson.link : lessonId;

    setLessonState(lessonId, 'completed');

    ML.completeLesson(storageKey, {
      score: score,
      correct: correct,
      total: total,
      attempts: result.attempts || 0,
      time: result.time || 0,
      xpEarned: xpToAward,
      grade: grade,
    });

    if (lesson.subtopics && lesson.subtopics.length > 0) {
      ML.markSubtopicsDone(lesson.subtopics);
    }

    ML.addTimelineEntry({
      icon: '📘',
      title: 'Завершил урок "' + lessonName + '"',
      desc: 'Результат: ' + score + '% | +' + xpToAward + ' XP',
      color: 'bg-blue-500',
    });

    /* ----- Начисляем XP ----- */
    if (typeof XP !== 'undefined' && XP.addXP) {
      XP.addXP(xpToAward, 'lesson:' + lessonId);
    }

    /* ----- Открываем следующий урок ----- */
    var nextId = findNextLessonId(lessonId);
    if (nextId) {
      unlock(nextId);
    }

    /* ----- События (без прямого вызова XP) ----- */
    var eventDetail = {
      lessonId: lessonId,
      lessonName: lessonName,
      score: score,
      xpEarned: xpToAward,
      correct: correct,
      total: total,
      grade: grade,
    };

    emit('lesson:completed', eventDetail);
    emit('progress:update', eventDetail);

    if (lesson.sectionTitle) {
      var sectionDone = isSectionCompleted(lesson.sectionTitle);
      if (sectionDone) {
        emit('topic:completed', {
          topicTitle: lesson.sectionTitle,
          subjectKey: lesson.subjectKey,
        });
      }
    }

    var subjectDone = isSubjectCompleted(lesson.subjectKey);
    if (subjectDone) {
      emit('subject:completed', {
        subjectKey: lesson.subjectKey,
      });
    }

    return {
      lessonId: lessonId,
      xpEarned: xpToAward,
      score: score,
      grade: grade,
    };
  }

  /* ---------- RESET ---------- */

  function resetSubject(subjectKey) {
    var subj = findSubject(subjectKey);
    if (!subj) return;

    var states = getLessonStates();
    var changed = false;

    subj.lessons.forEach(function(lesson, index) {
      if (states[lesson.id] === 'completed') {
        delete states[lesson.id];
        changed = true;
      }
    });

    if (changed) {
      setLessonStates(states);
      resetCache();
      initStates();
      emit('progress:update', { subjectKey: subjectKey });
    }
  }

  function resetAll() {
    var course = getCourse();
    if (!course || course.length === 0) return;

    var states = {};
    setLessonStates(states);

    var d = ML.getData();
    if (d && d.lesson && d.lesson.v2) {
      d.lesson.v2 = {};
      ML.saveData(d);
      console.log('CACHE', JSON.stringify(d.lesson.v2));
      console.log('LS', JSON.stringify(JSON.parse(localStorage.getItem('mathlogic_data')).lesson.v2));
    }

    resetCache();
    initStates();
    emit('progress:update', { reset: true });
  }

  function resetLesson(lessonId) {
    if (!lessonId) return;

    var states = getLessonStates();
    if (states[lessonId]) {
      delete states[lessonId];
      setLessonStates(states);
    }

    var enginePrefix = (window.__EngineInternal && window.__EngineInternal.STORAGE_PREFIX) || 'lesson.v2.';
    try { ML.set(enginePrefix + lessonId, null); } catch(e) {}

    try {
      var d = ML.getData();
      if (d && d.progress && d.progress.lessons && d.progress.lessons[lessonId]) {
        delete d.progress.lessons[lessonId];
        ML.saveData(d);
      }
    } catch(e) {}

    resetCache();
    initStates();
    emit('progress:update', { lessonId: lessonId, reset: true });
  }

  /* ---------- PROGRESS ---------- */

  function getOverallProgress() {
    var subjects = getSubjects();
    var total = 0;
    var done = 0;
    subjects.forEach(function(s) {
      total += s.totalLessons;
      done += s.completedLessons;
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function getSubjectProgress(subjectKey) {
    var subjects = getSubjects();
    for (var i = 0; i < subjects.length; i++) {
      if (subjects[i].key === subjectKey) return subjects[i].progress;
    }
    return 0;
  }

  function getTopicProgress(subjectKey, topicTitle) {
    var topics = getTopics(subjectKey);
    for (var i = 0; i < topics.length; i++) {
      if (topics[i].title === topicTitle) return topics[i].progress;
    }
    return 0;
  }

  /* ---------- NAVIGATION ---------- */

  function getNextLesson() {
    var course = getCourse();
    var states = getLessonStates();

    for (var si = 0; si < course.length; si++) {
      var subj = course[si];
      for (var li = 0; li < subj.lessons.length; li++) {
        var lesson = subj.lessons[li];
        if (states[lesson.id] === 'available') {
          return {
            id: lesson.id,
            name: lesson.name,
            subjectKey: subj.key,
            subjectName: subj.name,
            link: lesson.link,
            sectionTitle: lesson.sectionTitle,
          };
        }
      }
    }
    return null;
  }

  function getNextLessonId(currentLessonId) {
    return findNextLessonId(currentLessonId);
  }

  function unlockNextLesson(currentLessonId) {
    var nextId = findNextLessonId(currentLessonId);
    if (nextId) {
      unlock(nextId);
      return nextId;
    }
    return null;
  }

  function getLastCompletedLesson() {
    var course = getCourse();
    var states = getLessonStates();
    var last = null;
    var lastOrder = 0;

    course.forEach(function(subj) {
      subj.lessons.forEach(function(lesson) {
        if (states[lesson.id] === 'completed' && lesson.order > lastOrder) {
          lastOrder = lesson.order;
          last = {
            id: lesson.id,
            name: lesson.name,
            subjectKey: subj.key,
            subjectName: subj.name,
            link: lesson.link,
            sectionTitle: lesson.sectionTitle,
          };
        }
      });
    });

    return last;
  }

  function getTotalCompletedLessons() {
    var subjects = getSubjects();
    var total = 0;
    subjects.forEach(function(s) { total += s.completedLessons; });
    return total;
  }

  function getTotalLessons() {
    var course = getCourse();
    var total = 0;
    course.forEach(function(s) { total += s.totalLessons; });
    return total;
  }

  /* ==========================================
     ИНИЦИАЛИЗАЦИЯ
     ========================================== */

  function init() {
    getCourse();
    initStates();
    syncStates();
  }

  init();

  window.addEventListener('storage', function(e) {
    if (e.key === 'mathlogic_data') {
      resetCache();
      init();
    }
  });

  /* ==========================================
     ПУБЛИЧНЫЙ ИНТЕРФЕЙС
     ========================================== */

  var api = {
    /* Course */
    getCourse: getCourse,
    resetCache: resetCache,

    /* Subjects */
    getSubjects: getSubjects,
    getSubject: getSubject,

    /* Topics */
    getTopics: getTopics,
    getTopic: getTopic,

    /* Lessons */
    getLessons: getLessons,
    getLesson: getLesson,
    getLessonState: getLessonState,

    /* Status */
    isUnlocked: isUnlocked,
    unlock: unlock,
    unlockLesson: unlock,
    unlockNextLesson: unlockNextLesson,
    getNextLessonId: getNextLessonId,

    /* Completion */
    completeLesson: completeLesson,

    /* Reset */
    resetSubject: resetSubject,
    resetAll: resetAll,
    resetLesson: resetLesson,

    /* Progress */
    getOverallProgress: getOverallProgress,
    getSubjectProgress: getSubjectProgress,
    getTopicProgress: getTopicProgress,
    getTotalCompletedLessons: getTotalCompletedLessons,
    getTotalLessons: getTotalLessons,

    /* Navigation */
    getNextLesson: getNextLesson,
    getLastCompletedLesson: getLastCompletedLesson,

    /* Init */
    init: init,
  };

  return api;

})();

/* ============================================
   ОБРАТНАЯ СОВМЕСТИМОСТЬ
   ============================================
   Все существующие страницы используют COURSE.
   Learning полностью заменяет его.
   ============================================ */

window.COURSE = window.Learning;
