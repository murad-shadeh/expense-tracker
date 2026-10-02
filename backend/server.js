// Expense Tracker - backend (Express API + PostgreSQL)
//
// PHASE 1
// Setup:
//   1. Create a database named expense_tracker and run schema.sql on it.
//   2. Copy .env.example to a new file named .env and write your PostgreSQL password.
//   3. npm install express cors pg dotenv
// Run:    node server.js   (restart it every time you change this file)
//
// Endpoints you need to build:
//   GET    /api/expenses        return all expenses
//   GET    /api/expenses/:id    return one expense (404 if not found)
//   POST   /api/expenses        add an expense (201, or 400 if the data is invalid)
//   PUT    /api/expenses/:id    update an expense (200, 400, or 404)
//   DELETE /api/expenses/:id    delete an expense (200, or 404)
//
// Tips:
//   - Create one Pool (from the "pg" library) with the values from .env,
//     and use pool.query(...) in every route.
//   - ALWAYS send the values as parameters: pool.query("... WHERE id = $1", [id]).
//     NEVER build the SQL text by joining strings with data from the user.
//   - Use RETURNING to get the new (or updated) row back from INSERT and UPDATE.
//   - The database creates the id. The client never sends one.
//   - pg returns NUMERIC as text and DATE as a JavaScript Date, so fix both in your SELECT.
//     Hint: amount::float8 and to_char(date, 'YYYY-MM-DD').
//   - Validate the data before the query, and answer 400 with a message that explains the problem.
//   - Check the id before the query. A text like "abc" makes PostgreSQL throw an error.
//   - Enable CORS so the frontend can talk to the server.
//   - Test every endpoint with Thunder Client BEFORE you connect the frontend.

"use strict";
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { Pool } = require("pg"); // creatng the pool
const app = express(); // creating and express app
app.use(cors()); // for cross origin access
app.use(express.json()); // parse json body to test post requests
// creating the pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

// The endpoints

//get all expenses
app.get("/api/expenses", async (req, res) => {
  try {
    const allExpenses = await pool.query(
      "SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date FROM expenses ORDER BY id ASC",
    );
    res.status(200).json(allExpenses.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong on the server" });
  }
});

// get single expense
app.get("/api/expenses/:id", async (req, res) => {
  const { id } = req.params; // the id is in the params

  // 2. Convert string nums to numbers
  const expenseId = parseInt(id, 10);
  // also checking if the id is not a number or negative.
  if (isNaN(expenseId) || expenseId <= 0) {
    return res.status(404).json({ message: "Invalid expense ID" });
  }
  try {
    const result = await pool.query(
      "SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date FROM expenses WHERE id = $1",
      [expenseId],
    );

    // if no rows found
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json(result.rows[0]); // get the first element returned
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong on the server.." });
  }
});

// add a new expense
app.post("/api/expenses", async (req, res) => {
  const title = req.body.title;
  const amount = req.body.amount;
  const category = req.body.category;
  const date = req.body.date;

  // checking the required categories allowed
  const validCategories = [
    "Food",
    "Transport",
    "Bills",
    "Entertainment",
    "Other",
  ];
  // valivating the title
  if (!title || typeof title !== "string" || !title.trim()) {
    return res
      .status(400)
      .json({ message: "The title must be string and cannot be empty" });
  }
  // validating the amount
  const parsedAmount = Number(amount); // converting to number..
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res
      .status(400)
      .json({ message: "The amount must be positive and a number" });
  }
  // validate if the passed category not within cats..
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({
      message: `Category must be one of: ${validCategories.join(", ")}`,
    });
  }
  // validating the date
  if (!date || isNaN(Date.parse(date))) {
    return res
      .status(400)
      .json({ message: "A valid date is required with the proper format" });
  }

  try {
    const query = `
      INSERT INTO expenses (title, amount, category, date) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date
    `;
    const result = await pool.query(query, [
      title.trim(),
      parsedAmount,
      category,
      date,
    ]);
    // 201 means row created
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong on the server" });
  }
});

// update or replace an existing expense
app.put("/api/expenses/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10); // parse and make sure it's between 0-9 decial shape
  if (isNaN(id) || id <= 0) {
    return res.status(404).json({ message: "Invalid expense ID" });
  }

  const newTitle = req.body.title;
  const newAmount = req.body.amount;
  const newCategory = req.body.category;
  const newDate = req.body.date;

  // Validating the new inputs
  // checking the required categories allowed
  const validCategories = [
    "Food",
    "Transport",
    "Bills",
    "Entertainment",
    "Other",
  ];
  // valivating the title
  if (!newTitle || typeof newTitle !== "string" || !newTitle.trim()) {
    return res.status(400).json({ message: "The title cannot be empty" });
  }
  // validating the amount
  const parsedAmount = Number(newAmount); // converting to number..
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res
      .status(400)
      .json({ message: "The amount must bea numbe and positive" });
  }
  // validate if the passed category not within cats..
  if (!newCategory || !validCategories.includes(newCategory)) {
    return res.status(400).json({
      message: `Category must be one of: ${validCategories.join(", ")}`,
    });
  }
  // validating the date
  if (!newDate || isNaN(Date.parse(newDate))) {
    return res
      .status(400)
      .json({ message: "A valid date is required with the proper format" });
  }

  try {
    const query = `
      UPDATE expenses 
      SET title = $1, amount = $2, category = $3, date = $4
      WHERE id = $5
      RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date
    `;
    const result = await pool.query(query, [
      newTitle.trim(),
      parsedAmount,
      newCategory,
      newDate,
      id,
    ]);

    // validating if the needed row even exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    // 200 means operation success
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong on the server" });
  }
});

// Delete an expense
app.delete("/api/expenses/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(404).json({ message: "Invalid expense ID" });
  }
  try {
    const query = `DELETE FROM expenses WHERE id=$1 
    RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense does not exist" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Something went wrong on the server.");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
