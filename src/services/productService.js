// src/services/productService.js
import { pool, sql } from "../database/db.js";

export const ProductService = {
  getByCategory: async (categoryId) => {
    const connection = await pool;
    const result = await connection.request().input("CategoryID", sql.Int, categoryId)
      .query(`SELECT * FROM Products WHERE CategoryID=@CategoryID`);
    return result.recordset;
  },

  getById: async (id) => {
    const connection = await pool;
    const result = await connection.request().input("ProductID", sql.Int, id)
      .query(`SELECT * FROM Products WHERE ProductID=@ProductID`);
    return result.recordset[0] ?? null;
  },

  create: async (data) => {
    const connection = await pool;
    const result = await connection.request()
      .input("ProductName", sql.NVarChar(150), data.productName)
      .input("Brand", sql.NVarChar(100), data.brand)
      .input("Company", sql.NVarChar(100), data.company)
      .input("SizeWeight", sql.NVarChar(50), data.sizeWeight)
      .input("ExpiryDate", sql.Date, data.expiryDate || null)
      .input("ImageURL", sql.NVarChar(sql.MAX), data.imageUrl)
      .input("CategoryID", sql.Int, data.categoryId)
      .query(`
        INSERT INTO Products (ProductName, Brand, Company, SizeWeight, ExpiryDate, ImageURL, CategoryID)
        VALUES (@ProductName, @Brand, @Company, @SizeWeight, @ExpiryDate, @ImageURL, @CategoryID);
        SELECT SCOPE_IDENTITY() AS ProductID;
      `);
    return result.recordset[0]?.ProductID ?? null;
  },

  update: async (id, data) => {
    const connection = await pool;
    const result = await connection.request()
      .input("ProductID", sql.Int, id)
      .input("ProductName", sql.NVarChar(150), data.productName)
      .input("Brand", sql.NVarChar(100), data.brand)
      .input("Company", sql.NVarChar(100), data.company)
      .input("SizeWeight", sql.NVarChar(50), data.sizeWeight)
      .input("ExpiryDate", sql.Date, data.expiryDate || null)
      .input("ImageURL", sql.NVarChar(sql.MAX), data.imageUrl)
      .input("CategoryID", sql.Int, data.categoryId)
      .query(`
        UPDATE Products SET ProductName=@ProductName, Brand=@Brand, Company=@Company, SizeWeight=@SizeWeight, ExpiryDate=@ExpiryDate, ImageURL=@ImageURL, CategoryID=@CategoryID WHERE ProductID=@ProductID
      `);
    return result.rowsAffected[0];
  },

  remove: async (id) => {
    const connection = await pool;
    const result = await connection.request().input("ProductID", sql.Int, id)
      .query(`DELETE FROM Products WHERE ProductID=@ProductID`);
    return result.rowsAffected[0];
  }
};
