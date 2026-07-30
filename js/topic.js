const questions = [
  { q: "2³ · 2⁵ = ?", answers: ["2⁸","2¹⁵","4⁸","2²"], correct: 0 },
  { q: "5⁹ : 5⁴ = ?", answers: ["5¹³","5⁵","25⁵","5⁴"], correct: 1 },
  { q: "(3²)⁴ = ?", answers: ["3⁶","3⁸","9⁴","12²"], correct: 1 },
  { q: "(2·5)² = ?", answers: ["2²·5²","2⁴·5","10⁴","4·5"], correct: 0 },
  { q: "7¹·7²·7³ = ?", answers: ["7⁶","7⁵","7¹²","49³"], correct: 0 }
];

let quizPoints = 0;
let solved = 0;
let progress = 0;
const lessonStartTime = Date.now();
const totalQuestions = questions.length;

const container = document.getElementById("quizContainer");

questions.forEach((item, index) => {
  const block = document.createElement("div");
  block.className = "card p-10";

  let html = `
    <h3 class="text-2xl font-bold mb-8">
      ${index + 1}. ${item.q}
    </h3>
    <div class="grid gap-4">
  `;

  item.answers.forEach((a, i) => {
    html += `
      <div class="quiz-answer" data-q="${index}" data-a="${i}">
        ${a}
      </div>
    `;
  });

  html += `</div>`;
  block.innerHTML = html;
  container.appendChild(block);
});

document.querySelectorAll(".quiz-answer").forEach(answer => {
  answer.onclick = () => {
    const q = Number(answer.dataset.q);
    const a = Number(answer.dataset.a);
    const parent = answer.parentElement;
    if (parent.dataset.done) return;
    parent.dataset.done = true;

    [...parent.children].forEach(el => {
      el.style.pointerEvents = "none";
    });

    if (a === questions[q].correct) {
      answer.classList.add("correct");
      quizPoints += 24;
      solved++;
    } else {
      answer.classList.add("wrong");
      parent.children[questions[q].correct].classList.add("correct");
    }

    updateStats();
  };
});

function updateStats() {
  document.getElementById("xpLabel").textContent = `${quizPoints} / 120`;
  document.getElementById("finalXP").textContent = quizPoints;
  document.getElementById("correctCount").textContent = solved;
  document.getElementById("xpBar").style.width = (quizPoints / 120 * 100) + "%";

  progress = ((solved / questions.length) * 100);
  document.getElementById("progressBar").style.width = progress + "%";
  document.getElementById("progressText").textContent = Math.round(progress) + "%";

  var scorePct = Math.round((solved / totalQuestions) * 100);
  var grade = QuizEngine.calcGrade(scorePct);
  document.getElementById("lessonGrade").textContent = grade;

  if (solved === questions.length) {
    var xpEarned = QuizEngine.calcXP(solved);
    QuizEngine.completeLesson('algebra_1', {
      score: scorePct, correct: solved, total: totalQuestions,
      attempts: 0, time: Math.round((Date.now() - lessonStartTime) / 1000),
      xpEarned: xpEarned, grade: grade
    });
    document.getElementById('lessonGrade').textContent = grade;
    document.getElementById('finalXP').textContent = xpEarned;
  }
}

document.querySelectorAll(".toggleExample").forEach(button => {
  button.onclick = () => {
    const body = button.parentElement.nextElementSibling;
    body.classList.toggle("hidden");
    button.textContent = body.classList.contains("hidden") ? "Шешу" : "Жасыру";
    MathJax.typesetPromise();
  };
});

ANIME.initPageTransitions();
