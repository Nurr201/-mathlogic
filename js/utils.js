/* ========================================
   UTILS — math·logic
   Общие утилиты
   ======================================== */

const UTILS = (function() {

  // Format time ago
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

  // Format number with spaces
  function formatNumber(val, suffix) {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M' + (suffix || '');
    if (val >= 1000) return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (suffix || '');
    return val + (suffix || '');
  }

  // Shuffle array
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Debounce
  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Get day label (KZ)
  const dayLabels = { Sun: 'ВС', Mon: 'ПН', Tue: 'ВТ', Wed: 'СР', Thu: 'ЧТ', Fri: 'ПТ', Sat: 'СБ' };

  function getDayLabel(dayName) {
    return dayLabels[dayName] || dayName;
  }

  return {
    timeAgo,
    formatNumber,
    shuffle,
    debounce,
    getDayLabel
  };
})();