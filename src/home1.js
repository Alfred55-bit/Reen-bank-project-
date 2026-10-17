// ==========================================
// REEN BANK - HOME1.JS
// ==========================================

const $ = (id) => document.getElementById(id);


// ---------- 1. MOBILE MENU ----------
const menuBtn = $("menuBtn");
const mobileMenu = $("mobileMenu");

function setMenu(open) {
  mobileMenu.classList.toggle("hidden", !open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.textContent = open ? "✕" : "☰";
}

menuBtn.addEventListener("click", () => {
  setMenu(mobileMenu.classList.contains("hidden"));
});

// Close the menu when a link is clicked
document.querySelectorAll(".mobile-link").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});


// ---------- 2. HERO BUTTON ANIMATION ----------
[$("getStarted"), $("learnMore")].forEach((button) => {
  if (!button) return;

  const setScale = (transform) => (button.style.transform = transform);
  button.style.transition = "0.3s ease";

  button.addEventListener("mouseenter", () => setScale("translateY(-5px) scale(1.05)"));
  button.addEventListener("mouseleave", () => setScale("translateY(0) scale(1)"));
  button.addEventListener("mousedown", () => setScale("scale(0.95)"));
  button.addEventListener("mouseup", () => setScale("scale(1.05)"));
});


// ---------- 3. BANK CARD FADE (fades as it leaves the screen) ----------
const bankCard = $("bankCard");

function fadeCard() {
  if (!bankCard) return;

  const rect = bankCard.getBoundingClientRect();
  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(window.innerHeight, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  const opacity = rect.height ? visibleHeight / rect.height : 1;
  bankCard.style.opacity = Math.max(0, Math.min(1, opacity));
}

// Runs only when the page scrolls or resizes (not 60 times a second)
window.addEventListener("scroll", fadeCard, { passive: true });
window.addEventListener("resize", fadeCard);
fadeCard();


// ---------- 4. FAQ (clicked question swaps into the main area) ----------
const activeQuestion = $("activeQuestion");
const activeAnswer = $("activeAnswer");

let currentQuestion = activeQuestion.textContent.trim();
let currentAnswer = activeAnswer.textContent.trim();

document.querySelectorAll(".faq-item").forEach((item) => {
  item.addEventListener("click", () => {
    const newQuestion = item.dataset.question;
    const newAnswer = item.dataset.answer;

    // Put the old main FAQ into the clicked slot
    item.dataset.question = currentQuestion;
    item.dataset.answer = currentAnswer;
    item.querySelector("span:first-child").textContent = currentQuestion;

    // Show the clicked FAQ in the main area
    activeQuestion.textContent = newQuestion;
    activeAnswer.textContent = newAnswer;

    currentQuestion = newQuestion;
    currentAnswer = newAnswer;
  });
});


// ---------- 5. FOOTER EMAIL FORM ----------
$("footerForm").addEventListener("submit", (e) => {
  e.preventDefault();

  if ($("footerEmail").value.trim()) {
    alert("Welcome to Reen Bank!");
  }
});
