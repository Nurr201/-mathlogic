/* Dashboard view-model — derives a small learning context from canonical data. */
(function() {
  'use strict';

  function localize(record, key, lang) {
    return I18N.localize(record, key, lang);
  }

  function sessionTimestamp(session) {
    return Math.max(0, Number(session && (session.updatedAt || session.startedAt)) || 0);
  }

  function savedBlocks(session) {
    return Array.isArray(session && session.completedBlocks) ? session.completedBlocks.length : 0;
  }

  function registryLessons() {
    var registry = Learning.getRegistry();
    return Object.keys(registry).sort(function(a, b) {
      return (registry[a].order || 0) - (registry[b].order || 0);
    }).map(function(id) { return Learning.getLesson(id); }).filter(Boolean);
  }

  /* Learning.getNextLesson intentionally keeps its API stable. The dashboard
     adds a display-only resume preference when several saved sessions exist. */
  function latestResumableLesson() {
    var sessions = ML.get('lesson.sessions', {});
    var registry = Learning.getRegistry();
    return Object.keys(sessions).filter(function(id) {
      return registry[id] && savedBlocks(sessions[id]) > 0;
    }).sort(function(a, b) {
      var recent = sessionTimestamp(sessions[b]) - sessionTimestamp(sessions[a]);
      return recent || (registry[a].order || 0) - (registry[b].order || 0);
    }).map(function(id) { return Learning.getLesson(id); }).find(function(lesson) {
      return lesson && lesson.status === 'current';
    }) || null;
  }

  function canonicalTopic(lesson) {
    if (!lesson || !lesson.topicId || typeof MATHLOGIC_CURRICULUM === 'undefined') return null;
    return MATHLOGIC_CURRICULUM.getTopic(lesson.topicId);
  }

  function topicContext(focus, lang) {
    if (!focus) return null;
    var runtimeTopic = Learning.getTopic(focus.subjectKey, focus.topicId);
    var canonical = canonicalTopic(focus);
    if (!runtimeTopic && !canonical) return null;
    var lessons = runtimeTopic ? runtimeTopic.lessons : [];
    var anchor = lessons.findIndex(function(lesson) { return lesson.id === focus.id; });
    if (anchor < 0) anchor = 0;
    var limit = 6;
    var start = Math.max(0, Math.min(anchor - 2, Math.max(0, lessons.length - limit)));
    return {
      id: (canonical || runtimeTopic).id,
      title: localize(canonical || runtimeTopic, 'title', lang),
      description: localize(canonical || runtimeTopic, 'description', lang),
      subjectKey: focus.subjectKey,
      lessons: lessons.slice(start, start + limit),
    };
  }

  function recentActivity(lang, limit) {
    var history = ML.getLearningHistory({ limit: limit || 3 });
    if (history.length) {
      return history.map(function(event) {
        var lesson = Learning.getLesson(event.lessonId);
        var savedTitle = event.metadata && event.metadata.lessonTitle;
        var fallbackTitle = savedTitle && typeof savedTitle === 'object'
          ? (lang === 'kk' ? savedTitle.kk || savedTitle.ru : savedTitle.ru || savedTitle.kk)
          : '';
        return {
          id: event.id,
          lessonId: event.lessonId,
          title: lesson ? localize(lesson, 'title', lang) : fallbackTitle,
          route: lesson ? lesson.route : '',
          type: event.type,
          timestamp: event.timestamp,
          completedBlocks: Math.max(0, Number(event.metadata && event.metadata.completedBlocks) || 0),
        };
      }).filter(function(item) { return item.title; });
    }

    /* Older local data may contain completions but no learning-event journal. */
    return registryLessons().filter(function(lesson) {
      return lesson.status === 'completed' && lesson.result && Number(lesson.result.completedAt) > 0;
    }).sort(function(a, b) {
      return Number(b.result.completedAt) - Number(a.result.completedAt);
    }).slice(0, limit || 3).map(function(lesson) {
      return {
        id: 'completion:' + lesson.id,
        lessonId: lesson.id,
        title: localize(lesson, 'title', lang),
        route: lesson.route,
        type: 'LESSON_COMPLETED',
        timestamp: Number(lesson.result.completedAt),
        completedBlocks: 0,
      };
    });
  }

  window.DashboardData = {
    getModel: function(lang) {
      var resume = latestResumableLesson();
      var action = resume || Learning.getNextLesson() || null;
      /* A completed lesson still gives the lower context a place to land, but
         it must never be presented as a fictional "next lesson". */
      var focus = action || Learning.getLastCompletedLesson() || null;
      return {
        focus: focus,
        action: action,
        resume: resume,
        topic: topicContext(focus, lang),
        recent: recentActivity(lang, 3),
      };
    },
    latestResumableLesson: latestResumableLesson,
    recentActivity: recentActivity,
  };
})();
