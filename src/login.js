// ==========================================
// REEN BANK - LOGIN.JS
// ==========================================

const KEYS = {
  user: "reenBankUser",
  loggedIn: "reenBankLoggedIn",
};

const $ = (id) => document.getElementById(id);


// ---------- LOGIN FORM ----------
$("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = $("loginEmail").value.trim();
  const password = $("password").value;

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  // Get the registered user
  const userData = localStorage.getItem(KEYS.user);

  if (!userData) {
    alert("No registered account found. Please register first.");
    return;
  }

  let user;
  try {
    user = JSON.parse(userData);
  } catch (error) {
    alert("There is a problem with your saved account. Please register again.");
    return;
  }

  // Check the details
  if (email === user.email && password === user.password) {
    localStorage.setItem(KEYS.loggedIn, "true");
    window.location.href = "dashboard.html";
  } else {
    alert("✕ Incorrect email or password");
  }
});


// ---------- FORGOT PASSWORD ----------
const forgotPassword = $("forgotPassword");

if (forgotPassword) {
  forgotPassword.addEventListener("click", () => {
    alert("Password recovery will be available soon.");
  });
}
