// src/services/storeService.js
import { get } from "http";
import { pool, sql } from "../database/db.js";

export const StoreService = {
  getAll: async () => {
    const connection = await pool;
    const result = await connection.request()
    .query(`SELECT StoreID, StoreName, StoreAddress, StoreLogo FROM Store`);
    return result.recordset;
  },

   create: async (data) => {
    const poolConnection = await pool;
    const transaction = new sql.Transaction(poolConnection);

    try {
      await transaction.begin();

      const insertStoreRequest = new sql.Request(transaction);

      const storeResult = await insertStoreRequest
        .input("StoreName", sql.NVarChar(100), data.StoreName)
        .input("StoreAddress", sql.NVarChar(255), data.StoreAddress)
        .input("StoreLogo", sql.NVarChar(255), data.StoreLogo || null)
        .query(`
          INSERT INTO Store (StoreName, StoreAddress, StoreLogo)
          OUTPUT INSERTED.StoreID
          VALUES (@StoreName, @StoreAddress, @StoreLogo);
        `);

      const newStoreID = storeResult.recordset[0].StoreID;

      if (!newStoreID) {
        throw new Error("Failed to create store");
      }

      // Update user with StoreID
      const updateUserRequest = new sql.Request(transaction);
      await updateUserRequest
        .input("UserID", sql.Int, data.UserID)
        .input("StoreID", sql.Int, newStoreID)
        .query(`
          UPDATE Users
          SET StoreID = @StoreID
          WHERE UserID = @UserID;
        `);

      await transaction.commit();

      return { StoreID: newStoreID };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  getById: async (id) => {
    const connection = await pool;
    const result = await connection
      .request()
      .input("StoreID", sql.Int, id)
      .query(`SELECT * FROM Store WHERE StoreID = @StoreID`);
    return result.recordset[0];
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
