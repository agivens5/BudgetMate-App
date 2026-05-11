let database = JSON.parse(localStorage.getItem("budgetMateDB")) || {
  users: [],
  currentUser: null,
  accounts: [],
  transactions: [],
  goals: [],
  payments: []
};

function saveDB() {
  localStorage.setItem("budgetMateDB", JSON.stringify(database));
  renderAll();
}

// --- Helper Functions ---

function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerText = text;
  el.className = 'message ' + type;
  setTimeout(() => { el.innerText = ''; el.className = 'message'; }, 4000);
}

function getCurrentUserObj() {
  return database.users.find(u => u.email === database.currentUser);
}

function getUserAccounts() {
  return database.accounts.filter(a => a.owner === database.currentUser);
}

function getUserTransactions() {
  return database.transactions.filter(t => t.owner === database.currentUser);
}

function getUserGoals() {
  return database.goals.filter(g => g.owner === database.currentUser);
}

function getUserPayments() {
  return database.payments.filter(p => p.owner === database.currentUser);
}

// --- Navigation ---

function showSection(sectionId) {
  const protectedSections = ['dashboard', 'accounts', 'transactions', 'goals'];
  if (protectedSections.includes(sectionId) && !database.currentUser) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('login').classList.add('active');
    showMessage('loginMessage', 'Please log in first.', 'error');
    updateNav();
    return;
  }
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  updateNav();
}

function updateNav() {
  const loggedIn = !!database.currentUser;
  document.querySelectorAll('nav button[data-auth="guest"]').forEach(b => b.style.display = loggedIn ? 'none' : '');
  document.querySelectorAll('nav button[data-auth="user"]').forEach(b => b.style.display = loggedIn ? '' : 'none');

  // Highlight active nav button
  const activeSection = document.querySelector('.page.active');
  const activeSectionId = activeSection ? activeSection.id : null;
  document.querySelectorAll('nav button[data-section]').forEach(b => {
    b.classList.toggle('nav-active', b.dataset.section === activeSectionId);
  });
}

// --- Tabs ---

function showTab(sectionId, tabId) {
  const section = document.getElementById(sectionId);
  section.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  section.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  // Find the tab button that triggered this
  section.querySelectorAll('.tab').forEach(t => {
    if (t.getAttribute('onclick').includes(tabId)) {
      t.classList.add('active');
    }
  });
}

// --- Auth ---

function toggleAuthMode(isSignup) {
  document.getElementById('signupFields').style.display = isSignup ? '' : 'none';
  document.getElementById('signupActions').style.display = isSignup ? '' : 'none';
  document.getElementById('loginActions').style.display = isSignup ? 'none' : '';
  document.getElementById('authTitle').innerText = isSignup ? 'Create Account' : 'Welcome Back';
  document.getElementById('authSubtitle').innerText = isSignup
    ? 'Sign up to start managing your finances'
    : 'Sign in to manage your finances';
  // Clear fields and messages
  document.getElementById('name').value = '';
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
  document.getElementById('loginMessage').innerText = '';
  document.getElementById('loginMessage').className = 'message';
}

function createUser() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    showMessage('loginMessage', 'Please complete all fields.', 'error');
    return;
  }

  if (database.users.some(u => u.email === email)) {
    showMessage('loginMessage', 'An account with this email already exists.', 'error');
    return;
  }

  database.users.push({ name, email, password, spendingLimit: 0 });
  database.currentUser = email;
  saveDB();

  showMessage('loginMessage', 'Account created successfully.', 'success');
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";

  showSection("dashboard");
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const user = database.users.find(u => u.email === email && u.password === password);

  if (user) {
    database.currentUser = email;
    saveDB();

    document.getElementById("email").value = "";
    document.getElementById("password").value = "";

    showSection("dashboard");
  } else {
    showMessage('loginMessage', 'Invalid email or password.', 'error');
  }
}

function resetPassword() {
  showMessage('loginMessage', 'Password reset feature simulated for prototype.', 'success');
}

function logout() {
  database.currentUser = null;
  saveDB();
  showSection("login");
  showMessage('loginMessage', 'You have been logged out.', 'success');
}

// --- Account Management ---

function createAccount() {
  const name = document.getElementById("accountName").value;
  const type = document.getElementById("accountType").value;

  if (!name) {
    showMessage('accountsMessage', 'Enter an account name.', 'error');
    return;
  }

  database.accounts.push({
    id: Date.now(),
    name,
    type,
    balance: 0,
    owner: database.currentUser
  });

  saveDB();
  showMessage('accountsMessage', 'Account created successfully.', 'success');
  document.getElementById("accountName").value = "";
  document.getElementById("accountType").value = "Checking";
}

function deposit() {
  const success = updateBalance("deposit");
  if (success) {
    document.getElementById("amount").value = "";
    showMessage('accountsMessage', 'Deposit successful.', 'success');
  }
}

function withdraw() {
  const success = updateBalance("withdraw");
  if (success) {
    document.getElementById("amount").value = "";
    showMessage('accountsMessage', 'Withdrawal successful.', 'success');
  }
}

function updateBalance(type) {
  const accountId = Number(document.getElementById("accountSelect").value);
  const amount = Number(document.getElementById("amount").value);
  const account = database.accounts.find(a => a.id === accountId && a.owner === database.currentUser);

  if (!account || amount <= 0) {
    showMessage('accountsMessage', 'Select an account and enter a valid amount.', 'error');
    return false;
  }

  if (type === "deposit") {
    account.balance += amount;
  } else {
    const limit = getCurrentUserObj()?.spendingLimit || 0;
    if (limit > 0 && amount > limit) {
      showMessage('accountsMessage', `Amount exceeds your spending limit of $${limit.toFixed(2)}.`, 'error');
      return false;
    }
    if (account.balance < amount) {
      showMessage('accountsMessage', 'Insufficient funds.', 'error');
      return false;
    }
    account.balance -= amount;
  }

  database.transactions.push({
    id: Date.now(),
    type,
    account: account.name,
    amount,
    date: new Date().toLocaleString(),
    owner: database.currentUser
  });

  saveDB();
  return true;
}

function transfer() {
  const fromId = Number(document.getElementById("fromAccount").value);
  const toId = Number(document.getElementById("toAccount").value);
  const amount = Number(document.getElementById("transferAmount").value);

  const from = database.accounts.find(a => a.id === fromId && a.owner === database.currentUser);
  const to = database.accounts.find(a => a.id === toId && a.owner === database.currentUser);

  if (!from || !to || fromId === toId || amount <= 0) {
    showMessage('accountsMessage', 'Invalid transfer. Select two different accounts and enter a valid amount.', 'error');
    return;
  }

  const limit = getCurrentUserObj()?.spendingLimit || 0;
  if (limit > 0 && amount > limit) {
    showMessage('accountsMessage', `Transfer exceeds your spending limit of $${limit.toFixed(2)}.`, 'error');
    return;
  }

  if (from.balance < amount) {
    showMessage('accountsMessage', 'Insufficient funds.', 'error');
    return;
  }

  from.balance -= amount;
  to.balance += amount;

  database.transactions.push({
    id: Date.now(),
    type: "transfer",
    account: `${from.name} to ${to.name}`,
    amount,
    date: new Date().toLocaleString(),
    owner: database.currentUser
  });

  saveDB();
  document.getElementById("transferAmount").value = "";
  showMessage('accountsMessage', 'Transfer completed successfully.', 'success');
}

function deleteAccount(id) {
  if (!confirm('Are you sure you want to delete this account?')) return;
  database.accounts = database.accounts.filter(a => a.id !== id);
  saveDB();
  showMessage('accountsMessage', 'Account deleted.', 'success');
}

function editAccount(id) {
  const account = database.accounts.find(a => a.id === id);
  if (!account) return;
  const div = document.getElementById(`account-${id}`);
  div.innerHTML = `
    <input id="editAccountName-${id}" value="${sanitize(account.name)}" />
    <select id="editAccountType-${id}">
      <option value="Checking" ${account.type === 'Checking' ? 'selected' : ''}>Checking</option>
      <option value="Savings" ${account.type === 'Savings' ? 'selected' : ''}>Savings</option>
    </select>
    <div class="btn-group">
      <button class="btn-sm" onclick="saveAccount(${id})">Save</button>
      <button class="btn-sm btn-outline" onclick="renderAccounts()">Cancel</button>
    </div>
  `;
}

function saveAccount(id) {
  const name = document.getElementById(`editAccountName-${id}`).value;
  const type = document.getElementById(`editAccountType-${id}`).value;
  if (!name) {
    showMessage('accountsMessage', 'Account name is required.', 'error');
    return;
  }
  const account = database.accounts.find(a => a.id === id);
  account.name = name;
  account.type = type;
  saveDB();
  showMessage('accountsMessage', 'Account updated.', 'success');
}

function setLimit() {
  const limit = Number(document.getElementById("spendingLimit").value);

  if (limit < 0 || document.getElementById("spendingLimit").value === "") {
    showMessage('accountsMessage', 'Enter a valid spending limit.', 'error');
    return;
  }

  const user = getCurrentUserObj();
  if (user) {
    user.spendingLimit = limit;
    saveDB();
  }

  document.getElementById("spendingLimit").value = "";
  showMessage('accountsMessage', 'Spending limit saved.', 'success');
}

// --- Goals ---

function addGoal() {
  const name = document.getElementById("goalName").value;
  const amount = Number(document.getElementById("goalAmount").value);

  if (!name || amount <= 0) {
    showMessage('goalsMessage', 'Enter valid goal details.', 'error');
    return;
  }

  database.goals.push({
    id: Date.now(),
    name,
    amount,
    owner: database.currentUser
  });

  saveDB();
  document.getElementById("goalName").value = "";
  document.getElementById("goalAmount").value = "";
  showMessage('goalsMessage', 'Goal added successfully.', 'success');
}

function deleteGoal(id) {
  if (!confirm('Are you sure you want to delete this goal?')) return;
  database.goals = database.goals.filter(g => g.id !== id);
  saveDB();
  showMessage('goalsMessage', 'Goal deleted.', 'success');
}

function editGoal(id) {
  const goal = database.goals.find(g => g.id === id);
  if (!goal) return;
  const div = document.getElementById(`goal-${id}`);
  div.innerHTML = `
    <input id="editGoalName-${id}" value="${sanitize(goal.name)}" />
    <input id="editGoalAmount-${id}" type="number" value="${goal.amount}" min="0.01" step="0.01" />
    <div class="btn-group">
      <button class="btn-sm" onclick="saveGoal(${id})">Save</button>
      <button class="btn-sm btn-outline" onclick="renderGoals()">Cancel</button>
    </div>
  `;
}

function saveGoal(id) {
  const name = document.getElementById(`editGoalName-${id}`).value;
  const amount = Number(document.getElementById(`editGoalAmount-${id}`).value);
  if (!name || amount <= 0) {
    showMessage('goalsMessage', 'Enter valid goal details.', 'error');
    return;
  }
  const goal = database.goals.find(g => g.id === id);
  goal.name = name;
  goal.amount = amount;
  saveDB();
  showMessage('goalsMessage', 'Goal updated.', 'success');
}

// --- Scheduled Payments ---

function schedulePayment() {
  const name = document.getElementById("paymentName").value;
  const amount = Number(document.getElementById("paymentAmount").value);
  const date = document.getElementById("paymentDate").value;

  if (!name || amount <= 0 || !date) {
    showMessage('goalsMessage', 'Enter valid payment details.', 'error');
    return;
  }

  database.payments.push({
    id: Date.now(),
    name,
    amount,
    date,
    owner: database.currentUser
  });

  saveDB();
  document.getElementById("paymentName").value = "";
  document.getElementById("paymentAmount").value = "";
  document.getElementById("paymentDate").value = "";
  showMessage('goalsMessage', 'Payment scheduled successfully.', 'success');
}

function deletePayment(id) {
  if (!confirm('Are you sure you want to delete this payment?')) return;
  database.payments = database.payments.filter(p => p.id !== id);
  saveDB();
  showMessage('goalsMessage', 'Payment deleted.', 'success');
}

function editPayment(id) {
  const payment = database.payments.find(p => p.id === id);
  if (!payment) return;
  const div = document.getElementById(`payment-${id}`);
  div.innerHTML = `
    <input id="editPaymentName-${id}" value="${sanitize(payment.name)}" />
    <input id="editPaymentAmount-${id}" type="number" value="${payment.amount}" min="0.01" step="0.01" />
    <input id="editPaymentDate-${id}" type="date" value="${payment.date}" />
    <div class="btn-group">
      <button class="btn-sm" onclick="savePayment(${id})">Save</button>
      <button class="btn-sm btn-outline" onclick="renderPayments()">Cancel</button>
    </div>
  `;
}

function savePayment(id) {
  const name = document.getElementById(`editPaymentName-${id}`).value;
  const amount = Number(document.getElementById(`editPaymentAmount-${id}`).value);
  const date = document.getElementById(`editPaymentDate-${id}`).value;
  if (!name || amount <= 0 || !date) {
    showMessage('goalsMessage', 'Enter valid payment details.', 'error');
    return;
  }
  const payment = database.payments.find(p => p.id === id);
  payment.name = name;
  payment.amount = amount;
  payment.date = date;
  saveDB();
  showMessage('goalsMessage', 'Payment updated.', 'success');
}

// --- Rendering ---

function renderAll() {
  renderAccounts();
  renderTransactions();
  renderGoals();
  renderPayments();
  renderDashboard();
}

function renderAccounts() {
  const accountList = document.getElementById("accountList");
  const selects = ["accountSelect", "fromAccount", "toAccount"];
  const accounts = getUserAccounts();

  accountList.innerHTML = "";

  selects.forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = `<option value="">Select Account</option>`;
  });

  accounts.forEach(account => {
    accountList.innerHTML += `
      <div class="item" id="account-${account.id}">
        <div class="item-info">
          <strong>${sanitize(account.name)}</strong>
          <span style="color:#64748b">(${sanitize(account.type)})</span>
          &mdash; <strong style="color:#0f766e">$${account.balance.toFixed(2)}</strong>
        </div>
        <div class="item-actions">
          <button class="btn-sm" onclick="editAccount(${account.id})">Edit</button>
          <button class="btn-sm btn-danger" onclick="deleteAccount(${account.id})">Delete</button>
        </div>
      </div>
    `;

    selects.forEach(id => {
      const select = document.getElementById(id);
      select.innerHTML += `
        <option value="${account.id}">${sanitize(account.name)} ($${account.balance.toFixed(2)})</option>
      `;
    });
  });

  // Toggle empty state
  const noAccounts = document.getElementById("noAccounts");
  if (noAccounts) noAccounts.style.display = accounts.length ? 'none' : '';
}

function renderTransactions() {
  const list = document.getElementById("transactionList");
  const transactions = getUserTransactions();
  list.innerHTML = "";

  // Show most recent first
  [...transactions].reverse().forEach(t => {
    const badgeClass = t.type === 'deposit' ? 'badge-deposit' : t.type === 'withdraw' ? 'badge-withdraw' : 'badge-transfer';
    const amountClass = t.type === 'deposit' ? 'amount-positive' : t.type === 'withdraw' ? 'amount-negative' : 'amount-neutral';
    const sign = t.type === 'deposit' ? '+' : t.type === 'withdraw' ? '-' : '';

    list.innerHTML += `
      <div class="transaction-item">
        <span class="transaction-badge ${badgeClass}">${sanitize(t.type)}</span>
        <div class="transaction-details">
          <strong>${sanitize(t.account)}</strong>
          <small>${sanitize(t.date)}</small>
        </div>
        <span class="transaction-amount ${amountClass}">${sign}$${t.amount.toFixed(2)}</span>
      </div>
    `;
  });

  // Toggle empty state
  const noTransactions = document.getElementById("noTransactions");
  if (noTransactions) noTransactions.style.display = transactions.length ? 'none' : '';
}

function renderGoals() {
  const list = document.getElementById("goalList");
  const goals = getUserGoals();
  list.innerHTML = "";

  goals.forEach(goal => {
    list.innerHTML += `
      <div class="item" id="goal-${goal.id}">
        <div class="item-info">
          <strong>${sanitize(goal.name)}</strong>
          &mdash; Goal: <strong style="color:#0f766e">$${goal.amount.toFixed(2)}</strong>
        </div>
        <div class="item-actions">
          <button class="btn-sm" onclick="editGoal(${goal.id})">Edit</button>
          <button class="btn-sm btn-danger" onclick="deleteGoal(${goal.id})">Delete</button>
        </div>
      </div>
    `;
  });

  // Toggle empty state
  const noGoals = document.getElementById("noGoals");
  if (noGoals) noGoals.style.display = goals.length ? 'none' : '';
}

function renderPayments() {
  const list = document.getElementById("paymentList");
  const payments = getUserPayments();
  list.innerHTML = "";

  payments.forEach(payment => {
    list.innerHTML += `
      <div class="item" id="payment-${payment.id}">
        <div class="item-info">
          <strong>${sanitize(payment.name)}</strong>
          &mdash; <strong style="color:#0f766e">$${payment.amount.toFixed(2)}</strong>
          <span style="color:#64748b">due ${sanitize(payment.date)}</span>
        </div>
        <div class="item-actions">
          <button class="btn-sm" onclick="editPayment(${payment.id})">Edit</button>
          <button class="btn-sm btn-danger" onclick="deletePayment(${payment.id})">Delete</button>
        </div>
      </div>
    `;
  });

  // Toggle empty state
  const noPayments = document.getElementById("noPayments");
  if (noPayments) noPayments.style.display = payments.length ? 'none' : '';
}

function renderDashboard() {
  const total = getUserAccounts().reduce((sum, account) => sum + account.balance, 0);
  const userLimit = getCurrentUserObj()?.spendingLimit || 0;
  const userName = getCurrentUserObj()?.name || '';

  document.getElementById("totalBalance").innerText = `$${total.toFixed(2)}`;
  document.getElementById("limitDisplay").innerText = userLimit > 0 ? `$${userLimit.toFixed(2)}` : 'Not set';
  document.getElementById("welcomeText").innerText = userName
    ? `Welcome back, ${userName}! Here's an overview of your finances.`
    : 'Welcome! Here\'s an overview of your finances.';

  const userTransactions = getUserTransactions();
  const recent = userTransactions[userTransactions.length - 1];

  document.getElementById("recentActivity").innerText = recent
    ? `${recent.type} - $${recent.amount.toFixed(2)}`
    : "No transactions yet.";
}

// --- Auto Logout (Simulated for FR#21) ---
setTimeout(() => {
  if (database.currentUser) {
    database.currentUser = null;
    saveDB();
    showSection("login");
    showMessage('loginMessage', 'Auto logout after inactivity.', 'error');
  }
}, 15 * 60 * 1000);

// --- Initialize ---
renderAll();
updateNav();
if (database.currentUser) {
  showSection("dashboard");
}
