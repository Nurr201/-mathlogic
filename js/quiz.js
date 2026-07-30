window.QuizEngine = (function() {

  function calcGrade(scorePct) {
    if (scorePct >= 90) return 'S';
    if (scorePct >= 80) return 'A';
    if (scorePct >= 60) return 'B';
    if (scorePct >= 40) return 'C';
    return 'D';
  }

  function calcXP(correct, base) {
    base = (base !== undefined && base !== null) ? base : 30;
    return base + correct * 10;
  }

  function formatTime(seconds) {
    if (seconds >= 60) {
      var mins = Math.floor(seconds / 60);
      var secs = seconds % 60;
      return mins + ' мин ' + secs + ' сек';
    }
    return seconds + ' сек';
  }

  function completeLesson(lessonId, result) {
    try {
      return COURSE.completeLesson(lessonId, result);
    } catch(e) {
      return null;
    }
  }

  return {
    calcGrade: calcGrade,
    calcXP: calcXP,
    formatTime: formatTime,
    completeLesson: completeLesson,
  };

})();
