// src/services/trolleyService.js
import { pool, sql } from "../database/db.js";

export const TrolleyService = {

  assignByQRCode: async ({ qrCode, customerId }) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      const trolleyRes = await tx.request()
        .input("QRCode", sql.NVarChar(300), qrCode)
        .query(`
          SELECT * FROM Trolley 
          WHERE QRCode=@QRCode AND Status='Available'
        `);

      if (trolleyRes.recordset.length === 0)
        throw new Error("Trolley not available");

      const trolley = trolleyRes.recordset[0];

      await tx.request()
        .input("TrolleyID", sql.Int, trolley.TrolleyID)
        .query(`UPDATE Trolley SET Status='InUse' WHERE TrolleyID=@TrolleyID`);

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
        UPDATE Trolley SET Status='Available'
        WHERE TrolleyID=@TrolleyID
      `);

    return result.rowsAffected[0];
  }
};
