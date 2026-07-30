const STATS_CONFIG = [
  { key: 'lessons_completed', icon: '📚', label: 'Завершено уроков', color: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-blue-700', border: 'border-blue-200/60', defaultVal: 0 },
  { key: 'modules_completed', icon: '🧩', label: 'Завершено модулей', color: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700', border: 'border-emerald-200/60', defaultVal: 0 },
  { key: 'xp_earned', icon: '⭐', label: 'Получено XP', color: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueColor: 'text-amber-700', border: 'border-amber-200/60', defaultVal: 0 },
  { key: 'study_time', icon: '⏱️', label: 'Время обучения (мин)', color: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', valueColor: 'text-purple-700', border: 'border-purple-200/60', defaultVal: 0 },
  { key: 'problems_solved', icon: '📝', label: 'Решено задач', color: 'bg-cyan-50', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', valueColor: 'text-cyan-700', border: 'border-cyan-200/60', defaultVal: 0 },
  { key: 'avg_score', icon: '🎯', label: 'Средний результат', color: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600', valueColor: 'text-green-700', border: 'border-green-200/60', defaultVal: 0, suffix: '%' },
  { key: 'best_streak', icon: '🔥', label: 'Лучшая серия (дней)', color: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', valueColor: 'text-orange-700', border: 'border-orange-200/60', defaultVal: 0 },
  { key: 'achievements', icon: '🏆', label: 'Получено достижений', color: 'bg-rose-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', valueColor: 'text-rose-700', border: 'border-rose-200/60', defaultVal: 0 },
];

function getStatValue(key, defaultVal) {
  return ML.getProfileStat(key, defaultVal);
}

function formatStatValue(val, suffix) {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M' + (suffix || '');
  if (val >= 1000) return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (suffix || '');
  return val + (suffix || '');
}

function renderStats() {
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = STATS_CONFIG.map((s, i) => {
    const val = getStatValue(s.key, s.defaultVal);
    return `
      <div class="stat-card animate-count stagger-${i + 1} ${s.color} border ${s.border} shadow-sm hover:shadow-md">
        <div class="stat-card-shine"></div>
        <div class="flex items-start gap-3.5 mb-3">
          <div class="stat-icon-wrap ${s.iconBg} ${s.iconColor}">${s.icon}</div>
        </div>
        <div class="${s.valueColor} stat-value">${formatStatValue(val, s.suffix)}</div>
        <div class="${s.valueColor} stat-label mt-1">${s.label}</div>
      </div>`;
  }).join('');
}

const RARITY_STYLES = {
  common: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-200 text-slate-600', iconBg: 'bg-slate-100 text-slate-600' },
  rare: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-200 text-blue-700', iconBg: 'bg-blue-100 text-blue-600' },
  epic: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-200 text-purple-700', iconBg: 'bg-purple-100 text-purple-600' },
  legendary: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-200 text-amber-700', iconBg: 'bg-amber-100 text-amber-600' },
};

const RARITY_LABELS = { common: 'Обычное', rare: 'Редкое', epic: 'Эпическое', legendary: 'Легендарное' };

function getAchievements() {
  var stored = ML.getProfile('achievements');
  if (stored && Array.isArray(stored)) return stored;
  return [];
}

let activeAchvFilter = 'all';

function filterAchv(filter) {
  document.querySelectorAll('.achv-filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.achv-filter-btn[data-filter="' + filter + '"]').classList.add('active');
  activeAchvFilter = filter;
  renderAchievements();
  var labels = { all: 'Все достижения', unlocked: 'Полученные', 'in-progress': 'В процессе', locked: 'Заблокированные' };
  UI.showToast(labels[filter] || filter, 'info');
}

let activePeriod = 30;

function filterPeriod(period) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  var selector = '.period-btn[data-period="' + period + '"]';
  document.querySelector(selector).classList.add('active');
  activePeriod = period === 'all' ? 120 : parseInt(period);
  renderAnalytics();
  var labels = { 7: '7 дней', 30: '30 дней', 90: '3 месяца', all: 'Всё время' };
  UI.showToast('Период: ' + (labels[period] || period), 'info');
}

function renderAchvStats() {
  const wrap = document.getElementById('achv-stats');
  if (!wrap) return;
  const data = getAchievements();
  const totalEl = document.getElementById('achv-total-label');
  const unlocked = data.filter(a => a.status === 'unlocked').length;
  const total = data.length;
  if (totalEl) totalEl.textContent = total + ' Наград';
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  const cards = [
    { label: 'Всего', value: total, color: 'bg-slate-900', bg: 'bg-slate-100' },
    { label: 'Получено', value: unlocked, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Осталось', value: total - unlocked, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Прогресс', value: pct + '%', color: 'text-blue-700', bg: 'bg-blue-50' },
  ];

  wrap.innerHTML = cards.map(c => `
    <div class="${c.bg} rounded-2xl p-4 border border-slate-200/60 text-center">
      <div class="font-head font-extrabold text-2xl sm:text-3xl text-slate-900 ${c.color}">${c.value}</div>
      <div class="text-xs font-bold text-slate-400 mt-0.5">${c.label}</div>
    </div>`).join('');
}

function renderAchievements() {
  const grid = document.getElementById('achv-grid');
  if (!grid) return;
  const data = getAchievements();

  const filtered = activeAchvFilter === 'all' ? data : data.filter(a => a.status === activeAchvFilter);

  grid.innerHTML = filtered.map((a, i) => {
    const s = RARITY_STYLES[a.rarity];
    const isLocked = a.status === 'locked';
    const isInProg = a.status === 'in-progress';
    const isUnlocked = a.status === 'unlocked';
    const progPct = isInProg && a.total ? Math.round((a.progress / a.total) * 100) : 0;

    return `
      <div class="achv-card ${s.bg} border ${s.border} shadow-sm ${isLocked ? 'locked' : ''} animate-count stagger-${(i % 8) + 1}">
        ${isLocked ? '<div class="achv-lock-icon">🔒</div>' : ''}
        <div class="relative" style="${isLocked ? 'filter: blur(1px);' : ''}">
          <div class="flex items-start gap-3.5 mb-3">
            <div class="achv-badge-icon ${s.iconBg}">${a.icon}</div>
            <div class="flex-1 min-w-0">
              <div class="font-head font-bold text-sm text-slate-900 leading-tight">${a.name}</div>
              <div class="mt-1">
                <span class="achv-rarity ${s.badge}">${RARITY_LABELS[a.rarity]}</span>
              </div>
            </div>
          </div>
          <div class="text-xs font-semibold text-slate-500 leading-relaxed">${isLocked ? a.condition : a.desc}</div>
          ${isUnlocked && a.date ? `<div class="text-[11px] font-bold text-slate-400 mt-2">Получено ${a.date}</div>` : ''}
          ${isInProg ? `
            <div class="mt-3">
              <div class="flex items-center gap-2.5">
                <div class="achv-progress-track">
                  <div class="achv-progress-fill ${s.badge.split(' ')[0]}" style="width: ${progPct}%"></div>
                </div>
                <span class="text-xs font-bold font-mono text-slate-500">${progPct}%</span>
              </div>
              <div class="text-[11px] font-bold text-slate-400 mt-1">${a.progress}/${a.total} • ${a.condition}</div>
            </div>` : ''}
          ${isLocked ? `
            <div class="mt-3 pt-3 border-t border-slate-200/60">
              <div class="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                ${a.condition}
              </div>
            </div>` : ''}
        </div>
      </div>`;
  }).join('');

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 font-bold">Нет достижений в этой категории</div>`;
  }
}

function getStreakData() {
  var stored = ML.getProfile('streak_data');
  if (stored && stored.days) return stored;
  var u = ML.getUser() || {};
  var result = {
    current: u.streak || 0,
    best: u.streakBest || 0,
    total: u.streakTotal || 0,
    days: []
  };
  ML.setProfile('streak_data', result);
  return result;
}

function renderCalendar() {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  const data = getStreakData();
  const today = new Date().toISOString().slice(0, 10);

  var elCurrent = document.getElementById('streak-current');
  var elBest = document.getElementById('streak-best');
  var elTotal = document.getElementById('streak-total');
  if (elCurrent) { elCurrent.textContent = data.current; elCurrent.dataset.target = data.current; }
  if (elBest) { elBest.textContent = data.best; elBest.dataset.target = data.best; }
  if (elTotal) { elTotal.textContent = data.total; elTotal.dataset.target = data.total; }

  const rewardDays = 30;
  const remaining = rewardDays - data.current;
  const rewardEl = document.getElementById('next-reward');
  if (remaining > 0) {
    rewardEl.textContent = `До награды «${rewardDays} дней подряд» осталось ${remaining} дней`;
  } else {
    rewardEl.textContent = `🏆 Награда «${rewardDays} дней подряд» получена!`;
  }

  grid.innerHTML = data.days.map(d => {
    const isToday = d.date === today;
    return `<div class="cal-day level-${d.level}${isToday ? ' today' : ''}" title="${d.date}"></div>`;
  }).join('');
}

function getTimelineData() {
  var stored = ML.getProfile('timeline');
  if (stored && Array.isArray(stored)) return stored;
  return [];
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + ' мин назад';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + ' ч назад';
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Вчера';
  if (days < 7) return days + ' дня назад';
  return Math.floor(days / 7) + ' нед назад';
}

function renderTimeline() {
  const container = document.getElementById('timeline-container');
  if (!container) return;
  const items = getTimelineData();

  items.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'timeline-item animate-slide-up';
    el.style.animationDelay = (i * 0.08) + 's';
    el.innerHTML = `
      <div class="timeline-dot ${item.color} text-white shadow-md">${item.icon}</div>
      <div class="bg-white/70 border border-slate-200/60 rounded-2xl p-4 hover:bg-white/90 hover:border-slate-300/80 transition-all shadow-sm">
        <div class="font-head font-bold text-sm text-slate-900">${item.title}</div>
        <div class="text-xs font-semibold text-slate-400 mt-1">${item.desc}</div>
        <div class="text-[11px] font-bold text-slate-300 mt-1.5">${timeAgo(item.time)}</div>
      </div>`;
    container.appendChild(el);
  });
}

function getGoalsData() {
  var stored = ML.getProfile('goals');
  var currentLevel = XP.getLevel();
  var currentXp = XP.getXP();
  var xpToNext = XP.calcXpForLevel(currentLevel + 1);
  var goalsResult = {
    currentLevel: currentLevel,
    currentXp: currentXp,
    xpToNext: xpToNext,
    goals: (stored && stored.goals) || [],
    todayTasks: [],
    motivation: ''
  };
  return goalsResult;
}

function renderGoals() {
  const data = getGoalsData();
  const pct = Math.round((data.currentXp / data.xpToNext) * 100);
  const remaining = data.xpToNext - data.currentXp;

  document.getElementById('current-level-display').textContent = data.currentLevel;
  document.getElementById('current-level-label').textContent = data.currentLevel;
  document.getElementById('next-level-display').textContent = data.currentLevel + 1;
  document.getElementById('next-level-label').textContent = data.currentLevel + 1;
  document.getElementById('xp-progress-label').textContent = `${data.currentXp.toLocaleString()} / ${data.xpToNext.toLocaleString()} XP`;
  document.getElementById('level-progress-pct').textContent = pct + '%';
  document.getElementById('xp-remaining-text').textContent = `Осталось ${remaining.toLocaleString()} XP до уровня ${data.currentLevel + 1}`;

  setTimeout(() => {
    document.getElementById('level-progress-bar').style.width = pct + '%';
  }, 300);

  const goalsEl = document.getElementById('goals-container');
  goalsEl.innerHTML = data.goals.map(g => {
    const gpct = Math.round((g.progress / g.total) * 100);
    return `
      <div class="goal-card bg-white/60 border border-slate-200/60 hover:bg-white/80 hover:border-slate-300/80 shadow-sm">
        <div class="flex items-start gap-3.5">
          <div class="w-9 h-9 rounded-xl ${g.color.replace('bg-', 'bg-').replace('500', '100')} flex items-center justify-center text-sm shrink-0">${g.icon}</div>
          <div class="flex-1 min-w-0">
            <div class="font-head font-bold text-sm text-slate-900">${g.name}</div>
            <div class="flex items-center gap-2.5 mt-2.5">
              <div class="achv-progress-track">
                <div class="achv-progress-fill ${g.color}" style="width: ${gpct}%"></div>
              </div>
              <span class="text-xs font-bold font-mono text-slate-500 shrink-0">${gpct}%</span>
            </div>
            <div class="flex items-center justify-between mt-1.5">
              <span class="text-[11px] font-bold text-slate-400">${g.progress}/${g.total}</span>
              <span class="text-[11px] font-bold text-emerald-600">+ ${g.reward}</span>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  const tasksEl = document.getElementById('today-tasks');
  document.getElementById('today-progress-label').textContent = '0%';
  setTimeout(function() {
    document.getElementById('today-progress-bar').style.width = '0%';
  }, 400);

  if (data.todayTasks.length === 0) {
    tasksEl.innerHTML = '<div class="text-sm font-bold text-slate-400 py-4 text-center">Сегодняшние цели отсутствуют</div>';
  } else {
    var doneCount = data.todayTasks.filter(function(t) { return t.done; }).length;
    var todayPct = Math.round((doneCount / data.todayTasks.length) * 100);
    document.getElementById('today-progress-label').textContent = todayPct + '%';
    setTimeout(function() {
      document.getElementById('today-progress-bar').style.width = todayPct + '%';
    }, 400);
    tasksEl.innerHTML = data.todayTasks.map(function(t) { return '<div class="today-task' + (t.done ? ' done' : '') + '"><div class="today-check">' + (t.done ? '<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : '') + '</div><span class="text-sm font-bold text-slate-700 flex-1">' + t.name + '</span>' + (t.done ? '<span class="text-[11px] font-bold text-emerald-600">Выполнено</span>' : '<span class="text-[11px] font-bold text-slate-400">Ожидание</span>') + '</div>'; }).join('');
  }

  document.getElementById('motivation-text').textContent = data.motivation;

  const previewEl = document.getElementById('reward-preview');
  previewEl.innerHTML = '<div class="text-sm font-bold text-slate-400 py-4 text-center">Нет данных о наградах</div>';
}

function getAnalyticsData(period) {
  var stored = ML.getProfile('analytics.' + period);
  if (stored && Array.isArray(stored) && stored.length > 0) return stored;
  return [];
}

let chartInstances = {};

function getSubjectData() {
  var subjects = Learning.getSubjects();
  return {
    labels: subjects.map(function(s) { return s.name; }),
    values: subjects.map(function(s) { return s.progress; }),
    colors: subjects.map(function(s) { return s.mainColor; })
  };
}

function renderAnalytics() {
  const data = getAnalyticsData(activePeriod);
  const subj = getSubjectData();

  const ctx1 = document.getElementById('xpChart');
  if (ctx1 && data && data.length > 0) {
    if (chartInstances.xp) chartInstances.xp.destroy();
    chartInstances.xp = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: data.map(d => d.date.slice(5)),
        datasets: [{
          label: 'XP',
          data: data.map(d => d.xp),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79,70,229,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#4F46E5',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#fff', titleColor: '#0F172A', bodyColor: '#0F172A', borderColor: '#E2E8F0', borderWidth: 1, cornerRadius: 12, padding: 12 } },
        scales: { x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 9, weight: 'bold' }, maxTicksLimit: 8 } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#94A3B8', font: { size: 9, weight: 'bold' } } } }
      }
    });
  }

  const ctx3 = document.getElementById('subjectsChart');
  if (ctx3) {
    if (chartInstances.subj) chartInstances.subj.destroy();
    chartInstances.subj = new Chart(ctx3, {
      type: 'doughnut',
      data: {
        labels: subj.labels,
        datasets: [{
          data: subj.values,
          backgroundColor: subj.colors,
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 10, padding: 8, color: '#64748B', font: { size: 10, weight: 'bold' } } },
          tooltip: { backgroundColor: '#fff', titleColor: '#0F172A', bodyColor: '#0F172A', borderColor: '#E2E8F0', borderWidth: 1, cornerRadius: 12, padding: 12 }
        }
      }
    });
  }

  var bestSubj = subj.labels[subj.values.indexOf(Math.max(...subj.values))];
  var worstSubj = subj.labels[subj.values.indexOf(Math.min(...subj.values))];

  var grid = document.getElementById('insights-grid');
  if (!grid) { return; }

  if (!data || data.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center text-sm font-bold text-slate-400 py-4">Недостаточно данных для анализа</div>';
  } else {
    var totalXp = data.reduce(function(s, d) { return s + d.xp; }, 0);
    var avgXp = Math.round(totalXp / data.length);

    grid.innerHTML = [
      { icon: '⭐', label: 'Сред. XP/день', value: avgXp },
      { icon: '❤️', label: 'Любимый предмет', value: bestSubj },
      { icon: '📈', label: 'Подтянуть', value: worstSubj },
    ].map(function(ins) { return '<div class="insight-card text-center"><div class="text-xl mb-1">' + ins.icon + '</div><div class="font-head font-extrabold text-base text-slate-900">' + ins.value + '</div><div class="text-[11px] font-bold text-slate-400 mt-0.5">' + ins.label + '</div></div>'; }).join('');
  }
}

function loadProfileData() {
  var user = ML.getUser();
  if (!user) return;
  var elName = document.getElementById('profile-name');
  var elLevel = document.getElementById('profile-level');
  var elUser = document.getElementById('profile-username');
  var elXp = document.getElementById('profile-xp');
  var elStreak = document.getElementById('profile-streak');
  var elLast = document.getElementById('profile-last-active');
  var elXpBar = document.getElementById('profile-xp-bar-text');
  var elNextLv = document.getElementById('profile-next-level');
  var elXpFill = document.getElementById('profile-xp-bar-fill');
  var elPct = document.getElementById('progress-pct-display');
  var elPct2 = document.getElementById('overall-progress-pct-val');
  var elRemain = document.getElementById('remaining-lessons-val');
  var elXpRemain = document.getElementById('remaining-xp-val');
  var elNextGoal = document.getElementById('next-goal');
  var elCompPct = document.getElementById('comparison-pct');
  var elMainLabel = document.getElementById('main-bar-label');
  var elMainFill = document.getElementById('main-progress-fill');

  if (elName) elName.textContent = user.name || 'Пользователь';
  if (elLevel) elLevel.textContent = 'Lv. ' + XP.getLevel();
  if (elUser) elUser.textContent = user.username || '@user';
  var xpFormatted = XP.getXP().toLocaleString();
  if (elXp) elXp.textContent = xpFormatted + ' XP';
  if (elStreak) elStreak.textContent = 'Streak ' + (user.streak || 0) + ' күн';
  if (elLast) {
    var d = user.lastVisit ? new Date(user.lastVisit) : null;
    if (d) {
      var months = ['Қаңтар','Ақпан','Наурыз','Сәуір','Мамыр','Маусым','Шілде','Тамыз','Қыркүйек','Қазан','Қараша','Желтоқсан'];
      elLast.textContent = months[d.getMonth()] + ' ' + d.getFullYear();
    }
  }
  if (elXpBar) {
    var currentXp = XP.getXP();
    var progressData = XP.getLevelProgress();
    var levelProgress = progressData.progress;
    var xpForNext = progressData.xpForNext;
    elXpBar.textContent = currentXp.toLocaleString() + ' / ' + xpForNext.toLocaleString() + ' XP';
    if (elNextLv) elNextLv.textContent = 'Lv. ' + (progressData.level + 1);
    if (elXpFill) {
      elXpFill.style.width = levelProgress + '%';
      elXpFill.style.transition = 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    }
  }

  var overallPct = Learning.getOverallProgress();
  if (elPct) {
    elPct.textContent = overallPct + '%';
    elPct.dataset.target = overallPct;
  }
  if (elPct2) {
    elPct2.textContent = overallPct + '%';
    elPct2.dataset.target = overallPct;
  }
  if (elMainLabel) elMainLabel.textContent = overallPct + '%';
  if (elMainFill) {
    elMainFill.style.width = overallPct + '%';
    elMainFill.dataset.progress = overallPct;
  }

  var totalSubtopics = 0;
  try {
    if (typeof DATA !== 'undefined') {
      Object.keys(DATA).forEach(function(sk) {
        (DATA[sk] || []).forEach(function(sec) {
          (sec.modules || []).forEach(function(mod) {
            (mod.subtopics || []).forEach(function() { totalSubtopics++; });
          });
        });
      });
    }
  } catch(e) {}
  var doneCount = Object.keys(ML.getSubtopics()).length;
  var remainingSubtopic = Math.max(0, totalSubtopics - doneCount);
  if (elRemain) {
    elRemain.textContent = remainingSubtopic;
    elRemain.dataset.target = remainingSubtopic;
  }

  var xpToNext = XP.getLevelProgress().remaining;
  if (elXpRemain) {
    elXpRemain.textContent = xpToNext.toLocaleString();
    elXpRemain.dataset.target = xpToNext;
  }

  if (elNextGoal) {
    var lastLesson = user.lastLesson || 'Геометрия — Площади фигур';
    elNextGoal.textContent = lastLesson;
  }

  if (elCompPct) {
    elCompPct.textContent = '—';
  }

  var elContinueTitle = document.getElementById('continue-lesson-title');
  var elContinueMeta = document.getElementById('continue-lesson-meta');
  if (elContinueTitle && user.lastLesson) {
    elContinueTitle.textContent = user.lastLesson;
  }
  if (elContinueMeta) {
    var continueSubject = user.lastSubject || '';
    elContinueMeta.textContent = continueSubject || '—';
  }
}

document.addEventListener('xp:update', function() {
  loadProfileData();
  renderGoals();
});

document.addEventListener('progress:update', function() {
  loadProfileData();
  renderGoals();
});

document.addEventListener('DOMContentLoaded', function() {
  loadProfileData();
  renderStats();
  renderCalendar();
  renderTimeline();
  renderAchvStats();
  renderAchievements();
  renderGoals();
  setTimeout(renderAnalytics, 100);
  ANIME.initPageTransitions();

  setTimeout(function() {
    var pct = Learning.getOverallProgress();
    var ring = document.getElementById('progress-ring');
    var glow = document.getElementById('progress-glow');
    if (ring && glow) {
      var offset = 439.8 * (100 - pct) / 100;
      ring.style.setProperty('--offset', offset + 'px');
      glow.style.setProperty('--offset', offset + 'px');
      ring.classList.add('animated');
      glow.classList.add('animated');
    }
  }, 200);
});
