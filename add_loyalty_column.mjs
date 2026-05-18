import { pool } from './src/database/db.js';

async function updateSchema() {
  try {
    const p = await pool;
    console.log("Checking if LoyaltyDiscountAmount exists in Orders...");
    const checkQuery = `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'LoyaltyDiscountAmount'
    `;
    const checkResult = await p.request().query(checkQuery);

    if (checkResult.recordset.length === 0) {
      console.log("Adding LoyaltyDiscountAmount to Orders table...");
      await p.request().query(`
        ALTER TABLE Orders
        ADD LoyaltyDiscountAmount DECIMAL(10,2) DEFAULT 0
      `);
      console.log("Column added successfully.");
    } else {
      console.log("LoyaltyDiscountAmount already exists.");
    }
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    process.exit();
  }
}

updateSchema();
