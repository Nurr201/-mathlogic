/* СИСТЕМА ЛОКАЛИЗАЦИИ И ПЕРЕКЛЮЧЕНИЯ ЯЗЫКА (KZ / RU) */

const I18N_DICTIONARY = {
  kz: {
    nav_dashboard: "Дашборд",
    nav_subjects: "Тақырыптар",
    nav_login: "Кіру",
    nav_register: "Тіркелу",
    hero_title: 'Математика мен логиканы <span style="color:#1D4ED8">шешу арқылы</span> үйрен',
    hero_desc: "Дайын жауап жоқ — тек есептер, деңгейлер және өз қарқының. Ойлауыңды нақты тапсырмалармен жаттықтыр.",
    btn_start: "Бастау →",
    b1_title: "Шешу арқылы үйрен",
    b1_desc: "Әр тапсырма — есептеу жаттығуы. Формуланы жаттамайсың, оны қолдану арқылы түсінесің. Қате жіберсең — қайта көресің, дайын жауапты көрсетпейміз.",
    b2_title: "Дәл деңгейіңе бейімделеді",
    b2_desc: "Жүйе әр жауабыңды бақылайды: дұрыс шешсең — қиындайды, қиналсаң — жеңілдейді. Тым оңай да, тым қиын да болмайды.",
    b3_title: "Тек формула емес — ойлау да",
    b3_desc: "Логикалық тізбектер, заңдылықтар, кеңістіктік есептер — есептеу дағдысымен қатар нақты ойлауды дамытады.",
    b4_title: "Шаршатпайтындай құрылған",
    b4_desc: "Ұзақ отырсаң, жүйе демалуды ұсынады. Қысқа үзіліс — келесі есепті басынан анық ойлау үшін.",
    subj_title: "5-сыныптан ересекке дейін",
    topics_header: "Қамтылған тақырыптар",
    cta_title: "Бастауға дайынсың ба?",
    cta_desc: "Тіркеу қажет емес — бірден бірінші есепке өтесің",
    f_contact: "Байланыс",
    f_privacy: "Құпиялылық"
  },
  ru: {
    nav_dashboard: "Дашборд",
    nav_subjects: "Темы",
    nav_login: "Войти",
    nav_register: "Регистрация",
    hero_title: 'Изучай математику и логику <span style="color:#1D4ED8">через практику</span>',
    hero_desc: "Никаких готовых ответов — только задачи, уровни и твой собственный темп. Прокачивай мышление на реальных заданиях.",
    btn_start: "Начать →",
    b1_title: "Учись, решая задачи",
    b1_desc: "Каждое задание — это тренировка. Ты не зубришь формулы, а понимаешь их на практике. Ошибся — пробуешь снова, без сухих подсказок.",
    b2_title: "Адаптируется под твой уровень",
    b2_desc: "Система следит за ответами: решаешь правильно — задачи усложняются, возникают трудности — подстраивается. Никакой скуки.",
    b3_title: "Не просто формулы — гибкость ума",
    b3_desc: "Логические цепочки, закономерности, визуальные задачи — развивают наглядно-образное мышление вместе с вычислениями.",
    b4_title: "Создано без перегруза",
    b4_desc: "Если засиделся, система предложит паузу. Короткий перерыв нужен, чтобы подойти к следующей задаче со свежей головой.",
    subj_title: "От 5 класса до взрослых",
    topics_header: "Темы в разделе",
    cta_title: "Готов начать?",
    cta_desc: "Без регистрации — сразу переходишь к первой задаче",
    f_contact: "Контакты",
    f_privacy: "Конфиденциальность"
  }
};

function getLang() {
  try {
    return localStorage.getItem('math_logic_lang') || 'kz';
  } catch(e) {
    return 'kz';
  }
}

function setLang(lang) {
  try {
    localStorage.setItem('math_logic_lang', lang);
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
