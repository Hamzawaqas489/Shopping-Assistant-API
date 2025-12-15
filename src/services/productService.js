// src/services/productService.js
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
          p.Variant,
          u.UOMName,
          si.Price,
          si.StockQty,
          p.ImageURL
        FROM Products p
        JOIN UnitOfMeasure u ON p.UOMID = u.UOMID
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
        SELECT p.*, u.UOMName
        FROM Products p
        JOIN UnitOfMeasure u ON p.UOMID = u.UOMID
        WHERE p.ProductID = @ProductID
      `);
    return result.recordset[0] ?? null;
  },

  create: async (data) => {
    const conn = await pool;
    const transaction = new sql.Transaction(conn);

    try {
      await transaction.begin();

      const productResult = await transaction.request()
        .input("ProductName", sql.NVarChar(150), data.productName)
        .input("Company", sql.NVarChar(100), data.company || null)
        .input("Variant", sql.NVarChar(50), data.variant || null)
        .input("ExpiryDate", sql.Date, data.expiryDate || null)
        .input("ImageURL", sql.NVarChar(sql.MAX), data.imageUrl || null)
        .input("CategoryID", sql.Int, data.categoryId)
        .input("UOMID", sql.Int, data.uomId)
        .query(`
          INSERT INTO Products
          (ProductName, Company, Variant, ExpiryDate, ImageURL, CategoryID, UOMID)
          VALUES
          (@ProductName, @Company, @Variant, @ExpiryDate, @ImageURL, @CategoryID, @UOMID);
          SELECT SCOPE_IDENTITY() AS ProductID;
        `);

      const productId = productResult.recordset[0].ProductID;

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

      const productUpdate = await transaction.request()
        .input("ProductID", sql.Int, id)
        .input("ProductName", sql.NVarChar(150), data.productName)
        .input("Company", sql.NVarChar(100), data.company || null)
        .input("Variant", sql.NVarChar(50), data.variant || null)
        .input("ExpiryDate", sql.Date, data.expiryDate || null)
        .input("ImageURL", sql.NVarChar(sql.MAX), data.imageUrl || null)
        .input("CategoryID", sql.Int, data.categoryId)
        .input("UOMID", sql.Int, data.uomId)
        .query(`
          UPDATE Products
          SET ProductName=@ProductName,
              Company=@Company,
              Variant=@Variant,
              ExpiryDate=@ExpiryDate,
              ImageURL=@ImageURL,
              CategoryID=@CategoryID,
              UOMID=@UOMID
          WHERE ProductID=@ProductID
        `);

      if (productUpdate.rowsAffected[0] === 0) {
        await transaction.rollback();
        return 0;
      }

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

      await transaction.request()
        .input("ProductID", sql.Int, id)
        .query(`DELETE FROM StoreInventory WHERE ProductID=@ProductID`);

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
