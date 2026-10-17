// ==========================================
// REEN BANK - OTP.JS
// ==========================================

// ---------- 1. SETTINGS & ELEMENTS ----------
const TEST_OTP = "123456"; // demo only: replace with a real OTP service later
const OTP_LENGTH = 6;
const OTP_SECONDS = 30;

const KEYS = {
  otp: "reenBankOTP",
  pendingUser: "reenBankPendingUser",
  user: "reenBankUser",
  loggedIn: "reenBankLoggedIn",
};

const $ = (id) => document.getElementById(id);

const otpInputs = document.querySelectorAll(".otp-input");
const verifyBtn = $("verifyBtn");
const resendBtn = $("resendBtn");
const timer = $("timer");
const otpError = $("otpError");

const successPopup = $("successPopup");
const loadingPopup = $("loadingPopup");
const errorPopup = $("errorPopup");
const expiredPopup = $("expiredPopup");
const resendPopup = $("resendPopup");
const errorTitle = $("errorTitle");
const errorMessage = $("errorMessage");
const dashboardBtn = $("dashboardBtn");
const goRegisterBtn = $("goRegisterBtn");
const getOtpAgainBtn = $("getOtpAgainBtn");


// ---------- 2. HELPERS ----------
// Popups use "hidden" + "flex" so items-center / justify-center work
function setPopup(popup, visible) {
  if (!popup) return;
  popup.classList.toggle("hidden", !visible);
  popup.classList.toggle("flex", visible);
}

function showError(title, message, showRegisterBtn = false) {
  if (errorTitle) errorTitle.textContent = title;
  if (errorMessage) errorMessage.textContent = message;
  if (goRegisterBtn) goRegisterBtn.classList.toggle("hidden", !showRegisterBtn);
  setPopup(errorPopup, true);
}

// Inline error under the boxes (no popup): used for incomplete / incorrect codes
function showOtpError(message) {
  otpError.textContent = message;
  otpError.classList.remove("hidden");
  otpInputs.forEach((input) => {
    input.classList.remove("border-gray-400");
    input.classList.add("border-red-500");
  });
}

function clearOtpError() {
  otpError.textContent = "";
  otpError.classList.add("hidden");
  otpInputs.forEach((input) => {
    input.classList.remove("border-red-500");
    input.classList.add("border-gray-400");
  });
}

function getEnteredOTP() {
  return Array.from(otpInputs).map((input) => input.value).join("");
}

function clearInputs() {
  otpInputs.forEach((input) => (input.value = ""));
  otpInputs[0].focus();
}

function randomAccountNumber() {
  return String(Math.floor(1e9 + Math.random() * 9e9));
}


// ---------- 3. TIMER ----------
let timeLeft = OTP_SECONDS;
let timerInterval;

function renderTimer() {
  if (!timer) return;
  timer.textContent = timeLeft > 0 ? `00:${String(timeLeft).padStart(2, "0")}` : "Expired";
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = OTP_SECONDS;
  renderTimer();

  timerInterval = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) clearInterval(timerInterval);
  }, 1000);
}

startTimer();


// ---------- 4. OTP INPUT BOXES ----------
otpInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    clearOtpError();

    // Numbers only, one digit per box
    input.value = input.value.replace(/\D/g, "").slice(0, 1);

    // Move to the next box
    if (input.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }

    autoVerify();
  });

  input.addEventListener("keydown", (event) => {
    // Backspace on an empty box goes back one box
    if (event.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});

// Paste a full code into the first box
otpInputs[0].addEventListener("paste", (event) => {
  event.preventDefault();

  const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
  if (pasted.length !== OTP_LENGTH) return;

  clearOtpError();
  otpInputs.forEach((input, i) => (input.value = pasted[i] || ""));
  otpInputs[OTP_LENGTH - 1].focus();
  autoVerify();
});


// ---------- 5. NEW CODE (used by Resend and Get OTP Again) ----------
function sendNewCode() {
  localStorage.setItem(KEYS.otp, TEST_OTP);
  startTimer();
  clearOtpError();
  clearInputs();
  console.log("New OTP:", TEST_OTP);
}

let resendPopupTimeout;

resendBtn.addEventListener("click", () => {
  sendNewCode();

  // Show the "New Code Sent" popup, then hide it after 2 seconds
  setPopup(resendPopup, true);
  clearTimeout(resendPopupTimeout);
  resendPopupTimeout = setTimeout(() => setPopup(resendPopup, false), 2000);
});

// Tap outside the popup to close it early
if (resendPopup) {
  resendPopup.addEventListener("click", (e) => {
    if (e.target === resendPopup) setPopup(resendPopup, false);
  });
}

if (getOtpAgainBtn) {
  getOtpAgainBtn.addEventListener("click", () => {
    sendNewCode();
    setPopup(expiredPopup, false);
  });
}


// ---------- 6. CREATE THE ACCOUNT ----------
// New users start with ₦0 in every account.
function createUser(pendingUser) {
  return {
    ...pendingUser,
    schema: 2,
    accountNumber: pendingUser.accountNumber || randomAccountNumber(),
    accounts: [
      { name: "Main Account", balance: 0 },
      { name: "School Savings", balance: 0 },
      { name: "Holiday Plan", balance: 0 },
    ],
    transactions: [],
  };
}


// ---------- 7. VERIFY ----------
let isVerifying = false; // stops double-runs (auto + button)

function verifyOtp() {
  if (isVerifying) return;
  clearOtpError();
  const enteredOTP = getEnteredOTP();

  if (enteredOTP.length !== OTP_LENGTH) {
    showOtpError("Incomplete code. Please fill in all 6 digits.");
    return;
  }

  if (timeLeft <= 0) {
    setPopup(expiredPopup, true);
    return;
  }

  if (enteredOTP !== localStorage.getItem(KEYS.otp)) {
    showOtpError("Incorrect code. Please try again.");
    return;
  }

  // ----- Code is correct: get the pending registration -----
  clearInterval(timerInterval);
  isVerifying = true;

  const pendingData = localStorage.getItem(KEYS.pendingUser);

  if (!pendingData) {
    isVerifying = false;
    showError("Registration Unavailable", "Your registration information could not be found. Please register again.", true);
    return;
  }

  let pendingUser;
  try {
    pendingUser = JSON.parse(pendingData);
  } catch (error) {
    isVerifying = false;
    showError("Registration Error", "Your registration information is invalid. Please register again.", true);
    return;
  }

  // ----- Save the real user and log them in -----
  localStorage.setItem(KEYS.user, JSON.stringify(createUser(pendingUser)));
  localStorage.setItem(KEYS.loggedIn, "true");

  // Remove temporary data
  localStorage.removeItem(KEYS.pendingUser);
  localStorage.removeItem(KEYS.otp);

  // ----- Loading, then success -----
  setPopup(loadingPopup, true);

  setTimeout(() => {
    setPopup(loadingPopup, false);
    setPopup(successPopup, true);
  }, 2000);
}

// Button still works, and it also runs automatically when all 6 digits are in
verifyBtn.addEventListener("click", verifyOtp);

function autoVerify() {
  if (getEnteredOTP().length === OTP_LENGTH) verifyOtp();
}


// ---------- 8. GO TO REGISTER (from the registration error popup) ----------
if (goRegisterBtn) {
  goRegisterBtn.addEventListener("click", () => {
    window.location.href = "register.html";
  });
}


// ---------- 9. GO TO DASHBOARD ----------
if (dashboardBtn) {
  dashboardBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
}
