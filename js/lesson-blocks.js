window.LessonBlocks = (function() {
  var R = window.__BlockRenderers;
  var registry = window.__BlockRegistry;

  registry.register('hero', R.renderHero);
  registry.register('goal', R.renderGoal);
  registry.register('warmup', R.renderWarmup);
  registry.register('anchor', R.renderAnchor);
  registry.register('theory', R.renderTheory);
  registry.register('quiz', R.renderQuiz);
  registry.register('input', R.renderInput);
  registry.register('mistake', R.renderMistake);
  registry.register('sandbox', R.renderSandbox);
  registry.register('challenge', R.renderChallenge);
  registry.register('reflection', R.renderReflection);
  registry.register('result', R.renderResult);

  return {
    register: registry.register,
    unregister: registry.unregister,
    has: registry.has,
    get: registry.get,
    render: registry.render,
    registeredTypes: registry.registeredTypes,

    hero: R.renderHero,
    goal: R.renderGoal,
    warmup: R.renderWarmup,
    anchor: R.renderAnchor,
    theory: R.renderTheory,
    quiz: R.renderQuiz,
    input: R.renderInput,
    mistake: R.renderMistake,
    sandbox: R.renderSandbox,
    challenge: R.renderChallenge,
    reflection: R.renderReflection,
    result: R.renderResult,

    _selectOption: R._selectOption,
    _getSelected: R._getSelected,
    _checkInput: R._checkInput,
    _updateSandbox: R._updateSandbox,
    _submitQuiz: R._submitQuiz,
    _submitWarmup: R._submitWarmup,
    _submitPendingResult: R._submitPendingResult,
  };

})();
