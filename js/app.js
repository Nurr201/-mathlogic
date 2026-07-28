/* ========================================
   APP — math·logic
   Точка входа: инициализация, глобальные события
   ======================================== */

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

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (typeof closeModal === 'function') closeModal();
  }
});

document.addEventListener('DOMContentLoaded', function() {
  loadSubtopicsProgress();
  NAV.fixLinks();
  UI.initAnimations();
  ML.applySettings();
  ML.updateLastVisit();
  var modalOverlay = document.getElementById('topic-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay && typeof closeModal === 'function') {
        closeModal();
      }
    });
  }
});
