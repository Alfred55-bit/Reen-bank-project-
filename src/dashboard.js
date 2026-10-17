// ==========================================
// REEN BANK - DASHBOARD.JS
// ==========================================

// LOGIN CHECK
const raw = localStorage.getItem("reenBankUser");
if (!raw || localStorage.getItem("reenBankLoggedIn") !== "true") {
  window.location.href = "login1.html";
  throw new Error("User is not logged in.");
}

let user = JSON.parse(raw);

// FIRST-TIME SETUP
if (!user.schema || user.schema !== 2) {
  user.schema = 2;
  user.accountNumber = user.accountNumber || String(Math.floor(1000000000 + Math.random() * 9000000000));
  user.accounts = [
    { name: "Main Account", balance: 0 },
    { name: "School Savings", balance: 0 },
    { name: "Holiday Plan", balance: 0 }
  ];
  user.transactions = [];
  delete user.balance;
  delete user.income;
  delete user.expense;
}

user.accounts = Array.isArray(user.accounts) && user.accounts.length
  ? user.accounts
  : [
      { name: "Main Account", balance: 0 },
      { name: "School Savings", balance: 0 },
      { name: "Holiday Plan", balance: 0 }
    ];

user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
user.beneficiaries = Array.isArray(user.beneficiaries) ? user.beneficiaries : [];

const save = () => localStorage.setItem("reenBankUser", JSON.stringify(user));
save();

// HELPERS
const $ = id => document.getElementById(id);

const money = n => "₦" + Number(n || 0).toLocaleString("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

const show = (el, on) => {
  if (!el) return;
  el.classList.toggle("hidden", !on);
  el.classList.toggle("flex", on);
};

const fmtDate = iso => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${d.toLocaleString("en-GB", { month: "short" })}.${d.getFullYear()} - ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const totalBalance = () => user.accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);

let hideTotal = false;
const hiddenAccounts = new Set();

const mask = (value, hide) => hide ? "••••••" : money(value);

function inRange(iso, filter) {
  const d = new Date(iso);
  const now = new Date();

  if (filter === "year") return d.getFullYear() === now.getFullYear();

  const month = filter === "last"
    ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
}

function sums(filter) {
  let income = 0;
  let expense = 0;

  user.transactions.forEach(t => {
    if (t.status === "Completed" && !t.internal && inRange(t.date, filter)) {
      if (t.type === "income") income += Number(t.amount || 0);
      else expense += Number(t.amount || 0);
    }
  });

  return { inc: income, exp: expense };
}

const DEFAULT_AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#D3F3E6"/><circle cx="50" cy="38" r="18" fill="#33B884"/><path d="M14 100c0-22 16-36 36-36s36 14 36 36z" fill="#33B884"/></svg>'
);

const avatar = () => user.photo || DEFAULT_AVATAR;
let txAccount = 0;

// ACCOUNT CARD
function accountCard(account, index, actions = false, selected, eye = actions || selected !== undefined) {
  const hidden = hiddenAccounts.has(index);

  return `
  <div ${selected === undefined ? "" : `data-select="${index}"`} class="bg-[#D3F3E6] rounded-xl min-h-[144px] px-6 xl:px-10 py-8 ${selected === undefined ? "" : `cursor-pointer border-l-8 ${selected ? "border-indigo-900" : "border-transparent"}`}">
    <div class="flex justify-between items-start">
      <p class="text-indigo-900">${esc(account.name)}</p>
      ${eye ? `<button data-eye="${index}" type="button"><i class="fa-regular ${hidden ? "fa-eye" : "fa-eye-slash"}"></i></button>` : ""}
    </div>
    <p class="num text-[28px] font-semibold mt-2">${mask(account.balance, hidden || hideTotal)}</p>
    ${actions ? `
    <div class="flex gap-3 mt-5">
      <button data-fund="${index}" type="button" class="flex-1 bg-emerald-500 text-white font-semibold py-2 rounded-lg">Fund</button>
      <button data-withdraw="${index}" type="button" class="flex-1 bg-gray-300 font-semibold py-2 rounded-lg">Withdraw</button>
    </div>` : ""}
  </div>`;
}

// TRANSACTION ROW
function txRow(t) {
  const income = t.type === "income";
  const name = esc(t.name || user.name || "User");
  const amount = money(t.amount).slice(1);
  const badge = t.status === "Completed"
    ? "bg-emerald-500 text-white"
    : t.status === "Canceled"
      ? "bg-red-500 text-white"
      : "bg-gray-300 text-gray-600";

  return `
  <div class="flex items-center gap-3 md:grid md:grid-cols-[40px_1.4fr_1fr_1.4fr_1fr_130px] md:gap-4 py-3 border-b border-gray-200/70 text-sm text-gray-500">
    <span class="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center text-white text-lg ${income ? "bg-emerald-500" : "bg-red-500"}">${income ? "+" : "−"}</span>
    <div class="flex-1 min-w-0">
      <p class="truncate">${name}</p>
      <p class="md:hidden text-xs text-gray-400">${esc(t.method || "")} · ${fmtDate(t.date)}</p>
    </div>
    <span class="hidden md:block">${esc(t.method || "")}</span>
    <span class="hidden md:block">${fmtDate(t.date)}</span>
    <span class="num text-xl ${income ? "text-emerald-500" : "text-red-500"}">${income ? "+" : "- "}${amount}</span>
    <span class="text-center rounded-md px-2 py-1 md:py-2 text-xs md:text-sm font-semibold ${badge}">${esc(t.status)}</span>
  </div>`;
}

// NOTIFICATION ROW
function notifRow(t) {
  const income = t.type === "income";
  const account = esc(t.account || t.title || "your account");

  let text;

  if (t.bank) {
    text = `You sent ${money(t.amount)} to ${esc(t.name)} (${esc(t.bank)}).`;
  } else if (t.internal) {
    text = income
      ? `${money(t.amount)} was moved from ${esc(t.name)} to ${account}.`
      : `${money(t.amount)} was moved from ${account} to ${esc(t.name)}.`;
  } else {
    text = income
      ? `${money(t.amount)} was added to ${account} via ${esc(t.method)}.`
      : `${money(t.amount)} was withdrawn from ${account}.`;
  }

  return `
  <div class="flex gap-3 py-2 border-b border-gray-100 text-sm">
    <span class="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-white ${income ? "bg-emerald-500" : "bg-red-500"}">${income ? "+" : "−"}</span>
    <div>
      <p>${text}</p>
      <p class="text-xs text-gray-400">${fmtDate(t.date)}</p>
    </div>
  </div>`;
}

// SIDE TRANSACTION
function sideRow(t) {
  const income = t.type === "income";

  return `
  <div class="flex items-center justify-between gap-3 py-[18px] border-b border-gray-200/70 text-[15px] text-gray-500">
    <span class="flex-1 truncate">${esc(t.name || user.name || "User")}</span>
    <span>${fmtDate(t.date)}</span>
    <span class="num text-[22px] ${income ? "text-emerald-500" : "text-red-500"}">${income ? "+" : "- "}${money(t.amount).slice(1)}</span>
  </div>`;
}

const emptyTx = `<p class="text-center text-gray-400 py-8">No transactions yet.</p>`;

// RENDER
function render() {
  const dateFilter = $("dateFilter");
  const statsFilter = $("statsFilter");

  const top = sums(dateFilter ? dateFilter.value : "this");
  const stats = sums(statsFilter ? statsFilter.value : "this");

  if ($("headerName")) $("headerName").textContent = user.name || "User";
  if ($("headerAccount")) $("headerAccount").textContent = user.accountNumber || "";
  if ($("profileName")) $("profileName").textContent = user.name || "";
  if ($("profileBadge")) $("profileBadge").textContent = user.pro ? "Pro User" : "Standard User";

  if ($("profilePhoto")) $("profilePhoto").src = avatar();
  if ($("profileBtn")?.querySelector("img")) $("profileBtn").querySelector("img").src = avatar();
  if ($("menuAvatar")) $("menuAvatar").src = avatar();
  if ($("menuName")) $("menuName").textContent = user.name || "User";
  if ($("menuAccount")) $("menuAccount").textContent = user.accountNumber || "";

  if ($("sideAccount")) $("sideAccount").innerHTML = accountCard(user.accounts[0], 0, false, undefined, true);

  if ($("txAccounts")) {
    $("txAccounts").innerHTML = user.accounts.map((a, i) => accountCard(a, i, false, i === txAccount)).join("");
  }

  if ($("notificationPopup")) {
    $("notificationPopup").innerHTML =
      `<p class="font-semibold mb-2">Notifications</p>` +
      user.transactions.filter(t => !t.noNotif).slice(0, 20).map(notifRow).join("") +
      `<p class="text-sm text-gray-500 pt-3">Welcome to Reen Bank!</p>`;
  }

  const unread = user.transactions.filter(t => !t.noNotif && !t.read).length + (!user.notifSeen && user.transactions.length === 0 ? 1 : 0);

  if ($("notificationDot")) $("notificationDot").classList.toggle("hidden", unread <= 0);

  if ($("balanceAmount")) $("balanceAmount").textContent = mask(totalBalance(), hideTotal);
  if ($("incomeAmount")) $("incomeAmount").textContent = mask(top.inc, hideTotal);
  if ($("expenseAmount")) $("expenseAmount").textContent = mask(top.exp, hideTotal);
  if ($("statsIncome")) $("statsIncome").textContent = mask(stats.inc, hideTotal);
  if ($("statsExpense")) $("statsExpense").textContent = mask(stats.exp, hideTotal);

  const max = stats.inc + stats.exp;

  if ($("incomeBar")) $("incomeBar").style.width = (max ? stats.inc / max * 100 : 0) + "%";
  if ($("expenseBar")) $("expenseBar").style.width = (max ? stats.exp / max * 100 : 0) + "%";

  if ($("accountsContainer")) {
    $("accountsContainer").innerHTML = user.accounts.map((a, i) => accountCard(a, i, false)).join("");
  }

  if ($("allAccountsContainer")) {
    $("allAccountsContainer").className = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6";
    $("allAccountsContainer").innerHTML =
      user.accounts.map((a, i) => accountCard(a, i, true)).join("") +
      `<button data-add type="button" class="bg-gray-100/80 rounded-xl p-6 text-left min-h-[150px]">
        <p class="font-semibold"><i class="fa-solid fa-plus mr-3"></i>Add Account</p>
      </button>`;
  }

  const selectedAccount = user.accounts[txAccount]?.name || user.accounts[0].name;

  const transactions = user.transactions.filter(t => (t.account || t.title) === selectedAccount);

  if ($("transactionsContainer")) {
    $("transactionsContainer").innerHTML = transactions.length
      ? transactions.map(txRow).join("")
      : emptyTx;
  }

  if ($("accountsTx")) {
    $("accountsTx").innerHTML = user.transactions.length
      ? user.transactions.slice(0, 4).map(txRow).join("")
      : emptyTx;
  }

  if ($("sideTransactions")) {
    $("sideTransactions").innerHTML = user.transactions.length
      ? user.transactions.slice(0, 8).map(sideRow).join("")
      : emptyTx;
  }
}

// NAVIGATION
const titles = {
  overview: "Overview",
  accounts: "Accounts",
  transactions: "Transactions",
  profile: "Profile"
};

function showSection(name) {
  ["overview", "accounts", "transactions", "profile"].forEach(section => {
    const el = $(section + "Section");
    if (el) el.classList.toggle("hidden", section !== name);
  });

  document.querySelectorAll(".navBtn").forEach(button => {
    const active = button.dataset.section === name;
    button.classList.toggle("text-green-500", active);
    button.classList.toggle("text-gray-700", !active);
    button.classList.toggle("font-semibold", active);

    const icon = button.querySelector("i");

    if (icon && icon.hasAttribute("data-solid")) {
      icon.classList.toggle("fa-solid", active);
      icon.classList.toggle("fa-regular", !active);
    }
  });

  document.querySelectorAll("[data-menu]").forEach(button => {
    const active = button.dataset.menu === name;
    button.classList.toggle("bg-emerald-50", active);
    button.classList.toggle("text-emerald-600", active);
    button.classList.toggle("font-semibold", active);
  });

  const h1 = document.querySelector("header h1");
  if (h1) h1.textContent = titles[name] || "Overview";

  const overview = name === "overview";
  const profile = name === "profile";

  const overviewSection = $("overviewSection");
  if (overviewSection?.parentElement) {
    overviewSection.parentElement.classList.toggle("max-w-[711px]", overview);
  }

  const rightAside = document.querySelector("main > aside:last-child");

  if (rightAside) rightAside.classList.toggle("hidden", !(overview || profile));
  if ($("sideAccount")) $("sideAccount").classList.toggle("hidden", !profile);
  if ($("proBtn")) $("proBtn").classList.toggle("hidden", profile || !!user.pro);
}

document.querySelectorAll(".navBtn").forEach(button => {
  button.addEventListener("click", () => showSection(button.dataset.section));
});

if ($("profileBtn")) {
  $("profileBtn").addEventListener("click", () => showSection("profile"));
}

if ($("viewTransactionsBtn")) {
  $("viewTransactionsBtn").addEventListener("click", () => showSection("transactions"));
}

// FUND / WITHDRAW MODAL
document.body.insertAdjacentHTML("beforeend", `
<div id="txModal" class="hidden fixed inset-0 bg-black/50 z-50 items-center justify-center px-5">
  <div class="bg-white rounded-2xl p-8 w-full max-w-[420px] max-h-[90vh] overflow-y-auto">
    <h2 id="txTitle" class="text-3xl font-bold text-emerald-500"></h2>
    <p id="txAccount" class="text-gray-500 mb-5"></p>
    <label class="block text-sm font-semibold mb-1">Amount (₦)</label>
    <input id="txAmount" type="number" min="1" step="0.01" placeholder="0.00" class="w-full border rounded-xl p-3 outline-none mb-4">
    <div id="fundOnly">
      <p class="text-sm font-semibold mb-2">Select Payment Method</p>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <label class="border rounded-xl p-3 flex gap-2 items-center"><input type="radio" name="method" value="Direct Pay"> Direct Pay</label>
        <label class="border rounded-xl p-3 flex gap-2 items-center"><input type="radio" name="method" value="Credit Card" checked> Credit Card</label>
      </div>
      <div id="cardFields" class="space-y-3">
        <input id="cardNumber" inputmode="numeric" maxlength="19" placeholder="0000 0000 0000 0000" class="w-full border rounded-xl p-3 outline-none">
        <input id="cardName" placeholder="Card holder name" class="w-full border rounded-xl p-3 outline-none">
        <div class="grid grid-cols-2 gap-4">
          <input id="cardExp" maxlength="5" placeholder="MM/YY" class="border rounded-xl p-3 outline-none">
          <input id="cardCvc" inputmode="numeric" maxlength="3" placeholder="000" class="border rounded-xl p-3 outline-none">
        </div>
      </div>
      <p id="directNote" class="hidden text-sm text-gray-500">Direct Pay (demo): the amount is added straight to this account.</p>
    </div>
    <p id="txError" class="text-red-500 text-sm mt-3"></p>
    <div class="grid grid-cols-2 gap-4 mt-5">
      <button id="txCancel" class="bg-gray-300 font-semibold py-3 rounded-xl">Cancel</button>
      <button id="txSubmit" class="bg-emerald-500 text-white font-semibold py-3 rounded-xl"></button>
    </div>
  </div>
</div>`);

let modal = { mode: "fund", idx: 0 };

function openTx(mode, index) {
  modal = { mode, idx: index };

  $("txTitle").textContent = mode === "fund" ? "Fund Wallet" : "Withdraw";
  $("txAccount").textContent = user.accounts[index].name + (
    index > 0
      ? mode === "fund"
        ? " (paid from Main Account)"
        : " (money goes to Main Account)"
      : ""
  );

  $("txSubmit").textContent = mode === "fund" ? "Fund" : "Withdraw";
  $("fundOnly").classList.toggle("hidden", mode !== "fund" || index > 0);

  ["txAmount", "cardNumber", "cardName", "cardExp", "cardCvc"].forEach(id => {
    if ($(id)) $(id).value = "";
  });

  const creditCard = document.querySelector('input[name="method"][value="Credit Card"]');
  if (creditCard) creditCard.checked = true;

  toggleMethod();
  $("txError").textContent = "";
  show($("txModal"), true);
  $("txAmount").focus();
}

function toggleMethod() {
  const selected = document.querySelector('input[name="method"]:checked');
  const isCard = selected?.value === "Credit Card";

  $("cardFields").classList.toggle("hidden", !isCard);
  $("directNote").classList.toggle("hidden", isCard);
}

document.querySelectorAll('input[name="method"]').forEach(radio => {
  radio.addEventListener("change", toggleMethod);
});

$("cardNumber").addEventListener("input", e => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
});

$("cardExp").addEventListener("input", e => {
  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
  e.target.value = value.length > 2 ? value.slice(0, 2) + "/" + value.slice(2) : value;
});

$("txCancel").addEventListener("click", () => show($("txModal"), false));

$("txModal").addEventListener("click", e => {
  if (e.target === $("txModal")) show($("txModal"), false);
});

$("txSubmit").addEventListener("click", () => {
  const error = message => $("txError").textContent = message;
  const amount = Math.round(parseFloat($("txAmount").value) * 100) / 100;
  const account = user.accounts[modal.idx];

  if (!(amount > 0)) return error("Enter an amount greater than zero.");

  if (modal.mode === "fund" && modal.idx > 0) {
    const main = user.accounts[0];

    if (amount > main.balance) {
      return error("Not enough money in Main Account. Fund Main Account first.");
    }

    main.balance -= amount;
    account.balance += amount;

    const date = new Date().toISOString();

    user.transactions.unshift(
      {
        name: account.name,
        account: main.name,
        method: "Account Transfer",
        type: "expense",
        amount,
        status: "Completed",
        date,
        internal: true
      },
      {
        name: main.name,
        account: account.name,
        method: "Account Transfer",
        type: "income",
        amount,
        status: "Completed",
        date,
        internal: true,
        noNotif: true
      }
    );

    save();
    show($("txModal"), false);
    render();
    showSuccess(`${money(amount)} moved to ${account.name}`);
    return;
  }

  if (modal.mode === "withdraw" && modal.idx > 0) {
    const main = user.accounts[0];

    if (amount > account.balance) {
      return error("Insufficient funds in " + account.name + ".");
    }

    account.balance -= amount;
    main.balance += amount;

    const date = new Date().toISOString();

    user.transactions.unshift(
      {
        name: main.name,
        account: account.name,
        method: "Account Transfer",
        type: "expense",
        amount,
        status: "Completed",
        date,
        internal: true
      },
      {
        name: account.name,
        account: main.name,
        method: "Account Transfer",
        type: "income",
        amount,
        status: "Completed",
        date,
        internal: true,
        noNotif: true
      }
    );

    save();
    show($("txModal"), false);
    render();
    showSuccess(`${money(amount)} moved to ${main.name}`);
    return;
  }

  let method = "Bank Transfer";

  if (modal.mode === "fund") {
    method = document.querySelector('input[name="method"]:checked')?.value || "Direct Pay";

    if (method === "Credit Card") {
      const number = $("cardNumber").value.replace(/\s/g, "");
      const expiry = $("cardExp").value.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);

      if (!/^\d{16}$/.test(number)) return error("Card number must be 16 digits.");
      if (!$("cardName").value.trim()) return error("Enter the card holder name.");

      if (!expiry || new Date(2000 + Number(expiry[2]), Number(expiry[1]), 1) <= new Date()) {
        return error("Enter a valid expiry date (MM/YY).");
      }

      if (!/^\d{3}$/.test($("cardCvc").value)) {
        return error("CVC must be 3 digits.");
      }
    }

    account.balance += amount;
  } else {
    if (amount > account.balance) {
      return error("Insufficient funds in this account.");
    }

    account.balance -= amount;
  }

  user.transactions.unshift({
    name: user.name || "User",
    account: account.name,
    method,
    type: modal.mode === "fund" ? "income" : "expense",
    amount,
    status: "Completed",
    date: new Date().toISOString()
  });

  save();
  show($("txModal"), false);
  render();

  showSuccess(
    modal.mode === "fund"
      ? `${money(amount)} added to ${account.name}`
      : `${money(amount)} withdrawn from ${account.name}`
  );
});

// TRANSFER TO OTHER BANKS
const BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "FCMB",
  "Globus Bank",
  "GTBank",
  "Keystone Bank",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "Titan Trust Bank",
  "UBA",
  "Union Bank",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank"
];

const fieldCls = "w-full border rounded-xl p-3 mb-4 outline-none bg-white";

document.body.insertAdjacentHTML("beforeend", `
<div id="trModal" class="hidden fixed inset-0 bg-black/50 z-50 items-center justify-center px-5">
  <div class="bg-white rounded-2xl p-8 w-full max-w-[420px] max-h-[90vh] overflow-y-auto">
    <h2 class="text-3xl font-bold text-emerald-500 mb-5">Transfer</h2>
    <label class="block text-sm font-semibold mb-1">From</label>
    <select id="trFrom" class="${fieldCls}"></select>
    <label class="block text-sm font-semibold mb-1">Amount (₦)</label>
    <input id="trAmount" type="number" min="1" step="0.01" placeholder="0.00" class="${fieldCls}">
    <label class="block text-sm font-semibold mb-1">Bank</label>
    <select id="trBank" class="${fieldCls}"></select>
    <label class="block text-sm font-semibold mb-1">Account Number</label>
    <input id="trNumber" inputmode="numeric" maxlength="10" placeholder="10 digits" class="${fieldCls}">
    <label class="block text-sm font-semibold mb-1">Beneficiary Name</label>
    <input id="trName" placeholder="Name on the account" class="${fieldCls}">
    <p id="trError" class="text-red-500 text-sm min-h-[20px]"></p>
    <div class="grid grid-cols-2 gap-4 mt-3">
      <button id="trCancel" class="bg-gray-300 font-semibold py-3 rounded-xl">Cancel</button>
      <button id="trSend" class="bg-emerald-500 text-white font-semibold py-3 rounded-xl">Send</button>
    </div>
  </div>
</div>`);

$("trBank").innerHTML = '<option value="">Select bank</option>' + BANKS.map(bank => `<option value="${esc(bank)}">${esc(bank)}</option>`).join("");

$("trNumber").addEventListener("input", e => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
});

function openTransfer(beneficiary, fromIndex = 0) {
  $("trFrom").innerHTML = user.accounts.map((account, index) =>
    `<option value="${index}">${esc(account.name)} (${money(account.balance)})</option>`
  ).join("");

  $("trFrom").value = String(fromIndex);
  $("trAmount").value = "";
  $("trBank").value = beneficiary?.bank || "";
  $("trNumber").value = beneficiary?.number || "";
  $("trName").value = beneficiary?.name || "";
  $("trError").textContent = "";

  show($("trModal"), true);
  $("trAmount").focus();
}

$("trCancel").addEventListener("click", () => show($("trModal"), false));

$("trModal").addEventListener("click", e => {
  if (e.target === $("trModal")) show($("trModal"), false);
});

$("trSend").addEventListener("click", () => {
  const error = message => $("trError").textContent = message;
  const from = user.accounts[Number($("trFrom").value)];
  const amount = Math.round(parseFloat($("trAmount").value) * 100) / 100;
  const bank = $("trBank").value;
  const number = $("trNumber").value;
  const name = $("trName").value.trim();

  if (!(amount > 0)) return error("Enter an amount greater than zero.");
  if (!bank) return error("Select the beneficiary's bank.");
  if (!/^\d{10}$/.test(number)) return error("Account number must be 10 digits.");
  if (name.length < 2) return error("Enter the beneficiary name.");
  if (number === user.accountNumber) return error("Use Fund to move money between your own accounts.");
  if (amount > from.balance) return error("Insufficient funds in " + from.name + ".");

  from.balance -= amount;

  user.transactions.unshift({
    name,
    account: from.name,
    method: "Bank Transfer",
    type: "expense",
    amount,
    status: "Completed",
    date: new Date().toISOString(),
    bank,
    toAccount: number
  });

  user.beneficiaries = user.beneficiaries.filter(b => !(b.number === number && b.bank === bank));
  user.beneficiaries.unshift({ name, bank, number });

  save();
  show($("trModal"), false);
  render();
  showSuccess(`${money(amount)} sent to ${name}`);
});

// SEARCH
function runSearch() {
  const input = $("searchInput");
  const box = $("searchResults");

  if (!input || !box) return;

  const query = input.value.toLowerCase().trim();

  if (!query) {
    box.classList.add("hidden");
    return;
  }

  const accounts = user.accounts.filter(a => a.name.toLowerCase().includes(query));

  const people = user.beneficiaries
    .map((b, i) => ({ b, i }))
    .filter(({ b }) =>
      `${b.name}${b.bank}${b.number}`.toLowerCase().includes(query)
    );

  const me = `${user.name || ""}${user.email || ""}${user.accountNumber || ""}`
    .toLowerCase()
    .includes(query);

  const transactions = user.transactions
    .filter(t =>
      `${t.name || ""}${t.method || ""}${t.status || ""}${t.type || ""}${t.account || ""}${t.bank || ""}${t.amount || ""}`
        .toLowerCase()
        .includes(query)
    )
    .slice(0, 5);

  const row = (attrs, main, sub) =>
    `<button ${attrs} type="button" class="w-full text-left px-4 py-3 border-b border-gray-100"><p class="font-medium">${main}</p><p class="text-xs text-gray-500">${sub}</p></button>`;

  const group = (title, rows) =>
    rows.length
      ? `<p class="px-4 pt-3 text-xs text-gray-400">${title}</p>${rows.join("")}`
      : "";

  const html =
    group("Accounts", accounts.map(a =>
      row('data-goto="accounts"', esc(a.name), money(a.balance))
    )) +
    group("Users", [
      ...(me
        ? [row('data-goto="profile"', esc(user.name || "You"), "You · " + esc(user.accountNumber))]
        : []),
      ...people.slice(0, 5).map(({ b, i }) =>
        row(`data-person="${i}"`, esc(b.name), `${esc(b.bank)} · ${esc(b.number)} · tap to send money`)
      )
    ]) +
    group("Transactions", transactions.map(t =>
      row(
        `data-goto="transactions" data-select="${Math.max(0, user.accounts.findIndex(a => a.name === (t.account || t.title)))}"`,
        `${esc(t.name || user.name)} · ${t.type === "income" ? "+" : "-"}${money(t.amount)}`,
        `${esc(t.method || "")} · ${fmtDate(t.date)}`
      )
    ));

  box.innerHTML = html || '<p class="px-4 py-4 text-sm text-gray-400">No results found.</p>';
  box.classList.remove("hidden");
}

// ADD ACCOUNT
if ($("addAccountBtn")) {
  $("addAccountBtn").addEventListener("click", () => {
    $("newAccountName").value = "";
    show($("accountPopup"), true);
    $("newAccountName").focus();
  });
}

if ($("closeAccountPopup")) {
  $("closeAccountPopup").addEventListener("click", () => show($("accountPopup"), false));
}

if ($("accountPopup")) {
  $("accountPopup").addEventListener("click", e => {
    if (e.target === $("accountPopup")) show($("accountPopup"), false);
  });
}

if ($("saveAccountBtn")) {
  $("saveAccountBtn").addEventListener("click", () => {
    const name = $("newAccountName").value.trim();

    if (!name) return alert("Please enter an account name.");

    if (user.accounts.some(account => account.name.toLowerCase() === name.toLowerCase())) {
      return alert("You already have an account with that name.");
    }

    user.accounts.push({ name, balance: 0 });
    save();
    show($("accountPopup"), false);
    render();
  });
}

// DYNAMIC BUTTONS
document.addEventListener("click", e => {
  const button = e.target.closest("[data-fund],[data-withdraw],[data-eye],[data-add],[data-goto],[data-select],[data-person]");

  if (!button) return;

  if ("fund" in button.dataset) {
    openTx("fund", Number(button.dataset.fund));
  } else if ("withdraw" in button.dataset) {
    const index = Number(button.dataset.withdraw);
    index === 0 ? openTransfer(undefined, 0) : openTx("withdraw", index);
  } else if ("eye" in button.dataset) {
    const index = Number(button.dataset.eye);
    hiddenAccounts.has(index) ? hiddenAccounts.delete(index) : hiddenAccounts.add(index);
    render();
  } else if ("add" in button.dataset) {
    if ($("addAccountBtn")) $("addAccountBtn").click();
  } else if ("person" in button.dataset) {
    openTransfer(user.beneficiaries[Number(button.dataset.person)]);
  }

  if ("goto" in button.dataset) {
    showSection(button.dataset.goto);
  }

  if ("select" in button.dataset) {
    txAccount = Number(button.dataset.select);
    render();
  }

  if (button.closest("#searchResults")) {
    $("searchInput").value = "";
    $("searchResults").classList.add("hidden");
  }
});

// TOP BAR
if ($("balanceToggle")) {
  $("balanceToggle").addEventListener("click", () => {
    hideTotal = !hideTotal;
    $("balanceIcon").className = "fa-regular " + (hideTotal ? "fa-eye" : "fa-eye-slash");
    render();
  });
}

if ($("dateFilter")) $("dateFilter").addEventListener("change", render);

if ($("statsFilter")) $("statsFilter").addEventListener("change", render);

if ($("searchBtn")) {
  $("searchBtn").addEventListener("click", () => {
    $("searchBox").classList.toggle("hidden");
    $("searchInput").focus();
  });
}

if ($("searchInput")) $("searchInput").addEventListener("input", runSearch);

if ($("notificationBtn")) {
  $("notificationBtn").addEventListener("click", e => {
    e.stopPropagation();

    const closed = $("notificationPopup").classList.toggle("hidden");

    if (!closed) {
      user.transactions.forEach(t => {
        t.read = true;
      });

      user.notifSeen = user.transactions.length;
      save();
      $("notificationDot").classList.add("hidden");
    }
  });
}

document.addEventListener("click", e => {
  const popup = $("notificationPopup");
  const button = $("notificationBtn");

  if (popup && button && !popup.contains(e.target) && !button.contains(e.target)) {
    popup.classList.add("hidden");
  }
});

// LOGOUT MODAL
document.body.insertAdjacentHTML("beforeend", `
<div id="logoutModal" class="hidden fixed inset-0 bg-white/70 backdrop-blur-sm z-50 items-center justify-center px-5">
  <div class="relative bg-white rounded-3xl p-8 md:p-10 w-full max-w-[420px] shadow-[0_0_80px_rgba(51,184,132,0.3)]">
    <button id="logoutX" aria-label="Close" class="absolute top-4 right-5 text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
    <p class="text-lg text-gray-500 mt-2">Are you sure you want to Logout?</p>
    <div class="grid grid-cols-2 gap-5 mt-8">
      <button id="logoutCancel" class="bg-gray-300 font-bold py-4 rounded-xl">Cancel</button>
      <button id="logoutConfirm" class="bg-emerald-500 text-white font-bold py-4 rounded-xl">Logout</button>
    </div>
  </div>
</div>`);

if ($("logoutBtn")) {
  $("logoutBtn").addEventListener("click", () => show($("logoutModal"), true));
}

["logoutX", "logoutCancel"].forEach(id => {
  $(id).addEventListener("click", () => show($("logoutModal"), false));
});

$("logoutModal").addEventListener("click", e => {
  if (e.target === $("logoutModal")) show($("logoutModal"), false);
});

$("logoutConfirm").addEventListener("click", () => {
  localStorage.removeItem("reenBankLoggedIn");
  window.location.href = "login1.html";
});

// INITIAL SETUP
if ($("notificationPopup")) {
  $("notificationPopup").classList.add("w-[90vw]", "max-w-[340px]", "max-h-[70vh]", "overflow-y-auto");
}

const now = new Date();

const monthName = offset =>
  new Date(now.getFullYear(), now.getMonth() + offset, 1)
    .toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric"
    });

if ($("dateFilter")) {
  $("dateFilter").innerHTML =
    `<option value="this">This Month (${monthName(0)})</option>` +
    `<option value="last">Last Month (${monthName(-1)})</option>` +
    `<option value="year">This Year (${now.getFullYear()})</option>`;
}

if ($("statsFilter")) {
  $("statsFilter").innerHTML =
    '<option value="this">This Month</option>' +
    '<option value="last">Last Month</option>' +
    '<option value="year">This Year</option>';
}

// ACCOUNTS PAGE
document.querySelectorAll("#accountsSection > h2, #transactionsSection > h2, #profileSection > h2")
  .forEach(h => h.classList.add("hidden"));

if ($("transactionsContainer")) $("transactionsContainer").className = "";

if ($("allAccountsContainer") && !$("accountsTx")) {
  $("allAccountsContainer").insertAdjacentHTML("afterend", `
    <div class="flex justify-between items-center mt-12 mb-2">
      <h2 class="text-2xl font-bold">Transactions</h2>
      <button data-goto="transactions" type="button" class="text-emerald-500 font-semibold">View All <i class="fa-solid fa-arrow-right ml-2"></i></button>
    </div>
    <div id="accountsTx"></div>
  `);
}

// TRANSACTIONS PAGE
if ($("transactionsContainer") && !$("txAccounts")) {
  $("transactionsContainer").insertAdjacentHTML(
    "beforebegin",
    '<div id="txAccounts" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"></div>'
  );
}

// RIGHT SIDEBAR ACCOUNT
const rightAside = document.querySelector("main > aside:last-child");

if (rightAside && !$("sideAccount")) {
  rightAside.insertAdjacentHTML(
    "afterbegin",
    '<div id="sideAccount" class="hidden mb-10"></div>'
  );
}

// PROFILE
if ($("profileSection")) {
  $("profileSection").innerHTML = `
  <div class="bg-white rounded-2xl p-8 md:p-12 max-w-[700px] mx-auto shadow-sm">
    <div class="relative w-40 h-40 mx-auto">
      <img id="profilePhoto" class="w-40 h-40 rounded-full object-cover" alt="Profile picture">
      <button id="editPhotoBtn" aria-label="Change profile picture" class="absolute top-1 right-1 w-9 h-9 rounded-full bg-gray-200 shadow"><i class="fa-solid fa-pen"></i></button>
      <input id="photoInput" type="file" accept="image/*" class="hidden">
    </div>
    <h2 id="profileName" class="text-3xl font-bold text-center mt-5"></h2>
    <p class="text-center mt-3"><span id="profileBadge" class="bg-purple-100 text-purple-900 font-semibold px-5 py-2 rounded-lg text-sm"></span></p>
    <div class="max-w-[360px] mx-auto mt-10 space-y-6">
      <div class="border-b pb-4">
        <label for="profileEmailInput" class="text-emerald-500 text-sm">Email</label>
        <input id="profileEmailInput" type="email" class="w-full text-xl font-semibold outline-none bg-transparent">
      </div>
      <div class="border-b pb-4">
        <label for="profilePhoneInput" class="text-emerald-500 text-sm">Phone Number</label>
        <input id="profilePhoneInput" type="tel" class="w-full text-xl font-semibold outline-none bg-transparent">
      </div>
      <div>
        <p class="text-emerald-500 text-sm">Gender</p>
        <select id="profileGender" class="w-full text-xl font-semibold outline-none bg-transparent mt-1">
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>
      <p id="profileMsg" class="text-sm min-h-[20px]"></p>
      <button id="saveProfileBtn" class="w-full bg-emerald-500 text-white text-xl font-semibold py-4 rounded-xl">Save Profile</button>
    </div>
  </div>`;

  $("profileEmailInput").value = user.email || "";
  $("profilePhoneInput").value = user.phone || "";
  $("profileGender").value = user.gender || "Male";
}

const setMsg = (message, bad = false) => {
  if (!$("profileMsg")) return;

  $("profileMsg").textContent = message;
  $("profileMsg").className = "text-sm min-h-[20px] " + (
    bad ? "text-red-500" : "text-emerald-500"
  );
};

if ($("editPhotoBtn")) {
  $("editPhotoBtn").addEventListener("click", () => $("photoInput").click());
}

if ($("photoInput")) {
  $("photoInput").addEventListener("change", e => {
    const file = e.target.files[0];
    e.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return setMsg("Please choose an image file.", true);
    }

    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 256;
      const min = Math.min(image.width, image.height);

      canvas.width = size;
      canvas.height = size;

      canvas.getContext("2d").drawImage(
        image,
        (image.width - min) / 2,
        (image.height - min) / 2,
        min,
        min,
        0,
        0,
        size,
        size
      );

      URL.revokeObjectURL(url);

      user.photo = canvas.toDataURL("image/jpeg", 0.85);

      try {
        save();
        setMsg("Profile picture updated.");
      } catch {
        setMsg("Could not save the picture.", true);
      }

      render();
    };

    image.onerror = () => setMsg("That image could not be read.", true);
    image.src = url;
  });
}

if ($("saveProfileBtn")) {
  $("saveProfileBtn").addEventListener("click", () => {
    const email = $("profileEmailInput").value.trim();
    const phone = $("profilePhoneInput").value.trim();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setMsg("Enter a valid email address.", true);
    }

    if (phone.replace(/\D/g, "").length < 10) {
      return setMsg("Enter a valid phone number.", true);
    }

    user.email = email;
    user.phone = phone;
    user.gender = $("profileGender").value;

    save();
    render();
    setMsg("Profile saved.");
  });
}

// SEARCH RESULTS
if ($("searchInput") && !$("searchResults")) {
  $("searchInput").insertAdjacentHTML(
    "afterend",
    '<div id="searchResults" class="hidden mt-2 max-w-[500px] max-h-[60vh] overflow-y-auto bg-white rounded-xl shadow-lg"></div>'
  );
}

if ($("searchBtn")) {
  $("searchBtn").classList.remove("hidden", "md:block");
}

// PRO MODAL
document.body.insertAdjacentHTML("beforeend", `
<div id="proModal" class="hidden fixed inset-0 bg-black/50 z-50 items-center justify-center px-5">
  <div class="relative bg-white rounded-3xl w-full max-w-[420px] overflow-hidden">
    <div class="bg-emerald-500 text-white p-8">
      <button id="proX" aria-label="Close" class="absolute top-4 right-5 text-white text-xl"><i class="fa-solid fa-xmark"></i></button>
      <i class="fa-solid fa-crown text-2xl mb-4 block"></i>
      <h2 class="text-3xl font-bold">Upgrade to PRO</h2>
      <p class="mt-1">Get more from Reen Bank</p>
    </div>
    <div class="p-8">
      <ul class="space-y-4 text-gray-600">
        <li><i class="fa-solid fa-check text-emerald-500 mr-3"></i>Sign in on more than one device</li>
        <li><i class="fa-solid fa-check text-emerald-500 mr-3"></i>Priority customer support</li>
        <li><i class="fa-solid fa-check text-emerald-500 mr-3"></i>Pro User badge on your profile</li>
      </ul>
      <div class="grid grid-cols-2 gap-4 mt-8">
        <button id="proLater" class="bg-gray-300 font-bold py-3 rounded-xl">Maybe later</button>
        <button id="proUpgrade" class="bg-emerald-500 text-white font-bold py-3 rounded-xl">Upgrade</button>
      </div>
    </div>
  </div>
</div>`);

["proX", "proLater"].forEach(id => {
  $(id).addEventListener("click", () => show($("proModal"), false));
});

$("proModal").addEventListener("click", e => {
  if (e.target === $("proModal")) show($("proModal"), false);
});

if ($("proBtn")) {
  $("proBtn").addEventListener("click", () => show($("proModal"), true));
}

$("proUpgrade").addEventListener("click", () => {
  user.pro = true;
  save();
  show($("proModal"), false);
  $("proBtn").classList.add("hidden");
  render();
});

// MOBILE MENU
const sidebar = document.querySelector("main > aside:first-child");

if (sidebar) {
  sidebar.classList.remove("flex");
  sidebar.classList.add("hidden", "lg:flex");
}

const headerLeft = document.querySelector("header > div:first-child");

if (headerLeft && !$("menuBtn")) {
  headerLeft.insertAdjacentHTML(
    "afterbegin",
    '<button id="menuBtn" aria-label="Open menu" class="lg:hidden w-10 h-10 text-2xl"><i class="fa-solid fa-bars"></i></button>'
  );
}

const menuItems = [
  ["overview", "Overview", "fa-solid fa-grip"],
  ["accounts", "Accounts", "fa-regular fa-credit-card"],
  ["transactions", "Transactions", "fa-solid fa-arrow-right-arrow-left"],
  ["profile", "Profile", "fa-regular fa-user"]
];

document.body.insertAdjacentHTML("beforeend", `
<div id="menuOverlay" class="hidden fixed inset-0 z-50 bg-black/40">
  <nav class="bg-white h-full w-[280px] max-w-[80vw] p-6 flex flex-col shadow-xl overflow-y-auto">
    <div class="flex items-start justify-between">
      <img id="menuAvatar" class="w-14 h-14 rounded-full object-cover" alt="">
      <button id="menuClose" aria-label="Close menu" class="text-xl text-gray-500"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <p id="menuName" class="font-bold text-lg mt-3 truncate"></p>
    <p id="menuAccount" class="text-sm text-gray-500"></p>
    <div class="border-t my-5"></div>
    <div class="space-y-1">
      ${menuItems.map(([id, label, icon]) => `
      <button data-menu="${id}" type="button" class="w-full flex items-center gap-4 p-4 rounded-xl text-left text-gray-700">
        <i class="${icon} w-6 text-center"></i>
        <span>${label}</span>
      </button>`).join("")}
    </div>
    <div class="border-t mt-auto pt-4">
      <button id="menuLogout" type="button" class="w-full flex items-center gap-4 p-4 rounded-xl text-left text-red-500">
        <i class="fa-solid fa-arrow-left w-6 text-center"></i>
        <span>Logout</span>
      </button>
    </div>
  </nav>
</div>`);

const toggleMenu = on => {
  show($("menuOverlay"), on);
  document.body.classList.toggle("overflow-hidden", on);
};

if ($("menuBtn")) $("menuBtn").addEventListener("click", () => toggleMenu(true));
$("menuClose").addEventListener("click", () => toggleMenu(false));

$("menuOverlay").addEventListener("click", e => {
  if (e.target === $("menuOverlay")) toggleMenu(false);
});

document.querySelectorAll("[data-menu]").forEach(button => {
  button.addEventListener("click", () => {
    showSection(button.dataset.menu);
    toggleMenu(false);
    window.scrollTo(0, 0);
  });
});

$("menuLogout").addEventListener("click", () => {
  toggleMenu(false);
  show($("logoutModal"), true);
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    toggleMenu(false);
    if ($("notificationPopup")) $("notificationPopup").classList.add("hidden");
  }
});

// SUCCESS POPUP
document.body.insertAdjacentHTML("beforeend", `
<div id="successPopup" class="hidden fixed inset-0 z-[60] bg-black/30 items-center justify-center px-5">
  <div class="bg-white rounded-3xl p-8 w-full max-w-[320px] text-center shadow-[0_0_80px_rgba(51,184,132,0.3)]">
    <div class="w-16 h-16 mx-auto rounded-full bg-emerald-500 text-white text-3xl flex items-center justify-center">✓</div>
    <p class="text-2xl font-bold mt-4">Successful</p>
    <p id="successDetail" class="text-gray-500 text-sm mt-1"></p>
  </div>
</div>`);

let successTimer;

function showSuccess(detail) {
  $("successDetail").textContent = detail || "";
  show($("successPopup"), true);
  clearTimeout(successTimer);
  successTimer = setTimeout(() => show($("successPopup"), false), 2200);
}

$("successPopup").addEventListener("click", () => show($("successPopup"), false));

// START
render();
showSection("overview");