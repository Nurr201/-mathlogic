/* ============================================
   ACHIEVEMENT ENGINE — math·logic
   ============================================
   Центральная система достижений.
   Автоматически слушает события и отслеживает
   прогресс. При выполнении — начисляет XP,
   добавляет запись в timeline и показывает toast.
   ============================================ */

window.Achievements = (function() {

  /* ==========================================
     КОНСТАНТЫ
     ========================================== */

  var STORAGE_KEY = 'achievements';

  var RARITY_XP = {
    common: 50,
    rare: 100,
    epic: 200,
    legendary: 500,
  };

  /* ==========================================
     ОПРЕДЕЛЕНИЯ ДОСТИЖЕНИЙ
     ========================================== */

  var DEFINITIONS = [
    // --- УРОКИ ---
    {
      id: 'first_lesson',
      title: '\u041F\u0435\u0440\u0432\u044B\u0439 \u0443\u0440\u043E\u043A',
      desc: '\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0435 \u0441\u0432\u043E\u0439 \u043F\u0435\u0440\u0432\u044B\u0439 \u0443\u0440\u043E\u043A \u043D\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435',
      condition: '\u041F\u0440\u043E\u0439\u0442\u0438 1 \u0443\u0440\u043E\u043A',
      icon: '\uD83C\uDF93',
      rarity: 'common',
      target: 1,
      hidden: false,
    },
    {
      id: 'five_lessons',
      title: '5 \u0443\u0440\u043E\u043A\u043E\u0432',
      desc: '\u0412\u044B \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0438 5 \u0443\u0440\u043E\u043A\u043E\u0432. \u041E\u0442\u043B\u0438\u0447\u043D\u043E\u0435 \u043D\u0430\u0447\u0430\u043B\u043E!',
      condition: '\u041F\u0440\u043E\u0439\u0442\u0438 5 \u0443\u0440\u043E\u043A\u043E\u0432',
      icon: '\uD83D\uDCDA',
      rarity: 'common',
      target: 5,
      hidden: false,
    },
    {
      id: 'ten_lessons',
      title: '10 \u0443\u0440\u043E\u043A\u043E\u0432',
      desc: '\u0412\u044B \u043F\u0440\u043E\u0448\u043B\u0438 10 \u0443\u0440\u043E\u043A\u043E\u0432 \u2014 \u0443\u0436\u0435 \u043D\u0435\u043F\u043B\u043E\u0445\u043E\u0439 \u0431\u0430\u0433\u0430\u0436!',
      condition: '\u041F\u0440\u043E\u0439\u0442\u0438 10 \u0443\u0440\u043E\u043A\u043E\u0432',
      icon: '\uD83D\uDCD8',
      rarity: 'rare',
      target: 10,
      hidden: false,
    },
    {
      id: 'twentyfive_lessons',
      title: '25 \u0443\u0440\u043E\u043A\u043E\u0432',
      desc: '\u0427\u0435\u0442\u0432\u0435\u0440\u0442\u044C \u043F\u0443\u0442\u0438 \u043F\u043E\u0437\u0430\u0434\u0438! 25 \u0443\u0440\u043E\u043A\u043E\u0432 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E.',
      condition: '\u041F\u0440\u043E\u0439\u0442\u0438 25 \u0443\u0440\u043E\u043A\u043E\u0432',
      icon: '\uD83D\uDCD6',
      rarity: 'rare',
      target: 25,
      hidden: false,
    },
    {
      id: 'fifty_lessons',
      title: '50 \u0443\u0440\u043E\u043A\u043E\u0432',
      desc: '\u041F\u043E\u043B\u043E\u0432\u0438\u043D\u0430 \u043F\u0443\u0442\u0438! 50 \u0443\u0440\u043E\u043A\u043E\u0432 \u043F\u043E\u0437\u0430\u0434\u0438.',
      condition: '\u041F\u0440\u043E\u0439\u0442\u0438 50 \u0443\u0440\u043E\u043A\u043E\u0432',
      icon: '\uD83C\uDFC6',
      rarity: 'epic',
      target: 50,
      hidden: false,
    },
    {
      id: 'hundred_lessons',
      title: '100 \u0443\u0440\u043E\u043A\u043E\u0432',
      desc: '\u0426\u0435\u043B\u0430\u044F \u0441\u043E\u0442\u043D\u044F \u0443\u0440\u043E\u043A\u043E\u0432! \u0412\u044B \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u0433\u0435\u0440\u043E\u0439.',
      condition: '\u041F\u0440\u043E\u0439\u0442\u0438 100 \u0443\u0440\u043E\u043A\u043E\u0432',
      icon: '\uD83D\uDC51',
      rarity: 'legendary',
      target: 100,
      hidden: false,
    },

    // --- ОЦЕНКИ ---
    {
      id: 'first_grade_a',
      title: '\u041F\u0435\u0440\u0432\u0430\u044F \u043F\u044F\u0442\u0451\u0440\u043A\u0430',
      desc: '\u0412\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 \u0441\u0432\u043E\u044E \u043F\u0435\u0440\u0432\u0443\u044E \u043E\u0446\u0435\u043D\u043A\u0443 A. \u0422\u0430\u043A \u0434\u0435\u0440\u0436\u0430\u0442\u044C!',
      condition: '\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0443 A',
      icon: '\uD83C\uDF1F',
      rarity: 'common',
      target: 1,
      hidden: false,
    },
    {
      id: 'ten_grade_a',
      title: '10 \u043F\u044F\u0442\u0451\u0440\u043E\u043A',
      desc: '\u0412\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 10 \u043E\u0446\u0435\u043D\u043E\u043A A. \u041E\u0442\u043B\u0438\u0447\u043D\u044B\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442!',
      condition: '\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C 10 \u043E\u0446\u0435\u043D\u043E\u043A A',
      icon: '\uD83C\uDFAF',
      rarity: 'rare',
      target: 10,
      hidden: false,
    },
    {
      id: 'perfect_score',
      title: '\u0418\u0434\u0435\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442',
      desc: '\u0412\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 100% \u043D\u0430 \u0443\u0440\u043E\u043A\u0435. \u0411\u0435\u0437\u0443\u043F\u0440\u0435\u0447\u043D\u043E!',
      condition: '\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C 100% \u0437\u0430 \u0443\u0440\u043E\u043A',
      icon: '\uD83C\uDF1F',
      rarity: 'common',
      target: 1,
      hidden: false,
    },

    // --- ЗАДАЧИ ---
    {
      id: 'hundred_problems',
      title: '100 \u0437\u0430\u0434\u0430\u0447',
      desc: '\u0412\u044B \u0440\u0435\u0448\u0438\u043B\u0438 100 \u0437\u0430\u0434\u0430\u0447. \u041E\u0442\u043B\u0438\u0447\u043D\u0430\u044F \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0430!',
      condition: '\u0420\u0435\u0448\u0438\u0442\u044C 100 \u0437\u0430\u0434\u0430\u0447',
      icon: '\uD83D\uDCDD',
      rarity: 'common',
      target: 100,
      hidden: false,
    },
    {
      id: 'fivehundred_problems',
      title: '500 \u0437\u0430\u0434\u0430\u0447',
      desc: '\u0412\u044B \u0440\u0435\u0448\u0438\u043B\u0438 500 \u0437\u0430\u0434\u0430\u0447. \u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u0442\u0440\u0443\u0434\u043E\u043B\u044E\u0431!',
      condition: '\u0420\u0435\u0448\u0438\u0442\u044C 500 \u0437\u0430\u0434\u0430\u0447',
      icon: '\uD83D\uDCD0',
      rarity: 'epic',
      target: 500,
      hidden: false,
    },

    // --- XP ---
    {
      id: 'thousand_xp',
      title: '1000 XP',
      desc: '\u0412\u044B \u043D\u0430\u043A\u043E\u043F\u0438\u043B\u0438 1000 XP. \u0425\u043E\u0440\u043E\u0448\u0438\u0439 \u0441\u0442\u0430\u0440\u0442!',
      condition: '\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C 1000 XP',
      icon: '\u2B50',
      rarity: 'common',
      target: 1000,
      hidden: false,
    },
    {
      id: 'fivethousand_xp',
      title: '5000 XP',
      desc: '\u0412\u044B \u043D\u0430\u043A\u043E\u043F\u0438\u043B\u0438 5000 XP. \u0412\u043F\u0435\u0447\u0430\u0442\u043B\u044F\u044E\u0449\u0438\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442!',
      condition: '\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C 5000 XP',
      icon: '\uD83C\uDFC5',
      rarity: 'rare',
      target: 5000,
      hidden: false,
    },

    // --- УРОВНИ ---
    {
      id: 'level_5',
      title: '\u0423\u0440\u043E\u0432\u0435\u043D\u044C 5',
      desc: '\u0412\u044B \u0434\u043E\u0441\u0442\u0438\u0433\u043B\u0438 5 \u0443\u0440\u043E\u0432\u043D\u044F. \u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0439\u0442\u0435 \u0440\u043E\u0441\u0442\u0438!',
      condition: '\u0414\u043E\u0441\u0442\u0438\u0447\u044C 5 \u0443\u0440\u043E\u0432\u043D\u044F',
      icon: '\uD83D\uDEE1\uFE0F',
      rarity: 'common',
      target: 5,
      hidden: false,
    },
    {
      id: 'level_10',
      title: '\u0423\u0440\u043E\u0432\u0435\u043D\u044C 10',
      desc: '\u0412\u044B \u0434\u043E\u0441\u0442\u0438\u0433\u043B\u0438 10 \u0443\u0440\u043E\u0432\u043D\u044F. \u0412\u044B \u0443\u0436\u0435 \u043E\u043F\u044B\u0442\u043D\u044B\u0439 \u0443\u0447\u0435\u043D\u0438\u043A!',
      condition: '\u0414\u043E\u0441\u0442\u0438\u0447\u044C 10 \u0443\u0440\u043E\u0432\u043D\u044F',
      icon: '\uD83D\uDCAA',
      rarity: 'rare',
      target: 10,
      hidden: false,
    },
    {
      id: 'level_20',
      title: '\u0423\u0440\u043E\u0432\u0435\u043D\u044C 20',
      desc: '\u0412\u044B \u0434\u043E\u0441\u0442\u0438\u0433\u043B\u0438 20 \u0443\u0440\u043E\u0432\u043D\u044F! \u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u043C\u0430\u0441\u0442\u0435\u0440 \u043C\u0430\u0442\u0435\u043C\u0430\u0442\u0438\u043A\u0438.',
      condition: '\u0414\u043E\u0441\u0442\u0438\u0447\u044C 20 \u0443\u0440\u043E\u0432\u043D\u044F',
      icon: '\uD83C\uDFC6',
      rarity: 'epic',
      target: 20,
      hidden: false,
    },

    // --- СЕРИИ ---
    {
      id: 'streak_3',
      title: '\u0421\u0435\u0440\u0438\u044F 3 \u0434\u043D\u044F',
      desc: '\u0412\u044B \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442\u0435\u0441\u044C 3 \u0434\u043D\u044F \u043F\u043E\u0434\u0440\u044F\u0434. \u0425\u043E\u0440\u043E\u0448\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430!',
      condition: '\u0417\u0430\u043D\u0438\u043C\u0430\u0442\u044C\u0441\u044F 3 \u0434\u043D\u044F \u043F\u043E\u0434\u0440\u044F\u0434',
      icon: '\uD83D\uDD25',
      rarity: 'common',
      target: 3,
      hidden: false,
    },
    {
      id: 'streak_7',
      title: '\u0421\u0435\u0440\u0438\u044F 7 \u0434\u043D\u0435\u0439',
      desc: '\u0426\u0435\u043B\u0430\u044F \u043D\u0435\u0434\u0435\u043B\u044F \u0431\u0435\u0437 \u043F\u0435\u0440\u0435\u0440\u044B\u0432\u0430! \u0412\u044B \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u0447\u0435\u043C\u043F\u0438\u043E\u043D.',
      condition: '\u0417\u0430\u043D\u0438\u043C\u0430\u0442\u044C\u0441\u044F 7 \u0434\u043D\u0435\u0439 \u043F\u043E\u0434\u0440\u044F\u0434',
      icon: '\uD83D\uDD25',
      rarity: 'rare',
      target: 7,
      hidden: false,
    },
    {
      id: 'streak_30',
      title: '\u0421\u0435\u0440\u0438\u044F 30 \u0434\u043D\u0435\u0439',
      desc: '\u041C\u0435\u0441\u044F\u0446 \u0431\u0435\u0437 \u043F\u0435\u0440\u0435\u0440\u044B\u0432\u0430! \u0412\u044B \u043D\u0435\u043F\u0440\u0435\u0432\u0437\u043E\u0439\u0434\u0435\u043D\u043D\u044B.',
      condition: '\u0417\u0430\u043D\u0438\u043C\u0430\u0442\u044C\u0441\u044F 30 \u0434\u043D\u0435\u0439 \u043F\u043E\u0434\u0440\u044F\u0434',
      icon: '\uD83C\uDF1F',
      rarity: 'legendary',
      target: 30,
      hidden: false,
    },

    // --- ПРЕДМЕТЫ ---
    {
      id: 'algebra_master',
      title: '\u041C\u0430\u0441\u0442\u0435\u0440 \u0430\u043B\u0433\u0435\u0431\u0440\u044B',
      desc: '\u0412\u044B \u0438\u0437\u0443\u0447\u0438\u043B\u0438 \u0432\u0435\u0441\u044C \u0440\u0430\u0437\u0434\u0435\u043B \u0430\u043B\u0433\u0435\u0431\u0440\u044B. \u0411\u043B\u0435\u0441\u0442\u044F\u0449\u0435!',
      condition: '\u0418\u0437\u0443\u0447\u0438\u0442\u044C \u0432\u0435\u0441\u044C \u0440\u0430\u0437\u0434\u0435\u043B \u0430\u043B\u0433\u0435\u0431\u0440\u044B',
      icon: '\uD83D\uDCD8',
      rarity: 'epic',
      target: 1,
      hidden: false,
    },
    {
      id: 'geometry_master',
      title: '\u041C\u0430\u0441\u0442\u0435\u0440 \u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u0438',
      desc: '\u0412\u044B \u0438\u0437\u0443\u0447\u0438\u043B\u0438 \u0432\u0435\u0441\u044C \u0440\u0430\u0437\u0434\u0435\u043B \u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u0438. \u0412\u0435\u043B\u0438\u043A\u043E\u043B\u0435\u043F\u043D\u043E!',
      condition: '\u0418\u0437\u0443\u0447\u0438\u0442\u044C \u0432\u0435\u0441\u044C \u0440\u0430\u0437\u0434\u0435\u043B \u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u0438',
      icon: '\uD83D\uDCD0',
      rarity: 'epic',
      target: 1,
      hidden: false,
    },
    {
      id: 'logic_master',
      title: '\u041C\u0430\u0441\u0442\u0435\u0440 \u043B\u043E\u0433\u0438\u043A\u0438',
      desc: '\u0412\u044B \u0438\u0437\u0443\u0447\u0438\u043B\u0438 \u0432\u0435\u0441\u044C \u0440\u0430\u0437\u0434\u0435\u043B \u043B\u043E\u0433\u0438\u043A\u0438. \u042F\u0440\u043A\u0438\u0439 \u0443\u043C!',
      condition: '\u0418\u0437\u0443\u0447\u0438\u0442\u044C \u0432\u0435\u0441\u044C \u0440\u0430\u0437\u0434\u0435\u043B \u043B\u043E\u0433\u0438\u043A\u0438',
      icon: '\uD83E\uDDE0',
      rarity: 'epic',
      target: 1,
      hidden: false,
    },

    // --- РАЗНОЕ ---
    {
      id: 'first_topic',
      title: '\u041F\u0435\u0440\u0432\u0430\u044F \u0442\u0435\u043C\u0430',
      desc: '\u0412\u044B \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0438\u0437\u0443\u0447\u0438\u043B\u0438 \u043E\u0434\u043D\u0443 \u0442\u0435\u043C\u0443. \u041E\u0442\u043B\u0438\u0447\u043D\u043E!',
      condition: '\u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0438\u0437\u0443\u0447\u0438\u0442\u044C \u043E\u0434\u043D\u0443 \u0442\u0435\u043C\u0443',
      icon: '\uD83D\uDCD6',
      rarity: 'common',
      target: 1,
      hidden: false,
    },
    {
      id: 'erudite',
      title: '\u042D\u0440\u0443\u0434\u0438\u0442',
      desc: '\u0412\u044B \u0438\u0437\u0443\u0447\u0438\u043B\u0438 \u0445\u043E\u0442\u044F \u0431\u044B \u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443 \u0443\u0440\u043E\u043A\u0443 \u0438\u0437 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u0430.',
      condition: '\u0418\u0437\u0443\u0447\u0438\u0442\u044C \u0443\u0440\u043E\u043A\u0438 \u0438\u0437 \u0432\u0441\u0435\u0445 \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u043E\u0432',
      icon: '\uD83C\uDFF0',
      rarity: 'rare',
      target: 1,
      hidden: false,
    },
    {
      id: 'ten_topics',
      title: '\u042D\u043D\u0446\u0438\u043A\u043B\u043E\u043F\u0435\u0434\u0438\u044F',
      desc: '\u0412\u044B \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0438\u0437\u0443\u0447\u0438\u043B\u0438 10 \u0442\u0435\u043C.',
      condition: '\u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0438\u0437\u0443\u0447\u0438\u0442\u044C 10 \u0442\u0435\u043C',
      icon: '\uD83D\uDCDA',
      rarity: 'rare',
      target: 10,
      hidden: false,
    },
    {
      id: 'collector_10',
      title: '\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u0435\u0440',
      desc: '\u0412\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 10 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0439. \u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u044F \u0440\u0430\u0441\u0442\u0451\u0442!',
      condition: '\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C 10 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0439',
      icon: '\uD83D\uDCBC',
      rarity: 'epic',
      target: 10,
      hidden: false,
    },
  ];

  /* ==========================================
     ВНУТРЕННЕЕ: ХРАНЕНИЕ
     ========================================== */

  function loadAll() {
    var data = ML.get(STORAGE_KEY, []);
    if (!Array.isArray(data)) return [];
    return data;
  }

  function saveAll(data) {
    ML.set(STORAGE_KEY, data);
  }

  function getAchievement(id) {
    var data = loadAll();
    for (var i = 0; i < data.length; i++) {
      if (data[i].id === id) return data[i];
    }
    return null;
  }

  /* ==========================================
     ВНУТРЕННЕЕ: ИНИЦИАЛИЗАЦИЯ ДОСТИЖЕНИЙ
     ========================================== */

  function define() {
    var stored = loadAll();
    var retired = { first_quest: true, thirty_quests: true };
    var existing = stored.filter(function(item) { return !retired[item.id]; });
    var complete = DEFINITIONS.every(function(def) {
      return existing.some(function(item) { return item.id === def.id; });
    });
    if (complete) {
      if (existing.length !== stored.length) saveAll(existing);
      return;
    }

    var merged = DEFINITIONS.map(function(def) {
      for (var i = 0; i < existing.length; i++) {
        if (existing[i].id === def.id) return existing[i];
      }

      return {
        id: def.id,
        name: def.title,
        desc: def.desc,
        icon: def.icon,
        rarity: def.rarity,
        condition: def.condition,
        status: 'locked',
        progress: 0,
        total: def.target,
        date: null,
        rewardXP: RARITY_XP[def.rarity] || 50,
        hidden: def.hidden || false,
        completed: false,
        completedAt: null,
      };
    });

    saveAll(merged);
  }

  /* ==========================================
     ВНУТРЕННЕЕ: ФОРМАТИРОВАНИЕ ДАТЫ
     ========================================== */

  function formatDate(ts) {
    if (!ts) return null;
    var d = new Date(ts);
    var months = [
      '\u042F\u043D\u0432\u0430\u0440\u044F', '\u0424\u0435\u0432\u0440\u0430\u043B\u044F',
      '\u041C\u0430\u0440\u0442\u0430', '\u0410\u043F\u0440\u0435\u043B\u044F',
      '\u041C\u0430\u044F', '\u0418\u044E\u043D\u044F',
      '\u0418\u044E\u043B\u044F', '\u0410\u0432\u0433\u0443\u0441\u0442\u0430',
      '\u0421\u0435\u043D\u0442\u044F\u0431\u0440\u044F', '\u041E\u043A\u0442\u044F\u0431\u0440\u044F',
      '\u041D\u043E\u044F\u0431\u0440\u044F', '\u0414\u0435\u043A\u0430\u0431\u0440\u044F',
    ];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ==========================================
     ВНУТРЕННЕЕ: ПРОВЕРКА ПРОГРЕССА
     ========================================== */

  function countAGrades() {
    var lessons = ML.getCompletedLessons();
    var count = 0;
    for (var key in lessons) {
      var lesson = lessons[key];
      if (lesson.grade === 'A' || lesson.grade === 'S') count++;
    }
    return count;
  }

  function countSubjectsWithLessons() {
    if (typeof Learning === 'undefined' || !Learning.getSubjects) return 0;
    var subjects = Learning.getSubjects();
    var count = 0;
    for (var i = 0; i < subjects.length; i++) {
      if (subjects[i].completedLessons > 0) count++;
    }
    return count;
  }

  function countCompletedTopics() {
    if (typeof Learning === 'undefined' || !Learning.getCourse) return 0;
    var course = Learning.getCourse();
    if (!course || !Array.isArray(course)) return 0;
    var count = 0;
    for (var si = 0; si < course.length; si++) {
      var topics = course[si].topics || [];
      for (var ti = 0; ti < topics.length; ti++) {
        if (topics[ti].totalLessons > 0) {
          var completed = 0;
          var stateTests = Learning.getLessonState;
          if (!stateTests) continue;
          for (var li = 0; li < topics[ti].lessons.length; li++) {
            var lid = topics[ti].lessons[li].id;
            if (stateTests(lid) === 'completed') completed++;
          }
          if (completed >= topics[ti].totalLessons) count++;
        }
      }
    }
    return count;
  }

  function countPerfectScores() {
    var lessons = ML.getCompletedLessons();
    var count = 0;
    for (var key in lessons) {
      if (lessons[key].score >= 100) count++;
    }
    return count;
  }

  function isSubjectFullyCompleted(subjectKey) {
    if (typeof Learning === 'undefined' || !Learning.getCourse) return false;
    var course = Learning.getCourse();
    if (!course || !Array.isArray(course)) return false;
    for (var si = 0; si < course.length; si++) {
      if (course[si].key === subjectKey) {
        var lessons = course[si].lessons;
        if (!lessons || lessons.length === 0) return false;
        for (var li = 0; li < lessons.length; li++) {
          var st = Learning.getLessonState;
          if (!st || st(lessons[li].id) !== 'completed') return false;
        }
        return true;
      }
    }
    return false;
  }

  /* ==========================================
     ЯДРО: ПРОВЕРКА ВСЕХ ДОСТИЖЕНИЙ
     ========================================== */

  function check() {
    var completedLessons = 0;
    var user = null;
    var xp = 0;
    var level = 1;
    var streak = 0;
    var problemsSolved = 0;
    var aGradeCount = 0;
    /* --- Собираем текущее состояние --- */
    if (typeof Learning !== 'undefined' && Learning.getTotalCompletedLessons) {
      completedLessons = Learning.getTotalCompletedLessons();
    }
    if (typeof XP !== 'undefined') {
      xp = XP.getXP ? XP.getXP() : 0;
      level = XP.getLevel ? XP.getLevel() : 1;
    }
    if (typeof ML !== 'undefined') {
      user = ML.getUser ? ML.getUser() : null;
      problemsSolved = ML.getProfileStat ? ML.getProfileStat('problems_solved', 0) : 0;
      aGradeCount = countAGrades();
    }
    if (user) {
      streak = user.streak || 0;
    }

    var data = loadAll();
    var changed = false;
    var justUnlocked = [];

    for (var i = 0; i < data.length; i++) {
      var ach = data[i];
      if (ach.completed) continue;

      var target = ach.total;
      var progress = 0;

      switch (ach.id) {
        /* --- Уроки --- */
        case 'first_lesson':
          progress = completedLessons;
          break;
        case 'five_lessons':
          progress = completedLessons;
          break;
        case 'ten_lessons':
          progress = completedLessons;
          break;
        case 'twentyfive_lessons':
          progress = completedLessons;
          break;
        case 'fifty_lessons':
          progress = completedLessons;
          break;
        case 'hundred_lessons':
          progress = completedLessons;
          break;

        /* --- Оценки --- */
        case 'first_grade_a':
          progress = aGradeCount;
          break;
        case 'ten_grade_a':
          progress = aGradeCount;
          break;
        case 'perfect_score':
          progress = countPerfectScores();
          break;

        /* --- Задачи --- */
        case 'hundred_problems':
          progress = problemsSolved;
          break;
        case 'fivehundred_problems':
          progress = problemsSolved;
          break;

        /* --- XP --- */
        case 'thousand_xp':
          progress = xp;
          break;
        case 'fivethousand_xp':
          progress = xp;
          break;

        /* --- Уровни --- */
        case 'level_5':
          progress = level;
          break;
        case 'level_10':
          progress = level;
          break;
        case 'level_20':
          progress = level;
          break;

        /* --- Серии --- */
        case 'streak_3':
          progress = streak;
          break;
        case 'streak_7':
          progress = streak;
          break;
        case 'streak_30':
          progress = streak;
          break;

        /* --- Предметы --- */
        case 'algebra_master':
          progress = isSubjectFullyCompleted('algebra') ? 1 : 0;
          break;
        case 'geometry_master':
          progress = isSubjectFullyCompleted('geometry') ? 1 : 0;
          break;
        case 'logic_master':
          progress = isSubjectFullyCompleted('logic') ? 1 : 0;
          break;

        /* --- Разное --- */
        case 'first_topic':
          progress = countCompletedTopics();
          break;
        case 'erudite':
          if (countSubjectsWithLessons() >= 4) {
            progress = 1;
          }
          break;
        case 'ten_topics':
          progress = countCompletedTopics();
          break;
        case 'collector_10':
          var c10 = 0;
          for (var j = 0; j < data.length; j++) {
            if (data[j].completed) c10++;
          }
          progress = c10;
          break;
      }

      progress = Math.min(progress, target);

      if (progress < 0) progress = 0;

      if (progress !== ach.progress) {
        ach.progress = progress;
        changed = true;
      }

      if (ach.status === 'locked' && progress > 0) {
        ach.status = 'in-progress';
        changed = true;
      }

      if (progress >= target && !ach.completed) {
        ach.completed = true;
        ach.completedAt = Date.now();
        ach.date = formatDate(ach.completedAt);
        ach.status = 'unlocked';
        ach.progress = target;
        changed = true;
        justUnlocked.push(ach);
      }
    }

    if (changed) saveAll(data);

    for (var k = 0; k < justUnlocked.length; k++) {
      unlockReward(justUnlocked[k]);
    }
  }

  /* ==========================================
     ВНУТРЕННЕЕ: НАЧИСЛЕНИЕ НАГРАДЫ
     ========================================== */

  function unlockReward(ach) {
    /* --- Начисляем XP --- */
    if (typeof XP !== 'undefined' && XP.awardOnce) {
      XP.awardOnce('achievement:' + ach.id, ach.rewardXP, 'achievement:' + ach.id);
    }

    /* --- Запись в timeline --- */
    if (typeof ML !== 'undefined' && ML.addTimelineEntry) {
      ML.addTimelineEntry({
        icon: '\uD83C\uDFC6',
        title: '\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0435: ' + ach.name,
        desc: '+' + ach.rewardXP + ' XP',
        color: 'bg-amber-500',
      });
    }

    /* --- Toast --- */
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(
        '\uD83C\uDFC6 \u041D\u043E\u0432\u043E\u0435 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0435: ' + ach.name + '! +' + ach.rewardXP + ' XP',
        'success'
      );
    }

    /* --- Событие --- */
    try {
      if (typeof EVENTS !== 'undefined' && EVENTS.emit) {
        EVENTS.emit('achievement:unlock', { id: ach.id, name: ach.name });
      } else {
        document.dispatchEvent(new CustomEvent('achievement:unlock', {
          detail: { id: ach.id, name: ach.name },
          bubbles: true,
        }));
      }
    } catch(e) {}

    /* --- Обновляем счётчик --- */
    var data = loadAll();
    var unlocked = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i].completed) unlocked++;
    }
    if (typeof ML !== 'undefined') {
      ML.set('stats.achievements_count', unlocked);
    }
  }

  /* ==========================================
     СЛУШАТЕЛИ СОБЫТИЙ
     ========================================== */

  function listen() {
    document.addEventListener('lesson:completed', function() {
      check();
    });

    document.addEventListener('xp:update', function() {
      check();
    });

    document.addEventListener('progress:update', function() {
      check();
    });

    document.addEventListener('streak:update', function() {
      check();
    });
  }

  /* ==========================================
     ИНИЦИАЛИЗАЦИЯ
     ========================================== */

  function init() {
    define();
    listen();
    check();
  }

  /* --- Автоинициализация при загрузке --- */
  init();

  /* ==========================================
     ПУБЛИЧНЫЙ API
     ========================================== */

  return {
    init: init,

    check: check,

    unlock: function(id) {
      var data = loadAll();
      for (var i = 0; i < data.length; i++) {
        if (data[i].id === id && !data[i].completed) {
          data[i].completed = true;
          data[i].completedAt = Date.now();
          data[i].date = formatDate(data[i].completedAt);
          data[i].status = 'unlocked';
          data[i].progress = data[i].total;
          saveAll(data);
          unlockReward(data[i]);
          return true;
        }
      }
      return false;
    },

    isUnlocked: function(id) {
      var ach = getAchievement(id);
      return ach ? ach.completed : false;
    },

    getAll: function() {
      return loadAll();
    },

    getUnlocked: function() {
      var data = loadAll();
      var result = [];
      for (var i = 0; i < data.length; i++) {
        if (data[i].completed) result.push(data[i]);
      }
      return result;
    },

    getProgress: function(id) {
      var ach = getAchievement(id);
      if (!ach) return null;
      return {
        progress: ach.progress,
        total: ach.total,
        completed: ach.completed,
      };
    },

    getStats: function() {
      var data = loadAll();
      var unlocked = 0;
      var totalXp = 0;
      var byRarity = {};

      for (var i = 0; i < data.length; i++) {
        var a = data[i];
        if (!byRarity[a.rarity]) {
          byRarity[a.rarity] = { total: 0, unlocked: 0 };
        }
        byRarity[a.rarity].total++;
        if (a.completed) {
          byRarity[a.rarity].unlocked++;
          unlocked++;
          totalXp += a.rewardXP || 0;
        }
      }

      return {
        total: data.length,
        unlocked: unlocked,
        progress: data.length > 0 ? Math.round((unlocked / data.length) * 100) : 0,
        totalXpEarned: totalXp,
        byRarity: byRarity,
      };
    },
  };

})();
