/* ========================================
   EVENTS — math·logic
   Универсальная система событий
   В будущем легко расширяется:
   progress:update, level:update,
   streak:update, achievement:unlock,
   user:update
   ======================================== */

const EVENTS = (function() {

  function emit(name, detail) {
    try {
      document.dispatchEvent(new CustomEvent(name, {
        bubbles: true,
        detail: detail || {},
      }));
    } catch(e) { /* silent */ }
  }

  function on(name, callback) {
    document.addEventListener(name, callback);
  }

  function off(name, callback) {
    document.removeEventListener(name, callback);
  }

  return { emit, on, off };
})();

/* ---------- Безопасный XP-stub ----------
   Если xp.js не загрузился, window.XP не даёт
   приложению упасть.  При успешной загрузке
   xp.js перезаписывает этот заглушечный объект. */

  if (typeof XP === 'undefined') {
  window.XP = {
    addXP:       function() { return 0; },
    setXP:       function() { return 0; },
    getXP:       function() { return 0; },
    getLevel:    function() { return 1; },
    calcLevel:   function() { return 1; },
    calcXpForLevel: function() { return 100; },
    getLevelProgress: function() {
      return { xp:0, level:1, xpForCurrent:0, xpForNext:100, progress:0, remaining:100 };
    },
  };
  console.warn('[ML] XP module not loaded — using stub');
}
