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
  console.log("LOGIN HIT");
  console.log("REQUEST BODY:", req.body);
  debugger;

  const { email, password } = req.body;
  console.log("req.body", req.body);
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
      [email],
    );
    console.log("result", result);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
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
   USERS (CREATE USER) ✅
================================ */

app.post("/users", authenticateToken,async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = $1",
      [role.toLowerCase()],
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid role" });
    }

  
    const tempPassword = "Welcome@123";
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role_id, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, name, email
      `,
      [name, email, passwordHash, roleResult.rows[0].id],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

/* ===============================
   USERS (FETCH ALL USERS) ✅
================================ */
app.get("/users", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        r.name AS role,
        u.is_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
      
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("FETCH USERS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ===============================
   PATHOLOGIST DASHBOARD
================================ */

app.get("/api/dashboard/pathologist", async (req, res) => {
  try {
    // Pending Reviews
    const pendingResult = await pool.query(`
      SELECT COUNT(*) 
      FROM samples
      WHERE status = 'pending'
    `);

    // Completed Reviews
    const completedResult = await pool.query(`
      SELECT COUNT(*) 
      FROM test_results
      WHERE report_generated = true
    `);

    // High Priority (example logic)
    const highPriorityResult = await pool.query(`
      SELECT COUNT(*)
      FROM samples
      WHERE status = 'urgent'
    `);

    // Total Assigned
    const totalAssignedResult = await pool.query(`
      SELECT COUNT(*)
      FROM samples
    `);

    // Recent Samples
    const recentSamples = await pool.query(`
      SELECT 
        s.id,
        s.sample_type,
        s.status,
        s.collected_at,
        p.name AS patient_name,
        l.name AS lab_name
      FROM samples s
      JOIN patients p ON s.patient_id = p.id
      JOIN labs l ON s.lab_id = l.id
      ORDER BY s.collected_at DESC
      LIMIT 8
    `);

    res.json({
      pending: parseInt(pendingResult.rows[0].count),
      completed: parseInt(completedResult.rows[0].count),
      highPriority: parseInt(highPriorityResult.rows[0].count),
      totalAssigned: parseInt(totalAssignedResult.rows[0].count),
      recentSamples: recentSamples.rows,
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/pathologist/review-queue", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.barcode,
        s.sample_type,
        s.status,
        s.collected_at,
        p.name AS patient_name,
        l.name AS lab_name
      FROM samples s
      JOIN patients p ON s.patient_id = p.id
      JOIN labs l ON s.lab_id = l.id
      WHERE s.status = 'review'
      ORDER BY s.collected_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/samples/:id/finalize", async (req, res) => {
  const { id } = req.params;
  const { assigned_pathologist } = req.body;

  try {
    await pool.query(
      `
      UPDATE samples
      SET status = 'completed',
          assigned_pathologist = $1
      WHERE id = $2
    `,
      [assigned_pathologist, id],
    );

    res.json({ message: "Sample finalized" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/test-results", async (req, res) => {
  const { sample_id, diagnosis, recommendations } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO test_results (sample_id, diagnosis, recommendations, report_generated)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `,
      [sample_id, diagnosis, recommendations],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/pathologist/recent-activity", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.barcode
      FROM test_results tr
      JOIN samples s ON tr.sample_id = s.id
      WHERE tr.report_generated = true
      ORDER BY s.collected_at DESC
      LIMIT 5
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Pathology ends here 


/* ===============================
   LABS (FETCH LAB LOCATIONS) ✅
================================ */

app.get("/api/labs", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name
      FROM labs
      ORDER BY name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("LABS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/labs", authenticateToken, async (req, res) => {
  const { name, address, contact_info, active } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO labs (name, address, contact_info, active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [name, address, contact_info || {}, active ?? true],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CREATE LAB ERROR:", err);
    res.status(500).json({ error: "Failed to create lab" });
  }
});

app.delete("/api/labs/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM labs
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Lab not found" });
    }

    res.json({ message: "Lab deleted successfully" });
  } catch (err) {
    console.error("DELETE LAB ERROR:", err);
    res.status(500).json({ error: "Failed to delete lab" });
  }
});

app.put("/api/labs/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Lab name is required" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE labs
      SET name = $1
      WHERE id = $2
      RETURNING *
      `,
      [name, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Lab not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE LAB ERROR:", err);
    res.status(500).json({ error: "Failed to update lab" });
  }
});

/* ===============================
   PATIENTS (CREATE PATIENT) ✅
================================ */

app.post("/api/patients", authenticateToken, async (req, res) => {
  const { name, age, gender } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Patient name required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO patients (name, age, gender)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, age || null, gender || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("PATIENT ERROR:", err);
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
        s.id,
        s.sample_type,
        s.status,
        s.collected_at,
        p.name AS patient_name,
        l.name AS lab_name
      FROM samples s
      JOIN patients p ON s.patient_id = p.id
      JOIN labs l ON s.lab_id = l.id
      ORDER BY s.collected_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("SAMPLES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/samples/:id/approve", authenticateToken, async (req, res) => {
  const sampleId = req.params.id;
  const {
    diagnosis,
    recommendations,
    reviewed_by,
    patient_id
  } = req.body;

  try {
    // 1️⃣ Update sample status
    await pool.query(
      `
      UPDATE samples
      SET status = 'completed'
      WHERE id = $1
      `,
      [sampleId]
    );

    // 2️⃣ Check if test result already exists
    const existingResult = await pool.query(
      `
      SELECT id
      FROM test_results
      WHERE sample_id = $1
      `,
      [sampleId]
    );

    // 3️⃣ Update or Insert test result
    if (existingResult.rows.length > 0) {
      await pool.query(
        `
        UPDATE test_results
        SET diagnosis = $1,
            recommendations = $2,
            report_generated = true,
            reviewed_by = $3
        WHERE sample_id = $4
        `,
        [diagnosis, recommendations, reviewed_by, sampleId]
      );
    } else {
      await pool.query(
        `
        INSERT INTO test_results
        (sample_id, patient_id, diagnosis, recommendations, report_generated, reviewed_by)
        VALUES ($1, $2, $3, $4, true, $5)
        `,
        [sampleId, patient_id, diagnosis, recommendations, reviewed_by]
      );
    }

    res.json({ success: true });

  } catch (err) {
    console.error("APPROVE SAMPLE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/upload/slides/:sampleId", authenticateToken, async (req, res) => {
  const { sampleId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT id, file_path, file_name, sample_id
      FROM slide_images
      WHERE sample_id = $1
      `,
      [sampleId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("SLIDES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   BILLING RECORDS
================================ */

app.get("/api/billing-records", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, amount, payment_status, created_at
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
      SELECT id, sample_id, diagnosis, recommendations, report_generated
      FROM test_results
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("TEST RESULTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/test-results', async (req, res) => {
  const {
    sample_id,
    patient_id,
    diagnosis,
    recommendations,
    reviewed_by
  } = req.body;

  try {
    const existing = await db.query(
      'SELECT id FROM test_results WHERE sample_id = $1',
      [sample_id]
    );

    if (existing.rows.length > 0) {
      await db.query(
        `UPDATE test_results
         SET diagnosis=$1,
             recommendations=$2,
             report_generated=true,
             reviewed_by=$3
         WHERE sample_id=$4`,
        [diagnosis, recommendations, reviewed_by, sample_id]
      );
    } else {
      await db.query(
        `INSERT INTO test_results
         (sample_id, patient_id, diagnosis, recommendations, report_generated, reviewed_by)
         VALUES ($1,$2,$3,$4,true,$5)`,
        [sample_id, patient_id, diagnosis, recommendations, reviewed_by]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/* ===============================
   PRICING TIERS
================================ */

app.get("/api/pricing-tiers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, tier_name, lbc_price, hpv_price, co_test_price
      FROM pricing_tiers
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("PRICING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   CUSTOMERS
================================ */
app.get("/api/customers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.contact, u.tier, u.location
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'customer'
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

app.post("/api/customers", authenticateToken, async (req, res) => {
  const { name, email, contact, tier, location } = req.body;

  if (!name || !email || !contact || !tier || !location) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // check existing
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Customer already exists" });
    }

    // get customer role
    const roleRes = await pool.query(
      "SELECT id FROM roles WHERE name = 'customer'",
    );

    const passwordHash = await bcrypt.hash("Welcome@123", 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (name, email, password_hash, role_id, contact, tier, location, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,true)
      RETURNING id, name, email, contact, tier, location
      `,
      [name, email, passwordHash, roleRes.rows[0].id, contact, tier, location],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

app.get("/api/customers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.contact, u.tier, u.location
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'customer'
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

app.delete("/api/customers/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Safety check: delete only if user is a customer
    const result = await pool.query(
      `
      DELETE FROM users
      USING roles
      WHERE users.role_id = roles.id
        AND roles.name = 'customer'
        AND users.id = $1
      RETURNING users.id
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("DELETE CUSTOMER ERROR:", err);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

app.put("/api/customers/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, contact, tier, location } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE users
      SET
        name = $1,
        email = $2,
        contact = $3,
        tier = $4,
        location = $5
      FROM roles
      WHERE users.role_id = roles.id
        AND roles.name = 'customer'
        AND users.id = $6
      RETURNING users.*
      `,
      [name, email, contact, tier, location, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE CUSTOMER ERROR:", err.message);
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
