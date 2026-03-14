import { pool, sql } from "./src/database/db.js";

async function updateDB() {
  const conn = await pool;
  try {
    console.log("Dropping TrolleyCartItems...");
    await conn.request().query('DROP TABLE IF EXISTS TrolleyCartItems;');
    
    console.log("Dropping TrolleySessions...");
    await conn.request().query('DROP TABLE IF EXISTS TrolleySessions;');
    
    console.log("Altering Orders table to add ListID...");
    // Check if ListID exists first
    const checkListId = await conn.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'ListID'
    `);
    
    if (checkListId.recordset.length === 0) {
      await conn.request().query('ALTER TABLE Orders ADD ListID INT NULL;');
      console.log("ListID column added successfully.");
    } else {
      console.log("ListID column already exists.");
    }
    
    console.log("Database updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error updating DB:", err);
    process.exit(1);
  }
}

updateDB();
