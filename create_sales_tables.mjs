import { pool } from './src/database/db.js';

async function setupTables() {
  try {
    const p = await pool;
    console.log("Creating StoreSales table...");
    await p.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StoreSales' and xtype='U')
      CREATE TABLE StoreSales (
          SaleID INT IDENTITY(1,1) PRIMARY KEY,
          StoreID INT NOT NULL FOREIGN KEY REFERENCES Store(StoreID),
          SaleName NVARCHAR(100) NOT NULL,
          DiscountPercentage DECIMAL(5,2) NOT NULL,
          ApplyToAll BIT DEFAULT 1,
          IsActive BIT DEFAULT 1,
          CreatedAt DATETIME DEFAULT GETDATE()
      )
    `);
    console.log("StoreSales created.");

    console.log("Creating StoreSaleCategories table...");
    await p.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StoreSaleCategories' and xtype='U')
      CREATE TABLE StoreSaleCategories (
          SaleID INT NOT NULL FOREIGN KEY REFERENCES StoreSales(SaleID) ON DELETE CASCADE,
          CategoryID INT NOT NULL FOREIGN KEY REFERENCES Category(CategoryID),
          PRIMARY KEY (SaleID, CategoryID)
      )
    `);
    console.log("StoreSaleCategories created.");

  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    process.exit();
  }
}

setupTables();
