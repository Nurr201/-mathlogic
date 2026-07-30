const SUBJECT_EMOJI = {
  algebra: '\u{1F4D8}',
  geometry: '\u{1F4D0}',
  logic: '\u{1F9E0}',
  numbers: '\u{1F522}',
};

const SUBJECT_DESC = {
  algebra: '\u04D8\u0440\u043D\u0435\u043A\u0442\u0435\u0440, \u0442\u0435\u04A3\u0434\u0435\u0443\u043B\u0435\u0440 \u0436\u04D9\u043D\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u044F\u043B\u0430\u0440',
  geometry: '\u04AE\u0448\u0431\u04B1\u0440\u044B\u0448\u0442\u0430\u0440, \u043A\u04E9\u043F\u0431\u04B1\u0440\u044B\u0448\u0442\u0430\u0440 \u0436\u04D9\u043D\u0435 \u043A\u0435\u04A3\u0456\u0441\u0442\u0456\u043A \u0444\u0438\u0433\u0443\u0440\u0430\u043B\u0430\u0440\u044B',
  logic: '\u041F\u0456\u043A\u0456\u0440\u043B\u0435\u0440, \u0436\u0438\u044B\u043D\u0434\u0430\u0440 \u0436\u04D9\u043D\u0435 \u043A\u043E\u043C\u0431\u0438\u043D\u0430\u0442\u043E\u0440\u0438\u043A\u0430',
  numbers: '\u0421\u0430\u043D\u0434\u0430\u0440, \u0431\u04E9\u043B\u0448\u0435\u043A\u0442\u0435\u0440 \u0436\u04D9\u043D\u0435 \u0441\u0430\u043D \u0430\u0440\u0430\u043B\u044B\u049B\u0442\u0430\u0440\u044B',
};

let state = { currentSubject: null };

function renderQuests() {
  const grid = document.getElementById('questsGrid');
  grid.innerHTML = '<div class="text-center py-6 text-slate-400 font-bold text-sm">\u041A\u04AF\u043D\u0434\u0456\u043B\u0456\u043A \u043A\u0432\u0435\u0441\u0442\u0442\u0435\u0440 \u044D\u0437\u0456\u0440\u043B\u0435\u043D\u0456\u043C\u0434\u0435</div>';
  document.getElementById('questProgressFill').style.width = '0%';
  document.getElementById('questProgressText').textContent = '0/0';
}

function updateHeroMetrics() {
  var progress = XP.getLevelProgress();
  var user = ML.getUser();
  document.getElementById('heroXp').textContent = progress.xp;
  document.getElementById('heroLevel').textContent = progress.level;
  document.getElementById('heroStreak').textContent = user.streak || 0;
  document.getElementById('streakCount').textContent = user.streak || 0;
}

function updateStats() {
  var overallPct = Learning.getOverallProgress();
  var totalDone = Learning.getTotalCompletedLessons();
  document.getElementById('statOverall').textContent = overallPct + '%';
  document.getElementById('statLessons').textContent = totalDone;
  document.getElementById('statXp').textContent = XP.getXP();
  document.getElementById('statStreak').textContent = ML.getUser().streak || 0;
}

function renderSubjects() {
  var subjects = Learning.getSubjects();
  var grid = document.getElementById('subjectsGrid');

  grid.innerHTML = subjects.map(function(s) {
    var active = state.currentSubject === s.key;
    var accent = s.mainColor;
    var emoji = SUBJECT_EMOJI[s.key] || '\u{1F4D6}';
    var desc = SUBJECT_DESC[s.key] || '';

    return [
      '<div class="subject-card ' + (active ? 'active' : '') + '"',
      '     data-key="' + s.key + '"',
      '     onclick="selectSubject(\'' + s.key + '\')">',
      '  <div style="position:absolute;top:0;left:0;right:0;height:4px;border-radius:24px 24px 0 0;background:' + accent + ';opacity:' + (active ? '1' : '0.4') + '"></div>',
      '  <div class="sc-watermark" style="color:' + accent + '">' + emoji + '</div>',
      '  <div class="sc-top">',
      '    <div class="sc-icon-wrap">' + s.icon + '</div>',
      '    <div class="sc-info">',
      '      <div class="sc-name">' + s.name + '</div>',
      '      <div class="sc-desc">' + desc + '</div>',
      '    </div>',
      '    <div class="sc-badge">' + s.progress + '%</div>',
      '  </div>',
      '  <div class="sc-meta">',
      '    <span class="sc-count">' + s.completedLessons + '/' + s.totalLessons + ' \u0441\u0430\u0431\u0430\u049B</span>',
      '    <span class="sc-pct" style="color:' + accent + '">' + s.progress + '%</span>',
      '  </div>',
      '  <div class="sc-bar"><div class="sc-bar-fill" style="width:' + s.progress + '%"></div></div>',
      '</div>'
    ].join('');
  }).join('');

  renderTopics();
}

function selectSubject(key) {
  if (state.currentSubject === key) {
    state.currentSubject = null;
  } else {
    state.currentSubject = key;
  }
  renderSubjects();
}

function renderTopics() {
  var section = document.getElementById('topicsSection');
  var list = document.getElementById('topicsList');
  var headerIcon = document.getElementById('topicsHeaderIcon');
  var headerText = document.getElementById('topicsHeaderText');
  var headerCount = document.getElementById('topicsHeaderCount');

  if (!state.currentSubject) {
    section.classList.add('collapsed');
    return;
  }

  var subjectData = Learning.getSubject(state.currentSubject);
  if (!subjectData) {
    section.classList.add('collapsed');
    return;
  }

  var emoji = SUBJECT_EMOJI[state.currentSubject] || '\u{1F4D6}';
  headerIcon.textContent = emoji;
  headerText.textContent = subjectData.name + ' \u2014 \u0422\u0430\u049B\u044B\u0440\u044B\u043F\u0442\u0430\u0440';
  headerCount.textContent = subjectData.completedLessons + '/' + subjectData.totalLessons + ' \u04E9\u0442\u0456\u043B\u0433\u0435\u043D';

  var accent = subjectData.mainColor;

  var topics = Learning.getTopics(state.currentSubject);
  list.innerHTML = topics.map(function(t, i) {
    var statusLabel = t.progress >= 100 ? '\u04D8\u0442\u0456\u043B\u0433\u0435\u043D' : t.progress > 0 ? '\u0416\u0430\u043B\u0493\u0430\u0441\u0443\u0434\u0430' : '\u0416\u0430\u04A3\u0430';
    var statusClass = t.progress >= 100 ? 'done' : t.progress > 0 ? 'progress' : 'new';
    var barColor = t.progress >= 100 ? '#16A34A' : accent;

    return [
      '<div class="topic-card" style="animation-delay:' + (i * 0.04) + 's">',
      '  <div class="tc-row1">',
      '    <div class="tc-title-group">',
      '      <div class="tc-name">' + t.title + '</div>',
      '      <div class="tc-desc">' + (t.level || '') + '</div>',
      '    </div>',
      '    <div class="tc-status ' + statusClass + '">' + statusLabel + '</div>',
      '  </div>',
      '  <div class="tc-row2">',
      '    <div class="tc-stat"><span>\u{1F4D6}</span> ' + t.completedLessons + '/' + t.totalLessons + ' \u0441\u0430\u0431\u0430\u049B</div>',
      '  </div>',
      '  <div class="tc-row3">',
      '    <div class="tc-bar-wrap">',
      '      <div class="tc-bar"><div class="tc-bar-fill" style="width:' + t.progress + '%;background:' + barColor + '"></div></div>',
      '    </div>',
      '    <div class="tc-pct-text">' + t.progress + '%</div>',
      '    <button class="tc-btn primary" onclick="showToast(\'\u0411\u04B1\u043B \u0431\u04E9\u043B\u0456\u043C \u044D\u0437\u0456\u0440\u043B\u0435\u043D\u0456\u043C\u0434\u0435\')">\u0411\u0430\u0441\u0442\u0430\u0443</button>',
      '  </div>',
      '</div>'
    ].join('');
  }).join('');

  section.classList.remove('collapsed');
}

function continueLearning() {
  var target = document.getElementById('subjectsGrid');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (!state.currentSubject) {
    var subjects = Learning.getSubjects();
    for (var i = 0; i < subjects.length; i++) {
      if (subjects[i].progress > 0 && subjects[i].progress < 100) {
        state.currentSubject = subjects[i].key;
        renderSubjects();
        return;
      }
    }
    if (subjects.length > 0) {
      state.currentSubject = subjects[0].key;
      renderSubjects();
    }
  }
}

function rememberFormula() {
  showToast('\u0416\u0430\u0440\u0430\u0439\u0441\u044B\u04A3! \u0424\u043E\u0440\u043C\u0443\u043B\u0430 \u0435\u0441\u0442\u0435 \u049B\u0430\u043B\u0434\u044B \u2705');
}

function copyFormula() {
  navigator.clipboard.writeText('D = b\u00B2 - 4ac').then(function() {
    showToast('\u0424\u043E\u0440\u043C\u0443\u043B\u0430 \u043A\u04E9\u0448\u0456\u0440\u0456\u043B\u0434\u0456! \uD83D\uDCCB');
  }).catch(function() {
    showToast('\u041A\u04E9\u0448\u0456\u0440\u0443 \u043C\u04AF\u043C\u043A\u0456\u043D \u0431\u043E\u043B\u043C\u0430\u0434\u044B');
  });
}

function showToast(msg) {
  UI.showToast(msg, 'info');
}

document.addEventListener('xp:update', function() {
  updateHeroMetrics();
  updateStats();
});

document.addEventListener('progress:update', function() {
  renderSubjects();
});

renderQuests();
updateHeroMetrics();
updateStats();
renderSubjects();
