let database = JSON.parse(localStorage.getItem("budgetMateDB")) || {
  users: [],
  currentUser: null,
  accounts: [],
  transactions: [],
  goals: [],
  payments: [],
  spendingLimit: 0
};

function saveDB() {
  localStorage.setItem("budgetMateDB", JSON.stringify(database));
  renderAll();
}

function showSection(sectionId) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.getElementById(sectionId).classList.add("active");
}

function createUser() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    document.getElementById("loginMessage").innerText = "Please complete all fields.";
    return;
  }

  database.users.push({ name, email, password });
  database.currentUser = email;
  saveDB();

  document.getElementById("loginMessage").innerText = "Account created successfully.";
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

    document.getElementById("loginMessage").innerText = "Login successful.";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";

    showSection("dashboard");
  } else {
    document.getElementById("loginMessage").innerText = "Invalid login.";
  }
}

function resetPassword() {
  alert("Password reset feature simulated for prototype.");
}

function logout() {
  database.currentUser = null;
  saveDB();
  showSection("login");
  alert("You have been logged out.");
}

function createAccount() {
  const name = document.getElementById("accountName").value;
  const type = document.getElementById("accountType").value;

  if (!name) return alert("Enter an account name.");

  database.accounts.push({
    id: Date.now(),
    name,
    type,
    balance: 0
  });

  saveDB();

  alert("Account created successfully.");

  document.getElementById("accountName").value = "";
  document.getElementById("accountType").value = "Checking";
}

function deposit() {
  const success = updateBalance("deposit");

  if (success) {
    document.getElementById("amount").value = "";
    alert("Deposit successful.");
  }
}

function withdraw() {
  const success = updateBalance("withdraw");

  if (success) {
    document.getElementById("amount").value = "";
    alert("Withdrawal successful.");
  }
}

function updateBalance(type) {
  const accountId = Number(document.getElementById("accountSelect").value);
  const amount = Number(document.getElementById("amount").value);
  const account = database.accounts.find(a => a.id === accountId);

  if (!account || amount <= 0) {
    alert("Select an account and enter a valid amount.");
    return false;
  }

  if (type === "deposit") {
    account.balance += amount;
  } else {
    if (account.balance < amount) {
      alert("Insufficient funds.");
      return false;
    }
    account.balance -= amount;
  }

  database.transactions.push({
    id: Date.now(),
    type,
    account: account.name,
    amount,
    date: new Date().toLocaleString()
  });

  saveDB();
  return true;
}

function transfer() {
  const fromId = Number(document.getElementById("fromAccount").value);
  const toId = Number(document.getElementById("toAccount").value);
  const amount = Number(document.getElementById("transferAmount").value);

  const from = database.accounts.find(a => a.id === fromId);
  const to = database.accounts.find(a => a.id === toId);

  if (!from || !to || fromId === toId || amount <= 0) {
    alert("Invalid transfer. Select two different accounts and enter a valid amount.");
    return;
  }

  if (from.balance < amount) {
    alert("Insufficient funds.");
    return;
  }

  from.balance -= amount;
  to.balance += amount;

  database.transactions.push({
    id: Date.now(),
    type: "transfer",
    account: `${from.name} to ${to.name}`,
    amount,
    date: new Date().toLocaleString()
  });

  saveDB();

  document.getElementById("transferAmount").value = "";
  alert("Transfer completed successfully.");
}

function deleteAccount(id) {
  database.accounts = database.accounts.filter(a => a.id !== id);
  saveDB();
}

function setLimit() {
  const limit = Number(document.getElementById("spendingLimit").value);

  if (limit < 0 || document.getElementById("spendingLimit").value === "") {
    alert("Enter a valid spending limit.");
    return;
  }

  database.spendingLimit = limit;
  saveDB();

  document.getElementById("spendingLimit").value = "";
  alert("Spending limit saved.");
}

function addGoal() {
  const name = document.getElementById("goalName").value;
  const amount = Number(document.getElementById("goalAmount").value);

  if (!name || amount <= 0) return alert("Enter valid goal details.");

  database.goals.push({
    id: Date.now(),
    name,
    amount
  });

  saveDB();

  document.getElementById("goalName").value = "";
  document.getElementById("goalAmount").value = "";
  alert("Goal added successfully.");
}

function deleteGoal(id) {
  database.goals = database.goals.filter(g => g.id !== id);
  saveDB();
}

function schedulePayment() {
  const name = document.getElementById("paymentName").value;
  const amount = Number(document.getElementById("paymentAmount").value);
  const date = document.getElementById("paymentDate").value;

  if (!name || amount <= 0 || !date) return alert("Enter valid payment details.");

  database.payments.push({
    id: Date.now(),
    name,
    amount,
    date
  });

  saveDB();

  document.getElementById("paymentName").value = "";
  document.getElementById("paymentAmount").value = "";
  document.getElementById("paymentDate").value = "";
  alert("Payment scheduled successfully.");
}

function deletePayment(id) {
  database.payments = database.payments.filter(p => p.id !== id);
  saveDB();
}

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

    accountList.innerHTML = "";

    selects.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = `<option value="">Select Account</option>`;
    });

    database.accounts.forEach(account => {
        accountList.innerHTML += `
            <div class="item">
                <strong>${account.name}</strong> (${account.type}) - $${account.balance.toFixed(2)}
                <button onclick="deleteAccount(${account.id})">Delete</button>
            </div>
        `;

        selects.forEach(id => {
            const select = document.getElementById(id);
            select.innerHTML += `
                <option value="${account.id}">${account.name}</option>
            `;
        });
    });
}

function renderTransactions() {
  const list = document.getElementById("transactionList");
  list.innerHTML = "";

  database.transactions.forEach(t => {
    list.innerHTML += `
      <div class="item">
        <strong>${t.type.toUpperCase()}</strong> - ${t.account} - $${t.amount.toFixed(2)}<br>
        <small>${t.date}</small>
      </div>
    `;
  });
}

function renderGoals() {
  const list = document.getElementById("goalList");
  list.innerHTML = "";

  database.goals.forEach(goal => {
    list.innerHTML += `
      <div class="item">
        <strong>${goal.name}</strong> - Goal: $${goal.amount.toFixed(2)}
        <button onclick="deleteGoal(${goal.id})">Delete</button>
      </div>
    `;
  });
}

function renderPayments() {
  const list = document.getElementById("paymentList");
  list.innerHTML = "";

  database.payments.forEach(payment => {
    list.innerHTML += `
      <div class="item">
        <strong>${payment.name}</strong> - $${payment.amount.toFixed(2)} due ${payment.date}
        <button onclick="deletePayment(${payment.id})">Delete</button>
      </div>
    `;
  });
}

function renderDashboard() {
  const total = database.accounts.reduce((sum, account) => sum + account.balance, 0);

  document.getElementById("totalBalance").innerText = `$${total.toFixed(2)}`;
  document.getElementById("limitDisplay").innerText = `$${database.spendingLimit.toFixed(2)}`;

  const recent = database.transactions[database.transactions.length - 1];

  document.getElementById("recentActivity").innerText = recent
    ? `${recent.type} - $${recent.amount.toFixed(2)}`
    : "No transactions yet.";
}

// Simulated auto logout for FR#21
setTimeout(() => {
  if (database.currentUser) {
    database.currentUser = null;
    saveDB();
    showSection("login");
    alert("Auto logout after inactivity simulated.");
  }
}, 15 * 60 * 1000);

renderAll();