// src/services/paymentService.js
import { pool, sql } from "../database/db.js";

export const PaymentService = {
  createRequest: async (data) => {
    const connection = await pool;
    const result = await connection.request()
      .input("CustomerID", sql.Int, data.customerId)
      .input("OrderID", sql.Int, data.orderId)
      .input("Amount", sql.Decimal(10,2), data.amount)
      .query(`
        INSERT INTO PaymentRequest (CustomerID, OrderID, Amount, Status)
        VALUES (@CustomerID, @OrderID, @Amount, 'Pending');
        SELECT SCOPE_IDENTITY() AS PaymentID;
      `);
    return result.recordset[0]?.PaymentID ?? null;
  },

  listPending: async () => {
    const connection = await pool;
    const result = await connection.request().query(`SELECT * FROM PaymentRequest WHERE Status='Pending' ORDER BY RequestedAt DESC`);
    return result.recordset;
  },

  updateStatus: async (id, status) => {
    const connection = await pool;
    const result = await connection.request().input("PaymentID", sql.Int, id).input("Status", sql.NVarChar(50), status)
      .query(`UPDATE PaymentRequest SET Status=@Status WHERE PaymentID=@PaymentID`);
    return result.rowsAffected[0];
  }
};
