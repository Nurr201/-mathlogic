(function() {
  'use strict';
  function lang() { return ML.getLang(); }
  function copy(ru, kk) { return lang() === 'kk' ? kk : ru; }
  function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
  function hasProfile(user) { return Boolean(user && (user.name || user.email || user.passwordHash)); }
  function setError(message) {
    var node = document.getElementById('auth-error');
    if (!node) return;
    node.textContent = message || '';
    node.hidden = !message;
  }
  function randomSalt() {
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(function(value) { return value.toString(16).padStart(2, '0'); }).join('');
  }
  function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer)).map(function(value) { return value.toString(16).padStart(2, '0'); }).join('');
  }
  async function hashPassword(password, salt) {
    var payload = new TextEncoder().encode('mathlogic-local-auth:v1:' + salt + ':' + password);
    return bufferToHex(await crypto.subtle.digest('SHA-256', payload));
  }
  function setBusy(form, busy) {
    var submit = form && form.querySelector('[type="submit"]');
    if (submit) submit.disabled = busy;
  }
  function goToApp() { window.location.href = 'dashboard.html'; }

  function init() {
    ML.applySettings(); MathLogicSite.applyCopy();
    document.querySelector('[data-language-toggle]').textContent = lang() === 'kk' ? 'ҚАЗ' : 'RU';
    document.querySelector('[data-language-toggle]').onclick = function() { ML.setLang(lang() === 'kk' ? 'ru' : 'kk'); location.reload(); };
    document.querySelector('[data-theme-toggle]').onclick = function() { ML.setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); ML.applySettings(); };
    if (ML.isLoggedIn()) { goToApp(); return; }
    if (document.body.dataset.authPage === 'login') {
      var user = ML.getUser() || {};
      var legacy = hasProfile(user) && !user.passwordHash;
      var legacyPanel = document.getElementById('legacy-login');
      if (legacyPanel) legacyPanel.hidden = !legacy;
      document.getElementById('auth-form').onsubmit = async function(event) {
        event.preventDefault();
        setError('');
        var form = event.currentTarget;
        var email = normalizeEmail(document.getElementById('auth-email').value);
        var password = document.getElementById('auth-password').value;
        if (!hasProfile(user)) {
          setError(copy('На этом устройстве ещё нет профиля. Сначала зарегистрируйтесь.', 'Бұл құрылғыда профиль әлі жоқ. Алдымен тіркеліңіз.'));
          return;
        }
        if (!user.passwordHash || !user.passwordSalt) {
          setError(copy('Этот профиль создан в прежней версии. Используйте вход без пароля ниже.', 'Бұл профиль алдыңғы нұсқада жасалған. Төмендегі құпиясөзсіз кіруді пайдаланыңыз.'));
          return;
        }
        setBusy(form, true);
        try {
          var hash = await hashPassword(password, user.passwordSalt);
          if (normalizeEmail(user.email) !== email || hash !== user.passwordHash) {
            setError(copy('Неверный email или пароль.', 'Email немесе құпиясөз қате.'));
            return;
          }
          ML.setUser({ loggedIn:true });
          goToApp();
        } catch (error) {
          setError(copy('Не удалось выполнить вход. Попробуйте ещё раз.', 'Кіру мүмкін болмады. Қайталап көріңіз.'));
        } finally {
          setBusy(form, false);
        }
      };
      document.getElementById('auth-continue').onclick = function() {
        if (!legacy) return;
        ML.setUser({ loggedIn:true });
        goToApp();
      };
      return;
    }
    document.getElementById('auth-form').onsubmit = async function(event) {
      event.preventDefault();
      setError('');
      var form = event.currentTarget;
      var currentUser = ML.getUser() || {};
      if (hasProfile(currentUser)) {
        setError(copy('Профиль на этом устройстве уже создан. Войдите в него.', 'Бұл құрылғыда профиль жасалған. Сол профильге кіріңіз.'));
        return;
      }
      var name = document.getElementById('auth-name').value.trim();
      var email = normalizeEmail(document.getElementById('auth-email').value);
      var password = document.getElementById('auth-password').value;
      var confirmation = document.getElementById('auth-password-confirm').value;
      if (!name || !email || password.length < 8) {
        setError(copy('Заполните все поля. Пароль должен содержать не менее 8 символов.', 'Барлық өрісті толтырыңыз. Құпиясөз кемінде 8 таңбадан тұруы керек.'));
        return;
      }
      if (password !== confirmation) {
        setError(copy('Пароли не совпадают.', 'Құпиясөздер сәйкес емес.'));
        return;
      }
      setBusy(form, true);
      try {
        var salt = randomSalt();
        var hash = await hashPassword(password, salt);
        ML.setUser({ name:name, email:email, createdAt:Date.now(), loggedIn:true, authVersion:1, passwordSalt:salt, passwordHash:hash });
        goToApp();
      } catch (error) {
        setError(copy('Не удалось создать профиль. Попробуйте ещё раз.', 'Профиль жасау мүмкін болмады. Қайталап көріңіз.'));
      } finally {
        setBusy(form, false);
      }
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
