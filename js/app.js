/* ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ: ПРОГРЕСС, АВТОРИЗАЦИЯ, МОДАЛКИ, НАВИГАЦИЯ */

// Хранилище прогресса
let completedSubtopics = {};

function loadSubtopicsProgress() {
  try {
    const saved = localStorage.getItem('math_logic_subtopics');
    if (saved) completedSubtopics = JSON.parse(saved);
  } catch(e) {
    completedSubtopics = {};
  }
}

function saveSubtopicsProgress() {
  try {
    localStorage.setItem('math_logic_subtopics', JSON.stringify(completedSubtopics));
  } catch(e) {}
  if (typeof updateOverallProgress === 'function') {
    updateOverallProgress();
  }
}

function resetSubtopicsProgress() {
  if (confirm('Барлық прогресті нөлдегіңіз келе ме? / Сбросить весь прогресс?')) {
    completedSubtopics = {};
    saveSubtopicsProgress();
    if (typeof renderSubjects === 'function') renderSubjects();
    if (typeof renderSections === 'function') renderSections();
  }
}

// Обработка авторизации (login.html)
function handleLogin(e) {
  e.preventDefault();
  const emailInput = e.target.querySelector('input[type="email"]');
  const userEmail = emailInput ? emailInput.value : 'user@example.com';
  
  try {
    localStorage.setItem('math_logic_user', JSON.stringify({ email: userEmail, loggedIn: true }));
  } catch(e) {}
  
  alert("Кіру орындалды! / Вход выполнен успешно!");
  window.location.href = "dashboard.html";
}

// Данные Онбординга (onboarding.html)
const onboardingUserData = { goals: ['math'], level: 'middle', age: '14-17' };

function toggleGoal(elem, goalKey) {
  elem.classList.toggle('active');
  if (onboardingUserData.goals.includes(goalKey)) {
    onboardingUserData.goals = onboardingUserData.goals.filter(g => g !== goalKey);
  } else {
    onboardingUserData.goals.push(goalKey);
  }
}

function selectLevel(elem, levelKey) {
  document.querySelectorAll('#step-2 .brilliant-card').forEach(c => c.classList.remove('active'));
  elem.classList.add('active');
  onboardingUserData.level = levelKey;
}

function selectAge(elem, ageKey) {
  document.querySelectorAll('#step-3 .brilliant-card').forEach(c => c.classList.remove('active'));
  elem.classList.add('active');
  onboardingUserData.age = ageKey;
}

function nextOnboardingStep(stepNumber) {
  document.querySelectorAll('.step-pane').forEach(p => p.classList.add('hidden'));
  const targetStep = document.getElementById(`step-${stepNumber}`);
  if (targetStep) targetStep.classList.remove('hidden');

  const stepCount = document.getElementById('step-count');
  if (stepCount) stepCount.innerText = `${stepNumber} / 3 қадам`;

  const progressMap = { 1: '33%', 2: '66%', 3: '100%' };
  const progressBar = document.getElementById('progress');
  if (progressBar && progressMap[stepNumber]) {
    progressBar.style.width = progressMap[stepNumber];
  }
}

function showRegistration() {
  const progressHeader = document.getElementById('progress-header');
  if (progressHeader) progressHeader.style.display = 'none';
  
  document.querySelectorAll('.step-pane').forEach(p => p.classList.add('hidden'));
  const step4 = document.getElementById('step-4');
  if (step4) step4.classList.remove('hidden');
}

function handleRegister(e) {
  e.preventDefault();
  const nameInput = e.target.querySelector('input[type="text"]');
  const emailInput = e.target.querySelector('input[type="email"]');
  
  const userName = nameInput ? nameInput.value : 'Пользователь';
  const userEmail = emailInput ? emailInput.value : 'user@example.com';

  try {
    localStorage.setItem('math_logic_user', JSON.stringify({
      name: userName,
      email: userEmail,
      goals: onboardingUserData.goals,
      level: onboardingUserData.level,
      age: onboardingUserData.age,
      loggedIn: true
    }));
  } catch(e) {}

  alert(`Тіркелу сәтті өтті! 🎉\nҚош келдіңіз, ${userName}!`);
  window.location.href = "dashboard.html";
}

// Закрытие модального окна по Escape и клику вне его
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (typeof closeModal === 'function') {
      closeModal();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadSubtopicsProgress();

  // Нажатие на фон модалки для закрытия
  const modalOverlay = document.getElementById('topic-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        if (typeof closeModal === 'function') {
          closeModal();
        }
      }
    });
  }
});
