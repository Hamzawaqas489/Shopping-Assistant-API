// src/services/categoryService.js
import { pool, sql } from "../database/db.js";

export const CategoryService = {
  getByStore: async (storeId) => {
    const connection = await pool;
    const result = await connection.request().input("StoreID", sql.Int, storeId)
      .query(`SELECT CategoryID, CategoryName, StoreID FROM Category WHERE StoreID=@StoreID`);
    return result.recordset;
  },

  create: async (data) => {
    const connection = await pool;
    const result = await connection.request()
      .input("CategoryName", sql.NVarChar(100), data.categoryName)
      .input("StoreID", sql.Int, data.storeId)
      .query(`
        INSERT INTO Category (CategoryName, StoreID)
        VALUES (@CategoryName, @StoreID);
        SELECT SCOPE_IDENTITY() AS CategoryID;
      `);
    return result.recordset[0]?.CategoryID ?? null;
  },

  remove: async (id) => {
    const connection = await pool;
    const result = await connection.request().input("CategoryID", sql.Int, id).query(`DELETE FROM Category WHERE CategoryID=@CategoryID`);
    return result.rowsAffected[0];
  }
};
