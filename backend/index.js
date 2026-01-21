import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";
import { authenticateToken } from "./authMiddleware.js";

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors());
app.use(express.json());

/* ===============================
   BASIC ROUTES
================================ */

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   AUTH
================================ */

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash,
        r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1 AND u.is_active = true
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   SAMPLES
================================ */

app.get("/api/samples", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        barcode,
        test_type,
        status,
        accession_date,
        assigned_technician,
        assigned_pathologist
      FROM samples
      ORDER BY accession_date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("SAMPLES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   BILLING RECORDS
================================ */

app.get("/api/billing-records", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        amount,
        payment_status,
        created_at
      FROM billing_records
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("BILLING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   TEST RESULTS
================================ */

app.get("/api/test-results", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        sample_id,
        diagnosis,
        recommendations,
        report_generated
      FROM test_results
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("TEST RESULTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   PRICING TIERS
================================ */

app.get("/api/pricing-tiers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        tier_name,
        lbc_price,
        hpv_price,
        co_test_price
      FROM pricing_tiers
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("PRICING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   SERVER
================================ */

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
