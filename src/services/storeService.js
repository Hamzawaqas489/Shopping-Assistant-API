// src/services/storeService.js
import { pool, sql } from "../database/db.js";

export const StoreService = {
  getAll: async () => {
    const connection = await pool;
    const result = await connection.request().query(`SELECT StoreID, StoreName, StoreDescription, AdminID FROM Store`);
    return result.recordset;
  },

  create: async (data) => {
    const connection = await pool;
    const result = await connection
      .request()
      .input("StoreName", sql.NVarChar(100), data.storeName)
      .input("StoreDescription", sql.NVarChar(sql.MAX), data.storeDescription)
      .input("AdminID", sql.Int, data.adminId || null)
      .query(`
        INSERT INTO Store (StoreName, StoreDescription, AdminID)
        VALUES (@StoreName, @StoreDescription, @AdminID);
        SELECT SCOPE_IDENTITY() AS StoreID;
      `);
    return result.recordset[0]?.StoreID ?? null;
  },

  update: async (id, data) => {
    const connection = await pool;
    const result = await connection
      .request()
      .input("StoreID", sql.Int, id)
      .input("StoreName", sql.NVarChar(100), data.storeName)
      .input("StoreDescription", sql.NVarChar(sql.MAX), data.storeDescription)
      .query(`
        UPDATE Store SET StoreName=@StoreName, StoreDescription=@StoreDescription WHERE StoreID=@StoreID;
      `);
    return result.rowsAffected[0];
  },

  remove: async (id) => {
    const connection = await pool;
    const result = await connection.request().input("StoreID", sql.Int, id).query(`DELETE FROM Store WHERE StoreID=@StoreID`);
    return result.rowsAffected[0];
  }
};
