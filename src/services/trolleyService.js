// src/services/trolleyService.js
import { pool, sql } from "../database/db.js";

export const TrolleyService = {

  
  getAll: async (storeId = null) => {
    const conn = await pool;
    const request = conn.request();

    if (storeId) {
      request.input("StoreID", sql.Int, storeId);
    }

    const result = await request.query(`
      SELECT TrolleyID, QRCodeData as QRCode, Status, StoreID
      FROM Trolley
      ${storeId ? "WHERE StoreID = @StoreID" : ""}
      ORDER BY TrolleyID
    `);

    return result.recordset;
  },

  
  getById: async (id) => {
    const conn = await pool;

    const result = await conn.request()
      .input("TrolleyID", sql.Int, id)
      .query(`
        SELECT TrolleyID, QRCodeData as QRCode, Status, StoreID
        FROM Trolley
        WHERE TrolleyID = @TrolleyID
      `);

    return result.recordset[0];
  },

  create: async ({ qrCode, status = "Available", storeId }) => {
    const conn = await pool;

    const result = await conn.request()
      .input("QRCode", sql.NVarChar(300), qrCode)
      .input("Status", sql.NVarChar(20), status)
      .input("StoreID", sql.Int, storeId)
      .query(`
        INSERT INTO Trolley (QRCodeData, Status, StoreID)
        VALUES (@QRCode, @Status, @StoreID)
      `);

    return result.rowsAffected[0];
  },

  
  update: async (id, { qrCode, status, storeId }) => {
    const conn = await pool;

    const result = await conn.request()
      .input("TrolleyID", sql.Int, id)
      .input("QRCode", sql.NVarChar(300), qrCode)
      .input("Status", sql.NVarChar(20), status)
      .input("StoreID", sql.Int, storeId)
      .query(`
        UPDATE Trolley
        SET QRCodeData = @QRCode,
            Status = @Status,
            StoreID = @StoreID
        WHERE TrolleyID = @TrolleyID
      `);

    return result.rowsAffected[0];
  },

  
  remove: async (id) => {
    const conn = await pool;

    const result = await conn.request()
      .input("TrolleyID", sql.Int, id)
      .query(`
        DELETE FROM Trolley
        WHERE TrolleyID = @TrolleyID
      `);

    return result.rowsAffected[0];
  },

  
  assignByQRCode: async ({ qrCode, customerId }) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      const trolleyRes = await tx.request()
        .input("QRCode", sql.NVarChar(300), qrCode)
        .query(`
          SELECT * FROM Trolley
          WHERE QRCodeData = @QRCode AND Status = 'Available'
        `);

      if (trolleyRes.recordset.length === 0)
        throw new Error("Trolley not available");

      const trolley = trolleyRes.recordset[0];

      await tx.request()
        .input("TrolleyID", sql.Int, trolley.TrolleyID)
        .query(`
          UPDATE Trolley
          SET Status = 'InUse'
          WHERE TrolleyID = @TrolleyID
        `);

      await tx.commit();
      return trolley;

    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  
  release: async (trolleyId) => {
    const conn = await pool;

    const result = await conn.request()
      .input("TrolleyID", sql.Int, trolleyId)
      .query(`
        UPDATE Trolley
        SET Status = 'Available'
        WHERE TrolleyID = @TrolleyID
      `);

    return result.rowsAffected[0];
  }
};
