// src/services/storeService.js
import { pool, sql } from "../database/db.js";

export const StoreService = {
  getAll: async () => {
    const connection = await pool;
    const result = await connection.request().query(`SELECT StoreID, StoreName FROM Store`);
    return result.recordset;
  },

  create: async (data) => {
    const connection = await pool;
    const result = await connection
      .request()
      .input("StoreName", sql.NVarChar(100), data.storeName)
      .query(`
        INSERT INTO Store (StoreName)
        VALUES (@StoreName);
      `);
    return result.rowsAffected[0];
  },

  update: async (id, data) => {
    const connection = await pool;
    const result = await connection
      .request()
      .input("StoreID", sql.Int, id)
      .input("StoreName", sql.NVarChar(100), data.storeName)
      .query(`
        UPDATE Store SET StoreName=@StoreName WHERE StoreID=@StoreID;
      `);
    return result.rowsAffected[0];
  },

  remove: async (id) => {
    const connection = await pool;
    const result = await connection
    .request()
    .input("StoreID", sql.Int, id)
    .query(`DELETE FROM Store WHERE StoreID=@StoreID`);
    return result.rowsAffected[0];
  }
};
