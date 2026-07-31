/* Shared RU/KZ localization. Legacy global getLang/setLang are preserved. */

const I18N_DICTIONARY = {
  kz: {
    nav_dashboard: 'Дашборд', nav_subjects: 'Тақырыптар', nav_login: 'Кіру', nav_register: 'Тіркелу',
    hero_title: 'Математиканы <span style="color:#1D4ED8">түсініп</span> үйрен',
    hero_desc: 'Қазақ тіліндегі интерактивті сабақтар, тесттер және тапсырмалар. Теориядан практикаға — бір платформада.',
    btn_start: 'Бастау →', b1_title: 'Тақырыпты таңда', b1_desc: 'Алгебра немесе геометрия — өз деңгейіңе қарай таңдап, оқуды баста.',
    b2_title: 'Теорияны оқы', b2_desc: 'Қысқа әрі түсінікті түсіндірме және нақты мысалдар. Әр формуланың мағынасын түсінесің.',
    b3_title: 'Тапсырманы шеш', b3_desc: 'Интерактивті тесттер мен енгізу тапсырмалары. Қателессең — түсіндірме аласың.',
    b4_title: 'Нәтижеңді көр', b4_desc: 'Бірден дұрыс-бұрыс жауап, ұпай және прогресті бақылау. Әр қадамың есептеледі.',
    subj_title: '7–9 сынып бағдарламасы', topics_header: 'Қамтылған тақырыптар', cta_title: 'Бастауға дайынсың ба?',
    cta_desc: 'Кез келген тақырыпты қазір бастауға болады', f_contact: 'Байланыс', f_privacy: 'Құпиялылық',

    'subjects.algebra': 'Алгебра', 'subjects.geometry': 'Геометрия және тригонометрия', 'subjects.logic': 'Логика және графтар', 'subjects.numbers': 'Сандар және IT-база',
    'dashboard.navLearning': 'Оқу', 'dashboard.navPractice': 'Жаттығу', 'dashboard.navAchievements': 'Жетістіктер', 'dashboard.navProfile': 'Профиль', 'dashboard.navSettings': 'Баптаулар',
    'dashboard.subjects': 'Пәндер', 'dashboard.days': 'күн қатарынан', 'dashboard.nextLesson': 'Келесі сабақ', 'dashboard.continue': 'Сабақты жалғастыру', 'dashboard.start': 'Сабақты бастау',
    'dashboard.repeatPrevious': 'Өткенді қайталау', 'dashboard.allDone': 'Барлық қолжетімді контент аяқталды', 'dashboard.allDoneText': 'Өткен сабақты қайталауға немесе кейінірек оралуға болады.',
    'dashboard.level': 'Деңгей', 'dashboard.streak': 'Серия', 'dashboard.course': 'Курс', 'dashboard.learningDays': 'оқу күні', 'dashboard.subjectHint': 'Пәнді таңда — төмендегі маршрут жаңарады',
    'dashboard.route': 'Маршрут', 'dashboard.completed': 'Аяқталды', 'dashboard.current': 'Жалғасуда', 'dashboard.available': 'Қолжетімді', 'dashboard.comingSoon': 'Жақында', 'dashboard.locked': 'Қолжетімсіз',
    'dashboard.lessons': 'сабақ', 'dashboard.passed': 'аяқталды', 'dashboard.remaining': 'келесі деңгейге дейін', 'dashboard.availableCount': 'қолжетімді сабақ',
    'dashboard.interactive': 'интерактивті сабақ', 'dashboard.saved': 'қадам сақталды', 'dashboard.minutes': 'мин', 'dashboard.greeting': 'Сәлем', 'dashboard.repeat': 'Қайталау', 'dashboard.open': 'Ашу',
    'dashboard.noContent': 'Сабақ әлі дайын емес', 'dashboard.profile': 'Профиль', 'dashboard.error': 'Dashboard деректерін жүктеу мүмкін болмады', 'dashboard.retry': 'Қайталап көру',

    'lesson.back': 'Маршрутқа оралу', 'lesson.route': 'Маршрут', 'lesson.progress': 'Прогресс', 'lesson.remaining': 'Қалғаны',
    'lesson.tip': 'Кеңес', 'lesson.tipText': 'Шығуға болады: ағымдағы қадам мен жауаптар автоматты түрде сақталады.',
    'lesson.steps': 'қадам', 'lesson.repeat': 'Қайталау режимі · XP берілмейді', 'lesson.resume': 'Сақталған қадамнан жалғастыру',
    'lesson.completed': 'Сабақ аяқталды', 'lesson.unavailable': 'Сабақ әлі дайын емес', 'lesson.notFound': 'Сабақ табылмады',
    'lesson.notFoundText': 'Сілтемені тексеріңіз немесе маршрутқа оралыңыз.', 'lesson.dashboard': 'Dashboard-қа оралу',
    'lesson.stageStart': 'Бастау', 'lesson.stageRule': 'Ереже', 'lesson.stageExample': 'Талдау', 'lesson.stagePractice': 'Жаттығу', 'lesson.stageFinish': 'Нәтиже'
  },
  ru: {
    nav_dashboard: 'Дашборд', nav_subjects: 'Темы', nav_login: 'Войти', nav_register: 'Регистрация',
    hero_title: 'Изучай математику <span style="color:#1D4ED8">с пониманием</span>',
    hero_desc: 'Интерактивные уроки, тесты и задания на казахском языке. От теории к практике — на одной платформе.',
    btn_start: 'Начать →', b1_title: 'Выбери раздел', b1_desc: 'Алгебра или геометрия — выбирай то, что проходишь в школе, и начинай обучение.',
    b2_title: 'Изучи теорию', b2_desc: 'Краткие и понятные объяснения с примерами. Каждая формула объясняется на практике.',
    b3_title: 'Реши задание', b3_desc: 'Интерактивные тесты и задания на ввод. Ошибся — получишь пояснение.',
    b4_title: 'Увидь результат', b4_desc: 'Мгновенная проверка, баллы и отслеживание прогресса. Каждый шаг учитывается.',
    subj_title: 'Программа 7–9 классов', topics_header: 'Темы в разделе', cta_title: 'Готов начать?',
    cta_desc: 'Любую тему можно начать прямо сейчас', f_contact: 'Контакты', f_privacy: 'Конфиденциальность',

    'subjects.algebra': 'Алгебра', 'subjects.geometry': 'Геометрия и тригонометрия', 'subjects.logic': 'Логика и графы', 'subjects.numbers': 'Числа и IT-база',
    'dashboard.navLearning': 'Обучение', 'dashboard.navPractice': 'Практика', 'dashboard.navAchievements': 'Достижения', 'dashboard.navProfile': 'Профиль', 'dashboard.navSettings': 'Настройки',
    'dashboard.subjects': 'Предметы', 'dashboard.days': 'дней подряд', 'dashboard.nextLesson': 'Следующий урок', 'dashboard.continue': 'Продолжить урок', 'dashboard.start': 'Начать урок',
    'dashboard.repeatPrevious': 'Повторить прошлый', 'dashboard.allDone': 'Весь доступный контент завершён', 'dashboard.allDoneText': 'Можно повторить пройденный урок или вернуться позже.',
    'dashboard.level': 'Уровень', 'dashboard.streak': 'Серия', 'dashboard.course': 'Курс', 'dashboard.learningDays': 'учебных дней', 'dashboard.subjectHint': 'Выбери предмет — маршрут ниже обновится',
    'dashboard.route': 'Маршрут', 'dashboard.completed': 'Завершён', 'dashboard.current': 'В процессе', 'dashboard.available': 'Доступен', 'dashboard.comingSoon': 'Скоро', 'dashboard.locked': 'Недоступен',
    'dashboard.lessons': 'уроков', 'dashboard.passed': 'пройдено', 'dashboard.remaining': 'до следующего уровня', 'dashboard.availableCount': 'доступных урока',
    'dashboard.interactive': 'интерактивный урок', 'dashboard.saved': 'шагов сохранено', 'dashboard.minutes': 'мин', 'dashboard.greeting': 'Привет', 'dashboard.repeat': 'Повторить', 'dashboard.open': 'Открыть',
    'dashboard.noContent': 'Урок пока не готов', 'dashboard.profile': 'Профиль', 'dashboard.error': 'Не удалось загрузить данные Dashboard', 'dashboard.retry': 'Повторить',

    'lesson.back': 'К маршруту', 'lesson.route': 'Маршрут', 'lesson.progress': 'Прогресс', 'lesson.remaining': 'Что осталось',
    'lesson.tip': 'Подсказка', 'lesson.tipText': 'Можно выйти: текущий шаг и ответы сохраняются автоматически.',
    'lesson.steps': 'шагов', 'lesson.repeat': 'Режим повторения · XP не начисляется', 'lesson.resume': 'Продолжение с сохранённого шага',
    'lesson.completed': 'Урок завершён', 'lesson.unavailable': 'Урок пока не готов', 'lesson.notFound': 'Урок не найден',
    'lesson.notFoundText': 'Проверьте ссылку или вернитесь к маршруту.', 'lesson.dashboard': 'Вернуться на Dashboard',
    'lesson.stageStart': 'Старт', 'lesson.stageRule': 'Правило', 'lesson.stageExample': 'Разбор', 'lesson.stagePractice': 'Практика', 'lesson.stageFinish': 'Результат'
  }
};

window.I18N = {
  getLang: function() {
    try { return ML.getLang() === 'ru' ? 'ru' : 'kz'; }
    catch (error) { return 'kz'; }
  },
  t: function(key, lang) {
    lang = lang === 'ru' ? 'ru' : lang === 'kz' ? 'kz' : this.getLang();
    return I18N_DICTIONARY[lang][key] || I18N_DICTIONARY.ru[key] || key;
  },
  apply: function(root, lang) {
    root = root || document;
    lang = lang || this.getLang();
    root.querySelectorAll('[data-i18n]').forEach(function(element) {
      var key = element.getAttribute('data-i18n');
      element.innerHTML = I18N.t(key, lang);
    });
    document.documentElement.lang = lang === 'ru' ? 'ru' : 'kk';
  },
  setLang: function(lang) {
    lang = lang === 'ru' ? 'ru' : 'kz';
    try { ML.setLang(lang); } catch (error) { console.warn('[I18N] language was not saved', error); }
    this.apply(document, lang);
    return lang;
  }
};

function getLang() { return I18N.getLang(); }
function setLang(lang) {
  lang = I18N.setLang(lang);
  var btnKz = document.getElementById('btn-kz');
  var btnRu = document.getElementById('btn-ru');
  if (btnKz && btnRu) {
    btnKz.className = lang === 'kz' ? 'px-3 py-1 rounded-full transition-all duration-300 text-white bg-blue-700 font-semibold' : 'px-3 py-1 rounded-full transition-all duration-300 text-blue-700 font-semibold hover:bg-blue-50';
    btnRu.className = lang === 'ru' ? 'px-3 py-1 rounded-full transition-all duration-300 text-white bg-blue-700 font-semibold' : 'px-3 py-1 rounded-full transition-all duration-300 text-blue-700 font-semibold hover:bg-blue-50';
  }
  if (typeof TAB_NAMES !== 'undefined') {
    Object.keys(TAB_NAMES).forEach(function(tabKey) {
      var tab = document.getElementById('tab-' + tabKey);
      if (tab) tab.textContent = TAB_NAMES[tabKey][lang];
    });
  }
  if (typeof renderLandingTopics === 'function') renderLandingTopics();
}

document.addEventListener('DOMContentLoaded', function() { setLang(getLang()); });
