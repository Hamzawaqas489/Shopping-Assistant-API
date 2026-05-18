import { pool } from './src/database/db.js';

async function getTables() {
  try {
    const p = await pool;
    const tables = await p.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'");
    console.log("Tables:");
    console.log(tables.recordset.map(t => t.TABLE_NAME));
    
    // get columns for StoreInventory and Products
    const cols1 = await p.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='StoreInventory'");
    console.log("StoreInventory columns:", cols1.recordset);
    
    const cols2 = await p.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products'");
    console.log("Products columns:", cols2.recordset);

    const cols3 = await p.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Categories'");
    console.log("Categories columns:", cols3.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
getTables();
