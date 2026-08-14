/* Shared RU/KZ localization. Legacy global getLang/setLang are preserved. */

const I18N_DICTIONARY = {
  kk: {
    nav_dashboard: 'Дашборд', nav_subjects: 'Тақырыптар', nav_login: 'Кіру', nav_register: 'Тіркелу',
    hero_title: 'Математиканы <span style="color:#1D4ED8">түсініп</span> үйрен',
    hero_desc: 'Қазақ тіліндегі интерактивті сабақтар, тесттер және тапсырмалар. Теориядан практикаға — бір платформада.',
    btn_start: 'Бастау →', b1_title: 'Тақырыпты таңда', b1_desc: 'Алгебра немесе геометрия — өз деңгейіңе қарай таңдап, оқуды баста.',
    b2_title: 'Теорияны оқы', b2_desc: 'Қысқа әрі түсінікті түсіндірме және нақты мысалдар. Әр формуланың мағынасын түсінесің.',
    b3_title: 'Тапсырманы шеш', b3_desc: 'Интерактивті тесттер мен енгізу тапсырмалары. Қателессең — түсіндірме аласың.',
    b4_title: 'Нәтижеңді көр', b4_desc: 'Жауапты бірден тексеріп, түсіндірмені көр және оқу барысын бақыла.',
    subj_title: '7–9 сынып бағдарламасы', topics_header: 'Қамтылған тақырыптар', cta_title: 'Бастауға дайынсың ба?',
    cta_desc: 'Кез келген тақырыпты қазір бастауға болады', f_contact: 'Байланыс', f_privacy: 'Құпиялылық',

    'subjects.algebra': 'Алгебра', 'subjects.geometry': 'Геометрия және тригонометрия', 'subjects.logic': 'Логика және графтар', 'subjects.numbers': 'Сандар және IT-база',
    'dashboard.navLearning': 'Оқу', 'dashboard.navPractice': 'Жаттығу', 'dashboard.navJournal': 'Оқу журналы', 'dashboard.navProfile': 'Профиль', 'dashboard.navSettings': 'Баптаулар',
    'dashboard.subjects': 'Пәндер', 'dashboard.completedLessons': 'сабақ аяқталды', 'dashboard.nextLesson': 'Келесі сабақ', 'dashboard.continue': 'Сабақты жалғастыру', 'dashboard.start': 'Сабақты бастау',
    'dashboard.repeatPrevious': 'Өткенді қайталау', 'dashboard.allDone': 'Барлық қолжетімді контент аяқталды', 'dashboard.allDoneText': 'Өткен сабақты қайталауға немесе кейінірек оралуға болады.',
    'dashboard.course': 'Курс', 'dashboard.availableLessons': 'Қолжетімді', 'dashboard.inProgress': 'Жалғасуда', 'dashboard.subjectHint': 'Пәнді таңда — төмендегі маршрут жаңарады',
    'dashboard.route': 'Маршрут', 'dashboard.completed': 'Аяқталды', 'dashboard.current': 'Жалғасуда', 'dashboard.available': 'Қолжетімді', 'dashboard.comingSoon': 'Жақында', 'dashboard.locked': 'Қолжетімсіз',
    'dashboard.lessons': 'сабақ', 'dashboard.passed': 'аяқталды', 'dashboard.passedShort': 'аяқталды', 'dashboard.inProgressShort': 'жалғасуда', 'dashboard.availableCount': 'қолжетімді сабақ',
    'dashboard.savedProgress': 'сақталған оқу барысы бар', 'dashboard.nothingStarted': 'басталған сабақ жоқ', 'dashboard.preparedLessons': 'дайын сабақ',
    'dashboard.interactive': 'интерактивті сабақ', 'dashboard.saved': 'қадам сақталды', 'dashboard.minutes': 'мин', 'dashboard.greeting': 'Сәлем', 'dashboard.repeat': 'Қайталау', 'dashboard.open': 'Ашу',
    'dashboard.noContent': 'Сабақ әлі дайын емес', 'dashboard.profile': 'Профиль', 'dashboard.error': 'Dashboard деректерін жүктеу мүмкін болмады', 'dashboard.retry': 'Қайталап көру',

    'lesson.back': 'Маршрутқа оралу', 'lesson.route': 'Маршрут', 'lesson.progress': 'Прогресс', 'lesson.routeAria': 'Сабақ кезеңдері', 'lesson.progressAria': 'Сабақ барысы', 'lesson.remaining': 'Қалғаны', 'lesson.minutes': 'мин',
    'lesson.tip': 'Кеңес', 'lesson.tipText': 'Шығуға болады: ағымдағы қадам мен жауаптар автоматты түрде сақталады.',
    'lesson.steps': 'қадам', 'lesson.repeat': 'Қайталап оқу', 'lesson.resume': 'Сақталған қадамнан жалғастыру',
    'lesson.completed': 'Сабақ аяқталды', 'lesson.unavailable': 'Сабақ әлі дайын емес', 'lesson.notFound': 'Сабақ табылмады',
    'lesson.notFoundText': 'Сілтемені тексеріңіз немесе маршрутқа оралыңыз.', 'lesson.dashboard': 'Dashboard-қа оралу',
    'lesson.stageStart': 'Бастау', 'lesson.stageRule': 'Ереже', 'lesson.stageExample': 'Талдау', 'lesson.stagePractice': 'Жаттығу', 'lesson.stageFinish': 'Нәтиже',
    'lesson.result.label': 'Нәтиже', 'lesson.result.title': 'Сабақ аяқталды',
    'lesson.result.description': 'Нәтижелер сақталды. Төменде осы сабақтағы жұмысыңыздың қысқаша қорытындысы берілген.',
    'lesson.result.score': 'Нәтиже', 'lesson.result.tasks': 'Тапсырмалар', 'lesson.result.time': 'Уақыт', 'lesson.result.mistakes': 'Қателер',
    'lesson.result.minutes': 'мин', 'lesson.result.seconds': 'сек', 'lesson.result.review': 'Талдау',
    'lesson.result.noMistakesTitle': 'Қатесіз орындалды', 'lesson.result.noMistakesBody': 'Негізгі тапсырмалар сенімді орындалды.',
    'lesson.result.mistakesTitle': 'Назар аударатын тұстар бар', 'lesson.result.mistakesBody': 'Қате кеткен қадамдарды қайталап қарап, шешу тәсілін бекітіңіз.',
    'lesson.result.route': 'Маршрутқа оралу', 'lesson.result.nextLesson': 'Келесі сабақ',
    'lesson.summary.badge': 'Сабақ қорытындысы', 'lesson.summary.capabilities': 'Енді сіз',
    'lesson.summary.withoutHints': 'Нұсқаусыз орындалған тапсырмалар', 'lesson.summary.taskRatio': '{correct} / {total} тапсырма',
    'lesson.summary.hints': 'Нұсқаулар', 'lesson.summary.repaired': 'Тексеруден кейін түзетілді', 'lesson.summary.time': 'Жұмыс уақыты',
    'lesson.summary.minutes': 'мин', 'lesson.summary.seconds': 'с', 'lesson.summary.nextLesson': 'Келесі сабақ', 'lesson.summary.route': 'Маршрутқа оралу',
    'lesson.math.badge': 'Жауапты жазыңыз', 'lesson.math.answer': 'Жауап', 'lesson.math.check': 'Тексеру', 'lesson.math.checkAgain': 'Жауапты түзету',
    'lesson.math.clear': 'Тазарту', 'lesson.math.continue': 'Жалғастыру', 'lesson.math.hint': 'Нұсқауды көрсету', 'lesson.math.nextHint': 'Келесі нұсқау',
    'lesson.math.usedHints': 'Қолданылған нұсқаулар', 'lesson.math.attempts': 'Әрекет', 'lesson.math.correct': 'Дұрыс', 'lesson.math.reasoning': 'Ойыңызды тексеріңіз',
    'lesson.math.emptyTitle': 'Жауапты жазыңыз', 'lesson.math.incompleteTitle': 'Жазуды аяқтаңыз', 'lesson.math.invalidTitle': 'Жазуды тексеріңіз',
    'lesson.math.emptyFeedback': 'Тексермес бұрын жауапты жазыңыз.', 'lesson.math.incompleteFeedback': 'Өрнек аяқталмаған. Дәреже көрсеткішін, бөлшекті немесе жақшаны толықтырыңыз.',
    'lesson.math.invalidFeedback': 'Бұл жазуды әзірге оқу мүмкін емес. Амал таңбалары мен жақшаларды тексеріңіз.',
    'lesson.math.angleEmptyFeedback': 'Тексермес бұрын бұрыштың сандық мәнін жазыңыз.', 'lesson.math.angleIncompleteFeedback': 'Бұрыштың сандық мәнін аяқтаңыз.',
    'lesson.math.angleInvalidFeedback': 'Бұрыш үшін бір санды енгізіңіз, мысалы 67.', 'lesson.math.numberInvalidFeedback': 'Бір сан енгізіңіз.',
    'lesson.math.successFeedback': 'Өрнек дұрыс жазылған.', 'lesson.math.wrongFeedback': 'Математикалық құрылымға оралып, қайта көріңіз.',
    'lesson.math.typingHelp': 'Дәреже үшін ^, бөлшек үшін / таңбасын қолданыңыз', 'lesson.math.keyboard': 'Математикалық пернетақта',
    'lesson.math.power': 'Дәреже', 'lesson.math.square': 'Квадрат', 'lesson.math.fraction': 'Бөлшек', 'lesson.math.root': 'Түбір',
    'lesson.math.delete': 'Жою', 'lesson.math.left': 'Солға жылжу', 'lesson.math.right': 'Оңға жылжу', 'lesson.math.hideKeyboard': 'Пернетақтаны жасыру',

    'history.eyebrow': 'Хронология', 'history.title': 'Оқу тарихы', 'history.subtitle': 'Соңғы әрекеттер мен өзгерістер',
    'history.today': 'Бүгін', 'history.yesterday': 'Кеше',
    'history.lessonStarted': 'Сабақ басталды', 'history.lessonContinued': 'Сабақ жалғастырылды', 'history.lessonCompleted': 'Сабақ аяқталды',
    'history.showMore': 'Тағы көрсету', 'history.empty': 'Алғашқы сабақтардан кейін мұнда басталған, жалғастырылған және аяқталған сабақтар көрінеді.',
    'history.openProgram': 'Бағдарламаны ашу', 'history.openLesson': 'Сабаққа оралу', 'history.unknownLesson': 'Бағдарламада жоқ сабақ',
    'history.events': 'оқу әрекеті', 'history.tasks': 'тапсырма', 'history.minutes': 'мин', 'history.attempts': 'әрекет'
  },
  ru: {
    nav_dashboard: 'Дашборд', nav_subjects: 'Темы', nav_login: 'Войти', nav_register: 'Регистрация',
    hero_title: 'Изучай математику <span style="color:#1D4ED8">с пониманием</span>',
    hero_desc: 'Интерактивные уроки, тесты и задания на казахском языке. От теории к практике — на одной платформе.',
    btn_start: 'Начать →', b1_title: 'Выбери раздел', b1_desc: 'Алгебра или геометрия — выбирай то, что проходишь в школе, и начинай обучение.',
    b2_title: 'Изучи теорию', b2_desc: 'Краткие и понятные объяснения с примерами. Каждая формула объясняется на практике.',
    b3_title: 'Реши задание', b3_desc: 'Интерактивные тесты и задания на ввод. Ошибся — получишь пояснение.',
    b4_title: 'Увидь результат', b4_desc: 'Сразу проверь ответ, прочитай объяснение и отслеживай учебный прогресс.',
    subj_title: 'Программа 7–9 классов', topics_header: 'Темы в разделе', cta_title: 'Готов начать?',
    cta_desc: 'Любую тему можно начать прямо сейчас', f_contact: 'Контакты', f_privacy: 'Конфиденциальность',

    'subjects.algebra': 'Алгебра', 'subjects.geometry': 'Геометрия и тригонометрия', 'subjects.logic': 'Логика и графы', 'subjects.numbers': 'Числа и IT-база',
    'dashboard.navLearning': 'Обучение', 'dashboard.navPractice': 'Практика', 'dashboard.navJournal': 'Учебный журнал', 'dashboard.navProfile': 'Профиль', 'dashboard.navSettings': 'Настройки',
    'dashboard.subjects': 'Предметы', 'dashboard.completedLessons': 'уроков пройдено', 'dashboard.nextLesson': 'Следующий урок', 'dashboard.continue': 'Продолжить урок', 'dashboard.start': 'Начать урок',
    'dashboard.repeatPrevious': 'Повторить прошлый', 'dashboard.allDone': 'Весь доступный контент завершён', 'dashboard.allDoneText': 'Можно повторить пройденный урок или вернуться позже.',
    'dashboard.course': 'Курс', 'dashboard.availableLessons': 'Доступно', 'dashboard.inProgress': 'В процессе', 'dashboard.subjectHint': 'Выбери предмет — маршрут ниже обновится',
    'dashboard.route': 'Маршрут', 'dashboard.completed': 'Завершён', 'dashboard.current': 'В процессе', 'dashboard.available': 'Доступен', 'dashboard.comingSoon': 'Скоро', 'dashboard.locked': 'Недоступен',
    'dashboard.lessons': 'уроков', 'dashboard.passed': 'пройдено', 'dashboard.passedShort': 'пройдено', 'dashboard.inProgressShort': 'в процессе', 'dashboard.availableCount': 'доступных урока',
    'dashboard.savedProgress': 'есть сохранённый прогресс', 'dashboard.nothingStarted': 'нет начатых уроков', 'dashboard.preparedLessons': 'готовых уроков',
    'dashboard.interactive': 'интерактивный урок', 'dashboard.saved': 'шагов сохранено', 'dashboard.minutes': 'мин', 'dashboard.greeting': 'Привет', 'dashboard.repeat': 'Повторить', 'dashboard.open': 'Открыть',
    'dashboard.noContent': 'Урок пока не готов', 'dashboard.profile': 'Профиль', 'dashboard.error': 'Не удалось загрузить данные Dashboard', 'dashboard.retry': 'Повторить',

    'lesson.back': 'К маршруту', 'lesson.route': 'Маршрут', 'lesson.progress': 'Прогресс', 'lesson.routeAria': 'Этапы урока', 'lesson.progressAria': 'Прогресс урока', 'lesson.remaining': 'Что осталось', 'lesson.minutes': 'мин',
    'lesson.tip': 'Подсказка', 'lesson.tipText': 'Можно выйти: текущий шаг и ответы сохраняются автоматически.',
    'lesson.steps': 'шагов', 'lesson.repeat': 'Повторное чтение', 'lesson.resume': 'Продолжение с сохранённого шага',
    'lesson.completed': 'Урок завершён', 'lesson.unavailable': 'Урок пока не готов', 'lesson.notFound': 'Урок не найден',
    'lesson.notFoundText': 'Проверьте ссылку или вернитесь к маршруту.', 'lesson.dashboard': 'Вернуться на Dashboard',
    'lesson.stageStart': 'Старт', 'lesson.stageRule': 'Правило', 'lesson.stageExample': 'Разбор', 'lesson.stagePractice': 'Практика', 'lesson.stageFinish': 'Результат',
    'lesson.result.label': 'Результат', 'lesson.result.title': 'Урок завершён',
    'lesson.result.description': 'Результаты сохранены. Ниже — краткий итог работы в этом уроке.',
    'lesson.result.score': 'Результат', 'lesson.result.tasks': 'Задания', 'lesson.result.time': 'Время', 'lesson.result.mistakes': 'Ошибки',
    'lesson.result.minutes': 'мин', 'lesson.result.seconds': 'сек', 'lesson.result.review': 'Разбор',
    'lesson.result.noMistakesTitle': 'Без ошибок', 'lesson.result.noMistakesBody': 'Основные задания выполнены уверенно.',
    'lesson.result.mistakesTitle': 'Есть что разобрать', 'lesson.result.mistakesBody': 'Вернитесь к шагам с ошибками и закрепите способ решения.',
    'lesson.result.route': 'К маршруту', 'lesson.result.nextLesson': 'Следующий урок',
    'lesson.summary.badge': 'Итог урока', 'lesson.summary.capabilities': 'Теперь вы можете',
    'lesson.summary.withoutHints': 'Без подсказки', 'lesson.summary.taskRatio': '{correct} из {total} заданий',
    'lesson.summary.hints': 'Подсказки', 'lesson.summary.repaired': 'Исправлено после проверки', 'lesson.summary.time': 'Время работы',
    'lesson.summary.minutes': 'мин', 'lesson.summary.seconds': 'с', 'lesson.summary.nextLesson': 'Следующий урок', 'lesson.summary.route': 'К маршруту',
    'lesson.math.badge': 'Запишите ответ', 'lesson.math.answer': 'Ответ', 'lesson.math.check': 'Проверить', 'lesson.math.checkAgain': 'Исправить ответ',
    'lesson.math.clear': 'Очистить', 'lesson.math.continue': 'Продолжить', 'lesson.math.hint': 'Показать подсказку', 'lesson.math.nextHint': 'Следующая подсказка',
    'lesson.math.usedHints': 'Использованные подсказки', 'lesson.math.attempts': 'Попыток', 'lesson.math.correct': 'Верно', 'lesson.math.reasoning': 'Проверьте рассуждение',
    'lesson.math.emptyTitle': 'Введите ответ', 'lesson.math.incompleteTitle': 'Завершите запись', 'lesson.math.invalidTitle': 'Проверьте запись',
    'lesson.math.emptyFeedback': 'Сначала запишите ответ, затем проверяйте.', 'lesson.math.incompleteFeedback': 'Выражение не завершено. Допишите показатель, дробь или скобки.',
    'lesson.math.invalidFeedback': 'Эту запись пока нельзя прочитать. Проверьте знаки действий и скобки.',
    'lesson.math.angleEmptyFeedback': 'Сначала запишите числовое значение угла.', 'lesson.math.angleIncompleteFeedback': 'Допишите числовое значение угла.',
    'lesson.math.angleInvalidFeedback': 'Введите одно число для угла, например 67.', 'lesson.math.numberInvalidFeedback': 'Введите одно число.',
    'lesson.math.successFeedback': 'Выражение записано верно.', 'lesson.math.wrongFeedback': 'Вернитесь к математической структуре и попробуйте ещё раз.',
    'lesson.math.typingHelp': 'Используйте ^ для степени и / для дроби', 'lesson.math.keyboard': 'Математическая клавиатура',
    'lesson.math.power': 'Степень', 'lesson.math.square': 'Квадрат', 'lesson.math.fraction': 'Дробь', 'lesson.math.root': 'Корень',
    'lesson.math.delete': 'Удалить', 'lesson.math.left': 'Переместить курсор влево', 'lesson.math.right': 'Переместить курсор вправо', 'lesson.math.hideKeyboard': 'Скрыть клавиатуру',

    'history.eyebrow': 'Хронология', 'history.title': 'История обучения', 'history.subtitle': 'Последние действия и изменения',
    'history.today': 'Сегодня', 'history.yesterday': 'Вчера',
    'history.lessonStarted': 'Урок начат', 'history.lessonContinued': 'Урок продолжен', 'history.lessonCompleted': 'Урок завершён',
    'history.showMore': 'Показать ещё', 'history.empty': 'После первых уроков здесь появятся начатые, продолженные и завершённые занятия.',
    'history.openProgram': 'Открыть программу', 'history.openLesson': 'Вернуться к уроку', 'history.unknownLesson': 'Урок больше не в программе',
    'history.events': 'учебных событий', 'history.tasks': 'задач', 'history.minutes': 'мин', 'history.attempts': 'попыток'
  }
};

function normalizeI18nLang(lang) {
  if (typeof ML !== 'undefined' && ML.normalizeLang) return ML.normalizeLang(lang);
  return String(lang || '').toLowerCase() === 'ru' ? 'ru' : 'kk';
}

window.I18N = {
  getLang: function() {
    try { return normalizeI18nLang(ML.getLang()); }
    catch (error) { return 'kk'; }
  },
  t: function(key, lang) {
    lang = lang === undefined || lang === null ? this.getLang() : normalizeI18nLang(lang);
    return I18N_DICTIONARY[lang][key] || I18N_DICTIONARY.ru[key] || key;
  },
  localize: function(record, key, lang) {
    if (!record) return '';
    lang = normalizeI18nLang(lang === undefined ? this.getLang() : lang);
    var direct = record[key];
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
      var directLocalized = lang === 'kk'
        ? (direct.kk !== undefined ? direct.kk : direct.kz !== undefined ? direct.kz : direct.ru)
        : (direct.ru !== undefined ? direct.ru : direct.kk !== undefined ? direct.kk : direct.kz);
      if (directLocalized !== undefined && directLocalized !== null) return directLocalized;
    }
    var candidates = lang === 'kk'
      ? [key + 'Kk', key + 'KK', key + 'Kz', key + 'KZ', key + 'Kazakh', key + '_kk', key + '_kz']
      : [key + 'Ru', key + 'RU', key + '_ru'];
    for (var i = 0; i < candidates.length; i++) {
      if (record[candidates[i]] !== undefined && record[candidates[i]] !== null && record[candidates[i]] !== '') {
        return record[candidates[i]];
      }
    }
    if (direct === undefined || direct === null) return '';
    if (typeof direct === 'object' && !Array.isArray(direct)) return '';
    return direct;
  },
  apply: function(root, lang) {
    root = root || document;
    lang = normalizeI18nLang(lang || this.getLang());
    root.querySelectorAll('[data-i18n]').forEach(function(element) {
      var key = element.getAttribute('data-i18n');
      element.innerHTML = I18N.t(key, lang);
    });
    document.documentElement.lang = lang;
  },
  setLang: function(lang) {
    lang = normalizeI18nLang(lang);
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
    btnKz.className = lang === 'kk' ? 'px-3 py-1 rounded-full transition-all duration-300 text-white bg-blue-700 font-semibold' : 'px-3 py-1 rounded-full transition-all duration-300 text-blue-700 font-semibold hover:bg-blue-50';
    btnRu.className = lang === 'ru' ? 'px-3 py-1 rounded-full transition-all duration-300 text-white bg-blue-700 font-semibold' : 'px-3 py-1 rounded-full transition-all duration-300 text-blue-700 font-semibold hover:bg-blue-50';
  }
  if (typeof TAB_NAMES !== 'undefined') {
    Object.keys(TAB_NAMES).forEach(function(tabKey) {
      var tab = document.getElementById('tab-' + tabKey);
      if (tab) tab.textContent = TAB_NAMES[tabKey][lang] || TAB_NAMES[tabKey].ru;
    });
  }
  if (typeof renderLandingTopics === 'function') renderLandingTopics();
}

document.addEventListener('DOMContentLoaded', function() { setLang(getLang()); });
