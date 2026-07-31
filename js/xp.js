/* ========================================
   XP SYSTEM — math·logic
   Уровень N начинается с (N - 1)^2 * 100 XP
   ======================================== */

window.XP = (function() {
  'use strict';

  const EVENT_NAME = 'xp:update';
  const LEVEL_BASE = 100;

  function calcLevel(xp) {
    xp = Math.max(0, Number(xp) || 0);
    return Math.floor(Math.sqrt(xp / LEVEL_BASE)) + 1;
  }

  function calcXpForLevel(level) {
    level = Math.max(1, Math.floor(Number(level) || 1));
    return Math.pow(level - 1, 2) * LEVEL_BASE;
  }

  function applyToData(data, amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    const level = calcLevel(amount);
    data.user.xp = amount;
    data.user.level = level;
    data.user.xpToNext = Math.max(0, calcXpForLevel(level + 1) - amount);
    return amount;
  }

  function getXP() { return ML.get('user.xp', 0); }
  function getLevel() { return calcLevel(getXP()); }

  function getLevelProgress() {
    const xp = getXP();
    const level = calcLevel(xp);
    const xpForCurrent = calcXpForLevel(level);
    const xpForNext = calcXpForLevel(level + 1);
    const span = Math.max(1, xpForNext - xpForCurrent);
    const progress = Math.round(((xp - xpForCurrent) / span) * 100);
    return {
      xp: xp,
      level: level,
      xpForCurrent: xpForCurrent,
      xpForNext: xpForNext,
      levelXp: xp - xpForCurrent,
      levelSpan: span,
      progress: Math.max(0, Math.min(100, progress)),
      remaining: Math.max(0, xpForNext - xp),
    };
  }

  function dispatch(detail) {
    try {
      const payload = detail || getLevelProgress();
      if (typeof EVENTS !== 'undefined' && EVENTS.emit) EVENTS.emit(EVENT_NAME, payload);
      else document.dispatchEvent(new CustomEvent(EVENT_NAME, { bubbles: true, detail: payload }));
    } catch (error) {
      console.warn('[XP] update event failed', error);
    }
  }

  function setXP(amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    ML.update(function(data) { applyToData(data, amount); });
    dispatch();
    return amount;
  }

  function addXP(amount, reason) {
    amount = Math.floor(Number(amount) || 0);
    if (amount <= 0) return getXP();
    let next = 0;
    ML.update(function(data) {
      next = applyToData(data, (data.user.xp || 0) + amount);
      data.stats.xp_earned = (data.stats.xp_earned || 0) + amount;
    });
    dispatch({ amount: amount, reason: reason || '', xp: next, level: calcLevel(next) });
    return next;
  }

  function awardOnce(rewardKey, amount, reason) {
    if (!rewardKey) return { awarded: false, xp: getXP() };
    amount = Math.floor(Number(amount) || 0);
    if (amount <= 0) return { awarded: false, xp: getXP() };
    let awarded = false;
    let next = getXP();
    ML.update(function(data) {
      if (data.rewards[rewardKey]) return;
      data.rewards[rewardKey] = { amount: amount, awardedAt: Date.now(), reason: reason || '' };
      next = applyToData(data, (data.user.xp || 0) + amount);
      data.stats.xp_earned = (data.stats.xp_earned || 0) + amount;
      awarded = true;
    });
    if (awarded) dispatch({ amount: amount, reason: reason || '', xp: next, level: calcLevel(next) });
    return { awarded: awarded, xp: next };
  }

  /* Пересчитывает производные поля, не меняя количество XP. */
  function reconcile() {
    ML.update(function(data) { applyToData(data, data.user.xp || 0); });
    return getLevelProgress();
  }

  reconcile();

  return {
    addXP: addXP,
    awardOnce: awardOnce,
    setXP: setXP,
    getXP: getXP,
    getLevel: getLevel,
    calcLevel: calcLevel,
    calcXpForLevel: calcXpForLevel,
    getLevelProgress: getLevelProgress,
    applyToData: applyToData,
    reconcile: reconcile,
    dispatch: dispatch,
  };
})();
