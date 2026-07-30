window.__BlockRegistry = (function() {

  var _renderers = {};

  function register(type, renderer) {
    if (typeof type !== 'string' || typeof renderer !== 'function') return false;
    _renderers[type] = renderer;
    return true;
  }

  function unregister(type) {
    delete _renderers[type];
  }

  function has(type) {
    return typeof _renderers[type] === 'function';
  }

  function get(type) {
    return _renderers[type] || null;
  }

  function render(type, block, ctx) {
    var fn = get(type);
    if (!fn) return null;
    try {
      return fn(block, ctx);
    } catch (e) {
      console.error('[LessonBlocks] Renderer crashed:', type, e);
      return null;
    }
  }

  function registeredTypes() {
    return Object.keys(_renderers);
  }

  return {
    register: register,
    unregister: unregister,
    has: has,
    get: get,
    render: render,
    registeredTypes: registeredTypes,
  };

})();
