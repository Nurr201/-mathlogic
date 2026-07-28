/* ========================================
   APP — math·logic
   Точка входа: инициализация, глобальные события
   ======================================== */

// Хранилище прогресса (используется dashboard)
let completedSubtopics = {};

function loadSubtopicsProgress() {
  completedSubtopics = ML.getSubtopics();
}

function saveSubtopicsProgress() {
  ML.setSubtopics(completedSubtopics);
  if (typeof updateOverallProgress === 'function') {
    updateOverallProgress();
  }
}

function resetSubtopicsProgress() {
  UI.showConfirm('Барлық прогресті нөлдегіңіз келе ме?', function() {
    completedSubtopics = {};
    saveSubtopicsProgress();
    if (typeof renderSubjects === 'function') renderSubjects();
    if (typeof renderSections === 'function') renderSections();
  });
}

// Закрытие модального окна по Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (typeof closeModal === 'function') closeModal();
  }
});

// Глобальная инициализация
document.addEventListener('DOMContentLoaded', function() {
  loadSubtopicsProgress();
  NAV.fixLinks();
  UI.initAnimations();

  // Модальное окно: клик по фону
  const modalOverlay = document.getElementById('topic-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay && typeof closeModal === 'function') {
        closeModal();
      }
    });
  }
});