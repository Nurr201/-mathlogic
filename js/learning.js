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

  function resolveLessonId(id) {
    if (!id) return '';
    return legacyMap()[id] || id;
  }

  function getRegistryEntry(id) {
    return registry()[resolveLessonId(id)] || null;
  }

  function buildCourse() {
    const subjects = [];
    if (typeof MATHLOGIC_CURRICULUM === 'undefined' || typeof SUBJECTS === 'undefined') return subjects;
    const subjectMap = {};
    SUBJECTS.forEach(function(subject) { subjectMap[subject.key] = subject; });
    MATHLOGIC_CURRICULUM.subjects.forEach(function(curriculumSubject) {
      const subjectKey = curriculumSubject.id;
      const meta = subjectMap[subjectKey];
      if (!meta) return;
      const allLessons = [];
      const lessonViews = {};
      function makeLesson(curriculumLesson, topicIndex, lessonIndex) {
          const unit = MATHLOGIC_CURRICULUM.getUnits(subjectKey).find(function(item) { return item.id === curriculumLesson.unitId; });
          const id = curriculumLesson.id;
          const reg = registry()[id] || null;
          const lesson = {
            id: id,
            legacyId: '',
            order: curriculumLesson.recommendedOrder || 0,
            moduleIndex: lessonIndex,
            sectionIndex: topicIndex,
            grade: curriculumLesson.grade,
            unitId: unit.id,
            curriculumTopicId: curriculumLesson.topicId,
            productionStatus: curriculumLesson.productionStatus,
            sectionTitle: unit.titleRu,
            sectionTitleRu: unit.titleRu,
            sectionTitleKk: unit.titleKk,
            sectionLevel: '', sectionLevelRu: '', sectionLevelKk: '',
            name: curriculumLesson.titleRu,
            title: reg ? reg.title : curriculumLesson.titleRu,
            titleRu: reg ? (reg.titleRu || reg.title) : curriculumLesson.titleRu,
            titleKk: reg ? (reg.titleKk || reg.titleKz || reg.title) : curriculumLesson.titleKk,
            titleKz: reg ? reg.titleKz : curriculumLesson.titleKk,
            description: reg ? reg.description : '',
            descriptionRu: reg ? (reg.descriptionRu || reg.description) : curriculumLesson.learningObjectives.ru[0],
            descriptionKk: reg ? (reg.descriptionKk || reg.descriptionKz || reg.description) : curriculumLesson.learningObjectives.kk[0],
            descriptionKz: reg ? reg.descriptionKz : '',
            route: reg ? reg.route : null,
            link: reg ? reg.route : null,
            duration: reg ? reg.duration : null,
            xp: reg ? reg.xp : null,
            availability: reg ? reg.availability : 'unavailable',
            prerequisites: reg && Array.isArray(reg.prerequisites) ? reg.prerequisites.slice() : curriculumLesson.prerequisites.hard.slice(),
            softPrerequisites: curriculumLesson.prerequisites.soft.slice(),
            unlockReason: reg ? reg.unlockReason : '',
            unlockReasonRu: reg ? (reg.unlockReasonRu || reg.unlockReason) : '',
            unlockReasonKk: reg ? (reg.unlockReasonKk || reg.unlockReasonKz || reg.unlockReason) : '',
            releaseDate: reg ? reg.releaseDate : null,
            hasContent: !!reg,
            subtopics: curriculumLesson.learningObjectives.ru.slice(),
            subjectKey: subjectKey,
            topicId: curriculumLesson.topicId,
            curriculumCodes: curriculumLesson.curriculumCodes.slice(),
            archetype: curriculumLesson.archetype,
          };
          return lesson;
      }
      const topics = MATHLOGIC_CURRICULUM.topics.filter(function(topic) { return topic.subject === subjectKey; })
        .sort(function(a, b) {
          var aOrder = a.lessonIds.length ? (MATHLOGIC_CURRICULUM.getLesson(a.lessonIds[0]).recommendedOrder || 0) : 0;
          var bOrder = b.lessonIds.length ? (MATHLOGIC_CURRICULUM.getLesson(b.lessonIds[0]).recommendedOrder || 0) : 0;
          return aOrder - bOrder;
        }).map(function(curriculumTopic, topicIndex) {
          var lessons = curriculumTopic.lessonIds.map(function(id, lessonIndex) {
            var lesson = makeLesson(MATHLOGIC_CURRICULUM.getLesson(id), topicIndex, lessonIndex);
            lessonViews[id] = lesson;
            return lesson;
          });
          return {
          id: curriculumTopic.id,
          unitId: curriculumTopic.unitId,
          grade: curriculumTopic.grade,
          title: curriculumTopic.titleRu,
          titleRu: curriculumTopic.titleRu,
          titleKk: curriculumTopic.titleKk,
          descriptionRu: curriculumTopic.descriptionRu,
          descriptionKk: curriculumTopic.descriptionKk,
          level: '', levelRu: '', levelKk: '',
          order: topicIndex,
          lessons: lessons,
          totalLessons: lessons.length,
        };
        });
      MATHLOGIC_CURRICULUM.getLessons(subjectKey).forEach(function(curriculumLesson) {
        if (lessonViews[curriculumLesson.id]) allLessons.push(lessonViews[curriculumLesson.id]);
      });

      subjects.push({
        key: subjectKey,
        name: meta.name,
        nameRu: meta.nameRu || meta.name,
        nameKk: meta.nameKk || meta.name,
        icon: meta.icon || '',
        mainColor: meta.mainColor || '#4F46E5',
        bgActive: meta.bgActive || '#EEF2FF',
        topics: topics,
        lessons: allLessons,
        totalLessons: allLessons.length,
        firstLessonId: allLessons.length ? allLessons[0].id : null,
        grades: curriculumSubject.grades.slice(),
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
          grade: reg.grade,
          unitId: reg.unitId || reg.topicId,
          curriculumTopicId: reg.topicId,
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

  function runtimeSnapshot() {
    return {
      records: ML.get('progress.lessons', {}),
      sessions: ML.get('lesson.sessions', {}),
    };
  }

  function getRecord(lessonId, snapshot) {
    const lessons = snapshot ? snapshot.records : ML.get('progress.lessons', {});
    return lessons[resolveLessonId(lessonId)] || null;
  }

  function getSession(lessonId, snapshot) {
    if (!snapshot) return ML.getLessonSession(resolveLessonId(lessonId));
    return snapshot.sessions[resolveLessonId(lessonId)] || null;
  }

  function getLessonStatus(lessonId, snapshot) {
    const found = findLesson(lessonId);
    if (!found) return 'locked';
    const lesson = found.lesson;
    snapshot = snapshot || runtimeSnapshot();
    const record = getRecord(lesson.id, snapshot);
    if (record && record.status === 'completed') return 'completed';
    const session = getSession(lesson.id, snapshot);
    if (session && Array.isArray(session.completedBlocks) && session.completedBlocks.length > 0) return 'current';
    if (lesson.releaseDate) {
      const release = new Date(lesson.releaseDate);
      if (!isNaN(release.getTime()) && release.getTime() > Date.now()) return 'comingSoon';
    }
    if (!lesson.hasContent) return 'locked';
    return 'available';
  }

  /* Старый API оставляет три состояния. Новый UI использует getLessonStatus(). */
  function getLessonState(lessonId) {
    const status = getLessonStatus(lessonId);
    if (status === 'completed') return 'completed';
    if (status === 'current' || status === 'available') return 'available';
    return 'locked';
  }

  function lessonView(lesson, snapshot) {
    snapshot = snapshot || runtimeSnapshot();
    const status = getLessonStatus(lesson.id, snapshot);
    const record = getRecord(lesson.id, snapshot);
    const session = getSession(lesson.id, snapshot);
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
      grade: lesson.grade,
      unitId: lesson.unitId || lesson.topicId,
      curriculumTopicId: lesson.curriculumTopicId || lesson.topicId,
      productionStatus: lesson.productionStatus || '',
      sectionTitle: lesson.sectionTitle,
      sectionTitleRu: lesson.sectionTitleRu || lesson.sectionTitle,
      sectionTitleKk: lesson.sectionTitleKk || lesson.sectionTitle,
      sectionLevel: lesson.sectionLevel,
      sectionLevelRu: lesson.sectionLevelRu || lesson.sectionLevel,
      sectionLevelKk: lesson.sectionLevelKk || lesson.sectionLevel,
      subjectKey: lesson.subjectKey,
      topicId: lesson.topicId,
      status: status,
      state: status === 'completed' ? 'completed' : (status === 'current' || status === 'available' ? 'available' : 'locked'),
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
      softPrerequisites: lesson.softPrerequisites || [],
      hasContent: lesson.hasContent,
      curriculumCodes: lesson.curriculumCodes || [],
      archetype: lesson.archetype || '',
      subtopics: lesson.subtopics,
      result: record,
      session: session,
    };
  }

  function getSubjects(snapshot) {
    snapshot = snapshot || runtimeSnapshot();
    return getCourse().map(function(subject) {
      const published = subject.lessons.filter(function(lesson) { return lesson.hasContent; });
      const completed = published.filter(function(lesson) {
        return getLessonStatus(lesson.id, snapshot) === 'completed';
      }).length;
      return {
        key: subject.key,
        name: subject.name,
        icon: subject.icon,
        mainColor: subject.mainColor,
        bgActive: subject.bgActive,
        totalLessons: published.length,
        plannedLessons: subject.totalLessons - published.length,
        completedLessons: completed,
        progress: published.length ? Math.round(completed / published.length * 100) : 0,
      };
    });
  }

  function getSubject(subjectKey) {
    const subject = findSubject(subjectKey);
    if (!subject) return null;
    const snapshot = runtimeSnapshot();
    const summary = getSubjects(snapshot).find(function(item) { return item.key === subjectKey; });
    return Object.assign({}, summary, {
      topics: subject.topics.map(function(topic) {
        const published = topic.lessons.filter(function(lesson) { return lesson.hasContent; });
        const completed = published.filter(function(lesson) {
          return getLessonStatus(lesson.id, snapshot) === 'completed';
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
          grade: topic.grade,
          totalLessons: published.length,
          plannedLessons: topic.totalLessons - published.length,
          completedLessons: completed,
          progress: published.length ? Math.round(completed / published.length * 100) : 0,
        };
      }),
      firstLessonId: subject.firstLessonId,
    });
  }

  function getTopics(subjectKey) {
    const subject = findSubject(subjectKey);
    if (!subject) return [];
    const snapshot = runtimeSnapshot();
    return subject.topics.map(function(topic) {
      const lessons = topic.lessons.map(function(lesson) { return lessonView(lesson, snapshot); });
      const completed = lessons.filter(function(lesson) { return lesson.status === 'completed'; }).length;
      return {
      id: topic.id,
      grade: topic.grade,
        title: topic.title,
        titleRu: topic.titleRu || topic.title,
        titleKk: topic.titleKk || topic.title,
        level: topic.level,
        levelRu: topic.levelRu || topic.level,
        levelKk: topic.levelKk || topic.level,
        order: topic.order,
      totalLessons: lessons.filter(function(lesson) { return lesson.hasContent; }).length,
      plannedLessons: lessons.filter(function(lesson) { return !lesson.hasContent; }).length,
        completedLessons: completed,
      progress: lessons.some(function(lesson) { return lesson.hasContent; }) ? Math.round(completed / lessons.filter(function(lesson) { return lesson.hasContent; }).length * 100) : 0,
        lessons: lessons,
      };
    });
  }

  function getTopic(subjectKey, topicTitleOrId) {
    const curriculumTopic = typeof MATHLOGIC_CURRICULUM !== 'undefined' ? MATHLOGIC_CURRICULUM.getTopic(topicTitleOrId) : null;
    return getTopics(subjectKey).find(function(topic) {
      return topic.id === (curriculumTopic ? curriculumTopic.id : topicTitleOrId) || topic.title === topicTitleOrId;
    }) || null;
  }

  function getLessons(subjectKey) {
    const subject = findSubject(subjectKey);
    if (!subject) return [];
    const snapshot = runtimeSnapshot();
    return subject.lessons.map(function(lesson) { return lessonView(lesson, snapshot); });
  }

  function getLesson(lessonId) {
    const found = findLesson(lessonId);
    return found ? lessonView(found.lesson, runtimeSnapshot()) : null;
  }

  function isUnlocked(lessonId) {
    const status = getLessonStatus(lessonId);
    return status === 'available' || status === 'current' || status === 'completed';
  }

  function findNextLessonId(currentId) {
    const canonical = resolveLessonId(currentId);
    const current = typeof MATHLOGIC_CURRICULUM !== 'undefined' ? MATHLOGIC_CURRICULUM.getLesson(canonical) : null;
    if (!current) return null;
    const entries = MATHLOGIC_CURRICULUM.getLessons(current.subject, current.grade);
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
    });

    ML.setLessonSession(id, null);
    ML.recordLearningActivity(record.duration, record.completedAt);
    ML.addLearningEvent({
      type: 'LESSON_COMPLETED',
      timestamp: record.completedAt,
      lessonId: id,
      subjectId: found.lesson.subjectKey,
      topicId: found.lesson.topicId,
      metadata: {
        correctAnswers: correct,
        totalQuestions: total,
        duration: record.duration,
        attempts: record.attempts,
        lessonTitle: {
          ru: found.lesson.titleRu || found.lesson.title,
          kk: found.lesson.titleKk || found.lesson.titleKz || found.lesson.title,
        },
      },
    });
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
      const previous = data.progress.lessons[id];
      const completionEvent = (data.activity.history || []).find(function(event) {
        return event && event.lessonId === id && event.type === 'LESSON_COMPLETED';
      });
      if (previous && completionEvent && Number(previous.duration) > 0 && Number(previous.completedAt) > 0) {
        const date = new Date(Number(previous.completedAt));
        if (!isNaN(date.getTime())) {
          const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
          data.activity.studySecondsByDate[key] = Math.max(0,
            (Number(data.activity.studySecondsByDate[key]) || 0) - Math.floor(Number(previous.duration))
          );
        }
      }
      delete data.progress.lessons[id];
      delete data.lesson.sessions[id];
      data.activity.history = (data.activity.history || []).filter(function(event) {
        return !event || event.lessonId !== id;
      });
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

  function availableRegistryLessons(subjectKey, grade) {
    const hasGrade = grade !== undefined && grade !== null && grade !== '';
    const snapshot = runtimeSnapshot();
    return Object.keys(registry()).map(function(id) {
      const found = findLesson(id);
      return found ? lessonView(found.lesson, snapshot) : null;
    })
      .filter(Boolean)
      .filter(function(lesson) { return !subjectKey || lesson.subjectKey === subjectKey; })
      .filter(function(lesson) { return !hasGrade || lesson.grade === Number(grade); })
      .sort(function(a, b) { return (registry()[a.id].order || 0) - (registry()[b.id].order || 0); });
  }

  function getNextLesson(context) {
    const all = availableRegistryLessons();
    const current = all.find(function(lesson) { return lesson.status === 'current'; });
    if (current) return current;
    const requestedId = typeof context === 'string' ? context : context && context.currentLessonId;
    const anchor = requestedId ? getLesson(requestedId) : getLastCompletedLesson();
    const subjectKey = (context && context.subjectKey) || (anchor && anchor.subjectKey) || 'algebra';
    const grade = (context && context.grade) || (anchor && anchor.grade) || 7;
    const lessons = availableRegistryLessons(subjectKey, grade);
    // The recommended path is authoritative even when a learner opens and
    // completes a later lesson directly. Resume the earliest unfinished,
    // available lesson in the active subject/grade instead of skipping gaps.
    return lessons.find(function(lesson) { return lesson.status === 'available'; }) || null;
  }

  function getLastCompletedLesson() {
    const lessons = availableRegistryLessons().filter(function(lesson) { return lesson.status === 'completed'; });
    lessons.sort(function(a, b) {
      return ((b.result && b.result.completedAt) || 0) - ((a.result && a.result.completedAt) || 0);
    });
    return lessons[0] || null;
  }

  function getTotalCompletedLessons() { return Object.keys(ML.getCompletedLessons()).length; }
  function getTotalLessons() { return Object.keys(registry()).length; }
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
    getCurriculum: function() {
      return typeof MATHLOGIC_CURRICULUM === 'undefined' ? null : {
        version: MATHLOGIC_CURRICULUM.version,
        subjects: JSON.parse(JSON.stringify(MATHLOGIC_CURRICULUM.subjects)),
        units: JSON.parse(JSON.stringify(MATHLOGIC_CURRICULUM.units)),
        topics: JSON.parse(JSON.stringify(MATHLOGIC_CURRICULUM.topics)),
        lessons: JSON.parse(JSON.stringify(MATHLOGIC_CURRICULUM.lessons)),
      };
    },
    getProductionQueue: function() {
      return typeof MATHLOGIC_CURRICULUM === 'undefined' ? [] : JSON.parse(JSON.stringify(MATHLOGIC_CURRICULUM.productionQueue));
    },
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
