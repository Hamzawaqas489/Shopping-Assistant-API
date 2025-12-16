import { pool, sql } from "../database/db.js";

export const ProductService = {

  getByCategory: async (categoryId, storeId) => {
    const conn = await pool;
    const result = await conn.request()
      .input("CategoryID", sql.Int, categoryId)
      .input("StoreID", sql.Int, storeId)
      .query(`
        SELECT 
          p.ProductID,
          p.ProductName,
          p.Company,
          a.AttValue,
          si.Price,
          si.StockQty,
          p.ImageName
        FROM Products p
        LEFT JOIN Attributes a ON p.ProductID = a.ProductID
        JOIN StoreInventory si ON p.ProductID = si.ProductID
        WHERE p.CategoryID = @CategoryID
          AND si.StoreID = @StoreID
      `);
    return result.recordset;
  },

  getById: async (id) => {
    const conn = await pool;
    const result = await conn.request()
      .input("ProductID", sql.Int, id)
      .query(`
        SELECT p.*, a.AttValue
        FROM Products p
        LEFT JOIN Attributes a ON p.ProductID = a.ProductID
        WHERE p.ProductID = @ProductID
      `);
    return result.recordset[0] ?? null;
  },

  create: async (data) => {
    const conn = await pool;
    const transaction = new sql.Transaction(conn);

    try {
      await transaction.begin();

      // Insert product
      const productResult = await transaction.request()
        .input("ProductName", sql.NVarChar(150), data.productName)
        .input("Company", sql.NVarChar(100), data.company)
        .input("ExpiryDate", sql.Date, data.expiryDate)
        .input("ImageName", sql.NVarChar(sql.MAX), data.imageName)
        .input("CategoryID", sql.Int, data.categoryId)
        .query(`
          INSERT INTO Products
          (ProductName, Company, ExpiryDate, ImageName, CategoryID)
          VALUES
          (@ProductName, @Company, @ExpiryDate, @ImageName, @CategoryID);
          SELECT SCOPE_IDENTITY() AS ProductID;
        `);

      const productId = productResult.recordset[0].ProductID;

      
        await transaction.request()
          .input("AttName", sql.NVarChar(50), data.attName)
          .input("AttValue", sql.NVarChar(50), data.attValue)
          .input("CategoryID", sql.Int, data.categoryId)
          .input("ProductID", sql.Int, productId)
          .query(`
            INSERT INTO Attributes (AttName, AttValue, CategoryID, ProductID)
            VALUES (@AttName, @AttValue, @CategoryID, @ProductID)
          `);
      

      // Insert StoreInventory
      await transaction.request()
        .input("StoreID", sql.Int, data.storeId)
        .input("ProductID", sql.Int, productId)
        .input("StockQty", sql.Int, data.stockQty)
        .input("Price", sql.Decimal(10,2), data.price)
        .query(`
          INSERT INTO StoreInventory (StoreID, ProductID, StockQty, Price)
          VALUES (@StoreID, @ProductID, @StockQty, @Price)
        `);

      await transaction.commit();
      return productId;

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  update: async (id, data) => {
    const conn = await pool;
    const transaction = new sql.Transaction(conn);

    try {
      await transaction.begin();

      // Update product
      const productUpdate = await transaction.request()
        .input("ProductID", sql.Int, id)
        .input("ProductName", sql.NVarChar(150), data.productName)
        .input("Company", sql.NVarChar(100), data.company)
        .input("ExpiryDate", sql.Date, data.expiryDate)
        .input("ImageName", sql.NVarChar(sql.MAX), data.imageName)
        .input("CategoryID", sql.Int, data.categoryId)
        .query(`
          UPDATE Products
          SET ProductName=@ProductName,
              Company=@Company,
              ExpiryDate=@ExpiryDate,
              ImageName=@ImageName,
              CategoryID=@CategoryID
          WHERE ProductID=@ProductID
        `);

      if (productUpdate.rowsAffected[0] === 0) {
        await transaction.rollback();
        return 0;
      }

      // Update variant attribute
        await transaction.request()
          .input("AttValue", sql.NVarChar(50), data.attValue)
          .input("ProductID", sql.Int, id)
          .query(`
            UPDATE Attributes
            SET AttValue=@AttValue
            WHERE ProductID=@ProductID
          `);
      

      // Update StoreInventory
      await transaction.request()
        .input("StoreID", sql.Int, data.storeId)
        .input("ProductID", sql.Int, id)
        .input("StockQty", sql.Int, data.stockQty)
        .input("Price", sql.Decimal(10,2), data.price)
        .query(`
          UPDATE StoreInventory
          SET StockQty=@StockQty, Price=@Price
          WHERE StoreID=@StoreID AND ProductID=@ProductID
        `);

      await transaction.commit();
      return 1;

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  remove: async (id) => {
    const conn = await pool;
    const transaction = new sql.Transaction(conn);

    try {
      await transaction.begin();

      // Delete StoreInventory first
      await transaction.request()
        .input("ProductID", sql.Int, id)
        .query(`DELETE FROM StoreInventory WHERE ProductID=@ProductID`);

      // Delete Attributes
      await transaction.request()
        .input("ProductID", sql.Int, id)
        .query(`DELETE FROM Attributes WHERE ProductID=@ProductID`);

      // Delete Product
      const result = await transaction.request()
        .input("ProductID", sql.Int, id)
        .query(`DELETE FROM Products WHERE ProductID=@ProductID`);

      await transaction.commit();
      return result.rowsAffected[0];

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
