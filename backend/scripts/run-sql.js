import fs from "fs";
import path from "path";
import { pool } from "../db.js";

const sqlFilePath = path.resolve("database/schema.sql");

async function runSQL() {
  try {
    const sql = fs.readFileSync(sqlFilePath, "utf8");
    await pool.query(sql);
    console.log("✅ SQL executed successfully");
  } catch (err) {
    console.error("❌ SQL execution failed:", err.message);
  } finally {
    await pool.end();
  }
}

runSQL();
