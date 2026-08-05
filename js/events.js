/* ========================================
   EVENTS — math·logic
   Нейтральная шина событий приложения.
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
