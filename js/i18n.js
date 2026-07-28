/* СИСТЕМА ЛОКАЛИЗАЦИИ И ПЕРЕКЛЮЧЕНИЯ ЯЗЫКА (KZ / RU) */

const I18N_DICTIONARY = {
  kz: {
    nav_dashboard: "Дашборд",
    nav_subjects: "Тақырыптар",
    nav_login: "Кіру",
    nav_register: "Тіркелу",
    hero_title: 'Математиканы <span style="color:#1D4ED8">түсініп</span> үйрен',
    hero_desc: "Қазақ тіліндегі интерактивті сабақтар, тесттер және тапсырмалар. Теориядан практикаға — бір платформада.",
    btn_start: "Бастау →",
    b1_title: "Тақырыпты таңда",
    b1_desc: "Алгебра немесе геометрия — өз деңгейіңе қарай таңдап, оқуды баста.",
    b2_title: "Теорияны оқы",
    b2_desc: "Қысқа әрі түсінікті түсіндірме және нақты мысалдар. Әр формуланың мағынасын түсінесің.",
    b3_title: "Тапсырманы шеш",
    b3_desc: "Интерактивті тесттер мен енгізу тапсырмалары. Қателессең — түсіндірме аласың.",
    b4_title: "Нәтижеңді көр",
    b4_desc: "Бірден дұрыс-бұрыс жауап, ұпай және прогресті бақылау. Әр қадамың есептеледі.",
    subj_title: "7–9 сынып бағдарламасы",
    topics_header: "Қамтылған тақырыптар",
    cta_title: "Бастауға дайынсың ба?",
    cta_desc: "Кез келген тақырыпты қазір бастауға болады",
    f_contact: "Байланыс",
    f_privacy: "Құпиялылық"
  },
  ru: {
    nav_dashboard: "Дашборд",
    nav_subjects: "Темы",
    nav_login: "Войти",
    nav_register: "Регистрация",
    hero_title: 'Изучай математику <span style="color:#1D4ED8">с пониманием</span>',
    hero_desc: "Интерактивные уроки, тесты и задания на казахском языке. От теории к практике — на одной платформе.",
    btn_start: "Начать →",
    b1_title: "Выбери раздел",
    b1_desc: "Алгебра или геометрия — выбирай то, что проходишь в школе, и начинай обучение.",
    b2_title: "Изучи теорию",
    b2_desc: "Краткие и понятные объяснения с примерами. Каждая формула объясняется на практике.",
    b3_title: "Реши задание",
    b3_desc: "Интерактивные тесты и задания на ввод. Ошибся — получишь пояснение.",
    b4_title: "Увидь результат",
    b4_desc: "Мгновенная проверка, баллы и отслеживание прогресса. Каждый шаг учитывается.",
    subj_title: "Программа 7–9 классов",
    topics_header: "Темы в разделе",
    cta_title: "Готов начать?",
    cta_desc: "Любую тему можно начать прямо сейчас",
    f_contact: "Контакты",
    f_privacy: "Конфиденциальность"
  }
};

function getLang() {
  try {
    return ML.getLang();
  } catch(e) {
    return 'kz';
  }
}

function setLang(lang) {
  try {
    ML.setLang(lang);
  } catch(e) {}

  const btnKz = document.getElementById('btn-kz');
  const btnRu = document.getElementById('btn-ru');
  if (btnKz && btnRu) {
    if (lang === 'kz') {
      btnKz.className = "px-3 py-1 rounded-full transition-all duration-300 text-white bg-blue-700 font-semibold";
      btnRu.className = "px-3 py-1 rounded-full transition-all duration-300 text-blue-700 font-semibold hover:bg-blue-50";
    } else {
      btnRu.className = "px-3 py-1 rounded-full transition-all duration-300 text-white bg-blue-700 font-semibold";
      btnKz.className = "px-3 py-1 rounded-full transition-all duration-300 text-blue-700 font-semibold hover:bg-blue-50";
    }
  }

  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (I18N_DICTIONARY[lang] && I18N_DICTIONARY[lang][key]) {
      elem.innerHTML = I18N_DICTIONARY[lang][key];
    }
  });

  if (typeof TAB_NAMES !== 'undefined') {
    Object.keys(TAB_NAMES).forEach(tabKey => {
      const tabBtn = document.getElementById(`tab-${tabKey}`);
      if (tabBtn) tabBtn.innerText = TAB_NAMES[tabKey][lang];
    });
  }

  if (typeof renderLandingTopics === 'function') {
    renderLandingTopics();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const lang = getLang();
  setLang(lang);
});
