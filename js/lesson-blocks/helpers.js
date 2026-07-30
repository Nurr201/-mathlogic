window.__BlockHelpers = (function() {

  function wrap(html, extra) {
    extra = extra || {};
    var cls = 'max-w-3xl mx-auto p-8 sm:p-14 animate-fade';
    if (extra.className) cls += ' ' + extra.className;
    return '<div class="' + cls + '">' + html + '</div>';
  }

  function progress(index, total) {
    var pct = total > 0 ? Math.round(((index) / total) * 100) : 0;
    return '<div class="flex items-center gap-3 mb-8">' +
      '<div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">' +
      '<div class="h-full bg-blue-500 rounded-full transition-all duration-500" style="width:' + pct + '%"></div>' +
      '</div>' +
      '<span class="text-xs font-bold text-slate-400 font-mono">' + (index + 1) + '/' + total + '</span>' +
      '</div>';
  }

  function blockBadge(text) {
    return '<span class="inline-block px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">' + text + '</span>';
  }

  function btnPrimary(text, onClick) {
    return '<button onclick="' + onClick + '" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all flex items-center gap-3 hover:-translate-y-0.5 active:translate-y-0">' +
      text +
      ' <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>' +
      '</button>';
  }

  function formulaBlock(latex) {
    return '<div class="my-6 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center font-mono text-3xl sm:text-4xl font-extrabold text-slate-900">' +
      latex +
      '</div>';
  }

  function feedbackBlock(correct, explanation) {
    var color = correct ? 'emerald' : 'amber';
    var icon = correct
      ? '<svg class="w-6 h-6 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
      : '<svg class="w-6 h-6 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>';
    var text = correct ? '\u0412\u0435\u0440\u043D\u043E!' : '\u041D\u0435 \u0441\u043E\u0432\u0441\u0435\u043C';
    return '<div class="mb-6 p-5 rounded-2xl text-base font-bold flex items-start gap-3 bg-' + color + '-50 text-' + color + '-800 border border-' + color + '-200 animate-fade">' +
      icon +
      '<div><div class="font-extrabold">' + text + '</div>' + (explanation ? '<div class="text-sm font-medium mt-1 opacity-80">' + explanation + '</div>' : '') + '</div>' +
      '</div>';
  }

  return {
    wrap: wrap,
    progress: progress,
    blockBadge: blockBadge,
    btnPrimary: btnPrimary,
    formulaBlock: formulaBlock,
    feedbackBlock: feedbackBlock,
  };

})();
