// ==========================================
// REEN BANK - REGISTER.JS
// ==========================================

const TEST_OTP = "123456"; // demo only: replace with a real OTP service later

const KEYS = {
  otp: "reenBankOTP",
  pendingUser: "reenBankPendingUser",
  loggedIn: "reenBankLoggedIn",
};

const $ = (id) => document.getElementById(id);

$("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("name").value.trim();
  const email = $("email").value.trim();
  const password = $("password").value;
  const terms = $("terms");

  // ---------- Validation ----------
  if (!name || !email || !password) {
    alert("Please fill in all the fields.");
    return;
  }

  if (terms && !terms.checked) {
    alert("Please agree to the Terms and Conditions.");
    return;
  }

  // ---------- Save temporary data until the OTP is verified ----------
  localStorage.setItem(KEYS.otp, TEST_OTP);
  localStorage.setItem(KEYS.pendingUser, JSON.stringify({ name, email, password }));

  // The user is NOT logged in until the OTP is verified
  localStorage.removeItem(KEYS.loggedIn);

  console.log("Your OTP is:", TEST_OTP);

  window.location.href = "otp.html";
});
