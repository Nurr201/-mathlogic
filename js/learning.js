/* ============================================
   LEARNING ENGINE — math·logic
   Канонический каталог, статусы и completion
   ============================================ */

window.Learning = (function() {
  'use strict';

  let _course = null;

  function registry() {
    return typeof LESSON_REGISTRY !== 'undefined' ? LESSON_REGISTRY : {};
  }

  function legacyMap() {
    return typeof LESSON_LEGACY_MAP !== 'undefined' ? LESSON_LEGACY_MAP : {};
  }

  function stableSlug(value) {
    let hash = 2166136261;
    const text = String(value || 'lesson');
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function resolveLessonId(id) {
    if (!id) return '';
    return legacyMap()[id] || id;
  }

  function getRegistryEntry(id) {
    return registry()[resolveLessonId(id)] || null;
  }

  function buildCourse() {
    const subjects = [];
    if (typeof DATA === 'undefined' || typeof SUBJECTS === 'undefined') return subjects;
    const subjectMap = {};
    SUBJECTS.forEach(function(subject) { subjectMap[subject.key] = subject; });

    Object.keys(DATA).forEach(function(subjectKey) {
      const meta = subjectMap[subjectKey];
      if (!meta || !Array.isArray(DATA[subjectKey])) return;
      const topics = [];
      const allLessons = [];
      let legacyOrder = 0;

      DATA[subjectKey].forEach(function(section, sectionIndex) {
        const topicId = section.id || subjectKey + '.topic.' + stableSlug(section.title);
        const lessons = [];
        (section.modules || []).forEach(function(module, moduleIndex) {
          legacyOrder++;
          const id = module.id || subjectKey + '.catalog.' + stableSlug(section.title + '|' + module.name);
          const reg = registry()[id] || null;
          const lesson = {
            id: id,
            legacyId: subjectKey + '_' + legacyOrder,
            order: legacyOrder,
            moduleIndex: moduleIndex,
            sectionIndex: sectionIndex,
            sectionTitle: section.title,
            sectionTitleRu: section.titleRu || section.title,
            sectionTitleKk: section.titleKk || section.titleKz || section.title,
            sectionLevel: section.level || '',
            sectionLevelRu: section.levelRu || section.level || '',
            sectionLevelKk: section.levelKk || section.levelKz || section.level || '',
            name: module.name,
            title: reg ? reg.title : module.name,
            titleRu: reg ? (reg.titleRu || reg.title) : (module.titleRu || module.name),
            titleKk: reg ? (reg.titleKk || reg.titleKz || reg.title) : (module.titleKk || module.titleKz || module.name),
            titleKz: reg ? reg.titleKz : module.name,
            description: reg ? reg.description : '',
            descriptionRu: reg ? (reg.descriptionRu || reg.description) : (module.descriptionRu || ''),
            descriptionKk: reg ? (reg.descriptionKk || reg.descriptionKz || reg.description) : (module.descriptionKk || module.descriptionKz || ''),
            descriptionKz: reg ? reg.descriptionKz : '',
            route: reg ? reg.route : null,
            link: reg ? reg.route : null,
            duration: reg ? reg.duration : null,
            xp: reg ? reg.xp : null,
            availability: reg ? reg.availability : 'unavailable',
            prerequisites: reg && Array.isArray(reg.prerequisites) ? reg.prerequisites.slice() : [],
            unlockReason: reg ? reg.unlockReason : '',
            unlockReasonRu: reg ? (reg.unlockReasonRu || reg.unlockReason) : '',
            unlockReasonKk: reg ? (reg.unlockReasonKk || reg.unlockReasonKz || reg.unlockReason) : '',
            releaseDate: reg ? reg.releaseDate : null,
            hasContent: !!reg,
            subtopics: module.subtopics || [],
            subjectKey: subjectKey,
            topicId: reg ? reg.topicId : topicId,
          };
          lessons.push(lesson);
          allLessons.push(lesson);
        });
        topics.push({
          id: topicId,
          title: section.title,
          titleRu: section.titleRu || section.title,
          titleKk: section.titleKk || section.titleKz || section.title,
          level: section.level || '',
          levelRu: section.levelRu || section.level || '',
          levelKk: section.levelKk || section.levelKz || section.level || '',
          order: sectionIndex,
          lessons: lessons,
          totalLessons: lessons.length,
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
        firstLessonId: allLessons.length ? allLessons[0].id : null,
      });
    });
    return subjects;
  }

  function getCourse() {
    if (!_course) _course = buildCourse();
    return _course;
  }

  function resetCache() { _course = null; }

  function findSubject(subjectKey) {
    return getCourse().find(function(subject) { return subject.key === subjectKey; }) || null;
  }

  function findLesson(lessonId) {
    const id = resolveLessonId(lessonId);
    const course = getCourse();
    for (let si = 0; si < course.length; si++) {
      const lesson = course[si].lessons.find(function(item) { return item.id === id; });
      if (lesson) return { lesson: lesson, subject: course[si] };
    }
    const reg = registry()[id];
    if (reg) {
      return {
        lesson: {
          id: id,
          name: reg.title,
          title: reg.title,
          titleRu: reg.titleRu || reg.title,
          titleKk: reg.titleKk || reg.titleKz || reg.title,
          titleKz: reg.titleKz,
          description: reg.description,
          descriptionRu: reg.descriptionRu || reg.description,
          descriptionKk: reg.descriptionKk || reg.descriptionKz || reg.description,
          descriptionKz: reg.descriptionKz,
          subjectKey: reg.subjectId,
          topicId: reg.topicId,
          sectionTitle: '',
          subtopics: [],
          route: reg.route,
          link: reg.route,
          duration: reg.duration,
          xp: reg.xp,
          availability: reg.availability,
          prerequisites: Array.isArray(reg.prerequisites) ? reg.prerequisites.slice() : [],
          releaseDate: reg.releaseDate,
          unlockReason: reg.unlockReason,
          unlockReasonRu: reg.unlockReasonRu || reg.unlockReason,
          unlockReasonKk: reg.unlockReasonKk || reg.unlockReasonKz || reg.unlockReason,
          hasContent: true,
          order: reg.order,
        },
        subject: findSubject(reg.subjectId),
      };
    }
    return null;
  }

  function getRecord(lessonId) {
    const lessons = ML.get('progress.lessons', {});
    return lessons[resolveLessonId(lessonId)] || null;
  }

  function getLessonStatus(lessonId) {
    const found = findLesson(lessonId);
    if (!found) return 'locked';
    const lesson = found.lesson;
    const record = getRecord(lesson.id);
    if (record && record.status === 'completed') return 'completed';
    const session = ML.getLessonSession(lesson.id);
    if (session && Array.isArray(session.completedBlocks) && session.completedBlocks.length > 0) return 'current';
    if (lesson.releaseDate) {
      const release = new Date(lesson.releaseDate);
      if (!isNaN(release.getTime()) && release.getTime() > Date.now()) return 'comingSoon';
    }
    const prerequisites = Array.isArray(lesson.prerequisites) ? lesson.prerequisites : [];
    const missingPrerequisite = prerequisites.some(function(id) {
      const prerequisite = getRecord(id);
      return !prerequisite || prerequisite.status !== 'completed';
    });
    if (missingPrerequisite) return 'locked';
    if (!lesson.hasContent || lesson.availability === 'unavailable' || lesson.availability === 'locked') return 'locked';
    return 'available';
  }

  /* Старый API оставляет три состояния. Новый UI использует getLessonStatus(). */
  function getLessonState(lessonId) {
    const status = getLessonStatus(lessonId);
    if (status === 'completed') return 'completed';
    if (status === 'current' || status === 'available') return 'available';
    return 'locked';
  }

  function lessonView(lesson) {
    const status = getLessonStatus(lesson.id);
    const record = getRecord(lesson.id);
    const session = ML.getLessonSession(lesson.id);
    return {
      id: lesson.id,
      name: lesson.name,
      title: lesson.title,
      titleRu: lesson.titleRu || lesson.title,
      titleKk: lesson.titleKk || lesson.titleKz || lesson.title,
      titleKz: lesson.titleKz,
      description: lesson.description,
      descriptionRu: lesson.descriptionRu || lesson.description,
      descriptionKk: lesson.descriptionKk || lesson.descriptionKz || lesson.description,
      descriptionKz: lesson.descriptionKz,
      order: lesson.order,
      sectionTitle: lesson.sectionTitle,
      sectionTitleRu: lesson.sectionTitleRu || lesson.sectionTitle,
      sectionTitleKk: lesson.sectionTitleKk || lesson.sectionTitle,
      sectionLevel: lesson.sectionLevel,
      sectionLevelRu: lesson.sectionLevelRu || lesson.sectionLevel,
      sectionLevelKk: lesson.sectionLevelKk || lesson.sectionLevel,
      subjectKey: lesson.subjectKey,
      topicId: lesson.topicId,
      status: status,
      state: getLessonState(lesson.id),
      route: lesson.route,
      link: lesson.route,
      duration: lesson.duration,
      xp: lesson.xp,
      releaseDate: lesson.releaseDate,
      unlockReason: lesson.unlockReason || (
        status === 'locked' && lesson.prerequisites && lesson.prerequisites.length
          ? 'Сначала завершите предыдущий урок'
          : (!lesson.hasContent ? 'Урок пока не готов' : '')
      ),
      unlockReasonRu: lesson.unlockReasonRu || lesson.unlockReason || '',
      unlockReasonKk: lesson.unlockReasonKk || lesson.unlockReasonKz || lesson.unlockReason || '',
      prerequisites: lesson.prerequisites || [],
      hasContent: lesson.hasContent,
      subtopics: lesson.subtopics,
      result: record,
      session: session,
    };
  }

  function getSubjects() {
    return getCourse().map(function(subject) {
      const completed = subject.lessons.filter(function(lesson) {
        return getLessonStatus(lesson.id) === 'completed';
      }).length;
      return {
        key: subject.key,
        name: subject.name,
        icon: subject.icon,
        mainColor: subject.mainColor,
        bgActive: subject.bgActive,
        totalLessons: subject.totalLessons,
        completedLessons: completed,
        progress: subject.totalLessons ? Math.round(completed / subject.totalLessons * 100) : 0,
      };
    });
  }

  function getSubject(subjectKey) {
    const subject = findSubject(subjectKey);
    if (!subject) return null;
    const summary = getSubjects().find(function(item) { return item.key === subjectKey; });
    return Object.assign({}, summary, {
      topics: subject.topics.map(function(topic) {
        const completed = topic.lessons.filter(function(lesson) {
          return getLessonStatus(lesson.id) === 'completed';
        }).length;
        return {
          id: topic.id,
          title: topic.title,
          titleRu: topic.titleRu || topic.title,
          titleKk: topic.titleKk || topic.title,
          level: topic.level,
          levelRu: topic.levelRu || topic.level,
          levelKk: topic.levelKk || topic.level,
          order: topic.order,
          totalLessons: topic.totalLessons,
          completedLessons: completed,
          progress: topic.totalLessons ? Math.round(completed / topic.totalLessons * 100) : 0,
        };
      }),
      firstLessonId: subject.firstLessonId,
    });
  }

  function getTopics(subjectKey) {
    const subject = findSubject(subjectKey);
    if (!subject) return [];
    return subject.topics.map(function(topic) {
      const lessons = topic.lessons.map(lessonView);
      const completed = lessons.filter(function(lesson) { return lesson.status === 'completed'; }).length;
      return {
        id: topic.id,
        title: topic.title,
        titleRu: topic.titleRu || topic.title,
        titleKk: topic.titleKk || topic.title,
        level: topic.level,
        levelRu: topic.levelRu || topic.level,
        levelKk: topic.levelKk || topic.level,
        order: topic.order,
        totalLessons: topic.totalLessons,
        completedLessons: completed,
        progress: topic.totalLessons ? Math.round(completed / topic.totalLessons * 100) : 0,
        lessons: lessons,
      };
    });
  }

  function getTopic(subjectKey, topicTitleOrId) {
    return getTopics(subjectKey).find(function(topic) {
      return topic.id === topicTitleOrId || topic.title === topicTitleOrId;
    }) || null;
  }

  function getLessons(subjectKey) {
    const subject = findSubject(subjectKey);
    return subject ? subject.lessons.map(lessonView) : [];
  }

  function getLesson(lessonId) {
    const found = findLesson(lessonId);
    return found ? lessonView(found.lesson) : null;
  }

  function isUnlocked(lessonId) {
    const status = getLessonStatus(lessonId);
    return status === 'available' || status === 'current' || status === 'completed';
  }

  function findNextLessonId(currentId) {
    const entries = Object.keys(registry()).map(function(id) { return registry()[id]; })
      .sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
    const canonical = resolveLessonId(currentId);
    const index = entries.findIndex(function(entry) { return entry.id === canonical; });
    return index > -1 && entries[index + 1] ? entries[index + 1].id : null;
  }

  function completeLesson(lessonId, result) {
    const id = resolveLessonId(lessonId);
    const found = findLesson(id);
    if (!found || !found.lesson.hasContent) {
      console.warn('[Learning] Unknown or unavailable lesson:', lessonId);
      return null;
    }
    const previous = getRecord(id);
    if (previous && previous.status === 'completed') {
      return { lessonId: id, xpEarned: 0, score: previous.score || 0, grade: '', alreadyCompleted: true };
    }

    result = result || {};
    const now = Date.now();
    const total = Math.max(0, Math.floor(Number(result.totalQuestions !== undefined ? result.totalQuestions : result.total) || 0));
    const rawCorrect = Math.max(0, Math.floor(Number(result.correctAnswers !== undefined ? result.correctAnswers : result.correct) || 0));
    const correct = total > 0 ? Math.min(total, rawCorrect) : rawCorrect;
    const percentage = Math.max(0, Math.min(100, Number(result.percentage !== undefined ? result.percentage : result.score) || 0));
    const record = {
      lessonId: id,
      status: 'completed',
      score: percentage,
      percentage: percentage,
      correctAnswers: correct,
      totalQuestions: total,
      duration: Math.max(0, Number(result.duration !== undefined ? result.duration : result.time) || 0),
      startedAt: Number(result.startedAt) || now,
      completedAt: Number(result.completedAt) || now,
      attempts: Math.max(0, Number(result.attempts) || 0),
      answers: result.answers || {},
      grade: '',
      xpEarned: 0,
    };

    ML.update(function(data) {
      const current = data.progress.lessons[id];
      if (current && current.status === 'completed') return;
      data.progress.lessons[id] = record;
      (found.lesson.subtopics || []).forEach(function(name) { data.progress.subtopics[name] = true; });
      data.stats.study_time = (data.stats.study_time || 0) + record.duration;
      data.stats.problems_solved = (data.stats.problems_solved || 0) + correct;
      const completed = Object.keys(data.progress.lessons).filter(function(key) {
        return data.progress.lessons[key] && data.progress.lessons[key].status === 'completed';
      });
      data.stats.lessons_completed = completed.length;
      const scores = completed.map(function(key) { return Number(data.progress.lessons[key].percentage) || 0; });
      data.stats.avg_score = scores.length ? Math.round(scores.reduce(function(sum, score) { return sum + score; }, 0) / scores.length) : 0;
      data.user.lastLesson = found.lesson.title;
      data.user.lastSubject = found.subject ? found.subject.name : found.lesson.subjectKey;
      data.timeline.unshift({
        icon: '◇',
        title: 'Завершён урок «' + found.lesson.title + '»',
        desc: correct + ' / ' + total + ' задач · ' + percentage + '%',
        time: record.completedAt,
        color: 'bg-blue-500',
      });
      if (data.timeline.length > 50) data.timeline = data.timeline.slice(0, 50);
    });

    ML.setLessonSession(id, null);
    ML.recordLearningActivity(record.duration, record.completedAt);
    const detail = {
      lessonId: id,
      lessonName: found.lesson.title,
      score: percentage,
      percentage: percentage,
      xpEarned: 0,
      correct: correct,
      correctAnswers: correct,
      total: total,
      totalQuestions: total,
      grade: '',
      completedAt: record.completedAt,
    };
    emit('lesson:completed', detail);
    emit('progress:update', detail);
    return { lessonId: id, xpEarned: 0, score: percentage, grade: '', alreadyCompleted: false };
  }

  function emit(name, detail) {
    try {
      if (typeof EVENTS !== 'undefined' && EVENTS.emit) EVENTS.emit(name, detail || {});
    } catch (error) { console.warn('[Learning] event failed', error); }
  }

  function recalculateResultStats(data) {
    const completedIds = Object.keys(data.progress.lessons).filter(function(key) {
      return data.progress.lessons[key] && data.progress.lessons[key].status === 'completed';
    });
    const completedLookup = {};
    completedIds.forEach(function(id) { completedLookup[id] = true; });
    const subtopics = {};
    getCourse().forEach(function(subject) {
      subject.lessons.forEach(function(lesson) {
        if (!completedLookup[lesson.id]) return;
        (lesson.subtopics || []).forEach(function(name) { subtopics[name] = true; });
      });
    });
    data.progress.subtopics = subtopics;
    data.stats.lessons_completed = completedIds.length;
    data.stats.study_time = completedIds.reduce(function(sum, id) { return sum + (Number(data.progress.lessons[id].duration) || 0); }, 0);
    data.stats.problems_solved = completedIds.reduce(function(sum, id) { return sum + (Number(data.progress.lessons[id].correctAnswers) || 0); }, 0);
    const scores = completedIds.map(function(id) { return Number(data.progress.lessons[id].percentage) || 0; });
    data.stats.avg_score = scores.length ? Math.round(scores.reduce(function(sum, score) { return sum + score; }, 0) / scores.length) : 0;
  }

  function resetLesson(lessonId) {
    const id = resolveLessonId(lessonId);
    ML.update(function(data) {
      delete data.progress.lessons[id];
      delete data.lesson.sessions[id];
      recalculateResultStats(data);
    });
    emit('progress:update', { lessonId: id, reset: true });
  }

  function resetSubject(subjectKey) {
    const subject = findSubject(subjectKey);
    if (!subject) return;
    const ids = subject.lessons.map(function(lesson) { return lesson.id; });
    ML.update(function(data) {
      ids.forEach(function(id) {
        delete data.progress.lessons[id];
        delete data.lesson.sessions[id];
      });
      recalculateResultStats(data);
    });
    emit('progress:update', { subjectKey: subjectKey, reset: true });
  }

  function resetAll() {
    ML.resetLearning();
    emit('progress:update', { reset: true });
  }

  function getOverallProgress() {
    const subjects = getSubjects();
    const total = subjects.reduce(function(sum, subject) { return sum + subject.totalLessons; }, 0);
    const completed = subjects.reduce(function(sum, subject) { return sum + subject.completedLessons; }, 0);
    return total ? Math.round(completed / total * 100) : 0;
  }

  function getSubjectProgress(subjectKey) {
    const subject = getSubjects().find(function(item) { return item.key === subjectKey; });
    return subject ? subject.progress : 0;
  }

  function getTopicProgress(subjectKey, topicTitleOrId) {
    const topic = getTopic(subjectKey, topicTitleOrId);
    return topic ? topic.progress : 0;
  }

  function availableRegistryLessons() {
    return Object.keys(registry()).map(function(id) { return getLesson(id); })
      .filter(Boolean)
      .sort(function(a, b) { return (registry()[a.id].order || 0) - (registry()[b.id].order || 0); });
  }

  function getNextLesson() {
    const lessons = availableRegistryLessons();
    return lessons.find(function(lesson) { return lesson.status === 'current'; }) ||
      lessons.find(function(lesson) { return lesson.status === 'available'; }) || null;
  }

  function getLastCompletedLesson() {
    const lessons = availableRegistryLessons().filter(function(lesson) { return lesson.status === 'completed'; });
    lessons.sort(function(a, b) {
      return ((b.result && b.result.completedAt) || 0) - ((a.result && a.result.completedAt) || 0);
    });
    return lessons[0] || null;
  }

  function getTotalCompletedLessons() { return Object.keys(ML.getCompletedLessons()).length; }
  function getTotalLessons() { return getCourse().reduce(function(sum, subject) { return sum + subject.totalLessons; }, 0); }
  function unlock() { return false; }
  function unlockNextLesson(currentId) { return findNextLessonId(currentId); }

  function init() {
    ML.migrateLessonIds(legacyMap());
    resetCache();
    getCourse();
  }

  init();
  window.addEventListener('storage', function(event) {
    if (event.key === 'mathlogic_data') {
      ML.resetCache();
      resetCache();
      emit('progress:update', { external: true });
    }
  });

  return {
    getCourse: getCourse,
    getRegistry: function() { return JSON.parse(JSON.stringify(registry())); },
    getRegistryEntry: getRegistryEntry,
    resolveLessonId: resolveLessonId,
    resetCache: resetCache,
    getSubjects: getSubjects,
    getSubject: getSubject,
    getTopics: getTopics,
    getTopic: getTopic,
    getLessons: getLessons,
    getLesson: getLesson,
    getLessonState: getLessonState,
    getLessonStatus: getLessonStatus,
    isUnlocked: isUnlocked,
    unlock: unlock,
    unlockLesson: unlock,
    unlockNextLesson: unlockNextLesson,
    getNextLessonId: findNextLessonId,
    completeLesson: completeLesson,
    resetSubject: resetSubject,
    resetAll: resetAll,
    resetLesson: resetLesson,
    getOverallProgress: getOverallProgress,
    getSubjectProgress: getSubjectProgress,
    getTopicProgress: getTopicProgress,
    getTotalCompletedLessons: getTotalCompletedLessons,
    getTotalLessons: getTotalLessons,
    getNextLesson: getNextLesson,
    getLastCompletedLesson: getLastCompletedLesson,
    init: init,
  };
})();

window.COURSE = window.Learning;
