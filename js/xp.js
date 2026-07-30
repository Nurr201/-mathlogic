/* ========================================
   XP SYSTEM — math·logic
   Единый модуль управления опытом и уровнем
   ======================================== */

window.XP = (function() {

  const EVENT_NAME = 'xp:update';
  const LEVEL_BASE = 100;

  /* ---------- РАСЧЁТЫ ---------- */

  function calcLevel(xp) {
    return Math.max(1, Math.floor(Math.sqrt(xp / LEVEL_BASE)) + 1);
  }

  function calcXpForLevel(level) {
    return level * level * LEVEL_BASE;
  }

  /* ---------- ЧТЕНИЕ ---------- */

  function getXP() {
    return ML.get('user.xp', 0);
  }

  function getLevel() {
    var xp = getXP();
    return calcLevel(xp);
  }

  function getLevelProgress() {
    var xp = getXP();
    var level = getLevel();
    var xpForCurrent = calcXpForLevel(level);
    var xpForNext = calcXpForLevel(level + 1);
    var levelXp = xpForNext - xpForCurrent;
    var progress = levelXp > 0 ? Math.round(((xp - xpForCurrent) / levelXp) * 100) : 100;
    return {
      xp: xp,
      level: level,
      xpForCurrent: xpForCurrent,
      xpForNext: xpForNext,
      progress: Math.max(0, Math.min(100, progress)),
      remaining: Math.max(0, xpForNext - xp),
    };
  }

  /* ---------- ЗАПИСЬ ---------- */

  function setXP(amount) {
    amount = Math.max(0, Math.floor(amount));
    var level = calcLevel(amount);
    var xpToNext = calcXpForLevel(level + 1) - amount;
    ML.set('user.xp', amount);
    ML.set('user.level', level);
    ML.set('user.xpToNext', Math.max(0, xpToNext));
    dispatch();
    return amount;
  }

  function addXP(amount, reason) {
    if (!amount || amount <= 0) return getXP();
    amount = Math.floor(amount);
    var current = getXP();
    var newXP = setXP(current + amount);
    var earned = ML.get('stats.xp_earned', 0) + amount;
    ML.set('stats.xp_earned', earned);
    return newXP;
  }

  function dispatch() {
    try {
      if (typeof EVENTS !== 'undefined' && EVENTS.emit) {
        EVENTS.emit(EVENT_NAME);
      } else {
        document.dispatchEvent(new CustomEvent(EVENT_NAME, { bubbles: true }));
      }
    } catch(e) {}
  }

  return {
    addXP: addXP,
    setXP: setXP,
    getXP: getXP,
    getLevel: getLevel,
    calcLevel: calcLevel,
    calcXpForLevel: calcXpForLevel,
    getLevelProgress: getLevelProgress,
  };
})();
