import { Result } from "express-validator";
import { pool, sql } from "../database/db.js";

export const ProductService = {

  addBulkProducts: async (storeId, products) => {
    const connection = await pool;
    const transaction = new sql.Transaction(connection);

    let inserted = 0;
    let updated = 0;

    try {
      await transaction.begin();

      for (const p of products) {
        const request = new sql.Request(transaction);

        const check = await request
          .input("StoreID", sql.Int, storeId)
          .input("ProductID", sql.Int, p.ProductID)
          .query(`
            SELECT COUNT(*) as count
            FROM StoreInventory
            WHERE StoreID = @StoreID AND ProductID = @ProductID
          `);

        const exists = check.recordset[0].count > 0;

        const req2 = new sql.Request(transaction);

        if (exists) {
          await req2
            .input("StoreID", sql.Int, storeId)
            .input("ProductID", sql.Int, p.ProductID)
            .input("Price", sql.Decimal(10,2), p.Price)
            .input("StockQty", sql.Int, p.StockQty)
            .query(`
              UPDATE StoreInventory
              SET Price = @Price,
                  StockQty = @StockQty
              WHERE StoreID = @StoreID AND ProductID = @ProductID
            `);

          updated++;

        } else {
          await req2
            .input("StoreID", sql.Int, storeId)
            .input("ProductID", sql.Int, p.ProductID)
            .input("Price", sql.Decimal(10,2), p.Price)
            .input("StockQty", sql.Int, p.StockQty)
            .query(`
              INSERT INTO StoreInventory (StoreID, ProductID, Price, StockQty)
              VALUES (@StoreID, @ProductID, @Price, @StockQty)
            `);

          inserted++;
        }
      }

      await transaction.commit();

      return { inserted, updated };

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  getStoreProducts: async (storeId) => {
    const connection = await pool;

    const result = await connection.request()
      .input("StoreID", sql.Int, storeId)
      .query(`
        SELECT
            SI.ProductID,
            P.ProductName,
            P.Company,
            P.ImageName,
            P.QRCode,
            SI.StockQty,
            SI.Price,
            p.CategoryID
        FROM StoreInventory SI
        INNER JOIN Products P
            ON SI.ProductID = P.ProductID
        WHERE SI.StoreID = @StoreID
        ORDER BY P.ProductName
      `);

    return result.recordset;
  },

  updateStoreProduct: async (data) => {
    const connection = await pool;
    const transaction = new sql.Transaction(connection);

    try {
      await transaction.begin();

      const request = new sql.Request(transaction);

      const result = await request
        .input("StoreID", sql.Int, data.StoreID)
        .input("ProductID", sql.Int, data.ProductID)
        .input("Price", sql.Decimal(10,2), data.Price)
        .input("StockQty", sql.Int, data.StockQty)
        .query(`
          UPDATE StoreInventory
          SET Price = @Price,
              StockQty = @StockQty
          WHERE StoreID = @StoreID AND ProductID = @ProductID
        `);

      await transaction.commit();
      return result.rowsAffected[0] > 0;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  getByCategory: async (CategoryId) => {
    const conn = await pool;
    const result = await conn.request()
      .input("CategoryID", sql.Int, CategoryId)
      .query(`
        SELECT *
        FROM Products 
        WHERE CategoryID = @CategoryID
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
        .input("ProductName", sql.NVarChar(150), data.ProductName)
        .input("Company", sql.NVarChar(100), data.Company)
        .input("ImageName", sql.NVarChar(sql.MAX), data.ImageName)
        .input("QRCode", sql.NVarChar(100), data.QRCode || data.qrCode || null)
        .input("CategoryID", sql.Int, data.categoryId || data.CategoryID)
        .input("ExpiryDate", sql.Date, data.ExpiryDate)
        .query(`
          INSERT INTO Products
          (ProductName, Company, ImageName, QRCode, CategoryID, ExpiryDate)
          VALUES
          (@ProductName, @Company, @ImageName, @QRCode, @CategoryID, @ExpiryDate);
          SELECT SCOPE_IDENTITY() AS ProductID;
        `);

      const productId = productResult.recordset[0].ProductID;

      
        await transaction.request()
          .input("AttName", sql.NVarChar(50), data.AttName)
          .input("AttValue", sql.NVarChar(50), data.AttValue)
          .input("AttUnit", sql.NVarChar(20), data.AttUnit)
          .input("ProductID", sql.Int, productId)
          .query(`
            INSERT INTO Attributes (AttName, AttValue, AttUnit, ProductID)
            VALUES (@AttName, @AttValue, @AttUnit, @ProductID)
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
        .input("ProductName", sql.NVarChar(150), data.productName || data.ProductName)
        .input("Company", sql.NVarChar(100), data.company || data.Company)
        .input("ImageName", sql.NVarChar(sql.MAX), data.imageName || data.ImageName)
        .input("QRCode", sql.NVarChar(100), data.qrCode || data.QRCode || null)
        .input("CategoryID", sql.Int, data.categoryId || data.CategoryID)
        .query(`
          UPDATE Products
          SET ProductName=@ProductName,
              Company=@Company,
              ImageName=@ImageName,
              QRCode=@QRCode,
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
  },

  getProductByQrCode: async (qrCode) => {
    const conn = await pool;
    const result = await conn.request()
      .input("QRCode", sql.NVarChar(100), qrCode)
      .query(`
        Select * from products where QRCode = @QRCode
      `);
    return result.recordset[0] ?? null;
  },

  addProductByQr: async (productId, data) => {
    const conn = await pool;
    const transaction = new sql.Transaction(conn);

    try {
      await transaction.begin();
      // Check if product exists
      const productCheck = await transaction.request()
        .input("ProductID", sql.Int, productId)
        .query(`SELECT ProductID FROM Products WHERE ProductID=@ProductID`);
        
      if (productCheck.recordset.length === 0) {
        await transaction.rollback();
        return { success: false, message: "Product not found" };
      }

      // Add to StoreInventory with default values (can be updated later)
      await transaction.request()
        .input("StoreID", sql.Int, data.StoreID)
        .input("ProductID", sql.Int, productId)
        .input("Price", sql.Decimal(10,2), data.Price || 0)
        .input("StockQty", sql.Int, data.StockQty || 0)
        .query(`
          INSERT INTO StoreInventory (StoreID, ProductID, Price, StockQty)
          VALUES (@StoreID, @ProductID, @Price, @StockQty)
        `);
      await transaction.commit();
      return { success: true, message: "Product added to store inventory" };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
