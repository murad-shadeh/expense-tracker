// Expense Tracker - frontend logic

// PHASE 2
// Your backend from Phase 1 is already running, with real expenses in the
// database (from schema.sql). Build this page directly against it with
// fetch and async/await - there is no in-memory or localStorage stage
// this time, and no sample data file.
//
// A possible structure (change it if you have a better idea):
//   - async function getExpenses()          fetch(API_URL), return the JSON
//   - async function addExpense(data)       fetch(API_URL, { method: "POST", ... })
//   - async function updateExpense(id,data) fetch(API_URL + "/" + id, { method: "PUT", ... })
//   - async function deleteExpense(id)      fetch(API_URL + "/" + id, { method: "DELETE" })
//   - async function refresh()              get the list, then call renderTable and renderSummary
//   - renderTable(list)                     build the table rows from the array the API returned
//   - renderSummary(list)                   update the summary cards
//   - applyFilter()                         re-render with the list filtered by category
//
// Don't forget:
//   - Show a Bootstrap spinner while a request is in flight.
//   - Wrap every fetch call in try/catch, and show a Bootstrap alert on failure.
//   - After add, edit, or delete, call refresh() so the page always shows
//     what the server actually saved - never update the table by hand.
//   - The API is at http://localhost:3000/api/expenses (see the Roadmap).
"use strict";
const API_URL = "http://localhost:3000/api/expenses";

// saving all expenses to keep up to date
let allExpenses = [];
// create the modal
const editModal = new bootstrap.Modal(
  document.getElementById("editExpenseModal"),
);

function showAlert(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove("d-none");
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.add("d-none");
}

async function getExpenses() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Failed to load expenses from the server.");
    }
    return await response.json();
  } catch (error) {
    throw new Error("Something went wrong on the server side");
  }
}

async function addExpense(data) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Something went wrong while creating the expense.");
    }
    alert(`Expense ${data.title} added to your expense table`);
    return await response.json();
  } catch (error) {
    throw new Error("Something went wrong on the server side.");
  }
}

async function updateExpense(id, data) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Something went wrong while updating the expense.");
    }
    return await response.json();
  } catch (error) {
    throw new Error("Something went wrong on the server side.");
  }
}

async function deleteExpense(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Something went wrong while deleting the expense.");
    }
  } catch (error) {
    throw new Error("Something went wrong on the server side.");
  }
}
// rendering the summary cards
function renderSummary(expenses) {
  const totalAmount = document.getElementById("total-amount");
  const expenseCount = document.getElementById("expense-count");
  const theHighestExpense = document.getElementById("highest-expense");
  const highestExpenseTitle = document.getElementById("highest-expense-title");
  if (!expenses || expenses.length === 0) {
    totalAmount.textContent = "$0.00";
    expenseCount.textContent = "0";
    theHighestExpense.textContent = "$0.00";
    highestExpenseTitle.textContent = "-";
    return;
  }

  let total = 0;
  let highestExpense = expenses[0];
  let avg = 0;

  expenses.forEach((expense) => {
    total += Number(expense.amount);
    if (Number(expense.amount) > Number(highestExpense.amount)) {
      highestExpense = expense;
    }
  });

  totalAmount.textContent = `$${total.toFixed(2)}`;
  expenseCount.textContent = `${expenses.length}`;
  theHighestExpense.textContent = `$${Number(highestExpense.amount).toFixed(2)}`;
  highestExpenseTitle.textContent = `${highestExpense.title}`;
}

// Badge color mapper for the categories
function getCategoryBadgeClass(category) {
  const badgeClassMapper = {
    Food: "bg-success",
    Transport: "bg-info text-dark",
    Bills: "bg-warning text-dark",
    Entertainment: "bg-primary",
    Other: "bg-secondary",
  };
  return badgeClassMapper[category] || "bg-dark";
}

function renderTableSpinner() {
  const tbody = document.getElementById("expenses-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading expenses...</span>
          </div>
        </td>
      </tr>`;
  }
}
function renderTable(list) {
  const tbody = document.getElementById("expenses-table-body");
  if (!tbody) return;
  //removing the spinnner once the data successfully fetched
  tbody.replaceChildren();

  if (!list || list.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.setAttribute("colspan", "5");
    td.className = "text-center text-muted py-4";
    td.textContent = "No expenses found.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  list.forEach((expense) => {
    const formattedAmount = Number(expense.amount).toFixed(2);

    const tr = document.createElement("tr");
    tr.dataset.id = expense.id; // having the id on each row

    const titleTd = document.createElement("td");
    titleTd.className = "fw-semibold";
    titleTd.textContent = expense.title;

    const amountTd = document.createElement("td");
    amountTd.textContent = `$${formattedAmount}`;

    const categoryTd = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `badge ${getCategoryBadgeClass(expense.category)}`;
    badge.textContent = expense.category;
    categoryTd.appendChild(badge);

    const dateTd = document.createElement("td");
    dateTd.textContent = expense.date;

    const actionsTd = document.createElement("td");
    actionsTd.className = "text-end";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-sm btn-outline-primary me-1 edit-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openEditModal(expense.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-sm btn-outline-danger delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => handleDelete(expense.id));

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    tr.append(titleTd, amountTd, categoryTd, dateTd, actionsTd);
    tbody.appendChild(tr);
  });
}

function applyFilter() {
  const filterElement = document.getElementById("category-filter");
  const selectedCategory = filterElement ? filterElement.value : "All";

  const filteredList =
    selectedCategory === "All"
      ? allExpenses
      : allExpenses.filter((expense) => expense.category === selectedCategory);

  renderTable(filteredList);
}
// the refresh function so everything stays up to date
async function refresh() {
  renderTableSpinner();
  hideAlert("page-alert");

  try {
    allExpenses = await getExpenses();
    renderSummary(allExpenses);
    applyFilter();
  } catch (error) {
    console.error("Unable to refresh expenses", error);
    showAlert("page-alert", error.message);
  }
}

function openEditModal(id) {
  const expense = allExpenses.find((exp) => exp.id === id);
  if (!expense || !editModal) return;

  hideAlert("edit-form-alert");
  document.getElementById("edit-expense-id").value = expense.id;
  document.getElementById("edit-expense-title").value = expense.title;
  document.getElementById("edit-expense-amount").value = expense.amount;
  document.getElementById("edit-expense-category").value = expense.category;
  document.getElementById("edit-expense-date").value = expense.date;

  editModal.show();
}
async function handleDelete(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  try {
    hideAlert("table-alert");
    await deleteExpense(id);
    await refresh();
  } catch (error) {
    showAlert("table-alert", error.message);
  }
}
// Getting the data to add an expense from the form
const addExpenseForm = document.getElementById("add-expense-form");
if (addExpenseForm) {
  addExpenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titleInput = document.getElementById("title");
    const amountInput = document.getElementById("amount");
    const categoryInput = document.getElementById("category");
    const dateInput = document.getElementById("date");

    const titleValue = titleInput.value.trim();
    const amountValue = Number(amountInput.value);
    const categoryValue = categoryInput.value;
    const dateValue = dateInput.value;

    let isValid = true;

    if (!titleValue) {
      titleInput.classList.add("is-invalid");
      isValid = false;
    } else {
      titleInput.classList.remove("is-invalid");
    }

    if (isNaN(amountValue) || amountValue <= 0) {
      amountInput.classList.add("is-invalid");
      isValid = false;
    } else {
      amountInput.classList.remove("is-invalid");
    }

    if (!categoryValue) {
      categoryInput.classList.add("is-invalid");
      isValid = false;
    } else {
      categoryInput.classList.remove("is-invalid");
    }

    if (!dateValue) {
      dateInput.classList.add("is-invalid");
      isValid = false;
    } else {
      dateInput.classList.remove("is-invalid");
    }

    if (!isValid) return;

    const newExpense = {
      title: titleValue,
      amount: amountValue,
      category: categoryValue,
      date: dateValue,
    };

    try {
      hideAlert("form-alert");
      await addExpense(newExpense);
      addExpenseForm.reset();
      await refresh();
    } catch (error) {
      showAlert("form-alert", error.message);
    }
  });
}
// Editing an expense
const editExpenseForm = document.getElementById("edit-expense-form");
if (editExpenseForm) {
  editExpenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idInput = document.getElementById("edit-expense-id");
    const titleInput = document.getElementById("edit-expense-title");
    const amountInput = document.getElementById("edit-expense-amount");
    const categoryInput = document.getElementById("edit-expense-category");
    const dateInput = document.getElementById("edit-expense-date");

    const id = idInput.value;
    const titleValue = titleInput.value.trim();
    const amountValue = Number(amountInput.value);
    const categoryValue = categoryInput.value;
    const dateValue = dateInput.value;

    let isValid = true;

    if (!titleValue) {
      titleInput.classList.add("is-invalid");
      isValid = false;
    } else {
      titleInput.classList.remove("is-invalid");
    }

    if (isNaN(amountValue) || amountValue <= 0) {
      amountInput.classList.add("is-invalid");
      isValid = false;
    } else {
      amountInput.classList.remove("is-invalid");
    }

    if (!categoryValue) {
      categoryInput.classList.add("is-invalid");
      isValid = false;
    } else {
      categoryInput.classList.remove("is-invalid");
    }

    if (!dateValue) {
      dateInput.classList.add("is-invalid");
      isValid = false;
    } else {
      dateInput.classList.remove("is-invalid");
    }

    if (!isValid) return;

    const updatedExpense = {
      title: titleValue,
      amount: amountValue,
      category: categoryValue,
      date: dateValue,
    };

    try {
      hideAlert("edit-form-alert");
      await updateExpense(id, updatedExpense);
      if (editModal) editModal.hide();
      await refresh();
    } catch (error) {
      console.error("Failed to update expense:", error);
      showAlert("edit-form-alert", error.message);
    }
  });
}

const categoryFilter = document.getElementById("category-filter");
if (categoryFilter) {
  categoryFilter.addEventListener("change", applyFilter);
}

// adding toggle theme feature
const themeToggleBtn = document.getElementById("theme-toggle");
const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector("i") : null; // checking if the toggle button there

function setTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme); // this applies to the root HTML element

  localStorage.setItem("selected-theme", theme);

  // change the icons shape
  if (themeIcon) {
    if (theme === "dark") {
      themeIcon.className = "bi bi-sun-fill text-warning fs-6";
    } else {
      themeIcon.className = "bi bi-moon-stars-fill text-warning fs-6";
    }
  }
}

// get saved theme from localeStorage through the user OS with the help of matchMedia()
const savedTheme = localStorage.getItem("selected-theme");
const systemPrefersDark = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches; // if the browser has the dark theme saved for the website
const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

setTheme(initialTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  });
}

// adding a way to download table data as csv file

// need to escape CSV values containing commas, quotes, or newlines to not break csv structure
function sanitizeCSVField(field) {
  const stringValue = String(field ?? ""); // null or undefined will return ""
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function exportExpensesToCSV(expensesList) {
  if (!expensesList || expensesList.length === 0) {
    alert("No expenses available to export!");
    return;
  }

  // Defining Column Headers
  const headers = ["ID", "Title", "Amount", "Category", "Date"];
  // Mapping expenses into formatted CSV rows
  const csvRows = expensesList.map((exp) =>
    [
      sanitizeCSVField(exp.id),
      sanitizeCSVField(exp.title),
      sanitizeCSVField(exp.amount),
      sanitizeCSVField(exp.category),
      sanitizeCSVField(exp.date),
    ].join(","),
  );

  // Combining headers and rows with newlines
  const csvString = [headers.join(","), ...csvRows].join("\n"); // after each row leave a line

  // using Blob (Binary Large Object) to download the file
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  //  using the browser to download via invisible link anchor
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`, // adding today's date for the file name
  );
  document.body.appendChild(link);
  link.click(); // makes the browser upon the click to trigger download immediately

  // removing the link from the DOM after every download and free up the RAM used by blob
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
const exportBtn = document.getElementById("export-csv-btn");
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    exportExpensesToCSV(allExpenses);
  });
}

refresh();
