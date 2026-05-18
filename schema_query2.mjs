import { pool } from './src/database/db.js';

async function getTables() {
  try {
    const p = await pool;
    const cols3 = await p.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Category'");
    console.log("Category columns:", cols3.recordset);
    const cols4 = await p.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Store'");
    console.log("Store columns:", cols4.recordset);
    
    // check if there's any Sales table
    const salesTables = await p.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Sale%' OR TABLE_NAME LIKE '%Discount%'");
    console.log("Sales tables:", salesTables.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
getTables();
